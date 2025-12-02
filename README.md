# Support Specialist Hint & Feedback System

A secure, auditable system enabling Support Specialists to provide targeted feedback or hints to users who report being stuck on discovery paths or puzzles, ensuring privacy, data integrity, and a positive user experience.

---

## Table of Contents

- [Features](#features)
- [Architecture Overview](#architecture-overview)
- [Setup & Installation](#setup--installation)
- [Usage Guide](#usage-guide)
  - [Support Specialist Workflow](#support-specialist-workflow)
  - [User Workflow](#user-workflow)
- [Security & Privacy](#security--privacy)
- [Audit Logging & QA](#audit-logging--qa)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- **Support Specialists** can view user progress logs for users who have requested support.
- **Targeted feedback/hints** can be sent, tied to specific steps or puzzles.
- **Users receive secure notifications** containing feedback or hints.
- **All interactions are logged** for audit and QA.
- **Strict access controls** ensure only authorized Support Specialists can access user progress and send hints.
- **No unsolicited hints**: Hints/feedback can only be sent in response to explicit user requests.
- **Privacy controls**: Only the intended user can view the feedback or hint.
- **GDPR-compliant** data storage and transmission.

---

## Architecture Overview

- **Backend:** Node.js (Express) + TypeScript, Prisma ORM, PostgreSQL
- **Frontend:** React + TypeScript
- **Authentication:** JWT (role-based access control)
- **Notifications:** Socket.io (real-time), extensible for Web Push
- **Audit Logging:** Immutable audit table in PostgreSQL
- **Deployment:** Docker & docker-compose

---

## Setup & Installation

### Prerequisites

- [Docker](https://www.docker.com/get-started)
- [Node.js](https://nodejs.org/) (for local development)
- [npm](https://www.npmjs.com/)

### Quick Start (Recommended)

1. **Clone the repository:**
   ```sh
   git clone https://github.com/your-org/support-hint-system.git
   cd support-hint-system
   ```

2. **Start all services with Docker Compose:**
   ```sh
   docker-compose up --build
   ```

   - Backend: http://localhost:4000
   - Frontend: http://localhost:3000
   - PostgreSQL: localhost:5432

3. **Apply Prisma migrations:**
   ```sh
   docker-compose exec backend npx prisma migrate deploy
   ```

4. **(Optional) Seed initial data:**
   ```sh
   docker-compose exec backend npx prisma db seed
   ```

### Local Development

- Backend: `cd backend && npm install && npm run dev`
- Frontend: `cd frontend && npm install && npm start`
- Database: Use Docker or local PostgreSQL

---

## Usage Guide

### Support Specialist Workflow

1. **Login** as a Support Specialist.
2. **Search for a user** who has requested support.
3. **View user progress logs** (steps, puzzles, status).
4. **Identify where the user is stuck** (highlighted in UI).
5. **Send targeted hint/feedback** tied to a specific step or puzzle.
6. **All actions are logged** for audit and QA.

### User Workflow

1. **Login** as a user.
2. **Request support** if stuck (via app or external process).
3. **Receive notifications** when a Support Specialist sends a hint/feedback.
4. **View received hints/feedback** in the notifications panel.
5. **Mark hints as viewed** (for audit logging).

---

## Security & Privacy

- **All data in transit is encrypted** (TLS/HTTPS required).
- **Role-based access control** enforced via JWT.
- **Hints/feedback can only be sent in response to explicit user requests.**
- **Audit logs are immutable** and accessible for QA.
- **Notifications are delivered only to the intended user.**
- **Compliant with GDPR and other data privacy regulations.**

---

## Audit Logging & QA

- Every support interaction (viewing progress, sending hints, viewing hints) is logged in the immutable `AuditLog` table.
- Audit logs include actor, action, target user, metadata, and timestamp.
- Logs are accessible for quality assurance and compliance.

---

## API Documentation

- **Swagger/OpenAPI** documentation is available at `/api/docs` (when enabled).
- Main endpoints:
  - `GET /api/support/progress/:userId` — View user progress logs
  - `POST /api/support/hint/:userId` — Send hint/feedback
  - `GET /api/support/hint` — Get received hints/feedback
  - `POST /api/support/hint/view/:hintId` — Mark hint as viewed

---

## Testing

- **Unit tests:** Run with `npm test` in both backend and frontend.
- **Integration tests:** Backend API and database.
- **End-to-end tests:** Simulate full support and user workflows.
- **Code quality:** Enforced via ESLint and Prettier.

---

## Deployment

- **Production-ready** via Docker Compose.
- **Environment variables** for secrets and configuration.
- **Scalable**: Can be extended for cloud deployment (Kubernetes, etc).

---

## Contributing

1. Fork the repository.
2. Create a feature branch.
3. Submit a pull request with clear description and tests.

---

## License

MIT License. See [LICENSE](LICENSE) for details.

---

## Contact & Support

For questions, feature requests, or support, please contact the project maintainers or open an issue on GitHub.

---