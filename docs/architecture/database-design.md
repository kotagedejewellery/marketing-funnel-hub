# Database Design v1.0
**Project:** KGJ Custom Link Bio + Meta Tracking Hub  

**Status:** FINAL / LOCKED / Normalized by ADR-002 through ADR-005  
**Phase:** MVP / P0  
**Owner:** Engineering  
**Last Reviewed:** 2026-09-15  
**Database:** Supabase PostgreSQL  
**ORM:** Drizzle ORM  
**Architecture:** Modular Monolith

---

## 1. Locked Database Decisions

The following decisions are approved:

1. **No separate `sessions` table in P0**
2. **No separate `attribution` table**
3. **Store `product_category` and `branch_name` snapshot values in events in addition to foreign keys**
4. **Include `audit_logs` in P0**
5. **Anonymous event retention = 24 months**

---

## 2. Required P0 Tables

```text
admin_profiles
site_settings
content_sections
campaigns
products
branches
product_branches
links
events
audit_logs
```

---

## 3. Entity Relationship Overview

```text
auth.users
   │
   └── 1:1 admin_profiles

products
   │
   └── M:N branches
          via product_branches

campaigns
content_sections
links
site_settings

events
 ├── product_id nullable by event variant
 ├── branch_id nullable by event variant
 └── anonymous_session_id

audit_logs
 └── optional admin_id
```

---

## 4. admin_profiles

| Column | Type | Null | Notes |
|---|---|---:|---|
| id | uuid | No | PK, linked to auth.users.id |
| display_name | text | Yes | Admin display name |
| role | text | No | `admin` / `technical_admin` |
| is_active | boolean | No | default true |
| created_at | timestamptz | No | default now() |
| updated_at | timestamptz | No | default now() |

Constraint:
```text
role IN ('admin', 'technical_admin')
```

---

## 5. site_settings

Singleton global settings.

Canonical singleton ID:

```text
00000000-0000-0000-0000-000000000001
```

| Column | Type | Null | Notes |
|---|---|---:|---|
| id | uuid | No | PK |
| site_name | text | No | Default KGJ |
| headline | text | Yes | Public headline |
| introduction | text | Yes | Intro |
| logo_path | text | Yes | Supabase Storage path |
| default_whatsapp_message | text | No | Message template |
| default_cta_label | text | No | Default CTA |
| privacy_url | text | Yes | Privacy page/link |
| created_at | timestamptz | No | default now() |
| updated_at | timestamptz | No | default now() |

Constraint:

```text
id = '00000000-0000-0000-0000-000000000001'
```

Social and secondary links are stored only in `links`.

---

## 6. content_sections

| Column | Type | Null | Notes |
|---|---|---:|---|
| id | uuid | No | PK |
| section_key | text | No | unique |
| label | text | No | Admin label |
| sort_order | integer | No | default 0 |
| is_active | boolean | No | default true |
| created_at | timestamptz | No | default now() |
| updated_at | timestamptz | No | default now() |

Suggested section keys:

```text
brand_header
campaign_banner
products
secondary_links
social_links
footer
```

---

## 7. campaigns

| Column | Type | Null | Notes |
|---|---|---:|---|
| id | uuid | No | PK |
| name | text | No | Internal name |
| title | text | Yes | Public title |
| description | text | Yes | Public copy |
| banner_path | text | Yes | Storage path |
| target_url | text | Yes | Optional |
| active_from | timestamptz | Yes | Optional |
| active_until | timestamptz | Yes | Optional |
| is_active | boolean | No | default true |
| sort_order | integer | No | default 0 |
| created_at | timestamptz | No | default now() |
| updated_at | timestamptz | No | default now() |

Date range check:

```text
active_until IS NULL
OR active_from IS NULL
OR active_until > active_from
```

The public page displays at most one eligible campaign. Select eligible rows by:

```text
sort_order ASC
→ active_from DESC NULLS LAST
→ created_at DESC
→ id ASC
```

Overlapping eligible windows are permitted but produce an Admin warning.

---

## 8. products

In P0, a product row represents a customer-facing product category/need rather than
an SKU. `slug` is the canonical stable `product_category` tracking value.

