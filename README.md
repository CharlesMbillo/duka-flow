# Duka Flow

Offline-first retail POS infrastructure for African SMEs.

---

## Overview

Duka Flow is a Progressive Web App (PWA) designed for retail businesses operating in low-connectivity environments. The platform prioritizes reliability, offline-first operation, fast checkout performance, and synchronization with cloud infrastructure when connectivity becomes available.

The system is built primarily for:

* Retail shops
* Electronics stores
* Pharmacies
* Agrovet businesses
* Small supermarkets
* Mobile-money-enabled merchants

---

## Core Features

* Offline-first POS
* IndexedDB local persistence
* Inventory management
* Cart and checkout workflows
* Bluetooth receipt printing
* Transaction history
* Multi-role access control
* PWA install support
* Background sync queue
* KRA/eTIMS integration preparation
* Supabase backend integration

---

## Technology Stack

| Layer          | Technology   |
| -------------- | ------------ |
| Frontend       | React 18     |
| Language       | TypeScript   |
| Build Tool     | Vite         |
| Styling        | Tailwind CSS |
| UI Components  | shadcn/ui    |
| Local Database | IndexedDB    |
| Backend        | Supabase     |
| Testing        | Vitest       |

---

## Architecture Overview

Duka Flow uses an offline-first architecture.

Browser Application
↓
IndexedDB Local Storage
↓
Sync Queue
↓
Supabase Backend

The application remains operational even when internet connectivity is unavailable.

---

## Offline Strategy

The platform uses:

* IndexedDB for local persistence
* Service Workers for PWA capabilities
* Sync queues for deferred cloud synchronization
* BroadcastChannel for real-time tab synchronization

Transactions are stored locally first, then synchronized later when connectivity becomes available.

---

## Project Structure

src/
├── components/
├── pages/
├── hooks/
├── services/
├── database/
├── sync/
├── auth/
├── utils/
└── tests/

---

## Setup Instructions

### Prerequisites

* Node.js 20+
* npm or pnpm
* Git

---

### Clone Repository

git clone https://github.com/CharlesMbillo/duka-flow.git

cd duka-flow

---

### Install Dependencies

npm install

---

### Configure Environment Variables

cp .env.example .env

---

### Run Development Server

npm run dev

---

## Environment Variables

VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_BASE_URL=

---

## Testing

Run tests:

npm run test

Type checking:

npm run typecheck

Linting:

npm run lint

---

## Deployment

Recommended deployment stack:

* Frontend: Vercel
* Backend: Supabase
* Monitoring: Sentry

---

## Security Notes

Never commit:

* production secrets
* API keys
* service credentials

Use environment variables for all sensitive configuration.

---

## Contributing

Please read CONTRIBUTING.md before submitting pull requests.

---

## License

MIT License
