import { JsonTree } from '@gfazioli/mantine-json-tree';
import { MantineDemo } from '@mantinex/demo';
import { data, dataCode } from './data';

const code = `
import { JsonTree } from "@gfazioli/mantine-json-tree";
import { data } from './data';

function Demo() {
  return (
    <JsonTree
      data={data}
      defaultExpanded
      maxDepth={-1}
      showLineNumbers
      title="JSON with Line Numbers"
    />
  );
}
`;

function Demo() {
  return (
    <JsonTree
      data={data}
      defaultExpanded
      maxDepth={-1}
      showLineNumbers
      title="JSON with Line Numbers"
    />
  );
}

export const lineNumbers: MantineDemo = {
  type: 'code',
  component: Demo,
  code: [
    { fileName: 'Demo.tsx', code, language: 'tsx' },
    { fileName: 'data.ts', code: dataCode, language: 'tsx' },
  ],
  defaultExpanded: false,
};
