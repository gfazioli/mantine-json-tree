import { JsonTree } from '@gfazioli/mantine-json-tree';
import { Paper } from '@mantine/core';
import { MantineDemo } from '@mantinex/demo';

const code = `
import { JsonTree } from "@gfazioli/mantine-json-tree";
import { Paper, Stack } from '@mantine/core';

function Demo() {
  const specialTypes = {
    // Date objects - displayed in ISO format
    createdAt: new Date('2024-01-15T10:30:00Z'),
    lastModified: new Date('2024-06-20T14:45:30Z'),

    // Special numeric values
    notANumber: NaN,
    positiveInfinity: Infinity,
    negativeInfinity: -Infinity,

    // BigInt for large integers
    bigInteger: BigInt('9007199254740991'),
    userId: BigInt(123456789),

    // Symbols for unique identifiers
    globalSymbol: Symbol.for('app.config'),
    registryKey: Symbol.for('app.registry'),

    // Regular expressions
    emailPattern: /^[\\w-.]+@([\\w-]+\\.)+[\\w-]{2,4}$/g,
    phonePattern: new RegExp('\\\\d{3}-\\\\d{3}-\\\\d{4}'),

    // Map collections (key-value pairs)
    userMap: new Map([
      ['user1', { name: 'Alice', role: 'admin' }],
      ['user2', { name: 'Bob', role: 'user' }],
      [123, 'numeric key example'],
    ]),

    // Set collections (unique values)
    tags: new Set(['javascript', 'typescript', 'react']),
    uniqueNumbers: new Set([1, 2, 3, 4, 5]),

    // Nested combinations
    metadata: {
      timestamp: new Date('2024-12-25T00:00:00Z'),
      categories: new Set(['frontend', 'backend']),
      config: new Map([
        ['version', '1.0.0'],
        ['environment', 'production'],
      ]),
    },
  };

  return (
    <Paper withBorder>
      <JsonTree
        data={specialTypes}
        title="special-types.json"
        defaultExpanded
        withExpandAll
        showItemsCount
      />
    </Paper>
  );
}
`;

function Demo() {
  const specialTypes = {
    // Date objects - displayed in ISO format
    createdAt: new Date('2024-01-15T10:30:00Z'),
    lastModified: new Date('2024-06-20T14:45:30Z'),

    // Special numeric values
    notANumber: NaN,
    positiveInfinity: Infinity,
    negativeInfinity: -Infinity,

    // BigInt for large integers
    bigInteger: BigInt('9007199254740991'),
    userId: BigInt(123456789),

    // Symbols for unique identifiers
    globalSymbol: Symbol.for('app.config'),
    registryKey: Symbol.for('app.registry'),

    // Regular expressions
    emailPattern: /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/g,
    phonePattern: new RegExp('\\d{3}-\\d{3}-\\d{4}'),

    // Map collections (key-value pairs)
    userMap: new Map<string | number, any>([
      ['user1', { name: 'Alice', role: 'admin' }],
      ['user2', { name: 'Bob', role: 'user' }],
      [123, 'numeric key example'],
    ]),

    // Set collections (unique values)
    tags: new Set(['javascript', 'typescript', 'react']),
    uniqueNumbers: new Set([1, 2, 3, 4, 5]),

    // Nested combinations
    metadata: {
      timestamp: new Date('2024-12-25T00:00:00Z'),
      categories: new Set(['frontend', 'backend']),
      config: new Map([
        ['version', '1.0.0'],
        ['environment', 'production'],
      ]),
    },
  };

  return (
    <Paper withBorder>
      <JsonTree
        data={specialTypes}
        title="special-types.json"
        defaultExpanded
        withExpandAll
        showItemsCount
      />
    </Paper>
  );
}

export const specialTypes: MantineDemo = {
  type: 'code',
  component: Demo,
  code,
  defaultExpanded: false,
};
