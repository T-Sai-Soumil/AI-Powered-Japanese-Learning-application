import requests
from bs4 import BeautifulSoup
import urllib.parse

def search_web(query: str, max_results: int = 3):
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; rv:109.0) Gecko/20100101 Firefox/115.0"}
    data = {"q": query}
    try:
        resp = requests.post("https://lite.duckduckgo.com/lite/", headers=headers, data=data)
        print(resp.text[1500:2500])
    except Exception as e:
        print(e)

search_web("Yoru ni Kakeru by YOASOBI kanji romaji english lyrics")
