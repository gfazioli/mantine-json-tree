import { JsonTree, JsonTreeProps } from '@gfazioli/mantine-json-tree';
import { MantineDemo } from '@mantinex/demo';
import { data, dataCode } from './data';

const code = `
import { JsonTree } from "@gfazioli/mantine-json-tree";
import { data } from './data';

function Demo() {
  return (
    <JsonTree{{props}}
      data={data}
      title="data.json"
      defaultExpanded
      withExpandAll
      maxHeight={300}
      styles={{
        header: { backgroundColor: 'var(--mantine-color-default)' },
      }}
    />
  );
}
`;

function Demo(props: JsonTreeProps) {
  return (
    <JsonTree
      {...props}
      data={data}
      title="data.json"
      defaultExpanded
      withExpandAll
      maxHeight={300}
      styles={{
        header: { backgroundColor: 'var(--mantine-color-default)' },
      }}
    />
  );
}

export const sticky: MantineDemo = {
  type: 'configurator',
  component: Demo,
  code: [
    { fileName: 'Demo.tsx', code, language: 'tsx' },
    { fileName: 'data.ts', code: dataCode, language: 'tsx' },
  ],
  controls: [
    { type: 'boolean', prop: 'stickyHeader', initialValue: true, libraryValue: false },
    {
      type: 'number',
      prop: 'stickyHeaderOffset',
      initialValue: 0,
      libraryValue: 0,
      min: -32,
      max: 32,
      step: 1,
    },
  ],
};
