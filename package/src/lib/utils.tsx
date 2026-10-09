import { type TreeNodeData } from '@mantine/core';
import type { JsonTreeFunctionDisplay } from '../JsonTree';
import { isWritableContainer, type JsonTreePathSegments } from './path';

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
    /**
     * Set on the synthetic `[start…end]` node that `groupArraysAfterLength`
     * inserts between a long array and its items. It is not a value of the
     * data: it has no address, and its items keep their own paths.
     */
    chunk?: { start: number; end: number };
    /**
     * The type of the container this entry lives in, absent on the root. It
     * tells an object key, which JSON quotes, from an array index, a `Map` or
     * `Set` entry and a group label, which it never does.
     */
    parentType?: ValueType;
    /**
     * Set on the synthetic row `maxDisplayLength` closes a long container with.
     * It is not a value of the data: it stands for the entries left out.
     */
    more?: JsonTreeMoreRow;
    /**
     * Set on the synthetic row that holds the key input while a key is being
     * added to an object (`structuralEdits` with `'add'`).
     */
    draft?: { container: string };
  };
}

/** The row that stands for the entries `maxDisplayLength` left out of a container */
export interface JsonTreeMoreRow {
  /** The tree value (display path) of the container */
  container: string;
  /** How many entries are hidden */
  hidden: number;
  /** The tree value of the first hidden entry, the one revealing more focuses */
  next: string;
  /** What the hidden entries are called */
  unit: 'items' | 'keys' | 'entries';
}

/**
 * Suffixes of the synthetic rows' tree values. Nothing reads them — the rows
 * are told apart by `nodeData.more` / `nodeData.draft` — they only keep the
 * values unique. A NUL is unlikely in a real key but not impossible, the same
 * kind of collision as `{ 'a.b' }` against `{ a: { b } }`.
 */
const MORE_ROW_SUFFIX = '\u0000more';
const DRAFT_ROW_SUFFIX = '\u0000new';

/** The tree value of an entry: its container's tree value and its key, dot-joined */
export function childTreeValue(container: string, key: string | number) {
  return `${container}.${key}`;
}

/** The `[start…end]` label of the group holding `index` in an array of `length` items, `size` per group */
export function getArrayGroupLabel(index: number, size: number, length: number) {
  const start = Math.floor(index / size) * size;
  return `[${start}…${Math.min(start + size, length) - 1}]`;
}

/** Map `visit` over `nodes`, handing back the same array when it changed no node */
function mapNodes(
  nodes: JSONTreeNodeData[],
  visit: (node: JSONTreeNodeData) => JSONTreeNodeData
): JSONTreeNodeData[] {
  let changed = false;
  const next = nodes.map((node) => {
    const visited = visit(node);
    changed ||= visited !== node;
    return visited;
  });
  return changed ? next : nodes;
}

/**
 * Cut every container to its first `limit` entries (or as many as were
 * revealed for it) and close it with a "more" row. An array split into
 * `[start…end]` groups and the groups themselves are left whole: grouping
 * already keeps a long array short, as in Mantine's JsonViewer.
 */
export function limitTreeEntries(
  nodes: JSONTreeNodeData[],
  limit: number,
  revealed: Record<string, number> = {}
): JSONTreeNodeData[] {
  return mapNodes(nodes, (node) => {
    const children = node.children as JSONTreeNodeData[] | undefined;
    if (!children || children.length === 0) {
      return node;
    }
    const nd = node.nodeData;
    const exempt = Boolean(nd?.chunk || children[0]?.nodeData?.chunk);
    const shown = exempt ? children.length : Math.max(limit, revealed[node.value] ?? limit);
    if (children.length <= shown) {
      const visible = limitTreeEntries(children, limit, revealed);
      return visible === children ? node : { ...node, children: visible };
    }
    const visible = limitTreeEntries(children.slice(0, shown), limit, revealed);

    const type = nd?.type ?? 'object';
    const more: JSONTreeNodeData = {
      value: `${node.value}${MORE_ROW_SUFFIX}`,
      label: '',
      nodeData: {
        type,
        value: undefined,
        path: nd?.path ?? node.value,
        depth: (nd?.depth ?? 0) + 1,
        more: {
          container: node.value,
          hidden: children.length - shown,
          next: children[shown].value,
          unit: type === 'object' ? 'keys' : type === 'map' ? 'entries' : 'items',
        },
      },
    };
    return { ...node, children: [...visible, more] };
  });
}

/** Display options that change the shape of the tree, not its values. */
export interface ConvertToTreeDataOptions {
  /** Sort the keys of objects: `true` for alphabetical order, or a comparator */
  sortKeys?: boolean | ((a: string, b: string) => number);
  /** Split an array longer than this into `[start…end]` groups of this many items */
  groupArraysAfterLength?: number;
}

/**
 * The group size for an array of `length` items, or `0` when it is not grouped.
 */
export function getArrayGroupSize(length: number, groupArraysAfterLength?: number): number {
  if (groupArraysAfterLength === undefined || !Number.isFinite(groupArraysAfterLength)) {
    return 0;
  }
  const size = Math.floor(groupArraysAfterLength);
  return size >= 1 && length > size ? size : 0;
}

