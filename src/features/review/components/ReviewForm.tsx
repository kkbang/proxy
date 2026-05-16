import type { FormEvent } from "react";
import { DEFAULT_RETRIEVAL_OPTIONS, type ReviewRequest } from "../types";

export interface ReviewFormValues extends ReviewRequest {
  use_fixture_data: boolean;
}

interface ReviewFormProps {
  values: ReviewFormValues;
  isLoading: boolean;
  onChange: <Key extends keyof ReviewFormValues>(
    field: Key,
    value: ReviewFormValues[Key],
  ) => void;
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
  onChange,
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
            onChange={(event) => onChange("repo_url", event.target.value)}
            required
          />
          <button type="submit" disabled={isLoading}>
            {isLoading ? "Analyzing..." : "Analyze"}
          </button>
        </div>
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
