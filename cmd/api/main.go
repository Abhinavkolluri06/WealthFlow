package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"

	_ "github.com/lib/pq"
)

func main() {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://admin:secret@db:5432/finance_db?sslmode=disable"
	}

	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	mux := http.NewServeMux()
	
	// Routes
	mux.HandleFunc("/transactions", transactionHandler(db))
	mux.HandleFunc("/summary", summaryHandler(db))

	fmt.Println("Server starting on :8080...")
	log.Fatal(http.ListenAndServe(":8080", mux))
}

// 1. Router: Complexity 2 (SonarQube compliant)
func transactionHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		setupCORS(&w)
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		switch r.Method {
		case http.MethodGet:
			getTransactions(w, db)
		case http.MethodPost:
			createTransaction(w, r, db)
		case http.MethodDelete:
			deleteTransaction(w, r, db)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	}
}

// 2. Helper: Fetch Transactions
func getTransactions(w http.ResponseWriter, db *sql.DB) {
	rows, err := db.Query("SELECT id, amount, category, type FROM transactions ORDER BY id DESC")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	transactions := []map[string]interface{}{}
	for rows.Next() {
		var id int
		var amount float64
		var category, tType string
		rows.Scan(&id, &amount, &category, &tType)
		transactions = append(transactions, map[string]interface{}{
			"id": id, "amount": amount, "category": category, "type": tType,
		})
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(transactions)
}

// 3. Helper: Create Transaction
func createTransaction(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	var t struct {
		Amount   float64 `json:"amount"`
		Category string  `json:"category"`
		Type     string  `json:"type"`
	}
	if err := json.NewDecoder(r.Body).Decode(&t); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}
	_, err := db.Exec("INSERT INTO transactions (amount, category, type) VALUES ($1, $2, $3)", 
		t.Amount, t.Category, t.Type)
	if err != nil {
		http.Error(w, "DB error", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusCreated)
}

// 4. Helper: Delete Transaction (Fixed Logic)
func deleteTransaction(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	id := r.URL.Query().Get("id")
	if id == "" {
		http.Error(w, "ID required", http.StatusBadRequest)
		return
	}
	_, err := db.Exec("DELETE FROM transactions WHERE id = $1", id)
	if err != nil {
		http.Error(w, "Delete failed", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// 5. Helper: Dashboard Summary
func summaryHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		setupCORS(&w)
		var income, expenses float64
		
		db.QueryRow("SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type='income'").Scan(&income)
		db.QueryRow("SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type='expense'").Scan(&expenses)
		
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]float64{
			"total_income":   income,
			"total_expenses": expenses,
			"net_balance":    income - expenses,
		})
	}
}

// 6. Helper: CORS Setup
func setupCORS(w *http.ResponseWriter) {
	(*w).Header().Set("Access-Control-Allow-Origin", "*")
	(*w).Header().Set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
	(*w).Header().Set("Access-Control-Allow-Headers", "Content-Type")
}