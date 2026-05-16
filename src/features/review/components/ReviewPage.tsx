import { FormEvent, useState } from "react";
import { StatusBanner } from "../../../components/StatusBanner";
import { fetchReviewByRepoUrl, getDefaultFixtureMode } from "../api";
import {
  DEFAULT_RETRIEVAL_OPTIONS,
  ReviewApiError,
  type ReviewRequest,
  type ReviewResponse,
} from "../types";
import { FindingsList } from "./FindingsList";
import { ReviewForm, type ReviewFormValues } from "./ReviewForm";
import { SummaryBand } from "./SummaryBand";

type ViewState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; response: ReviewResponse; isFixture: boolean }
  | { status: "empty"; response: ReviewResponse; isFixture: boolean }
  | { status: "error"; title: string; detail: string };

const DEFAULT_FORM_VALUES: ReviewFormValues = {
  repo_url: "https://github.com/acme/internal-query-engine",
  ...DEFAULT_RETRIEVAL_OPTIONS,
  use_fixture_data: getDefaultFixtureMode(),
};

function isProbablyGitHubRepoUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol.startsWith("http") && parsed.hostname === "github.com";
  } catch {
    return false;
  }
}

function buildRequest(values: ReviewFormValues): ReviewRequest {
  const { use_fixture_data: _ignored, ...request } = values;
  return request;
}

function getEmptyStateMessage(response: ReviewResponse) {
  if (response.analyzed_source_count > 0) {
    return {
      title: "No reviewable matches found",
      detail:
        "The repository was analyzed, but no findings were returned above the configured risk threshold.",
    };
  }

  return {
    title: "Backend returned no findings",
    detail:
      "The request completed successfully, but the backend did not return analyzable source chunks or review candidates.",
  };
}

export function ReviewPage() {
  const [formValues, setFormValues] = useState<ReviewFormValues>(DEFAULT_FORM_VALUES);
  const [viewState, setViewState] = useState<ViewState>({ status: "idle" });

  const activeResponse =
    viewState.status === "success" || viewState.status === "empty" ? viewState.response : null;

  const isFixture = viewState.status === "success" || viewState.status === "empty"
    ? viewState.isFixture
    : formValues.use_fixture_data;

  const handleFieldChange = <Key extends keyof ReviewFormValues>(
    field: Key,
    value: ReviewFormValues[Key],
  ) => {
    setFormValues((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isProbablyGitHubRepoUrl(formValues.repo_url)) {
      setViewState({
        status: "error",
        title: "Backend validation error",
        detail: "Enter a valid GitHub repository URL before submitting the review request.",
      });
      return;
    }

    setViewState({ status: "loading" });

    try {
      const response = await fetchReviewByRepoUrl(buildRequest(formValues), {
        forceFixture: formValues.use_fixture_data,
      });

      if (response.findings.length === 0) {
        setViewState({
          status: "empty",
          response,
          isFixture: formValues.use_fixture_data,
        });
        return;
      }

      setViewState({
        status: "success",
        response,
        isFixture: formValues.use_fixture_data,
      });
    } catch (error) {
      if (error instanceof ReviewApiError) {
        const title =
          error.kind === "validation"
            ? "Backend validation error"
            : error.kind === "malformed-response"
              ? "Malformed response error"
              : error.kind === "network"
                ? "Network error"
                : "Backend request failed";

        setViewState({
          status: "error",
          title,
          detail: error.message,
        });
        return;
      }

      setViewState({
        status: "error",
        title: "Request failed",
        detail: "An unexpected error interrupted the review request.",
      });
    }
  };

  return (
    <main className="page-shell">
      <section className="hero">
        <p className="eyebrow">License review workbench</p>
        <h1>Repository reuse findings</h1>
        <p>
          Submit a GitHub repository URL, inspect high-risk reuse findings, and review
          external code matches that may need license clearance.
        </p>
      </section>

      <ReviewForm
        values={formValues}
        isLoading={viewState.status === "loading"}
        onChange={handleFieldChange}
        onSubmit={handleSubmit}
      />

      {viewState.status === "idle" ? (
        <StatusBanner
          title="Ready for analysis"
          tone="neutral"
          detail="Start with fixture data for UI development, or disable fixture mode to call the backend endpoint directly."
        />
      ) : null}

      {viewState.status === "loading" ? (
        <StatusBanner
          title="Running repository analysis"
          tone="neutral"
          detail="Waiting for retrieval results and license review candidates."
        />
      ) : null}

      {viewState.status === "error" ? (
        <StatusBanner title={viewState.title} tone="error" detail={viewState.detail} />
      ) : null}

      {activeResponse ? <SummaryBand response={activeResponse} isFixture={isFixture} /> : null}

      {viewState.status === "empty" ? (
        <StatusBanner
          title={getEmptyStateMessage(viewState.response).title}
          tone="success"
          detail={getEmptyStateMessage(viewState.response).detail}
        />
      ) : null}

      {viewState.status === "success" ? (
        <FindingsList findings={viewState.response.findings} />
      ) : null}
    </main>
  );
}
