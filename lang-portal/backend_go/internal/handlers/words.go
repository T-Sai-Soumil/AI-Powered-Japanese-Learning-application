package handlers

import (
	"database/sql"
	"math"
	"net/http"

	"backend_go/internal/database"
	"backend_go/internal/models"

	"github.com/gin-gonic/gin"
)

func GetWords(c *gin.Context) {
	page, limit := getPaginationParams(c)
	offset := (page - 1) * limit

	var totalItems int
	database.DB.QueryRow("SELECT COUNT(*) FROM words").Scan(&totalItems)
	totalPages := int(math.Ceil(float64(totalItems) / float64(limit)))

	query := `
		SELECT w.id, w.japanese, w.romaji, w.english,
		       COALESCE(SUM(CASE WHEN wri.correct = 1 THEN 1 ELSE 0 END), 0) AS correct_count,
		       COALESCE(SUM(CASE WHEN wri.correct = 0 THEN 1 ELSE 0 END), 0) AS wrong_count
		FROM words w
		LEFT JOIN word_review_items wri ON w.id = wri.word_id
		GROUP BY w.id
		LIMIT ? OFFSET ?
	`
	rows, err := database.DB.Query(query, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var words []models.Word
	for rows.Next() {
		var w models.Word
		if err := rows.Scan(&w.ID, &w.Japanese, &w.Romaji, &w.English, &w.CorrectCount, &w.WrongCount); err != nil {
			continue
		}
		words = append(words, w)
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

func GetWord(c *gin.Context) {
	id := c.Param("id")

	query := `
		SELECT w.id, w.japanese, w.romaji, w.english,
		       COALESCE(SUM(CASE WHEN wri.correct = 1 THEN 1 ELSE 0 END), 0) AS correct_count,
		       COALESCE(SUM(CASE WHEN wri.correct = 0 THEN 1 ELSE 0 END), 0) AS wrong_count
		FROM words w
		LEFT JOIN word_review_items wri ON w.id = wri.word_id
		WHERE w.id = ?
		GROUP BY w.id
	`
	row := database.DB.QueryRow(query, id)

	var w models.WordDetail
	err := row.Scan(&w.ID, &w.Japanese, &w.Romaji, &w.English, &w.Stats.CorrectCount, &w.Stats.WrongCount)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Word not found"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Get groups
	groupQuery := `
		SELECT g.id, g.name 
		FROM groups g
		JOIN words_groups wg ON g.id = wg.group_id
		WHERE wg.word_id = ?
	`
	rows, err := database.DB.Query(groupQuery, id)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var g models.Group
			if err := rows.Scan(&g.ID, &g.Name); err == nil {
				w.Groups = append(w.Groups, g)
			}
		}
	}
	if w.Groups == nil {
		w.Groups = []models.Group{}
	}

	c.JSON(http.StatusOK, w)
}
