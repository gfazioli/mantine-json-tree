import { JsonTree } from '@gfazioli/mantine-json-tree';
import { MantineDemo } from '@mantinex/demo';
import { data, dataCode } from './data';
import classes from './JsonTreeSyntax.module.css';

function Demo() {
  return (
    <JsonTree classNames={classes} title="demo.json" defaultExpanded maxDepth={1} data={data} />
  );
}

const code = `
import { JsonTree } from "@gfazioli/mantine-json-tree";
import classes from './JsonTree.module.css';
import { data } from './data';

function Demo() {
  return <JsonTree className={classes.root} defaultExpanded maxDepth={1} data={data} />;
}
`;

const moduleCss = `
.root {
  background-color: var(--mantine-color-dark-8);
  padding: var(--mantine-spacing-md);
  border-radius: var(--mantine-radius-md);
  border: 1px solid var(--mantine-color-dark-5);
}
`;

export const syntax: MantineDemo = {
  type: 'code',
  component: Demo,
  defaultExpanded: false,
  code: [
    { fileName: 'Demo.tsx', code, language: 'tsx' },
    { fileName: 'JsonTree.module.css', code: moduleCss, language: 'css' },
    { fileName: 'data.ts', code: dataCode, language: 'tsx' },
  ],
};