/**
 * The text of a JSON type badge: numbers read as `int` or `float`, like a JSON
 * schema would type them.
 */
export function getTypeLabel(type: ValueType, value: unknown): string {
  switch (type) {
    case 'number':
      return Number.isInteger(value) ? 'int' : 'float';
    case 'nan':
    case 'infinity':
      return 'number';
    case 'boolean':
      return 'bool';
    case 'react-element':
      return 'element';
    default:
      return type;
  }
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
 * Format a primitive value for display. `withQuotes: false` drops the quotes
 * around a string, and nothing else.
 */
export function formatValue(value: any, type: ValueType, withQuotes = true): string {
  if (type === 'string') {
    return withQuotes ? `"${value}"` : String(value);
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
  // A container reaches this point only when it has nothing to show: it is empty,
  // or `displayFunctions: 'hide'` filtered out every entry. `String()` would print
  // "[object Object]" for an object and the hidden functions' source for an array.
  if (type === 'object') {
    return '{}';
  }
  if (type === 'array') {
    return '[]';
  }
  return String(value);
}

/**
 * Format a key for display. Only an object key can be quoted: an array index, a
 * `Map` or `Set` entry and a `[start…end]` group label are not keys JSON would
 * write between quotes.
 */
export function formatKey(key: string, parentType: ValueType | undefined, withKeyQuotes = false) {
  return withKeyQuotes && parentType === 'object' ? `"${key}"` : key;
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
  segments: JsonTreePathSegments | null = [],
  options: ConvertToTreeDataOptions = {}
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
      null,
      options
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
    if (options.sortKeys) {
      const compare =
        typeof options.sortKeys === 'function'
          ? options.sortKeys
          : (a: string, b: string) => a.localeCompare(b);
      // Display order only: every entry keeps its own key, so paths and edits are unchanged
      entries.sort((a, b) => compare(a[0], b[0]));
    }
  }

  // A long array gets one level of `[start…end]` groups between it and its items
  const groupSize =
    type === 'array' ? getArrayGroupSize(entries.length, options.groupArraysAfterLength) : 0;
  const childDepth = groupSize ? depth + 2 : depth + 1;

  const childAncestors = [...ancestors, value];
  // Only a plain object or an array can be written into. A class instance is
  // rendered as an object and would otherwise hand its properties an address
  // that setValueAtPath refuses — the two rules have to agree, or an edit
  // throws at commit time instead of never being offered.
  const childrenAddressable = isWritableContainer(value);
  // Hidden functions come back as `null`: they are filtered out only after grouping,
  // so a group still covers the indices its label announces.
  const convertedChildren = entries.map(([k, v, segment]) =>
    convertToTreeData(
      v,
      k,
      childTreeValue(path, k),
      childDepth,
      displayFunctions,
      childAncestors,
      // an unaddressable step makes the whole subtree below it unaddressable
      segments === null || segment === undefined || !childrenAddressable
        ? null
        : [...segments, segment],
      options
    )
  );
  const isShown = (node: JSONTreeNodeData | null): node is JSONTreeNodeData => node !== null;
  convertedChildren.forEach((child) => {
    if (child?.nodeData) {
      child.nodeData.parentType = type;
    }
  });

  let children: JSONTreeNodeData[];
  if (groupSize) {
    children = [];
    for (let start = 0; start < entries.length; start += groupSize) {
      const end = Math.min(start + groupSize, entries.length) - 1;
      const groupChildren = convertedChildren.slice(start, end + 1).filter(isShown);
      // Every item hidden (`displayFunctions: 'hide'`): an empty group would render
      // its slice as a value, functions included, so it is left out.
      if (groupChildren.length === 0) {
        continue;
      }
      const label = getArrayGroupLabel(start, groupSize, entries.length);
      const chunkPath = childTreeValue(path, label);
      children.push({
        value: chunkPath,
        label,
        children: groupChildren,
        nodeData: {
          type: 'array',
          value: value.slice(start, end + 1),
          key: label,
          path: chunkPath,
          itemCount: end - start + 1,
          depth: depth + 1,
          pathSegments: undefined,
          chunk: { start, end },
          parentType: 'array',
        },
      });
    }
  } else {
    children = convertedChildren.filter(isShown);
  }

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

/** How keys and strings are displayed, so a search matches what is on screen. */
export interface SearchTreeOptions {
  /** Strings are shown between quotes @default true */
  withQuotes?: boolean;
  /** Object keys are shown between quotes @default false */
  withKeyQuotes?: boolean;
}

/**
 * Search the tree data for nodes matching a query string.
 * Matches against key names and formatted values (case-insensitive), as they are displayed.
 */
export function searchTree(
  nodes: JSONTreeNodeData[],
  query: string,
  { withQuotes = true, withKeyQuotes = false }: SearchTreeOptions = {}
): SearchResult {
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

    // A `[start…end]` group label is not a key of the data: searching "1" must not match it
    if (nd && !nd.chunk) {
      if (
        nd.key !== undefined &&
        formatKey(String(nd.key), nd.parentType, withKeyQuotes).toLowerCase().includes(lowerQuery)
      ) {
        matches = true;
      }
      if (!matches && nd.type && nd.value !== undefined && !isExpandable(nd.value)) {
        const formatted = formatValue(nd.value, nd.type, withQuotes);
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

/** Close the container whose tree value is `container` with a "new key" row. */
export function appendDraftRow(nodes: JSONTreeNodeData[], container: string): JSONTreeNodeData[] {
  return mapNodes(nodes, (node) => {
    const children = node.children as JSONTreeNodeData[] | undefined;
    if (node.value === container) {
      const nd = node.nodeData;
      const draft: JSONTreeNodeData = {
        value: `${container}${DRAFT_ROW_SUFFIX}`,
        label: '',
        nodeData: {
          type: 'string',
          value: '',
          path: nd?.path ?? container,
          depth: (nd?.depth ?? 0) + 1,
          draft: { container },
        },
      };
      return { ...node, children: [...(children ?? []), draft] };
    }
    const next = children && appendDraftRow(children, container);
    return next && next !== children ? { ...node, children: next } : node;
  });
}

/**
 * The entries of a container as the tree lists them, groups flattened: a
 * grouped array's items sit under `[start…end]` nodes but keep the array's
 * path.
 */
export function getContainerEntries(node: JSONTreeNodeData): JSONTreeNodeData[] {
  const children = (node.children ?? []) as JSONTreeNodeData[];
  return children.flatMap((child) =>
    child.nodeData?.chunk ? ((child.children ?? []) as JSONTreeNodeData[]) : [child]
  );
}

/**
 * Where tree values go after a structural edit. `moves` maps each value that
 * changes to its new value (`null` when its node is gone); `keep` lists the
 * moved values that another, unmoved node shares and so must keep.
 */
export interface TreeRemap {
  moves: Map<string, string | null>;
  keep: Set<string>;
}

/**
 * Where every tree value under one container goes after a structural edit:
 * `mapKey` gives the new key of each entry (`null` when it was removed), and
 * the change carries down to everything below it. Only values that change are
 * listed. The walk follows the tree rather than matching path prefixes, so a
 * key holding a dot is never mistaken for a nested one — and since
 * `{ 'a.b': … }` and `{ a: { b: … } }` share the tree value `root.a.b`, a value
 * an unmoved node still holds is kept for it.
 */
export function remapContainerEntries(
  nodes: JSONTreeNodeData[],
  container: string,
  mapKey: (key: string) => string | null
): TreeRemap {
  const moves = new Map<string, string | null>();
  const keep = new Set<string>();
  const node = findNodeByPath(nodes, container);
  if (!node) {
    return { moves, keep };
  }

  const moved = new Set<JSONTreeNodeData>();
  const walk = (current: JSONTreeNodeData, from: string, to: string | null) => {
    moved.add(current);
    moves.set(current.value, to === null ? null : to + current.value.slice(from.length));
    ((current.children ?? []) as JSONTreeNodeData[]).forEach((child) => walk(child, from, to));
  };

  for (const entry of getContainerEntries(node)) {
    const key = entry.nodeData?.key;
    if (key === undefined) {
      continue;
    }
    const mapped = mapKey(key);
    const next = mapped === null ? null : childTreeValue(container, mapped);
    if (next !== entry.value) {
      walk(entry, entry.value, next);
    }
  }

  const findShared = (list: JSONTreeNodeData[]) => {
    for (const current of list) {
      if (!moved.has(current) && moves.has(current.value)) {
        keep.add(current.value);
      }
      findShared((current.children ?? []) as JSONTreeNodeData[]);
    }
  };
  if (moves.size > 0) {
    findShared(nodes);
  }
  return { moves, keep };
}

/** Re-key a record of tree values (an expanded state, say) through a remap. */
export function applyRemap<T>(state: Record<string, T>, { moves, keep }: TreeRemap) {
  const next: Record<string, T> = {};
  for (const [key, value] of Object.entries(state)) {
    if (!moves.has(key) || keep.has(key)) {
      next[key] = value;
    }
  }
  for (const [key, value] of Object.entries(state)) {
    const mapped = moves.get(key);
    if (mapped) {
      next[mapped] = value;
    }
  }
  return next;
}

/**
 * The value a new key or item starts with: the type of the container's last
 * entry, emptied — so a list of numbers grows by a number and a list of
 * objects by an object. An empty container, or a last entry of a type that
 * cannot be emptied (a Date, a Map, …), starts with an empty string.
 */
export function getDefaultNewValue(container: unknown): unknown {
  const entries = Array.isArray(container)
    ? container
    : typeof container === 'object' && container !== null
      ? Object.values(container)
      : [];
  if (entries.length === 0) {
    return '';
  }
  const last = entries[entries.length - 1];
  switch (getValueType(last)) {
    case 'number':
      return 0;
    case 'boolean':
      return false;
    case 'null':
      return null;
    case 'array':
      return [];
    case 'object':
      return isWritableContainer(last) ? {} : '';
    default:
      return '';
  }
}
