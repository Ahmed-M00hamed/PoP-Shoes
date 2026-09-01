# 👟 PoP Shoes

A full-featured sneaker e-commerce store built with **React** and **Tailwind CSS**, powered end-to-end by **Supabase** (database, storage, and authentication).

---

## ✨ Features

### Customer-facing

- Browse products with search and category filtering
- Product detail page with **color and size selection**, including a per-color image gallery
- Guest cart that works without sign-up, backed by secure anonymous sessions
- Full checkout flow that saves orders directly to the database
- **Order tracking page** with live status (pending / processing / shipped / delivered)
- **"My Orders"** page listing past orders from the same device
- Automatic low-stock warning when a specific size is running out
- Fully responsive design with an adaptive mobile navigation menu

### Admin panel

- Secure login via Supabase Auth
- Full product management: create / edit / delete
- Manage colors and sizes per product, each with independent stock
- Upload multiple images per product (primary image + color-specific gallery) via Supabase Storage
- Order management with status updates
- At-a-glance dashboard: low-stock alerts + best-selling products

---

## 🛠️ Tech Stack

| Technology                                              | Purpose                                             |
| ------------------------------------------------------- | --------------------------------------------------- |
| [React](https://react.dev) + [Vite](https://vitejs.dev) | Frontend framework & build tool                     |
| [React Router](https://reactrouter.com)                 | Client-side routing                                 |
| [Tailwind CSS](https://tailwindcss.com)                 | Styling                                             |
| [Supabase](https://supabase.com)                        | Postgres database, file storage, and authentication |

---

## 📁 Project Structure

```
src/
├── components/       # Shared UI components (Navbar, Footer, Spinner...)
├── pages/            # App pages (Home, Products, Cart, Checkout, Admin...)
├── utils/            # Helper functions (guestId, cart)
├── supabaseClient.js # Supabase client setup
└── App.jsx           # Route definitions
```

---

## ⚙️ Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> ⚠️ `.env` is excluded via `.gitignore` — never commit it or share these values publicly.

### 3. Set up the database

Run the SQL scripts in order from the Supabase **SQL Editor**:

1. Core tables (products, cart_items)
2. Orders table (orders)
3. Admin RLS policies (admin_policies)
4. Colors & sizes support (variants_migration)
5. Secure order access via database functions (secure_orders)
6. Secure cart access via anonymous auth (secure_cart)

### 4. Enable required Supabase features

- **Authentication → Sign In / Providers**: enable **Anonymous Sign-Ins**
- **Storage**: create a bucket named `product-images` and mark it **Public**
- **Authentication → Users**: create an admin account (Create new user)

### 5. Run the project

```bash
npm run dev
```

---

## 🔐 Admin Access

```
/admin/login
```

Sign in with the account created in Supabase Authentication.

---

## 🚀 Deployment

The project is ready to deploy on [Vercel](https://vercel.com)

1. Connect the GitHub repository to the platform
2. Add the environment variables (`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`) in the project settings
3. Build command: `npm run build`
4. Output directory: `dist`

> 💡 Before handing this off to a real client, review Supabase's free-tier limits (projects auto-pause after a week of inactivity) and consider upgrading to a paid plan if needed.

---

## 📄 License

This project is intended for educational and private commercial use.
