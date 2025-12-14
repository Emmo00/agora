export function LinearProgress({ value = 0, className = "" }: { value?: number; className?: string }) {
  return (
    <div className={`w-full bg-muted border border-border rounded h-2 overflow-hidden ${className}`}>
      <div
        className="h-full bg-foreground transition-all duration-300"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
