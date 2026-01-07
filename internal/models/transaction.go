package models

import "time"

type Transaction struct {
	ID          int       `json:"id"`
	Amount      float64   `json:"amount"`
	Category    string    `json:"category"`
	Description string    `json:"description"`
	Type        string    `json:"type"` // "income" or "expense"
	CreatedAt   time.Time `json:"created_at"`
}
