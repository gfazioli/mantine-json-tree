import { JsonTree } from '@gfazioli/mantine-json-tree';
import { Group } from '@mantine/core';
import { MantineDemo } from '@mantinex/demo';
import classes from './JsonTree.module.css';

function Demo() {
  return (
    <Group align="center" justify="center" gap={100}>
      <JsonTree className={classes.pulse} />
      <JsonTree className={classes.rotate} />
    </Group>
  );
}

const code = `
import { JsonTree } from "@gfazioli/mantine-json-tree";
import classes from './JsonTree.module.css';

function Demo() {
  return (
    <Group align="center" justify="center" gap={100}>
      <JsonTree className={classes.pulse} />
      <JsonTree className={classes.rotate} />
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
    { fileName: 'JsonTree.module.css', code: moduleCss, language: 'css' },
  ],
};
