---
stepsCompleted: ["step-01-init", "step-02-discovery", "step-02b-vision", "step-02c-executive-summary"]
inputDocuments:
  - "_bmad-output/planning-artifacts/product-brief-portail-mediatheque-conviale.md"
  - "_bmad-output/planning-artifacts/product-brief-portail-mediatheque-conviale-distillate.md"
workflowType: 'prd'
classification:
  projectType: web_app
  domain: general
  complexity: low
  projectContext: greenfield
---

# Product Requirements Document - portail-mediatheque-conviale

**Author:** Sezratty
**Date:** 2026-04-11

## Executive Summary

The **Portail Médiathèque Conviviale** is a publicly accessible web portal that transforms a 60-book physical library at a French ESN into a discoverable, visually engaging catalog — accessible from any device, without login or VPN. The portal's purpose is not library management: it is a conversation starter. Employees browse the collection, read the curator's personal notes on each book, and walk over to pick one up — or stop by to discuss it. The primary value is driving physical visits and reading conversations, not tracking inventory.

The portal serves two audiences: all company employees (public access, no friction) who want to know what's worth reading before making the effort to visit; and the library animator (authenticated admin) who manages the collection from a smartphone in under 60 seconds per book using ISBN barcode scanning and API-powered auto-fill.

### What Makes This Special

The curator is the product. Every book carries a personal note — why it's worth reading, who it's for — authored by the animator. No algorithm, recommendation engine, or social layer replaces this. The homepage surfaces two distinct editorial signals: **"Recently Added"** (automatic, recency-sorted) and **"Sélection du mois"** (manually curated by the animator, renewed monthly). Together they give colleagues a reason to check back regularly, and give the animator a publishing rhythm that keeps the portal alive.

There is no competing solution that fits this exact context: physical corporate catalog, sovereign French hosting, ISBN-scan admin UX, no loan management, no enterprise pricing.

### Project Classification

| Attribute | Value |
|-----------|-------|
| Project Type | Web application (Angular SPA + .NET REST API) |
| Domain | Internal knowledge sharing / corporate library |
| Complexity | Low — ~60 books, read-heavy, SQLite, no regulated domain |
| Project Context | Greenfield |
