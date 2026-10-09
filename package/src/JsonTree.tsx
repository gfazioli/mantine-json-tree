import {
  ActionIcon,
  Badge,
  Box,
  CloseButton,
  Code,
  Divider,
  createVarsResolver,
  Factory,
  factory,
  getTreeExpandedState,
  Group,
  MantineRadius,
  MantineSize,
  Paper,
  rem,
  ScrollArea,
  TextInput,
  type TextInputProps,
  StylesApiProps,
  Text,
  Tooltip,
  Tree,
  UnstyledButton,
  useProps,
  useRandomClassName,
  useStyles,
  useTree,
  type BoxProps,
  type RenderTreeNodePayload,
  type StyleProp,
  type TooltipProps,
} from '@mantine/core';
import { useDebouncedValue, useMergedRef } from '@mantine/hooks';
import {
  IconArrowBarToDown,
  IconArrowBarToUp,
  IconArrowDown,
  IconArrowUp,
  IconCheck,
  IconChevronRight,
  IconCopy,
  IconPlus,
  IconSearch,
  IconTrash,
} from '@tabler/icons-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { JsonTreeMediaVariables } from './JsonTreeMediaVariables';
import { JsonTreeValueEditor, type JsonTreeEditorProps } from './JsonTreeValueEditor';
import {
  getValueAtPath,
  insertAtPath,
  isWritableContainer,
  moveAtPath,
  removeAtPath,
  renameKeyAtPath,
  setValueAtPath,
  type JsonTreePathSegments,
} from './lib/path';
import {
  appendDraftRow,
  applyRemap,
  convertToTreeData,
  filterTreeBySearch,
  findNodeByPath,
  findNodeBySegments,
  formatKey,
  formatValue,
  getArrayGroupSize,
  getContainerEntries,
  getDefaultNewValue,
  getItemCount,
  getTypeLabel,
  getValueType,
  isExpandable,
  limitTreeEntries,
  childTreeValue,
  getArrayGroupLabel,
  remapContainerEntries,
  searchTree,
  type TreeRemap,
  stringifyValue,
  type JsonTreeMoreRow,
  type JSONTreeNodeData,
  type ValueType,
} from './lib/utils';
import classes from './JsonTree.module.css';

export type JsonTreeStylesNames =
  | 'root'
  | 'paper'
  | 'header'
  | 'toolbar'
  | 'controls'
  | 'expandCollapse'
  | 'keyCountBadge'
  | 'copyAllButton'
  | 'searchToggle'
  | 'searchBar'
  | 'searchInput'
  | 'searchHighlight'
  | 'key'
  | 'keyValueSeparator'
  | 'value'
  | 'bracket'
  | 'ellipsis'
  | 'itemsCount'
  | 'indentGuide'
  | 'copyButton'
  | 'lineNumber'
  | 'valueEditor'
  | 'typeBadge'
  | 'showMore'
  | 'moreItems'
  | 'keyEditor'
  | 'addButton'
  | 'removeButton'
  | 'moveButton';

export type JsonTreeCssVariables = {
  root:
    | '--json-tree-font-family'
    | '--json-tree-font-size'
    | '--json-tree-highlight-added-color'
    | '--json-tree-highlight-removed-color'
    | '--json-tree-highlight-changed-color';
  header: '--json-tree-header-background-color' | '--json-tree-header-sticky-offset';
  key: '--json-tree-color-key' | '--json-tree-color-editable-outline';
  value:
    | '--json-tree-color-string'
    | '--json-tree-color-number'
    | '--json-tree-color-boolean'
    | '--json-tree-color-null'
    | '--json-tree-color-function'
    | '--json-tree-color-react-element'
    | '--json-tree-color-date'
    | '--json-tree-color-nan'
    | '--json-tree-color-infinity'
    | '--json-tree-color-bigint'
    | '--json-tree-color-symbol'
    | '--json-tree-color-regexp'
    | '--json-tree-color-map'
    | '--json-tree-color-set'
    | '--json-tree-color-circular'
    | '--json-tree-color-editable-outline';
  bracket: '--json-tree-color-bracket';
  indentGuide:
    | '--json-tree-indent-guide-color-0'
    | '--json-tree-indent-guide-color-1'
    | '--json-tree-indent-guide-color-2'
    | '--json-tree-indent-guide-color-3'
    | '--json-tree-indent-guide-color-4';
  expandCollapse: never;
  ellipsis: '--json-tree-color-ellipsis';
  lineNumber: '--json-tree-color-line-number';
  itemsCount: never;
  controls: never;
  keyValueSeparator: never;
  copyButton: never;
  paper: never;
  toolbar: never;
  keyCountBadge: never;
  copyAllButton: never;
  searchToggle: never;
  searchBar: never;
  searchInput: never;
  searchHighlight: '--json-tree-search-highlight-color';
  valueEditor: never;
  typeBadge: never;
  showMore: never;
  moreItems: never;
  keyEditor: never;
  addButton: never;
  removeButton: never;
  moveButton: never;
};

export interface JsonTreeBaseProps {
  /** The data to display (object, array, or any JSON-serializable value) */
  data: unknown;

  /** Label for the root node @default 'root' */
  rootName?: string;

  /** Whether nodes should be expanded by default @default false */
  defaultExpanded?: boolean;

  /** Maximum depth to auto-expand (0 = collapsed, -1 = expand all) @default 2 */
  maxDepth?: number;

  /** Callback when a node is clicked */
  onNodeClick?: (path: string, value: any) => void;

  /** Callback when a value is copied to clipboard */
  onCopy?: (copy: string, value: unknown) => void;

  /** Callback when a node is expanded */
  onExpand?: (path: string) => void;

  /** Callback when a node is collapsed */
  onCollapse?: (path: string) => void;

  /** Whether to show the root expand/collapse all button @default false */
  withExpandAll?: boolean;

  /** Size of the font, supports responsive object @default 'xs' */
  size?: StyleProp<MantineSize | (string & {}) | number>;

  /** Title displayed above the JSON tree  */
  title?: React.ReactNode;

  /** Whether to show item counts for objects and arrays @default false */
  showItemsCount?: boolean;

  /** Whether to show a copy to clipboard button for each node @default false */
  withCopyToClipboard?: boolean;

  /** Whether to show indent guides (vertical lines) for nested nodes @default false */
  showIndentGuides?: boolean;

  /** Whether to show line numbers @default false */
  showLineNumbers?: boolean;

  /** Whether to show the full JSON path in a tooltip on hover @default false */
  showPathOnHover?: boolean;

  /** Props passed to the Tooltip component when showPathOnHover is enabled */
  tooltipProps?: Omit<TooltipProps, 'label' | 'children'>;

  /** Maximum height of the tree, enables scrolling when content exceeds this value */
  maxHeight?: React.CSSProperties['maxHeight'];

  /** Controlled expanded state (array of node paths that are expanded) */
  expanded?: string[];

  /** Callback when expanded state changes */
  onExpandedChange?: (expanded: string[]) => void;

  /**
   * Expand every node, array groups included, and lock them open: the toggles
   * and the expand/collapse all controls are hidden and the keyboard cannot
   * collapse a node. `defaultExpanded`, `maxDepth` and a controlled `expanded`
   * are ignored while it is on.
   * @default false
   */
  allExpanded?: boolean;

  /** If set, the header is sticky @default `false` */
  stickyHeader?: boolean;

  /** Offset for the sticky header (e.g. to account for a fixed navbar) @default 0*/
  stickyHeaderOffset?: number | string;

  /** Icon for expand button */
  expandControlIcon?: React.ReactNode;

  /** Icon for collapse button */
  collapseControlIcon?: React.ReactNode;

  /** Icon for expand all control */
  expandAllControlIcon?: React.ReactNode;

  /** Icon for collapse all control */
  collapseAllControlIcon?: React.ReactNode;

  /** Icon for copy to clipboard button */
  copyToClipboardIcon?: React.ReactNode;

  /** How to display functions in the JSON data @default 'as-string' */
  displayFunctions?: JsonTreeFunctionDisplay;

  /**
   * Sort the keys of objects: `true` for alphabetical order, or a comparator.
   * Display order only: paths, search and edits are unchanged. Memoize a
   * comparator, a new function on every render rebuilds the tree.
   * @default false
   */
  sortKeys?: boolean | ((a: string, b: string) => number);

  /**
   * Split arrays longer than this into collapsible `[start…end]` groups of this
   * many items, so a large array does not render all of its items at once. Each
   * group is one more level of the tree, which `maxDepth` counts too.
   */
  groupArraysAfterLength?: number;

  /** Truncate string values longer than this many characters, with a toggle to show the full text */
  collapseStringsAfterLength?: number;

  /**
   * Show at most this many entries of an object, array, `Map` or `Set`, and close
   * it with a "… N more items" row that reveals the next as many on click (or
   * Enter). An array split by `groupArraysAfterLength` is left whole, and so is
   * every container while a search is active. Copy, search and expand all always
   * work on the full value.
   * @default false
   */
  maxDisplayLength?: number | false;

  /** Return how a node changed to highlight it diff-style, or `null` to leave it as is. Not called for the `[start…end]` groups of `groupArraysAfterLength` */
  highlightNode?: (payload: JsonTreeHighlightPayload) => JsonTreeHighlight | null | undefined;

  /** Whether to show a type badge (`string`, `int`, `float`, `bool`, `object`, …) next to every value @default false */
  showValueTypes?: boolean;

  /** Whether to show quotes around string values. Copy still produces valid JSON either way @default true */
  withQuotes?: boolean;

  /** Whether to show quotes around object keys. Array indices, `Map` and `Set` entries and group labels are never quoted @default false */
  withKeyQuotes?: boolean;

  /** Whether to wrap the component in a Paper with a border @default false */
  withBorder?: boolean;

  /** Paper radius when withBorder is enabled @default 'sm' */
  borderRadius?: MantineRadius;

  /** Whether to show a badge with the total key/item count next to the title @default false */
  withKeyCountBadge?: boolean;

  /** Custom label for the key count badge. Receives count, returns string. */
  keyCountBadgeLabel?: (count: number) => string;

