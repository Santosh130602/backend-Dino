# 🚀 **Dino Ventures — Internal Wallet Service (Node + PostgreSQL + Docker)**

---

## 📌 **1) Problem Statement (What this project solves)**

This project implements a **high-traffic internal wallet service** for a gaming / loyalty platform.

It manages **virtual in-app currency** (not real money, not crypto) such as:

* **Silver**
* **Gold**
* **Diamond**

These assets:

* Exist **only inside the system**
* Cannot be transferred between users like a payment app
* Must remain **consistent under heavy load**
* Must **never go negative**
* Must record **every transaction in an immutable ledger**
* Must work correctly even if multiple users act at the same time

### Example Scenario Implemented

| Action                     | Change                            |
| -------------------------- | --------------------------------- |
| User completes a task      | +100 Silver                       |
| Convert 50 Silver → 1 Gold | -50 Silver, +1 Gold               |
| Buy item costing 30 Gold   | -30 Gold                          |
| Final state                | Correct audited balance in ledger |

All of this is handled **transactionally with ACID guarantees in PostgreSQL.**

---

---

# 🧠 **2) Technology Choices (Why this stack?)**

| Layer         | Technology                  | Why Chosen                                          |
| ------------- | --------------------------- | --------------------------------------------------- |
| Backend       | **Node.js (Express)**       | Fast, simple, widely used, great ecosystem          |
| Database      | **PostgreSQL**              | Strong ACID, row locking, transactions, scalability |
| ORM           | ❌ None                      | Raw SQL used for performance & clarity              |
| Container     | **Docker + Docker Compose** | One-command setup                                   |
| Validation    | **Joi**                     | Strong request validation                           |
| Security      | **JWT**                     | Stateless authentication                            |
| Rate Limiting | **express-rate-limit**      | Prevent abuse                                       |
| Ledger        | ✅ Implemented               | Full double-entry audit trail                       |

---

---

# 🗂️ **3) Project Folder Structure**

```
wallet/
│
├── Dockerfile
├── docker-compose.yml
├── .env
├── seed.sql
├── README.md
├── package.json
├── index.js
│
├── config/
│   └── database.js
│
├── models/
│   ├── asset.model.js
│   ├── user.model.js
│   ├── wallet.model.js
│   ├── system.model.js
│   ├── task.model.js
│   ├── item.model.js
│   ├── ledger.model.js
│   └── init.models.js
│
├── controllers/
│   ├── auth.controller.js
│   ├── wallet.controller.js
│   ├── admin.controller.js
│   ├── task.controller.js
│   └── item.controller.js
│
├── middleware/
│   ├── auth.middleware.js
│   ├── rateLimit.middleware.js
│   └── validate.middleware.js
│
├── validators/
│   ├── auth.validator.js
│   └── wallet.validator.js
│
└── routers/
    ├── auth.routes.js
    ├── admin.routes.js
    ├── wallet.routes.js
    ├── task.routes.js
    └── item.routes.js
```

---

---

# 🧱 **4) Database Schema Overview**

### ✅ Asset Types (`asset_types`)

| id | name    |
| -- | ------- |
| 1  | Silver  |
| 2  | Gold    |
| 3  | Diamond |

### ✅ Users (`users`)

| id | name     | email                                         | role  |
| -- | -------- | --------------------------------------------- | ----- |
| 1  | Admin    | [admin@example.com](mailto:admin@example.com) | admin |
| 2  | User One | [user1@example.com](mailto:user1@example.com) | user  |
| 3  | User Two | [user2@example.com](mailto:user2@example.com) | user  |

### ✅ Wallets (`wallets`)

Each user gets **three wallets automatically**:

* 100 Gold
* 0 Silver
* 0 Diamond

### ✅ System Treasury (`system_wallet`)

Acts as the source/destination of all funds.

### ✅ Tasks (`tasks`)

Rewards are paid in **Silver**.

### ✅ Items (`items`)

Priced in **Gold**.

### ✅ Ledger (`ledger`)

Every transaction is recorded:

* TOPUP
* BONUS
* SPEND
* CONVERT

This provides **full auditability.**

---

---

# 🧾 **5) Seed Script (`seed.sql`) — Preloaded Data**

Your `seed.sql` already:

* Creates all tables
* Creates **3 assets**
* Creates **1 admin + 2 users**
* Gives each user wallets
* Creates system treasury
* Inserts sample tasks
* Inserts sample items
* Configures conversions:

  * **50 Silver → 1 Gold**
  * **50 Gold → 1 Diamond**

