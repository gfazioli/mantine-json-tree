import { JsonTree, type JsonTreeChange } from '@gfazioli/mantine-json-tree';
import { Paper, Stack, Text } from '@mantine/core';
import { MantineDemo } from '@mantinex/demo';
import { useState } from 'react';

function Demo() {
  const [data, setData] = useState<unknown>({
    name: 'release-checklist',
    owner: 'Jamie Chen',
    steps: ['bump version', 'build', 'publish', 'announce'],
    settings: { dryRun: false, retries: 3 },
  });
  const [lastChange, setLastChange] = useState<JsonTreeChange | null>(null);

  return (
    <Stack>
      <Paper withBorder>
        <JsonTree
          data={data}
          title="checklist.json"
          defaultExpanded
          maxDepth={-1}
          editable
          structuralEdits
          onChange={(next, change) => {
            setData(next);
            setLastChange(change);
          }}
          validateKey={(key) => (key.trim() === '' ? 'A key cannot be empty' : null)}
        />
      </Paper>

      <Text size="sm" c="dimmed">
        {lastChange
          ? `${lastChange.action} · ${lastChange.previousPath ? `${lastChange.previousPath} → ` : ''}${lastChange.path}`
          : 'Hover a row: + adds, the arrows move an item, the bin removes. Click a key to rename it.'}
      </Text>
    </Stack>
  );
}

const code = `
import { useState } from 'react';
import { JsonTree, type JsonTreeChange } from '@gfazioli/mantine-json-tree';
import { Paper, Stack, Text } from '@mantine/core';

function Demo() {
  const [data, setData] = useState<unknown>({
    name: 'release-checklist',
    owner: 'Jamie Chen',
    steps: ['bump version', 'build', 'publish', 'announce'],
    settings: { dryRun: false, retries: 3 },
  });
  const [lastChange, setLastChange] = useState<JsonTreeChange | null>(null);

  return (
    <Stack>
      <Paper withBorder>
        <JsonTree
          data={data}
          title="checklist.json"
          defaultExpanded
          maxDepth={-1}
          editable
          structuralEdits
          onChange={(next, change) => {
            setData(next);
            setLastChange(change);
          }}
          validateKey={(key) => (key.trim() === '' ? 'A key cannot be empty' : null)}
        />
      </Paper>

      <Text size="sm" c="dimmed">
        {lastChange
          ? \`\${lastChange.action} · \${lastChange.previousPath ? \`\${lastChange.previousPath} → \` : ''}\${lastChange.path}\`
          : 'Hover a row: + adds, the arrows move an item, the bin removes. Click a key to rename it.'}
      </Text>
    </Stack>
  );
}
`;

export const structural: MantineDemo = {
  type: 'code',
  component: Demo,
  code,
  defaultExpanded: false,
};
