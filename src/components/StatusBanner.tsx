interface StatusBannerProps {
  title: string;
  tone: "neutral" | "error" | "success";
  detail?: string;
}

export function StatusBanner({ title, tone, detail }: StatusBannerProps) {
  return (
    <section className={`status-banner status-banner--${tone}`}>
      <h2>{title}</h2>
      {detail ? <p>{detail}</p> : null}
    </section>
  );
}
