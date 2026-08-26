"use client";

import { useTransition } from "react";
import type { JobChecklistItem } from "@/lib/types";
import { toggleChecklistItem } from "../actions";

export function Checklist({ jobId, items }: { jobId: string; items: JobChecklistItem[] }) {
  const [isPending, startTransition] = useTransition();
  const completedCount = items.filter((i) => i.is_complete).length;
  const progress = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  return (
    <div>
      <div className="mb-3 h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full bg-navy-950 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mb-3 text-xs text-slate-500">
        {completedCount} of {items.length} steps complete
      </p>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={item.is_complete}
              disabled={isPending}
              onChange={(e) => {
                const checked = e.target.checked;
                startTransition(() => {
                  toggleChecklistItem(jobId, item.id, checked);
                });
              }}
              className="h-4 w-4 rounded border-slate-300"
            />
            <span className={item.is_complete ? "text-slate-400 line-through" : "text-slate-700"}>
              {item.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
