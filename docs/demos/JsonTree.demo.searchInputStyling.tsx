import { JsonTree } from '@gfazioli/mantine-json-tree';
import { MantineDemo } from '@mantinex/demo';

const data = {
  user: { id: 'usr_42', name: 'Jamie', role: 'admin' },
  metadata: { theme: 'dark', notifications: true },
};

const code = `
import { JsonTree } from '@gfazioli/mantine-json-tree';

function Demo() {
  return (
    <JsonTree
      data={data}
      title="Custom search input"
      withBorder
      withSearch
      defaultExpanded
      searchInputProps={{
        radius: 'xl',
        variant: 'filled',
        placeholder: 'Look up keys or values…',
        styles: {
          input: {
            backgroundColor: 'var(--mantine-color-dark-7)',
            borderColor: 'var(--mantine-color-dark-4)',
            color: 'var(--mantine-color-gray-0)',
          },
        },
      }}
    />
  );
}
`;

function Demo() {
  return (
    <JsonTree
      data={data}
      title="Custom search input"
      withBorder
      withSearch
      defaultExpanded
      searchInputProps={{
        radius: 'xl',
        variant: 'filled',
        placeholder: 'Look up keys or values…',
        styles: {
          input: {
            backgroundColor: 'var(--mantine-color-dark-7)',
            borderColor: 'var(--mantine-color-dark-4)',
            color: 'var(--mantine-color-gray-0)',
          },
        },
      }}
    />
  );
}

export const searchInputStyling: MantineDemo = {
  type: 'code',
  component: Demo,
  code,
  defaultExpanded: false,
};
