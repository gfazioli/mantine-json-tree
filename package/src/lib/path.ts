/**
 * A resolved address inside the tree.
 *
 * The `path` string that `JsonTree` has always exposed is built by joining keys
 * with dots, which makes it a fine label and a poor address: `{ 'a.b': 1 }` and
 * `{ a: { b: 1 } }` both produce `root.a.b`, and an array index is
 * indistinguishable from an object key that happens to be numeric. Segments
 * keep each step separate, so a write lands where it was aimed.
 *
 * Numbers address array indices, strings address object keys.
 */
export type JsonTreePathSegments = readonly (string | number)[];

/**
 * Containers a value can be written into. `Map` and `Set` are deliberately
 * absent: their entries are rendered under a synthetic display key (a `Map`
 * key can be any value at all, including an object), so there is no segment
 * that could address them unambiguously.
 */
export function isWritableContainer(value: unknown): value is Record<string, unknown> | unknown[] {
  if (Array.isArray(value)) {
    return true;
  }
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/**
 * Return a copy of `root` with the value at `segments` replaced.
 *
 * Only the spine down to the target is cloned; every value hanging off it is
 * carried over by reference. That is what keeps `Date`, `Map`, `Set`, `RegExp`,
 * `BigInt`, functions and React elements intact — a `structuredClone` or a
 * `JSON` round-trip would flatten or destroy all of them.
 *
 * Throws when the address does not resolve, rather than silently writing
 * somewhere else: an unreachable path means the caller and the tree disagree
 * about the shape of the data, and guessing would corrupt it.
 */
export function setValueAtPath<T>(root: T, segments: JsonTreePathSegments, value: unknown): T {
  if (segments.length === 0) {
    return value as T;
  }

  const [segment, ...rest] = segments;

  if (!isWritableContainer(root)) {
    throw new Error(
      `JsonTree: cannot write to "${String(segment)}" — the value holding it is not a plain object or array.`
    );
  }

  if (Array.isArray(root)) {
    const index = typeof segment === 'number' ? segment : Number(segment);
    if (!Number.isInteger(index) || index < 0 || index >= root.length) {
      throw new Error(`JsonTree: index ${String(segment)} is out of range for this array.`);
    }
    const next: unknown[] = [...root];
    next[index] = rest.length === 0 ? value : setValueAtPath(next[index], rest, value);
    return next as T;
  }

  const key = String(segment);
  if (!Object.hasOwn(root, key)) {
    throw new Error(`JsonTree: key "${key}" does not exist on this object.`);
  }
  return {
    ...root,
    [key]: rest.length === 0 ? value : setValueAtPath(root[key], rest, value),
  } as T;
}

/**
 * Read the value at `segments`, or `undefined` when the address does not
 * resolve. Used to hand callbacks the previous value without a second walk.
 */
export function getValueAtPath(root: unknown, segments: JsonTreePathSegments): unknown {
  let current: unknown = root;
  for (const segment of segments) {
    if (Array.isArray(current)) {
      current = current[typeof segment === 'number' ? segment : Number(segment)];
    } else if (typeof current === 'object' && current !== null) {
      current = (current as Record<string, unknown>)[String(segment)];
    } else {
      return undefined;
    }
  }
  return current;
}
