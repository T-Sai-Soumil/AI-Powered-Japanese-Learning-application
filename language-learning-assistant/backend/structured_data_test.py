import os
import sys
import requests
from typing import Optional

# Set terminal stdout encoding to UTF-8 to prevent encoding errors on Japanese characters
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# We use Qwen2.5-7B-Instruct as it is free and performs exceptionally well on Japanese text
MODEL_ID = "Qwen/Qwen2.5-7B-Instruct"

class HuggingFaceTranscriptStructurer:
    def __init__(self, model_id: str = MODEL_ID):
        self.model_id = model_id
        self.api_token = self._load_api_token()
        self.api_url = "https://router.huggingface.co/v1/chat/completions"

    def _load_api_token(self) -> str:
        """Loads Hugging Face API token from environment variables or .env files"""
        # 1. Try env var
        token = os.getenv("HUGGINGFACEHUB_API_TOKEN")
        if token:
            return token

        # 2. List of potential paths to look for the token
        env_paths = [
            ".env",
            "../.env",
            # Windows Desktop path
            "C:/Users/HP/Desktop/Langchain_sessions/.env",
            # WSL path to Desktop folder
            "/mnt/c/Users/HP/Desktop/Langchain_sessions/.env"
        ]
        
        for path in env_paths:
            if os.path.exists(path):
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        for line in f:
                            if "HUGGINGFACEHUB_API_TOKEN" in line:
                                parts = line.strip().split("=")
                                if len(parts) >= 2:
                                    val = parts[1].strip().strip('"').strip("'")
                                    if val:
                                        return val
                except Exception:
                    pass

        # Fallback to the token retrieved from your Desktop workspace
        return "API_KEY_PLACEHOLDER"

    def structure_transcript(self, transcript_text: str) -> Optional[str]:
        """
        Structure the transcript into questions using a free Hugging Face model.
        Splits the transcript into sections internally and uses a unified instruction prompt.
        """
        # Locate sections: 問題1, 問題2, 問題3, 問題4
        markers = ["問題1", "問題2", "問題3", "問題4"]
        indices = {}
        for marker in markers:
            idx = transcript_text.find(marker)
            if idx == -1:
                indices[marker] = None
            else:
                indices[marker] = idx

        # Split text into sections based on found indices
        sections = {}
        
        # Problem 1: from 問題1 to 問題2
        if indices["問題1"] is not None:
            end_idx = indices["問題2"] if indices["問題2"] is not None else len(transcript_text)
            sections["問題1"] = transcript_text[indices["問題1"]:end_idx]

        # Problem 2: from 問題2 to 問題3
        if indices["問題2"] is not None:
            end_idx = indices["問題3"] if indices["問題3"] is not None else len(transcript_text)
            sections["問題2"] = transcript_text[indices["問題2"]:end_idx]

        # Problem 3: from 問題3 to 問題4
        if indices["問題3"] is not None:
            end_idx = indices["問題4"] if indices["問題4"] is not None else len(transcript_text)
            sections["問題3"] = transcript_text[indices["問題3"]:end_idx]

        # Problem 4: from 問題4 to end
        if indices["問題4"] is not None:
            sections["問題4"] = transcript_text[indices["問題4"]:]

        # If no markers were found, fall back to processing the entire text as a single block
        if not sections:
            sections["Full Transcript"] = transcript_text

        headers = {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json"
        }

        aggregated_output = []

        # Unified prompt for all sections to prevent model confusion and hallucinations
        prompt_template = """You are an expert Japanese language learning assistant. Your task is to analyze a raw transcript of a JLPT N5 listening practice test section and extract ALL the questions (including example questions) in a clean, structured text format.

CRITICAL INSTRUCTIONS:
1. ONLY extract information directly present in the provided transcript text.
2. DO NOT invent, hallucinate, or generate any questions, names, or choices that are not in the transcript.
3. Extract EVERY SINGLE question present in the transcript section (e.g., 例, 1番, 2番, 3番, 4番, 5番, 6番, 7番, etc.). Do not skip any question or stop early.
4. Every question block must strictly follow this exact format:
Introduction: [scenario setup / question introduction]
conversation: [dialogue text, monologue speech, OR multiple choice options if there is no dialogue]
question: [the question asked]
5. Separate different questions with a line of five dashes: `-----`.
6. Do not include any greeting, preamble, summary, or markdown formatting (like ```text).

How to handle different question structures:
- If there is a dialogue: Reconstruct the dialogue turns naturally. You may prefix lines with speaker labels (like "男：", "女：") if clear, or just output the dialogue flow.
- If there is a monologue/speech (only one person speaking, e.g. a teacher in a classroom): Output the entire speech/monologue text under 'conversation:'.
- If there is NO dialogue/speech but instead multiple choices (like 1, 2, 3 / example: "1 お疲れ様 2 おやすみなさい 3 また明日"): List these choices line by line under 'conversation:'.
- If the question is a prompt-response (like "あの方はどなたですか 1 ... 2 ... 3 ..."): Put the prompt under 'Introduction:' and 'question:', and the options under 'conversation:'.

Example Outputs:
Introduction: 例 家で女の人が男の人と話しています。女の人は男の人に何を出しますか。
conversation: 女：今日は寒いですね。温かいものを飲みませんか。
男：ありがとうございます。
女：コーヒー、紅茶、お茶もありますけど。
男：じゃあ、紅茶をお願いします。
女：砂糖やミルクは入れますか。
男：あ、はい。
question: 女の人は男の人に何を出しますか。
-----
Introduction: 1番 寝ます。他の人に何と言いますか。
conversation: 1: お疲れ様
2: おやすみなさい
3: また明日
question: 何と言いますか。

Here is the transcript section to extract:
{section_text}
"""

        for section_name, section_text in sections.items():
            print(f"Processing {section_name} with Hugging Face ({self.model_id})...")
            prompt = prompt_template.format(section_text=section_text)
            
            payload = {
                "model": self.model_id,
                "messages": [
                    {"role": "system", "content": "You are a helpful Japanese language learning assistant. Extract questions exactly as requested, returning only plain text with no extra comments or markdown."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.1,
                "max_tokens": 4000
            }
            
            try:
                response = requests.post(self.api_url, headers=headers, json=payload, timeout=60)
                if response.status_code == 200:
                    result = response.json()
                    output_text = result["choices"][0]["message"]["content"]
                    
                    section_header = f"=== {section_name} ==="
                    aggregated_output.append(section_header)
                    aggregated_output.append(output_text.strip())
                    aggregated_output.append("\n")
                    print(f"Successfully processed {section_name}.")
                else:
                    print(f"Error processing {section_name} (Status {response.status_code}): {response.text}", file=sys.stderr)
                    return None
            except Exception as e:
                print(f"Error processing {section_name}: {str(e)}", file=sys.stderr)
                return None

        return "\n".join(aggregated_output) if aggregated_output else None

    def save_questions(self, structured_text: str, filename: str) -> bool:
        """Save the structured questions text to a file"""
        try:
            os.makedirs(os.path.dirname(os.path.abspath(filename)), exist_ok=True)
            with open(filename, 'w', encoding='utf-8') as f:
                f.write(structured_text)
            print(f"Structured questions successfully saved to {filename}")
            return True
        except Exception as e:
            print(f"Error saving questions to {filename}: {str(e)}", file=sys.stderr)
            return False

if __name__ == "__main__":
    # Base directory resolution
    base_dir = os.path.dirname(os.path.abspath(__file__))
    input_file = os.path.join(base_dir, "transcripts", "sY7L5cfCWno.txt")
    output_file = os.path.join(base_dir, "transcripts", "sY7L5cfCWno_structured_hf.txt")
    
    if os.path.exists(input_file):
        print(f"Reading transcript from {input_file}...")
        with open(input_file, 'r', encoding='utf-8') as f:
            lines = [line.strip() for line in f if line.strip()]
        transcript_text = "".join(lines)
        
        # Initialize and structure
        structurer = HuggingFaceTranscriptStructurer()
        structured_text = structurer.structure_transcript(transcript_text)
        
        if structured_text:
            structurer.save_questions(structured_text, output_file)
            print("\nVerification successful! Structured output file created using free Hugging Face API.")
        else:
            print("\nVerification failed: Extraction returned empty/error.")
    else:
        print(f"Input file {input_file} not found.")
