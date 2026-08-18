import { type TreeNodeData } from '@mantine/core';
import type { JsonTreeFunctionDisplay } from '../JsonTree';
import type { JsonTreePathSegments } from './path';

export interface JSONTreeNodeData extends TreeNodeData {
  nodeData?: {
    type: ValueType;
    value: any;
    key?: string;
    path: string;
    itemCount?: number;
    depth?: number;
    /**
     * The node's address as separate steps, or `undefined` when it has none.
     *
     * `path` is a display label — it joins keys with dots, so `{ 'a.b': 1 }` and
     * `{ a: { b: 1 } }` collide on `root.a.b`, and an array index reads the same
     * as a numeric object key. Segments keep the steps apart, which is what
     * makes a write land where it was aimed.
     *
     * `undefined` marks a node that cannot be addressed at all: everything under
     * a `Map` or `Set` (their entries are rendered under a synthetic display key)
     * and everything under a function expanded via `displayFunctions:
     * 'as-object'` (those properties belong to a synthetic object that does not
     * exist in the data).
     */
    pathSegments?: JsonTreePathSegments;
  };
}

/**
 * Type of a JSON value for rendering purposes.
 */
export type ValueType =
  | 'object'
  | 'array'
  | 'string'
  | 'number'
  | 'boolean'
  | 'null'
  | 'undefined'
  | 'function'
  | 'react-element'
  | 'date'
  | 'nan'
  | 'infinity'
  | 'bigint'
  | 'symbol'
  | 'regexp'
  | 'map'
  | 'set'
  | 'circular';

/**
 * Check if a value is a React element.
 *
 * Detection relies on the `$$typeof` marker alone. React stamps every element
 * with a symbol from the global registry (`react.element`,
 * `react.transitional.element`, …), so matching the `react.` prefix also covers
 * renderer variants without enumerating them. A structural `type` + `props`
 * check would misread ordinary data: `{ type: 'text', props: { … } }` is an
 * everyday shape in form-builder and low-code JSON, and treating it as an
 * element hides the whole subtree behind `<Component />`.
 */
function isReactElement(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const marker = (value as { $$typeof?: unknown }).$$typeof;
  return typeof marker === 'symbol' && (marker.description ?? '').startsWith('react.');
}

/**
 * Check whether a value can take part in a reference cycle.
 */
function isReferenceType(value: unknown): boolean {
  return (typeof value === 'object' && value !== null) || typeof value === 'function';
}

/**
 * Get the type of a value for display purposes.
 */
export function getValueType(value: any): ValueType {
  if (value === null) {
    return 'null';
  }
  if (value === undefined) {
    return 'undefined';
  }
  if (typeof value === 'number') {
    if (Number.isNaN(value)) {
      return 'nan';
    }
    if (!Number.isFinite(value)) {
      return 'infinity';
    }
    return 'number';
  }
  if (isReactElement(value)) {
    return 'react-element';
  }
  if (value instanceof Date) {
    return 'date';
  }
  if (value instanceof RegExp) {
    return 'regexp';
  }
  if (value instanceof Map) {
    return 'map';
  }
  if (value instanceof Set) {
    return 'set';
  }
  if (typeof value === 'bigint') {
    return 'bigint';
  }
  if (typeof value === 'symbol') {
    return 'symbol';
  }
  if (Array.isArray(value)) {
    return 'array';
  }
  if (typeof value === 'function') {
    return 'function';
  }
  return typeof value as ValueType;
}

/**
 * Check if a value is expandable (object or array with content).
 */
export function isExpandable(value: any): boolean {
  const type = getValueType(value);
  if (type === 'object') {
    return Object.keys(value).length > 0;
  }
  if (type === 'array') {
    return value.length > 0;
  }
  if (type === 'map') {
    return value.size > 0;
  }
  if (type === 'set') {
    return value.size > 0;
  }
  return false;
}

/**
 * Format a primitive value for display.
 */
