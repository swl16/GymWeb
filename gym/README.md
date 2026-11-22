# PULSE Gym & Fitness — Next.js App

A gym management web application built with [Next.js](https://nextjs.org), [Supabase](https://supabase.com), and [Stripe](https://stripe.com).

---

## Prerequisites

Before you begin, make sure the following are installed on your machine:

| Tool | Version | Download |
|------|---------|----------|
| Node.js | v18 or later | https://nodejs.org |
| npm | v9 or later (bundled with Node.js) | — |
| Git | any recent version | https://git-scm.com |

---

## Step-by-Step Setup

### Step 1 — Clone the repository

```bash
git clone <your-repo-url>
cd GymWeb/gym
```

### Step 2 — Install dependencies

Run this command inside the `gym` folder. It installs all packages listed below automatically.

```bash
npm install
```

**Production dependencies installed:**

| Package | Purpose |
|---------|---------|
| `next@16.4.5` | React framework (App Router) |
| `react@19.3.0` | UI library |
| `react-dom@19.3.0` | React DOM renderer |
| `@supabase/supabase-js` | Supabase client (auth, database) |
| `stripe` | Stripe payments SDK |
| `jspdf` | PDF generation for reports |
| `jspdf-autotable` | Table plugin for jsPDF |
| `qrcode` | QR code generation for bookings |
| `@zxing/browser` | QR code scanner (camera-based) |
| `lucide-react` | Icon library |
| `server-only` | Prevents server modules from leaking to client |

**Development dependencies installed:**

| Package | Purpose |
|---------|---------|
| `typescript` | TypeScript compiler |
| `tailwindcss` | Utility-first CSS framework |
| `@tailwindcss/turbopack` | Tailwind integration for Turbopack |
| `eslint` | Code linter |
| `eslint-config-next` | Next.js ESLint rules |
| `@types/node` | TypeScript types for Node.js |
| `@types/react` | TypeScript types for React |
| `@types/react-dom` | TypeScript types for React DOM |
| `@types/qrcode` | TypeScript types for qrcode |

### Step 3 — Configure environment variables

Create a `.env.local` file in the `gym` folder (copy the template below):

```env
# Supabase — get these from your Supabase project dashboard
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SECRET_KEY=your_supabase_secret_key

# App
APP_URL=http://127.0.0.1:3000

# Stripe — optional, leave empty to use cash payments only
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_ENABLE_GRABPAY=false

# Admin session — required in production (32+ random characters)
# Leave empty in local development; a temporary key is auto-generated
ADMIN_SESSION_SECRET=
```


### Step 4 — Run the development server

**Normal mode** (member/staff app):
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Step 5 — (Optional) Stripe setup

If you want to enable online payments:

1. Create a [Stripe account](https://stripe.com)
2. Copy your **Secret key** from the Stripe Dashboard → **Developers** → **API keys**
3. Add it to `.env.local` as `STRIPE_SECRET_KEY`
4. For webhooks, use the [Stripe CLI](https://stripe.com/docs/stripe-cli) to forward events locally:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
5. Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET`

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server at http://localhost:3000 |
| `npm run dev:admin` | Start dev server with admin portal enabled |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

---

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
