# 🚚 SwiftShip — Courier & Logistics Platform (Backend)

SwiftShip is a backend-only RESTful API for a courier and logistics management platform. It allows customers to book parcel deliveries, couriers (delivery agents) to manage and update delivery status in real time, and admins to oversee the entire operation — all with secure role-based access and integrated bKash payments.

> 📌 This is a backend-focused project. There is no frontend UI — all functionality is tested and demonstrated via **Postman / Thunder Client**.

---

## 🔗 Live Links

| Resource | Link |
|---|---|
| **Live API** | https://swift-ship-backend-theta.vercel.app/ |
| **API Documentation** | [ Add your Postman/Swagger doc link here ] |
| **Demo Video** | [ Add your video link here ] |
| **GitHub Repository** | [ Add your repo link here ] |

---

## 🧩 Problem Statement

Traditional courier businesses in Bangladesh often rely on manual tracking, phone calls, and paperwork to manage deliveries — leading to delays, lost parcels, and poor visibility for customers. **SwiftShip** solves this by providing a centralized, API-driven platform where:

- Customers can book parcels, pay online, and track them in real time.
- Couriers can manage their assigned deliveries and update statuses on the go.
- Admins can monitor the entire fleet, manage users, assign deliveries, and track payments — all from one system.

---

## 👥 User Roles

SwiftShip implements **3 distinct roles** with strict role-based access control (RBAC), enforced via JWT-based auth middleware:

| Role | Responsibilities |
|---|---|
| **Admin** | Manage users, assign/reassign couriers, view all parcels & payments, moderate reviews, view audit logs |
| **User (Customer)** | Book a parcel, make payments via bKash, track delivery status, leave reviews, view booking history |
| **Courier (Delivery Agent)** | View assigned deliveries, update parcel status, view delivery history |

Each role is restricted to its own set of endpoints — attempting to access another role's endpoint returns a `403 Forbidden` response.

---

## 🛠️ Tech Stack

- **Runtime:** Node.js (TypeScript, ESM)
- **Framework:** Express 5
- **Database:** PostgreSQL
- **ORM:** Prisma 7 (with `@prisma/adapter-pg`)
- **Authentication:** JWT (Access + Refresh Tokens) + Google OAuth (`google-auth-library`)
- **Password Hashing:** bcryptjs
- **Validation:** Zod
- **Payment Gateway:** bKash
- **Caching:** Redis
- **File/Image Uploads:** Multer + Cloudinary
- **Email:** Nodemailer + EJS templates (OTP verification, forgot/reset password, welcome email)
- **Scheduled Jobs:** node-cron
- **PDF Generation:** PDFKit
- **Security:** Helmet, CORS, express-rate-limit
- **Dev Tooling:** tsx (dev runtime), tsup (build), Biome (lint/format)
- **Deployment:** Vercel (Serverless Functions)

---

## ✨ Core Features

- 🔐 JWT-based authentication (access + refresh tokens) with Google Social Login
- 📧 OTP-based email verification on registration, plus forgot/reset password flow
- 🧑‍🤝‍🧑 Role-based authorization for Admin, User, and Courier
- 📦 Parcel booking, tracking, and status management (with status log history)
- 🚦 Real-time parcel status updates by assigned couriers
- ⭐ Review system for completed deliveries
- 💳 Real payment integration via bKash with callback-based verification
- 🖼️ Image/file uploads via Cloudinary (e.g., profile photos, parcel proof)
- ⚡ Redis caching for improved performance
- ⏱️ Rate limiting and Helmet-based security hardening
- 🧾 PDF generation (e.g., delivery receipts/invoices)
- 📝 Audit logging for key admin/user actions
- ⏰ Scheduled background jobs via node-cron
- ✅ Centralized Zod validation with descriptive, structured error messages
- 📊 Consistent structured JSON responses across all endpoints
- 🗃️ Well-indexed, relational PostgreSQL schema with Prisma transactions

---

## 📁 Folder Structure

```
swiftship-backend/
├── src/
│   ├── app/
│   │   ├── config/
│   │   │   └── index.ts               # Centralized env config
│   │   ├── interfaces/
│   │   │   └── index.ts
│   │   ├── lib/
│   │   │   ├── bkash.ts                # bKash payment integration
│   │   │   ├── cloudinary.ts           # Cloudinary upload config
│   │   │   ├── cron.ts                 # Scheduled jobs
│   │   │   ├── googleAuth.ts           # Google OAuth verification
│   │   │   ├── multer.ts               # File upload middleware config
│   │   │   ├── nodemailer.ts           # Email transporter config
│   │   │   ├── prisma.ts               # Prisma client instance
│   │   │   └── redis.ts                # Redis client config
│   │   ├── middlewares/
│   │   │   ├── auth.ts                 # JWT auth & role guard
│   │   │   ├── globalErrorHandler.ts
│   │   │   ├── notFound.ts
│   │   │   ├── rateLimiter.ts
│   │   │   └── validateRequest.ts      # Zod validation middleware
│   │   ├── modules/
│   │   │   ├── admin/
│   │   │   ├── auth/
│   │   │   ├── parcel/
│   │   │   ├── payment/
│   │   │   ├── review/
│   │   │   └── user/
│   │   │       # each module: controller, service, route, interface, validation
│   │   ├── templates/                  # EJS email templates
│   │   │   ├── forgot-password.ejs
│   │   │   ├── registration-user-otp.ejs
│   │   │   ├── reset-password-success.ejs
│   │   │   └── user-welcome-email.ejs
│   │   └── utils/
│   │       ├── AppError.ts
│   │       ├── auditLog.ts
│   │       ├── catchAsync.ts
│   │       ├── jwt.ts
│   │       ├── parcel.ts
│   │       ├── seed.ts
│   │       └── sendResponse.ts
│   ├── generated/prisma/               # Prisma generated client
│   ├── routes/
│   │   └── router.ts                   # Central route aggregator
│   ├── app.ts                          # Express app setup
│   └── server.ts                       # Entry point
├── prisma/
│   └── schema.prisma
├── .env
├── package.json
└── README.md
```