export function formatValue(value: any, type: ValueType): string {
  if (type === 'string') {
    return `"${value}"`;
  }
  if (type === 'null') {
    return 'null';
  }
  if (type === 'undefined') {
    return 'undefined';
  }
  if (type === 'nan') {
    return 'NaN';
  }
  if (type === 'infinity') {
    return value > 0 ? 'Infinity' : '-Infinity';
  }
  if (type === 'function') {
    const name = value.name;
    return name ? `[Function: ${name}]` : '[Function]';
  }
  if (type === 'react-element') {
    const componentName = value.type?.displayName || value.type?.name || value.type;
    return `<${typeof componentName === 'string' ? componentName : 'Component'} />`;
  }
  if (type === 'date') {
    return value.toISOString();
  }
  if (type === 'bigint') {
    return `${value}n`;
  }
  if (type === 'symbol') {
    return value.toString();
  }
  if (type === 'regexp') {
    return value.toString();
  }
  if (type === 'map') {
    return `Map(${value.size})`;
  }
  if (type === 'set') {
    return `Set(${value.size})`;
  }
  if (type === 'circular') {
    return '[Circular]';
  }
  return String(value);
}

/**
 * Values JSON cannot express, rendered the way the tree shows them. Returns
 * `undefined` when JSON is able to represent the value on its own.
 */
function formatNonJsonValue(value: unknown): string | undefined {
  const type = getValueType(value);
  if (type === 'undefined' || type === 'function' || type === 'symbol' || type === 'bigint') {
    return formatValue(value, type);
  }
  return undefined;
}

/**
 * A `JSON.stringify` replacer that swaps reference cycles for the same
 * `[Circular]` marker the tree renders, and non-JSON leaves for their displayed
 * form. It follows the ancestor chain rather than a set of everything already
 * seen, so a value referenced from two sibling branches — shared, not circular —
 * is still serialized in full on both sides, exactly as the tree expands it.
 */
function createCycleSafeReplacer() {
  const ancestors: unknown[] = [];

  return function replacer(this: unknown, _key: string, value: unknown): unknown {
    const nonJson = formatNonJsonValue(value);
    if (nonJson !== undefined) {
      return nonJson;
    }

    if (isReferenceType(value)) {
      // `this` is the holder the value was read from: unwind the chain back to
      // it before testing, so only real ancestors count.
      const index = ancestors.indexOf(this);
      if (index === -1) {
        ancestors.push(this);
      } else {
        ancestors.length = index + 1;
      }
      if (ancestors.includes(value)) {
        return '[Circular]';
      }
    }

    return value;
  };
}

/**
 * Serialize a value for the clipboard the way the tree displays it.
 *
 * `JSON.stringify` alone does not cover what the tree can render: it returns
 * `undefined` for `undefined`, functions and symbols — which would put the
 * literal text "undefined" on the clipboard — and it throws on BigInt and on
 * anything holding a reference cycle, which the copy handlers swallowed as a
 * silent no-op. Both cases now fall back to the rendered form, so what lands on
 * the clipboard matches what is on screen.
 */
export function stringifyValue(value: unknown): string {
  const direct = formatNonJsonValue(value);
  if (direct !== undefined) {
    return direct;
  }

  try {
    const json = JSON.stringify(value, createCycleSafeReplacer(), 2);
    if (json !== undefined) {
      return json;
    }
  } catch {
    // Values JSON refuses outright fall through to the rendered form below
  }

  return formatValue(value, getValueType(value));
}

/**
 * Get the count of items in an object or array.
 */
export function getItemCount(value: any): number {
  if (Array.isArray(value)) {
    return value.length;
  }
  if (value instanceof Map || value instanceof Set) {
    return value.size;
  }
  if (typeof value === 'object' && value !== null) {
    return Object.keys(value).length;
  }
  return 0;
}

/**
 * Convert JSON data to Mantine Tree format.
 */
