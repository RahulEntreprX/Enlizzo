
```
<!-- ENLIZZO README -->

<h1 align="center">🛒 Enlizzo – IITD Student-Only Marketplace (PWA)</h1>

<p align="center">
  A modern, private marketplace for IIT Delhi students to buy, sell, and donate used items with a strict 60% price cap.
</p>

<br />

<p align="center">
  <img src="https://img.shields.io/badge/Status-Active-success" />
  <img src="https://img.shields.io/badge/PRs-Welcome-blueviolet" />
  <img src="https://img.shields.io/github/license/RahulEntreprX/Enlizzo" />
  <img src="https://img.shields.io/badge/Built%20With-React%20%2B%20Vite-61DAFB" />
  <img src="https://img.shields.io/badge/Backend-Supabase-3ECF8E" />
  <img src="https://img.shields.io/badge/PWA-Ready-ffcc00" />
  <img src="https://img.shields.io/badge/Made%20For-IIT%20Delhi-orange" />
</p>

<br />

<hr />

## 🚀 Overview

**Enlizzo** is a campus-focused marketplace built exclusively for **IIT Delhi students**.  
It allows students to:

- Buy pre-owned items at a maximum of **60% of original price**
- Sell items through a simple listing workflow
- Donate items (₹0 price)
- Use an installable **PWA** for smooth, app-like experience

Tech stack: **React + TypeScript + Vite + Supabase**

<hr />

## ✨ Key Features

### 🔐 IITD-Only Authentication
- Supabase-powered OTP / Magic Link login  
- Only IIT Delhi email addresses allowed  
- Persistent sessions for “stay logged in” experience  

### 🛍 Smart Marketplace
- Scrollable feed with infinite-style UX  
- Filters: **hostel**, **category**, **condition**, **price**
- Product card + product details page

### 📝 Listing Creation
- Validations (including **60% MRP cap**)  
- Upload multiple images  
- Donation mode  
- Expiry & status tracking  

### 👤 Profile & User Features
- User profile page (name, hostel, avatar)  
- User’s listings  
- Saved items  
- Recently viewed items  

### 📱 Progressive Web App
- Install prompt (`InstallPwaPopup.tsx`)  
- Offline-friendly service worker  
- Touch-optimized UI  

### 🎨 Modern UX
- Lightweight glassmorphism + gradients  
- Responsive and mobile-first  

<hr />

## 🧱 Database Schema (Supabase)

The current schema (from your uploaded diagram):

### **profiles**
| column | type |
|--------|-------|
| id (PK → auth.users.id) | uuid |
| email | text |
| name | text |
| hostel | text |
| avatar_url | text |
| phone | text |
| role | text |
| year | text |
| bio | text |
| is_banned | bool |
| deletion_requested_at | timestamptz |
| theme | text |
| created_at | timestamptz |

---

### **listings**
| column | type |
|--------|-------|
| id | uuid |
| seller_id | uuid |
| title | text |
| description | text |
| price | numeric |
| original_price | numeric |
| category | text |
| condition | text |
| images | text[] |
| status | text |
| type | text |
| is_donation | bool |
| payment_status | text |
| expires_at | timestamptz |
| created_at | timestamptz |

---

### **saved_items**
| column | type |
|--------|-------|
| user_id | uuid |
| listing_id | uuid |
| created_at | timestamptz |

---

### **recently_viewed**
| column | type |
|--------|-------|
| id | uuid |
| user_id | uuid |
| listing_id | uuid |
| viewed_at | timestamptz |

---

### **reports**
| column | type |
|--------|-------|
| id | uuid |
| listing_id | uuid |
| reporter_id | uuid |
| reason | text |
| created_at | timestamptz |

<hr />

## 📁 Project Structure (Updated to Your Actual Folder Tree)

```

ENLIZZO-V1_0/
├── components/
│   ├── Button.tsx
│   ├── InstallPwaPopup.tsx
│   ├── LoginModal.tsx
│   ├── Navbar.tsx
│   ├── ProductCard.tsx
│   ├── ProductCardSkeleton.tsx
│   ├── PullToRefresh.tsx
│   └── ...
│
├── contexts/
│   └── AuthContext.tsx
│
├── lib/
│   └── supabase.ts
│
├── pages/
│   ├── AdminPanel.tsx
│   ├── LandingPage.tsx
│   ├── ListingForm.tsx
│   ├── Marketplace.tsx
│   ├── ProductDetails.tsx
│   └── Profile.tsx
│
├── services/
│   └── db.ts
│
├── supabase/
│   └── schema.sql
│
├── pwa-192x192.png.png
├── pwa-512x512.png.png
├── manifest.json
├── metadata.json
├── service-worker.js
├── App.tsx
├── index.tsx
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts

```


<hr />

## ⚙️ Getting Started

### 1️⃣ Clone the Repository

```
h
git clone https://github.com/RahulEntreprX/Enlizzo.git
cd Enlizzo
```


### 2️⃣ Install Dependencies

```
h
npm install
```

### 3️⃣ Configure Environment Variables

Create `.env.local`:

```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_KEY=your-supabase-anon-key
```

### 4️⃣ Run Dev Server

```
h
npm run dev
```

<hr />

## 📦 Build for Production

```
h
npm run build
```

<hr />

## 🛡 Security

* Only authenticated IITD users can access internal pages
* RLS policies in Supabase recommended
* AdminPanel protected

<hr />

## 🤝 Contributing

Contributions and ideas are welcome.

<hr />

## 👨‍💻 Author

**Rahul (Unleasher IN)**
Builder • Student • Campus Tools Enthusiast
