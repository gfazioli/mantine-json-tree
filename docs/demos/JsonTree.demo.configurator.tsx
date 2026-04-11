import { JsonTree, JsonTreeProps } from '@gfazioli/mantine-json-tree';
import { MantineDemo } from '@mantinex/demo';
import { data, dataCode } from './data';

function Demo(props: JsonTreeProps) {
  return <JsonTree {...props} data={data} maxDepth={1} defaultExpanded />;
}

const code = `
import { JsonTree } from "@gfazioli/mantine-json-tree";
import { data } from './data';

function Demo() {
  return <JsonTree{{props}} data={data} maxDepth={1} defaultExpanded/>;
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
    { type: 'size', prop: 'size', initialValue: 'sm', libraryValue: 'xs' },
    { type: 'boolean', prop: 'withBorder', initialValue: true, libraryValue: false },
    { type: 'boolean', prop: 'withKeyCountBadge', initialValue: true, libraryValue: false },
    { type: 'boolean', prop: 'withExpandAll', initialValue: true, libraryValue: false },
    { type: 'boolean', prop: 'withCopyAll', initialValue: true, libraryValue: false },
    { type: 'boolean', prop: 'withSearch', initialValue: true, libraryValue: false },
    { type: 'boolean', prop: 'withCopyToClipboard', initialValue: true, libraryValue: false },
    { type: 'boolean', prop: 'showIndentGuides', initialValue: true, libraryValue: false },
    { type: 'boolean', prop: 'showItemsCount', initialValue: true, libraryValue: false },
    { type: 'boolean', prop: 'showLineNumbers', initialValue: true, libraryValue: false },
    { type: 'boolean', prop: 'showPathOnHover', initialValue: true, libraryValue: false },
    {
      type: 'select',
      prop: 'displayFunctions',
      initialValue: 'as-string',
      libraryValue: 'as-string',
      data: [
        { value: 'as-string', label: 'as-string' },
        { value: 'hide', label: 'hide' },
        { value: 'as-object', label: 'as-object' },
      ],
    },
  ],
};
