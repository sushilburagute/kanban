"use client";

import * as React from "react";
import { Search, X } from "lucide-react";

import { PRIORITY_DOT, PRIORITY_LABEL_SHORT, PRIORITY_ORDER } from "@/lib/priority";
import { TOGGLE_OFF, TOGGLE_ON } from "@/lib/styles";
import { cn } from "@/lib/utils";
import type { KanbanTask, TaskPriority } from "@/types/kanban";

export type BoardFilter = {
  query: string;
  priorities: TaskPriority[];
  label: string | null;
};

export const EMPTY_FILTER: BoardFilter = { query: "", priorities: [], label: null };

export function isFilterActive(filter: BoardFilter) {
  return filter.query.trim().length > 0 || filter.priorities.length > 0 || filter.label !== null;
}

export function taskMatchesFilter(task: KanbanTask, filter: BoardFilter) {
  const query = filter.query.trim().toLowerCase();
  if (query) {
    const haystack = `${task.title} ${task.description ?? ""} ${task.labels.join(" ")}`.toLowerCase();
    if (!haystack.includes(query)) return false;
  }

  if (filter.priorities.length && !filter.priorities.includes(task.priority)) {
    return false;
  }

  if (filter.label && !task.labels.includes(filter.label)) {
    return false;
  }

  return true;
}

type FilterBarProps = {
  filter: BoardFilter;
  onChange: (filter: BoardFilter) => void;
  labels: string[];
};

export function FilterBar({ filter, onChange, labels }: FilterBarProps) {
  const active = isFilterActive(filter);
  const searchRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      event.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const togglePriority = (priority: TaskPriority) => {
    const priorities = filter.priorities.includes(priority)
      ? filter.priorities.filter((item) => item !== priority)
      : [...filter.priorities, priority];
    onChange({ ...filter, priorities });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          ref={searchRef}
          type="search"
          value={filter.query}
          onChange={(event) => onChange({ ...filter, query: event.target.value })}
          placeholder="Search cards…  ( / )"
          className="h-8 w-56 rounded-md border border-input bg-transparent pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Search cards"
        />
      </div>

      <div className="flex items-center gap-1" role="group" aria-label="Filter by priority">
        {PRIORITY_ORDER.map((priority) => {
          const selected = filter.priorities.includes(priority);
          return (
            <button
              key={priority}
              type="button"
              aria-pressed={selected}
              onClick={() => togglePriority(priority)}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 font-mono text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selected ? TOGGLE_ON : cn("border-input", TOGGLE_OFF)
              )}
            >
              <span aria-hidden className={cn("text-[8px]", PRIORITY_DOT[priority])}>
                ●
              </span>
              {PRIORITY_LABEL_SHORT[priority]}
            </button>
          );
        })}
      </div>

      {labels.length ? (
        <select
          value={filter.label ?? ""}
          onChange={(event) => onChange({ ...filter, label: event.target.value || null })}
          className={cn(
            "h-8 rounded-md border border-input bg-transparent px-2 font-mono text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            filter.label ? "text-foreground" : "text-muted-foreground"
          )}
          aria-label="Filter by label"
        >
          <option value="" className="bg-card text-foreground">
            All labels
          </option>
          {labels.map((label) => (
            <option key={label} value={label} className="bg-card text-foreground">
              #{label}
            </option>
          ))}
        </select>
      ) : null}

      {active ? (
        <button
          type="button"
          onClick={() => onChange(EMPTY_FILTER)}
          className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
          Clear
        </button>
      ) : null}
    </div>
  );
}
