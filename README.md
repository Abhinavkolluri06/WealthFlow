# 🌊 WealthFlow
### *Autonomous Full-Stack Financial Intelligence Engine*

WealthFlow is a high-performance financial dashboard engineered to provide real-time insights into personal liquidity and expenditure trends. It demonstrates a modern approach to containerized full-stack development, focusing on **architectural purity**, **reactive performance**, and **environment parity**.



## 🛠️ High-Level Engineering
* **Orchestrated Micro-Environment**: Leverages **Docker Compose** to achieve 100% environment parity, ensuring a "zero-config" deployment across any machine.
* **Reactive Intelligence**: Engineered a **non-mutating functional data pipeline** in React, utilizing advanced **memoization patterns** (`useMemo`, `useCallback`) to maintain 60FPS UI performance during complex aggregations.
* **Enterprise-Grade Backend**: API handlers developed in **Go** and refactored to satisfy **SonarQube static analysis**, successfully reducing cyclomatic complexity and eliminating technical debt.
* **Data Portability**: Integrated an asynchronous utility for client-side **Blob management**, allowing seamless **CSV exports** of the entire financial ledger.

---

## 🚀 Key Features
* **Trend Analytics**: Interactive Area Charts for Net Worth tracking using **Recharts**.
* **Distribution Intelligence**: Categorical Donut Charts visualizing outflow distribution (Expenses by Category).
* **Growth Vectors**: Automatic calculation of monthly income and expense percentage shifts to provide actionable insights.
* **Live Ledger**: Advanced search and classification filtering for rapid record retrieval and management.

---

## ⚙️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18 (Vite), Tailwind CSS, Recharts |
| **Backend** | Go (Golang) Standard Library |
| **Database** | PostgreSQL 15 |
| **DevOps** | Docker, Docker Compose, Adminer |

---

## 🚦 Quick Start
Ensure you have **Docker Desktop** installed, then run:

```bash
# Clone the repository
git clone [https://github.com/YOUR_USERNAME/WealthFlow.git](https://github.com/YOUR_USERNAME/WealthFlow.git)

# Launch the orchestrated environment
docker compose up --build



Dashboard: http://localhost:3000

API: http://localhost:8080

DB Inspector (Adminer): http://localhost:8081
