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

<h2>🚀 Overview</h2>

<p>
  <strong>Enlizzo</strong> is a campus-focused marketplace built exclusively for
  <strong>IIT Delhi students</strong>. It makes it easy to:
</p>

<ul>
  <li>Buy pre-owned items at a maximum of <strong>60% of original price</strong></li>
  <li>Sell items you no longer need to other IITD students</li>
  <li>Donate items for free within the campus community</li>
  <li>Access everything through a fast, installable <strong>PWA</strong></li>
</ul>

<p>
  The project is built using <strong>React + TypeScript + Vite</strong> on the frontend and
  <strong>Supabase</strong> for authentication, database and storage.
</p>

<hr />

<h2>✨ Key Features</h2>

<ul>
  <li>
    <strong>🔐 IITD-Only Authentication</strong>
    <ul>
      <li>Supabase-powered login using OTP / Magic Link</li>
      <li>Only IITD email IDs are allowed</li>
      <li>Session persistence for smoother “stay logged in” experience</li>
    </ul>
  </li>

  <li>
    <strong>🛍 Smart Marketplace</strong>
    <ul>
      <li>Explore listings in a feed similar to e-commerce apps</li>
      <li>Filter by <strong>hostel</strong>, <strong>category</strong>, and <strong>price</strong></li>
      <li>Beautiful product cards with quick info</li>
      <li>Detailed product page with full description and seller contact</li>
    </ul>
  </li>

  <li>
    <strong>📝 Frictionless Listings</strong>
    <ul>
      <li>Simple listing form with validation</li>
      <li>Image uploads via Supabase Storage (planned/available)</li>
      <li>Automatic enforcement of maximum 60% price</li>
    </ul>
  </li>

  <li>
    <strong>👤 Profile & Listings Management</strong>
    <ul>
      <li>User profile page for basic details</li>
      <li>View all your current listings</li>
      <li>Edit or remove items easily</li>
    </ul>
  </li>

  <li>
    <strong>📱 Progressive Web App (PWA)</strong>
    <ul>
      <li>Installable on mobile and desktop via browser prompt</li>
      <li><code>InstallPwaPopup.tsx</code> for smart “Add to Home Screen” UX</li>
      <li><code>service-worker.js</code> for caching and offline-friendly behavior</li>
    </ul>
  </li>

  <li>
    <strong>🎨 Modern UI & UX</strong>
    <ul>
      <li>Glassmorphism-inspired aesthetic</li>
      <li>Minimal, clean components: <code>Navbar</code>, <code>ProductCard</code>, <code>LoginModal</code>, etc.</li>
      <li>Mobile-first layout for smooth usage on phones</li>
    </ul>
  </li>
</ul>

<hr />

<h2>🧱 Tech Stack</h2>

<table>
  <tr>
    <th align="left">Layer</th>
    <th align="left">Technology</th>
  </tr>
  <tr>
    <td>Frontend</td>
    <td>React, TypeScript, Vite</td>
  </tr>
  <tr>
    <td>State / Context</td>
    <td>React Context API (<code>AuthContext</code>)</td>
  </tr>
  <tr>
    <td>Backend & Auth</td>
    <td>Supabase (Auth, Database, Storage)</td>
  </tr>
  <tr>
    <td>PWA</td>
    <td>Manifest + Service Worker</td>
  </tr>
  <tr>
    <td>Build Tool</td>
    <td>Vite</td>
  </tr>
  <tr>
    <td>Language</td>
    <td>TypeScript</td>
  </tr>
</table>

<hr />

<h2>📁 Project Structure</h2>

<pre>
<code>
ENLIZZO-LAZY/
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
│   └── AuthContext.tsx          # Handles auth state + Supabase sessions
│
├── lib/
│   └── supabase.ts              # Supabase client configuration
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
│   └── db.ts                    # Database helper abstractions
│
├── supabase/
│   └── schema.sql               # Database schema for core tables
│
├── manifest.json                # PWA manifest
├── metadata.json
├── service-worker.js            # Service worker logic
├── App.tsx                      # Root application component
├── index.tsx                    # Entry point
├── index.html                   # HTML template
├── package.json
├── tsconfig.json
└── vite.config.ts
</code>
</pre>

<hr />

<h2>⚙️ Getting Started</h2>

<h3>1️⃣ Clone the Repository</h3>

<pre>
<code>
git clone https://github.com/RahulEntreprX/Enlizzo.git
cd Enlizzo
</code>
</pre>

<h3>2️⃣ Install Dependencies</h3>

<pre>
<code>
npm install
</code>
</pre>

<h3>3️⃣ Configure Environment Variables</h3>

<p>Create a <code>.env.local</code> file in the project root:</p>

<pre>
<code>
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_KEY=your-supabase-anon-key
</code>
</pre>

<h3>4️⃣ Run the App in Development Mode</h3>

<pre>
<code>
npm run dev
</code>
</pre>

<p>Open the printed local URL (usually <code>http://localhost:5173</code>) in your browser.</p>

<hr />

<h2>📦 Build for Production</h2>

<pre>
<code>
npm run build
</code>
</pre>

<p>
  Deploy the generated <code>dist/</code> folder using platforms like
  <strong>Vercel</strong>, <strong>Netlify</strong>, or any static hosting service.
</p>

<hr />

<h2>🛡 Security & Access</h2>

<ul>
  <li>Only authenticated users can access the internal marketplace pages</li>
  <li>Supabase Row Level Security (RLS) can be used to restrict data access</li>
  <li>Sessions are persisted using Supabase’s auth/session handling</li>
  <li><code>AdminPanel</code> is meant for restricted administrative operations</li>
</ul>

<hr />

<h2>🤝 Contributing</h2>

<p>
  Contributions, feature suggestions, and issue reports are welcome! Feel free to:
</p>

<ul>
  <li>Open an issue for bugs or new ideas</li>
  <li>Submit a pull request with improvements</li>
  <li>Discuss new features tailored for the IITD community</li>
</ul>

<hr />

<h2>👨‍💻 Author</h2>

<p>
  <strong>Rahul (Unleasher IN)</strong><br />
  Builder • Student • Campus Tools Enthusiast
</p>

<p>
  If you’re from IIT Delhi and want to collaborate or extend Enlizzo,
  feel free to reach out or open a discussion on the repository.
</p>
