import { Spinner } from '@gfazioli/mantine-spinner';
import { Group } from '@mantine/core';
import { MantineDemo } from '@mantinex/demo';
import classes from './Spinner.module.css';

function Demo() {
  return (
    <Group align="center" justify="center" gap={100}>
      <Spinner className={classes.pulse} />
      <Spinner className={classes.rotate} />
    </Group>
  );
}

const code = `
import { Spinner } from "@gfazioli/mantine-spinner";
import classes from './Spinner.module.css';

function Demo() {
  return (
    <Group align="center" justify="center" gap={100}>
      <Spinner className={classes.pulse} />
      <Spinner className={classes.rotate} />
    </Group>
  );
}
`;

const moduleCss = `
@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes rotate {
  0% {
    transform: rotateZ(0);
  }
  100% {
    transform: rotateZ(-360deg);
  }
}

.pulse {
  animation-name: pulse;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
  animation-fill-mode: backwards;
  animation-duration: 1s;
}

.rotate {
  animation-name: rotate;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
  animation-fill-mode: backwards;
  animation-duration: 18s;
}

`;

export const styled: MantineDemo = {
  type: 'code',
  component: Demo,
  defaultExpanded: false,
  code: [
    { fileName: 'Demo.tsx', code, language: 'tsx' },
    { fileName: 'Spinner.module.css', code: moduleCss, language: 'css' },
  ],
};
