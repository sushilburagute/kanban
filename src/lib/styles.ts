/**
 * Class strings shared by surfaces that must stay visually in step.
 *
 * The selectable-chip pair below was duplicated verbatim in TaskDialog,
 * FilterBar and the settings theme picker. Three copies meant a palette
 * change had to be applied three times to keep the selected state reading
 * the same across the app.
 */

/** Selected state for the chip/pill toggles (priority, column, theme). */
export const TOGGLE_ON = "border-foreground bg-secondary font-medium text-foreground";

/** Unselected state for the same toggles. */
export const TOGGLE_OFF = "text-muted-foreground hover:bg-accent hover:text-foreground";
