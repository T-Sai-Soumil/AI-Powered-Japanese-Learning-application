import json
import re
import os
from tools.search_web import search_web
from tools.get_page_content import get_page_content
from tools.extract_vocabulary import extract_vocabulary
from database import save_song_and_vocab

def run_agent(message_request: str) -> dict:
    print(f"Starting linear pipeline for: {message_request}")
    
    # 1. Advanced Search Query
    query = f"{message_request} kanji romaji english lyrics"
    print(f"Searching for: {query}")
    search_results = search_web(query, max_results=3)
    
    if not search_results:
        return {"lyrics": "No search results found.", "vocabulary": []}
        
    # 2. Python Pre-Screening
    best_content = ""
    max_japanese_chars = -1
    
    # Regex to match Japanese characters (Hiragana, Katakana, Kanji)
    jp_pattern = re.compile(r'[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]')
    
    for result in search_results:
        url = result.get('href', '')
        if not url:
            continue
            
        print(f"Checking content from: {url}")
        # Tavily already bypassed cloudflare and gave us the raw content!
        content = result.get('raw_content', '')
        if not content:
            content = result.get('body', '')
        
        # Count Japanese characters
        jp_chars = len(jp_pattern.findall(content))
        print(f"Found {jp_chars} Japanese characters in {url}")
        
        if jp_chars > max_japanese_chars:
            max_japanese_chars = jp_chars
            best_content = content
            
    if not best_content or max_japanese_chars < 10:
        return {"lyrics": "Could not find a webpage with sufficient Japanese lyrics.", "vocabulary": []}
        
    print("Extracting lyrics and vocabulary using Mistral...")
    # 3. Extraction
    result = extract_vocabulary(best_content)
    
    # 4. Storage
    if "lyrics" in result and "vocabulary" in result:
        lyrics_to_save = result["lyrics"]
        if isinstance(lyrics_to_save, (dict, list)):
            lyrics_to_save = json.dumps(lyrics_to_save, ensure_ascii=False, indent=2)
            
        save_song_and_vocab(message_request, lyrics_to_save, result["vocabulary"])
        
        os.makedirs("output", exist_ok=True)
        safe_name = "".join(c if c.isalnum() else "_" for c in message_request)
        
        with open(f"output/{safe_name}_lyrics.txt", "w", encoding="utf-8") as lf:
            lf.write(lyrics_to_save)
            
        with open(f"output/{safe_name}_vocab.json", "w", encoding="utf-8") as vf:
            json.dump(result["vocabulary"], vf, ensure_ascii=False, indent=2)
            
    print("Pipeline finished successfully.")
    return result

if __name__ == "__main__":
    print(run_agent("Yoru ni Kakeru by YOASOBI"))
