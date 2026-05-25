export type ReviewPriorityLevel = "critical" | "high" | "medium";

export interface RetrievalOptions {
  rule_based_top_k: number;
  per_variant_k: number;
  knn_top_k: number;
  merged_top_k: number;
  include_same_repo: boolean;
  skip_validation: boolean;
}

export interface ReviewRequest extends RetrievalOptions {
  repo_url: string;
}

export interface ReviewInterpretation {
  mode: "review_candidates_not_violation_judgment";
  disclaimer: string;
}

export interface ReviewPriorityCounts {
  critical: number;
  high: number;
  medium: number;
}

export interface ReviewSummary {
  review_priority_counts: ReviewPriorityCounts;
  sources_with_findings: number;
  suppressed_low_priority: number;
  [key: string]: unknown;
}

export interface ReviewRepository {
  repo_url?: string;
  license_spdx?: string | null;
  license_name?: string | null;
  [key: string]: unknown;
}

export interface ReviewLocation {
  file_path?: string;
  symbol_name?: string | null;
  [key: string]: unknown;
}

export interface ReviewPriority {
  level?: ReviewPriorityLevel;
  score?: number;
  [key: string]: unknown;
}

export interface MatchedChunk {
  raw_code?: string;
  [key: string]: unknown;
}

export interface ReviewCandidate {
  repository: ReviewRepository;
  location: ReviewLocation;
  review_priority: ReviewPriority;
  matched_chunk: MatchedChunk;
  matched_by: string[];
  primary_match_signal?: string | null;
  review_reasons: string[];
  [key: string]: unknown;
}

export interface SourceSnippet {
  file_path?: string;
  symbol_name?: string | null;
  raw_code?: string;
  [key: string]: unknown;
}

export interface ReviewFinding {
  source: SourceSnippet;
  top_review_priority: ReviewPriority;
  review_candidate_count: number;
  additional_review_candidates: number;
  candidates: ReviewCandidate[];
  [key: string]: unknown;
}

export interface SlowestChunkTiming {
  source_chunk_id?: string;
  file_path?: string;
  symbol_name?: string;
  total_seconds?: number;
  rule_based_seconds?: number;
  knn_seconds?: number;
  merge_seconds?: number;
}

export interface PrepareLocalQueryRepoTimings {
  total_seconds: number;
  download_snapshot_seconds: number;
  chunk_source_chunks_seconds: number;
  precompute_embeddings_seconds: number;
}

export interface RetrieveHybridCandidatesTimings {
  total_seconds: number;
  source_chunk_count: number;
  aggregate_chunk_seconds: number;
  average_chunk_seconds: number;
  slowest_chunk: SlowestChunkTiming | Record<string, never>;
}

export interface RequestTimings {
  total_seconds: number;
  prepare_local_query_repo: PrepareLocalQueryRepoTimings;
  retrieve_hybrid_candidates: RetrieveHybridCandidatesTimings;
  build_user_facing_payload: {
    total_seconds: number;
  };
}

export interface ReviewResponse {
  report_kind: "license_review_candidate_report";
  interpretation: ReviewInterpretation;
  repo_id?: string;
  repo_url?: string;
  analyzed_source_count: number;
  summary: ReviewSummary;
  limitations?: string[];
  findings: ReviewFinding[];
  timings: RequestTimings;
  [key: string]: unknown;
}

export interface ErrorResponse {
  detail: string;
}

export type RetrieveByRepoUrlResponse = ReviewResponse | ErrorResponse;

export type ReviewErrorKind =
  | "configuration"
  | "validation"
  | "network"
  | "backend"
  | "malformed-response";

export class ReviewApiError extends Error {
  kind: ReviewErrorKind;
  status?: number;

  constructor(kind: ReviewErrorKind, message: string, status?: number) {
    super(message);
    this.name = "ReviewApiError";
    this.kind = kind;
    this.status = status;
  }
}

export const DEFAULT_RETRIEVAL_OPTIONS: RetrievalOptions = {
  rule_based_top_k: 10,
  per_variant_k: 10,
  knn_top_k: 10,
  merged_top_k: 10,
  include_same_repo: false,
  skip_validation: false,
};