| Column | Type | Null | Notes |
|---|---|---:|---|
| id | uuid | No | PK |
| name | text | No | Public name |
| slug | text | No | unique |
| description | text | Yes | Public description |
| image_path | text | Yes | Storage path |
| is_active | boolean | No | default true |
| sort_order | integer | No | default 0 |
| created_at | timestamptz | No | default now() |
| updated_at | timestamptz | No | default now() |

Indexes:
- unique `slug`
- `(is_active, sort_order)`

---

## 9. branches

| Column | Type | Null | Notes |
|---|---|---:|---|
| id | uuid | No | PK |
| name | text | No | Branch name |
| slug | text | No | unique |
| whatsapp_number | text | No | normalized country-code format |
| cta_label | text | Yes | Optional override |
| is_active | boolean | No | default true |
| sort_order | integer | No | default 0 |
| created_at | timestamptz | No | default now() |
| updated_at | timestamptz | No | default now() |

Recommended WhatsApp storage:

```text
628123456789
```

---

## 10. product_branches

Junction table for Product M:N Branch.

| Column | Type | Null | Notes |
|---|---|---:|---|
| id | uuid | No | PK |
| product_id | uuid | No | FK products.id |
| branch_id | uuid | No | FK branches.id |
| whatsapp_message_template | text | Yes | Optional override |
| cta_label | text | Yes | Optional override |
| is_active | boolean | No | default true |
| sort_order | integer | No | default 0 |
| created_at | timestamptz | No | default now() |
| updated_at | timestamptz | No | default now() |

Constraint:

```text
UNIQUE(product_id, branch_id)
```

Fallback priority:

```text
Message:
product_branches.whatsapp_message_template
→ site_settings.default_whatsapp_message

CTA:
product_branches.cta_label
→ branches.cta_label
→ site_settings.default_cta_label
```

---

## 11. links

| Column | Type | Null | Notes |
|---|---|---:|---|
| id | uuid | No | PK |
| label | text | No | Public label |
| url | text | No | Destination |
| link_type | text | No | secondary/social |
| platform | text | Yes | instagram/tiktok/etc |
| icon_key | text | Yes | Optional |
| is_active | boolean | No | default true |
| sort_order | integer | No | default 0 |
| created_at | timestamptz | No | default now() |
| updated_at | timestamptz | No | default now() |

Constraint:

```text
link_type IN ('secondary', 'social')
```

---

## 12. events

P0 anonymous/pseudonymous first-party event log.

| Column | Type | Null | Notes |
|---|---|---:|---|
| id | uuid | No | Internal PK |
| event_id | text | No | Canonical unique event ID |
| anonymous_session_id | text | No | Journey correlation |
| event_name | text | No | PageView/ViewContent/Contact |
| event_time | timestamptz | No | Occurrence time |
| page_url | text | Yes | Event URL |
| product_id | uuid | Yes | FK products.id |
| branch_id | uuid | Yes | FK branches.id |
| product_category | text | Yes | Historical `products.slug` snapshot |
| branch_name | text | Yes | Historical snapshot |
| cta | text | Yes | CTA context |
| source | text | Yes | Normalized source |
| campaign | text | Yes | Normalized campaign |
| utm_source | text | Yes | Raw attribution |
| utm_medium | text | Yes | Raw attribution |
| utm_campaign | text | Yes | Raw attribution |
| utm_content | text | Yes | Raw attribution |
| utm_term | text | Yes | Raw attribution |
| metadata | jsonb | Yes | Small extensibility payload |
| created_at | timestamptz | No | Insert timestamp |

Constraints:

```text
event_name IN ('PageView', 'ViewContent', 'Contact')
UNIQUE(event_id)

PageView:
product_id/product_category/branch_id/branch_name/cta are null

ViewContent:
product_id and product_category are not null
branch_id/branch_name/cta are null

Contact:
product_id/product_category/branch_id/branch_name are not null
cta = 'whatsapp'
```

Product and branch event foreign keys use `ON DELETE RESTRICT`; routine lifecycle is
deactivation, preserving historical referential integrity.

Recommended indexes:

