---
title: "Product Brief: Portail Médiathèque Conviviale"
status: "complete"
created: "2026-04-11"
updated: "2026-04-11"
inputs: ["user-conversation", "open-library-api-research", "google-books-api-research", "sovereign-cloud-research"]
---

# Product Brief: Portail Médiathèque Conviviale

## Executive Summary

Most corporate libraries go unnoticed — not because employees aren't interested in reading, but because discovery requires a physical visit. The **Portail Médiathèque Conviviale** transforms a 60-book physical collection into a discoverable, visually inviting digital catalog accessible from any desk — or from home.

Built for a French IT services company (ESN), this internal web portal is a lightweight but polished storefront for a hand-picked library managed by its creator. Employees browse and filter the collection in seconds, see each book's cover and the animator's personal note on why it's worth reading, and walk over to pick it up. The portal doesn't manage lending; it creates the desire to visit.

On the admin side, adding a new book is as frictionless as scanning its barcode: point a phone camera at the ISBN, watch the metadata and cover fill in automatically, and save in under 60 seconds. The stack — Angular frontend, .NET backend, SQLite database — deploys on sovereign French cloud for under €5/month.

## The Problem

Employees have no way to know what books the library holds without physically walking there. The collection is invisible to anyone who hasn't already visited — which means the barrier to discovery is identical to the barrier to borrowing.

The consequence: a thoughtfully curated collection sits underutilized. Colleagues who would enjoy or benefit from specific titles never find out they exist. The library's animator has no lightweight way to make it visible to the broader organization, and no way to spark the curiosity that drives physical visits.

## The Solution

A publicly accessible web portal with two modes:

**Public (no login required)**
- Browse the full catalog with cover images displayed prominently
- Filter by title, author, genre, publication year, or free-text keyword
- View a book detail page with full metadata, cover art, and the animator's personal note
- "Recently Added" section — a reason to check back regularly
- Accessible from any device, including from home — no VPN required

**Admin (authenticated, role-based)**
- Dedicated account credentials — no corporate SSO dependency
- Scan a book's ISBN barcode with a smartphone camera directly in the browser
- Metadata and cover auto-fill via Open Library API, with Google Books as fallback
- Manual override for any field — graceful fallback when APIs return incomplete data for French or niche titles
- Add, edit, and remove books; multiple admins supported via role-based access

## What Makes This Different

**Purpose-built, not adapted.** Every existing solution either manages e-books (Calibre-Web), requires enterprise licensing (Soutron), or is a SaaS product hosted on US servers (Libib). This portal is designed specifically for a physical corporate book collection, self-hosted on sovereign French infrastructure.

**Discovery is the core value, not management.** This is a storefront, not a library system. The emphasis is on making books visually appealing and easy to find — with human curation at the center. The animator's notes per book transform a bare catalog into a reading guide that no algorithm can replicate.

**Admin UX that fits real life.** ISBN scan to saved record in under 60 seconds, from a phone, with no desktop software and no manual data entry. This is the right ergonomic choice for someone managing a library in their spare time.

**Sovereign and low-cost by design.** Hosted on OVH or Scaleway (French datacenters), the full solution runs for ~€5/month — compliant with French data residency expectations and free of US-cloud vendor dependency.

## Who This Serves

**Primary — Employees of the ESN**
Knowledge workers, consultants, and developers who want to know if there's a book worth grabbing before making the effort to walk to the library — or who browse from home and plan a visit when they return to the office. The portal gives them a 30-second discovery experience from anywhere.

**Secondary — The Library Animator (Admin)**
The person who curates and grows the collection. Needs to add new books quickly and without friction using only a phone. Wants the catalog to stay current and to make the collection look as good as it deserves. May delegate access to other admins over time.

## Success Criteria

| Signal | Measure |
|--------|---------|
| Discovery drives footfall | Colleagues proactively mention finding a book on the portal |
| Catalog currency | New books added within 1 day of arriving on the shelf |
| Frictionless browsing | No login prompts, no broken covers, no dead links |
| Admin efficiency | ISBN scan to saved record in under 60 seconds |
| Awareness | Portal announced via Teams and QR code posters at the library at launch |

## Scope

**In scope (v1)**
- Public catalog: browse, filter (title, author, genre, year, keyword), book detail with cover and curator note
- "Recently Added" section on the homepage
- Admin: ISBN scan via browser camera → auto-fill → save; manual edit; delete; curator note per book
- Role-based admin access (multiple admins from day one)
- Dedicated admin credentials (no SSO)
- Angular SPA + .NET REST API + SQLite database
- Publicly accessible URL, deployed on sovereign French cloud (OVH or Scaleway)

**Out of scope (v1)**
- Loan / borrowing management or availability tracking
- Reservations or waitlists
- Employee user accounts or personalization
- Email or push notifications
- Usage analytics or admin dashboards
- Native mobile app (browser-based experience is sufficient)

## Roadmap Thinking

If the portal succeeds and borrowing requests become frequent enough that the animator needs to track what's out, the natural next step is a lightweight availability toggle: "checked out / available", managed by admins, with no full ILS required. Further out, if the concept resonates across other ESN offices or teams, a multi-library model becomes relevant. For now: ship something simple and beautiful, announce it well, and let the collection speak for itself.
