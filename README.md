# Mantine Json Tree Component

<img width="2752" height="1536" alt="Mantine Json Tree" src="https://github.com/user-attachments/assets/26d79eca-a2e8-4d5c-a62f-6bf075573a16" />

<div align="center">
  
  [![NPM version](https://img.shields.io/npm/v/%40gfazioli%2Fmantine-json-tree?style=for-the-badge)](https://www.npmjs.com/package/@gfazioli/mantine-json-tree)
  [![NPM Downloads](https://img.shields.io/npm/dm/%40gfazioli%2Fmantine-json-tree?style=for-the-badge)](https://www.npmjs.com/package/@gfazioli/mantine-json-tree)
  [![NPM Downloads](https://img.shields.io/npm/dy/%40gfazioli%2Fmantine-json-tree?style=for-the-badge&label=%20&color=f90)](https://www.npmjs.com/package/@gfazioli/mantine-json-tree)
  ![NPM License](https://img.shields.io/npm/l/%40gfazioli%2Fmantine-json-tree?style=for-the-badge)

</div>

## Overview

This component is created on top of the [Mantine](https://mantine.dev/) library.

[Mantine JsonTree](https://gfazioli.github.io/mantine-json-tree) provides a structured, interactive view of heterogeneous data—strings, numbers, booleans, nulls, objects, arrays, and even functions—organized as a collapsible tree. Developers can control initial expansion, show visual indent guides, and customize expand/collapse controls with arbitrary React nodes (e.g., emojis or styled icons) to match their design system. For function values, the component offers flexible rendering modes: show the function signature as text, hide functions entirely, or inspect them as objects when needed. 

Wrapped with Mantine layout primitives like Paper, Stack, and SimpleGrid, JsonTree integrates cleanly into dashboards, developer tools, and documentation pages where readable, navigable data visualization is essential.

> [!note]
>
> → [Demo and Documentation](https://gfazioli.github.io/mantine-json-tree/) → [Youtube Video](https://www.youtube.com/playlist?list=PL85tTROKkZrWyqCcmNCdWajpx05-cTal4) → [More Mantine Components](https://mantine-extensions.vercel.app/)

## Installation

```sh
npm install @gfazioli/mantine-json-tree
```
or 

```sh
yarn add @gfazioli/mantine-json-tree
```

After installation import package styles at the root of your application:

```tsx
import '@gfazioli/mantine-json-tree/styles.css';
```

## Usage

```tsx
import { JsonTree } from '@gfazioli/mantine-json-tree';

function Demo() {
  return <JsonTree data={{ key: "value" }} />;
}
```
---
https://github.com/user-attachments/assets/ce2b1ba2-51f7-43d5-8477-6d8fee103fa3

---
[![Star History Chart](https://api.star-history.com/svg?repos=gfazioli/mantine-json-tree&type=Timeline)](https://www.star-history.com/#gfazioli/mantine-json-tree&Timeline)

