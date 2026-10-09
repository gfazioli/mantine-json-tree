import { JsonTree } from '@gfazioli/mantine-json-tree';
import { SimpleGrid } from '@mantine/core';
import { MantineDemo } from '@mantinex/demo';

const data = { name: 'Ada', languages: ['en', 'fr'], address: { city: 'London' } };

function Demo() {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2 }}>
      <JsonTree
        data={data}
        title="JSON style"
        withBorder
        defaultExpanded
        maxDepth={-1}
        withKeyQuotes
      />
      <JsonTree
        data={data}
        title="No quotes"
        withBorder
        defaultExpanded
        maxDepth={-1}
        withQuotes={false}
      />
    </SimpleGrid>
  );
}

const code = `
import { JsonTree } from '@gfazioli/mantine-json-tree';
import { SimpleGrid } from '@mantine/core';

const data = { name: 'Ada', languages: ['en', 'fr'], address: { city: 'London' } };

function Demo() {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2 }}>
      <JsonTree data={data} title="JSON style" withBorder defaultExpanded maxDepth={-1} withKeyQuotes />
      <JsonTree data={data} title="No quotes" withBorder defaultExpanded maxDepth={-1} withQuotes={false} />
    </SimpleGrid>
  );
}
`;

export const quotes: MantineDemo = {
  type: 'code',
  component: Demo,
  code,
  defaultExpanded: false,
};
