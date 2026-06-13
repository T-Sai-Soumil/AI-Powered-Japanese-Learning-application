import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

print("ROOT =", ROOT)
print("sys.path[0] =", sys.path[0])

import streamlit as st
from typing import Dict
import json
from collections import Counter
import re

from backend.chat import BedrockChat
from backend.get_transcript import YouTubeTranscriptDownloader
from backend.vector_store import QuestionVectorStore
from backend.question_generator import QuestionGenerator


# Page config
st.set_page_config(
    page_title="Japanese Learning Assistant",
    page_icon="🎌",
    layout="wide"
)

# Initialize session state
if 'transcript' not in st.session_state:
    st.session_state.transcript = None
if 'messages' not in st.session_state:
    st.session_state.messages = []

def render_header():
    """Render the header section"""
    st.title("🎌 Japanese Learning Assistant")
    st.markdown("""
    Transform YouTube transcripts into interactive Japanese learning experiences.
    
    This tool demonstrates:
    - Base LLM Capabilities
    - RAG (Retrieval Augmented Generation)
    - Amazon Bedrock Integration
    - Agent-based Learning Systems
    """)

def render_sidebar():
    """Render the sidebar with component selection"""
    with st.sidebar:
        st.header("Development Stages")
        
        # Main component selection
        selected_stage = st.radio(
            "Select Stage:",
            [
                "1. Chat with Nova",
                "2. Raw Transcript",
                "3. Structured Data",
                "4. RAG Implementation",
                "5. Interactive Learning"
            ]
        )
        
        # Stage descriptions
        stage_info = {
            "1. Chat with Nova": """
            **Current Focus:**
            - Basic Japanese learning
            - Understanding LLM capabilities
            - Identifying limitations
            """,
            
            "2. Raw Transcript": """
            **Current Focus:**
            - YouTube transcript download
            - Raw text visualization
            - Initial data examination
            """,
            
            "3. Structured Data": """
            **Current Focus:**
            - Text cleaning
            - Dialogue extraction
            - Data structuring
            """,
            
            "4. RAG Implementation": """
            **Current Focus:**
            - Bedrock embeddings
            - Vector storage
            - Context retrieval
            """,
            
            "5. Interactive Learning": """
            **Current Focus:**
            - Scenario generation
            - Audio synthesis
            - Interactive practice
            """
        }
        
        st.markdown("---")
        st.markdown(stage_info[selected_stage])
        
        return selected_stage

def render_chat_stage():
    """Render an improved chat interface"""
    st.header("Chat with Nova")

    # Initialize BedrockChat instance if not in session state
    if 'bedrock_chat' not in st.session_state:
        st.session_state.bedrock_chat = BedrockChat()

    # Introduction text
    st.markdown("""
    Start by exploring Nova's base Japanese language capabilities. Try asking questions about Japanese grammar, 
    vocabulary, or cultural aspects.
    """)

    # Initialize chat history if not exists
    if "messages" not in st.session_state:
        st.session_state.messages = []

    # Display chat messages
    for message in st.session_state.messages:
        with st.chat_message(message["role"], avatar="🧑‍💻" if message["role"] == "user" else "🤖"):
            st.markdown(message["content"])

    # Chat input area
    if prompt := st.chat_input("Ask about Japanese language..."):
        # Process the user input
        process_message(prompt)

    # Example questions in sidebar
    with st.sidebar:
        st.markdown("### Try These Examples")
        example_questions = [
            "How do I say 'Where is the train station?' in Japanese?",
            "Explain the difference between は and が",
            "What's the polite form of 食べる?",
            "How do I count objects in Japanese?",
            "What's the difference between こんにちは and こんばんは?",
            "How do I ask for directions politely?"
        ]
        
        for q in example_questions:
            if st.button(q, use_container_width=True, type="secondary"):
                # Process the example question
                process_message(q)
                st.rerun()

    # Add a clear chat button
    if st.session_state.messages:
        if st.button("Clear Chat", type="primary"):
            st.session_state.messages = []
            st.rerun()

