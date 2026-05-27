# Frontend Technical Spec:

## Pages:

### Dashboard `/dashboard` :

#### Purpose:

The purpose od this page is to provide a summary of learning and act as the default when a user visits the web-app.

#### Components:
- Last study session
  - shows last activity used
  - shows when last activity used
  - summarizes wrong vs correct from last activity

- Study progress
  - total words studied e.g. 3/124
    - across all study session show the total words studied out of all possible words in our database
  - display a mastery progress e.g. 50%  

- Quick stats
  - success rate e.g. 80%
  - total study sessions e.g. 4
  - total active groups e.g. 3
  - study streak e.g. 4 days

- Start studying button
  - goes to study activities page

#### Needed API Endpoints:

GET /api/dashboard/last_study_session
GET /api/dashboard/study_progress
GET /api/dashboard/quick_stats

### Study Activities Index `/study-activities` :

#### Purpose:

The purpose of this page is to show a collection of study activities with a thumbnail and it's name, to either launch or view the study activity

#### Components:

- Study Activity Card
  - show a thumbnail of the study activity
  - the name of the study activity
  - a launch button to take us to the launch page
  - the view button to view more information about past study sessions for this study activity.

#### Needed API Endpoints:

- GET /api/study_activities

### Study Activity View `/study_activities/:id` :

#### Purpose:

The purpose of this page is to view the details of a study activity and it's past study sessions.

#### Components:

 - Name of study activity
 - Thumbnail of study activity
 - Description of study activity
 - Launch Button
 - Study Activities Paginated List
   - id
   - activity name
   - group name
   - start time
   - end time(inferred by the last word_review_item submitted)
   - number of review items

#### Needed API Endpoints:

- GET /api/study_activities/:id
- GET /api/study_activities/:id/study_sessions

### Study Activities Launch `/study_activities/:id/launch` :

#### Purpose:

The purpose of this page is to launch a study activity.

#### Components:

- Name of the study activity
- Launch form
  - select field for group
  - launch now button

#### Behaviour:

After the form is submitted, a new tab opens with the study activity based on it's URL provided in the database.

Also after the form is submitted, the page will redirect to the study session show page

#### Needed API Endpoints:

- POST /api/study_activites

### Words Index `/words` :

#### Purpose:

The purpose of this page is to show all words in our database.

#### Components:

- Paginated Word List
  - Columns
    - Japanese
    - Romaji
    - English
    - Correct Count
    - Wrong Count
  - Pagination with 100 items per page
  - Clicking the Japanese word will take us to the word show page

#### Needed API Endpoints:

- GET /api/words

### Word Show `/words/:id` :

#### Purpose:

The purpose of this page is to show information about a specific word.

#### Components:

 - Japanese
 - Romaji
 - English
 - Study Statistics
   - Correct Count
   - Wrong Count
 - Word Groups
   - Show a series of pills e.g. tags
   - when group name is clicked, it will take us to the show page

#### Needed API Endpoints:

- GET /api/words/:id

### Words Groups Index `/groups` :

#### Purpose:

The purpose of this page is to show a list of groups in our database.

#### Components:

- Paginated Group List
  - Columns
    - Group Name
    - Word Count
  - Clicking the group name will take us to the group show page

#### Needed API Endpoints:

- GET /api/groups

### Group Show `/groups/:id` :

#### Purpose:

The purpose of this page is to show information about a specific group.

#### Components:

- Group Name
- Group Statistics
  - Total Word Count
- Words in group (Paginated List of Words)
  - should use the same component as the words index page
- Study Sessions (Paginated List of Study Sessions)
  - Should use the same component as the study session index page

#### Needed API Endpoints:

- GET /api/groups/:id (the name and group stats)
- GET /api/groups/:id/words
- GET /api/groups/:id/study_sessions

### Study Session Index `/study_session` :

#### Purpose:

The purpose of this page is to show a list of study sessions in our database.

#### Components:

- Paginated Study Session List
  - Columns
    - ID
    - Activity Name 
    - Group Name
    - Start Time
    - End Time
    - Number of Review Items
  - Clicking the study session id will take us to the study session show page

#### Needed API Endpoints:

- GET /api/study_sessions

### Study Sessions Show `/study_sessions/:id` :

#### Purpose:

The Purpose of this page is to show information about a specific study session

#### Components:

- Study Session Details
  - ID
  - Activity Name
  - Group Name
  - Start Time
  - End Time
  - Number of Review Items
- Words Review Items (Paginated List of Words)
  - Should use the same component as the words index page

#### Needed API Endpoints:

- GET /api/study_sessions/:id 
- GET /api/study_sessions/:id/words

### Settings Page `/settings` :

#### Purpose:

The purpose of this page is to make configurations to the study portal

#### Components:

- Theme Selection e.g. Light, Dark, System Default
- Reset History Button
  - This will delete all study sessions and word review items
- Full Reset Button
  - This will drop all tables and re-create with seed data

#### Needed API Endpoints:

- POST /api/reset_history
- POST /api/full_reset