  /** Whether to show a global copy-to-clipboard button in the toolbar @default false */
  withCopyAll?: boolean;

  /** Icon for the global copy-to-clipboard button */
  copyAllIcon?: React.ReactNode;

  /** Callback when the entire JSON is copied to clipboard */
  onCopyAll?: (json: string) => void;

  /** Whether to show the search toggle button in the toolbar @default false */
  withSearch?: boolean;

  /** Icon for the search toggle button */
  searchIcon?: React.ReactNode;

  /** Placeholder text for the search input @default 'Filter keys and values...' */
  searchPlaceholder?: string;

  /** Controlled search query value */
  searchQuery?: string;

  /** Callback when search query changes */
  onSearchChange?: (query: string) => void;

  /** Debounce delay for search in ms @default 300 */
  searchDebounce?: number;

  /**
   * Props forwarded to the internal search `TextInput`. Use this to fully customize
   * the search input via Mantine's native `classNames`, `styles`, `vars`, `variant`,
   * `radius`, `size`, etc. — no specificity workarounds required.
   *
   * `value`, `defaultValue`, and `onChange` are intentionally excluded:
   * `JsonTree` owns the search state. To control or observe it, use the
   * top-level `searchQuery` and `onSearchChange` props.
   *
   * @example
   * ```tsx
   * <JsonTree
   *   withSearch
   *   searchInputProps={{
   *     styles: { input: { backgroundColor: 'var(--mantine-color-dark-7)' } },
   *   }}
   * />
   * ```
   */
  searchInputProps?: Omit<TextInputProps, 'value' | 'defaultValue' | 'onChange'>;

  /**
   * Whether primitive values can be edited in place.
   *
   * `JsonTree` is controlled while editing: it never holds a copy of your data,
   * so `onChange` must be wired up and its value fed back through `data` for an
   * edit to stick.
   *
   * @default false
   */
  editable?: boolean;

  /**
   * Called after a value is committed, with the next data and a description of
   * what changed. The original object is never mutated: only the spine down to
   * the edited node is rebuilt, so `Date`, `Map`, `Set`, `RegExp`, `BigInt`,
   * functions and React elements elsewhere in the tree keep their identity.
   */
  onChange?: (value: unknown, change: JsonTreeChange) => void;

  /**
   * Which value types are editable.
   *
   * Everything outside this list stays read-only, which is why `Map` and `Set`
   * entries can never be edited: their keys are synthetic (a `Map` key can be
   * any value at all) and so cannot be addressed for a write.
   *
   * @default ['string', 'number', 'boolean']
   */
  editableTypes?: JsonTreeEditableType[];

  /** Return `false` to keep an individual node read-only while `editable` is on */
  isEditable?: (payload: JsonTreeNodePayload) => boolean;

  /** Return an error message to reject an edit, or `null` to accept it */
  validate?: (payload: JsonTreeNodePayload) => string | null;

  /** Props forwarded to the inline editor input */
  editorProps?: JsonTreeEditorProps;

  /**
   * Structural edits allowed on top of value edits while `editable` is on:
   * `'rename'` an object key, `'add'` a key or an item, `'remove'` one, and
   * `'reorder'` the items of an array. `true` allows all four.
   *
   * Click a key to rename it, or press F2 on its row; Delete or Backspace
   * removes the focused row, Insert or `+` adds to it, and Alt + ↑ / ↓ moves an
   * array item. Each row also gets its own buttons. Expanded nodes, revealed
   * pages and focus follow every change, so the tree never jumps under the
   * reader's hands.
   *
   * @default false
   */
  structuralEdits?: boolean | JsonTreeStructuralEdit[];

  /**
   * The value a new key or item starts with. By default it copies the type of
   * the container's last entry, emptied (`''`, `0`, `false`, `null`, `{}`, `[]`),
   * and starts as an empty string otherwise. A new string or number opens its
   * editor straight away.
   */
  getNewValue?: (container: JsonTreeNodePayload) => unknown;

  /**
   * Return an error message to reject a key typed to rename or add, or `null`
   * to accept it. A key that already exists on the object is always rejected.
   */
  validateKey?: (key: string, container: JsonTreeNodePayload) => string | null;
}

/** Display mode for functions in JSON data */
export type JsonTreeFunctionDisplay = 'as-string' | 'hide' | 'as-object';

/** Value types that in-place editing can handle */
export type JsonTreeEditableType = 'string' | 'number' | 'boolean';

/** Structural edits `structuralEdits` can allow on top of value edits */
export type JsonTreeStructuralEdit = 'rename' | 'add' | 'remove' | 'reorder';

/** What a change did: `edit` changed a value, the others come from `structuralEdits` */
export type JsonTreeChangeAction = 'edit' | JsonTreeStructuralEdit;

const ALL_STRUCTURAL_EDITS: JsonTreeStructuralEdit[] = ['rename', 'add', 'remove', 'reorder'];

/** Everything known about the node an editing callback is being asked about */
export interface JsonTreeNodePayload {
  /** Display path, e.g. `root.address.city`. Not unique — see `pathSegments` */
  path: string;
  /** The node's address, one step per level. Object keys are strings, array indices numbers */
  pathSegments: JsonTreePathSegments;
  /** The key this value is stored under, absent on the root */
  key?: string;
  /** The node's value type */
  type: ValueType;
  /** The node's current value */
  value: unknown;
}

/** How a node changed, as `highlightNode` reports it */
export type JsonTreeHighlight = 'added' | 'removed' | 'changed';

/** The node `highlightNode` is asked about */
export interface JsonTreeHighlightPayload {
  /** Display path, e.g. `root.address.city`. Not unique — see `pathSegments` */
  path: string;
  /** The node's address, absent under a `Map`, a `Set` or a function shown as an object */
  pathSegments?: JsonTreePathSegments;
  /** The key this value is stored under, absent on the root */
  key?: string;
  /** The node's value type */
  type: ValueType;
  /** The node's value */
  value: unknown;
}

/**
 * Describes a committed change. `path`, `pathSegments`, `key`, `type` and
 * `value` describe the node as it is after the change; for a `remove`, the node
 * that was removed, with `value` undefined.
 */
export interface JsonTreeChange extends JsonTreeNodePayload {
  /** What happened: `edit` for a value, or a structural edit */
  action: JsonTreeChangeAction;
  /** The value the node held before the change, `undefined` for an `add` */
  previousValue: unknown;
  /** Where a renamed or reordered node was before */
  previousPath?: string;
  /** The address a renamed or reordered node had before */
  previousPathSegments?: JsonTreePathSegments;
  /** The key a renamed or reordered node had before (an index, for an array item) */
  previousKey?: string;
}

export interface JsonTreeProps
  extends BoxProps, JsonTreeBaseProps, StylesApiProps<JsonTreeFactory> {}

export type JsonTreeFactory = Factory<{
  props: JsonTreeProps;
  ref: HTMLDivElement;
  stylesNames: JsonTreeStylesNames;
  vars: JsonTreeCssVariables;
}>;

export const defaultProps: Partial<JsonTreeProps> = {
  rootName: 'root',
  defaultExpanded: false,
  maxDepth: 2,
  withExpandAll: false,
  showItemsCount: false,
  withCopyToClipboard: false,
  showIndentGuides: false,
  showLineNumbers: false,
  showPathOnHover: false,
  stickyHeader: false,
  displayFunctions: 'as-string',
  expandAllControlIcon: <IconArrowBarToDown size={16} />,
  collapseAllControlIcon: <IconArrowBarToUp size={16} />,
  copyToClipboardIcon: <IconCopy size={12} />,
  withBorder: false,
  borderRadius: 'sm',
  withKeyCountBadge: false,
  withCopyAll: false,
  withSearch: false,
  copyAllIcon: <IconCopy size={16} />,
  searchIcon: <IconSearch size={16} />,
  searchPlaceholder: 'Filter keys and values...',
  searchDebounce: 300,
  editable: false,
  editableTypes: ['string', 'number', 'boolean'],
  sortKeys: false,
  showValueTypes: false,
  withQuotes: true,
  withKeyQuotes: false,
  allExpanded: false,
};

/** Cut a string at `limit` characters without splitting a surrogate pair (an emoji, say) in two */
function truncateString(text: string, limit: number) {
  const code = text.charCodeAt(limit - 1);
  const splitsPair = code >= 0xd800 && code <= 0xdbff;
  return text.slice(0, splitsPair ? limit - 1 : limit);
}

/**
 * A string value cut at `limit` characters, with a toggle to read the rest. It is
 * its own component because `renderJSONNode` is a plain function and the open
 * state has to live with the row.
 */
function CollapsibleString({
  value,
  limit,
  withQuotes,
  getStyles,
  children,
}: {
  value: string;
  limit: number;
  withQuotes?: boolean;
  getStyles: ReturnType<typeof useStyles<JsonTreeFactory>>;
  children: (display: string) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {children(
        formatValue(open ? value : `${truncateString(value, limit)}…`, 'string', withQuotes)
      )}
      <UnstyledButton
        {...getStyles('showMore')}
        aria-expanded={open}
        onClick={(event: React.MouseEvent) => {
          // the row's own click toggles the node or calls onNodeClick
          event.stopPropagation();
          setOpen((current) => !current);
        }}
      >
        {open ? 'show less' : 'show more'}
      </UnstyledButton>
    </>
  );
}

/** A positive whole-number limit, or 0 for none */
function toLimit(limit: number | false | undefined) {
  return typeof limit === 'number' && Number.isFinite(limit) ? Math.max(1, Math.floor(limit)) : 0;
}

const noop = () => {};

const ADD_ICON = <IconPlus size={12} />;
const MOVE_UP_ICON = <IconArrowUp size={12} />;
const MOVE_DOWN_ICON = <IconArrowDown size={12} />;
const REMOVE_ICON = <IconTrash size={12} />;

/** Keys that act on the focused row, by the `data-json-tree-action` of the row's own control */
const ROW_SHORTCUTS: Record<string, string> = {
  F2: 'rename',
  Delete: 'remove',
  Backspace: 'remove',
  Insert: 'add',
  '+': 'add',
};

