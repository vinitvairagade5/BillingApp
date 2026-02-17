# SaaS Transformation Master Roadmap & Implementation Plan

This document is the **Single Source of Truth** for the conversion of BillingApp into a professional SaaS product and reusable Core Framework. All work is being performed on the `development` branch.

---

## 🛠️ Phase 0: Common Core Framework (Infrastructure)
*Goal: Extract reusable logic into shared libraries (`libs` and `.Core`) to launch future apps in days.*

* [x] **Backend Shared Library (`BillingApp.Core`)**
  * [x] Create .NET 8 Class Library & Solution Link.
  * [x] Migrate Entities (User, Bill, Customer, etc.).
  * [x] Migrate Database Connection logic.
  * [x] Implement JWT Identity Core.
  * [x] Create Base Controller & Standard Response Wrappers.
* [x] **Frontend Shared Library (`billing-app-shared`)**
  * [x] Create Angular Workspace for shared components.
  * [x] **BaseApiService**: One service to rule all API calls (automatic error handling).
  * [x] **Global Layout**: Reusable Sidebar, Topbar, and Footer with dynamic menus.
  * [x] **UI Kit**: Premium glassmorphism cards, buttons, and alert/modal system.

---

## 🏁 Phase 1: Security & Identity (Foundation)
*Goal: Professional-grade data protection.*

* [x] **Implement JWT Authentication**
  * Replace insecure login with encrypted tokens.
  * Secure all API endpoints with `[Authorize]`.
* [x] **Enhanced User Profiles**
  * Persistent shop details (GSTIN, Address, Logo). (Partially complete, backend/frontend integrated).

---

## 💰 Phase 2: Revenue & Subscriptions
*Goal: Turn the app into a business.*

* [x] **Subscription Guard Logic**
  * `SubscriptionType` (Free/Pro) and `ExpiryDate`.
  * "Gatekeeping" (e.g., Free users get limited invoices).
* [x] **Activation Codes (Cash/Referral Engine)**
  * [x] Admin tool for manual code generation (for cash payments).
  * [x] User redemption page.
* [x] **Referral System**
  * Multi-user growth engine (Get free Pro days for inviting friends).
  * Referral tracking dashboard with statistics.
  * Bonus days calculation (7 days per active PRO referral).

---

## 📦 Phase 3: Core Business Value (Clothing Shop Niche)
*Goal: Features that make Nagpur shop owners love the app.*

* [x] **Udhaar (Credit) Management**
  * Track balances and produce customer ledgers.
* [x] **Inventory / Low-Stock Alerts**
  * Auto-stock deduction and dashboard warnings.

---

## 🚀 Phase 4: Advanced Scaling
*Goal: Professional automation.*

* [ ] **UPI Payment Integration**
  * Store `UpiId` in Shop Settings.
  * "Pay via UPI" button on Invoice.
  * Popup with Dynamic QR Code (`upi://...`).
  * Manual "Payment Received" confirmation (Zero-fee flow).
* [ ] **Excel Exports** (CA-ready reports).
* [ ] **Official WhatsApp API** (Background PDF sending - Optional Add-on).
* [ ] **Android App (Capacitor)**
  * Wrapper for Play Store deployment.
  * Access to native features (Camera for barcode scanning).

---
*Last Updated: 25-Jan-2026*
