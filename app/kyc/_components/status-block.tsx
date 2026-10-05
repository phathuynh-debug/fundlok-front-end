// Shared status layout for the GVerify verification screens.
export function StatusBlock({
  icon,
  title,
  hint,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  hint: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="space-y-5">
      <div className="flex justify-center">{icon}</div>
      <div className="space-y-1.5">
        <h1 className="text-xl font-bold tracking-tight">{title}</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">{hint}</p>
      </div>
      {children}
    </div>
  );
}
