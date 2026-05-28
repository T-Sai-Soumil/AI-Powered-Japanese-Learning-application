package models

import (
	"time"
)

type Word struct {
	ID           int             `json:"id"`
	Japanese     string          `json:"japanese"`
	Romaji       string          `json:"romaji"`
	English      string          `json:"english"`
	CorrectCount int             `json:"correct_count,omitempty"`
	WrongCount   int             `json:"wrong_count,omitempty"`
}

type WordDetail struct {
	Word
	Stats struct {
		CorrectCount int `json:"correct_count"`
		WrongCount   int `json:"wrong_count"`
	} `json:"stats"`
	Groups []Group `json:"groups"`
}

type Group struct {
	ID        int    `json:"id"`
	Name      string `json:"name"`
	WordCount int    `json:"word_count,omitempty"`
}

type GroupDetail struct {
	ID    int    `json:"id"`
	Name  string `json:"name"`
	Stats struct {
		TotalWordCount int `json:"total_word_count"`
	} `json:"stats"`
}

type StudyActivity struct {
	ID           int    `json:"id"`
	Name         string `json:"name"`
	ThumbnailURL string `json:"thumbnail_url"`
	Description  string `json:"description"`
}

type StudySession struct {
	ID               int       `json:"id"`
	GroupID          int       `json:"group_id"`
	GroupName        string    `json:"group_name,omitempty"`
	StudyActivityID  int       `json:"study_activity_id,omitempty"`
	ActivityName     string    `json:"activity_name,omitempty"`
	StartTime        time.Time `json:"start_time"`
	EndTime          time.Time `json:"end_time"`
	ReviewItemsCount int       `json:"review_items_count"`
}

type WordReviewItem struct {
	WordID         int       `json:"word_id"`
	StudySessionID int       `json:"study_session_id"`
	Correct        bool      `json:"correct"`
	CreatedAt      time.Time `json:"created_at"`
}

type Pagination struct {
	CurrentPage  int `json:"current_page"`
	TotalPages   int `json:"total_pages"`
	TotalItems   int `json:"total_items"`
	ItemsPerPage int `json:"items_per_page"`
}
