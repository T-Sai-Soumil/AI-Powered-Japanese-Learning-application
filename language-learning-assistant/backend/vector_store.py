import os
import glob
import chromadb
from chromadb.utils import embedding_functions

# We use paraphrase-multilingual-MiniLM-L12-v2 as it natively handles 
# both English and Japanese semantics without requiring special prompt prefixes.
EMBEDDING_MODEL = "paraphrase-multilingual-MiniLM-L12-v2"

class QuestionVectorStore:
    def __init__(self, db_dir="chroma_db", collection_name="jlpt_n5_questions"):
        # Resolve path relative to this script
        base_dir = os.path.dirname(os.path.abspath(__file__))
        self.db_path = os.path.join(base_dir, db_dir)
        
        # Initialize persistent Chroma client
        self.client = chromadb.PersistentClient(path=self.db_path)
        
        # Initialize the multilingual embedding function
        self.embedding_fn = embedding_functions.SentenceTransformerEmbeddingFunction(model_name=EMBEDDING_MODEL)
        
        # Get or create the collection
        self.collection = self.client.get_or_create_collection(
            name=collection_name,
            embedding_function=self.embedding_fn
        )

    def ingest_transcript_files(self, transcripts_dir="transcripts"):
        """Reads generated _structured_hf_*.txt files and ingests them into the vector store."""
        base_dir = os.path.dirname(os.path.abspath(__file__))
        target_dir = os.path.join(base_dir, transcripts_dir)
        
        file_pattern = os.path.join(target_dir, "*_structured_hf_問題*.txt")
        files = glob.glob(file_pattern)
        
        if not files:
            print(f"No structured question files found matching {file_pattern}")
            return 0
            
        total_ingested = 0
        
        for file_path in files:
            print(f"Processing {os.path.basename(file_path)}...")
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # Parse header metadata
            section_name = "Unknown"
            requires_image = False
            
            lines = content.split('\n')
            for line in lines:
                if line.startswith("=== Start of"):
                    section_name = line.replace("=== Start of ", "").replace(" ===", "").strip()
                if "画像が必要:" in line:
                    requires_image = "はい" in line
            
            # Find the first "Introduction:" to skip the header entirely
            first_q_idx = content.find("Introduction:")
            if first_q_idx == -1:
                print(f"No questions found in {file_path}")
                continue
                
            questions_text = content[first_q_idx:]
            
            # Remove the footer "=== End of ..."
            end_idx = questions_text.find("=== End of")
            if end_idx != -1:
                questions_text = questions_text[:end_idx]
                
            # Split blocks by the dash separator
            blocks = [b.strip() for b in questions_text.split("-----") if b.strip()]
            
            documents = []
            metadatas = []
            ids = []
            
            for idx, block in enumerate(blocks):
                doc_id = f"{os.path.basename(file_path)}_{idx}"
                documents.append(block)
                metadatas.append({
                    "section": section_name,
                    "requires_image": requires_image,
                    "source_file": os.path.basename(file_path)
                })
                ids.append(doc_id)
                
            if documents:
                # Upsert into ChromaDB (adds new or updates existing based on ID)
                self.collection.upsert(
                    documents=documents,
                    metadatas=metadatas,
                    ids=ids
                )
                total_ingested += len(documents)
                print(f"Ingested {len(documents)} questions from {section_name}")
                
        return total_ingested
        
    def search_similar_questions(self, query: str, n_results: int = 3, requires_image: bool = None):
        """
        Searches the vector store for questions similar to the query.
        Optionally filter by whether the question requires an image.
        """
        where_filter = None
        if requires_image is not None:
            where_filter = {"requires_image": requires_image}
            
        results = self.collection.query(
            query_texts=[query],
            n_results=n_results,
            where=where_filter
        )
        
        return results

if __name__ == "__main__":
    # Test execution
    print("Initializing Vector Store... (This may download the embedding model on first run)")
    store = QuestionVectorStore()
    
    print("\nIngesting files...")
    count = store.ingest_transcript_files()
    print(f"\nTotal questions ingested into vector store: {count}")
    
    if count > 0:
        test_query = "Ordering food or drinks in a restaurant or cafe"
        print(f"\nTesting Semantic Search for: '{test_query}'")
        
        # We can test searching purely for text-based questions (no image required)
        results = store.search_similar_questions(test_query, n_results=2, requires_image=False)
        
        print("\nTop Matches (Filtered for Requires Image = False):")
        for i, (doc, meta, dist) in enumerate(zip(results['documents'][0], results['metadatas'][0], results['distances'][0])):
            print(f"\nMatch {i+1} (Distance: {dist:.4f}) - {meta['section']}")
            print("-" * 40)
            print(doc)
            print("-" * 40)
