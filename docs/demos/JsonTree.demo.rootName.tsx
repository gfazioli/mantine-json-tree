import { JsonTree } from '@gfazioli/mantine-json-tree';
import { Stack } from '@mantine/core';
import { MantineDemo } from '@mantinex/demo';

const code = `
import { JsonTree } from '@gfazioli/mantine-json-tree';

function Demo() {
  return (
    <JsonTree
      data={{ id: 1, name: 'Alice', role: 'admin' }}
      rootName="response"
      title="Custom Root Name"
      withBorder
      withKeyCountBadge
      defaultExpanded
    />
  );
}
`;

function Demo() {
  return (
    <Stack>
      <JsonTree
        data={{ id: 1, name: 'Alice', role: 'admin' }}
        rootName="response"
        title="Custom Root Name"
        withBorder
        withKeyCountBadge
        defaultExpanded
      />
      <JsonTree
        data={[1, 2, 3]}
        rootName="items"
        title="Array Root Name"
        withBorder
        withKeyCountBadge
        defaultExpanded
      />
    </Stack>
  );
}

export const rootName: MantineDemo = {
  type: 'code',
  component: Demo,
  code,
  defaultExpanded: false,
};
