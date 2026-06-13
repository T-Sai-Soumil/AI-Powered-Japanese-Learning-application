import os
import requests
import re
from typing import List, Dict, Optional

MODEL_ID = "Qwen/Qwen2.5-7B-Instruct"

class QuestionGenerator:
    def __init__(self, model_id: str = MODEL_ID):
        self.model_id = model_id
        self.api_token = self._load_api_token()
        self.api_url = "https://router.huggingface.co/v1/chat/completions"

    def _load_api_token(self) -> str:
        """Loads Hugging Face API token from environment variables or .env file"""
        token = os.getenv("HUGGINGFACEHUB_API_TOKEN")
        if token:
            return token
            
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        env_path = os.path.join(base_dir, ".env")
        
        if os.path.exists(env_path):
            try:
                with open(env_path, 'r', encoding='utf-8') as f:
                    for line in f:
                        if "HUGGINGFACEHUB_API_TOKEN" in line:
                            parts = line.strip().split("=")
                            if len(parts) >= 2:
                                val = parts[1].strip().strip('"').strip("'")
                                if val:
                                    return val
            except Exception:
                pass
                
        raise ValueError("Hugging Face API token not found in environment or .env file. Please set HUGGINGFACEHUB_API_TOKEN.")

    def generate_derivative_question(self, topic: str, reference_texts: List[str]) -> Optional[Dict[str, str]]:
        """
        Takes a topic and a list of reference JLPT questions, 
        and generates a brand new question using Hugging Face LLM.
        """
        
        references_formatted = "\n\n".join([f"--- Example {i+1} ---\n{text}" for i, text in enumerate(reference_texts)])
        
        prompt = f"""You are an expert Japanese teacher. Generate a completely new JLPT N5 listening practice question based on the user's requested topic: '{topic}'

Here are {len(reference_texts)} real examples of the format and difficulty you must EXACTLY match:
{references_formatted}

CRITICAL INSTRUCTIONS:
1. Generate ONE completely new question about the topic '{topic}'. Do not just copy the examples.
2. The difficulty must be exactly JLPT N5 level (simple vocabulary, basic grammar).
3. ALL generated content (setup, dialogue, question, options) MUST be strictly in Japanese.
4. The response MUST strictly follow this exact format with these exact labels:

Introduction: [The situation setup in Japanese]
conversation: [The dialogue or monologue in Japanese. ALWAYS use Japanese kanji for speaker prefixes, strictly '男：' or '女：' or '店員：' etc. Do NOT use English names like 'female passenger'.]
question: [The specific question asked at the end in Japanese]
options:
1: [Option 1]
2: [Option 2]
3: [Option 3]
4: [Option 4]
correct_answer: [Just the number of the correct option, e.g. 1, 2, 3, or 4]
explanation: [A brief explanation in English of why that is the correct answer based on the dialogue]

Do NOT output any markdown blocks, greetings, or extra text. ONLY the formatted text.
"""

        headers = {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.model_id,
            "messages": [
                {"role": "system", "content": "You are a helpful Japanese language learning assistant. Always reply strictly in the requested format. ALL generated text, including speaker labels, MUST be entirely in Japanese (no English except for the system labels like 'Introduction:', 'explanation:', etc.)."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.7,  # Slightly creative to ensure new scenarios
            "max_tokens": 1000
        }
        
        try:
            response = requests.post(self.api_url, headers=headers, json=payload, timeout=60)
            if response.status_code == 200:
                result = response.json()
                output_text = result["choices"][0]["message"]["content"].strip()
                return self._parse_output(output_text)
            else:
                print(f"Error generating question: {response.text}")
                return None
        except Exception as e:
            print(f"Exception during question generation: {e}")
            return None

    def _parse_output(self, text: str) -> Dict[str, str]:
        """Parses the LLM output text into a structured dictionary"""
        parsed = {
            "Introduction": "",
            "conversation": "",
            "question": "",
            "options": [],
            "correct_answer": "",
            "explanation": "",
            "raw_output": text
        }
        
        current_key = None
        options_list = []
        
        for line in text.split('\n'):
            line = line.strip()
            # Strip markdown bold or headers
            clean_line = line.lstrip('*').lstrip('#').strip()
            
            if not clean_line:
                continue
                
            if clean_line.lower().startswith("introduction:"):
                current_key = "Introduction"
                parsed["Introduction"] = clean_line.split(":", 1)[1].strip()
            elif clean_line.lower().startswith("conversation:"):
                current_key = "conversation"
                parsed["conversation"] = clean_line.split(":", 1)[1].strip()
            elif clean_line.lower().startswith("question:"):
                current_key = "question"
                parsed["question"] = clean_line.split(":", 1)[1].strip()
            elif clean_line.lower().startswith("options:"):
                current_key = "options"
            elif clean_line.lower().startswith("correct_answer:") or clean_line.lower().startswith("correct answer:"):
                current_key = "correct_answer"
                parsed["correct_answer"] = clean_line.split(":", 1)[1].strip().strip('*').strip()
            elif clean_line.lower().startswith("explanation:"):
                current_key = "explanation"
                parsed["explanation"] = clean_line.split(":", 1)[1].strip()
            elif current_key == "conversation":
                parsed["conversation"] += f"\n{line}"
            elif current_key == "explanation":
                parsed["explanation"] += f"\n{line}"
            elif current_key == "options" and re.match(r'^\d+:', line):
                options_list.append(line.split(":", 1)[1].strip())
        
        # If options weren't explicitly found in 'options:' block, try to extract them if they are in conversation block
        if not options_list and "1:" in parsed["conversation"]:
            lines = parsed["conversation"].split('\n')
            new_conv = []
            for l in lines:
                if re.match(r'^\d+:', l.strip()):
                    options_list.append(l.strip().split(":", 1)[1].strip())
                else:
                    new_conv.append(l)
            parsed["conversation"] = "\n".join(new_conv)
            
        parsed["options"] = options_list
        return parsed
