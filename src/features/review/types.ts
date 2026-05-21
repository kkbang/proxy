export type RiskLevel = "critical" | "high" | "medium" | "low" | (string & {});

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

export interface ReviewSummary {
  critical: number;
  high: number;
  medium: number;
  sources_with_findings: number;
  suppressed_low_risk?: number;
  [key: string]: unknown;
}

export interface ReviewRepository {
  repo_url: string;
  license_spdx?: string | null;
  license_name?: string | null;
  [key: string]: unknown;
}

export interface ReviewLocation {
  file_path: string;
  symbol_name?: string | null;
  [key: string]: unknown;
}

export interface ReviewRisk {
  level: RiskLevel;
  score: number;
  [key: string]: unknown;
}

export interface MatchedChunk {
  raw_code: string;
  [key: string]: unknown;
}

export interface ReviewCandidate {
  repository: ReviewRepository;
  location: ReviewLocation;
  risk: ReviewRisk;
  matched_chunk: MatchedChunk;
  matched_by?: string[];
  match_signal?: string | null;
  why?: string[];
  [key: string]: unknown;
}

export interface SourceSnippet {
  file_path: string;
  symbol_name?: string | null;
  raw_code: string;
  [key: string]: unknown;
}

export interface ReviewFinding {
  source: SourceSnippet;
  top_risk: ReviewRisk;
  review_candidate_count?: number;
  additional_review_candidates?: number;
  candidates: ReviewCandidate[];
  [key: string]: unknown;
}

export interface ReviewResponse {
  repo_id: string;
  repo_url: string;
  analyzed_source_count: number;
  summary: ReviewSummary;
  limitations?: string[];
  findings: ReviewFinding[];
  [key: string]: unknown;
}

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
  rule_based_top_k: 50,
  per_variant_k: 20,
  knn_top_k: 50,
  merged_top_k: 100,
  include_same_repo: false,
  skip_validation: false,
};
