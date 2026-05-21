import { sortCandidatesByRisk, sortFindingsByRisk } from "../../lib/risk";
import { validateGitHubRepoUrl } from "./repoUrl";
import {
  ReviewApiError,
  type ReviewCandidate,
  type ReviewFinding,
  type ReviewPriorityLevel,
  type ReviewRequest,
  type ReviewResponse,
} from "./types";

function getApiBaseUrl() {
  const runtimeConfigured = window.__APP_CONFIG__?.apiBaseUrl?.trim();

  if (runtimeConfigured) {
    return runtimeConfigured.replace(/\/$/, "");
  }

  const configured = import.meta.env.VITE_API_BASE_URL?.trim();
  return configured ? configured.replace(/\/$/, "") : "/api";
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isPriorityLevel(value: unknown): value is ReviewPriorityLevel {
  return value === "critical" || value === "high" || value === "medium";
}

function isPriorityContainer(
  value: unknown,
  field: "top_review_priority" | "review_priority",
) {
  if (!isObject(value)) {
    return false;
  }

  const priority = value[field];
  return (
    isObject(priority) &&
    (priority.level === undefined || isPriorityLevel(priority.level)) &&
    (priority.score === undefined || typeof priority.score === "number")
  );
}

function isCandidate(value: unknown): value is ReviewCandidate {
  return (
    isObject(value) &&
    isObject(value.repository) &&
    (value.repository.repo_url === undefined || typeof value.repository.repo_url === "string") &&
    isObject(value.location) &&
    (value.location.file_path === undefined || typeof value.location.file_path === "string") &&
    isObject(value.matched_chunk) &&
    (value.matched_chunk.raw_code === undefined ||
      typeof value.matched_chunk.raw_code === "string") &&
    Array.isArray(value.matched_by) &&
    value.matched_by.every((item) => typeof item === "string") &&
    Array.isArray(value.review_reasons) &&
    value.review_reasons.every((item) => typeof item === "string") &&
    isPriorityContainer(value, "review_priority")
  );
}

function isFinding(value: unknown): value is ReviewFinding {
  return (
    isObject(value) &&
    isObject(value.source) &&
    (value.source.file_path === undefined || typeof value.source.file_path === "string") &&
    (value.source.raw_code === undefined || typeof value.source.raw_code === "string") &&
    typeof value.review_candidate_count === "number" &&
    typeof value.additional_review_candidates === "number" &&
    Array.isArray(value.candidates) &&
    value.candidates.every(isCandidate) &&
    isPriorityContainer(value, "top_review_priority")
  );
}

function isReviewResponse(value: unknown): value is ReviewResponse {
  return (
    isObject(value) &&
    value.report_kind === "license_review_candidate_report" &&
    isObject(value.interpretation) &&
    value.interpretation.mode === "review_candidates_not_violation_judgment" &&
    typeof value.interpretation.disclaimer === "string" &&
    (value.repo_id === undefined || typeof value.repo_id === "string") &&
    (value.repo_url === undefined || typeof value.repo_url === "string") &&
    typeof value.analyzed_source_count === "number" &&
    isObject(value.summary) &&
    isObject(value.summary.review_priority_counts) &&
    typeof value.summary.review_priority_counts.critical === "number" &&
    typeof value.summary.review_priority_counts.high === "number" &&
    typeof value.summary.review_priority_counts.medium === "number" &&
    typeof value.summary.sources_with_findings === "number" &&
    typeof value.summary.suppressed_low_priority === "number" &&
    (value.limitations === undefined ||
      (Array.isArray(value.limitations) &&
        value.limitations.every((item) => typeof item === "string"))) &&
    Array.isArray(value.findings) &&
    value.findings.every(isFinding)
  );
}

function normalizeResponse(response: ReviewResponse): ReviewResponse {
  return {
    ...response,
    findings: sortFindingsByRisk(response.findings).map((finding) => ({
      ...finding,
      candidates: sortCandidatesByRisk(finding.candidates),
    })),
  };
}

async function parseError(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = (await response.json()) as Record<string, unknown>;
    const detail =
      typeof body.detail === "string"
        ? body.detail
        : typeof body.message === "string"
          ? body.message
          : JSON.stringify(body);
    return detail;
  }

  const text = await response.text();
  return text || `Request failed with status ${response.status}.`;
}

function isBackendMemoryLimitError(message: string) {
  return (
    message.includes("circuit_breaking_exception") ||
    message.includes("Data too large") ||
    message.includes("TransportError(429")
  );
}

function buildBackendMemoryLimitMessage(request: ReviewRequest, rawMessage: string) {
  return [
    "The backend ran into its memory limit while building retrieval results for this repository.",
    "Try smaller retrieval settings such as rule_based_top_k 10 or less, knn_top_k 10 or less, per_variant_k 10 or less, and merged_top_k 10 or less.",
    `Current request: rule_based_top_k=${request.rule_based_top_k}, per_variant_k=${request.per_variant_k}, knn_top_k=${request.knn_top_k}, merged_top_k=${request.merged_top_k}.`,
    `Backend detail: ${rawMessage}`,
  ].join(" ");
}

export async function fetchReviewByRepoUrl(
  request: ReviewRequest,
  options?: { signal?: AbortSignal },
) {
  const repoUrlValidation = validateGitHubRepoUrl(request.repo_url);

  if (!repoUrlValidation.isValid) {
    throw new ReviewApiError("validation", repoUrlValidation.message);
  }

  const sanitizedRequest = {
    ...request,
    repo_url: repoUrlValidation.normalizedUrl,
  };
  const endpoint = `${getApiBaseUrl()}/retrieve/hybrid/by-repo-url`;

  let response: Response;

  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sanitizedRequest),
      signal: options?.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }

    throw new ReviewApiError(
      "network",
      "The review request could not reach the backend. Check that the /api proxy is configured and the backend server is reachable from the frontend host.",
    );
  }

  if (!response.ok) {
    const message = await parseError(response);

    if (response.status === 429 && isBackendMemoryLimitError(message)) {
      throw new ReviewApiError(
        "backend",
        buildBackendMemoryLimitMessage(sanitizedRequest, message),
        response.status,
      );
    }

    if (response.status === 404) {
      throw new ReviewApiError(
        "backend",
        `Backend endpoint not found (404): POST ${response.url || endpoint}. Verify that /api is proxying to the backend and that the backend exposes /retrieve/hybrid/by-repo-url.`,
        response.status,
      );
    }

    const kind = response.status >= 400 && response.status < 500 ? "validation" : "backend";
    throw new ReviewApiError(kind, message, response.status);
  }

  const payload = (await response.json()) as unknown;

  if (!isReviewResponse(payload)) {
    throw new ReviewApiError(
      "malformed-response",
      "The backend response did not match the expected review schema.",
    );
  }

  return normalizeResponse(payload);
}
