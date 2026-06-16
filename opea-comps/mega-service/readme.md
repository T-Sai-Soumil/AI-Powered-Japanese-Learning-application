# How to run the LLM Service:

We are using Ollama which is being delivered via docker compose.

We can set the port that the LLM will be listening on.

`9000` is ideal when looking at many existing OPEA megaservice default ports.

This will default to `8000` if not set. 

```sh
LLM_ENDPOINT_PORT=9000 docker compose up
```

When Ollama gets started, it doesn't have the model. So we'll need to download the model via the API for Ollama.

# Download(Pull) a model:

```sh
curl http://localhost:9000/api/pull -d '{
  "model": "llama3.2:1b"
}'
```

# How to run the Mega Service Example:

```sh
python app.py
```

# Testing the app(lang-portal)

Install Jq so we can get pretty json output

```sh
sudo apt-get install jq
```
then, 

```sh
curl -X POST http://localhost:8000/v1/example-service \
  -H "Content-Type: application/json" \
  -d '{
    "messages": "Hello, this is a test message"
  }' | jq '.' > output/response.json
``` 

```sh
curl -X POST http://localhost:8000/v1/example-service \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role":"user","content":"Hello, this is a test message"}],
    "model":"llama3.2:1b",
    "max_token": 100,
    "temperature": 0.7
  }' | jq '.' > output/$(date +%s)-response.json 
``` 