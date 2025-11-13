import { useEffect, useState } from 'react';
import { Spinner, SpinnerProps } from '@gfazioli/mantine-spinner';
import { CodeHighlight } from '@mantine/code-highlight';
import { Button, Center, Stack } from '@mantine/core';
import { MantineDemo } from '@mantinex/demo';

function Demo() {
  const [props, setProps] = useState<SpinnerProps>();

  interface RandomInRangeParams {
    min: number;
    max: number;
    step: number;
  }

  useEffect(random, []);

  function randomInRange({ min, max, step }: RandomInRangeParams): number {
    const range = (max - min) / step;
    return Math.floor(Math.random() * (range + 1)) * step + min;
  }

  function random() {
    const randomColor = `#${Math.floor(Math.random() * 16777215)
      .toString(16)
      .padStart(6, '0')
      .toUpperCase()}`;

    setProps({
      size: randomInRange({ min: 16, max: 200, step: 1 }),
      inner: randomInRange({ min: 0, max: 100, step: 1 }),
      segments: randomInRange({ min: 8, max: 64, step: 1 }),
      thickness: randomInRange({ min: 1, max: 10, step: 1 }),
      speed: randomInRange({ min: 100, max: 2000, step: 100 }),
      color: randomColor,
    });
  }

  const codeProps = `size={${props?.size}} inner={${props?.inner}} segments={${props?.segments}} thickness={${props?.thickness}} speed={${props?.speed}} color="${props?.color}"`;

  return (
    <>
      <Stack align="center" gap={64} mb={32}>
        <Center h={200} w={200}>
          <Spinner {...props} />
        </Center>
        <Button onClick={random}>Random</Button>
      </Stack>
      <CodeHighlight
        w={{ base: 'auto', lg: 800 }}
        radius={32}
        language="tsx"
        code={`<Spinner ${codeProps} />`}
      />
    </>
  );
}

export const random: MantineDemo = {
  type: 'code',
  component: Demo,
};
