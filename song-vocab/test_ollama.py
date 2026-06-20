from ollama import Client
try:
    client = Client(host='http://127.0.0.1:11434')
    response = client.chat(model='mistral', messages=[{'role': 'user', 'content': 'Hello'}])
    print("Response received:", response['message']['content'])
except Exception as e:
    print(f"Error: {e}")
