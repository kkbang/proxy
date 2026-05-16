import { useId } from "react";

interface ExpandableCodeBlockProps {
  code: string;
  label: string;
  previewLines?: number;
  defaultExpanded?: boolean;
}

export function ExpandableCodeBlock({
  code,
  label,
  previewLines = 10,
  defaultExpanded = false,
}: ExpandableCodeBlockProps) {
  const lineCount = code.split("\n").length;
  const blockId = useId();

  if (lineCount <= previewLines) {
    return (
      <div className="code-block-wrapper">
        <div className="code-block-label">{label}</div>
        <pre id={blockId} className="code-block">
          <code>{code}</code>
        </pre>
      </div>
    );
  }

  return (
    <details className="code-details" open={defaultExpanded}>
      <summary>
        <span>{label}</span>
        <span>{lineCount} lines</span>
      </summary>
      <pre id={blockId} className="code-block">
        <code>{code}</code>
      </pre>
    </details>
  );
}
