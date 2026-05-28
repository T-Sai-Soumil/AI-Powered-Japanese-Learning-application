package handlers

import (
	"database/sql"
	"math"
	"net/http"

	"backend_go/internal/database"
	"backend_go/internal/models"

	"github.com/gin-gonic/gin"
)

func GetStudyActivity(c *gin.Context) {
	id := c.Param("id")

	var activity models.StudyActivity
	err := database.DB.QueryRow("SELECT id, name, thumbnail_url, description FROM study_activities WHERE id = ?", id).
		Scan(&activity.ID, &activity.Name, &activity.ThumbnailURL, &activity.Description)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Study activity not found"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, activity)
}

func GetStudyActivitySessions(c *gin.Context) {
	activityID := c.Param("id")
	page, limit := getPaginationParams(c)
	offset := (page - 1) * limit

	var totalItems int
	database.DB.QueryRow("SELECT COUNT(*) FROM study_sessions WHERE study_activity_id = ?", activityID).Scan(&totalItems)
	totalPages := int(math.Ceil(float64(totalItems) / float64(limit)))

	query := `
		SELECT ss.id, sa.name AS activity_name, g.name AS group_name, ss.created_at, ss.created_at AS end_time,
		       (SELECT COUNT(*) FROM word_review_items wri WHERE wri.study_session_id = ss.id) AS review_items_count
		FROM study_sessions ss
		JOIN study_activities sa ON ss.study_activity_id = sa.id
		JOIN groups g ON ss.group_id = g.id
		WHERE ss.study_activity_id = ?
		ORDER BY ss.created_at DESC
		LIMIT ? OFFSET ?
	`
	rows, err := database.DB.Query(query, activityID, limit, offset)
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
