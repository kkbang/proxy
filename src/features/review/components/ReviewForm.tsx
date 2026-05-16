import type { FormEvent } from "react";
import { DEFAULT_RETRIEVAL_OPTIONS, type ReviewRequest } from "../types";

export interface ReviewFormValues extends ReviewRequest {
  use_fixture_data: boolean;
}

interface ReviewFormProps {
  values: ReviewFormValues;
  isLoading: boolean;
  repoUrlError: string | null;
  onChange: <Key extends keyof ReviewFormValues>(
    field: Key,
    value: ReviewFormValues[Key],
  ) => void;
  onRepoUrlBlur: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

type NumericRetrievalField =
  | "source_chunk_limit"
  | "rule_based_top_k"
  | "per_variant_k"
  | "knn_top_k"
  | "merged_top_k";

const NUMERIC_FIELDS: NumericRetrievalField[] = [
  "source_chunk_limit",
  "rule_based_top_k",
  "per_variant_k",
  "knn_top_k",
  "merged_top_k",
];

export function ReviewForm({
  values,
  isLoading,
  repoUrlError,
  onChange,
  onRepoUrlBlur,
  onSubmit,
}: ReviewFormProps) {
  return (
    <form className="review-form" onSubmit={onSubmit}>
      <div className="field-group">
        <label htmlFor="repo_url">GitHub repository URL</label>
        <div className="input-row">
          <input
            id="repo_url"
            name="repo_url"
            type="url"
            inputMode="url"
            placeholder="https://github.com/owner/repo"
            value={values.repo_url}
            aria-invalid={Boolean(repoUrlError)}
            aria-describedby={repoUrlError ? "repo_url_help repo_url_error" : "repo_url_help"}
            onChange={(event) => onChange("repo_url", event.target.value)}
            onBlur={onRepoUrlBlur}
            required
          />
          <button type="submit" disabled={isLoading || Boolean(repoUrlError)}>
            {isLoading ? "Analyzing..." : "Analyze"}
          </button>
        </div>
        <p id="repo_url_help" className="field-help">
          Only HTTPS GitHub repository root URLs are allowed. Query strings, fragments,
          credentials, custom ports, and nested paths are rejected.
        </p>
        {repoUrlError ? (
          <p id="repo_url_error" className="field-error" role="alert">
            {repoUrlError}
          </p>
        ) : null}
      </div>

      <details className="advanced-options">
        <summary>Advanced retrieval options</summary>
        <div className="advanced-options__grid">
          {NUMERIC_FIELDS.map((field) => (
            <label key={field}>
              <span>{field}</span>
              <input
                type="number"
                min={1}
                step={1}
                value={values[field]}
                onChange={(event) => onChange(field, Number(event.target.value))}
              />
            </label>
          ))}

          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={values.include_same_repo}
              onChange={(event) => onChange("include_same_repo", event.target.checked)}
            />
            <span>Include same-repo matches</span>
          </label>

          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={values.skip_validation}
              onChange={(event) => onChange("skip_validation", event.target.checked)}
            />
            <span>Skip backend validation</span>
          </label>

          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={values.use_fixture_data}
              onChange={(event) => onChange("use_fixture_data", event.target.checked)}
            />
            <span>Use local fixture response</span>
          </label>
        </div>
      </details>
    </form>
  );
}
