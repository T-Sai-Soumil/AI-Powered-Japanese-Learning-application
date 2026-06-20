from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from agent import run_agent

app = FastAPI(title="Song Vocab Agent API")

class AgentRequest(BaseModel):
    message_request: str

class KanjiPart(BaseModel):
    kanji: str
    romaji: List[str]

class VocabularyItem(BaseModel):
    kanji: str
    romaji: str
    english: str
    parts: List[KanjiPart]

class AgentResponse(BaseModel):
    lyrics: str
    vocabulary: List[VocabularyItem]

@app.post("/api/agent", response_model=AgentResponse)
def get_lyrics_and_vocabulary(request: AgentRequest):
    try:
        # Run the ReAct agent
        result = run_agent(request.message_request)
        
        # Expecting result to be a dictionary with 'lyrics' and 'vocabulary'
        return AgentResponse(
            lyrics=result.get("lyrics", ""),
            vocabulary=result.get("vocabulary", [])
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
