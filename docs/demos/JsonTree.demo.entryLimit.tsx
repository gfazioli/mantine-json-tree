import { JsonTree } from '@gfazioli/mantine-json-tree';
import { MantineDemo } from '@mantinex/demo';

const data = {
  users: Array.from({ length: 1000 }, (_, index) => ({ id: index + 1, name: `user-${index + 1}` })),
  flags: Object.fromEntries(
    Array.from({ length: 40 }, (_, index) => [`flag${index + 1}`, index % 3 === 0])
  ),
};

function Demo() {
  return (
    <JsonTree
      data={data}
      title="dump.json"
      defaultExpanded
      maxDepth={2}
      withBorder
      withSearch
      withKeyCountBadge
      maxDisplayLength={10}
    />
  );
}

const code = `
import { JsonTree } from '@gfazioli/mantine-json-tree';

const data = {
  users: Array.from({ length: 1000 }, (_, index) => ({ id: index + 1, name: \`user-\${index + 1}\` })),
  flags: Object.fromEntries(Array.from({ length: 40 }, (_, index) => [\`flag\${index + 1}\`, index % 3 === 0])),
};

function Demo() {
  return (
    <JsonTree
      data={data}
      title="dump.json"
      defaultExpanded
      maxDepth={2}
      withBorder
      withSearch
      withKeyCountBadge
      maxDisplayLength={10}
    />
  );
}
`;

export const entryLimit: MantineDemo = {
  type: 'code',
  component: Demo,
  code,
  defaultExpanded: false,
};
