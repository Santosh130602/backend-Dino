wallet-backend/
│
├── .env
├── package.json
├── seed.sql
├── README.md
│
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
│   ├── ledger.model.js
│   ├── task.model.js
│   ├── item.model.js
│   ├── userTask.model.js
│   └── init.models.js
│
├── middlewares/
│   └── auth.middleware.js
│
├── routes/
│   ├── auth.routes.js
│   ├── admin.routes.js
│   ├── task.routes.js
│   ├── wallet.routes.js
│   └── item.routes.js
│
└── controllers/
    ├── auth.controller.js        ✅ you already wrote
    ├── admin.controller.js       👉 NEW
    ├── task.controller.js        ✅ partly written
    ├── wallet.controller.js      ✅ you already wrote (needs upgrade)
    └── item.controller.js        👉 NEW
