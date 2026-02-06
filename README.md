# Dino Ventures Wallet Management System

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Render](https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)

**Production-Ready Internal Wallet Service for Gaming & Loyalty Platforms**

[![Live API](https://img.shields.io/badge/Live%20API-https://backend--dino.onrender.com-blue?style=for-the-badge)](https://backend-dino.onrender.com/)


</div>

## 📋 Table of Contents

- [🌟 Overview](#-overview)
- [⚡ Quick Start](#-quick-start)
  - [Docker Setup (Recommended)](#docker-setup-recommended)
  - [Manual Setup](#manual-setup)
- [🚀 Live Deployment](#-live-deployment)
- [🏗️ System Architecture](#️-system-architecture)
- [📊 Database Design](#-database-design)
- [🔐 Authentication](#-authentication)
- [📡 API Documentation](#-api-documentation)
  - [Authentication Endpoints](#authentication-endpoints)
  - [Wallet Endpoints](#wallet-endpoints)
  - [Task Endpoints](#task-endpoints)
  - [Admin Endpoints](#admin-endpoints)
- [🔄 Core Flows](#-core-flows)
- [⚙️ Advanced Features](#️-advanced-features)
- [🧪 Testing](#-testing)
- [🔧 Project Structure](#-project-structure)
- [📈 Performance](#-performance)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

## 🌟 Overview

Dino Ventures Wallet Management System is a **production-grade internal wallet service** built for high-traffic gaming and loyalty platforms. The system manages virtual currencies (Silver, Gold, Diamond) with guaranteed **ACID compliance**, **zero balance discrepancies**, and **complete auditability**.

### Key Features

- ✅ **ACID Transactions** - Guaranteed data consistency
- ✅ **Double-Entry Ledger** - Full audit trail for all transactions
- ✅ **Concurrency Control** - Row-level locking prevents race conditions
- ✅ **Idempotent Operations** - Safe retries for failed requests
- ✅ **Deadlock Prevention** - Consistent locking order strategy
- ✅ **Role-Based Access Control** - Admin/User permissions
- ✅ **Rate Limiting** - DDoS and abuse protection
- ✅ **Containerized Deployment** - Docker & Docker Compose ready
- ✅ **Cloud Ready** - Live deployment on Render.com

## ⚡ Quick Start

### Docker Setup (Recommended)

Get up and running in 3 minutes:

```bash
# 1. Clone the repository
git clone https://github.com/Santosh130602/backend-Dino
cd backend-Dino

# 2. Configure environment (optional, uses defaults)
cp .env.example .env

# 3. Start all services
docker-compose up --build

# 4. Verify installation
curl http://localhost:4000/
# Response: { "success": true, "message": "API is Running..."}
```



### Manual Setup

```bash
# 1. Install dependencies
npm install

# 2. Set up PostgreSQL database
createdb wallet_db

# 3. Configure environment variables
export DATABASE_URL=""
export JWT_SECRET="your-secret-key-here"
export PORT=4000

# 4. Initialize database
npm run db:init

# 5. Start the server
# Development mode
nodemon index.js

# Production mode
node index.js
```

## 🚀 Live Deployment

The application is deployed and fully operational:

**Live API Base URL:** `https://backend-dino.onrender.com`

### Test Endpoints

```bash
# Health Check
curl https://backend-dino.onrender.com/



# Login (Test Credentials)
curl -X POST https://backend-dino.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@user.com","password":"demo@12345"}'
```

### Default Credentials

| Role | Email | Password | Purpose |
|------|-------|----------|---------|
| Admin | `Demo@admin.com` | `Demo@12345` | Full system administration |
| User | `demo@user.com` | `demo@12345` | Standard user operations |

## 🏗️ System Architecture

### Technology Stack Rationale

| Component | Choice | Why |
|-----------|--------|-----|
| **Runtime** | Node.js 18+ | Non-blocking I/O perfect for concurrent wallet operations |
| **Framework** | Express.js | Minimalist, high-performance, excellent middleware ecosystem |
| **Database** | PostgreSQL 15 | ACID compliance, row-level locking, JSON support |
| **Data Access** | Raw SQL (pg) | Maximum performance and transaction control |
| **Container** | Docker & Docker Compose | Consistent environments, easy scaling |
| **Authentication** | JWT + bcrypt | Stateless, scalable auth with strong password hashing |
| **Validation** | Joi | Robust request validation with clear error messages |
| **Deployment** | Render.com | Zero-configuration, automatic SSL, built-in PostgreSQL |

### Architecture Flow

```
┌─────────────┐     HTTPS/REST     ┌─────────────┐     SQL Transactions    ┌─────────────┐
│   Client    │───────────────────▶│  Express    │────────────────────────▶│ PostgreSQL  │
│  (Mobile/   │ ◀──────────────────│    API      │ ◀───────────────────────│  Database   │
│   Web)      │     JSON Response  │             │     ACID Results        │             │
└─────────────┘                    └─────────────┘                        └─────────────┘
                                       │  ▲                                      │
                                       │  │                                      │
                                JWT    │  │   Rate                             Audit
                                Auth   │  │   Limiting                        Logging
                                       ▼  │                                      ▼
                                 ┌─────────────┐                         ┌─────────────┐
                                 │ Middleware  │                         │   Ledger    │
                                 │   Layer     │                         │   System    │
                                 └─────────────┘                         └─────────────┘
```

## 📊 Database Design

### Core Tables

```sql
-- 1. Asset Types (Virtual Currencies)
CREATE TABLE asset_types (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,      -- 'Silver', 'Gold', 'Diamond'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  password TEXT NOT NULL,         -- bcrypt hashed
  role TEXT DEFAULT 'user' CHECK (role IN ('user','admin')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. User Wallets
CREATE TABLE wallets (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  asset_id INT REFERENCES asset_types(id),
  balance DECIMAL(12,2) DEFAULT 0 CHECK (balance >= 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, asset_id)      -- One wallet per asset per user
);

-- 4. System Treasury
CREATE TABLE system_wallet (
  id SERIAL PRIMARY KEY,
  asset_id INT UNIQUE REFERENCES asset_types(id) ON DELETE CASCADE,
  balance DECIMAL(14,2) DEFAULT 0 CHECK (balance >= 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Double-Entry Ledger (Audit Trail)
CREATE TABLE ledger (
  id SERIAL PRIMARY KEY,
  tx_id UUID DEFAULT gen_random_uuid() UNIQUE,
  from_wallet INT REFERENCES wallets(id),
  to_wallet INT REFERENCES wallets(id),
  asset_id INT REFERENCES asset_types(id),
  amount DECIMAL(12,2) NOT NULL,
  type TEXT CHECK (type IN ('TOPUP','BONUS','SPEND','CONVERT')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Preloaded Data (seed.sql)

The system comes pre-configured with:

1. **Three Asset Types**: Silver, Gold, Diamond
2. **System Treasury**: 1,000,000 units of each currency
3. **Sample Users**: Admin + 2 regular users
4. **Conversion Rates**: 50 Silver = 1 Gold, 50 Gold = 1 Diamond
5. **Sample Tasks**: Daily login, Complete level, Invite friend
6. **Sample Items**: Classic Sword, Legend Shield, Mythic Dragon

## 🔐 Authentication

### JWT Token Flow

1. **Login** to receive token:
```bash
curl -X POST https://backend-dino.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@user.com","password":"demo@12345"}'
```

2. **Use token** in all protected endpoints:
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. **Token expires** after 24 hours (configurable)

### Security Features

- **bcrypt password hashing** (10 rounds)
- **HTTPS enforcement** in production
- **CORS configuration** for web clients
- **Rate limiting** per IP address
- **SQL injection prevention** via parameterized queries
- **Input validation** with Joi schemas

## 📡 API Documentation

### Base URL
```
https://backend-dino.onrender.com/api/v1
```

### Authentication Endpoints

#### POST `/auth/login`
Authenticate user and receive JWT token.

**Request:**
```json
{
  "email": "demo@user.com",
  "password": "demo@12345"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 2,
    "name": "Demo User",
    "email": "demo@user.com",
    "role": "user"
  }
}
```

#### POST `/auth/signup`
Register new user (auto-creates wallets).

**Request:**
```json
{
  "name": "New Player",
  "email": "player@example.com",
  "password": "SecurePass123",
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "wallets": {
    "silver": 0,
    "gold": 100,
    "diamond": 0
  }
}
```

### Wallet Endpoints

#### GET `/wallet/:userId`
Get all wallet balances for a user.

**Response:**
```json
{
  "success": true,
  "data": {
    "user_id": 2,
    "balances": {
      "silver": 150,
      "gold": 85,
      "diamond": 0
    }
  }
}
```

#### POST `/wallet/convert/silver-to-gold`
Convert Silver to Gold (50:1 ratio).

**Request:**
```json
{
  "userId": 2,
  "silverAmount": 50
}
```

**Response:**
```json
{
  "success": true,
  "message": "Silver → Gold converted",
  "data": {
    "silver_converted": 50,
    "gold_received": 1,
    "transaction_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  }
}
```

#### POST `/wallet/:userId/:itemId/spend`
Purchase item using Gold.

**Response:**
```json
{
  "success": true,
  "message": "Item purchased successfully",
  "data": {
    "item_id": 1,
    "item_name": "Classic Sword",
    "price_gold": 30,
    "remaining_gold": 55
  }
}
```

### Task Endpoints

#### POST `/task/complete`
Complete a task and earn Silver reward.

**Request:**
```json
{
  "userId": 2,
  "taskId": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Task completed successfully",
  "data": {
    "task_title": "Complete Level 1",
    "reward_silver": 20,
    "new_balance": 170
  }
}
```

### Admin Endpoints

#### POST `/admin/tasks` (Admin only)
Create new task.

**Request:**
```json
{
  "title": "Watch Tutorial",
  "description": "Watch the complete tutorial video",
  "reward_silver": 15
}
```

#### POST `/admin/conversion-rates` (Admin only)
Update exchange rates.

**Request:**
```json
{
  "silverToGold": 40,
  "goldToDiamond": 40
}
```

#### GET `/admin/ledger` (Admin only)
View transaction audit trail.

## 🔄 Core Flows

### 1. Task Completion & Conversion Flow
```
User completes task → Earns Silver → Converts to Gold → Purchases item
```

**Example API Calls:**
```bash
# 1. Complete task (earn 20 Silver)
curl -X POST /task/complete -d '{"userId":2,"taskId":1}'

# 2. Convert 50 Silver to 1 Gold
curl -X POST /wallet/convert/silver-to-gold -d '{"userId":2,"silverAmount":50}'

# 3. Purchase item costing 30 Gold
curl -X POST /wallet/2/1/spend
```

### 2. Admin Top-up Flow
```
Admin adds funds → System treasury debited → User wallet credited
```

**Example:**
```bash
# Add 100 Silver to user
curl -X POST /wallet/2/1/topup -d '{"amount":100}'
```

## ⚙️ Advanced Features

### Concurrency Handling
```javascript
// Row-level locking prevents race conditions
const result = await client.query(
  `SELECT balance FROM wallets 
   WHERE user_id = $1 AND asset_id = $2 
   FOR UPDATE`,  // Locks the row
  [userId, assetId]
);
```

**Strategy:**
1. **Consistent locking order** (user → system → ledger)
2. **Short transaction timeouts**
3. **Retry mechanism** for deadlock victims
4. **Optimistic concurrency control** for reads

### Double-Entry Ledger System
Every transaction creates immutable audit records:
```
User spends 50 Gold:
- Entry 1: User → System (50 Gold, SPEND)
- Entry 2: System → Treasury (50 Gold, REVENUE)
```

### Idempotency Implementation
```javascript
// Idempotency key prevents duplicate processing
const checkDuplicate = await pool.query(
  "SELECT id FROM transactions WHERE tx_id = $1",
  [idempotencyKey]
);

if (checkDuplicate.rows.length > 0) {
  return res.json({ 
    success: true, 
    message: "Duplicate request ignored",
    original_response: cachedResponse 
  });
}
```

### Deadlock Prevention
1. **Lock ordering**: Always lock in same sequence
2. **Timeouts**: SET lock_timeout = '5s'
3. **Retry logic**: Exponential backoff for failed transactions
4. **Minimal locking scope**: Lock only required rows

## 🧪 Testing

### Test Credentials
```bash
# Admin Access
EMAIL=Demo@admin.com
PASSWORD=Demo@12345

# User Access
EMAIL=demo@user.com
PASSWORD=demo@12345
```

### Complete Test Scenario
```bash
# 1. Login as user
TOKEN=$(curl -s -X POST /auth/login \
  -d '{"email":"demo@user.com","password":"demo@12345"}' | jq -r '.token')

# 2. Check initial balance
curl -H "Authorization: Bearer $TOKEN" /wallet/2

# 3. Complete a task
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId":2,"taskId":1}' /task/complete

# 4. Convert currency
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId":2,"silverAmount":50}' /wallet/convert/silver-to-gold

# 5. Purchase item
curl -X POST -H "Authorization: Bearer $TOKEN" /wallet/2/1/spend

# 6. Verify final balance
curl -H "Authorization: Bearer $TOKEN" /wallet/2
```

### Automated Tests
```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run with coverage
npm run test:coverage

# Load testing
npm run test:load
```

## 🔧 Project Structure

```
dino-wallet/
├── src/
│   ├── config/               # Configuration files
│   │   └── database.js      # PostgreSQL connection pool
│   │
│   ├── controllers/         # Request handlers
│   │   ├── auth.controller.js
│   │   ├── wallet.controller.js
│   │   ├── admin.controller.js
│   │   ├── task.controller.js
│   │   └── item.controller.js
│   │
│   ├── middleware/          # Express middleware
│   │   ├── auth.middleware.js    # JWT validation
│   │   ├── rateLimit.middleware.js
│   │   └── validate.middleware.js
│   │
│   ├── models/             # Database models (table creation)
│   │   ├── asset.model.js
│   │   ├── user.model.js
│   │   ├── wallet.model.js
│   │   ├── system.model.js
│   │   ├── task.model.js
│   │   ├── item.model.js
│   │   ├── ledger.model.js
│   │   ├── transaction.model.js
│   │   └── init.models.js  # Initialize all tables
│   │
│   ├── routes/             # API route definitions
│   │   ├── auth.routes.js
│   │   ├── wallet.routes.js
│   │   ├── admin.routes.js
│   │   └── task.routes.js
│   │
│   ├── validators/         # Request validation schemas
│   │   ├── auth.validator.js
│   │   └── wallet.validator.js
│   │
│   └── utils/              # Utility functions
│       └── helpers.js
│
├── tests/                  # Test suites
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── docker/                 # Docker configuration
│   ├── Dockerfile
│   └── docker-compose.yml
│
├── scripts/               # Deployment scripts
│   └── init-db.sh
│
├── docs/                  # Documentation
│   └── api-reference.md
│
├── seed.sql              # Database initialization
├── .env.example         # Environment template
├── package.json
├── index.js            # Application entry point
└── README.md
```

## 📈 Performance

### Optimization Strategies

1. **Connection Pooling**: Reuse PostgreSQL connections
2. **Indexed Queries**: All foreign keys indexed
3. **Minimal Joins**: Optimized queries reduce database load
4. **Batch Operations**: Bulk inserts for admin functions
5. **Caching Layer**: Ready for Redis integration

### Expected Performance
- **Response Time**: < 200ms for 95% of requests
- **Concurrent Users**: 1000+ simultaneous transactions
- **Throughput**: 500+ transactions per second
- **Availability**: 99.9% uptime target


## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** changes (`git commit -m 'Add amazing feature'`)
4. **Push** to branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines
- Follow existing code style and conventions
- Write tests for new features
- Update documentation as needed
- Use meaningful commit messages

## 📄 License

This project is proprietary software of Dino Ventures.

**Confidential & Proprietary**
Unauthorized copying, distribution, or modification is strictly prohibited.

---

<div align="center">

**Built with ❤️ for Dino Ventures**

[Live API](https://backend-dino.onrender.com) | 
[Github](https://github.com/Santosh130602/backend-Dino) |

</div>