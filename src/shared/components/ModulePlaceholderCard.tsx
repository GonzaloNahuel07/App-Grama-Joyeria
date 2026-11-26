import type { LucideIcon } from 'lucide-react';

interface ModulePlaceholderCardProps {
  badge: string;
  title: string;
  description: string;
  items: string[];
  icon: LucideIcon;
}

/**
 * Shared placeholder panel used for modules scheduled in upcoming development blocks.
 */
export function ModulePlaceholderCard({
  badge,
  title,
  description,
  items,
  icon: Icon,
}: ModulePlaceholderCardProps) {
  return (
    <section className="rounded-2xl border border-line bg-card p-5 sm:p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5">
          <span className="inline-block rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-semibold text-accent">
            {badge}
          </span>
          <h1 className="text-lg font-bold tracking-tight sm:text-xl">{title}</h1>
          <p className="text-sm text-muted max-w-2xl">{description}</p>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface border border-line text-ink">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>

      <ul className="grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <li
            key={item}
            className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-xs font-medium text-ink"
          >
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
