import { useState } from 'react';
import { JsonTree } from '@gfazioli/mantine-json-tree';
import { Code, Stack, Text } from '@mantine/core';
import { MantineDemo } from '@mantinex/demo';
import { data, dataCode } from './data';

const code = `
import { useState } from 'react';
import { JsonTree } from "@gfazioli/mantine-json-tree";
import { Code, Stack, Text } from "@mantine/core";
import { data } from './data';

function Demo() {
  const [clicked, setClicked] = useState<{ path: string; value: unknown } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  return (
    <Stack>
      <JsonTree
        data={data}
        defaultExpanded
        maxDepth={1}
        withCopyToClipboard
        title="Click a node or copy a value"
        onNodeClick={(path, value) => setClicked({ path, value })}
        onCopy={(copy) => setCopied(copy)}
      />

      {clicked && (
        <Text size="sm">
          Clicked: <Code>{clicked.path}</Code>
        </Text>
      )}

      {copied && (
        <Text size="sm">
          Copied: <Code>{copied.length > 50 ? \`\${copied.slice(0, 50)}…\` : copied}</Code>
        </Text>
      )}
    </Stack>
  );
}
`;

function Demo() {
  const [clicked, setClicked] = useState<{ path: string; value: unknown } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  return (
    <Stack>
      <JsonTree
        data={data}
        defaultExpanded
        maxDepth={1}
        withCopyToClipboard
        title="Click a node or copy a value"
        onNodeClick={(path, value) => setClicked({ path, value })}
        onCopy={(copy) => setCopied(copy)}
      />

      {clicked && (
        <Text size="sm">
          Clicked: <Code>{clicked.path}</Code>
        </Text>
      )}

      {copied && (
        <Text size="sm">
          Copied: <Code>{copied.length > 50 ? `${copied.slice(0, 50)}…` : copied}</Code>
        </Text>
      )}
    </Stack>
  );
}

export const callbacks: MantineDemo = {
  type: 'code',
  component: Demo,
  code: [
    { fileName: 'Demo.tsx', code, language: 'tsx' },
    { fileName: 'data.ts', code: dataCode, language: 'tsx' },
  ],
  defaultExpanded: false,
};
