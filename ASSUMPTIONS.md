# Assumptions for Infrastructure Asset Inventory System

## Executive Vision
Instead of building a simple CRUD registry, this MVP is designed around **Proactive Asset Management**. Government infrastructure challenges are rarely about knowing *what* assets exist, but rather knowing *which assets will fail next* and *when to replace vs. repair*. 

## Scope & Unique Differentiators
- **Predictive Health Flagging:** The system automatically flags assets as "At Risk" based on age, condition deterioration, and cumulative maintenance costs.
- **Lifecycle State Machine:** Strict, server-enforced state transitions (Planned -> Procured -> Commissioned -> In Service -> Under Maintenance -> Decommissioned -> Disposed).
- **Geospatial Intelligence:** Assets are clustered on a map, allowing managers to visually identify failure hotspots.

## Roles & RBAC
- **Field Inspector**: Mobile worker identifying assets, logging initial details, reporting faults, and conducting inspections.
- **Department Manager**: Office-based supervisor managing the lifecycle, reviewing predictive flags, assigning work orders, and monitoring dashboards.
- **Admin/Auditor**: Compliance administrator verifying the immutable audit logs.

## Open Questions for Future Scalability
1. **Civic Engagement:** How can we integrate a public portal where citizens can report faults (e.g., dropped pin for a broken streetlight) that automatically queue as unverified inspections?
2. **ERP Integration:** Can we automatically transition an asset from 'Planned' to 'Procured' via webhooks from the government's financial/purchasing software?
3. **Advanced ML:** Once enough lifecycle data is collected, can we train a model on `condition_score` decay over time to better predict `expected_useful_life`?
