import { JsonTree } from '@gfazioli/mantine-json-tree';
import { MantineDemo } from '@mantinex/demo';

const data = {
  id: 'usr_7k2m9p',
  email: 'jamie@example.com',
  name: 'Jamie Chen',
  role: 'admin',
  verified: true,
  created_at: '2026-03-10T23:42:00Z',
  metadata: {
    login_count: 142,
    last_ip: '203.0.113.42',
    preferences: {
      theme: 'dark',
      notifications: true,
      locale: 'en-US',
    },
  },
};

const code = `
import { JsonTree } from '@gfazioli/mantine-json-tree';

function Demo() {
  return (
    <JsonTree
      data={data}
      title="API Response"
      rootName="root"
      withBorder
      withSearch
      withExpandAll
      withKeyCountBadge
      withCopyAll
      defaultExpanded
    />
  );
}
`;

function Demo() {
  return (
    <JsonTree
      data={data}
      title="API Response"
      rootName="root"
      withBorder
      withSearch
      withExpandAll
      withKeyCountBadge
      withCopyAll
      defaultExpanded
    />
  );
}

export const search: MantineDemo = {
  type: 'code',
  component: Demo,
  code,
  defaultExpanded: false,
};
