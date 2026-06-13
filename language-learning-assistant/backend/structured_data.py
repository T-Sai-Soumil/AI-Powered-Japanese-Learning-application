import os
import sys
import boto3
from typing import Optional
from chat import BedrockChat

# Model ID
MODEL_ID = "amazon.nova-micro-v1:0"

# Japanese formats and descriptions of each JLPT N5 Listening section with image requirements
SECTION_DESCRIPTIONS = {
    "問題1": (
        "画像が必要: はい\n"
        "【課題理解】最初に状況と質問を聞き、その後で対話や独話を聞いて、何をするか、どこに行くかなどの具体的な指示（1〜4）から正しい選択肢を選ぶセクションです。"
    ),
    "問題2": (
        "画像が必要: いいえ\n"
        "【ポイント理解】最初に選択肢を読む時間が与えられます。その後に対話や独話を聞き、理由、時間、場所などの特定の詳細な情報を聞き取って正しい選択肢（1〜4）を選ぶセクションです。"
    ),
    "問題3": (
        "画像が必要: はい\n"
        "【発話表現】矢印が指している人物のイラストを見ながら状況説明を聞き、その場面でその人が言うのに最もふさわしい表現（3つの音声選択肢から1つ）を選ぶセクションです。"
    ),
    "問題4": (
        "画像が必要: いいえ\n"
        "【即時応答】イラストや選択肢の記載はありません。短い発話（質問や挨拶など）を直接聞き、それに対する最も適切な返答を3つの音声選択肢から選ぶセクションです。"
    )
}

class TranscriptStructurer:
    def __init__(self, model_id: str = MODEL_ID):
        """Initialize Bedrock client"""
        # We use us-west-2 to avoid us-east-1 daily token limits
        self.bedrock_client = boto3.client('bedrock-runtime', region_name="us-west-2")
        self.model_id = model_id

    def structure_transcript(self, transcript_text: str) -> Optional[str]:
        """
        Structure the transcript into questions using Amazon Bedrock.
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

        aggregated_output = {}

        for section_name, section_text in sections.items():
            print(f"Processing {section_name} with Bedrock...")
            
            if section_name in ["問題1", "問題2"]:
                prompt_template = """You are an expert Japanese language learning assistant. Your task is to analyze a raw transcript of a JLPT N5 listening practice test section and extract ALL the questions (including example questions) in a clean, structured text format.

CRITICAL INSTRUCTIONS:
1. ONLY extract information directly present in the provided transcript text.
2. DO NOT invent, hallucinate, or generate any questions, names, or choices that are not in the transcript.
3. Extract EVERY SINGLE question present in the transcript section (e.g., 例, 1番, 2番, 3番, 4番, 5番, etc.). Do not skip any question or stop early.
4. DO NOT extract or output answer explanations or answer keys (such as "1番いいものは2番です"). Skip these lines completely.
5. EVERY question block MUST begin with "Introduction: ", followed by the situation.
6. EVERY question block MUST have a "conversation: " line, followed by the dialogue text.
7. EVERY question block MUST have a "question: " line, followed by the question asked.
8. Separate different questions with a line of five dashes: `-----`.
9. Do not include any greeting, preamble, summary, or markdown formatting.

Example Output:
Introduction: 例 家で女の人が男の人と話しています。女の人は男の人に何を出しますか。
conversation: 女：今日は寒いですね。温かいものを飲みませんか。
男：ありがとうございます。
女：コーヒー、紅茶、お茶もありますけど。
男：じゃあ, 紅茶をお願いします。
女：砂糖やミルクは入れますか。
男：あ、はい。
question: 女の人は男の人に何を出しますか。

Here is the transcript section to extract:
{section_text}
"""
            elif section_name == "問題3":
                prompt_template = """You are an expert Japanese language learning assistant. Your task is to analyze a raw transcript of a JLPT N5 listening practice test section and extract ALL the questions (including example questions) in a clean, structured text format.

