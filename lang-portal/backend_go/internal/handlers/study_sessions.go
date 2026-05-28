package handlers

import (
	"database/sql"
	"math"
	"net/http"

	"backend_go/internal/database"
	"backend_go/internal/models"

	"github.com/gin-gonic/gin"
)

func GetStudySessions(c *gin.Context) {
	page, limit := getPaginationParams(c)
	offset := (page - 1) * limit

	var totalItems int
	database.DB.QueryRow("SELECT COUNT(*) FROM study_sessions").Scan(&totalItems)
	totalPages := int(math.Ceil(float64(totalItems) / float64(limit)))

	query := `
		SELECT ss.id, sa.name AS activity_name, g.name AS group_name, ss.created_at, ss.created_at AS end_time,
		       (SELECT COUNT(*) FROM word_review_items wri WHERE wri.study_session_id = ss.id) AS review_items_count
		FROM study_sessions ss
		JOIN study_activities sa ON ss.study_activity_id = sa.id
		JOIN groups g ON ss.group_id = g.id
		ORDER BY ss.created_at DESC
		LIMIT ? OFFSET ?
	`
	rows, err := database.DB.Query(query, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var sessions []models.StudySession
	for rows.Next() {
		var s models.StudySession
		if err := rows.Scan(&s.ID, &s.ActivityName, &s.GroupName, &s.StartTime, &s.EndTime, &s.ReviewItemsCount); err == nil {
			sessions = append(sessions, s)
		}
	}
	if sessions == nil {
		sessions = []models.StudySession{}
	}

	c.JSON(http.StatusOK, gin.H{
		"items": sessions,
		"pagination": models.Pagination{
			CurrentPage:  page,
			TotalPages:   totalPages,
			TotalItems:   totalItems,
			ItemsPerPage: limit,
		},
	})
}

func GetStudySession(c *gin.Context) {
	id := c.Param("id")

	var s models.StudySession
	query := `
		SELECT ss.id, sa.name AS activity_name, g.name AS group_name, ss.created_at, ss.created_at AS end_time,
		       (SELECT COUNT(*) FROM word_review_items wri WHERE wri.study_session_id = ss.id) AS review_items_count
		FROM study_sessions ss
		JOIN study_activities sa ON ss.study_activity_id = sa.id
		JOIN groups g ON ss.group_id = g.id
		WHERE ss.id = ?
	`
	err := database.DB.QueryRow(query, id).Scan(&s.ID, &s.ActivityName, &s.GroupName, &s.StartTime, &s.EndTime, &s.ReviewItemsCount)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Study session not found"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, s)
}

func GetStudySessionWords(c *gin.Context) {
	sessionID := c.Param("id")
	page, limit := getPaginationParams(c)
	offset := (page - 1) * limit

	var totalItems int
	database.DB.QueryRow("SELECT COUNT(*) FROM word_review_items WHERE study_session_id = ?", sessionID).Scan(&totalItems)
	totalPages := int(math.Ceil(float64(totalItems) / float64(limit)))

	query := `
		SELECT w.id, w.japanese, w.romaji, w.english, wri.correct, wri.created_at
		FROM word_review_items wri
		JOIN words w ON wri.word_id = w.id
		WHERE wri.study_session_id = ?
		ORDER BY wri.created_at DESC
		LIMIT ? OFFSET ?
	`
	rows, err := database.DB.Query(query, sessionID, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	type SessionWord struct {
		ID         int    `json:"id"`
		Japanese   string `json:"japanese"`
		Romaji     string `json:"romaji"`
		English    string `json:"english"`
		Correct    bool   `json:"correct"`
		ReviewedAt string `json:"reviewed_at"`
	}

	var words []SessionWord
	for rows.Next() {
		var w SessionWord
		if err := rows.Scan(&w.ID, &w.Japanese, &w.Romaji, &w.English, &w.Correct, &w.ReviewedAt); err == nil {
			words = append(words, w)
		}
	}
	if words == nil {
		words = []SessionWord{}
	}

	c.JSON(http.StatusOK, gin.H{
		"items": words,
		"pagination": models.Pagination{
			CurrentPage:  page,
			TotalPages:   totalPages,
			TotalItems:   totalItems,
			ItemsPerPage: limit,
		},
	})
}

func CreateStudySession(c *gin.Context) {
	var input struct {
		GroupID         int `json:"group_id"`
		StudyActivityID int `json:"study_activity_id"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	res, err := database.DB.Exec(
		"INSERT INTO study_sessions (group_id, study_activity_id) VALUES (?, ?)",
		input.GroupID, input.StudyActivityID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	sessionID, _ := res.LastInsertId()
	c.JSON(http.StatusCreated, gin.H{
		"id":                sessionID,
		"group_id":          input.GroupID,
		"study_activity_id": input.StudyActivityID,
	})
}

func ReviewWord(c *gin.Context) {
	sessionID := c.Param("id")
	wordID := c.Param("word_id")

	var input struct {
		Correct bool `json:"correct"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	res, err := database.DB.Exec(
		"INSERT INTO word_review_items (word_id, study_session_id, correct) VALUES (?, ?, ?)",
		wordID, sessionID, input.Correct,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	_, _ = res.LastInsertId()

	var createdAt string
	database.DB.QueryRow("SELECT created_at FROM word_review_items WHERE word_id = ? AND study_session_id = ? ORDER BY id DESC LIMIT 1", wordID, sessionID).Scan(&createdAt)

	c.JSON(http.StatusOK, gin.H{
		"success":          true,
		"word_id":          wordID,
		"study_session_id": sessionID,
		"correct":          input.Correct,
		"created_at":       createdAt,
	})
}
