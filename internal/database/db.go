package database

import (
	"database/sql"
	_ "github.com/lib/pq"
	"log"
)

func Connect(dsn string) *sql.DB {
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		log.Fatal("Could not connect to database:", err)
	}
	if err = db.Ping(); err != nil {
		log.Fatal("Database unreachable:", err)
	}
	return db
}
