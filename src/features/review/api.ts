import { sortCandidatesByRisk, sortFindingsByRisk } from "../../lib/risk";
import { validateGitHubRepoUrl } from "./repoUrl";
import {
  ReviewApiError,
  type ReviewCandidate,
  type ReviewFinding,
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

function isRiskContainer(value: unknown, field: "top_risk" | "risk") {
  if (!isObject(value)) {
    return false;
  }

  const risk = value[field];
  return (
    isObject(risk) &&
    typeof risk.level === "string" &&
    typeof risk.score === "number"
  );
}

function isCandidate(value: unknown): value is ReviewCandidate {
  return (
    isObject(value) &&
    isObject(value.repository) &&
    typeof value.repository.repo_url === "string" &&
    isObject(value.location) &&
    typeof value.location.file_path === "string" &&
    isObject(value.matched_chunk) &&
    typeof value.matched_chunk.raw_code === "string" &&
    isRiskContainer(value, "risk")
  );
}

function isFinding(value: unknown): value is ReviewFinding {
  return (
    isObject(value) &&
    isObject(value.source) &&
    typeof value.source.file_path === "string" &&
    typeof value.source.raw_code === "string" &&
    Array.isArray(value.candidates) &&
    value.candidates.every(isCandidate) &&
    isRiskContainer(value, "top_risk")
  );
}

function isReviewResponse(value: unknown): value is ReviewResponse {
  return (
    isObject(value) &&
    typeof value.repo_id === "string" &&
    typeof value.repo_url === "string" &&
    typeof value.analyzed_source_count === "number" &&
    isObject(value.summary) &&
    typeof value.summary.critical === "number" &&
    typeof value.summary.high === "number" &&
    typeof value.summary.medium === "number" &&
    typeof value.summary.sources_with_findings === "number" &&
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
    "Try smaller retrieval settings such as rule_based_top_k 20 or less, knn_top_k 20 or less, per_variant_k 10 or less, and merged_top_k 40 or less.",
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
