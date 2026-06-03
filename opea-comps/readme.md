# Running Ollama Third-Party Service:

## Choosing a model:

https://ollama.com/library/gemma4

## Configuration:


export host_ip=$(hostname -I | awk '{print $1}')
export NO_PROXY=localhost
export LLM_ENDPOINT_PORT=9000
export LLM_MODEL_ID="llama3.2:1b"

echo $host_ip
echo $LLM_MODEL_ID

docker compose down
docker compose up

## Ollama API:

Once the Ollama server is running, we can make API calls to the Ollama API:
https://github.com/ollama/ollama/blob/main/docs/api.md

### Download(Pull) a model:

curl http://localhost:9000/api/pull -d '{
  "model": "llama3.2:1b"
}'

### Generate Request:

curl http://localhost:9000/api/generate -d '{
  "model": "llama3.2:1b",
  "prompt": "Why is the sky blue?"
}'