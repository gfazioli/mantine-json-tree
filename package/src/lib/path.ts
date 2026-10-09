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

/** The plain object or array at `segments`, or a throw: nothing else can be restructured. */
function containerAt(root: unknown, segments: JsonTreePathSegments) {
  const container = segments.length === 0 ? root : getValueAtPath(root, segments);
  if (!isWritableContainer(container)) {
    throw new Error('JsonTree: the value at this address is not a plain object or array.');
  }
  return container;
}

/** Split an address into its container and its last step, which must be a key or an index. */
function splitLast(segments: JsonTreePathSegments) {
  if (segments.length === 0) {
    throw new Error('JsonTree: the root has no container to be renamed, removed or moved in.');
  }
  return { parent: segments.slice(0, -1), last: segments[segments.length - 1] };
}

/**
 * Return a copy of `root` with the object key at `segments` renamed, keeping
 * its place among the other keys. Only the spine is cloned, as in
 * `setValueAtPath`. Throws on an array index, a missing key, or a new key that
 * already exists — overwriting a sibling would lose data without a word.
 */
export function renameKeyAtPath<T>(root: T, segments: JsonTreePathSegments, newKey: string): T {
  const { parent, last } = splitLast(segments);
  const container = containerAt(root, parent);
  if (Array.isArray(container) || typeof last !== 'string') {
    throw new Error('JsonTree: only an object key can be renamed, not an array index.');
  }
  if (!Object.hasOwn(container, last)) {
    throw new Error(`JsonTree: key "${last}" does not exist on this object.`);
  }
  if (newKey !== last && Object.hasOwn(container, newKey)) {
    throw new Error(`JsonTree: key "${newKey}" already exists on this object.`);
  }
  const next = Object.fromEntries(
    Object.entries(container).map(([key, value]) => [key === last ? newKey : key, value])
  );
  return setValueAtPath(root, parent, next);
}

/**
 * Return a copy of `root` without the key or array item at `segments`. Later
 * items of an array move up one index.
 */
export function removeAtPath<T>(root: T, segments: JsonTreePathSegments): T {
  const { parent, last } = splitLast(segments);
  const container = containerAt(root, parent);
  if (Array.isArray(container)) {
    const index = typeof last === 'number' ? last : Number(last);
    if (!Number.isInteger(index) || index < 0 || index >= container.length) {
      throw new Error(`JsonTree: index ${String(last)} is out of range for this array.`);
    }
    return setValueAtPath(
      root,
      parent,
      container.filter((_, i) => i !== index)
    );
  }
  const key = String(last);
  if (!Object.hasOwn(container, key)) {
    throw new Error(`JsonTree: key "${key}" does not exist on this object.`);
  }
  return setValueAtPath(
    root,
    parent,
    Object.fromEntries(Object.entries(container).filter(([k]) => k !== key))
  );
}

/**
 * Return a copy of `root` with `value` added to the container at `segments`:
 * under `key` on an object (which must not exist yet), or at `key` on an array
 * (its end by default).
 */
export function insertAtPath<T>(
  root: T,
  segments: JsonTreePathSegments,
  key: string | number | undefined,
  value: unknown
): T {
  const container = containerAt(root, segments);
  if (Array.isArray(container)) {
    const index = key === undefined ? container.length : Number(key);
    if (!Number.isInteger(index) || index < 0 || index > container.length) {
      throw new Error(`JsonTree: index ${String(key)} is out of range for this array.`);
    }
    return setValueAtPath(root, segments, [
      ...container.slice(0, index),
      value,
      ...container.slice(index),
    ]);
  }
  if (key === undefined) {
    throw new Error('JsonTree: a key is needed to add to an object.');
  }
  const name = String(key);
  if (Object.hasOwn(container, name)) {
    throw new Error(`JsonTree: key "${name}" already exists on this object.`);
  }
  return setValueAtPath(root, segments, { ...container, [name]: value });
}

/**
 * Return a copy of `root` with the array item at `segments` moved to `toIndex`;
 * the items in between shift by one.
 */
export function moveAtPath<T>(root: T, segments: JsonTreePathSegments, toIndex: number): T {
  const { parent, last } = splitLast(segments);
  const container = containerAt(root, parent);
  if (!Array.isArray(container) || typeof last !== 'number') {
    throw new Error('JsonTree: only an array item can be moved.');
  }
  const inRange = (i: number) => Number.isInteger(i) && i >= 0 && i < container.length;
  if (!inRange(last) || !inRange(toIndex)) {
    throw new Error(`JsonTree: cannot move item ${last} to ${toIndex} in this array.`);
  }
  const next = [...container];
  const [item] = next.splice(last, 1);
  next.splice(toIndex, 0, item);
  return setValueAtPath(root, parent, next);
}
