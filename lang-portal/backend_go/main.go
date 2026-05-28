package main

import (
	"log"

	"backend_go/internal/database"
	"backend_go/internal/handlers"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	if err := database.Connect("words.db"); err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	r := gin.Default()

	// Enable CORS
	r.Use(cors.Default())

	api := r.Group("/api")
	{
		// Dashboard
		api.GET("/dashboard/last_study_session", handlers.GetLastStudySession)
		api.GET("/dashboard/study_progress", handlers.GetStudyProgress)
		api.GET("/dashboard/quick_stats", handlers.GetQuickStats)

		// Study Activities
		api.GET("/study_activities/:id", handlers.GetStudyActivity)
		api.GET("/study_activities/:id/study_sessions", handlers.GetStudyActivitySessions)

		// Words
		api.GET("/words", handlers.GetWords)
		api.GET("/words/:id", handlers.GetWord)

		// Groups
		api.GET("/groups", handlers.GetGroups)
		api.GET("/groups/:id", handlers.GetGroup)
		api.GET("/groups/:id/words", handlers.GetGroupWords)
		api.GET("/groups/:id/study_sessions", handlers.GetGroupStudySessions)

		// Study Sessions
		api.GET("/study_sessions", handlers.GetStudySessions)
		api.GET("/study_sessions/:id", handlers.GetStudySession)
		api.GET("/study_sessions/:id/words", handlers.GetStudySessionWords)
		api.POST("/study_sessions", handlers.CreateStudySession)
		api.POST("/study_sessions/:id/words/:word_id/review", handlers.ReviewWord)

		// System
		api.POST("/reset_history", handlers.ResetHistory)
		api.POST("/full_reset", handlers.FullReset)
	}

	r.Run(":8080")
}
