# AGENTS.md

## Project

This repository is a standalone frontend for reviewing license-risky code reuse findings.

The app accepts a GitHub repository URL, sends it to an existing backend retrieval API, and shows source code snippets plus matched external code snippets that may require license review.

This repository is intentionally separate from the pipeline/orchestration repository.
Do not reimplement the data pipeline here.
Do not add Airflow, OpenSearch indexing, or repository crawling logic here.
This repo is UI-first and should only contain the minimum client-side and lightweight API integration code needed to visualize findings.

## Primary Goal

Build a simple web UI where a user can:

1. Paste a GitHub repository URL.
2. Submit it for analysis.
3. View high-risk findings grouped by source chunk.
4. Inspect matched external code snippets and the license review rationale.

## Product Scope

This app is a reviewer-facing tool, not an end-user product.

Version 1 should include:

1. A single-page flow.
2. One input field for `repo_url`.
3. One submit button.
4. Loading, success, empty, and error states.
5. A summary section showing counts for `critical`, `high`, `medium`, and `sources_with_findings`.
6. A findings list grouped by source chunk.
7. For each finding:
   - source file path
   - source symbol name
   - source raw code
   - top risk level and score
   - candidate matches
8. For each candidate match:
   - candidate repository URL
   - candidate repository license
   - candidate file path
   - candidate symbol name
   - matched code snippet
   - matched-by signals
   - strongest evidence type
   - short reason list

Out of scope for v1:

1. Authentication
2. User accounts
3. Background job queue inside this repo
4. Persistent database storage
5. Editing findings
6. Bulk multi-repo upload
7. Reimplementing retrieval logic locally

## Backend Contract

The frontend should assume an existing backend endpoint:

- `POST /retrieve/hybrid/by-repo-url`

Example request body:

```json
{
  "repo_url": "https://github.com/owner/repo",
  "source_chunk_limit": 20,
  "rule_based_top_k": 50,
  "per_variant_k": 20,
  "knn_top_k": 50,
  "merged_top_k": 100,
  "include_same_repo": false,
  "skip_validation": false
}
```

Example response shape:

```json
{
  "repo_id": "github:owner/repo",
  "repo_url": "https://github.com/owner/repo",
  "analyzed_source_count": 12,
  "summary": {
    "critical": 2,
    "high": 4,
    "medium": 8,
    "sources_with_findings": 5,
    "suppressed_low_risk": 16
  },
  "limitations": [
    "Embedding-based kNN retrieval was unavailable for 3 of 12 analyzed source chunks."
  ],
  "findings": [
    {
      "source": {
        "file_path": "src/foo.py",
        "symbol_name": "build_query",
        "raw_code": "def build_query(...): ..."
      },
      "top_risk": {
        "level": "high",
        "score": 0.91
      },
      "review_candidate_count": 3,
      "additional_review_candidates": 1,
      "candidates": [
        {
          "repository": {
            "repo_url": "https://github.com/other/repo",
            "license_spdx": "GPL-3.0-only",
            "license_name": "GNU General Public License v3.0"
          },
          "location": {
            "file_path": "lib/bar.py",
            "symbol_name": "build_query"
          },
          "risk": {
            "level": "high",
            "score": 0.91
          },
          "matched_chunk": {
            "raw_code": "def build_query(...): ..."
          },
          "matched_by": ["rule_based", "knn"],
          "match_signal": "anonymized_code_overlap",
          "why": [
            "Candidate repository license family: copyleft (GPL-3.0-only).",
            "Strong structural and lexical similarity detected."
          ]
        }
      ]
    }
  ]
}
```

If the backend is unavailable during development, use local fixture JSON files and keep the UI contract identical.

## Technical Direction

Use a small, maintainable frontend stack.

Preferred stack:

1. React
2. TypeScript
3. Vite

Avoid adding heavy frameworks unless there is a clear reason.
Do not introduce a large component library by default.
Keep dependencies narrow.

## UX Requirements

The UI should feel like a practical internal review tool.

Requirements:

1. Clear repo URL input at the top of the page.
2. A compact advanced-options section for retrieval parameters.
3. A summary band with risk counts.
4. Findings sorted by highest risk first.
5. Code snippets shown in readable monospace blocks.
6. Long results should be collapsible.
7. Candidate items should visually emphasize:
   - risk level
   - candidate repo URL
   - license
   - evidence reasons
8. Empty states should explain whether:
   - analysis found no reviewable matches
   - backend returned no findings
   - the request failed

## Suggested Information Architecture

One page is enough for v1.

Suggested layout:

1. Header
   - product title
   - short description
2. Search form
   - repo URL input
   - analyze button
   - optional advanced settings drawer
3. Run summary
   - repo URL
   - analyzed source count
   - risk counts
   - backend limitations
4. Findings list
   - one card per source chunk
   - nested candidate match cards

## State Handling

Handle these states explicitly:

1. Initial idle state
2. Submitting/loading state
3. Success with findings
4. Success with no findings
5. Backend validation error
6. Network error
7. Malformed response error

Do not silently swallow backend errors.
Show the backend error message when possible.

## Styling

Keep the visual style sharp and utilitarian.

Requirements:

1. Light theme by default.
2. Strong risk color cues:
   - critical: red
   - high: orange
   - medium: amber
3. Code blocks should be visually distinct.
4. Layout should work on laptop screens first, then mobile.
5. Avoid generic purple gradients or template-like SaaS styling.

## Repository Boundaries

This repository should not:

1. Own retrieval business logic
2. Crawl repositories directly
3. Manage OpenSearch indices
4. Depend on Airflow runtime

This repository should:

1. Accept user input
2. Call the backend API
3. Render findings clearly
4. Support local fixture-based UI development

## Suggested File Structure

```text
src/
  app/
  components/
  features/review/
  lib/
  fixtures/
  styles/
```

Suggested logical split:

1. `features/review/api.ts`
   - request/response types
   - fetch wrapper
2. `features/review/types.ts`
   - response schema
3. `features/review/components/`
   - form
   - summary
   - findings list
   - candidate card
4. `fixtures/`
   - sample API responses for local development

## Environment

Use an environment variable for backend base URL.

Example:

```bash
VITE_API_BASE_URL=http://localhost:8000
```

The frontend should work with:

- relative API paths in production
- explicit API base URL in development

## Acceptance Criteria

A task is complete when:

1. A reviewer can paste a repo URL and submit it.
2. The app calls the backend correctly.
3. The app renders summary counts and findings.
4. The app shows candidate repository and license information clearly.
5. The app shows raw code snippets for both source and matched candidate.
6. The app handles loading, empty, and failure states cleanly.
7. The app can run against fixture data without the backend.

## Implementation Notes For Codex

When working in this repo:

1. Optimize for a working thin slice first.
2. Keep API contracts explicit and typed.
3. Use fixture data early so the UI is developable before backend availability.
4. Avoid premature abstraction.
5. Prefer small reusable view components over a complex architecture.
6. If backend response fields are ambiguous, preserve unknown fields rather than discarding them.
7. Sort findings by risk severity and score.

## First Milestone

The first meaningful milestone is:

1. Create the project scaffold.
2. Implement the repo URL form.
3. Add a mocked review response.
4. Render one full finding card with nested candidate cards.
5. Then switch the mocked fetch path to the real backend endpoint.
