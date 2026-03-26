import { JsonTree, JsonTreeProps } from '@gfazioli/mantine-json-tree';
import { MantineDemo } from '@mantinex/demo';
import { data, dataCode } from './data';

function Demo(props: JsonTreeProps) {
  return <JsonTree {...props} data={data} defaultExpanded maxDepth={-1} />;
}

const code = `
import { JsonTree } from "@gfazioli/mantine-json-tree";
import { data } from './data';

function Demo() {
  return <JsonTree{{props}} data={data} defaultExpanded maxDepth={-1} />;
}
`;

export const maxHeightDemo: MantineDemo = {
  type: 'configurator',
  component: Demo,
  code: [
    { fileName: 'Demo.tsx', code, language: 'tsx' },
    { fileName: 'data.ts', code: dataCode, language: 'tsx' },
  ],
  controls: [
    {
      type: 'number',
      prop: 'maxHeight',
      initialValue: 300,
      libraryValue: undefined,
      min: 100,
      max: 600,
      step: 50,
    },
    { type: 'boolean', prop: 'showIndentGuides', initialValue: true, libraryValue: false },
  ],
};
