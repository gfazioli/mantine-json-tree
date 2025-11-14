import { JsonTree, JsonTreeProps } from '@gfazioli/mantine-json-tree';
import { MantineDemo } from '@mantinex/demo';
import { data, dataCode } from './data';

function Demo(props: JsonTreeProps) {
  return <JsonTree {...props} data={data} />;
}

const code = `
import { JsonTree } from "@gfazioli/mantine-json-tree";
import { data } from './data';

function Demo() {
  return <JsonTree{{props}} data={data}/>;
}
`;

export const configurator: MantineDemo = {
  type: 'configurator',
  component: Demo,
  code: [
    { fileName: 'Demo.tsx', code, language: 'tsx' },
    { fileName: 'data.ts', code: dataCode, language: 'tsx' },
  ],
  controls: [
    { type: 'string', prop: 'title', initialValue: undefined as any, libraryValue: null },
    { type: 'boolean', prop: 'defaultExpanded', initialValue: true, libraryValue: false },
    {
      type: 'number',
      prop: 'maxDepth',
      initialValue: 2,
      libraryValue: 2,
      min: 0,
      max: 10,
      step: 1,
    },
    { type: 'boolean', prop: 'withExpandAll', initialValue: false, libraryValue: false },
    { type: 'boolean', prop: 'showItemsCount', initialValue: false, libraryValue: false },
    { type: 'boolean', prop: 'withCopyToClipboard', initialValue: false, libraryValue: false },
    { type: 'size', prop: 'size', initialValue: 'xs', libraryValue: 'xs' },
  ],
};
