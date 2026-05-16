import type { ReviewResponse } from "../features/review/types";

export const mockReviewResponse: ReviewResponse = {
  repo_id: "github:acme/internal-query-engine",
  repo_url: "https://github.com/acme/internal-query-engine",
  analyzed_source_count: 12,
  summary: {
    critical: 1,
    high: 2,
    medium: 3,
    sources_with_findings: 2,
    suppressed_low_risk: 9,
  },
  limitations: [
    "Embedding-based kNN retrieval was unavailable for 2 of 12 analyzed source chunks.",
  ],
  findings: [
    {
      source: {
        file_path: "src/search/build_query.py",
        symbol_name: "build_query",
        raw_code: [
          "def build_query(filters, user_id, limit=50):",
          "    parts = [\"SELECT id, title FROM docs WHERE deleted = false\"]",
          "    if user_id:",
          "        parts.append(\"AND owner_id = :user_id\")",
          "    if filters.get(\"tag\"):",
          "        parts.append(\"AND tag = :tag\")",
          "    parts.append(\"ORDER BY updated_at DESC LIMIT :limit\")",
          "    return \" \".join(parts)",
        ].join("\n"),
      },
      top_risk: {
        level: "critical",
        score: 0.97,
      },
      review_candidate_count: 2,
      additional_review_candidates: 1,
      candidates: [
        {
          repository: {
            repo_url: "https://github.com/example/gpl-query-kit",
            license_spdx: "GPL-3.0-only",
            license_name: "GNU General Public License v3.0 only",
          },
          location: {
            file_path: "lib/query.py",
            symbol_name: "build_query",
          },
          risk: {
            level: "critical",
            score: 0.97,
          },
          matched_chunk: {
            raw_code: [
              "def build_query(filters, user_id, limit=50):",
              "    clauses = [\"SELECT id, title FROM docs WHERE deleted = false\"]",
              "    if user_id:",
              "        clauses.append(\"AND owner_id = :user_id\")",
              "    if filters.get(\"tag\"):",
              "        clauses.append(\"AND tag = :tag\")",
              "    clauses.append(\"ORDER BY updated_at DESC LIMIT :limit\")",
              "    return \" \".join(clauses)",
            ].join("\n"),
          },
          matched_by: ["rule_based", "knn"],
          match_signal: "anonymized_code_overlap",
          why: [
            "Candidate repository license family: copyleft (GPL-3.0-only).",
            "Strong structural and lexical similarity detected.",
            "Function signature and clause ordering are nearly identical.",
          ],
        },
        {
          repository: {
            repo_url: "https://github.com/another/legacy-sql-utils",
            license_spdx: "LGPL-2.1-only",
            license_name: "GNU Lesser General Public License v2.1 only",
          },
          location: {
            file_path: "sql/helpers.py",
            symbol_name: "compose_query",
          },
          risk: {
            level: "high",
            score: 0.88,
          },
          matched_chunk: {
            raw_code: [
              "def compose_query(filters, user_id, limit=50):",
              "    query = [BASE_QUERY]",
              "    if user_id:",
              "        query.append(USER_PREDICATE)",
              "    if filters.get(\"tag\"):",
              "        query.append(TAG_PREDICATE)",
              "    query.append(SORT_AND_LIMIT)",
              "    return \" \".join(query)",
            ].join("\n"),
          },
          matched_by: ["rule_based"],
          match_signal: "structural_similarity",
          why: [
            "Query assembly pattern closely matches the source chunk.",
            "License requires manual review before reuse clearance.",
          ],
        },
      ],
    },
    {
      source: {
        file_path: "src/auth/token_cache.ts",
        symbol_name: "refreshTokenCache",
        raw_code: [
          "export async function refreshTokenCache(cache, client, now = Date.now()) {",
          "  const token = await client.fetchToken();",
          "  cache.current = token.value;",
          "  cache.expiresAt = now + token.ttlMs - 5_000;",
          "  return cache;",
          "}",
        ].join("\n"),
      },
      top_risk: {
        level: "high",
        score: 0.91,
      },
      review_candidate_count: 1,
      additional_review_candidates: 0,
      candidates: [
        {
          repository: {
            repo_url: "https://github.com/vendor/auth-runtime",
            license_spdx: "MPL-2.0",
            license_name: "Mozilla Public License 2.0",
          },
          location: {
            file_path: "src/cache/token-cache.ts",
            symbol_name: "refreshTokenCache",
          },
          risk: {
            level: "high",
            score: 0.91,
          },
          matched_chunk: {
            raw_code: [
              "export async function refreshTokenCache(cache, client, now = Date.now()) {",
              "  const token = await client.fetchToken();",
              "  cache.current = token.value;",
              "  cache.expiresAt = now + token.ttlMs - 5000;",
              "  return cache;",
              "}",
            ].join("\n"),
          },
          matched_by: ["knn"],
          match_signal: "lexical_overlap",
          why: [
            "Token refresh flow is materially similar.",
            "License is file-level copyleft and merits confirmation before reuse.",
          ],
        },
      ],
    },
  ],
};
