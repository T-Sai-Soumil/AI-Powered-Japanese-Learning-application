# Frontend Technical Spec:

## Pages:

### Dashboard /dashboard

This page contains the following components:
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

We'll need following API endpoints to power this page

GET /dashboard/last_study_session
GET /dashboard/study_progress
GET /dashboard/quick_stats