This file is automatically executed when you run Docker.

---

---

# 🐳 **6) How to Run the Project (Docker Way — Recommended)**

## Step 1 — Create `.env`

```
DATABASE_URL=postgresql://postgres:walletManagment@Dino@postgres:5432/postgres
JWT_SECRET=mySuperSecretKey
```

## Step 2 — Run Docker

```bash
docker-compose up --build
```

You should see:

```
wallet-db running
wallet-api running on port 4000
```

---

## Step 3 — Test in Browser

```
http://localhost:4000
```

Response:

```
Wallet API is running 🚀
```

---

---

# 🔐 **7) Authentication APIs (Postman Testing)**

## 🔹 SIGNUP

**POST**

```
http://localhost:4000/api/v1/auth/signup
```

Body:

```json
{
  "name": "Test User",
  "email": "test@example.com",
  "phone": "9876543210",
  "password": "Test@123"
}
```

Response:

```json
{
  "message": "User registered successfully",
  "wallets": {
    "gold": 100,
    "silver": 0,
    "diamond": 0
  }
}
```

---

## 🔹 LOGIN

**POST**

```
http://localhost:4000/api/v1/auth/login
```

Body:

```json
{
  "email": "test@example.com",
  "password": "Test@123"
}
```

Response:

```json
{
  "token": "eyJhbGciOiJIUzI1..."
}
```

👉 Use this token in all protected routes:

```
Authorization: Bearer <TOKEN>
```

---

---

# 💰 **8) Wallet APIs**

## 🔹 Get All Balances

**GET**

```
http://localhost:4000/api/v1/wallet/3
```

Response:

```json
{
  "silver": 0,
  "gold": 100,
  "diamond": 0
}
```

---

## 🔹 Convert Silver → Gold

**POST**

```
http://localhost:4000/api/v1/wallet/convert/silver-to-gold
```

Body:

```json
{
  "userId": 3,
  "silverAmount": 50
}
```

Response:

```json
{
  "message": "Converted",
  "goldReceived": 1
}
```

---

---

# 🧩 **9) Task Completion Flow**

**POST**

```
http://localhost:4000/api/v1/task/complete
```

Body:

```json
{
  "userId": 3,
  "taskId": 1
}
```

Response:

```json
{
  "message": "Task completed, Silver credited"
}
```

User gets Silver → can convert to Gold → can buy items.

---

---

# 🛒 **10) Buy Item Flow**

**POST**

```
http://localhost:4000/api/v1/item/buy
```

Body:

```json
{
  "userId": 3,
  "itemId": 1
}
```

If balance is sufficient:

```json
{
  "message": "Item purchased successfully"
}
```

If insufficient:

```json
{
  "error": "Insufficient Gold balance"
}
```

---

---

# ⚡ **11) Concurrency & Deadlock Handling**

We solved this using:

* **PostgreSQL Transactions (`BEGIN / COMMIT`)**
* **Row Locking (`SELECT ... FOR UPDATE`)**
* Always locking wallets in the **same order**
* Updating system wallet only after locking user wallet

This prevents:

* Race conditions
* Double spending
* Negative balances

---

---

# 📒 **12) Ledger-Based Architecture**

Every transaction writes to:

```
ledger(tx_id, from_wallet, to_wallet, asset_id, amount, type)
```

Example:

```
SPEND:
User → Treasury
CONVERT:
Silver → Gold
BONUS:
Treasury → User
```

This ensures **100% auditability**.

---

---

# 🚀 **13) Deployment**

You can deploy this project to:

* Railway
* Render
* AWS
* DigitalOcean

Using the same Docker setup.

---

---

# ✅ **14) What You Have Delivered**

| Requirement          | Status                    |
| -------------------- | ------------------------- |
| Seed script          | ✅ Done                    |
| REST APIs            | ✅ Done                    |
| ACID transactions    | ✅ Done                    |
| Ledger system        | ✅ Done                    |
| Concurrency handling | ✅ Done                    |
| Dockerized app       | ✅ Done                    |
| Idempotency          | ✅ Partially implemented   |
| Deadlock avoidance   | ✅ Implemented via locking |

---

---

# 🎯 **15) Final Notes**

This project demonstrates:

* Real production patterns
* Scalable architecture
* Clean separation of concerns
* Strong data integrity
* Gaming wallet economics

You can submit this confidently as a **backend engineering assignment.**

---

If you want, I can next provide:

* **GitHub-ready repo**
* **Postman collection**
* **Live deployment guide**

Just say:
👉 **“Give me GitHub + Postman + Deployment.”**
