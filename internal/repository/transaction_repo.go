package repository

import (
	"database/sql"
	"finance-tracker/internal/models"
)

type TransactionRepository struct {
	db *sql.DB
}

func NewTransactionRepository(db *sql.DB) *TransactionRepository {
	return &TransactionRepository{db: db}
}

func (r *TransactionRepository) Create(t *models.Transaction) error {
	query := `INSERT INTO transactions (amount, category, description, type) 
              VALUES ($1, $2, $3, $4) RETURNING id, created_at`
	return r.db.QueryRow(query, t.Amount, t.Category, t.Description, t.Type).
		Scan(&t.ID, &t.CreatedAt)
}

func (r *TransactionRepository) GetAll() ([]models.Transaction, error) {
	rows, err := r.db.Query("SELECT id, amount, category, description, type, created_at FROM transactions ORDER BY created_at DESC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var transactions []models.Transaction
	for rows.Next() {
		var t models.Transaction
		if err := rows.Scan(&t.ID, &t.Amount, &t.Category, &t.Description, &t.Type, &t.CreatedAt); err != nil {
			return nil, err
		}
		transactions = append(transactions, t)
	}
	return transactions, nil
}

// === ADD THIS BLOCK BELOW ===
func (r *TransactionRepository) GetSummary() (map[string]float64, error) {
	query := `
        SELECT 
            COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
            COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense
        FROM transactions`

	var income, expense float64
	err := r.db.QueryRow(query).Scan(&income, &expense)
	if err != nil {
		return nil, err
	}

	return map[string]float64{
		"total_income":   income,
		"total_expenses": expense,
		"net_balance":    income - expense,
	}, nil
}