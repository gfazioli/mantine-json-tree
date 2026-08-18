import { JsonTree } from '@gfazioli/mantine-json-tree';
import { Paper } from '@mantine/core';
import { MantineDemo } from '@mantinex/demo';

const code = `
import { JsonTree } from "@gfazioli/mantine-json-tree";
import { Paper } from '@mantine/core';

function Demo() {
  // A node graph: every child points back at its parent, and a shared
  // "config" object is referenced from two different branches.
  const config = { theme: 'dark', locale: 'en' };

  const root: any = {
    id: 'root',
    config,
    child: {
      id: 'child',
      config,
    },
  };

  root.self = root;
  root.child.parent = root;

  return (
    <Paper withBorder>
      <JsonTree
        data={root}
        title="graph.json"
        defaultExpanded
        maxDepth={-1}
        withExpandAll
        showItemsCount
      />
    </Paper>
  );
}
`;

function Demo() {
  // A node graph: every child points back at its parent, and a shared
  // "config" object is referenced from two different branches.
  const config = { theme: 'dark', locale: 'en' };

  const root: any = {
    id: 'root',
    config,
    child: {
      id: 'child',
      config,
    },
  };

  root.self = root;
  root.child.parent = root;

  return (
    <Paper withBorder>
      <JsonTree
        data={root}
        title="graph.json"
        defaultExpanded
        maxDepth={-1}
        withExpandAll
        showItemsCount
      />
    </Paper>
  );
}

export const circular: MantineDemo = {
  type: 'code',
  component: Demo,
  code,
  defaultExpanded: false,
};
