import { JsonTree } from '@gfazioli/mantine-json-tree';
import { MantineDemo } from '@mantinex/demo';

const data = {
  status: 201,
  body: {
    id: 'inv_2048',
    lines: [
      { sku: 'MUG-01', qty: 2 },
      { sku: 'TEE-XL', qty: 1 },
    ],
    customer: { name: 'Ada', country: 'UK' },
  },
};

function Demo() {
  return <JsonTree data={data} title="POST /invoices" withBorder allExpanded withExpandAll />;
}

const code = `
import { JsonTree } from '@gfazioli/mantine-json-tree';

const data = {
  status: 201,
  body: {
    id: 'inv_2048',
    lines: [
      { sku: 'MUG-01', qty: 2 },
      { sku: 'TEE-XL', qty: 1 },
    ],
    customer: { name: 'Ada', country: 'UK' },
  },
};

function Demo() {
  return <JsonTree data={data} title="POST /invoices" withBorder allExpanded withExpandAll />;
}
`;

export const allExpanded: MantineDemo = {
  type: 'code',
  component: Demo,
  code,
  defaultExpanded: false,
};
