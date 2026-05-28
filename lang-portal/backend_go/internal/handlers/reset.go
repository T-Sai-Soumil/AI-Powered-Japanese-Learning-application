package handlers

import (
	"net/http"

	"backend_go/internal/database"

	"github.com/gin-gonic/gin"
)

func ResetHistory(c *gin.Context) {
	_, err := database.DB.Exec("DELETE FROM word_review_items")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	_, err = database.DB.Exec("DELETE FROM study_sessions")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Study history has been reset",
	})
}

func FullReset(c *gin.Context) {
	// Drop all tables
	tables := []string{"word_review_items", "study_sessions", "words_groups", "groups", "words", "study_activities"}
	for _, t := range tables {
		_, err := database.DB.Exec("DROP TABLE IF EXISTS " + t)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "System has been fully reset. Please re-initialize and migrate the database.",
	})
}
