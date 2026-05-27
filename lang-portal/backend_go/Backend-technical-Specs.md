# Backend Server Technical Specs:

## Buisness Goals:

A language learning school wants to build a prototype of learning portal which will act as three things:
- Inventory of possible vocabulary that can be learned 
- Act as a learning record store (LRS), providing correct and wrong score on practice vocabulary
- A unified launchpad to launch different learning apps

## Technical Requirements:

- The backend will be built using Go
- The database will be SQLite3
- The API will be built using Gin
- The API will always return JSON
- There will be no authentication or authorization
- Everything will be treated as a single user

## Database Schema:

Our database will be a single sqlite database called 'words.db', that will be in the root of the project folder of 'backend_go'

We have the following tables:
- words - stored vocabulary words
  - id integer
  - japanese string
  - romaji string 
  - english string 
  - parts json 

- words_groups - join table for words and groups many-to-many
  - id integer
  - word_id integer
  - group_id integer

- groups - thematic groups of words
  - id integer
  - name string

- study_session - records of study sessions grouping word_review_items
  - id integer
  - group_id integer
  - study_activity_id integer
  - created_at datetime

- study_activities - a specific study activity, linking a study session to group
  - id integer
  - study_session_id integer
  - group_id integer
  - created_at datetime

- word-review-items - a record of word practice, determining if the word was correct or not
  - word_id integer
  - study_session_id integer
  - correct boolean
  - created_at datetime

## API Endpoints:

### GET /api/dashboard/last_study_session :

 - Returns information about the most recent study session.

#### JSON Response:

{
  "id": 123,
  "group_id": 456,
  "created_at": "2025-05-27T10:00:00Z",
  "study_activity_id": 789,
  "group_name": "Basic Greetings"
}

### GET /api/dashboard/study_progress :

- Returns progress towards learning all available words.
- Please note that the frontend will determine progress based on total words stdied and total available  words

#### JSON Response:

{
  "total_words_studied": 150,
  "total_available_words": 500
}

### GET /api/dashboard/quick_stats :

- Returns quick overview stats for the user's dashboard.

#### JSON Response:

{
  "success_rate": 80.5,
  "total_study_sessions": 24,
  "total_active_groups": 3,
  "study_streak_days": 5
}

### GET /api/study_activities/:id

#### JSON Response :

{
  "id": 1,
  "name": "Flashcards",
  "thumbnail_url": "https://example.com/thumbnail.png",
  "description": "Practice vocabulary with flashcards"
}

### GET /api/study_activities/:id/study_sessions :

- pagination with 100 items per page

#### JSON Response:

{
  "items": [
    {
      "id": 123,
      "activity_name": "Flashcards",
      "group_name": "Basic Greetings",
      "start_time": "2025-05-27T10:00:00Z",
      "end_time": "2025-05-27T10:30:00Z",
      "review_items_count": 20
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "total_items": 100,
    "items_per_page": 20
  }
}

### POST /api/study_activites :

#### Request Params:
  - group_id integer
  - study_activity_id integer

#### JSON Response:

{
  "group_id": 12,
  "study_activity_id": 1
}

### GET /api/words

- pagination with 100 items per page

#### JSON Response:

{
  "items": [
    {
      "id": 1,
      "japanese": "こんにちは",
      "romaji": "konnichiwa",
      "english": "hello",
      "correct_count": 5,
      "wrong_count": 2
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 10,
    "total_items": 1000,
    "items_per_page": 100
  }
}

### GET /api/words/:id :

#### JSON Response:

{
  "id": 1,
  "japanese": "こんにちは",
  "romaji": "konnichiwa",
  "english": "hello",
  "stats": {
    "correct_count": 5,
    "wrong_count": 2
  },
  "groups": [
    {
      "id": 1,
      "name": "Basic Greetings"
    }
  ]
}

### GET /api/groups :

#### JSON Response:

{
  "items": [
    {
      "id": 1,
      "name": "Basic Greetings",
      "word_count": 20
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 1,
    "total_items": 5,
    "items_per_page": 100
  }
}

### GET /api/groups/:id :

#### JSON Response:

{
  "id": 1,
  "name": "Basic Greetings",
  "stats": {
    "total_word_count": 20
  }
}

### GET /api/groups/:id/words :

#### JSON Response:

{
  "items": [
    {
      "id": 1,
      "japanese": "こんにちは",
      "romaji": "konnichiwa",
      "english": "hello",
      "correct_count": 5,
      "wrong_count": 2
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 1,
    "total_items": 20,
    "items_per_page": 100
  }
}

### GET /api/groups/:id/study_sessions :

#### JSON Response:

{
  "items": [
    {
      "id": 123,
      "activity_name": "Flashcards",
      "group_name": "Basic Greetings",
      "start_time": "2025-05-27T10:00:00Z",
      "end_time": "2025-05-27T10:30:00Z",
      "review_items_count": 20
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 1,
    "total_items": 5,
    "items_per_page": 100
  }
}

### GET /api/study_sessions :

- pagination with 100 items per page

#### JSON Response:

{
  "items": [
    {
      "id": 123,
      "activity_name": "Flashcards",
      "group_name": "Basic Greetings",
      "start_time": "2025-05-27T10:00:00Z",
      "end_time": "2025-05-27T10:30:00Z",
      "review_items_count": 20
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "total_items": 100,
    "items_per_page": 100
  }
}

### GET /api/study_sessions/:id :

#### JSON Response:

{
  "id": 123,
  "activity_name": "Flashcards",
  "group_name": "Basic Greetings",
  "start_time": "2025-05-27T10:00:00Z",
  "end_time": "2025-05-27T10:30:00Z",
  "review_items_count": 20
}

### GET /api/study_sessions/:id/words :

#### JSON Response:

{
  "items": [
    {
      "id": 1,
      "japanese": "こんにちは",
      "romaji": "konnichiwa",
      "english": "hello",
      "correct": true,
      "reviewed_at": "2025-05-27T10:05:00Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 1,
    "total_items": 20,
    "items_per_page": 100
  }
}

### POST /api/reset_history :

#### JSON Response:

{
  "success": true,
  "message": "Study history has been reset"
}

### POST /api/full_reset :

#### JSON Response:

{
  "success": true,
  "message": "System has been fully reset"
}

### POST /api/study_sessions/:id/word_id/review :
 
#### Request Parameters:

- id (study_session_id) integer
- word_id integer
- correct boolean

#### Request Payload:

{
  "correct": true
}

#### JSON Response:

{
  "success": true,
  "word_id": 1,
  "study_session_id": 123,
  "correct": true,
  "created_at": "2025-05-27T10:05:00Z"
}

## Mage Tasks:

- Mage is the task runner for Go.
- Let's list out possible tasks we need for our lang portal:

### Initialise Database:

- This task will initialise the sqlite database called 'words.db'.

### Migrate Database:

- This task will run a series of migration sql files on the database.
- Migrations live in the 'migrations' folder.
- The migration files will be run in order of their file name.
- The file names should look like this:
  - 0001_init.sql
  - 0002_create_words_table.sql

### Seed Data:

- The task will import json files and transform them into target data for our database.

- All seed files live in the 'seeds' folder.

- In our task, we should have DSL to specific each seed file and it's expected group word name.

[
  {
    "kanji": "払う",
    "romaji": "harau",
    "english": "to pay",
    "parts": [
      { "kanji": "払", "romaji": ["ha","ra"] },
      { "kanji": "う", "romaji": ["u"] }
    ]
  }
]  