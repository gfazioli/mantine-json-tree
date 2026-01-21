import type { JsonTreeFactory } from '@gfazioli/mantine-json-tree';
import type { StylesApiData } from '../components/styles-api.types';

export const JsonTreeStylesApi: StylesApiData<JsonTreeFactory> = {
  selectors: {
    root: 'Root element',
    header: 'Header element',
    controls: 'Controls container',
    expandCollapse: 'Expand/collapse button',
    key: 'Element that renders object keys',
    keyValueSeparator: 'Element that renders the key-value separator (:)',
    value: 'Element that renders values (strings, numbers, booleans, null)',
    bracket: 'Element that renders brackets and punctuation (braces, commas, etc.)',
    itemsCount: 'Element that renders item counts for objects and arrays',
    indentGuide: 'Element that renders indent guides',
    copyButton: 'Copy to clipboard button',
    ellipsis: 'Element that renders ellipsis for collapsed nodes',
  },

  vars: {
    root: {
      '--json-tree-font-family': 'Font family for the JSON tree',
      '--json-tree-font-size': 'Font size for the JSON tree',
    },
    header: {
      '--json-tree-header-background-color': 'Background color for the header',
      '--json-tree-header-sticky-offset': 'Offset from the top when the header is sticky',
    },
    key: {
      '--json-tree-color-key': 'Color for object keys',
    },

    value: {
      '--json-tree-color-string': 'Color for string values',
      '--json-tree-color-number': 'Color for number values',
      '--json-tree-color-boolean': 'Color for boolean values',
      '--json-tree-color-null': 'Color for null values',
      '--json-tree-color-function': 'Color for function values',
      '--json-tree-color-react-element': 'Color for React component values',
      '--json-tree-color-date': 'Color for Date object values',
      '--json-tree-color-nan': 'Color for NaN values',
      '--json-tree-color-infinity': 'Color for Infinity values',
      '--json-tree-color-bigint': 'Color for BigInt values',
      '--json-tree-color-symbol': 'Color for Symbol values',
      '--json-tree-color-regexp': 'Color for RegExp values',
      '--json-tree-color-map': 'Color for Map collection values',
      '--json-tree-color-set': 'Color for Set collection values',
    },
    bracket: {
      '--json-tree-color-bracket': 'Color for brackets and punctuation',
    },
    indentGuide: {
      '--json-tree-indent-guide-color-0': 'Color for indent guide at level 0 (and every 5th level)',
      '--json-tree-indent-guide-color-1': 'Color for indent guide at level 1 (and every 5th level)',
      '--json-tree-indent-guide-color-2': 'Color for indent guide at level 2 (and every 5th level)',
      '--json-tree-indent-guide-color-3': 'Color for indent guide at level 3 (and every 5th level)',
      '--json-tree-indent-guide-color-4': 'Color for indent guide at level 4 (and every 5th level)',
    },
    copyButton: {},
    expandCollapse: {},
    keyValueSeparator: {},
    ellipsis: {},
    itemsCount: {},
    controls: {},
  },

  //modifiers: [{ selector: 'root' }],
};
