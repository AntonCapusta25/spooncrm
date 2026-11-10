# Spoonful Sales CRM & POS Dispatch

A tailor-made, Notion-inspired Field Sales CRM and POS Hardware Dispatch system built for Spoonful's Enschede operations.

## Architecture & Features

- **Notion Design System**: Calm warm canvas, hairline borders (`#EDEDEB`), Notion sidebar (`#F7F6F3`), page peek drawers, and pastel database status tags.
- **Mapbox Radar with Native GPU Clustering**: Clusters 834 Enschede venues into soft Notion badges (`[257]`, `[58]`), with district boundaries (`7511` Centrum, `7512`, `7513`, `7521`, etc.).
- **Field Sales Pipeline**: Discovered → Contacted → Meeting Scheduled → Contract Signed → POS Handover → Proof Attached → Onboarded.
- **Oleksandr's POS Dispatch Flow**: Sales reps hand over signed merchants to Oleksandr with terminal requirements. Oleksandr navigates on-site, snaps an in-app counter photo proof (uploaded to Supabase Storage `pos-proofs`), and verifies installation.
- **One-Click Hyperzod Merchant Provisioning**: Creates live merchants directly in Hyperzod API (`/admin/v1/merchant/create`, Tenant `8218`) and marks them onboarded.
- **Multi-Assignees & GPS Check-ins**: Assign multiple reps per lead, record GPS coordinates and visit notes on location.
- **Internal Notion Auth**: Internal work email/password gate (`sales@spoonful.nl`, `bangalexf@gmail.com`).

## Getting Started

```bash
npm install
npm run dev
```

Build for production:
```bash
npm run build
```
