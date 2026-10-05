import {
  JsonTree,
  type JsonTreeHighlight,
  type JsonTreeHighlightPayload,
} from '@gfazioli/mantine-json-tree';
import { MantineDemo } from '@mantinex/demo';

const before = {
  name: 'Alice',
  age: 30,
  role: 'editor',
  tags: ['admin'],
  address: { city: 'Rome', zip: '00100' },
};

const after = {
  name: 'Alice',
  age: 31,
  tags: ['admin', 'billing'],
  address: { city: 'Milan', zip: '00100' },
  email: 'alice@example.com',
};

/** Read a value by its path segments, telling "missing" apart from "undefined" */
function getAt(value: unknown, segments: readonly (string | number)[]) {
  let current: any = value;
  for (const segment of segments) {
    if (current === null || typeof current !== 'object' || !(segment in current)) {
      return { found: false, value: undefined };
    }
    current = current[segment];
  }
  return { found: true, value: current };
}

function highlightNode({ pathSegments }: JsonTreeHighlightPayload): JsonTreeHighlight | null {
  if (!pathSegments || pathSegments.length === 0) {
    return null;
  }
  const previous = getAt(before, pathSegments);
  const next = getAt(after, pathSegments);
  if (!previous.found) {
    return 'added';
  }
  if (!next.found) {
    return 'removed';
  }
  return JSON.stringify(previous.value) === JSON.stringify(next.value) ? null : 'changed';
}

function Demo() {
  // Show the removed keys too: everything from "before", overwritten by "after"
  const merged = { ...before, ...after };

  return (
    <JsonTree
      data={merged}
      title="user.json"
      defaultExpanded
      maxDepth={-1}
      withBorder
      highlightNode={highlightNode}
    />
  );
}

const code = `
import {
  JsonTree,
  type JsonTreeHighlight,
  type JsonTreeHighlightPayload,
} from '@gfazioli/mantine-json-tree';

const before = {
  name: 'Alice',
  age: 30,
  role: 'editor',
  tags: ['admin'],
  address: { city: 'Rome', zip: '00100' },
};

const after = {
  name: 'Alice',
  age: 31,
  tags: ['admin', 'billing'],
  address: { city: 'Milan', zip: '00100' },
  email: 'alice@example.com',
};

/** Read a value by its path segments, telling "missing" apart from "undefined" */
function getAt(value: unknown, segments: readonly (string | number)[]) {
  let current: any = value;
  for (const segment of segments) {
    if (current === null || typeof current !== 'object' || !(segment in current)) {
      return { found: false, value: undefined };
    }
    current = current[segment];
  }
  return { found: true, value: current };
}

function highlightNode({ pathSegments }: JsonTreeHighlightPayload): JsonTreeHighlight | null {
  if (!pathSegments || pathSegments.length === 0) {
    return null;
  }
  const previous = getAt(before, pathSegments);
  const next = getAt(after, pathSegments);
  if (!previous.found) {
    return 'added';
  }
  if (!next.found) {
    return 'removed';
  }
  return JSON.stringify(previous.value) === JSON.stringify(next.value) ? null : 'changed';
}

function Demo() {
  // Show the removed keys too: everything from "before", overwritten by "after"
  const merged = { ...before, ...after };

  return (
    <JsonTree
      data={merged}
      title="user.json"
      defaultExpanded
      maxDepth={-1}
      withBorder
      highlightNode={highlightNode}
    />
  );
}
`;

export const diff: MantineDemo = {
  type: 'code',
  component: Demo,
  code,
  defaultExpanded: false,
};