def process_message(message: str):
    """Process a message and generate a response"""
    # Add user message to state and display
    st.session_state.messages.append({"role": "user", "content": message})
    with st.chat_message("user", avatar="🧑‍💻"):
        st.markdown(message)

    # Generate and display assistant's response
    with st.chat_message("assistant", avatar="🤖"):
        response = st.session_state.bedrock_chat.generate_response(message)
        if response:
            st.markdown(response)
            st.session_state.messages.append({"role": "assistant", "content": response})



def count_characters(text):
    """Count Japanese and total characters in text"""
    if not text:
        return 0, 0
        
    def is_japanese(char):
        return any([
            '\u4e00' <= char <= '\u9fff',  # Kanji
            '\u3040' <= char <= '\u309f',  # Hiragana
            '\u30a0' <= char <= '\u30ff',  # Katakana
        ])
    
    jp_chars = sum(1 for char in text if is_japanese(char))
    return jp_chars, len(text)

def render_transcript_stage():
    """Render the raw transcript stage"""
    st.header("Raw Transcript Processing")
    
    # URL input
    url = st.text_input(
        "YouTube URL",
        placeholder="Enter a Japanese lesson YouTube URL"
    )
    
    # Download button and processing
    if url:
        if st.button("Download Transcript"):
            try:
                downloader = YouTubeTranscriptDownloader()
                transcript = downloader.get_transcript(url)
                if transcript:
                    # Store the raw transcript text in session state
                    transcript_text = "\n".join([entry['text'] for entry in transcript])
                    st.session_state.transcript = transcript_text
                    st.success("Transcript downloaded successfully!")
                else:
                    st.error("No transcript found for this video.")
            except Exception as e:
                st.error(f"Error downloading transcript: {str(e)}")

    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("Raw Transcript")
        if st.session_state.transcript:
            st.text_area(
                label="Raw text",
                value=st.session_state.transcript,
                height=400,
                disabled=True
            )
    
        else:
            st.info("No transcript loaded yet")
    
    with col2:
        st.subheader("Transcript Stats")
        if st.session_state.transcript:
            # Calculate stats
            jp_chars, total_chars = count_characters(st.session_state.transcript)
            total_lines = len(st.session_state.transcript.split('\n'))
            
            # Display stats
            st.metric("Total Characters", total_chars)
            st.metric("Japanese Characters", jp_chars)
            st.metric("Total Lines", total_lines)
        else:
            st.info("Load a transcript to see statistics")

def render_structured_stage():
    """Render the structured data stage"""
    st.header("Structured Data Processing")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("Dialogue Extraction")
        # Placeholder for dialogue processing
        st.info("Dialogue extraction will be implemented here")
        
    with col2:
        st.subheader("Data Structure")
        # Placeholder for structured data view
        st.info("Structured data view will be implemented here")

def render_rag_stage():
    """Render the RAG implementation stage"""
    st.header("RAG System")
    
    # Query input
    query = st.text_input(
        "Test Query",
        placeholder="Enter a question about Japanese..."
    )
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("Retrieved Context")
        # Placeholder for retrieved contexts
        st.info("Retrieved contexts will appear here")
        
    with col2:
        st.subheader("Generated Response")
        # Placeholder for LLM response
        st.info("Generated response will appear here")

