import type { FloorInput, FloorResolved } from "../types/calculator";

export const FLOOR_NAMES = [
  "Ground",
  "First",
  "Second",
  "Third",
  "Fourth",
  "Fifth",
  "Sixth",
  "Seventh",
  "Eighth",
] as const;

export function floorLabel(index: number): string {
  return `${FLOOR_NAMES[index] ?? `Floor ${index + 1}`} Floor`;
}

export function shortFloorName(index: number): string {
  return FLOOR_NAMES[index] ?? `Floor ${index + 1}`;
}

/** 1 -> "G", 4 -> "G+3" */
export function buildingLabel(levels: number): string {
  return levels <= 1 ? "G" : `G+${levels - 1}`;
}

export function emptyFloor(): FloorInput {
  return { areaOverride: null, designRef: null, modified: false };
}

/** Floors a given floor may copy: only earlier floors, and only from the second floor onward. */
export function eligibleReferences(index: number): number[] {
  if (index < 2) return [];
  return Array.from({ length: index }, (_, i) => i);
}

/**
 * Follow "same as" links back to the original design.
 * A modified copy is its own (revised) design.
 */
export function resolveRoot(
  floors: { designRef: number | null; modified: boolean }[],
  index: number,
): number {
  let current = index;
  const seen = new Set<number>();
  while (!seen.has(current)) {
    seen.add(current);
    const f = floors[current];
    if (!f || f.designRef === null || f.modified) return current;
    if (f.designRef < 0 || f.designRef >= current) return current; // invalid link: stop
    current = f.designRef;
  }
  return current;
}

/** Returns the floor index where a circular design reference is detected, or null. */
export function findCircularReference(
  floors: { designRef: number | null }[],
  levels: number,
): number | null {
  for (let start = 0; start < levels; start++) {
    let current: number | null = start;
    let steps = 0;
    while (current !== null && steps <= levels) {
      const ref: number | null = floors[current]?.designRef ?? null;
      if (ref === null || ref < 0 || ref >= levels) break;
      current = ref;
      steps++;
    }
    if (steps > levels) return start;
  }
  return null;
}

export interface FloorResolution {
  floors: FloorResolved[];
  errors: string[];
}

export function resolveFloors(
  inputs: FloorInput[],
  levels: number,
  groundArea: number,
): FloorResolution {
  const errors: string[] = [];
  const floors: FloorResolved[] = [];

  const cycle = findCircularReference(inputs, levels);
  if (cycle !== null) {
    errors.push(`Circular design reference involving ${floorLabel(cycle)}.`);
  }

  for (let i = 0; i < levels; i++) {
    const f = inputs[i] ?? emptyFloor();

    let area = groundArea;
    if (i > 0 && f.areaOverride !== null) {
      if (!Number.isFinite(f.areaOverride) || f.areaOverride <= 0) {
        errors.push(`${floorLabel(i)}: area must be a positive number.`);
      } else {
        area = f.areaOverride;
      }
    }

    let ref = f.designRef;
    if (ref !== null) {
      if (i < 2) {
        errors.push(`${floorLabel(i)} must be a new design.`);
        ref = null;
      } else if (!Number.isInteger(ref) || ref < 0) {
        errors.push(`${floorLabel(i)}: invalid design reference.`);
        ref = null;
      } else if (ref >= i) {
        errors.push(
          `${floorLabel(i)} cannot use the design of ${floorLabel(ref)}; only earlier floors can be referenced.`,
        );
        ref = null;
      }
    }

    const modified = f.modified && ref !== null;
    const root = ref === null || modified ? i : floors[ref].designRoot;

    floors.push({
      index: i,
      label: floorLabel(i),
      areaSqft: area,
      designRoot: root,
      rootLabel: floorLabel(root),
      isUnique: root === i,
      refersTo: ref,
      modified,
    });
  }

  return { floors, errors };
}
