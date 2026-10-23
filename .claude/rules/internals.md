---
paths:
  - "package/src/**"
---

# JsonTree internals

## Tree data and rendering

- `convertToTreeData()` (`lib/utils.tsx`) converts arbitrary data to Mantine `TreeNodeData`: `getValueType()` detects 16 types (incl. `react-element`, `date`, `nan`, `infinity`, `bigint`, `symbol`, `regexp`, `map`, `set`); each node carries `nodeData` (type, value, key, path, itemCount, depth). `displayFunctions`: `'as-string'` (default), `'hide'` (filtered out), `'as-object'` (introspect). Map/Set entries become indexed children.
- Mantine `<Tree>` renders through `renderJSONNode`, kept outside the factory so it is not recreated every render; two layouts: primitive key-value rows and expandable nodes with brackets and controls. `lib/path.ts` writes by `pathSegments` (set, rename, insert, remove, move; spine-only copies).
- **Search** (`withSearch`): `searchTree()` matches keys and values case-insensitively and returns `matchedPaths`, `directMatches`, `expandedPaths`; `filterTreeBySearch()` prunes to matched branches. Direct matches get an amber row; hits are wrapped in the `searchHighlight` span. The pre-search expand state is restored on clear.
- **Expansion**: `defaultExpanded` + `maxDepth` (`-1` = all, through `getTreeExpandedState(treeData, '*')`; otherwise a depth-limited traversal); `useTree` holds the state.

## Display options (inspired by Mantine 9.7's `JsonViewer`)

- `sortKeys` and `groupArraysAfterLength` change the tree's **shape**, so they go through `convertToTreeData()`'s last argument (`ConvertToTreeDataOptions`) and `treeData` is memoized on them. Sorting is display-only: every entry keeps its own key, path and `pathSegments`.
- A group is a synthetic `[start…end]` node with `nodeData.chunk`, `pathSegments: undefined` (never editable or written to) and the slice as its value; its items keep their real `path` / `pathSegments`, at `depth + 2`. `searchTree()` skips a chunk's key (else searching "1" matches every group label). Hidden functions are filtered **after** grouping, so a group always covers the indices its label shows.
- `collapseStringsAfterLength` renders through the `CollapsibleString` component (the open state must live with the row); it never cuts while a search is active and never splits a surrogate pair.
- `highlightNode(payload)` sets `data-json-tree-highlight` on the row; the tints are scheme-dependent CSS defaults (`var(--json-tree-highlight-*-color, …)` with `where-dark`), because a `varsResolver` value is an inline style one colour scheme cannot override. The vars stay in the resolver as `undefined` so `vars` can still set them.

## Display passes

`treeData` is the full tree; `<Tree>` renders `treeData` → `filterTreeBySearch` (while searching) **or** `limitTreeEntries` (`maxDisplayLength`) → `appendDraftRow` (while a key is being added). Search, copy, expand all and the key count always read `treeData`, never the displayed tree.
- Synthetic rows are told apart by `nodeData`: `chunk` (array group), `more` (the "… N more" row), `draft` (the new-key input). Their tree values end in a NUL suffix only to stay unique; no code reads it. `renderJSONNode` returns `more` and `draft` rows before anything asks about a node, so none reaches `highlightNode` or `onNodeClick`. Tree values come from `childTreeValue()` and group labels from `getArrayGroupLabel()`, in `convertToTreeData` and in the structural-edit remap alike.
- `nodeData.parentType` is the type of the containing value: `withKeyQuotes` quotes only `parentType === 'object'`.
- **allExpanded**: `<Tree>` gets a wrapped controller whose `expandedState` is `getTreeExpandedState(displayedTreeData, '*')`, whose expand/toggle are no-ops, and whose `collapse` (Mantine's ArrowLeft over an open node) focuses the parent row instead.

## Structural editing (`structuralEdits`)

- Writes go through `pathSegments` (`renameKeyAtPath`, `insertAtPath`, `removeAtPath`, `moveAtPath`); the display `path` stays a label. Structural targets are always resolved by address (`findNodeBySegments`, `payloadAt`), never by tree value.
- Expanded state and revealed pages are keyed by tree value, which a rename or index shift changes for a whole subtree, so `commitStructuralChange` re-keys them with `remapContainerEntries` (a tree walk, not prefix matching; values an unmoved node shares, like `{ 'a.b' }` vs `{ a: { b } }`, go in `keep`) and the groups with `remapGroups`.
- Focus after a change goes through `pendingFocus`, a list of `FocusTarget`s (tree value + `pathSegments`; while editing, every row carries `data-json-tree-address`, so `findRow` picks the right one of two rows sharing a tree value; the first rendered target wins). After an editor closes, through `editingRowRef` (an element, or a `FocusTarget` for a row that did not exist yet).
- Keyboard shortcuts click the row's own control: every control carries `data-json-tree-action` (`reveal`, `rename`, `add`, `remove`, `move-up`, `move-down`); `rowControl()` looks only inside the row's `[data-json-tree-row]` Group, never into nested rows (`ROW_SHORTCUTS` maps keys to actions). Alt+arrows are caught in the capture phase because Mantine's Tree stops arrow keys on the `li`.

## Other conventions

- **Labels**: every built-in string comes from `labels` (`JsonTreeLabels`, merged over `DEFAULT_LABELS` and handed to `renderJSONNode` through `ctx.labels`). A new string, button or editor message must go there too, and every icon button takes its `aria-label` from it; `JsonTreeValueEditor` gets its name (`ariaLabel`) and `messages` from the caller.
- `rootName={false}`: the root gets no key cell, but the path prefix stays `root` (`convertToTreeData(data, undefined, 'root', …)`).
- Responsive `size`: `StyleProp<T>` through `JsonTreeMediaVariables` (`InlineStyles` + media queries set `--json-tree-font-size` per breakpoint, `useRandomClassName` scopes the selector; no JS re-renders).
- Indent guides: absolutely-positioned divs per depth, 5 cycling colours (`data-color-index`), `left = depth * indentWidth + 8px`, matching the Tree's `levelOffset={indentWidth}` (32 by default).
- `.value` uses its `data-type` attribute for type-specific colours. Per-node copy buttons (`withCopyToClipboard`) copy `JSON.stringify(value, null, 2)` and stay hidden until `.root:hover`. `stickyHeader` uses `[data-sticky='true']` with `stickyHeaderOffset`.
