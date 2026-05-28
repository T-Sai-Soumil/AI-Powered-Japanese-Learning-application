//go:build mage
// +build mage

package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"
	"strings"

	_ "modernc.org/sqlite"
)

const dbPath = "words.db"

// InitDb creates the sqlite database file.
func InitDb() error {
	fmt.Println("Initializing database...")
	// Create empty file
	file, err := os.Create(dbPath)
	if err != nil {
		return err
	}
	file.Close()
	fmt.Println("Database initialized at", dbPath)
	return nil
}

// MigrateDb runs the SQL migration files in the db/migrations directory.
func MigrateDb() error {
	fmt.Println("Running migrations...")
	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		return err
	}
	defer db.Close()

	migrationsDir := "db/migrations"
	files, err := ioutil.ReadDir(migrationsDir)
	if err != nil {
		return err
	}

	for _, f := range files {
		if strings.HasSuffix(f.Name(), ".sql") {
			fmt.Printf("Applying migration: %s\n", f.Name())
			content, err := ioutil.ReadFile(filepath.Join(migrationsDir, f.Name()))
			if err != nil {
				return err
			}
			_, err = db.Exec(string(content))
			if err != nil {
				return fmt.Errorf("error in migration %s: %v", f.Name(), err)
			}
		}
	}
	fmt.Println("Migrations completed.")
	return nil
}

type SeedWord struct {
	Japanese string          `json:"japanese"`
	Romaji   string          `json:"romaji"`
	English string          `json:"english"`
	Parts   json.RawMessage `json:"parts"`
}

// SeedData reads JSON files from db/seeds and populates the database.
func SeedData() error {
	fmt.Println("Seeding data...")
	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		return err
	}
	defer db.Close()

	seedsDir := "db/seeds"
	files, err := ioutil.ReadDir(seedsDir)
	if err != nil {
		return err
	}

	for _, f := range files {
		if strings.HasSuffix(f.Name(), ".json") {
			groupName := strings.TrimSuffix(f.Name(), ".json")
			groupName = strings.ReplaceAll(groupName, "_", " ")
			fmt.Printf("Seeding group: %s from %s\n", groupName, f.Name())

			content, err := ioutil.ReadFile(filepath.Join(seedsDir, f.Name()))
			if err != nil {
				return err
			}

			var words []SeedWord
			if err := json.Unmarshal(content, &words); err != nil {
				return err
			}

			// Insert group
			res, err := db.Exec("INSERT INTO groups (name) VALUES (?)", groupName)
			if err != nil {
				return err
			}
			groupID, _ := res.LastInsertId()

			for _, word := range words {
				// Insert word
				partsJSON, _ := json.Marshal(word.Parts)
				res, err := db.Exec(
					"INSERT INTO words (japanese, romaji, english, parts) VALUES (?, ?, ?, ?)",
					word.Japanese, word.Romaji, word.English, string(partsJSON),
				)
				if err != nil {
					return err
				}
				wordID, _ := res.LastInsertId()

				// Insert into words_groups
				_, err = db.Exec("INSERT INTO words_groups (word_id, group_id) VALUES (?, ?)", wordID, groupID)
				if err != nil {
					return err
				}
			}
		}
	}

	// Seed some default study activities
	_, err = db.Exec(`INSERT INTO study_activities (name, thumbnail_url, description) VALUES 
		('Flashcards', 'https://example.com/flashcards.png', 'Practice vocabulary with flashcards'),
		('Typing Quiz', 'https://example.com/typing.png', 'Practice by typing out the romaji')`)
	if err != nil {
		return err
	}

	fmt.Println("Data seeding completed.")
	return nil
}
