import { JsonTree } from '@gfazioli/mantine-json-tree';
import { MantineDemo } from '@mantinex/demo';
import { data, dataCode } from './data';
import classes from './JsonTree.module.css';

function Demo() {
  return (
    <JsonTree
      classNames={classes}
      title="demo.json"
      showIndentGuides
      defaultExpanded
      maxDepth={1}
      data={data}
      style={{ '--json-tree-color-string': 'red' }}
    />
  );
}

const code = `
import { JsonTree } from "@gfazioli/mantine-json-tree";
import classes from './JsonTree.module.css';
import { data } from './data';

function Demo() {
  return (
    <JsonTree
      classNames={classes}
      title="demo.json"
      showIndentGuides
      defaultExpanded
      maxDepth={1}
      data={data}
      style={{ '--json-tree-color-string': 'red' }}
    />
  );
}
`;

const moduleCss = `
.root {
  --json-tree-indent-guide-color-0: red !important;
}

.header {
  background-color: var(--mantine-color-dark-7);
  border-radius: var(--mantine-radius-sm);
  border: 1px solid var(--mantine-color-dark-5);

  @mixin where-light {
    background-color: var(--mantine-color-gray-0);
    border: 1px solid var(--mantine-color-gray-1);
  }
}
`;

export const styled: MantineDemo = {
  type: 'code',
  component: Demo,
  defaultExpanded: false,
  code: [
    { fileName: 'Demo.tsx', code, language: 'tsx' },
    { fileName: 'JsonTree.module.css', code: moduleCss, language: 'css' },
    { fileName: 'data.ts', code: dataCode, language: 'tsx' },
  ],
};