/** Alt + these keys move an array item; caught on the way down, since Mantine's Tree stops the arrows */
const MOVE_SHORTCUTS: Record<string, string> = { ArrowUp: 'move-up', ArrowDown: 'move-down' };

/**
 * The row's own control matching `selector`. The row's content is the
 * `[data-json-tree-row]` element right under its `li`; an open `li` also holds
 * every nested row, whose controls must never answer for it.
 */
function rowControl(row: Element | null | undefined, selector: string) {
  return row?.querySelector<HTMLElement>(`:scope > [data-json-tree-row] ${selector}`) ?? null;
}

/** A row to focus: its tree value, and its address when known, since tree values can collide */
interface FocusTarget {
  value: string;
  segments?: JsonTreePathSegments;
}

/** Which structural edits a row offers; `parentLength` is set for an array item */
interface StructureCaps {
  rename: boolean;
  add: boolean;
  remove: boolean;
  reorder: boolean;
  parentLength: number;
}

/** Elements that own the Enter key themselves — activating them must win over editing. */
const KEYBOARD_ACTIVATED_SELECTOR =
  'button, a[href], input, textarea, select, [contenteditable]:not([contenteditable="false"])';

/** Form controls whose own copy shortcut must not be hijacked. */
const FORM_CONTROL_SELECTOR =
  'input, textarea, select, [contenteditable]:not([contenteditable="false"])';

interface RenderNodeContext {
  getStyles: ReturnType<typeof useStyles<JsonTreeFactory>>;
  copyToClipboardIcon: React.ReactNode;
  expandControlIcon: React.ReactNode;
  collapseControlIcon: React.ReactNode;
  onExpand?: (path: string) => void;
  onCollapse?: (path: string) => void;
  onExpandedChange?: (expanded: string[]) => void;
  /** `allExpanded`: every node is open and none can be collapsed */
  locked?: boolean;
  /** Reveal the next page of a container cut by `maxDisplayLength` */
  onRevealMore?: (more: JsonTreeMoreRow) => void;
  /** `editable` is on */
  editing?: boolean;
  /** Serialized segments of the node whose key is being renamed, if any */
  renamingKey?: string | null;
  /** The structural edits a row offers, or null for none */
  structureCaps?: (node: JSONTreeNodeData) => StructureCaps | null;
  onStartRename?: (key: string, row: HTMLElement | null) => void;
  validateRename?: (node: JSONTreeNodeData, key: string) => string | null;
  onRename?: (node: JSONTreeNodeData, key: string) => void;
  onCancelStructure?: () => void;
  onStartAdd?: (node: JSONTreeNodeData, row: HTMLElement | null) => void;
  /** Vet and commit the key typed in the "new key" row */
  validateNewKey?: (key: string) => string | null;
  onAddKey?: (key: string) => void;
  onRemove?: (node: JSONTreeNodeData) => void;
  onMove?: (node: JSONTreeNodeData, direction: -1 | 1) => void;
  searchQuery?: string;
  matchedPaths?: Set<string>;
  directMatches?: Set<string>;
  /** Serialized segments of the node currently being edited, if any */
  editingKey?: string | null;
  onStartEdit?: (key: string, row: HTMLElement | null) => void;
  onCommitEdit?: (node: JSONTreeNodeData, value: unknown) => void;
  onCancelEdit?: () => void;
  isNodeEditable?: (node: JSONTreeNodeData) => boolean;
  validateNode?: (node: JSONTreeNodeData, value: unknown) => string | null;
  editorProps?: JsonTreeEditorProps;
}

function highlightText(
  text: string,
  query: string,
  getStyles: RenderNodeContext['getStyles']
): React.ReactNode {
  if (!query) {
    return text;
  }
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const idx = lowerText.indexOf(lowerQuery);
  if (idx === -1) {
    return text;
  }

  return (
    <>
      {text.substring(0, idx)}
      <span {...getStyles('searchHighlight')}>{text.substring(idx, idx + query.length)}</span>
      {text.substring(idx + query.length)}
    </>
  );
}

function CopyNodeButton({
  icon,
  getStyles,
  onCopy,
}: {
  icon: React.ReactNode;
  getStyles: RenderNodeContext['getStyles'];
  onCopy: (e: React.MouseEvent) => Promise<boolean>;
}) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleClick = async (e: React.MouseEvent) => {
    const success = await onCopy(e);
    if (!success) {
      return;
    }
    setCopied(true);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setCopied(false);
      timeoutRef.current = null;
    }, 1500);
  };

  return (
    <ActionIcon
      size="xs"
      variant="subtle"
      color={copied ? 'green' : 'gray'}
      onClick={handleClick}
      {...getStyles('copyButton')}
    >
      {copied ? <IconCheck size={12} /> : icon}
    </ActionIcon>
  );
}

