# 🎥 Demonstration Script (3-5 mins)

## Setup & Goal
**Goal:** Show a robust, predictive, and secure infrastructure asset management tool tailored for government processes.
**Narrative:** We will follow the lifecycle of a single critical asset (HERO-001) while demonstrating Role-Based Access Control (RBAC) and our unique "Predictive Flagging" capability.

---

### Scene 1: The Manager's Overview (1 minute)
* **Login:** Sign in as \`manager@city.gov\` (Password: \`password\`).
* **Dashboard:** 
  * "Welcome to the Manager Dashboard. Immediately, we can see high-level KPIs."
  * Point out the "Assets at Risk" widget in red. Explain: *"Instead of just tracking assets, our system calculates predictive health by weighing the condition score against the asset's expected useful life."*
  * Show the interactive Pie Chart (Assets by Status).
* **Map View:**
  * Click on the Sidebar -> **Map View**.
  * "Here we have a geospatial cluster of our assets. Notice how the markers are color-coded by lifecycle status."
  * Click on a green marker (In Service) and a yellow marker (Under Maintenance).

### Scene 2: The Hero Asset (1.5 minutes)
* **Asset Registry:** 
  * Click on Sidebar -> **Asset Registry**.
  * Use the search bar: type "HERO-001".
  * Click **View** on the right.
* **Asset Detail Page:**
  * "This is a detailed view. On the right, we have a server-enforced **Lifecycle Timeline**. You can see exactly when this asset was Commissioned, went Into Service, and eventually failed."
  * Scroll down to the embedded map showing the asset's exact location.
  * Scroll to **Work Orders**: Point out the critical open work order assigned to the HERO asset.

### Scene 3: Role-Based Enforcement (1 minute)
* **Action:** As the Manager, click **Transition to Disposed**. 
  * *Watch it succeed.* (The manager is authorized to dispose of assets).
* **Logout & Login as Inspector:**
  * Click **Sign Out** on the sidebar.
  * Sign in as \`inspector@city.gov\`.
  * Go back to the Asset Registry -> "HERO-001" (Now Disposed).
  * *Notice:* The Inspector does not have the option to transition it back, or if they try, it is blocked.
  * Try a manual API attack (optional for recording): Show that the backend explicitly rejects invalid transitions (e.g., Planned -> Disposed).

### Scene 4: Immutability & Audit (0.5 minutes)
* **Login as Auditor:**
  * Sign out and sign back in as \`auditor@city.gov\`.
  * (If time permits, show the raw database query or API response for `/audit-logs` that proves the Manager's action was permanently logged with a timestamp).
  * "Government compliance requires immutability. Every single action taken today was logged to a tamper-proof audit trail."

---
*End Recording.*
