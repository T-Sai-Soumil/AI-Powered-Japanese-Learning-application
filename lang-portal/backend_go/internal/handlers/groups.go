package handlers

import (
	"database/sql"
	"math"
	"net/http"

	"backend_go/internal/database"
	"backend_go/internal/models"

	"github.com/gin-gonic/gin"
)

func GetGroups(c *gin.Context) {
	page, limit := getPaginationParams(c)
	offset := (page - 1) * limit

	var totalItems int
	database.DB.QueryRow("SELECT COUNT(*) FROM groups").Scan(&totalItems)
	totalPages := int(math.Ceil(float64(totalItems) / float64(limit)))

	query := `
		SELECT g.id, g.name, COUNT(wg.word_id) as word_count
		FROM groups g
		LEFT JOIN words_groups wg ON g.id = wg.group_id
		GROUP BY g.id
		LIMIT ? OFFSET ?
	`
	rows, err := database.DB.Query(query, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var groups []models.Group
	for rows.Next() {
		var g models.Group
		if err := rows.Scan(&g.ID, &g.Name, &g.WordCount); err == nil {
			groups = append(groups, g)
		}
	}
	if groups == nil {
		groups = []models.Group{}
	}

	c.JSON(http.StatusOK, gin.H{
		"items": groups,
		"pagination": models.Pagination{
			CurrentPage:  page,
			TotalPages:   totalPages,
			TotalItems:   totalItems,
			ItemsPerPage: limit,
		},
	})
}

func GetGroup(c *gin.Context) {
	id := c.Param("id")

	var g models.GroupDetail
	err := database.DB.QueryRow(`
		SELECT g.id, g.name, COUNT(wg.word_id)
		FROM groups g
		LEFT JOIN words_groups wg ON g.id = wg.group_id
		WHERE g.id = ?
		GROUP BY g.id
	`, id).Scan(&g.ID, &g.Name, &g.Stats.TotalWordCount)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Group not found"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, g)
}

func GetGroupWords(c *gin.Context) {
	groupID := c.Param("id")
	page, limit := getPaginationParams(c)
	offset := (page - 1) * limit

	var totalItems int
	database.DB.QueryRow("SELECT COUNT(*) FROM words_groups WHERE group_id = ?", groupID).Scan(&totalItems)
	totalPages := int(math.Ceil(float64(totalItems) / float64(limit)))

	query := `
		SELECT w.id, w.japanese, w.romaji, w.english,
		       COALESCE(SUM(CASE WHEN wri.correct = 1 THEN 1 ELSE 0 END), 0) AS correct_count,
		       COALESCE(SUM(CASE WHEN wri.correct = 0 THEN 1 ELSE 0 END), 0) AS wrong_count
		FROM words w
		JOIN words_groups wg ON w.id = wg.word_id
		LEFT JOIN word_review_items wri ON w.id = wri.word_id
		WHERE wg.group_id = ?
		GROUP BY w.id
		LIMIT ? OFFSET ?
	`
	rows, err := database.DB.Query(query, groupID, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var words []models.Word
	for rows.Next() {
		var w models.Word
		if err := rows.Scan(&w.ID, &w.Japanese, &w.Romaji, &w.English, &w.CorrectCount, &w.WrongCount); err == nil {
			words = append(words, w)
		}
	}
	if words == nil {
		words = []models.Word{}
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

func GetGroupStudySessions(c *gin.Context) {
	groupID := c.Param("id")
	page, limit := getPaginationParams(c)
	offset := (page - 1) * limit

	var totalItems int
	database.DB.QueryRow("SELECT COUNT(*) FROM study_sessions WHERE group_id = ?", groupID).Scan(&totalItems)
	totalPages := int(math.Ceil(float64(totalItems) / float64(limit)))

	query := `
		SELECT ss.id, sa.name AS activity_name, g.name AS group_name, ss.created_at, ss.created_at AS end_time,
		       (SELECT COUNT(*) FROM word_review_items wri WHERE wri.study_session_id = ss.id) AS review_items_count
		FROM study_sessions ss
		JOIN study_activities sa ON ss.study_activity_id = sa.id
		JOIN groups g ON ss.group_id = g.id
		WHERE ss.group_id = ?
		ORDER BY ss.created_at DESC
		LIMIT ? OFFSET ?
	`
	rows, err := database.DB.Query(query, groupID, limit, offset)
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
