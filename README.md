# UtsavMate AI — Smart Celebration & Event Planner

> **Tagline:** *Every celebration. One smart plan.*

A budget-first, GenAI-powered event planning assistant that turns celebration requirements into actionable, editable plans with calculated budgets, date-based countdown timelines, vendor checklists, and personalized recommendations for Indian weddings, birthdays, anniversaries, college fests, and community gatherings.

---

## Hackathon Submission Overview

- **Chosen Vertical**: **[Challenge 5] Celebration & Event Planner**
- **Public GitHub Repository**: [https://github.com/shivangsaxena1011/UtsavMate-AI](https://github.com/shivangsaxena1011/UtsavMate-AI)
- **Repository Compliance**: Single branch (`main`), repository size ~0.22 MB (strictly < 10 MB limit).
- **Approach & Logic**:
  - **Deterministic Math Engine**: LLMs never compute finances. All category splits, totals, variances, per-guest expenses, and countdown intervals are calculated deterministically in TypeScript code.
  - **Culturally-Aware GenAI**: Google Gemini API (`gemini-2.5-flash`) generates hyper-personalized themes, decor ideas, regional cuisine/live counters, and saving tips in English, Hindi, and Hinglish.
  - **Dual-Engine Reliability**: Seamless fallback to tested deterministic cultural templates if an API key is absent or when offline.
  - **Interactive Actionable Refinement**: Real-time budget adjustment engine (e.g. "reduce budget by 15%") updates saved records upon approval.
- **How the Solution Works**:
  1. *Onboarding*: The 3-step wizard collects event type, date, city, guest count, budget (INR), theme, dietary, and language preferences.
  2. *Plan Generation*: Deterministic engines lay down mathematical foundations; Gemini AI crafts tailored themes, menus, and checklists.
  3. *Active Management*: Interactive dashboard with editable budgets, task checkboxes, vendor quotation tracking, and AI chat.
  4. *Multi-format Export*: One-click export to Markdown, Budget CSV, Vendors CSV, Google Calendar `.ics`, and print dossier.
- **Assumptions Made**:
  - Currency is INR (₹) using standard Indian numbering format (lakhs/crores).
  - Milestone tasks scale proportionally based on lead time remaining before the celebration date.
  - Focuses on planner workflows (budget, timeline, vendors, concepts) without live payment processing or unverified vendor booking.

---

## 1. Problem Statement Alignment

| Problem Statement Requirement | Visible Product Feature | Automated Test Coverage |
| :--- | :--- | :--- |
| **"Organize weddings, birthdays, and community events"** | Specialized templates for 6 event types (Wedding, Birthday, Anniversary, College Fest, Community, Custom) with distinct Indian budget allocations and cultural nuances. | `tests/budget.test.ts`, `tests/timeline.test.ts` |
| **"Budgets"** | Pure deterministic math engine computing category splits, totals, actual spends, remaining balance, cost per guest, and overspend warnings. | `tests/budget.test.ts` (100% split verification, rounding safety, overspend flags) |
| **"Timelines"** | Date-aware countdown tasks (e.g. T-120 days to T-Day) with completion toggles, overdue indicators, and iCalendar (`.ics`) export. | `tests/timeline.test.ts` (interval compression, overdue logic, RFC 5545 validity) |
| **"Vendor checklists"** | Categorized vendor coordinator tracking contact details, estimated vs. final quotes, booking status, and tailored questions to ask. | `tests/api.test.ts` (vendor persistence & quote checks) |
| **"Personalized GenAI ideas"** | Multi-concept themes, color palettes, regional food/live-counter suggestions, activities, and cost-saving alternatives in English, Hindi, and Hinglish. | `tests/ai.test.ts` (schema compliance, Hindi & Hinglish generation) |
| **"Refine & Optimize"** | Interactive assistant that calculates financial impact (e.g. "Reduce budget by 15%") and updates saved records upon approval. | `tests/api.test.ts`, `tests/schema.test.ts` |
| **"Export and Share"** | Downloadable dossiers in Markdown (`.md`), Excel-ready CSV for budget and vendors, iCalendar (`.ics`), and a dedicated printable view. | `tests/api.test.ts` |

---

## 2. Key Differentiators: Budget-Aware Planning Engine

- **Authoritative Math in Code**: LLMs never perform arithmetic. All budget allocations, variances, per-guest expenses, and timeline offsets are computed deterministically in tested TypeScript.
- **Dual-Engine Reliability**:
  - **Live AI Mode**: Uses Google Gemini API (`gemini-2.5-flash`) via the official `@google/genai` SDK when `GEMINI_API_KEY` is present.
  - **100% Deterministic Fallback Mode**: Instantly generates rich, culturally nuanced plans even with zero API keys or during network outages.
- **Persistence without External DB**: Built-in atomic SQLite file persistence in `./data/events/{id}.json` ensures changes survive refreshes and server restarts without complex database infrastructure.

---

## 3. Quick Start & Setup

### Prerequisites
- Node.js 18+ (tested on Node.js v24.15.0)
- npm 9+

### Installation & Run

```bash
# 1. Navigate to project directory
cd C:\Users\Project\utsavmate-ai

# 2. Install dependencies (already installed)
npm install

# 3. (Optional) Configure Gemini API Key
# Copy .env.example to .env.local and add your key:
# GEMINI_API_KEY=your_key_here
# If omitted, UtsavMate AI automatically operates using its built-in offline engine.

# 4. Run Development Server
npm run dev

# 5. Open in Browser
# http://localhost:3000
```

### Production Build & Start

```bash
npm run build
npm start
```

---

## 4. Running Automated Tests

```bash
npm test
```

### Actual Test Results (Vitest)
```text
 ✓ tests/adversarial_challenge.test.ts (15 tests)
 ✓ tests/errors.test.ts (7 tests)
 ✓ tests/refine.test.ts (24 tests)
 ✓ tests/api_validation.test.ts (19 tests)
 ✓ tests/schema.test.ts (4 tests)
 ✓ tests/ai.test.ts (3 tests)
 ✓ tests/budget.test.ts (8 tests)
 ✓ tests/adversarial_refine_engine.test.ts (27 tests)
 ✓ tests/timeline.test.ts (5 tests)
 ✓ tests/api.test.ts (3 tests)
 ✓ tests/vendors.test.ts (3 tests)
 ✓ tests/workspace.test.ts (21 tests)
 ✓ tests/adversarial_lifecycle_concurrency.test.ts (9 tests)
 ✓ tests/adversarial_error_resilience.test.ts (23 tests)
 ✓ tests/adversarial_api_routes.test.ts (55 tests)

 Test Files  15 passed (15)
      Tests  226 passed (226)
   Duration  860ms
```

---

## 5. Architecture & Code Structure

```
utsavmate-ai/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── events/
│   │   │       ├── route.ts            # GET /api/events, POST /api/events
│   │   │       └── [id]/
│   │   │           ├── route.ts        # GET, PATCH, DELETE event
│   │   │           ├── budget/route.ts # Add, edit, delete budget items
│   │   │           ├── tasks/route.ts  # Add, edit, toggle tasks
│   │   │           ├── vendors/route.ts# Manage vendors & quotes
│   │   │           ├── refine/route.ts # AI assistant & budget reduction
│   │   │           └── export/route.ts # Markdown, CSV, ICS exports
│   │   ├── events/
│   │   │   ├── new/page.tsx            # 3-Step Event Onboarding Wizard
│   │   │   └── [id]/page.tsx           # Multi-tab Planning Workspace
│   │   ├── globals.css                 # Warm ivory & terracotta palette, print styles
│   │   ├── layout.tsx                  # Accessible navigation header & footer
│   │   └── page.tsx                    # Landing page with hero & event cards
│   └── lib/
│       ├── types.ts                    # Zod schemas & TypeScript definitions
│       ├── storage.ts                  # Atomic file repository with seed data
│       ├── engines/
│       │   ├── budget.ts               # Authoritative math, splits, overspend alerts
│       │   ├── timeline.ts             # Date-aware milestone math & .ics generator
│       │   └── vendors.ts              # Vendor templates & interview questions
│       ├── ai/
│       │   ├── types.ts                # Zod schemas for structured plan output
│       │   ├── gemini-provider.ts      # Server-side Gemini API client
│       │   ├── fallback-provider.ts    # Multilingual deterministic generator
│       │   ├── refine.ts               # Chat & financial reduction assistant
│       │   └── index.ts                # Unified AI gateway
│       └── export/
│           └── index.ts                # Markdown, CSV, and ICS formatters
├── tests/
│   ├── budget.test.ts                  # Splits, rounding, overspends, guest scaling
│   ├── timeline.test.ts                # Date milestones, interval compression, ICS
│   ├── ai.test.ts                      # English, Hindi, Hinglish schema verification
│   ├── schema.test.ts                  # Malformed output rejection, injection defense
│   └── api.test.ts                     # CRUD workflow, persistence, and exports
├── data/                               # Local persistent storage directory
├── .env.example
├── package.json
└── README.md
```

---

## 6. Security & Accessibility

- **Input Sanitization & Strict Schema Validation**: Every API endpoint parses inputs using `zod`. Length limits, numeric bounds, and enum checks prevent malformed payloads.
- **Enterprise Security Headers**: Configured in `next.config.ts` including HSTS (`max-age=63072000; includeSubDomains; preload`), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy`.
- **Server-Side AI Secrets**: API keys are accessed strictly in server route handlers. No keys are ever bundled into client code.
- **Prompt Injection Defense**: User notes are delimited in `<EVENT_DATA>` blocks and treated purely as raw data.
- **XSS Prevention**: React automatically escapes rendered strings; `dangerouslySetInnerHTML` is never used.
- **WCAG 2.2 AA Accessibility & Assistive Tech**:
  - Skip-to-main-content landmark link for keyboard-only navigation.
  - WAI-ARIA accessible modal dialogs (`role="dialog"`, `aria-modal="true"`, `aria-labelledby`).
  - Screen-reader accessible button labels (`aria-label`) on all interactive icon buttons.
  - Semantic HTML landmarks (`<header>`, `<main>`, `<nav>`, `<footer>`, `<section>`).
  - High-contrast typography (#231924 dark charcoal on #faf8f5 warm ivory, contrast ratio > 11:1).
  - Visible keyboard focus rings (`outline: 2px solid #7C3AED`).
  - Non-color reliant statuses (text badges + distinct icons for overdue, completed, and overspent states).
  - Print-specific media styles hiding UI chrome for clean physical binder dossiers.

---

## 7. Creating Your First Event

To get started:
1. Navigate to /events/new or click **Plan My Event** from the landing page.
2. Complete the 3-step wizard with your celebration details:
   - **Step 1 Basics**: Title, event type (wedding, birthday, anniversary, fest, community), date.
   - **Step 2 Requirements**: City, guest count, total budget in INR, theme, dietary needs.
   - **Step 3 Preferences**: Language (English, Hindi, Hinglish), cultural preferences, notes.
3. Click **Generate AI Plan** — UtsavMate AI creates an actionable plan with auto-calculated budget allocations, date-aware countdown timeline, categorized vendor checklist, and personalized ideas.
