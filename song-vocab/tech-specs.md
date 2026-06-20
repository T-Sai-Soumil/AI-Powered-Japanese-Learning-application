# Tech Specs:

## Business Goals:

Imported into our database

## Technical Requirements:

- FastAPI
- Ollama via the Ollama Python SDK
  - Mistral
-Instructor (for structured json output)  
- SQLite3 (for database)  
- duckduckgo-search (to search for lyrics)

## Implementation Details:

### GetLyrics /api/agent

### Behaviour

This endpoint goes to our agent which uses the react framework so that it can go to the internet, find multiple possible versions of the lyrics and then extract out the correct lyrics and format the lyrics into vocabulary

Tools available:
- tools/extract_vocabulary.py
- tools/get_page_sontent.py
- tools/search_web.py

### JSON Request Parameters

`message_request` (str): A string that describes the song and/or artist to get lyrics for a song from the internet

### JSON Response 

`lyrics` (str): The lyrics of the song
`vocabulary` (list): A list of vocabulary words found in the lyrics