export function convertToTreeData(
  value: any,
  key?: string,
  path: string = 'root',
  depth: number = 0,
  displayFunctions: JsonTreeFunctionDisplay = 'as-string',
  ancestors: readonly unknown[] = [],
  // `null` marks an unaddressable subtree. It cannot be `undefined`: passing
  // `undefined` to a parameter with a default re-triggers that default, which
  // would silently hand every Map/Set child a valid-looking address.
  segments: JsonTreePathSegments | null = []
): JSONTreeNodeData {
  const type = getValueType(value);
  // `null` is the internal sentinel; the public shape uses `undefined`
  const pathSegments = segments ?? undefined;

  // Guard against reference cycles, which would otherwise recurse until the
  // stack blows (`obj.self = obj` is routine in debug panels and object graphs).
  // Only the current ancestor chain is tracked, never every value already seen,
  // so a value referenced twice in sibling branches — shared but not circular —
  // still expands normally in both places.
  if (isReferenceType(value) && ancestors.includes(value)) {
    return {
      value: path,
      label: key ?? path,
      nodeData: { type: 'circular', value, key, path, depth, pathSegments },
    };
  }

  // Handle React elements as primitive values to avoid circular reference issues
  if (type === 'react-element') {
    return {
      value: path,
      label: key ?? path,
      nodeData: { type, value, key, path, depth, pathSegments },
    };
  }

  // Handle Date, BigInt, Symbol, RegExp, NaN, Infinity as primitive values
  if (
    type === 'date' ||
    type === 'bigint' ||
    type === 'symbol' ||
    type === 'regexp' ||
    type === 'nan' ||
    type === 'infinity'
  ) {
    return {
      value: path,
      label: key ?? path,
      nodeData: { type, value, key, path, depth, pathSegments },
    };
  }

  // Handle functions based on displayFunctions setting
  if (type === 'function') {
    if (displayFunctions === 'hide') {
      // Return null to skip this node (will be filtered later)
      return null as any;
    }
    if (displayFunctions === 'as-string') {
      // Treat as primitive string value
      return {
        value: path,
        label: key ?? path,
        nodeData: { type, value, key, path, depth, pathSegments },
      };
    }
    // displayFunctions === 'as-object': treat function as object to show its properties
    const functionProps = Object.getOwnPropertyNames(value).reduce(
      (acc, prop) => {
        acc[prop] = value[prop];
        return acc;
      },
      {} as Record<string, any>
    );
    return convertToTreeData(
      functionProps,
      key,
      path,
      depth,
      displayFunctions,
      [...ancestors, value],
      // these properties belong to a synthetic object, so none of them is addressable
      null
    );
  }

  const expandable = isExpandable(value);
  const nodeValue = path;

  if (!expandable) {
    return {
      value: nodeValue,
      label: key ?? path,
      nodeData: { type, value, key, path, depth, pathSegments },
    };
  }

  // [display key, value, addressable segment]. The segment is `undefined` where
  // the entry cannot be addressed: a Map key can be any value at all, and a Set
  // has no keys, so their display keys are synthetic and cannot be written back.
  let entries: [string, any, string | number | undefined][] = [];
  if (type === 'array') {
    entries = value.map(
      (item: any, index: number) =>
        [String(index), item, index] as [string, any, string | number | undefined]
    );
  } else if (type === 'map') {
    entries = Array.from(value.entries() as Iterable<[any, any]>).map(
      ([k, v]: [any, any], index: number) =>
        [`[${index}] ${String(k)}`, v, undefined] as [string, any, string | number | undefined]
    );
  } else if (type === 'set') {
    entries = Array.from(value.values()).map(
      (item: any, index: number) =>
        [String(index), item, undefined] as [string, any, string | number | undefined]
    );
  } else {
    entries = Object.entries(value).map(
      ([k, v]) => [k, v, k] as [string, any, string | number | undefined]
    );
  }

  const childAncestors = [...ancestors, value];
  const children = entries
    .map(([k, v, segment]) =>
      convertToTreeData(
        v,
        k,
        `${path}.${k}`,
        depth + 1,
        displayFunctions,
        childAncestors,
        // an unaddressable step makes the whole subtree below it unaddressable
        segments === null || segment === undefined ? null : [...segments, segment]
      )
    )
    .filter((node) => node !== null); // Filter out hidden functions

  return {
    value: nodeValue,
    label: key ?? path,
    children,
    nodeData: {
      type,
      value,
      key,
      path,
      itemCount: getItemCount(value),
      depth,
      pathSegments,
    },
  };
}