CRITICAL INSTRUCTIONS:
1. ONLY extract information directly present in the provided transcript text.
2. DO NOT invent, hallucinate, or generate any questions, names, or choices.
3. Extract EVERY SINGLE question present in the transcript section. Do not skip any question or stop early.
4. DO NOT extract or output answer explanations or answer keys. Skip these lines completely.
5. Every question block must strictly follow this exact format:
Introduction: [scenario setup / situation description]
options: [list the 3 spoken choices line-by-line, e.g. "1: ...\n2: ...\n3: ..."]
question: 何と言いますか。
6. Separate different questions with a line of five dashes: `-----`.
7. Do not include any greeting, preamble, summary, or markdown formatting.
8. NEVER include a 'conversation:' field.

Example Output:
Introduction: 1番 寝ます。他の人に何と言いますか。
options:
1: お疲れ様
2: おやすみなさい
3: また明日
question: 何と言いますか。

Here is the transcript section to extract:
{section_text}
"""
            elif section_name == "問題4":
                prompt_template = """You are an expert Japanese language learning assistant. Your task is to analyze a raw transcript of a JLPT N5 listening practice test section and extract ALL the questions (including example questions) in a clean, structured text format.

CRITICAL INSTRUCTIONS:
1. ONLY extract information directly present in the provided transcript text.
2. DO NOT invent, hallucinate, or generate any questions, names, or choices.
3. Extract EVERY SINGLE question present in the transcript section. Do not skip any question or stop early.
4. DO NOT extract or output answer explanations or answer keys. Skip these lines completely.
5. Every question block must strictly follow this exact format:
Introduction: [the spoken prompt or question setup]
options: [list the 3 spoken choices line-by-line]
question: [repeat the spoken prompt or question setup]
6. Separate different questions with a line of five dashes: `-----`.
7. Do not include any greeting, preamble, summary, or markdown formatting.
8. NEVER include a 'conversation:' field.

Example Output:
Introduction: 1番 あの方はどなたですか
options:
1: とても親切な人です
2: いいえ違います
3: 山田先生です
question: 1番 あの方はどなたですか

Here is the transcript section to extract:
{section_text}
"""
            else:
                prompt_template = """You are an expert Japanese language learning assistant. Extract questions following this format:
Introduction: [setup]
conversation: [text]
question: [question]
Separate with `-----`. Text to extract: {section_text}"""

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
                
                # Section formatting with descriptions and start/end markers
                section_header = f"=== Start of {section_name} ===\nDescription:\n{SECTION_DESCRIPTIONS.get(section_name, '')}\n\n"
                section_footer = f"\n=== End of {section_name} ===\n"
                
                aggregated_output[section_name] = section_header + output_text.strip() + section_footer
                print(f"Successfully processed {section_name}.")
            except Exception as e:
                print(f"Error processing {section_name}: {str(e)}", file=sys.stderr)
                return None

        return aggregated_output if aggregated_output else None

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
    output_file_base = os.path.join(base_dir, "transcripts", "sY7L5cfCWno_structured.txt")
    
    if os.path.exists(input_file):
        print(f"Reading transcript from {input_file}...")
        with open(input_file, 'r', encoding='utf-8') as f:
            lines = [line.strip() for line in f if line.strip()]
        transcript_text = "".join(lines)
        
        # Initialize and structure
        structurer = TranscriptStructurer()
        # Note: We do not call structure_transcript here to avoid API costs,
        # but the class code and workflow are fully updated to write separate files if executed.
        # Example execution (commented out):
        # structured_texts = structurer.structure_transcript(transcript_text)
        # if structured_texts:
        #     for section_name, text in structured_texts.items():
        #         section_output_file = output_file_base.replace(".txt", f"_{section_name}.txt")
        #         structurer.save_questions(text, section_output_file)
        
        print("\nTranscript structurer class updated successfully and ready for Bedrock calls.")
    else:
        print(f"Input file {input_file} not found.")
