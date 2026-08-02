import type { TaskPriority } from "@/types/kanban";

/**
 * Single source of truth for how priority is presented.
 *
 * The darkroom palette carries one hue, so priority is encoded as *density*
 * — how much of that hue is laid down — rather than as three separate
 * colours. The card spine renders this as a step wedge: the strip of
 * graduated density a darkroom uses to calibrate exposure. Height and
 * density move together, which means priority survives being read in
 * greyscale or by someone who can't separate the hues.
 *
 * These maps previously lived duplicated in KanbanTaskCard, TaskDialog and
 * FilterBar, where they had drifted out of agreement on both order and
 * label text.
 */

/** Descending — the order priority is listed in filters and legends. */
export const PRIORITY_ORDER: readonly TaskPriority[] = ["high", "medium", "low"] as const;

/** Ascending — the order the task editor offers, reading low to high. */
export const PRIORITY_ORDER_ASC: readonly TaskPriority[] = ["low", "medium", "high"] as const;

export const PRIORITY_LABEL: Record<TaskPriority, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

/** Abbreviated form, for the filter pills where horizontal room is tight. */
export const PRIORITY_LABEL_SHORT: Record<TaskPriority, string> = {
  high: "High",
  medium: "Med",
  low: "Low",
};

/** Density of the wedge fill. */
export const PRIORITY_FILL: Record<TaskPriority, string> = {
  high: "bg-priority-high",
  medium: "bg-priority-medium",
  low: "bg-priority-low",
};

/** Height of the wedge fill — the second, redundant channel. */
export const PRIORITY_HEIGHT: Record<TaskPriority, string> = {
  high: "h-full",
  medium: "h-2/3",
  low: "h-1/3",
};

/** The `●` glyph in card meta rows and filter pills. */
export const PRIORITY_DOT: Record<TaskPriority, string> = {
  high: "text-priority-high",
  medium: "text-priority-medium",
  low: "text-priority-low",
};
