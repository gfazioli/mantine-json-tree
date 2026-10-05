import { JsonTree } from '@gfazioli/mantine-json-tree';
import { MantineDemo } from '@mantinex/demo';

const data = {
  description:
    'A long description that would push every other value off the screen if it were shown in full on a single line.',
  scores: Array.from({ length: 250 }, (_, index) => Math.round(Math.sin(index) * 1000) / 10),
  owner: { name: 'Alice', verified: true, deletedAt: null },
};

function Demo() {
  return (
    <JsonTree
      data={data}
      title="report.json"
      defaultExpanded
      maxDepth={1}
      withBorder
      showItemsCount
      showValueTypes
      collapseStringsAfterLength={40}
      groupArraysAfterLength={100}
    />
  );
}

const code = `
import { JsonTree } from '@gfazioli/mantine-json-tree';

const data = {
  description:
    'A long description that would push every other value off the screen if it were shown in full on a single line.',
  scores: Array.from({ length: 250 }, (_, index) => Math.round(Math.sin(index) * 1000) / 10),
  owner: { name: 'Alice', verified: true, deletedAt: null },
};

function Demo() {
  return (
    <JsonTree
      data={data}
      title="report.json"
      defaultExpanded
      maxDepth={1}
      withBorder
      showItemsCount
      showValueTypes
      collapseStringsAfterLength={40}
      groupArraysAfterLength={100}
    />
  );
}
`;

export const largeData: MantineDemo = {
  type: 'code',
  component: Demo,
  code,
  defaultExpanded: false,
};
