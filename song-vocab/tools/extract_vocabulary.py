import instructor
from pydantic import BaseModel, Field, field_validator
from typing import List, Union

class KanjiPart(BaseModel):
    kanji: str
    romaji: Union[List[str], str]

    @field_validator('romaji', mode='before')
    @classmethod
    def coerce_romaji_to_list(cls, v):
        if isinstance(v, str):
            return [v]
        return v

class VocabularyItem(BaseModel):
    kanji: str = Field(description="The Japanese word or phrase in kanji/kana.")
    romaji: str = Field(description="The romaji reading of the word.")
    english: str = Field(description="The English meaning of the word.")
    parts: List[KanjiPart] = Field(description="Breakdown of the word into kanji/kana characters and their respective romaji readings.")

class ExtractionResult(BaseModel):
    lyrics: str = Field(description="The extracted Japanese lyrics.")
    vocabulary: List[VocabularyItem] = Field(description="A list of vocabulary words extracted from the lyrics.")

def extract_vocabulary(text: str) -> dict:
    """
    Uses Ollama and Instructor to extract lyrics and vocabulary from raw text.
    """
    # Create the instructor-patched Ollama client
    # Note: instructor supports ollama but requires specific setup or just openai client pointing to ollama
    # Using instructor with OpenAI client pointing to local Ollama is the most robust way right now.
    from openai import OpenAI
    
    client = instructor.from_openai(
        OpenAI(
            base_url="http://localhost:11434/v1",
            api_key="ollama",  # required, but unused
        ),
        mode=instructor.Mode.JSON,
    )

    prompt = f"""
    You are an expert Japanese linguist. Extract the Japanese lyrics from the following text, and then provide a list of important vocabulary words from those lyrics along with their reading and meaning.
    
    CRITICAL: Follow this exact JSON formatting structure for each vocabulary word. Notice how 'parts' break down the word into individual kanji/kana and their specific romaji readings:
    [
      {{
        "kanji": "面白い",
        "romaji": "omoshiroi",
        "english": "interesting",
        "parts": [
          {{ "kanji": "面", "romaji": ["o", "mo"] }},
          {{ "kanji": "白", "romaji": ["shi", "ro"] }},
          {{ "kanji": "い", "romaji": ["i"] }}
        ]
      }}
    ]
    
    Text:
    {text}
    """

    try:
        resp = client.chat.completions.create(
            model="mistral",
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            response_model=ExtractionResult,
        )
        return resp.model_dump()
    except Exception as e:
        print(f"Error extracting vocabulary: {e}")
        return {"lyrics": "", "vocabulary": []}

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        text = sys.argv[1]
        print(extract_vocabulary(text))