```text
(event_time DESC)
(event_name, event_time DESC)
(anonymous_session_id, event_time)
(product_id, event_time DESC)
(branch_id, event_time DESC)
(utm_campaign, event_time DESC)
(utm_source, event_time DESC)
```

---

## 13. audit_logs

Included in P0.

| Column | Type | Null | Notes |
|---|---|---:|---|
| id | uuid | No | PK |
| admin_id | uuid | Yes | FK admin_profiles.id |
| action | text | No | create/update/deactivate |
| entity_type | text | No | product/branch/etc |
| entity_id | uuid | Yes | Target entity |
| changes | jsonb | Yes | Sanitized change diff |
| created_at | timestamptz | No | default now() |

Purpose:
- operational trace,
- CMS change accountability,
- easier debugging.

---

## 14. Session Model

No dedicated `sessions` table in P0.

Use:

```text
anonymous_session_id
```

on every event.

Purpose:

```text
PageView
→ ViewContent
→ Contact
```

can be correlated without maintaining a separate session lifecycle table.

---

## 15. Attribution Model

No dedicated `attribution` table in P0.

UTM values are snapshotted onto each event:

```text
utm_source
utm_medium
utm_campaign
utm_content
utm_term
```

This keeps each event self-contained and historically accurate.

---

## 16. Historical Snapshot Strategy

Events store both:

```text
product_id
branch_id
```

and:

```text
product_category
branch_name
```

Reason:
- product/branch names may change later,
- historical analytics must preserve the original context.

---

## 17. Retention Policy

Anonymous event retention:

```text
24 months
```

After 24 months:
- events are deleted in bounded batches by an authenticated scheduled server job.

The job logs only counts/status, is protected by a dedicated secret, and must be
tested in staging before production activation.

---

## 18. Timestamp Policy

All database timestamps use:

```text
timestamptz
```

Stored in UTC.

---

## 19. ID Strategy

Use UUID for domain entity primary keys.

---

## 20. Content Lifecycle

Routine Marketing operations use:

```text
is_active = true / false
```

not hard delete.

Hard delete is exceptional.

---

## 21. Public CTA Resolution

CTA is visible only if:

```text
products.is_active = true
AND product_branches.is_active = true
AND branches.is_active = true
```

---

## 22. Campaign Visibility

Campaign visible if:

```text
is_active = true
AND (active_from IS NULL OR active_from <= now())
AND (active_until IS NULL OR active_until >= now())
```

When more than one campaign is visible, apply the deterministic ordering defined in
section 7 and return only the first row.

---

## 23. Access Baseline

Public:
- no unrestricted direct mutations,
- event writes via validated server endpoint.
- no direct browser reads from application domain tables.

Admin:
- authenticated server-side mutations.

Privileged:
- service credentials remain server-side only.

Server domain modules access PostgreSQL through Drizzle using a dedicated
least-privilege application role. Enable RLS on tables exposed through Supabase APIs
and deny `anon`/`authenticated` direct domain-table access by default. Browser
Supabase usage is limited to Auth and approved Storage operations.

---

## 24. Migration Strategy

Use Drizzle migrations:

```text
Schema change
→ Generate migration
→ Apply local
→ Test
→ Apply non-production
→ QA
→ Apply production
```

---

## 25. Required P0 Data Integrity Rules

1. Product slug unique
2. Branch slug unique
3. Product-branch combination unique
4. Active branch requires WhatsApp number
5. Event ID unique
6. Event name constrained
7. Campaign date range valid
8. sort_order defaults to 0
9. timestamps consistent
10. site_settings fixed singleton ID
11. event-specific context constraints
12. event Product/Branch foreign keys restrict hard delete

---

## 26. Database Non-Goals

P0 does not create:

```text
customers
leads
contacts
orders
sales
transactions
```

No CRM or sales ledger in P0.

---

## 27. Database Status

**Schema Model:** LOCKED  
**Product M:N Branch:** LOCKED  
**Session Model:** LOCKED  
**Attribution Model:** LOCKED  
**Event Snapshot Strategy:** LOCKED  
**Audit Logs:** LOCKED  
**Retention Policy:** LOCKED at 24 months  
**Database Design v1.0:** FINAL
