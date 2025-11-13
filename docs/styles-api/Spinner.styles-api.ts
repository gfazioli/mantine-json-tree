import type { SpinnerFactory } from '@gfazioli/mantine-spinner';
import type { StylesApiData } from '../components/styles-api.types';

export const SpinnerStylesApi: StylesApiData<SpinnerFactory> = {
  selectors: {
    root: 'Root element',
  },

  vars: {
    root: {
      '--spinner-stroke-linecap': 'Stroke linecap',
      '--spinner-animation-duration': 'Duration of the animation',
    },
  },

  //modifiers: [{ selector: 'root' }],
};
