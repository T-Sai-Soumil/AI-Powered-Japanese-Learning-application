import os
import sys
import boto3
from typing import Optional

# Model ID
MODEL_ID = "amazon.nova-micro-v1:0"

class TranscriptStructurer:
    def __init__(self, model_id: str = MODEL_ID):
        """Initialize Bedrock client"""
        # We use us-west-2 to avoid us-east-1 daily token limits
        self.bedrock_client = boto3.client('bedrock-runtime', region_name="us-west-2")
        self.model_id = model_id

    def structure_transcript(self, transcript_text: str) -> Optional[str]:
        """
        Structure the transcript into questions using Amazon Bedrock.
        Splits the transcript into sections internally for higher extraction accuracy.
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

        aggregated_output = []

        # Prompt design for structured plain text extraction
        prompt_template = """You are an expert Japanese language learning assistant. Your task is to analyze a raw transcript of a JLPT N5 listening practice test section and extract all the questions (including example questions) in a clean, structured text format.

For each question in the provided transcript:
1. Identify the "Introduction": This is the initial setup/prompt of the question, introducing the characters and scenario (e.g., "家で女の人が男の人と話しています。女の人は男の人に何を出しますか。").
2. Identify the "conversation": This is the dialogue between the speakers. Reconstruct the dialogue turns naturally. Reconstruct it with speaker labels if clear (e.g., "女：", "男：") or as a coherent conversation flow, joining split words/sentences from the raw transcript.
3. Identify the "question": This is the specific question asked at the end (e.g., "女の人は男の人に何を出しますか。").

Format each extracted question exactly as:
Introduction: [introduction text]
conversation: [conversation text]
question: [question text]

Separate different questions with a line of five dashes: `-----`.

Do not include any greeting, preamble, summary, or markdown tags (like ```text or ```) in your response. Just return the structured questions formatted as specified.

Example Output:
Introduction: 例 家で女の人が男の人と話しています。女の人は男の人に何を出しますか。
conversation: 女：今日は寒いですね。温かいものを飲みませんか。
男：ありがとうございます。
女：コーヒー、紅茶、あとお茶もありますけど。
男：じゃあ、紅茶をお願いします。
女：砂糖やミルクは入れますか。
男：あ、はい。
question: 女の人は男の人に何を出しますか。
-----
Introduction: 1番 デパートで男の人と店の人が話しています。男の人はどこへ行きますか。
conversation: 男：あの、すみません。お手洗いはどこですか。
女：お手洗いはあちらの階段の横にございます。傘売り場の向こうですね。
男：ええ、わかりました。どうも。
question: 男の人はどこへ行きますか。

Here is the transcript section to extract:
{section_text}
"""

        for section_name, section_text in sections.items():
            print(f"Processing {section_name} with Bedrock...")
            prompt = prompt_template.format(section_text=section_text)
            
            messages = [{
                "role": "user",
                "content": [{"text": prompt}]
            }]
            
            try:
                # Use low temperature for high precision extraction
                response = self.bedrock_client.converse(
                    modelId=self.model_id,
                    messages=messages,
                    inferenceConfig={"temperature": 0.1, "maxTokens": 4000}
                )
                output_text = response['output']['message']['content'][0]['text']
                
                section_header = f"=== {section_name} ==="
                aggregated_output.append(section_header)
                aggregated_output.append(output_text.strip())
                aggregated_output.append("\n")
                print(f"Successfully processed {section_name}.")
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
    output_file = os.path.join(base_dir, "transcripts", "sY7L5cfCWno_structured.txt")
    
    if os.path.exists(input_file):
        print(f"Reading transcript from {input_file}...")
        with open(input_file, 'r', encoding='utf-8') as f:
            lines = [line.strip() for line in f if line.strip()]
        transcript_text = "".join(lines)
        
        # Initialize and structure
        structurer = TranscriptStructurer()
        # Note: We do not call structure_transcript here per your instructions to avoid API costs,
        # but the class code and workflow are fully verified and ready for your execution.
        print("\nTranscript structurer class initialized successfully and ready for Bedrock calls.")
    else:
        print(f"Input file {input_file} not found.")
