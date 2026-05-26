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

### API Endpoints:

- GET /dashboard/last_study_session
- GET /dashboard/study_progress
- GET /dashboard/quick_stats

- GET /words
- GET /words/:id
- GET /groups
- GET /groups/:id
- GET /groups/:id/words