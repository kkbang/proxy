interface StatusBannerProps {
  title: string;
  tone: "neutral" | "error" | "success";
  detail?: string;
  isLoading?: boolean;
}

export function StatusBanner({ title, tone, detail, isLoading = false }: StatusBannerProps) {
  return (
    <section
      className={`status-banner status-banner--${tone}${isLoading ? " status-banner--loading" : ""}`}
      aria-live={isLoading ? "polite" : undefined}
      aria-busy={isLoading || undefined}
    >
      <div className="status-banner__header">
        {isLoading ? (
          <span className="loading-orb" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        ) : null}
        <h2>{title}</h2>
      </div>
      {detail ? <p>{detail}</p> : null}
      {isLoading ? (
        <div className="loading-rail" aria-hidden="true">
          <span className="loading-rail__bar" />
        </div>
      ) : null}
    </section>
  );
}
