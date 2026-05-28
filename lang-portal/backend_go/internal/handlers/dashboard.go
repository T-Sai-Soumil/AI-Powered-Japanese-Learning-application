package handlers

import (
	"database/sql"
	"net/http"

	"backend_go/internal/database"

	"github.com/gin-gonic/gin"
)

func GetLastStudySession(c *gin.Context) {
	query := `
		SELECT ss.id, ss.group_id, ss.created_at, ss.study_activity_id, g.name 
		FROM study_sessions ss
		JOIN groups g ON ss.group_id = g.id
		ORDER BY ss.created_at DESC LIMIT 1
	`
	row := database.DB.QueryRow(query)

	var session struct {
		ID              int    `json:"id"`
		GroupID         int    `json:"group_id"`
		CreatedAt       string `json:"created_at"`
		StudyActivityID int    `json:"study_activity_id"`
		GroupName       string `json:"group_name"`
	}

	err := row.Scan(&session.ID, &session.GroupID, &session.CreatedAt, &session.StudyActivityID, &session.GroupName)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusOK, gin.H{})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, session)
}

func GetStudyProgress(c *gin.Context) {
	var totalWordsStudied int
	err := database.DB.QueryRow(`SELECT COUNT(DISTINCT word_id) FROM word_review_items`).Scan(&totalWordsStudied)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var totalAvailableWords int
	err = database.DB.QueryRow(`SELECT COUNT(id) FROM words`).Scan(&totalAvailableWords)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"total_words_studied":   totalWordsStudied,
		"total_available_words": totalAvailableWords,
	})
}

func GetQuickStats(c *gin.Context) {
	var totalCorrect, totalReviews int
	err := database.DB.QueryRow(`SELECT COUNT(*) FROM word_review_items WHERE correct = 1`).Scan(&totalCorrect)
	if err != nil {
		totalCorrect = 0
	}
	err = database.DB.QueryRow(`SELECT COUNT(*) FROM word_review_items`).Scan(&totalReviews)
	if err != nil {
		totalReviews = 0
	}

	successRate := 0.0
	if totalReviews > 0 {
		successRate = float64(totalCorrect) / float64(totalReviews) * 100.0
	}

	var totalStudySessions int
	database.DB.QueryRow(`SELECT COUNT(*) FROM study_sessions`).Scan(&totalStudySessions)

	var totalActiveGroups int
	database.DB.QueryRow(`SELECT COUNT(DISTINCT group_id) FROM study_sessions`).Scan(&totalActiveGroups)

	// Study streak calculation would be more complex (consecutive days)
	// For prototype, we'll return a static value or simple calculation.
	studyStreakDays := 0

	c.JSON(http.StatusOK, gin.H{
		"success_rate":         successRate,
		"total_study_sessions": totalStudySessions,
		"total_active_groups":  totalActiveGroups,
		"study_streak_days":    studyStreakDays,
	})
}
