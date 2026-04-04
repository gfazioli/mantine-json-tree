# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project
`@gfazioli/mantine-json-tree` — A Mantine extension component that renders interactive JSON trees with syntax highlighting, collapsible nodes, copy-to-clipboard, configurable expansion depth, indent guides, and support for heterogeneous data types (objects, arrays, strings, numbers, booleans, nulls, functions, Date, RegExp, Map, Set, BigInt, Symbol, React elements).

## Commands
| Command | Purpose |
|---------|---------|
| `yarn build` | Build the npm package via Rollup |
| `yarn dev` | Start the Next.js docs dev server (port 9281) |
| `yarn test` | Full test suite (syncpack + oxfmt + typecheck + lint + jest) |
| `yarn jest` | Run only Jest unit tests |
| `yarn docgen` | Generate component API docs (docgen.json) |
| `yarn docs:build` | Build the Next.js docs site for production |
| `yarn docs:deploy` | Build and deploy docs to GitHub Pages |
| `yarn lint` | Run oxlint + Stylelint |
| `yarn format:write` | Format all files with oxfmt |
| `yarn storybook` | Start Storybook dev server |
| `yarn clean` | Remove build artifacts |
| `yarn release:patch` | Bump patch version and deploy docs |
| `diny yolo` | AI-assisted commit (stage all, generate message, commit + push) |

> **Important**: After changing the public API (props, types, exports), always run `yarn clean && yarn build` before `yarn test`, because `yarn docgen` needs the fresh build output.

## Architecture

### Workspace Layout
Yarn workspaces monorepo with two workspaces: `package/` (npm package) and `docs/` (Next.js 15 documentation site).

### Package Source (`package/src/`)
```
JsonTree.tsx                # Component implementation (factory pattern)
JsonTreeMediaVariables.tsx  # Responsive CSS via InlineStyles + media queries
JsonTree.module.css         # CSS Modules with type-specific color selectors
JsonTree.story.module.css   # Storybook demo custom class overrides
JsonTree.story.tsx    # Storybook stories
JsonTree.test.tsx     # Jest unit test
index.ts              # Public exports
lib/
  utils.tsx           # Tree data conversion, type detection, value formatting
```

Single-component package — `JsonTree` is the only exported component, built with Mantine's `factory<JsonTreeFactory>` pattern (`useProps`, `useStyles`, `createVarsResolver`). The `renderJSONNode` function is extracted outside the factory for performance (avoids recreation on every render).

### Build Pipeline
Rollup bundles to dual ESM (`dist/esm/`) and CJS (`dist/cjs/`) with `'use client'` banner. CSS modules are hashed with `hash-css-selector` (prefix `me`). TypeScript declarations via `rollup-plugin-dts`. CSS is split into `styles.css` and `styles.layer.css` (layered version).

## Component Details

### Factory pattern
`JsonTree` uses Mantine's `factory<JsonTreeFactory>` which requires a `Factory` type declaring `props`, `ref`, `stylesNames`, and `vars`, plus `createVarsResolver` to map props to CSS custom properties, `useProps` for default prop merging, and `useStyles` for the `getStyles` accessor.

### Tree rendering
The component converts arbitrary data to Mantine's `TreeNodeData` format via `convertToTreeData()` in `lib/utils.tsx`. This recursive function:
- Detects value types via `getValueType()` — supports 16 types including `react-element`, `date`, `nan`, `infinity`, `bigint`, `symbol`, `regexp`, `map`, `set`
- Builds a `JSONTreeNodeData` tree with `nodeData` metadata (type, value, key, path, itemCount, depth)
- Handles functions via the `displayFunctions` prop: `'as-string'` (default), `'hide'` (filtered out), `'as-object'` (introspect properties)
- Handles Map/Set by converting entries to indexed children

The tree is rendered using Mantine's `<Tree>` component with a custom `renderNode` function (`renderJSONNode`) that produces two layouts: primitive values (key-value pair) and expandable nodes (with bracket notation and collapse/expand controls).

### Expansion control
`defaultExpanded` + `maxDepth` props control initial state. `maxDepth: -1` expands all via `getTreeExpandedState(treeData, '*')`. Otherwise, a depth-limited traversal collects node values to expand. The `useTree` hook manages expand/collapse state.

### Responsive CSS (size prop)
The `size` prop supports responsive breakpoint objects via CSS-native approach (`StyleProp<T>`). `JsonTreeMediaVariables` component uses `InlineStyles` + CSS media queries to set `--json-tree-font-size` per breakpoint — no JavaScript re-renders. Pattern follows Mantine core's `SimpleGridMediaVariables` and `mantine-select-stepper`'s `SelectStepperMediaVariables`. Uses `useRandomClassName` for scoped selectors.

### CSS custom properties
The `varsResolver` maps props to CSS variables across multiple style targets:
- **root**: `--json-tree-font-family` (font-size is handled by `JsonTreeMediaVariables`)
- **header**: `--json-tree-header-background-color`, `--json-tree-header-sticky-offset`
- **key**: `--json-tree-color-key`
- **value**: 14 type-specific color variables (`--json-tree-color-string`, `--json-tree-color-number`, etc.)
- **bracket**: `--json-tree-color-bracket`
- **ellipsis**: `--json-tree-color-ellipsis`
- **indentGuide**: 5 rotating color variables (`--json-tree-indent-guide-color-0` through `4`)

### Styles API selectors
`root`, `header`, `controls`, `expandCollapse`, `key`, `keyValueSeparator`, `value`, `bracket`, `ellipsis`, `itemsCount`, `indentGuide`, `copyButton`. The `.value` selector uses `data-type` attribute to apply type-specific colors via CSS.

### Indent guides
When `showIndentGuides` is enabled, absolutely-positioned `<div>` elements are rendered for each depth level with cycling colors (5-color palette via `data-color-index`). Guide position: `left = depth * 32 + 8px` (matching Mantine Tree's `levelOffset={32}`).

### Copy to clipboard
The `withCopyToClipboard` prop adds per-node copy buttons that `JSON.stringify(value, null, 2)` to clipboard. Buttons use opacity transition (hidden until `.root:hover`).

### Sticky header
When `stickyHeader` is true, the header gets `position: sticky` via `[data-sticky='true']` with configurable offset (`stickyHeaderOffset`).

## Testing
Jest with `jsdom` environment, `esbuild-jest` transform, CSS mocked via `identity-obj-proxy`. Component tests use `@mantine-tests/core` render helper. Test file: `package/src/JsonTree.test.tsx`.

## Ecosystem
This repo is part of the Mantine Extensions ecosystem, derived from the `mantine-base-component` template. See the workspace `CLAUDE.md` (in the parent directory) for:
- Development checklist (code -> test -> build -> docs -> release)
- Cross-cutting patterns (compound components, responsive CSS, GitHub sync)
- Update packages workflow
- Release process