def render_interactive_stage():
    """Render the interactive learning stage using Vector Store and Hugging Face RAG"""
    st.header("Interactive Learning")
    
    # Initialize instances in session state
    if 'vector_store' not in st.session_state:
        try:
            st.session_state.vector_store = QuestionVectorStore()
        except Exception as e:
            st.error(f"Could not connect to Vector Store: {e}")
            return
            
    if 'question_generator' not in st.session_state:
        try:
            st.session_state.question_generator = QuestionGenerator()
        except Exception as e:
            st.error(f"Could not initialize Question Generator: {e}")
            return
            
    st.markdown("Enter a scenario you'd like to practice. The system will retrieve real JLPT N5 questions matching your topic from the vector database, and use them to dynamically generate a brand new question for you!")
    
    topic = st.text_input(
        "What scenario do you want to practice?",
        placeholder="e.g., Ordering food at a bakery, Buying a train ticket"
    )
    
    if st.button("Generate Practice", type="primary") and topic:
        with st.spinner("Searching vector database for similar questions..."):
            # 1. Retrieve similar questions
            results = st.session_state.vector_store.search_similar_questions(topic, n_results=3)
            reference_texts = results['documents'][0] if results and results['documents'] else []
            
        if not reference_texts:
            st.error("No reference questions found in the vector store. Make sure you ingested the transcripts first!")
            return
            
        with st.spinner("Generating new scenario using Hugging Face RAG..."):
            # 2. Generate derivative question
            new_question = st.session_state.question_generator.generate_derivative_question(topic, reference_texts)
            if new_question:
                st.session_state.current_practice = new_question
            else:
                st.error("Failed to generate question from the LLM.")
                return

    # Display the generated practice if it exists in session state
    if 'current_practice' in st.session_state and st.session_state.current_practice:
        practice = st.session_state.current_practice
        
        st.markdown("---")
        
        col1, col2 = st.columns([2, 1])
        
        with col1:
            st.subheader("Practice Scenario")
            st.info(f"**Introduction:**\n{practice.get('Introduction', '')}")
            
            st.markdown("**Conversation/Details:**")
            st.code(practice.get('conversation', ''), language="text")
            
            st.markdown(f"**Question:** {practice.get('question', '')}")
            
            options = practice.get('options', [])
            if options:
                selected = st.radio("Choose your answer:", options, index=None)
                
                if selected is not None:
                    if st.button("Check Answer", type="primary"):
                        correct_answer = practice.get('correct_answer', '').strip()
                        explanation = practice.get('explanation', '')
                        
                        try:
                            selected_index = str(options.index(selected) + 1)
                            if correct_answer and selected_index == correct_answer:
                                st.success("✨ Correct! Great job!")
                            elif correct_answer:
                                st.error(f"❌ Incorrect. The correct answer was option {correct_answer}.")
                            else:
                                st.warning("Hmm, the AI forgot to provide the correct answer key for this question!")
                                
                            if explanation:
                                st.info(f"**Explanation:**\n{explanation}")
                        except ValueError:
                            pass
            else:
                st.warning("No options were generated for this question.")
                
        with col2:
            st.subheader("Audio")
            st.info("Audio synthesis (TTS) will be implemented in a future update.")
            
            st.subheader("Reference Data")
            st.caption("This question was generated using RAG based on the vector store.")

def main():
    render_header()
    selected_stage = render_sidebar()
    
    # Render appropriate stage
    if selected_stage == "1. Chat with Nova":
        render_chat_stage()
    elif selected_stage == "2. Raw Transcript":
        render_transcript_stage()
    elif selected_stage == "3. Structured Data":
        render_structured_stage()
    elif selected_stage == "4. RAG Implementation":
        render_rag_stage()
    elif selected_stage == "5. Interactive Learning":
        render_interactive_stage()
    
    # Debug section at the bottom
    with st.expander("Debug Information"):
        debug_data = {
            "selected_stage": selected_stage,
            "transcript_loaded": st.session_state.transcript is not None,
            "chat_messages": len(st.session_state.messages)
        }
        if 'current_practice' in st.session_state and st.session_state.current_practice:
            debug_data['raw_llm_output'] = st.session_state.current_practice.get('raw_output', '')
            debug_data['parsed_correct_answer'] = st.session_state.current_practice.get('correct_answer', '')
            debug_data['parsed_explanation'] = st.session_state.current_practice.get('explanation', '')
            
        st.json(debug_data)

if __name__ == "__main__":
    main()