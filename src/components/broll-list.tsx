"use client";

export type BrollListItem = {
  id: string;
  filename: string;
  thumbnailDataUrl: string;
  description: string | null;
};

export function BrollList({ items }: { items: BrollListItem[] }) {
  if (items.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        No B-roll yet. Add a video file above to get started.
      </p>
    );
  }
  return (
    <ul className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex flex-col overflow-hidden rounded-lg border bg-muted/30"
        >
          <div className="aspect-video w-full shrink-0 overflow-hidden bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.thumbnailDataUrl}
              alt={item.filename}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex flex-1 flex-col gap-1 p-3">
            <p className="truncate text-sm font-medium" title={item.filename}>
              {item.filename}
            </p>
            {item.description && (
              <p className="text-muted-foreground line-clamp-2 text-xs">
                {item.description}
              </p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
