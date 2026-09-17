# KGJ project documentation

## Purpose

This directory is the stable entry point for product, contract, architecture,
planning, and decision documentation. `AGENTS.md` remains at the repository root
and defines repository-wide implementation guardrails.

## Documentation map

| Area | Purpose | Location |
|---|---|---|
| Product | Business scope, product requirements, and UX/IA | [`product/`](product/) |
| Contracts | Canonical tracking semantics and API/data contracts | [`contracts/`](contracts/) |
| Architecture | Stack, system, database, and tracking implementation design | [`architecture/`](architecture/) |
| Planning | Cross-sprint delivery roadmap | [`planning/`](planning/) |
| Decisions | Accepted and historical architecture decisions | [`decisions/`](decisions/) |
| Runbooks | Reproducible local and deployment procedures | [`runbooks/`](runbooks/) |
| Execution | Current task plans and checklists | [`../tasks/`](../tasks/) |

## Source-of-truth order

1. [Business Requirement & Scope Lock](product/business-requirements-and-scope.md)
2. [Tracking & Conversion Specification](contracts/tracking-conversion.md)
3. [Product Requirement Document](product/prd.md)
4. [UX & Information Architecture](product/ux-information-architecture.md)
5. [Tech Stack Selection](architecture/tech-stack.md)
6. [System Architecture](architecture/system-architecture.md)
7. [Database Design](architecture/database-design.md)
8. [API & Data Contract](contracts/api-data-contract.md)
9. [Detailed Tracking Data Flow](architecture/tracking-data-flow.md)
10. [Delivery Roadmap](planning/delivery-roadmap.md)

## Architecture decisions

| ADR | Status | Decision area |
|---|---|---|
| [ADR-001](decisions/0001-runtime-and-application-boundaries.md) | Accepted | Runtime, rendering, module, and framework boundaries |
| [ADR-002](decisions/0002-auth-data-access-and-security.md) | Accepted | Auth, authorization, RLS, Storage, and request security |
| [ADR-003](decisions/0003-tracking-session-and-delivery.md) | Accepted | Sessions, attribution, provider ownership, and WhatsApp-safe delivery |
| [ADR-004](decisions/0004-domain-content-and-api-contracts.md) | Accepted | Product semantics, campaigns, social links, and event/API contracts |
| [ADR-005](decisions/0005-testing-deployment-and-operations.md) | Accepted | Tests, CI, environments, migrations, operations, and retention |

## Decision precedence

- Locked business scope and event semantics cannot be changed by a technical ADR.
- An **Accepted** ADR may clarify or supersede a technical implementation detail
  only where the ADR explicitly names the affected contract.
- A **Proposed** ADR is review material and does not authorize implementation.
- Preserve historical ADRs. A changed decision requires a new superseding ADR.

## Current implementation status

The architecture-decision gate passed on 2026-09-15. T0-01 through T0-09 are
complete; the T0-10 CI workflow is configured but requires an actual GitHub run
and owner-managed branch protection before completion. Git, Docker, and host
firewall operations remain user-managed.

Environment and provider owners must be assigned before local platform, staging,
production, migration, or provider-account operations begin.

## Execution plans

- [Sprint 0 implementation plan](../tasks/plan.md)
- [Sprint 0 task checklist](../tasks/todo.md)
- [CI quality-gate runbook](runbooks/ci.md)

The delivery roadmap describes the full P0 sequence. Files under `tasks/` are the
active execution control for the current sprint and take precedence for task status.

## Maintenance rules

- Keep one H1 title per document and use nested headings in order.
- Update status, owner, and last-reviewed metadata when a contract changes.
- Update this index and `AGENTS.md` whenever a source-of-truth document moves.
- Do not delete accepted ADRs; supersede them with a newer ADR.
- Do not duplicate active task status in product or architecture documents.
