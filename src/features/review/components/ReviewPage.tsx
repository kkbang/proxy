import { FormEvent, useState } from "react";
import { StatusBanner } from "../../../components/StatusBanner";
import { fetchReviewByRepoUrl } from "../api";
import { validateGitHubRepoUrl } from "../repoUrl";
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
  | { status: "success"; response: ReviewResponse }
  | { status: "empty"; response: ReviewResponse }
  | { status: "error"; title: string; detail: string };

const DEFAULT_FORM_VALUES: ReviewFormValues = {
  repo_url: "https://github.com/acme/telescope",
  ...DEFAULT_RETRIEVAL_OPTIONS,
};

function buildRequest(values: ReviewFormValues, normalizedRepoUrl: string): ReviewRequest {
  return {
    ...values,
    repo_url: normalizedRepoUrl,
  };
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
  const repoUrlValidation = validateGitHubRepoUrl(formValues.repo_url);
  const repoUrlError = repoUrlValidation.isValid ? null : repoUrlValidation.message;

  const activeResponse =
    viewState.status === "success" || viewState.status === "empty" ? viewState.response : null;

  const handleFieldChange = <Key extends keyof ReviewFormValues>(
    field: Key,
    value: ReviewFormValues[Key],
  ) => {
    setFormValues((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleRepoUrlBlur = () => {
    if (!repoUrlValidation.isValid) {
      return;
    }

    if (repoUrlValidation.normalizedUrl === formValues.repo_url) {
      return;
    }

    setFormValues((current) => ({
      ...current,
      repo_url: repoUrlValidation.normalizedUrl,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!repoUrlValidation.isValid) {
      setViewState({
        status: "error",
        title: "Security validation failed",
        detail: repoUrlValidation.message,
      });
      return;
    }

    if (repoUrlValidation.normalizedUrl !== formValues.repo_url) {
      setFormValues((current) => ({
        ...current,
        repo_url: repoUrlValidation.normalizedUrl,
      }));
    }

    setViewState({ status: "loading" });

    try {
      const response = await fetchReviewByRepoUrl(buildRequest(formValues, repoUrlValidation.normalizedUrl));

      if (response.findings.length === 0) {
        setViewState({
          status: "empty",
          response,
        });
        return;
      }

      setViewState({
        status: "success",
        response,
      });
    } catch (error) {
      if (error instanceof ReviewApiError) {
        const title =
          error.kind === "configuration"
            ? "API configuration error"
            : error.kind === "validation"
            ? "Backend validation error"
            : error.kind === "backend" && error.status === 429
              ? "Backend resource limit reached"
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
        repoUrlError={repoUrlError}
        onChange={handleFieldChange}
        onRepoUrlBlur={handleRepoUrlBlur}
        onSubmit={handleSubmit}
      />

      {viewState.status === "idle" ? (
        <StatusBanner
          title="Ready for analysis"
          tone="neutral"
          detail="Submit a GitHub repository URL to call the backend retrieval API and load live review findings."
        />
      ) : null}

      {viewState.status === "loading" ? (
        <StatusBanner
          title="Running repository analysis"
          tone="neutral"
          detail="Waiting for retrieval results and license review candidates."
          isLoading
        />
      ) : null}

      {viewState.status === "error" ? (
        <StatusBanner title={viewState.title} tone="error" detail={viewState.detail} />
      ) : null}

      {activeResponse ? <SummaryBand response={activeResponse} /> : null}

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
