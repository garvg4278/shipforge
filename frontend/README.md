# ShipForge — Logistics Order Form & Live Preview

A production-ready, design-first logistics order management application built with Next.js 14 (App Router), TypeScript, and CSS Modules.

---

## 🚀 Live Demo

> Deploy to Vercel (see [Deployment Guide](#deployment)) and paste your link here.

---

## ✨ Features

- **Two-panel layout** — Order form on the left, live shipment preview on the right
- **Real-time preview** — Every keystroke instantly reflects in the preview panel
- **Dynamic packages** — Add / remove packages with minimum-1 enforcement
- **Auto-generated Order ID** — Unique ID created on page load
- **Delivery type picker** — Visual Standard vs Express selector
- **Special handling flags** — Fragile and Insurance checkboxes with visual badges
- **Calculated totals** — Total packages, weight, and declared value
- **Form validation** — JavaScript-based validation with per-field error messages
- **Fully responsive** — Desktop two-column → tablet/mobile stacked layout
- **Sticky preview panel** — Preview stays visible while scrolling the form on desktop
- **Subtle animations** — Slide-in for new packages, fade-in for success state, live indicator pulse
- **Accessible** — ARIA labels, roles, semantic HTML, keyboard navigable
- **No UI framework** — Pure CSS Modules, no Tailwind, no MUI, no Chakra

---

## 🗂 Project Structure

```
/
├── app/
│   ├── layout.tsx          # Root layout, fonts, CSS variables (design tokens)
│   ├── layout.module.css   # Global design token definitions
│   ├── page.tsx            # Page — state management, data flow
│   └── page.module.css     # Two-column workspace layout
│
├── components/
│   ├── OrderForm/
│   │   ├── OrderForm.tsx         # Main form orchestrator
│   │   └── OrderForm.module.css
│   ├── LivePreview/
│   │   ├── LivePreview.tsx       # Real-time preview panel
│   │   └── LivePreview.module.css
│   ├── PackageCard/
│   │   ├── PackageCard.tsx       # Individual package entry card
│   │   └── PackageCard.module.css
│   └── ui/
│       ├── AppHeader/            # Top navigation bar
│       ├── FormSection/          # Reusable section wrapper
│       ├── InputField/           # Reusable form input
│       ├── AddressBlock/         # Sender/Receiver address grid
│       ├── DeliveryTypePicker/   # Standard vs Express visual picker
│       └── CheckboxField/        # Fragile/Insurance toggle cards
│
├── types/
│   └── index.ts            # TypeScript interfaces
│
├── utils/
│   └── index.ts            # generateOrderId, formatCurrency, validateForm, etc.
│
└── public/                 # Static assets
```

---

## 🧠 Architecture

### State Management
All form state lives in `page.tsx` via `useState`. Callbacks are wrapped in `useCallback` to prevent unnecessary re-renders. The `LivePreview` receives state as props and memoized with `useMemo` for computed values (totalWeight, totalValue).

### Data Flow
```
page.tsx (state owner)
  ├── → OrderForm (form input)
  │     └── → FormSection, InputField, PackageCard, etc.
  └── → LivePreview (read-only display)
```

### Component Design
- All leaf components are wrapped in `React.memo` to skip re-renders when props haven't changed.
- `useCallback` on all handlers prevents child re-renders.
- CSS Modules with BEM-inspired naming (`block__element--modifier` flattened for module scoping).

---

## 🛠 Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | CSS Modules (no Tailwind, no UI lib) |
| Fonts | Syne (display) + DM Sans (body) via Google Fonts |
| State | React `useState` + `useCallback` + `useMemo` |
| Validation | Vanilla JS (no form libraries) |
| Deployment | Vercel |

---

## 💻 Setup & Run

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
git clone https://github.com/YOUR_USERNAME/logistics-order-form.git
cd logistics-order-form
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
npm run build
npm start
```

---

## 🚀 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full Vercel deployment steps.

---

## 🎨 Design

See [FIGMA_GUIDE.md](./FIGMA_GUIDE.md) for the complete design system (colors, typography, spacing).

---

## ✅ Assignment Checklist

- [x] Auto-generated Order ID
- [x] Shipment Date picker
- [x] Delivery Type (Standard / Express) visual picker
- [x] Consignor fields (Name, Address, City, Pincode)
- [x] Consignee fields (Name, Address, City, Pincode)
- [x] Dynamic package list (add/remove, min 1)
- [x] Per-package: Label, Weight, L×W×H, Declared Value
- [x] Fragile checkbox
- [x] Insurance checkbox
- [x] Live preview — Order ID, date, sender, receiver, delivery badge
- [x] Live preview — All packages list
- [x] Live preview — Total packages, weight, declared value
- [x] Visual indicators for Fragile and Insured
- [x] Responsive (desktop, tablet, mobile)
- [x] CSS Modules only — no inline styles, no global CSS, no CSS-in-JS
- [x] React + Next.js (App Router)
- [x] No external form libraries
- [x] No UI frameworks
- [x] Subtle animations
- [x] Empty/edge states
- [x] Basic accessibility

---

## 📄 License

MIT