function renderJSONNode(
  { node, expanded, hasChildren, elementProps, tree }: RenderTreeNodePayload,
  props: JsonTreeProps,
  ctx: RenderNodeContext,
  onNodeClick?: (path: string, value: any) => void
) {
  const {
    getStyles,
    copyToClipboardIcon,
    expandControlIcon,
    collapseControlIcon,
    onExpand,
    onCollapse,
    onExpandedChange,
  } = ctx;
  const jsonNode = node as JSONTreeNodeData;

  const {
    type,
    value,
    key,
    path,
    itemCount,
    depth = 0,
    pathSegments,
    chunk,
    parentType,
  } = jsonNode.nodeData || {
    type: 'null' as ValueType,
    value: null,
    path: 'unknown',
    depth: 0,
  };

  const {
    showItemsCount,
    withCopyToClipboard,
    onCopy,
    showIndentGuides,
    showLineNumbers,
    showPathOnHover,
    tooltipProps,
    collapseStringsAfterLength,
    showValueTypes,
    highlightNode,
    withQuotes,
    withKeyQuotes,
  } = props;

  // Render indent guides (vertical lines)
  const renderIndentGuides = () => {
    if (!showIndentGuides || depth === 0) {
      return null;
    }

    const guides = [];
    for (let i = 0; i < depth; i++) {
      const colorIndex = i % 5;
      guides.push(
        <div
          key={i}
          {...getStyles('indentGuide', {
            style: {
              left: `${i * 32 + 8}px`,
            },
          })}
          data-color-index={colorIndex}
        />
      );
    }
    return guides;
  };

  const lineNumber = showLineNumbers ? <span {...getStyles('lineNumber')} /> : null;

  const rowOf = (event: React.SyntheticEvent) =>
    (event.currentTarget as Element).closest<HTMLElement>('[role="treeitem"]');

  const keyEditor = (editor: {
    value: string;
    label: string;
    placeholder?: string;
    validate: (key: string) => string | null;
    commit: (key: string) => void;
  }) => (
    <Box {...getStyles('keyEditor')}>
      <JsonTreeValueEditor
        value={editor.value}
        type="string"
        editorProps={{
          ...ctx.editorProps,
          'aria-label': ctx.editorProps?.['aria-label'] ?? editor.label,
          placeholder: ctx.editorProps?.placeholder ?? editor.placeholder,
        }}
        validate={(next) => editor.validate(String(next))}
        onCommit={(next) => editor.commit(String(next))}
        onCancel={() => ctx.onCancelStructure?.()}
      />
    </Box>
  );

  // Rows that are not nodes of the data — the "more" row of `maxDisplayLength`
  // and the "new key" row — leave here, before anything asks about a node
  const { more, draft } = jsonNode.nodeData ?? {};
  if (more || draft) {
    return (
      <Group
        gap={4}
        wrap="nowrap"
        {...elementProps}
        onClick={undefined}
        data-json-tree-row
        style={{ position: 'relative' }}
      >
        {lineNumber}
        {renderIndentGuides()}
        {more ? (
          <UnstyledButton
            {...getStyles('moreItems')}
            data-json-tree-action="reveal"
            onClick={(event: React.MouseEvent) => {
              event.stopPropagation();
              ctx.onRevealMore?.(more);
            }}
          >
            … {more.hidden} more {more.unit}
          </UnstyledButton>
        ) : (
          keyEditor({
            value: '',
            label: 'New key',
            placeholder: 'key',
            validate: (next) => ctx.validateNewKey?.(next) ?? null,
            commit: (next) => ctx.onAddKey?.(next),
          })
        )}
      </Group>
    );
  }

  const displayKey = key !== undefined ? formatKey(key, parentType, withKeyQuotes) : undefined;

  // A `[start…end]` group is not a node of the data: nothing to highlight or to type
  const highlight =
    !chunk && highlightNode
      ? (highlightNode({ path, pathSegments, key, type, value }) ?? undefined)
      : undefined;

  const typeBadge =
    showValueTypes && !chunk ? (
      <Text component="span" {...getStyles('typeBadge')} data-type={type}>
        {getTypeLabel(type, value)}
      </Text>
    ) : null;

  const collapseLimit = toLimit(collapseStringsAfterLength);

  const handleCopy = async (e: React.MouseEvent): Promise<boolean> => {
    e.stopPropagation();
    try {
      const copy = stringifyValue(value);
      await navigator.clipboard.writeText(copy);
      onCopy?.(copy, value);
      return true;
    } catch {
      return false;
    }
  };

  const handleClick = () => {
    if (onNodeClick) {
      onNodeClick(path, value);
    }
  };

  const handleToggleExpanded = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (expanded) {
      onCollapse?.(node.value);
    } else {
      onExpand?.(node.value);
    }

    if (onExpandedChange) {
      // In controlled mode, derive next state and let parent update via onExpandedChange.
      // tree.toggleExpanded is not called — the useEffect will sync from the new prop.
      const newState = { ...tree.expandedState, [node.value]: !expanded };
      onExpandedChange(Object.keys(newState).filter((k) => newState[k]));
    } else {
      // In uncontrolled mode, mutate internal tree state directly
      tree.toggleExpanded(node.value);
    }
  };

  const wrapWithTooltip = (content: React.ReactElement) =>
    showPathOnHover ? (
      <Tooltip label={path} position="top-start" withArrow openDelay={300} {...tooltipProps}>
        {content}
      </Tooltip>
    ) : (
      content
    );

  // Segments, not the display path: two different nodes can share a path
  // string, and editing must never be ambiguous about which one it means.
  // Only built while editing is on.
  const editKey = ctx.editing && pathSegments ? JSON.stringify(pathSegments) : null;
  const caps = editKey !== null ? ctx.structureCaps?.(jsonNode) : null;

  const keyCell =
    displayKey === undefined ? null : (
      <>
        {caps?.rename && ctx.renamingKey === editKey ? (
          keyEditor({
            value: key!,
            label: `Rename ${key}`,
            validate: (next) => ctx.validateRename?.(jsonNode, next) ?? null,
            commit: (next) => ctx.onRename?.(jsonNode, next),
          })
        ) : (
          <Text
            component="span"
            {...getStyles('key')}
            data-key={hasChildren ? undefined : key}
            data-json-tree-action={caps?.rename ? 'rename' : undefined}
            onClick={
              caps?.rename
                ? (event: React.MouseEvent<HTMLElement>) => {
                    // the row's own click toggles the node or calls onNodeClick
                    event.stopPropagation();
                    ctx.onStartRename?.(editKey!, rowOf(event));
                  }
                : undefined
            }
          >
            {ctx.searchQuery ? highlightText(displayKey, ctx.searchQuery, getStyles) : displayKey}
          </Text>
        )}
        <Text component="span" {...getStyles('keyValueSeparator')}>
          :
        </Text>
      </>
    );

  // Add, move and remove, for the rows `structuralEdits` allows them on
  const actionButton = (
    action: string,
    label: string,
    icon: React.ReactNode,
    styleName: 'addButton' | 'removeButton' | 'moveButton',
    run: (row: HTMLElement | null) => void,
    disabled = false
  ) => (
    <ActionIcon
      size="xs"
      variant="subtle"
      color="gray"
      aria-label={label}
      data-json-tree-action={action}
      disabled={disabled}
      {...getStyles(styleName)}
      onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        run(rowOf(event));
      }}
    >
      {icon}
    </ActionIcon>
  );
  const index = caps?.reorder ? Number(pathSegments![pathSegments!.length - 1]) : 0;
  const editActions = caps ? (
    <>
      {caps.add &&
        actionButton(
          'add',
          type === 'array' ? 'Add item' : 'Add key',
          ADD_ICON,
          'addButton',
          (row) => ctx.onStartAdd?.(jsonNode, row)
        )}
      {caps.reorder &&
        actionButton(
          'move-up',
          'Move up',
          MOVE_UP_ICON,
          'moveButton',
          () => ctx.onMove?.(jsonNode, -1),
          index <= 0
        )}
      {caps.reorder &&
        actionButton(
          'move-down',
          'Move down',
          MOVE_DOWN_ICON,
          'moveButton',
          () => ctx.onMove?.(jsonNode, 1),
          index >= caps.parentLength - 1
        )}
      {caps.remove &&
        actionButton('remove', 'Remove', REMOVE_ICON, 'removeButton', () =>
          ctx.onRemove?.(jsonNode)
        )}
    </>
  ) : null;

  // Render primitive value
  if (!hasChildren) {
    return wrapWithTooltip(
      <Group
        gap={4}
        wrap="nowrap"
        {...elementProps}
        onClick={handleClick}
        data-json-tree-row
        data-json-tree-address={editKey ?? undefined}
        data-json-tree-highlight={highlight}
        style={{
          cursor: onNodeClick ? 'pointer' : 'default',
          position: 'relative',
          backgroundColor: ctx.directMatches?.has(node.value)
            ? 'rgba(251, 191, 36, 0.15)'
            : undefined,
          borderRadius: ctx.directMatches?.has(node.value) ? '4px' : undefined,
        }}
      >
        {lineNumber}
        {renderIndentGuides()}
        {keyCell}
        {(() => {
          const formattedValue = formatValue(value, type, withQuotes);
          const isEditable = editKey !== null && (ctx.isNodeEditable?.(jsonNode) ?? false);

          if (isEditable && ctx.editingKey === editKey) {
            return (
              <Box {...getStyles('valueEditor')}>
                <JsonTreeValueEditor
                  value={value}
                  type={type}
                  label={key ?? path}
                  editorProps={ctx.editorProps}
                  validate={(next) => ctx.validateNode?.(jsonNode, next) ?? null}
                  onCommit={(next) => ctx.onCommitEdit?.(jsonNode, next)}
                  onCancel={() => ctx.onCancelEdit?.()}
                />
              </Box>
            );
          }

          const renderValue = (display: string) => (
            <Code
              {...getStyles('value')}
              data-type={type}
              data-value={formattedValue}
              data-editable={isEditable || undefined}
              data-edit-key={isEditable ? editKey : undefined}
              onClick={
                isEditable
                  ? (event: React.MouseEvent) => {
                      event.stopPropagation();
                      if (type === 'boolean') {
                        // a boolean has exactly one other state, so there is
                        // nothing to type: toggle it and skip the editor. It is
                        // still a commit, so `validate` gets its say — refusing
                        // the toggle is the feedback, since there is no field to
                        // hang a message on.
                        const next = !value;
                        if ((ctx.validateNode?.(jsonNode, next) ?? null) === null) {
                          ctx.onCommitEdit?.(jsonNode, next);
                        }
                        return;
                      }
                      ctx.onStartEdit?.(editKey!, rowOf(event));
                    }
                  : undefined
              }
            >
              {ctx.searchQuery ? highlightText(display, ctx.searchQuery, getStyles) : display}
            </Code>
          );

          // While searching the whole string shows, so a match past the cut stays visible
          if (
            type === 'string' &&
            collapseLimit &&
            !ctx.searchQuery &&
            (value as string).length > collapseLimit
          ) {
            return (
              <CollapsibleString
                value={value as string}
                limit={collapseLimit}
                withQuotes={withQuotes}
                getStyles={getStyles}
              >
                {renderValue}
              </CollapsibleString>
            );
          }

          return renderValue(formattedValue);
        })()}

        {typeBadge}

        {withCopyToClipboard && (
          <CopyNodeButton icon={copyToClipboardIcon} getStyles={getStyles} onCopy={handleCopy} />
        )}

        {editActions}
      </Group>
    );
  }

  // Render expandable object/array
  const openBracket = type === 'array' ? '[' : '{';
  const closeBracket = type === 'array' ? ']' : '}';

  const expandCollapseIcon = (() => {
    if (!expandControlIcon && !collapseControlIcon) {
      return (
        <IconChevronRight
          size={14}
          style={{
            transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        />
      );
    }

    if (expandControlIcon && !collapseControlIcon) {
      return React.cloneElement(expandControlIcon as React.ReactElement<any>, {
        style: {
          ...(expandControlIcon as React.ReactElement<any>).props?.style,
          transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease',
        },
      });
    }

    if (!expandControlIcon && collapseControlIcon) {
      return expanded ? collapseControlIcon : <IconChevronRight size={14} />;
    }
    return expanded ? collapseControlIcon : expandControlIcon;
  })();

  return wrapWithTooltip(
    <Group
      gap={4}
      wrap="nowrap"
      {...elementProps}
      onClick={handleClick}
      data-json-tree-row
      data-json-tree-address={editKey ?? undefined}
      data-json-tree-highlight={highlight}
      data-expanded={expanded}
      data-has-children={hasChildren}
      data-type={type}
      style={{
        cursor: onNodeClick ? 'pointer' : 'default',
        position: 'relative',
        backgroundColor: ctx.directMatches?.has(node.value)
          ? 'rgba(251, 191, 36, 0.15)'
          : undefined,
        borderRadius: ctx.directMatches?.has(node.value) ? '4px' : undefined,
      }}
    >
      {lineNumber}
      {renderIndentGuides()}
      {ctx.locked ? (
        // A locked node has no toggle, but keeps its room: the keys stay where
        // they are with or without allExpanded
        <ActionIcon
          size="xs"
          variant="subtle"
          disabled
          tabIndex={-1}
          aria-hidden
          data-locked
          {...getStyles('expandCollapse', { style: { visibility: 'hidden' } })}
        />
      ) : (
        <ActionIcon
          size="xs"
          variant="subtle"
          onClick={handleToggleExpanded}
          {...getStyles('expandCollapse')}
        >
          {expandCollapseIcon}
        </ActionIcon>
      )}

      {keyCell}

      <Text component="span" {...getStyles('bracket')}>
        {openBracket}
      </Text>

      {!expanded && (
        <>
          <Text component="span" size="xs" {...getStyles('ellipsis')}>
            ...
          </Text>
          <Text component="span" {...getStyles('bracket')}>
            {closeBracket}
          </Text>
          {itemCount !== undefined && showItemsCount && (
            <Badge size="xs" variant="light" color="gray" {...getStyles('itemsCount')}>
              {itemCount}
            </Badge>
          )}
        </>
      )}

      {typeBadge}

      {withCopyToClipboard && (
        <ActionIcon
          size="xs"
          variant="subtle"
          color="gray"
          onClick={handleCopy}
          {...getStyles('copyButton')}
        >
          {copyToClipboardIcon}
        </ActionIcon>
      )}

      {editActions}
    </Group>
  );
}

const varsResolver = createVarsResolver<JsonTreeFactory>(
  (_, { stickyHeader, stickyHeaderOffset, editable }) => {
    return {
      root: {
        '--json-tree-font-family': 'var(--mantine-font-family-monospace)',
        '--json-tree-font-size': undefined,
        // The defaults depend on the color scheme, so they live in the stylesheet;
        // these only carry an override passed through `vars`.
        '--json-tree-highlight-added-color': undefined,
        '--json-tree-highlight-removed-color': undefined,
        '--json-tree-highlight-changed-color': undefined,
      },
      header: {
        '--json-tree-header-background-color': 'inherit',
        '--json-tree-header-sticky-offset': stickyHeader ? rem(stickyHeaderOffset) : undefined,
      },
      key: {
        '--json-tree-color-key': 'var(--mantine-color-blue-5)',
        // the outline a renamable key shows on hover; only emitted when editing is on
        '--json-tree-color-editable-outline': editable ? 'var(--mantine-color-blue-5)' : undefined,
      },
      value: {
        '--json-tree-color-string': 'var(--mantine-color-green-7)',
        '--json-tree-color-number': 'var(--mantine-color-violet-7)',
        '--json-tree-color-boolean': 'var(--mantine-color-orange-7)',
        '--json-tree-color-null': 'var(--mantine-color-gray-6)',
        '--json-tree-color-function': 'var(--mantine-color-cyan-7)',
        '--json-tree-color-react-element': 'var(--mantine-color-pink-7)',
        '--json-tree-color-date': 'var(--mantine-color-teal-7)',
        '--json-tree-color-nan': 'var(--mantine-color-red-7)',
        '--json-tree-color-infinity': 'var(--mantine-color-red-7)',
        '--json-tree-color-bigint': 'var(--mantine-color-indigo-7)',
        '--json-tree-color-symbol': 'var(--mantine-color-yellow-7)',
        '--json-tree-color-regexp': 'var(--mantine-color-lime-7)',
        '--json-tree-color-map': 'var(--mantine-color-grape-7)',
        '--json-tree-color-set': 'var(--mantine-color-grape-7)',
        '--json-tree-color-circular': 'var(--mantine-color-red-6)',
        // Only emitted when editing is on. Mantine drops `undefined` vars, so a
        // read-only tree renders exactly the markup it did before this prop existed.
        '--json-tree-color-editable-outline': editable ? 'var(--mantine-color-blue-5)' : undefined,
      },
      bracket: { '--json-tree-color-bracket': 'var(--mantine-color-gray-5)' },
      indentGuide: {
        '--json-tree-indent-guide-color-0': 'var(--mantine-color-blue-4)',
        '--json-tree-indent-guide-color-1': 'var(--mantine-color-lime-4)',
        '--json-tree-indent-guide-color-2': 'var(--mantine-color-violet-4)',
        '--json-tree-indent-guide-color-3': 'var(--mantine-color-green-4)',
        '--json-tree-indent-guide-color-4': 'var(--mantine-color-lime-4)',
      },
      expandCollapse: {},
      keyValueSeparator: {},
      ellipsis: { '--json-tree-color-ellipsis': 'var(--mantine-color-dark-3)' },
      lineNumber: { '--json-tree-color-line-number': 'var(--mantine-color-gray-5)' },
      itemsCount: {},
      controls: {},
      copyButton: {},
      paper: {},
      toolbar: {},
      keyCountBadge: {},
      copyAllButton: {},
      searchToggle: {},
      searchBar: {},
      searchInput: {},
      searchHighlight: {
        '--json-tree-search-highlight-color': 'var(--mantine-color-yellow-3)',
      },
      valueEditor: {},
      typeBadge: {},
      showMore: {},
      moreItems: {},
      keyEditor: {},
      addButton: {},
      removeButton: {},
      moveButton: {},
    };
  }
);

export const JsonTree = factory<JsonTreeFactory>((_props) => {
  const props = useProps('JsonTree', defaultProps, _props);

  const {
    data,
    rootName,
    defaultExpanded,
    maxDepth,
    onNodeClick,
    onCopy,
    onExpand,
    onCollapse,
    withExpandAll,
    title,
    showItemsCount,
    withCopyToClipboard,
    showIndentGuides,
    showLineNumbers,
    showPathOnHover,
    tooltipProps,
    maxHeight,
    expanded: controlledExpanded,
    onExpandedChange: _onExpandedChange,
    allExpanded,
    stickyHeaderOffset,
    stickyHeader,
    displayFunctions,
    expandAllControlIcon,
    collapseAllControlIcon,
    copyToClipboardIcon,
    expandControlIcon,
    collapseControlIcon,
    size,
    withBorder,
    borderRadius,
    withKeyCountBadge,
    keyCountBadgeLabel,
    withCopyAll,
    copyAllIcon,
    onCopyAll,
    withSearch,
    searchIcon,
    searchPlaceholder,
    searchQuery: controlledSearchQuery,
    onSearchChange,
    searchDebounce,
    searchInputProps,
    editable,
    onChange,
    editableTypes,
    isEditable,
    validate,
    editorProps,
    structuralEdits,
    getNewValue,
    validateKey,
    sortKeys,
    groupArraysAfterLength,
    collapseStringsAfterLength: _collapseStringsAfterLength,
    maxDisplayLength,
    highlightNode: _highlightNode,
    showValueTypes: _showValueTypes,
    withQuotes,
    withKeyQuotes,

    classNames,
    style,
    styles,
    unstyled,
    vars,
    className,
    ref,

    ...others
  } = props;

  const getStyles = useStyles<JsonTreeFactory>({
    name: 'JsonTree',
    props,
    classes,
    className,
    style,
    classNames,
    styles,
    unstyled,
    vars,
    varsResolver,
  });

  const responsiveClassName = useRandomClassName();
  const rootRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMergedRef(ref, rootRef);

  // A locked tree never reports an expansion change: nothing can change
  const onExpandedChange = allExpanded ? undefined : _onExpandedChange;

  // Convert JSON data to Mantine Tree format
  const treeData = useMemo(
    () => [
      convertToTreeData(data, rootName ?? 'root', rootName ?? 'root', 0, displayFunctions, [], [], {
        sortKeys,
        groupArraysAfterLength,
      }),
    ],
    [data, rootName, displayFunctions, sortKeys, groupArraysAfterLength]
  );

  // Calculate initial expanded state — use controlled prop if provided
  const initialExpandedState = useMemo(() => {
    if (controlledExpanded) {
      const state: Record<string, boolean> = {};
      controlledExpanded.forEach((path) => {
        state[path] = true;
      });
      return state;
    }

    if (defaultExpanded) {
      if (maxDepth === -1) {
        return getTreeExpandedState(treeData, '*');
      }

      const expandedNodes: string[] = [];
      const traverse = (nodes: JSONTreeNodeData[], depth: number) => {
        nodes.forEach((node) => {
          if (depth < (maxDepth ?? Infinity) && node.children) {
            expandedNodes.push(node.value);
            traverse(node.children as JSONTreeNodeData[], depth + 1);
          }
        });
      };
      traverse(treeData, 0);
      return getTreeExpandedState(treeData, expandedNodes);
    }
    return {};
  }, [treeData, defaultExpanded, maxDepth, controlledExpanded]);

  const tree = useTree({
    initialExpandedState,
  });

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' && allExpanded && controlledExpanded) {
      // eslint-disable-next-line no-console
      console.warn(
        'JsonTree: `expanded` is ignored while `allExpanded` is set — every node is expanded and locked open.'
      );
    }
  }, [allExpanded, controlledExpanded]);

  // Sync controlled expanded state
  useEffect(() => {
    if (controlledExpanded) {
      const state: Record<string, boolean> = {};
      controlledExpanded.forEach((path) => {
        state[path] = true;
      });
      tree.setExpandedState(state);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- tree.setExpandedState changes on every render; using tree would cause infinite loop
  }, [controlledExpanded]);

  // How many entries `maxDisplayLength` shows of each container a reader asked to see more of
  const [revealed, setRevealed] = useState<Record<string, number>>({});
  const displayLimit = toLimit(maxDisplayLength);

  /**
   * The rendered row of a target. Tree values can collide (`{ 'a.b' }` and
   * `{ a: { b } }`), so when the target knows its address and editing has put
   * addresses on the rows, the address decides.
   */
  const findRow = useCallback((target: FocusTarget) => {
    const rows = Array.from(
      rootRef.current?.querySelectorAll<HTMLElement>('li[role="treeitem"]') ?? []
    ).filter((li) => li.getAttribute('data-value') === target.value);
    const address = target.segments && JSON.stringify(target.segments);
    return (
      rows.find(
        (li) =>
          address !== undefined &&
          li
            .querySelector(':scope > [data-json-tree-row]')
            ?.getAttribute('data-json-tree-address') === address
      ) ?? rows[0]
    );
  }, []);

  const focusElement = (row: HTMLElement) => {
    row.setAttribute('data-focus-ring', 'true');
    row.focus();
  };

  /** Focus the first of these rows that is rendered */
  const focusRow = useCallback(
    (targets: FocusTarget[]) => {
      for (const target of targets) {
        const row = findRow(target);
        if (row) {
          focusElement(row);
          return;
        }
      }
    },
    [findRow]
  );

  // Rows to focus once the tree has re-rendered: the first entry a "more" row
  // revealed, the row that took the place of a removed one, a moved item…
  // Without it focus falls to the body when the row it was on goes away.
  const [pendingFocus, setPendingFocus] = useState<FocusTarget[] | null>(null);

  // The one inline editor open, if any: a value, a key being renamed (both by
  // serialized segments), or a new key being added to an object (by tree value).
  // Only the address lives here — the draft stays inside the editor, so typing
  // never re-renders the tree.
  const [editor, setEditor] = useState<
    | { kind: 'value' | 'rename'; key: string }
    | { kind: 'add'; container: string; segments: JsonTreePathSegments }
    | null
  >(null);
  const editingKey = editor?.kind === 'value' ? editor.key : null;
  const renamingKey = editor?.kind === 'rename' ? editor.key : null;
  const addingTo = editor?.kind === 'add' ? editor : null;
  // The row that owns the open editor, or the tree value of a row that does not
  // exist yet (a key just added). When the editor unmounts its input goes with
  // it and focus falls to the body, which drops a keyboard user out of the tree
  // entirely — arrow navigation stops working until they tab back in.
  const editingRowRef = useRef<HTMLElement | FocusTarget | null>(null);

  const handleStartEdit = useCallback((key: string, row: HTMLElement | null) => {
    editingRowRef.current = row;
    setEditor({ kind: 'value', key });
  }, []);

  const closeEditor = useCallback(() => setEditor(null), []);

  const editorOpen = editor !== null;
  useEffect(() => {
    if (editorOpen) {
      return;
    }
    const row = editingRowRef.current;
    editingRowRef.current = null;
    if (row instanceof HTMLElement) {
      if (row.isConnected) {
        row.focus();
      }
    } else if (row) {
      focusRow([row]);
    }
  }, [editorOpen, focusRow]);

  /** Set the expanded nodes: through `onExpandedChange` when controlled, else on the tree */
  const writeExpanded = (next: Record<string, boolean>) => {
    if (onExpandedChange) {
      onExpandedChange(Object.keys(next).filter((key) => next[key]));
    } else {
      tree.setExpandedState(next);
    }
  };

  const nodePayload = useCallback((node: JSONTreeNodeData): JsonTreeNodePayload | null => {
    const nd = node.nodeData;
    if (!nd?.pathSegments) {
      return null;
    }
    return {
      path: nd.path,
      pathSegments: nd.pathSegments,
      key: nd.key,
      type: nd.type,
      value: nd.value,
    };
  }, []);

  /** The value-editing rule, for a node on screen or one just added */
  const isPayloadEditable = useCallback(
    (payload: JsonTreeNodePayload) =>
      Boolean(editable) &&
      (editableTypes ?? []).includes(payload.type as JsonTreeEditableType) &&
      (isEditable?.(payload) ?? true),
    [editable, editableTypes, isEditable]
  );

  const isNodeEditable = useCallback(
    (node: JSONTreeNodeData) => {
      // Map and Set entries, and function properties expanded as an object,
      // have no address that could be written back
      const payload = nodePayload(node);
      return payload ? isPayloadEditable(payload) : false;
    },
    [isPayloadEditable, nodePayload]
  );

  const validateNode = useCallback(
    (node: JSONTreeNodeData, nextValue: unknown) => {
      if (!validate) {
        return null;
      }
      const payload = nodePayload(node);
      return payload ? validate({ ...payload, value: nextValue }) : null;
    },
    [validate, nodePayload]
  );

  const handleCommitEdit = useCallback(
    (node: JSONTreeNodeData, nextValue: unknown) => {
      setEditor(null);

      const payload = nodePayload(node);
      if (!payload || Object.is(payload.value, nextValue)) {
        return;
      }

      const nextData = setValueAtPath(data, payload.pathSegments, nextValue);
      onChange?.(nextData, {
        ...payload,
        action: 'edit',
        value: nextValue,
        previousValue: payload.value,
      });
    },
    [data, onChange, nodePayload]
  );

  // ---- Structural edits: rename, add, remove, reorder ----------------------

  const allowedStructuralEdits = useMemo(
    () =>
      new Set<JsonTreeStructuralEdit>(
        editable && structuralEdits
          ? structuralEdits === true
            ? ALL_STRUCTURAL_EDITS
            : structuralEdits
          : []
      ),
    [editable, structuralEdits]
  );

  const getParentLength = (node: JSONTreeNodeData) => {
    const segments = node.nodeData?.pathSegments;
    const parent = segments ? getValueAtPath(data, segments.slice(0, -1)) : undefined;
    return Array.isArray(parent) ? parent.length : 0;
  };

  /** Every structural edit a row offers, worked out once per row */
  const structureCaps = (node: JSONTreeNodeData): StructureCaps | null => {
    const payload = nodePayload(node);
    if (!payload || payload.type === 'circular') {
      // groups, Map and Set entries and a reference cycle have no address a
      // structural edit could be written to
      return null;
    }
    const segments = payload.pathSegments;
    const last = segments[segments.length - 1];
    const allows = (action: JsonTreeStructuralEdit) => allowedStructuralEdits.has(action);
    const caps: StructureCaps = {
      add: allows('add') && isWritableContainer(payload.value),
      rename: allows('rename') && typeof last === 'string',
      remove: allows('remove') && segments.length > 0,
      reorder: allows('reorder') && typeof last === 'number',
      parentLength: 0,
    };
    if (!(caps.add || caps.rename || caps.remove || caps.reorder)) {
      return null;
    }
    if (!(isEditable?.(payload) ?? true)) {
      return null;
    }
    if (caps.reorder) {
      caps.parentLength = getParentLength(node);
    }
    return caps;
  };

  /** The tree value of the container holding `node` */
  const parentTreeValue = (node: JSONTreeNodeData) => {
    const key = node.nodeData?.key ?? '';
    return node.value.slice(0, node.value.length - key.length - 1);
  };

  /**
   * The tree value of the `[start…end]` group holding `index` once the array
   * holds `length` items, or null when it is not grouped at that length
   */
  const groupValue = (container: string, index: number, length: number) => {
    const size = getArrayGroupSize(length, groupArraysAfterLength);
    return size ? childTreeValue(container, getArrayGroupLabel(index, size, length)) : null;
  };
  /**
   * Where the groups of a grouped array go once its length changes: the last
   * group's label moves with the length, and groups appear or vanish when the
   * array crosses `groupArraysAfterLength`.
   */
  const remapGroups = (container: JSONTreeNodeData, nextLength: number, remap: TreeRemap) => {
    for (const child of (container.children ?? []) as JSONTreeNodeData[]) {
      const chunk = child.nodeData?.chunk;
      if (chunk) {
        const next =
          chunk.start < nextLength ? groupValue(container.value, chunk.start, nextLength) : null;
        if (next !== child.value) {
          remap.moves.set(child.value, next);
        }
      }
    }
  };

  /**
   * Report a structural change, and carry the tree's own state across it:
   * expanded nodes and revealed pages are keyed by tree value, and a rename or
   * a shifted index changes the values of everything below it.
   */
  const commitStructuralChange = (
    nextData: unknown,
    change: JsonTreeChange,
    {
      remap,
      expand = [],
      reveal,
      focus,
    }: {
      remap?: TreeRemap;
      expand?: (string | null)[];
      reveal?: { container: string; count: number };
      focus?: FocusTarget[];
    }
  ) => {
    const toExpand = expand.filter((value): value is string => value !== null);
    if (!allExpanded && (remap?.moves.size || toExpand.length)) {
      const next = remap ? applyRemap(tree.expandedState, remap) : { ...tree.expandedState };
      toExpand.forEach((value) => {
        next[value] = true;
      });
      writeExpanded(next);
    }
    if (remap?.moves.size || reveal) {
      setRevealed((current) => {
        const next = remap ? applyRemap(current, remap) : { ...current };
        if (reveal && displayLimit && reveal.count > (next[reveal.container] ?? displayLimit)) {
          next[reveal.container] = reveal.count;
        }
        return next;
      });
    }
    onChange?.(nextData, change);
    if (focus) {
      setPendingFocus(focus);
    }
  };

  /** A node's address once it sits under `key` of the same container */
  const relocatedTo = (payload: JsonTreeNodePayload, key: string | number) => [
    ...payload.pathSegments.slice(0, -1),
    key,
  ];

  /** A node's payload once it sits under `key` of the same container */
  const relocated = (
    payload: JsonTreeNodePayload,
    parent: string,
    key: string | number,
    action: 'rename' | 'reorder'
  ): JsonTreeChange => ({
    ...payload,
    action,
    path: childTreeValue(parent, key),
    pathSegments: relocatedTo(payload, key),
    key: String(key),
    previousValue: payload.value,
    previousPath: payload.path,
    previousPathSegments: payload.pathSegments,
    previousKey: payload.key,
  });

  /** The payload of a value added under `key` of `container` */
  const childPayload = (
    container: JsonTreeNodePayload,
    key: string | number,
    value: unknown
  ): JsonTreeNodePayload => ({
    path: childTreeValue(container.path, key),
    pathSegments: [...container.pathSegments, key],
    key: String(key),
    type: getValueType(value),
    value,
  });

  /** Open the value editor on a node that was just added, or focus it */
  const editOrFocusNew = (treeValue: string, payload: JsonTreeNodePayload) => {
    const target = { value: treeValue, segments: payload.pathSegments };
    // a boolean toggles on click and an object has no value to type: focus them
    if ((payload.type === 'string' || payload.type === 'number') && isPayloadEditable(payload)) {
      editingRowRef.current = target;
      setEditor({ kind: 'value', key: JSON.stringify(payload.pathSegments) });
    } else {
      setPendingFocus([target]);
    }
  };

  /**
   * The container at an address, read from `data`. By address, never by tree
   * value: `{ 'a.b': … }` and `{ a: { b: … } }` share one.
   */
  const payloadAt = (path: string, pathSegments: JsonTreePathSegments): JsonTreeNodePayload => {
    const value = getValueAtPath(data, pathSegments);
    const last = pathSegments[pathSegments.length - 1];
    return {
      path,
      pathSegments,
      key: last === undefined ? undefined : String(last),
      type: getValueType(value),
      value,
    };
  };

  /** The tree node at an address, in the full tree */
  const nodeAt = (pathSegments: JsonTreePathSegments) => findNodeBySegments(treeData, pathSegments);

  /** Vet a key typed for a container; a rename may keep its own `currentKey` */
  const vetKey = (container: JsonTreeNodePayload, key: string, currentKey?: string) => {
    if (key !== currentKey && Object.hasOwn(container.value as object, key)) {
      return 'Key already exists';
    }
    return validateKey?.(key, container) ?? null;
  };

  const validateNewKey = (key: string) =>
    addingTo ? vetKey(payloadAt(addingTo.container, addingTo.segments), key) : null;

  const handleStartRename = (key: string, row: HTMLElement | null) => {
    editingRowRef.current = row;
    setEditor({ kind: 'rename', key });
  };

  const validateRename = (node: JSONTreeNodeData, nextKey: string) => {
    const segments = node.nodeData?.pathSegments;
    return segments
      ? vetKey(payloadAt(parentTreeValue(node), segments.slice(0, -1)), nextKey, node.nodeData?.key)
      : null;
  };

  const handleRename = (node: JSONTreeNodeData, nextKey: string) => {
    setEditor(null);
    const payload = nodePayload(node);
    const key = node.nodeData?.key;
    if (!payload || key === undefined || nextKey === key) {
      return;
    }
    const parent = parentTreeValue(node);
    const parentNode = nodeAt(payload.pathSegments.slice(0, -1));
    commitStructuralChange(
      renameKeyAtPath(data, payload.pathSegments, nextKey),
      relocated(payload, parent, nextKey, 'rename'),
      {
        remap: parentNode
          ? remapContainerEntries(treeData, parentNode, (k) => (k === key ? nextKey : k))
          : undefined,
        focus: [
          { value: childTreeValue(parent, nextKey), segments: relocatedTo(payload, nextKey) },
        ],
      }
    );
  };

  const newValueFor = (container: JsonTreeNodePayload) =>
    getNewValue ? getNewValue(container) : getDefaultNewValue(container.value);

  const handleStartAdd = (node: JSONTreeNodeData, row: HTMLElement | null) => {
    const payload = nodePayload(node);
    if (!payload || !isWritableContainer(payload.value)) {
      return;
    }

    if (!Array.isArray(payload.value)) {
      // An object needs a key first: a "new key" row opens inside it
      editingRowRef.current = row;
      setEditor({ kind: 'add', container: node.value, segments: payload.pathSegments });
      if (!allExpanded && !tree.expandedState[node.value]) {
        writeExpanded({ ...tree.expandedState, [node.value]: true });
      }
      return;
    }

    // An array grows by one item at its end
    setEditor(null);
    const value = newValueFor(payload);
    const index = payload.value.length;
    const added = childPayload(payload, index, value);
    const remap: TreeRemap = { moves: new Map(), keep: new Set() };
    // the full node, not the row on screen, which a search or a limit may have cut
    const full = nodeAt(payload.pathSegments);
    if (full) {
      remapGroups(full, index + 1, remap);
    }
    commitStructuralChange(
      insertAtPath(data, payload.pathSegments, undefined, value),
      { ...added, action: 'add', previousValue: undefined },
      {
        remap,
        expand: [node.value, groupValue(node.value, index, index + 1)],
        reveal: { container: node.value, count: index + 1 },
      }
    );
    editOrFocusNew(childTreeValue(node.value, index), added);
  };

  const handleAddKey = (key: string) => {
    setEditor(null);
    if (!addingTo) {
      return;
    }
    const { container } = addingTo;
    const payload = payloadAt(container, addingTo.segments);
    if (Array.isArray(payload.value) || !isWritableContainer(payload.value)) {
      return;
    }
    const value = newValueFor(payload);
    const added = childPayload(payload, key, value);
    commitStructuralChange(
      insertAtPath(data, payload.pathSegments, key, value),
      { ...added, action: 'add', previousValue: undefined },
      { expand: [container], reveal: { container, count: Object.keys(payload.value).length + 1 } }
    );
    editOrFocusNew(childTreeValue(container, key), added);
  };

  const handleRemove = (node: JSONTreeNodeData) => {
    const payload = nodePayload(node);
    const key = node.nodeData?.key;
    if (!payload || key === undefined || payload.pathSegments.length === 0) {
      return;
    }
    setEditor(null);

    const parent = parentTreeValue(node);
    const parentNode = nodeAt(payload.pathSegments.slice(0, -1));
    const last = payload.pathSegments[payload.pathSegments.length - 1];
    const remap: TreeRemap = parentNode
      ? remapContainerEntries(
          treeData,
          parentNode,
          typeof last === 'number'
            ? (k) => {
                const index = Number(k);
                return index === last ? null : index > last ? String(index - 1) : k;
              }
            : (k) => (k === key ? null : k)
        )
      : { moves: new Map(), keep: new Set() };
    if (typeof last === 'number' && parentNode) {
      remapGroups(parentNode, getParentLength(node) - 1, remap);
    }

    // Focus moves to the entry that takes the removed one's place, else the
    // one before it, else the container
    const entries = parentNode ? getContainerEntries(parentNode) : [];
    const at = entries.findIndex((entry) => entry.value === node.value);
    const parentSegments = payload.pathSegments.slice(0, -1);
    const after = (entry: JSONTreeNodeData | undefined): FocusTarget | null => {
      const value =
        entry && (remap.moves.has(entry.value) ? remap.moves.get(entry.value) : entry.value);
      const step = entry?.nodeData?.pathSegments?.at(-1);
      if (!value || step === undefined) {
        return null;
      }
      // an array item after the removed one moved up one index
      const shifted = typeof step === 'number' && typeof last === 'number' && step > last;
      return { value, segments: [...parentSegments, shifted ? step - 1 : step] };
    };
    const focus = [
      after(entries[at + 1]),
      after(entries[at - 1]),
      { value: parent, segments: parentSegments },
    ].filter((target): target is FocusTarget => target !== null);

    commitStructuralChange(
      removeAtPath(data, payload.pathSegments),
      { ...payload, action: 'remove', value: undefined, previousValue: payload.value },
      { remap, focus }
    );
  };

  const handleMove = (node: JSONTreeNodeData, direction: -1 | 1) => {
    const payload = nodePayload(node);
    const last = payload?.pathSegments[payload.pathSegments.length - 1];
    if (!payload || typeof last !== 'number') {
      return;
    }
    const to = last + direction;
    const length = getParentLength(node);
    if (to < 0 || to >= length) {
      return;
    }
    const parent = parentTreeValue(node);
    const parentNode = nodeAt(payload.pathSegments.slice(0, -1));
    commitStructuralChange(
      moveAtPath(data, payload.pathSegments, to),
      relocated(payload, parent, to, 'reorder'),
      {
        remap: parentNode
          ? remapContainerEntries(treeData, parentNode, (k) =>
              Number(k) === last ? String(to) : Number(k) === to ? String(last) : k
            )
          : undefined,
        expand: [groupValue(parent, to, length)],
        focus: [{ value: childTreeValue(parent, to), segments: relocatedTo(payload, to) }],
      }
    );
  };

  useEffect(() => {
    // The most likely way to get this wrong is to switch `editable` on and see
    // edits silently revert: JsonTree is controlled and holds no copy of the data.
    if (process.env.NODE_ENV !== 'production' && editable && !onChange) {
      // eslint-disable-next-line no-console
      console.warn(
        'JsonTree: `editable` is set but `onChange` is missing, so edits cannot be kept. ' +
          'JsonTree does not hold its own copy of the data — feed the value from `onChange` back through `data`.'
      );
    }
  }, [editable, onChange]);

  // Keyboard handler for Ctrl+C copy on focused node
  const handleKeyDown = useCallback(
    async (e: React.KeyboardEvent) => {
      const target = e.target as HTMLElement | null;

      // Every row shortcut clicks the row's own control, so mouse and keyboard
      // share one code path — and no value needs a tab stop of its own.
      // Enter: reveal a "more" row's entries, or edit the focused value. A row
      // can hold its own controls (the copy button, a link in a custom title);
      // Enter belongs to whichever one has focus, or it would be unreachable.
      if (
        e.key === 'Enter' &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !target?.closest?.(KEYBOARD_ACTIVATED_SELECTOR)
      ) {
        const row = (document.activeElement as HTMLElement | null)?.closest?.('[role="treeitem"]');
        const control =
          row && (e.currentTarget as HTMLElement).contains(row)
            ? (rowControl(row, '[data-json-tree-action="reveal"]') ??
              (editable ? rowControl(row, '[data-edit-key]') : null))
            : null;
        if (control) {
          e.preventDefault();
          control.click();
          return;
        }
      }

      // Structural shortcuts act on the focused row itself, never from inside one of its controls
      const action = ROW_SHORTCUTS[e.key];
      if (
        action &&
        allowedStructuralEdits.size > 0 &&
        target?.getAttribute?.('role') === 'treeitem'
      ) {
        const control = rowControl(target, `[data-json-tree-action="${action}"]`);
        if (control) {
          e.preventDefault();
          control.click();
          return;
        }
      }

      if (!withCopyToClipboard || !(e.metaKey || e.ctrlKey) || e.key !== 'c') {
        return;
      }

      // Never hijack the native copy of a selection made inside a form control
      // rendered within the tree (the search input, a custom `title`, …).
      if (target?.closest?.(FORM_CONTROL_SELECTOR)) {
        return;
      }

      // Resolve the row that actually holds focus. Matching `[tabindex="0"]`
      // could only ever find the root: Mantine's Tree gives the root node
      // tabindex 0 and every other node -1, and `querySelector` resolves in
      // document order — so the root won over the focused node every time.
      // Scoping to `[role="treeitem"]` also keeps the value cells out of the
      // match, since those carry a `data-value` holding the formatted value
      // rather than a node path.
      const root = e.currentTarget as HTMLElement;
      const active = document.activeElement as HTMLElement | null;
      const focused =
        (active && root.contains(active)
          ? active.closest('[role="treeitem"][data-value]')
          : null) ?? root.querySelector('[role="treeitem"][data-value]');

      const nodePath = focused?.getAttribute('data-value');
      if (!nodePath) {
        return;
      }

      const nodeData = findNodeByPath(treeData, nodePath);
      if (!nodeData?.nodeData) {
        return;
      }

      e.preventDefault();
      const copy = stringifyValue(nodeData.nodeData.value);
      try {
        await navigator.clipboard.writeText(copy);
        onCopy?.(copy, nodeData.nodeData.value);
      } catch {
        // Clipboard write may fail silently in unsupported contexts
      }
    },
    [withCopyToClipboard, treeData, onCopy, editable, allowedStructuralEdits]
  );

  // Key count for badge
  const totalKeyCount = useMemo(() => getItemCount(data), [data]);

  // Search state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQueryInternal, setSearchQueryInternal] = useState('');
  const activeSearchQuery = controlledSearchQuery ?? searchQueryInternal ?? '';
  const [debouncedQuery] = useDebouncedValue(activeSearchQuery, searchDebounce ?? 300);

  // Save pre-search expanded state for restore
  const preSearchExpandedRef = useRef<Record<string, boolean> | null>(null);

  // Search results
  const searchResults = useMemo(
    () => searchTree(treeData, debouncedQuery, { withQuotes, withKeyQuotes }),
    [treeData, debouncedQuery, withQuotes, withKeyQuotes]
  );

  // Filtered tree data for search (hide non-matching nodes). While searching the
  // entry limit is off, so a match past the cut is never hidden behind a "more" row.
  const filteredTreeData = useMemo(() => {
    if (!debouncedQuery || searchResults.matchedPaths.size === 0) {
      return displayLimit ? limitTreeEntries(treeData, displayLimit, revealed) : treeData;
    }
    return filterTreeBySearch(treeData, searchResults.matchedPaths);
  }, [treeData, debouncedQuery, searchResults, displayLimit, revealed]);

  // The rows on screen: the "new key" row joins the object a key is being added to
  const displayedTreeData = useMemo(
    () =>
      addingTo
        ? appendDraftRow(filteredTreeData, addingTo.container, addingTo.segments)
        : filteredTreeData,
    [filteredTreeData, addingTo]
  );

  useEffect(() => {
    if (!pendingFocus) {
      return;
    }
    setPendingFocus(null);
    focusRow(pendingFocus);
  }, [pendingFocus, displayedTreeData, focusRow]);

  const handleRevealMore = useCallback(
    (more: JsonTreeMoreRow) => {
      setRevealed((current) => ({
        ...current,
        [more.container]: (current[more.container] ?? displayLimit) + displayLimit,
      }));
      setPendingFocus([{ value: more.next }]);
    },
    [displayLimit]
  );

  // Auto-expand to show search results
  useEffect(() => {
    if (allExpanded) {
      return;
    }
    if (debouncedQuery && searchResults.expandedPaths.length > 0) {
      if (!preSearchExpandedRef.current) {
        preSearchExpandedRef.current = { ...tree.expandedState };
      }
      const newState: Record<string, boolean> = {};
      searchResults.expandedPaths.forEach((p: string) => {
        newState[p] = true;
      });
      writeExpanded(newState);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, searchResults]);

  const handleClearSearch = useCallback(() => {
    setSearchQueryInternal('');
    onSearchChange?.('');
    if (preSearchExpandedRef.current) {
      if (onExpandedChange) {
        onExpandedChange(
          Object.keys(preSearchExpandedRef.current).filter((k) => preSearchExpandedRef.current![k])
        );
      } else {
        tree.setExpandedState(preSearchExpandedRef.current);
      }
      preSearchExpandedRef.current = null;
    }
  }, [onExpandedChange, onSearchChange, tree]);

  const handleCloseSearch = useCallback(() => {
    setSearchOpen(false);
    handleClearSearch();
  }, [handleClearSearch]);

  // Named handlers for expand/collapse all
  const handleExpandAll = useCallback(() => {
    const allState = getTreeExpandedState(treeData, '*');
    if (onExpandedChange) {
      onExpandedChange(Object.keys(allState).filter((k: string) => allState[k]));
    } else {
      tree.expandAllNodes();
    }
  }, [treeData, onExpandedChange, tree]);

  const handleCollapseAll = useCallback(() => {
    if (onExpandedChange) {
      onExpandedChange([]);
    } else {
      tree.collapseAllNodes();
    }
  }, [onExpandedChange, tree]);

  // Global copy handler with visual feedback
  const [copiedAll, setCopiedAll] = useState(false);
  const handleCopyAll = useCallback(async () => {
    const json = stringifyValue(data);
    try {
      await navigator.clipboard.writeText(json);
      onCopyAll?.(json);
      onCopy?.(json, data);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 1500);
    } catch {
      // Clipboard write may fail silently
    }
  }, [data, onCopyAll, onCopy]);

  const renderCtx: RenderNodeContext = {
    getStyles,
    copyToClipboardIcon,
    expandControlIcon,
    collapseControlIcon,
    onExpand,
    onCollapse,
    onExpandedChange,
    locked: allExpanded,
    onRevealMore: handleRevealMore,
    searchQuery: debouncedQuery || undefined,
    matchedPaths: debouncedQuery ? searchResults.matchedPaths : undefined,
    directMatches: debouncedQuery ? searchResults.directMatches : undefined,
    editingKey,
    onStartEdit: handleStartEdit,
    onCommitEdit: handleCommitEdit,
    onCancelEdit: closeEditor,
    isNodeEditable,
    validateNode,
    editorProps,
    editing: editable,
    renamingKey,
    structureCaps: allowedStructuralEdits.size > 0 ? structureCaps : undefined,
    onStartRename: handleStartRename,
    validateRename,
    onRename: handleRename,
    onCancelStructure: closeEditor,
    onStartAdd: handleStartAdd,
    validateNewKey,
    onAddKey: handleAddKey,
    onRemove: handleRemove,
    onMove: handleMove,
  };

  // Every node open, array groups included. The controller handed to the Tree
  // ignores expand and toggle, which is what keeps the keyboard (Space) from
  // closing anything. Mantine's Tree asks to collapse an open node on
  // ArrowLeft; a locked one moves to its parent instead, as a leaf does.
  const lockedExpandedState = useMemo(
    () => (allExpanded ? getTreeExpandedState(displayedTreeData, '*') : null),
    [allExpanded, displayedTreeData]
  );
  const focusParentRow = (value: string) => {
    // Mantine asks from the focused row's own key handler: start from that row,
    // which a lookup by tree value could confuse with another sharing it
    const focused = (document.activeElement as HTMLElement | null)?.closest<HTMLElement>(
      'li[role="treeitem"]'
    );
    const row = focused?.getAttribute('data-value') === value ? focused : findRow({ value });
    const parent = row?.parentElement?.closest<HTMLElement>('[role="treeitem"]');
    if (parent) {
      focusElement(parent);
    }
  };
  const treeController = lockedExpandedState
    ? {
        ...tree,
        expandedState: lockedExpandedState,
        expand: noop,
        collapse: focusParentRow,
        toggleExpanded: noop,
        expandAllNodes: noop,
        collapseAllNodes: noop,
        setExpandedState: noop,
      }
    : tree;

  const treeComponent = (
    <Tree
      data={displayedTreeData}
      tree={treeController}
      levelOffset={32}
      renderNode={(payload) => renderJSONNode(payload, props, renderCtx, onNodeClick)}
    />
  );

  const showHeader =
    title || (withExpandAll && !allExpanded) || withKeyCountBadge || withCopyAll || withSearch;

  // Alt + ↑ / ↓ moves an array item through its own buttons. Mantine's Tree
  // stops the arrow keys on the row, so they are caught on the way down.
  const handleKeyDownCapture = (event: React.KeyboardEvent) => {
    const action = event.altKey ? MOVE_SHORTCUTS[event.key] : undefined;
    const row = event.target as HTMLElement;
    if (!action || row.getAttribute?.('role') !== 'treeitem') {
      return;
    }
    const button = rowControl(row, `[data-json-tree-action="${action}"]`);
    if (button) {
      event.preventDefault();
      event.stopPropagation();
      button.click();
    }
  };

  const content = (
    <>
      <JsonTreeMediaVariables size={size} selector={`.${responsiveClassName}`} />
      <Box
        {...getStyles('root', { className: responsiveClassName })}
        {...others}
        data-line-numbers={showLineNumbers || undefined}
        data-searching={debouncedQuery ? true : undefined}
        data-all-expanded={allExpanded || undefined}
        ref={mergedRef}
        onKeyDown={handleKeyDown}
        onKeyDownCapture={handleKeyDownCapture}
      >
        {showHeader && (
          <Group {...getStyles('header')} justify="space-between" mod={{ sticky: stickyHeader }}>
            <Group gap="xs">
              {title || <div />}
              {withKeyCountBadge && isExpandable(data) && (
                <Badge size="sm" variant="light" color="gray" {...getStyles('keyCountBadge')}>
                  {keyCountBadgeLabel
                    ? keyCountBadgeLabel(totalKeyCount)
                    : `${totalKeyCount} ${Array.isArray(data) ? 'items' : 'keys'}`}
                </Badge>
              )}
            </Group>

            <Group gap={4} {...getStyles('toolbar')}>
              {withSearch && (
                <ActionIcon
                  size="sm"
                  variant={searchOpen ? 'light' : 'subtle'}
                  color="gray"
                  onClick={() => {
                    if (searchOpen) {
                      handleCloseSearch();
                    } else {
                      setSearchOpen(true);
                    }
                  }}
                  {...getStyles('searchToggle')}
                >
                  {searchIcon}
                </ActionIcon>
              )}

              {withExpandAll && !allExpanded && isExpandable(data) && (
                <>
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    color="gray"
                    onClick={handleExpandAll}
                    {...getStyles('controls')}
                  >
                    {expandAllControlIcon}
                  </ActionIcon>
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    color="gray"
                    onClick={handleCollapseAll}
                    {...getStyles('controls')}
                  >
                    {collapseAllControlIcon}
                  </ActionIcon>
                </>
              )}

              {withCopyAll && (
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color={copiedAll ? 'green' : 'gray'}
                  onClick={handleCopyAll}
                  {...getStyles('copyAllButton')}
                >
                  {copiedAll ? <IconCheck size={16} /> : copyAllIcon}
                </ActionIcon>
              )}
            </Group>
          </Group>
        )}

        {searchOpen && withSearch && (
          <>
            <Divider />
            <Box {...getStyles('searchBar')} p="xs">
              <TextInput
                placeholder={searchPlaceholder}
                size="sm"
                leftSection={<IconSearch size={14} />}
                rightSection={
                  activeSearchQuery ? <CloseButton size="sm" onClick={handleClearSearch} /> : null
                }
                {...searchInputProps}
                {...getStyles('searchInput', {
                  className: searchInputProps?.className,
                  style: searchInputProps?.style,
                })}
                value={activeSearchQuery}
                onChange={(e) => {
                  const val = e.currentTarget.value;
                  setSearchQueryInternal(val);
                  onSearchChange?.(val);
                }}
              />
            </Box>
          </>
        )}

        {maxHeight ? (
          <ScrollArea.Autosize mah={maxHeight}>{treeComponent}</ScrollArea.Autosize>
        ) : (
          treeComponent
        )}
      </Box>
    </>
  );

  if (withBorder) {
    return (
      <Paper withBorder radius={borderRadius} {...getStyles('paper')}>
        {content}
      </Paper>
    );
  }

  return content;
});

JsonTree.classes = classes;
JsonTree.displayName = 'JsonTree';