---

## 📡 API Response Format

All endpoints return a consistent structured JSON response.

**Success:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

**Error:**
```json
{
  "success": false,
  "message": "Something went wrong",
  "errors": []
}
```

---

## 🔑 Key API Modules

Base URL: `https://swift-ship-backend-theta.vercel.app/api/v1`

| Module | Description |
|---|---|
| `/auth` | Register (with OTP verification), login, refresh token, Google login, forgot/reset password |
| `/user` | User profile management (view/update, admin user management) |
| `/admin` | Admin-only operations — user & courier management, oversight |
| `/parcel` | Parcel booking, tracking, status updates, status log history |
| `/payment` | bKash payment session creation and callback handling |
| `/review` | Submit and view delivery reviews |

> ✏️ Full endpoint list with request/response examples is available in the Postman documentation linked above.

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory with the following:

```env
# Server
NODE_ENV=development
PORT=5000
API_VERSION=/api/v1
CORS_ORIGIN=http://localhost:3000

# Database
DATABASE_URL=

# JWT
JWT_ACCESS_SECRET=
JWT_ACCESS_EXPIRES_IN=1d
JWT_REFRESH_SECRET=
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=10

# Seed / Demo Accounts
SUPER_ADMIN_NAME=
SUPER_ADMIN_EMAIL=
SUPER_ADMIN_PASSWORD=
TESTER_ADMIN_NAME=
TESTER_ADMIN_EMAIL=
TESTER_ADMIN_PASSWORD=
TESTER_COURIER_NAME=
TESTER_COURIER_EMAIL=
TESTER_COURIER_PASSWORD=

# Redis
REDIS_USER=
REDIS_PASSWORD=
REDIS_HOST=
REDIS_PORT=

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Google OAuth
GOOGLE_CLIENT_ID=

# Email (SMTP)
EMAIL_SENDER=
SMTP_USER=
SMTP_PASSWORD=

# bKash Payment Gateway
BKASH_USERNAME=
BKASH_PASSWORD=
BKASH_APP_KEY=
BKASH_APP_SECRET=
BKASH_BASE_URL=
BKASH_CALLBACK_URL=
```

---

## 🚀 Getting Started (Local Setup)

```bash
# 1. Clone the repository
git clone [ your-repo-link ]
cd swiftship-backend

# 2. Install dependencies
npm install

# 3. Set up environment variables
# Create a .env file as shown above and fill in your actual values

# 4. Generate Prisma client & run migrations
npx prisma generate
npx prisma migrate dev

# 5. Seed the database (creates super admin, tester accounts)
npx tsx src/app/utils/seed.ts

# 6. Start the development server
npm run dev
```

The server will run at `http://localhost:5000` by default (or the port set in `.env`).

**Available scripts:**
| Script | Description |
|---|---|
| `npm run dev` | Start development server with `tsx watch` |
| `npm run build` | Build for production with `tsup` |
| `npm start` | Run the production build |
| `npm run lint:check` / `lint:fix` | Lint the codebase with Biome |
| `npm run format:check` / `format:fix` | Format the codebase with Biome |

---

## 🔐 Demo Admin Credentials

For evaluation purposes (seeded via `SUPER_ADMIN_*` / `TESTER_ADMIN_*` env vars):

```
Email:    [ your seeded admin email ]
Password: [ your seeded demo password ]
```

> ⚠️ Use dedicated demo credentials for evaluation — never share real production secrets.

---

## 💳 Payment Flow (bKash)

1. Customer initiates payment for a booked parcel via the `/payment` module.
2. Backend creates a bKash payment session (`bkash.ts`) and returns a redirect/payment URL.
3. Customer completes payment on bKash's hosted checkout page.
4. bKash redirects to the configured `BKASH_CALLBACK_URL`.
5. Backend verifies the transaction with bKash's API and updates the parcel's payment status in the database within a Prisma transaction.

---

## 🧠 Technical Challenge

> ✏️ Briefly describe one real challenge you solved — e.g., handling bKash's callback verification flow securely, structuring Prisma transactions across parcel + payment updates, implementing JWT access/refresh token rotation, or Google OAuth integration alongside email/password auth.

---

## 📹 Video Walkthrough

A full API walkthrough covering architecture, all 3 roles, CRUD operations, validation/error handling, and the bKash payment flow is available here: **[ Add your demo video link ]**

---

## 📄 License

This project was built as part of the B7A6 Backend Project Assignment for educational purposes.
