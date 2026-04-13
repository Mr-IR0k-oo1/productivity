interface WorkspaceHeaderProps {
  title: string;
  subtitle: string;
}

export function WorkspaceHeader({ title, subtitle }: WorkspaceHeaderProps) {
  return (
    <div className="space-y-1">
      <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{title}</h1>
      <p className="text-sm text-neutral-400 sm:text-base">{subtitle}</p>
    </div>
  );
}
