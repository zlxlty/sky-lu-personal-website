interface StaticReactSmokeProps {
  label: string;
}

export function StaticReactSmoke({ label }: StaticReactSmokeProps) {
  return (
    <p
      data-smoke="react"
      className="m-0 rounded-sm border border-current/20 px-3 py-2 text-sm"
    >
      {label}
    </p>
  );
}
