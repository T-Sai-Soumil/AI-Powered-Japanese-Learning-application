import sqlite3
import os

DB_PATH = "song_vocab.db"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS songs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            lyrics TEXT
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS vocabulary (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            song_id INTEGER,
            word TEXT,
            reading TEXT,
            meaning TEXT,
            FOREIGN KEY (song_id) REFERENCES songs (id)
        )
    ''')
    conn.commit()
    conn.close()

def save_song_and_vocab(title: str, lyrics: str, vocabulary: list):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("INSERT INTO songs (title, lyrics) VALUES (?, ?)", (title, lyrics))
    song_id = cursor.lastrowid
    
    for item in vocabulary:
        cursor.execute(
            "INSERT INTO vocabulary (song_id, word, reading, meaning) VALUES (?, ?, ?, ?)",
            (song_id, item.get('kanji'), item.get('romaji'), item.get('english'))
        )
        
    conn.commit()
    conn.close()

# Initialize on module import
init_db()
