# NitipCuy Experience Design

Status: First owner-reviewable direction; not approved for production use

Last reviewed: 2026-08-17 11:57 WIB

## 1. Purpose and authority

This document owns the current NitipCuy information hierarchy, interaction principles, visual direction, responsive behavior, and content voice. It does not override the master product specification, order lifecycle, architecture, security, or trust-and-safety authorities.

The issue #15 implementation is a simulated presentation layer for owner review. It does not create an alternative order authority, private dashboard projection, provider workflow, payment flow, or production-ready interface.

## 2. Primary experience jobs

### Customer

The customer should be able to answer, in order:

1. Is there a trip going where and when I need it?
2. Is ordering still open, and how much capacity remains?
3. Can this jastipper buy my item or carry one I already own?
4. What rate, handover, schedule, and evidence terms apply?
5. What information would the jastipper need to assess my request?
6. If an order exists, what happened, what happens next, and do I need to act?

### Jastipper

The jastipper should be able to answer, in order:

1. Which trip and remaining capacity am I managing?
2. Which requests need assessment before the ordering deadline?
3. What item, weight, mode, and risk signal must I inspect?
4. Which accepted work requires evidence or another action?
5. Which state is authoritative, and which information is only an estimate?

## 3. Information architecture

The first reviewable route set is:

- `/`: public trip discovery and filtering;
- `/trips/{tripId}`: public trip decision detail and public discussion;
- `/trips/{tripId}/request`: non-persisting request-composition preview;
- `/orders`: simulated customer progress workspace;
- `/jastipper`: simulated jastipper capacity and work queue.

The public discovery and detail screens use the existing safe `PublishedTrip` projection. The request preview runs only in the browser, calls no mutation API, and must not collect addresses, payment details, identity documents, or secrets. The customer and jastipper workspaces contain fixed fictional presentation data, not private projections.

## 4. Signature pattern: the route ribbon

The route ribbon is the primary visual and information signature. It must carry meaning rather than act as decoration:

- origin is the starting anchor;
- destination is the decision anchor;
- the line communicates direction;
- nearby labels expose the request deadline, available capacity, service mode, or next action;
- compact and expanded versions preserve the same origin-to-destination reading order.

The route ribbon may appear on discovery cards, trip detail, and request composition. It must not imply live tracking, confirmed transport, or delivery success.

## 5. Visual system

The direction is direct, energetic, and operational: closer to a clearly marked travel document or dispatch board than a generic lifestyle marketplace.

Core tokens:

- deep route ink `#0B203B` for authority, navigation, and high-contrast fields;
- route blue `#2457E6` for discovery, links, scheduled information, and system structure;
- signal orange `#FF6B2C` for primary action, deadlines, and route endpoints;
- evidence mint `#BCECE2` for completed, available, or safely acknowledged states;
- cool canvas `#F5F7FA`, white surfaces, and blue-grey dividers for dense operational content.

Typography uses local system sans-serif stacks only. Large headings use a condensed-preferred system stack, while body and control text use the platform UI stack. External font services and new presentation dependencies are intentionally absent.

Most surfaces use square or lightly rounded geometry. Strong color bars, route lines, status chips, ticket perforation cues, and deliberate borders carry hierarchy. Shadows are reserved for hover, sticky decisions, and the hero route ticket.

## 6. Interaction and content rules

- Lead with the next decision, not a feature label.
- Use plain Indonesian and explain consequences at the point of action.
- Distinguish `dibuka`, `segera dibuka`, and `ditutup`; never use one generic availability badge.
- Keep rate, handover, deadline, capacity, timezone meaning, and service mode visible before the request action.
- `Belikan barang` and `Bawakan barang` describe who acquires or already owns the item.
- A submitted request is still pending assessment; it is never described as an accepted order.
- A visual status never creates authority. Authoritative server state and evidence remain required.
- Simulated screens must visibly say that they do not store data, reserve capacity, charge money, or operate on real accounts.
- Disabled controls must explain, through nearby context, that the protected action is not implemented in the prototype.

## 7. Responsive and accessible behavior

- Desktop layouts may use two-column decision views and operational tables.
- Narrow layouts collapse to a single reading column, preserve origin-to-destination order, and convert the jastipper table into labelled record blocks.
- Primary controls remain at least 44 CSS pixels high where practical.
- Keyboard focus uses a visible violet outline distinct from status colors.
- Information is never conveyed by color alone; every status includes text.
- Semantic headings, lists, forms, legends, labels, time elements, and table roles remain present.
- Decorative route marks are hidden from assistive technology.
- Motion is limited to short hover elevation and is removed when reduced motion is requested.

## 8. Evidence and approval state

Implemented locally for issue #15:

- the shared visual tokens, shell, navigation, route ribbon, status language, and simulation notice;
- responsive public discovery and trip detail;
- a local-only request preview with both service modes;
- simulated customer timeline and jastipper work queue;
- unit tests for shared presentation labels and time-window boundaries.

Current evidence is source-tested, production-build-tested, local request-perimeter-runtime-tested, dependency-audit-tested, and local HTTP-route-smoke-tested. The in-app browser had no connected window, so browser-visible desktop/mobile rendering, request interaction, screenshots, and visible accessibility inspection remain pending. Hosted exact-head gates, review governance, and BurinSN visual approval also remain pending. No deployment or provider evidence exists.

## 9. Deliberate exclusions

- authentication and real accounts;
- authoritative private customer or jastipper projections;
- request submission from this preview form;
- seller acceptance, rejection, expiry, cancellation, or capacity release;
- private addresses, chat, identity, evidence upload, payment, logistics, dispute, or review actions;
- provider onboarding, preview deployment, production deployment, public launch, or production visual approval.

The first visual direction may change after BurinSN review. Production use requires explicit visual sign-off plus all applicable product, security, privacy, browser, provider, and operational gates.
