import { JsonTree } from '@gfazioli/mantine-json-tree';
import { Paper, Stack, Text } from '@mantine/core';
import { MantineDemo } from '@mantinex/demo';
import { useState } from 'react';

const code = `
import { useState } from 'react';
import { JsonTree } from "@gfazioli/mantine-json-tree";
import { Paper, Stack, Text } from '@mantine/core';

function Demo() {
  const [data, setData] = useState({
    name: 'Jamie Chen',
    age: 34,
    isAdmin: false,
    createdAt: new Date('2024-01-15T10:30:00Z'),
    address: {
      city: 'Anytown',
      zip: '12345',
    },
    tags: ['react', 'mantine'],
  });

  const [lastChange, setLastChange] = useState(null);

  return (
    <Stack>
      <Paper withBorder>
        <JsonTree
          data={data}
          title="profile.json"
          defaultExpanded
          maxDepth={-1}
          editable
          onChange={(next, change) => {
            setData(next);
            setLastChange(change);
          }}
          // zip stays read-only even though its type is editable
          isEditable={({ key }) => key !== 'zip'}
          validate={({ type, value }) =>
            type === 'string' && String(value).trim() === '' ? 'Cannot be empty' : null
          }
        />
      </Paper>

      <Text size="sm" c="dimmed">
        {lastChange
          ? \`\${lastChange.path}: \${JSON.stringify(lastChange.previousValue)} → \${JSON.stringify(lastChange.value)}\`
          : 'Click a value to edit it. Enter commits, Escape cancels.'}
      </Text>
    </Stack>
  );
}
`;

function Demo() {
  const [data, setData] = useState<any>({
    name: 'Jamie Chen',
    age: 34,
    isAdmin: false,
    createdAt: new Date('2024-01-15T10:30:00Z'),
    address: {
      city: 'Anytown',
      zip: '12345',
    },
    tags: ['react', 'mantine'],
  });

  const [lastChange, setLastChange] = useState<any>(null);

  return (
    <Stack>
      <Paper withBorder>
        <JsonTree
          data={data}
          title="profile.json"
          defaultExpanded
          maxDepth={-1}
          editable
          onChange={(next, change) => {
            setData(next);
            setLastChange(change);
          }}
          // zip stays read-only even though its type is editable
          isEditable={({ key }) => key !== 'zip'}
          validate={({ type, value }) =>
            type === 'string' && String(value).trim() === '' ? 'Cannot be empty' : null
          }
        />
      </Paper>

      <Text size="sm" c="dimmed">
        {lastChange
          ? `${lastChange.path}: ${JSON.stringify(lastChange.previousValue)} → ${JSON.stringify(lastChange.value)}`
          : 'Click a value to edit it. Enter commits, Escape cancels.'}
      </Text>
    </Stack>
  );
}

export const editable: MantineDemo = {
  type: 'code',
  component: Demo,
  code,
  defaultExpanded: false,
};
