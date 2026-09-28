# Infrastructure Asset Inventory System - Upgrade Plan

## Current State Analysis
**Backend:** Node.js + Express with Better-SQLite3. Contains `users`, `assets`, `lifecycle_events`, `inspections`, `work_orders`, and `audit_logs` tables. 
**Frontend:** React, Vite, Tailwind v4. Has basic routing (Dashboard, Asset Registry, Map View, Asset Detail) and RBAC enforced on the UI.
**Shortcomings:** While functional, the system lacks advanced analytics, an overarching design system, modern mapping features, and the necessary complex workflows (approvals, kanban, citizen portal) to truly impress in a high-stakes product demo.

---

## Phase 1: Design System and UX
**Goal:** Establish a visually stunning, government-grade "command center" aesthetic.
- **Features:** 
  - Consistent design tokens, sidebar navigation, top bar with role badge.
  - Global Command Palette (`Ctrl+K`) for global search.
  - Dark/Light mode toggle.
  - Rich empty states, skeleton loaders, toast notifications.
  - Mobile-friendly Inspector view (bottom navigation).
- **File Changes:**
  - `frontend/index.css`: Add design tokens, Tailwind base layers.
  - `frontend/src/components/Sidebar.tsx`, `Topbar.tsx`, `CommandPalette.tsx`.
  - `frontend/src/App.tsx`: Layout refactoring.

## Phase 2: Intelligence Layer
**Goal:** Add predictive analytics and deep financial tracking.
- **Features:**
  - Asset Health & Risk Score (0-100) based on age, condition, fault frequency, and criticality.
  - Predictive Maintenance engine (recommendations & predicted failure window).
  - 5-Year Capital Planning view with interactive "budget cap" slider (What-If analysis).
  - Lifecycle Cost View (acquisition + cumulative maintenance).
- **Database Changes:** 
  - Add `criticality`, `acquisition_cost`, `predicted_failure_date` to `assets`.
- **File Changes:**
  - `backend/src/services/intelligence.ts` (New): Risk score and predictive algorithms.
  - `backend/src/index.ts`: New endpoints `/analytics/capital-plan`, `/assets/:id/risk-score`.
  - `frontend/src/pages/CapitalPlanning.tsx` (New).
  - `frontend/src/pages/AssetDetail.tsx`: Integrate risk breakdown & lifecycle charts.

## Phase 3: Advanced Workflows
**Goal:** Prove the application handles complex, real-world operational flows.
- **Features:**
  - Work Order Kanban Board (drag-and-drop, SLA timers).
  - Manager Approval Workflows (inbox for pending transitions/high-cost work orders).
  - Public Citizen Reporting Portal (no login, map picker, tracking ID).
  - QR Code Generation & Camera Scanning.
  - Bulk Import via CSV (with validation preview).
- **Database Changes:**
  - Add `approvals` table.
  - Add `citizen_reports` table.
- **File Changes:**
  - `frontend/src/pages/KanbanBoard.tsx` (New).
  - `frontend/src/pages/CitizenPortal.tsx` (New).
  - `frontend/src/components/ApprovalInbox.tsx` (New).
  - `backend/src/index.ts`: Add endpoints for `/citizen-reports`, `/work-orders/kanban`, `/approvals`.

## Phase 4: Geospatial and Analytics
**Goal:** Deliver a high-end GIS mapping experience and BI dashboards.
- **Features:**
  - Map Upgrades: Marker clustering, layer toggles, fault-density heatmap, ward choropleths.
  - Advanced Analytics Dashboard: MTTR (Mean Time to Repair), SLA compliance, Cost by Ward.
  - PDF/CSV Exports.
- **File Changes:**
  - `frontend/src/pages/MapPage.tsx`: Integrate Leaflet plugins (`react-leaflet-cluster`, Heatmap).
  - `frontend/src/pages/Dashboard.tsx`: Add advanced KPIs, trends, and filters.
  - `backend/src/services/reports.ts` (New).

## Phase 5: Trust, Security, and Quality
**Goal:** Bulletproof the system architecture to enterprise standards.
- **Features:**
  - Tamper-Evident Audit Log (hash-chaining with integrity verification and diff viewer).
  - Live Activity Feed (Server-Sent Events / WebSockets).
  - Dynamic Extensible Category System (JSON-based schema for assets).
  - Robust backend testing (RBAC, lifecycle, hash-chain).
- **Database Changes:**
  - Alter `audit_logs`: Add `previous_hash`, `current_hash`.
  - Alter `assets`: Add `attributes` (JSON).
- **File Changes:**
  - `backend/src/services/audit.ts` (New): Crypto hashing logic.
  - `backend/src/index.ts`: Add SSE endpoint `/events`.
  - `frontend/src/pages/AuditLogs.tsx`: Integrate integrity check button and diff viewer.

## Seed Data & Demo Script
- **Seed Script (`backend/src/db/seed.ts`):** 
  - Extend to span 2+ years of history.
  - Create the "Hero Asset" with a dramatic lifecycle (citizen report -> flagged risk -> approved -> repaired).
  - Generate 40+ citizen reports and pending approvals.
- **Demo Script (`docs/DEMO.md`):**
  - Write a 4-6 minute highly choreographed walkthrough highlighting the Intelligence Layer, Kanban, Citizen Portal, and Tamper-Evident logs.

---
**Next Step:** Awaiting your approval to begin executing **Phase 1: Design System and UX**.
