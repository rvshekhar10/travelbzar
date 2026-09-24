# TRAVEL BZAR — Premium Cab Service (PWA)

> **Comfort • Safety • Reliability**  
> *Dhanbad, Jharkhand, India*  
> Dedicated premium cab service managing a curated 2-vehicle fleet with full role-based experiences for **Customers**, **Drivers**, and **Owner/Admin**.

[![Next.js 15+](https://img.shields.io/badge/Next.js-15%2B-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%7C%20Firestore-orange?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind-CSS%20v4-38bdf8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable-purple?style=for-the-badge&logo=pwa)](https://web.dev/progressive-web-apps/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/)

---

## 1. Project Overview

**TRAVEL BZAR** is a production-grade Progressive Web App (PWA) built specifically for a boutique, premium chauffeur and cab service operating out of Dhanbad, Jharkhand. Unlike generic taxi aggregators or ride-pooling clones, Travel BZAR is designed around personalized, highly reliable chauffeur service with guaranteed cabs, clean vehicles, professional drivers, transparent pricing, and direct owner oversight.

### Key Capabilities
- **Curated 2-Vehicle Fleet Model**: Strictly enforces maximum 2-vehicle capacity with automated conflict prevention (30-minute buffer window).
- **Three Dedicated Persona Dashboards**:
  - **Customer PWA (Mobile-First)**: Step-by-step booking wizard, live fare quotes, active driver GPS tracking, digital receipts, booking history.
  - **Driver Console (Mobile-First)**: One-tap status progressions (`ARRIVED AT PICKUP` → `START TRIP` → `COMPLETE & COLLECT PAYMENT`), periodic live GPS broadcasting (6-second intervals), click-to-call, external Google Maps navigation.
  - **Owner / Admin Headquarters (Desktop & Mobile)**: Real-time business KPIs, 2-vehicle availability board, driver assignment, booking management & approval, conflict detection alerts, rate configuration, analytics & CSV export, print-ready PDF/paper receipts.
- **Rate-Card Faithful Pricing Engine**:
  - Local City Package: 8 Hours / 80 KM @ ₹2,400 (Extra KM: ₹14/km, Extra Hour: ₹150/hr).
  - Airport Packages: Ranchi (₹3,500–₹4,000), Deoghar (₹3,000–₹3,200), Durgapur (₹2,500–₹3,000).
  - Flight Delay Protection: Fixed ₹500 waiting fee for up to 4 hours delay; delays >4 hours automatically flag **"OWNER REVIEW REQUIRED"**.
  - Night Charges: ₹300 fixed for trips starting between 10:00 PM and 6:00 AM (applied once).
  - Waiting Charges: 15 minutes free, ₹3/minute thereafter.
  - Cleaning & Extras: ₹500–₹1,500 cleaning surcharge, parking, toll, state taxes.
  - **Immutable Pricing Snapshots**: Stored on every booking so historical trips never change when master rates are updated.
- **Dual-Mode Resilient Data Architecture**: Works seamlessly with live Google Cloud Firestore and provides zero-crash local synchronization so all demo workflows function immediately even while GCP Cloud Console APIs are being enabled.

---

## 2. Tech Stack

- **Framework**: [Next.js 15+ (App Router)](https://nextjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/) with strict type checking
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with brand color palette derived from the Travel BZAR rate card:
  - Deep Navy: `#061B33`
  - Dark Blue: `#0B223D`
  - Primary Green: `#078A32`
  - Bright Green: `#42B900`
  - Airport Orange/Red: `#F0441D`
  - Light Background: `#F5F7F5`
  - Dark Text: `#132238`
- **Backend & Auth**: [Firebase](https://firebase.google.com/) (Authentication, Firestore, Storage)
- **Maps & Geolocation**: [Google Maps Platform](https://developers.google.com/maps) (Maps JavaScript API, Routes/Directions API, Geocoding)
- **Icons**: [Lucide React](https://lucide.dev/)
- **PWA**: Web App Manifest (`manifest.json`), Service Worker (`sw.js`), mobile install banner, standalone display mode
- **Deployment**: [Vercel](https://vercel.com/)

---

## 3. Local Development

### Prerequisites
- Node.js 18.17+ or 20+
- npm, yarn, or pnpm

### Quick Start
```bash
# 1. Clone repository
git clone <repo-url>
cd travelBzar

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env.local

# 4. Start development server
npm run dev -- -p 3001
```

Visit [http://localhost:3001](http://localhost:3001) in your browser.

---

## 4. Firebase Project Setup

1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Create a new Firebase project (e.g. `travelbzar-d92d3`).
3. Under Project Settings > General, click the **Web (`</>`)** icon to register a web app.
4. Copy the Firebase configuration object keys into your `.env.local` file.

---

## 5. Firebase Authentication Setup

1. In Firebase Console, navigate to **Build > Authentication**.
2. Click **Get Started**.
3. Under the **Sign-in method** tab, enable **Email/Password**.
4. (Optional) For production phone verification, enable Phone Auth.

---

## 6. Firestore Setup

1. In Firebase Console, navigate to **Build > Firestore Database**.
2. Click **Create Database**.
3. Select a location close to your users (e.g., `asia-south1` for Mumbai/India).
4. Start in **Production mode** (security rules provided below).
5. The application will automatically initialize the following collections upon first run:
   - `users`: User profiles with role (`customer` | `driver` | `owner`)
   - `bookings`: Central booking lifecycle records
   - `vehicles`: Max 2 active fleet records
   - `drivers`: Driver profiles and assignment status
   - `pricingConfig`: Centralized business rate configurations
   - `driverLocations`: Real-time driver GPS telemetry
   - `notifications`: User notifications center
   - `bookingEvents`: Audit log trail for all status transitions

---

## 7. Firebase Storage Setup

1. In Firebase Console, navigate to **Build > Storage**.
2. Click **Get Started** and select your preferred storage bucket location.
3. Used for vehicle inspection photos, driver profile photos, and document uploads.

---

## 8. Firebase Cloud Messaging (FCM) Setup

1. In Firebase Console, navigate to **Project Settings > Cloud Messaging**.
2. Generate a Web Push certificate key pair (VAPID key).
3. The app includes an in-app fallback notification center (`/customer/notifications`, `/driver/notifications`, `/owner/notifications`) so notification delivery never blocks critical booking or trip execution workflows.

---

## 9. Firestore Indexes Required

The required composite indexes are defined in `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "bookings",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "customerId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "bookings",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "driverId", "order": "ASCENDING" },
        { "fieldPath": "bookingDate", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "bookings",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "bookingDate", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "notifications",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

To deploy indexes using Firebase CLI:
```bash
npx firebase-tools deploy --only firestore:indexes
```

---

## 10. Firestore Security Rules

Production-grade rules are defined in `firestore.rules`. Deploy using:
```bash
npx firebase-tools deploy --only firestore:rules
```

Key security principles enforced:
- **Customers**: Can only read and write their own profile; create bookings where `customerId == request.auth.uid`; view their own bookings and driver info once assigned; read live driver GPS location for their active trip. Cannot alter confirmed fares.
- **Drivers**: Can read assigned bookings; update allowed trip statuses (`DRIVER_ARRIVED`, `TRIP_STARTED`, `TRIP_COMPLETED`); broadcast GPS coordinates only while in `TRIP_STARTED` state; cannot view or edit business pricing.
- **Owners**: Full administrative read/write access across all collections.

---

## 11. Google Maps APIs Required

To enable full mapping, routing, and live driver tracking, activate the following in [Google Cloud Console](https://console.cloud.google.com/):

1. **Maps JavaScript API**: Renders interactive map canvas, custom cab markers, and live routes.
2. **Routes API / Directions API**: Computes road distances and estimated travel durations between pickup and destination.
3. **Geocoding API**: Translates user addresses and GPS coordinates.
4. **Places API (New)** *(Optional)*: Address autocomplete for pickup and drop inputs.

---

## 12. Google Maps API Key Configuration

1. In Google Cloud Console, navigate to **APIs & Services > Credentials**.
2. Click **Create Credentials > API key**.
3. Under **API restrictions**, restrict the key to the 4 APIs listed above.
4. Under **Application restrictions**, set HTTP referrers to your local development domain and your Vercel production domain:
   - `http://localhost:3000/*`
   - `http://localhost:3001/*`
   - `https://your-travelbzar-domain.vercel.app/*`
5. Place the key in `.env.local` as `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.

---

## 13. Environment Variables

Create a `.env.local` file from `.env.example`:

```bash
# Firebase Client Configuration
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSy..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="travelbzar-d92d3.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="travelbzar-d92d3"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="travelbzar-d92d3.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="113802910805"
NEXT_PUBLIC_FIREBASE_APP_ID="1:113802910805:web:..."
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="G-..."

# Google Maps Platform
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="AIzaSy..."

# Application URL
NEXT_PUBLIC_APP_URL="http://localhost:3001"

# Business Information
NEXT_PUBLIC_BUSINESS_PHONE="+91 9007210697"
NEXT_PUBLIC_BUSINESS_WHATSAPP="+91 9007210697"
NEXT_PUBLIC_BUSINESS_EMAIL="support@travelbzar.com"
NEXT_PUBLIC_BUSINESS_LOCATION="Dhanbad, Jharkhand, India"
```

---

## 14. PWA Setup & Installation

- **Manifest**: Located at `public/manifest.json`, specifying theme color (`#061B33`), background (`#F5F7F5`), and standalone display mode.
- **Service Worker**: Registered via `public/sw.js` for caching static app shell and offline fallback.
- **Icons**: 192x192 and 512x512 icons generated in `public/icons/`.
- **Install Prompt**: An unobtrusive prompt appears on mobile devices permitting one-tap home screen installation on iOS (Safari Add to Home Screen) and Android (Chrome WebAPK).

---

## 15. Vercel Deployment

1. Push your repository to GitHub or GitLab.
2. In [Vercel](https://vercel.com/), click **New Project** and import your repository.
3. In the project settings, add all environment variables from `.env.example`.
4. Click **Deploy**. Vercel will automatically build and deploy the Next.js application.

---

## 16. Demo Users (1-Click Switcher)

The application includes an instant **Demo Persona Switcher** on the login page (`/login`) allowing rapid testing without needing to type credentials:

| Persona | Email | Role | Access |
| :--- | :--- | :--- | :--- |
| **Owner / Admin** | `owner@travelbzar.com` | `owner` | `/owner` (Full dashboard, fleet, pricing, revenue) |
| **Driver (Rajesh Kumar)** | `driver@travelbzar.com` | `driver` | `/driver` (Trip execution console, live GPS sharing) |
| **Customer (Amit Sharma)**| `customer@travelbzar.com` | `customer` | `/customer` (Booking wizard, live tracking, receipts) |

Default password for all demo accounts: `travelbzar123`

---

## 17. Business Pricing Configuration

All business rates are configured in `config/business.ts` and can be dynamically edited by the Owner at `/owner/pricing`:

```typescript
export const DEFAULT_PRICING_CONFIG = {
  // Local City Package
  localBaseFare: 2400,          // 8 Hours / 80 KM
  localIncludedHours: 8,
  localIncludedKm: 80,
  localExtraKmRate: 14,         // ₹14 per extra KM
  localExtraHourRate: 150,      // ₹150 per extra Hour

  // Airport Fixed Ranges
  airports: {
    ranchi: { minFare: 3500, maxFare: 4000 },
    deoghar: { minFare: 3000, maxFare: 3200 },
    durgapur: { minFare: 2500, maxFare: 3000 },
  },

  // Flight Delay Protection
  airportDelayCharge: 500,      // Fixed ₹500 for up to 4 hours delay
  airportDelayMaxHours: 4,      // Delays > 4 hours require owner manual review

  // Waiting Charges
  waitingFreeMinutes: 15,       // First 15 minutes free
  waitingRatePerMinute: 3,      // ₹3 per minute thereafter

  // Night Charge
  nightCharge: 300,             // ₹300 fixed for pickups between 10:00 PM and 6:00 AM
  nightStartHour: 22,
  nightEndHour: 6,

  // Cleaning Charges
  cleaningMinFare: 500,
  cleaningMaxFare: 1500,

  // Buffer
  bookingBufferMinutes: 30,     // Automated overlap conflict detection
};
```

---

## 18. How to Test Customer Workflow

1. Open `/login` and click **"Customer Demo"**.
2. Click **"Book a Cab"** or navigate to `/customer/book`.
3. **Step 1 (Type)**: Select **Airport Pickup**, choose **Ranchi Airport**.
4. **Step 2 (Locations)**: Set pickup to `Ranchi Airport Terminal` and drop to `Bank More, Dhanbad`.
5. **Step 3 (Date & Time)**: Select tomorrow's date at `10:30 AM`. Enter Flight Number `6E-2451` and Expected Arrival `10:00 AM`.
6. **Step 4 (Fare Estimate)**: Verify the fare engine calculates road distance (~150 km) and displays the configured estimated range: **₹3,500 – ₹4,000**.
7. **Step 5 (Confirmation)**: Review and submit. Booking status becomes `PENDING_CONFIRMATION` with booking ID `TBZ-YYYYMMDD-XXX`.

---

## 19. How to Test Owner Workflow

1. Open `/login` and switch to **"Owner Demo"**.
2. Navigate to `/owner/bookings` and locate the new booking.
3. Click on the booking to view details:
   - Notice the **Vehicle Availability** status showing available cabs.
   - Enter the agreed final fare (e.g. `₹3,800` within the ₹3,500–₹4,000 range).
   - Assign Vehicle: `Hyundai Venue (JH-10-BX-4421)`
   - Assign Driver: `Rajesh Kumar (+91 98765 43210)`
4. Click **"Confirm & Assign Driver"**.
5. Booking status transitions to `DRIVER_ASSIGNED`. An audit timeline event is logged.

---

## 20. How to Test Driver Workflow & Live Tracking

1. Open `/login` in a new tab or incognito window and click **"Driver Demo"**.
2. In the Driver Dashboard (`/driver`), Rajesh Kumar sees the assigned trip in **"Current Active Trip"**.
3. Click **"Open Trip Console"** (`/driver/trip/[id]`).
4. Click **"Mark Arrived at Pickup"** (status becomes `DRIVER_ARRIVED`).
5. Click **"Start Trip"**:
   - Status updates to `TRIP_STARTED`.
   - Live location sharing begins automatically (broadcasting coordinates every 6 seconds).
6. Switch back to the **Customer tab** (`/customer/bookings/[id]`):
   - Notice the map updates in real time with the driver's current coordinates.
   - The status bar reflects *"Driver is on the way • Updated just now"*.
7. Back in the **Driver tab**, click **"Complete Trip & Collect Payment"**:
   - Enter final parking/toll charges (if applicable).
   - Select Payment Method: `UPI` or `CASH`.
   - Click **"Mark Paid & Finish Trip"**.
8. Live location sharing terminates immediately.
9. In the **Owner Dashboard** (`/owner`), today's completed trips and total revenue immediately reflect the new collected amount.
10. Click **"View Receipt"** to print or save the digital tax invoice.

---

## Business Contact & Support
- **Company**: Travel BZAR
- **Location**: Dhanbad, Jharkhand, India
- **Phone / WhatsApp**: +91 9007210697
- **Email**: support@travelbzar.com
