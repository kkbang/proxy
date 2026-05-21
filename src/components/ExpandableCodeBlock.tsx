import { useId, useState } from "react";

interface ExpandableCodeBlockProps {
  code: string;
  label: string;
  previewLines?: number;
  defaultExpanded?: boolean;
  toggleMode?: "line-count" | "show-hide";
}

export function ExpandableCodeBlock({
  code,
  label,
  previewLines = 10,
  defaultExpanded = false,
  toggleMode = "line-count",
}: ExpandableCodeBlockProps) {
  const lineCount = code.split("\n").length;
  const blockId = useId();
  const [isOpen, setIsOpen] = useState(defaultExpanded);

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
    <details
      className="code-details"
      open={isOpen}
      onToggle={(event) => setIsOpen(event.currentTarget.open)}
    >
      <summary>
        <span>{label}</span>
        {toggleMode === "show-hide" ? (
          <span className={`code-toggle code-toggle--${isOpen ? "open" : "closed"}`}>
            <span className="code-toggle__knob" aria-hidden="true" />
            <span className="code-toggle__label">{isOpen ? "Hide" : "Show"}</span>
          </span>
        ) : (
          <span>{lineCount} lines</span>
        )}
      </summary>
      <pre id={blockId} className="code-block">
        <code>{code}</code>
      </pre>
    </details>
  );
}