/**
 * Result of a search operation on the JSON tree.
 */
export interface SearchResult {
  /** All paths to keep visible (direct matches + ancestors) */
  matchedPaths: Set<string>;
  /** Only paths where key or value directly matches the query (for row highlight) */
  directMatches: Set<string>;
  /** Ancestor paths that must be expanded to reveal matches */
  expandedPaths: string[];
}

/**
 * Search the tree data for nodes matching a query string.
 * Matches against key names and formatted values (case-insensitive).
 */
export function searchTree(nodes: JSONTreeNodeData[], query: string): SearchResult {
  const matchedPaths = new Set<string>();
  const directMatches = new Set<string>();
  const expandedPaths = new Set<string>();

  if (!query.trim()) {
    return { matchedPaths, directMatches, expandedPaths: [] };
  }

  const lowerQuery = query.toLowerCase();

  function traverse(node: JSONTreeNodeData, ancestors: string[]): boolean {
    const nd = node.nodeData;
    let matches = false;

    if (nd) {
      if (nd.key !== undefined && String(nd.key).toLowerCase().includes(lowerQuery)) {
        matches = true;
      }
      if (!matches && nd.type && nd.value !== undefined && !isExpandable(nd.value)) {
        const formatted = formatValue(nd.value, nd.type);
        if (formatted.toLowerCase().includes(lowerQuery)) {
          matches = true;
        }
      }
    }

    let childMatches = false;
    if (node.children) {
      for (const child of node.children as JSONTreeNodeData[]) {
        if (traverse(child, [...ancestors, node.value])) {
          childMatches = true;
        }
      }
    }

    if (matches || childMatches) {
      matchedPaths.add(node.value);
      if (matches) {
        directMatches.add(node.value);
      }
      ancestors.forEach((a) => {
        matchedPaths.add(a);
        expandedPaths.add(a);
      });
      if (node.children) {
        expandedPaths.add(node.value);
      }
      return true;
    }

    return false;
  }

  for (const node of nodes) {
    traverse(node, []);
  }

  return { matchedPaths, directMatches, expandedPaths: Array.from(expandedPaths) };
}

/**
 * Filter tree nodes to keep only those in matchedPaths (direct matches + ancestors).
 */
export function filterTreeBySearch(
  nodes: JSONTreeNodeData[],
  matchedPaths: Set<string>
): JSONTreeNodeData[] {
  return nodes.reduce((acc: JSONTreeNodeData[], node) => {
    if (matchedPaths.has(node.value)) {
      const filteredChildren = node.children
        ? filterTreeBySearch(node.children as JSONTreeNodeData[], matchedPaths)
        : undefined;
      acc.push({
        ...node,
        children: filteredChildren && filteredChildren.length > 0 ? filteredChildren : undefined,
      });
    }
    return acc;
  }, []);
}

/**
 * Find a node in the tree by its path value.
 */
export function findNodeByPath(
  nodes: JSONTreeNodeData[],
  targetPath: string
): JSONTreeNodeData | null {
  for (const node of nodes) {
    if (node.value === targetPath) {
      return node;
    }
    if (node.children) {
      const found = findNodeByPath(node.children as JSONTreeNodeData[], targetPath);
      if (found) {
        return found;
      }
    }
  }
  return null;
}
