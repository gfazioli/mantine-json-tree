import type { JsonTreeFactory } from '@gfazioli/mantine-json-tree';
import type { StylesApiData } from '../components/styles-api.types';

export const JsonTreeStylesApi: StylesApiData<JsonTreeFactory> = {
  selectors: {
    root: 'Root element',
  },

  vars: {
    root: {
      '--json-tree-stroke-linecap': 'Stroke linecap',
      '--json-tree-animation-duration': 'Duration of the animation',
    },
  },

  //modifiers: [{ selector: 'root' }],
};
