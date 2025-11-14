import type { JsonTreeFactory } from '@gfazioli/mantine-json-tree';
import type { StylesApiData } from '../components/styles-api.types';

export const JsonTreeStylesApi: StylesApiData<JsonTreeFactory> = {
  selectors: {
    root: 'Root element',
  },

  vars: {
    root: {
      '--json-tree-font-family': 'Font family for the JSON tree',
      '--json-tree-color-string': 'Color for string values',
      '--json-tree-color-number': 'Color for number values',
      '--json-tree-color-boolean': 'Color for boolean values',
      '--json-tree-color-null': 'Color for null values',
      '--json-tree-color-key': 'Color for object keys',
      '--json-tree-font-size': 'Font size for the JSON tree',
      '--json-tree-color-bracket': 'Color for brackets and punctuation',
    },
    header: {
      '--json-tree-header-background-color': 'Background color for the header',
      '--json-tree-header-sticky-offset': 'Offset from the top when the header is sticky',
    },
  },

  //modifiers: [{ selector: 'root' }],
};
