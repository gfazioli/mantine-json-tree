# CLAUDE.md

`@gfazioli/mantine-json-tree` — a Mantine extension that renders interactive JSON trees with syntax highlighting, collapsible nodes, copy-to-clipboard, configurable expansion depth, indent guides, and heterogeneous data types (objects, arrays, strings, numbers, booleans, nulls, functions, Date, RegExp, Map, Set, BigInt, Symbol, React elements). Single-component package: `JsonTree` is the only exported component. Tree pipeline, editing and labels: `.claude/rules/internals.md` (loads with `package/src`).

After changing the public API (props, types, exports), always run `yarn clean && yarn build` before `yarn test`, because `yarn docgen` needs the fresh build output.

Invariants: every built-in string, button or editor message goes through `labels` (merged over `DEFAULT_LABELS`), and every icon button takes its `aria-label` from it; structural edits resolve targets by address (`pathSegments`), never by tree value; search, copy, expand all and the key count read the full `treeData`, never the displayed tree.
