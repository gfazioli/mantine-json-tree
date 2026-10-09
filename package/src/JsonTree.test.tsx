import { render } from '@mantine-tests/core';
import { Loader } from '@mantine/core';
import { fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { JsonTree, type JsonTreeNodePayload } from './JsonTree';
import { setValueAtPath } from './lib/path';
import {
  convertToTreeData,
  filterTreeBySearch,
  getArrayGroupSize,
  appendDraftRow,
  applyRemap,
  getDefaultNewValue,
  getTypeLabel,
  limitTreeEntries,
  remapContainerEntries,
  searchTree,
  stringifyValue,
} from './lib/utils';

/** Set by any test that stubs the clipboard; run in a global afterEach. */
let restoreClipboardAfter: (() => void) | null = null;

/**
 * Replace navigator.clipboard for one test and hand back a restore function.
 * Overwriting it without restoring leaks the spy into later tests.
 */
function stubClipboard() {
  const original = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
  const writeText = jest.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
    writable: true,
  });
  const restore = () => {
    if (original) {
      Object.defineProperty(navigator, 'clipboard', original);
    } else {
      delete (navigator as { clipboard?: unknown }).clipboard;
    }
  };
  return { writeText, restore };
}

describe('JsonTree', () => {
  afterEach(() => {
    restoreClipboardAfter?.();
    restoreClipboardAfter = null;
  });

  it('renders without crashing', () => {
    const { container } = render(<JsonTree data={[]} />);
    expect(container).toBeTruthy();
  });

  it('forwards ref', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<JsonTree data={[]} ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  describe('displayFunctions prop', () => {
    const dataWithFunctions = {
      name: 'Test',
      onClick: function handleClick() {
        // eslint-disable-next-line no-console
        console.log('clicked');
      },
      calculate: (a: number, b: number) => a + b,
    };

    it('displays functions as strings by default', () => {
      const { container } = render(<JsonTree data={dataWithFunctions} defaultExpanded />);
      expect(container.textContent).toContain('[Function: handleClick]');
      expect(container.textContent).toContain('[Function: calculate]');
    });

    it('displays functions as strings when displayFunctions is "as-string"', () => {
      const { container } = render(
        <JsonTree data={dataWithFunctions} defaultExpanded displayFunctions="as-string" />
      );
      expect(container.textContent).toContain('[Function: handleClick]');
      expect(container.textContent).toContain('[Function: calculate]');
    });

    it('hides functions when displayFunctions is "hide"', () => {
      const { container } = render(
        <JsonTree data={dataWithFunctions} defaultExpanded displayFunctions="hide" />
      );
      expect(container.textContent).not.toContain('onClick');
      expect(container.textContent).not.toContain('calculate');
      expect(container.textContent).not.toContain('[Function');
      expect(container.textContent).toContain('name');
      expect(container.textContent).toContain('Test');
    });

    it('displays functions as objects when displayFunctions is "as-object"', () => {
      const { container } = render(
        <JsonTree data={dataWithFunctions} defaultExpanded displayFunctions="as-object" />
      );
      expect(container.textContent).toContain('onClick');
      expect(container.textContent).toContain('calculate');
      // Functions displayed as objects should show their properties (length, name, etc.)
    });
  });

  describe('React components', () => {
    it('handles React elements without crashing', () => {
      const dataWithReactComponent = {
        name: 'Test',
        loader: <Loader size="xs" />,
        button: <button type="button">Click me</button>,
      };

      const { container } = render(<JsonTree data={dataWithReactComponent} defaultExpanded />);
      expect(container).toBeTruthy();
      expect(container.textContent).toContain('name');
      expect(container.textContent).toContain('loader');
      expect(container.textContent).toContain('button');
    });

    it('displays React elements with component name', () => {
      const dataWithReactComponent = {
        loader: <Loader size="xs" />,
      };

      const { container } = render(<JsonTree data={dataWithReactComponent} defaultExpanded />);
      // Should show the component in a recognizable format
      expect(container.textContent).toContain('loader');
    });
  });

  describe('Special value types', () => {
    it('handles Date objects', () => {
      const dataWithDate = {
        createdAt: new Date('2024-01-15T10:30:00Z'),
      };

      const { container } = render(<JsonTree data={dataWithDate} defaultExpanded />);
      expect(container.textContent).toContain('createdAt');
      expect(container.textContent).toContain('2024-01-15');
    });

    it('handles NaN and Infinity', () => {
      const dataWithSpecialNumbers = {
        notANumber: NaN,
        positiveInfinity: Infinity,
        negativeInfinity: -Infinity,
      };

      const { container } = render(<JsonTree data={dataWithSpecialNumbers} defaultExpanded />);
      expect(container.textContent).toContain('NaN');
      expect(container.textContent).toContain('Infinity');
    });

    it('handles BigInt', () => {
      const dataWithBigInt = {
        bigNumber: BigInt('9007199254740991'),
      };

      const { container } = render(<JsonTree data={dataWithBigInt} defaultExpanded />);
      expect(container.textContent).toContain('bigNumber');
      expect(container.textContent).toContain('n');
    });

    it('handles Symbol', () => {
      const dataWithSymbol = {
        key: Symbol('test'),
      };

      const { container } = render(<JsonTree data={dataWithSymbol} defaultExpanded />);
      expect(container.textContent).toContain('key');
      expect(container.textContent).toContain('Symbol');
    });

    it('handles RegExp', () => {
      const dataWithRegExp = {
        pattern: /test/gi,
      };

      const { container } = render(<JsonTree data={dataWithRegExp} defaultExpanded />);
      expect(container.textContent).toContain('pattern');
      expect(container.textContent).toContain('/test/gi');
    });

    it('handles Map as expandable', () => {
      const dataWithMap = {
        userMap: new Map([
          ['user1', 'Alice'],
          ['user2', 'Bob'],
        ]),
      };

      const { container } = render(<JsonTree data={dataWithMap} defaultExpanded />);
      expect(container.textContent).toContain('userMap');
      // Map should be expandable and show its entries
      expect(container.textContent).toContain('Alice');
      expect(container.textContent).toContain('Bob');
    });

    it('handles Set as expandable', () => {
      const dataWithSet = {
        tags: new Set(['javascript', 'typescript', 'react']),
      };

      const { container } = render(<JsonTree data={dataWithSet} defaultExpanded />);
      expect(container.textContent).toContain('tags');
      // Set should be expandable and show its values
      expect(container.textContent).toContain('javascript');
      expect(container.textContent).toContain('typescript');
      expect(container.textContent).toContain('react');
    });
  });

  describe('interactive props', () => {
    it('renders title when provided', () => {
      const { container } = render(<JsonTree data={{ a: 1 }} title="My JSON" />);
      expect(container.textContent).toContain('My JSON');
    });

    it('renders item count badges when showItemsCount is true', () => {
      const { container } = render(<JsonTree data={{ a: 1, b: 2, c: 3 }} showItemsCount />);
      expect(container.textContent).toContain('3');
    });

    it('renders copy buttons when withCopyToClipboard is true', () => {
      const { container } = render(
        <JsonTree data={{ a: 1 }} defaultExpanded withCopyToClipboard />
      );
      const copyButtons = container.querySelectorAll('button[class*="copyButton"]');
      expect(copyButtons.length).toBeGreaterThan(0);
    });

    it('renders indent guides when showIndentGuides is true', () => {
      const nestedData = { level1: { level2: { level3: 'deep' } } };
      const { container } = render(<JsonTree data={nestedData} defaultExpanded showIndentGuides />);
      const guides = container.querySelectorAll('[data-color-index]');
      expect(guides.length).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('renders empty object', () => {
      const { container } = render(<JsonTree data={{}} />);
      expect(container).toBeTruthy();
      expect(container.textContent).toContain('{');
      expect(container.textContent).toContain('}');
    });

    it('renders empty array', () => {
      const { container } = render(<JsonTree data={[]} />);
      expect(container).toBeTruthy();
    });

    it('renders primitive string as root data', () => {
      const { container } = render(<JsonTree data="hello" />);
      expect(container.textContent).toContain('hello');
    });

    it('renders primitive number as root data', () => {
      const { container } = render(<JsonTree data={42} />);
      expect(container.textContent).toContain('42');
    });

    it('expands all nodes when defaultExpanded and maxDepth is -1', () => {
      const deepData = { a: { b: { c: { d: 'deep' } } } };
      const { container } = render(<JsonTree data={deepData} defaultExpanded maxDepth={-1} />);
      expect(container.textContent).toContain('deep');
    });

    it('keeps nodes collapsed when defaultExpanded is false', () => {
      const nestedData = { a: { b: 'collapsed-value' } };
      const { container } = render(<JsonTree data={nestedData} defaultExpanded={false} />);
      expect(container.textContent).not.toContain('collapsed-value');
    });
  });

  describe('responsive size', () => {
    it('accepts a responsive object for size without crashing', () => {
      const { container } = render(<JsonTree data={{ a: 1 }} size={{ base: 'xs', md: 'lg' }} />);
      expect(container).toBeTruthy();
    });

    it('accepts a string size value', () => {
      const { container } = render(<JsonTree data={{ a: 1 }} size="sm" />);
      expect(container).toBeTruthy();
    });
  });

  describe('new features', () => {
    it('renders line numbers when showLineNumbers is true', () => {
      const { container } = render(
        <JsonTree data={{ a: 1, b: 2 }} defaultExpanded showLineNumbers />
      );
      expect(container.querySelector('[data-line-numbers]')).toBeTruthy();
    });

    it('renders with showPathOnHover without crashing', () => {
      const { container } = render(<JsonTree data={{ a: 1 }} defaultExpanded showPathOnHover />);
      expect(container).toBeTruthy();
    });

    it('renders with maxHeight as scrollable container', () => {
      const { container } = render(
        <JsonTree data={{ a: 1, b: 2, c: 3 }} defaultExpanded maxHeight={200} />
      );
      expect(container).toBeTruthy();
    });

    it('accepts controlled expanded state', () => {
      const { container } = render(<JsonTree data={{ a: { b: 'value' } }} expanded={['root']} />);
      expect(container).toBeTruthy();
    });

    it('renders with onExpand and onCollapse callbacks without crashing', () => {
      const onExpand = jest.fn();
      const onCollapse = jest.fn();
      const { container } = render(
        <JsonTree
          data={{ a: { b: 'value' } }}
          defaultExpanded
          onExpand={onExpand}
          onCollapse={onCollapse}
        />
      );
      expect(container).toBeTruthy();
    });

    it('calls onExpandedChange when a node is toggled in controlled mode', () => {
      const onExpandedChange = jest.fn();
      const { container } = render(
        <JsonTree
          data={{ a: { b: 'value' } }}
          expanded={['root']}
          onExpandedChange={onExpandedChange}
        />
      );
      const expandButton = container.querySelector('button[class*="expandCollapse"]');
      expect(expandButton).toBeTruthy();
      fireEvent.click(expandButton!);
      expect(onExpandedChange).toHaveBeenCalled();
    });

    it('calls onExpand callback when expanding a node', () => {
      const onExpand = jest.fn();
      const { container } = render(<JsonTree data={{ a: { b: 'value' } }} onExpand={onExpand} />);
      const expandButton = container.querySelector('button[class*="expandCollapse"]');
      expect(expandButton).toBeTruthy();
      fireEvent.click(expandButton!);
      expect(onExpand).toHaveBeenCalledWith('root');
    });

    it('calls onCollapse callback when collapsing a node', () => {
      const onCollapse = jest.fn();
      const { container } = render(
        <JsonTree data={{ a: { b: 'value' } }} defaultExpanded onCollapse={onCollapse} />
      );
      const expandButton = container.querySelector('button[class*="expandCollapse"]');
      expect(expandButton).toBeTruthy();
      fireEvent.click(expandButton!);
      expect(onCollapse).toHaveBeenCalledWith('root');
    });
  });

  describe('toolbar upgrade', () => {
    it('renders Paper wrapper when withBorder is true', () => {
      const { container } = render(<JsonTree data={{ a: 1 }} withBorder />);
      const paper = container.querySelector('.mantine-Paper-root');
      expect(paper).toBeTruthy();
    });

    it('does not render Paper wrapper when withBorder is false', () => {
      const { container } = render(<JsonTree data={{ a: 1 }} />);
      const paper = container.querySelector('.mantine-Paper-root');
      expect(paper).toBeNull();
    });

    it('renders key count badge when withKeyCountBadge is true', () => {
      const { container } = render(
        <JsonTree data={{ a: 1, b: 2, c: 3 }} title="Test" withKeyCountBadge />
      );
      const badge = container.querySelector('.mantine-Badge-root');
      expect(badge).toBeTruthy();
      expect(badge?.textContent).toContain('3');
    });

    it('shows items for arrays in key count badge', () => {
      const { container } = render(
        <JsonTree data={[1, 2, 3, 4, 5]} title="Test" withKeyCountBadge />
      );
      const badge = container.querySelector('.mantine-Badge-root');
      expect(badge?.textContent).toContain('5');
      expect(badge?.textContent).toContain('items');
    });

    it('uses custom keyCountBadgeLabel', () => {
      const { container } = render(
        <JsonTree
          data={{ a: 1, b: 2 }}
          title="Test"
          withKeyCountBadge
          keyCountBadgeLabel={(count) => `${count} properties`}
        />
      );
      const badge = container.querySelector('.mantine-Badge-root');
      expect(badge?.textContent).toContain('2 properties');
    });

    it('does not show badge for primitives', () => {
      const { container } = render(<JsonTree data="hello" title="Test" withKeyCountBadge />);
      const badge = container.querySelector('.mantine-Badge-root');
      expect(badge).toBeNull();
    });

    it('renders copy all button when withCopyAll is true', () => {
      const { container } = render(<JsonTree data={{ a: 1 }} title="Test" withCopyAll />);
      const buttons = container.querySelectorAll('.mantine-ActionIcon-root');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('renders search toggle when withSearch is true', () => {
      const { container } = render(<JsonTree data={{ a: 1 }} title="Test" withSearch />);
      const buttons = container.querySelectorAll('.mantine-ActionIcon-root');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('shows header when any toolbar prop is set', () => {
      const { container } = render(<JsonTree data={{ a: 1 }} withCopyAll />);
      const header = container.querySelector('[class*="header"]');
      expect(header).toBeTruthy();
    });

    it('opens search bar when search toggle is clicked', () => {
      const { container } = render(
        <JsonTree data={{ a: 1, b: 'hello' }} title="Test" withSearch />
      );
      const searchToggle = container.querySelector('.mantine-ActionIcon-root');
      expect(searchToggle).toBeTruthy();
      fireEvent.click(searchToggle!);
      const input = container.querySelector('input[placeholder]');
      expect(input).toBeTruthy();
    });

    it('forwards searchInputProps to the internal TextInput', () => {
      const { container } = render(
        <JsonTree
          data={{ a: 1 }}
          title="Test"
          withSearch
          searchInputProps={{
            placeholder: 'Custom placeholder',
            radius: 'xl',
          }}
        />
      );
      fireEvent.click(container.querySelector('.mantine-ActionIcon-root')!);
      const input = container.querySelector('input[placeholder="Custom placeholder"]');
      expect(input).toBeTruthy();
    });

    it('searchInputProps cannot override controlled value/onChange at runtime', () => {
      const onChange = jest.fn();
      const { container } = render(
        <JsonTree
          data={{ a: 1 }}
          title="Test"
          withSearch
          searchInputProps={{ value: 'should-be-ignored', onChange } as any}
        />
      );
      fireEvent.click(container.querySelector('.mantine-ActionIcon-root')!);
      const input = container.querySelector('input[placeholder]') as HTMLInputElement;
      expect(input.value).toBe('');
      fireEvent.change(input, { target: { value: 'test' } });
      expect(onChange).not.toHaveBeenCalled();
    });

    it('renders with all toolbar features without crashing', () => {
      const { container } = render(
        <JsonTree
          data={{ a: 1, b: { c: 'test' } }}
          title="Full Toolbar"
          withBorder
          withKeyCountBadge
          withExpandAll
          withCopyAll
          withSearch
          defaultExpanded
        />
      );
      expect(container).toBeTruthy();
      const paper = container.querySelector('.mantine-Paper-root');
      expect(paper).toBeTruthy();
      const badge = container.querySelector('.mantine-Badge-root');
      expect(badge).toBeTruthy();
    });

    it('uses rootName as the root node label', () => {
      const { container } = render(<JsonTree data={{ a: 1 }} rootName="myData" defaultExpanded />);
      expect(container.textContent).toContain('myData');
    });

    it('defaults rootName to root', () => {
      const { container } = render(<JsonTree data={{ a: 1 }} defaultExpanded />);
      expect(container.textContent).toContain('root');
    });
  });

  describe('search utilities', () => {
    it('searchTree finds matches by key name', () => {
      const treeData = [convertToTreeData({ name: 'Alice', age: 30 }, 'root', 'root', 0)];
      const result = searchTree(treeData, 'name');
      expect(result.directMatches.size).toBeGreaterThan(0);
      expect(result.matchedPaths.size).toBeGreaterThan(0);
    });

    it('searchTree finds matches by value', () => {
      const treeData = [convertToTreeData({ name: 'Alice', age: 30 }, 'root', 'root', 0)];
      const result = searchTree(treeData, 'Alice');
      expect(result.directMatches.size).toBeGreaterThan(0);
    });

    it('searchTree returns empty for empty query', () => {
      const treeData = [convertToTreeData({ a: 1 }, 'root', 'root', 0)];
      const result = searchTree(treeData, '');
      expect(result.directMatches.size).toBe(0);
      expect(result.matchedPaths.size).toBe(0);
    });

    it('filterTreeBySearch keeps only matching branches', () => {
      const data = { a: { b: 'hello' }, c: { d: 'world' } };
      const treeData = [convertToTreeData(data, 'root', 'root', 0)];
      const { matchedPaths } = searchTree(treeData, 'hello');
      const filtered = filterTreeBySearch(treeData, matchedPaths);
      expect(filtered.length).toBe(1);
      // root should still be there with only the 'a' branch
      const rootChildren = filtered[0].children;
      expect(rootChildren).toBeTruthy();
      // 'c' branch should be filtered out
      const hasC = rootChildren?.some((c: any) => c.nodeData?.key === 'c');
      expect(hasC).toBeFalsy();
    });

    it('searchTree is case insensitive', () => {
      const treeData = [convertToTreeData({ Name: 'ALICE' }, 'root', 'root', 0)];
      const result = searchTree(treeData, 'alice');
      expect(result.directMatches.size).toBeGreaterThan(0);
    });
  });
  describe('keyboard copy targeting', () => {
    const mockClipboard = () => {
      const { writeText, restore } = stubClipboard();
      restoreClipboardAfter = restore;
      return writeText;
    };

    it('copies the focused node, not the root', async () => {
      const writeText = mockClipboard();
      const { container } = render(
        <JsonTree
          data={{ alpha: { nested: 'AAA' }, beta: 'BBB' }}
          defaultExpanded
          maxDepth={-1}
          withCopyToClipboard
        />
      );

      const row = container.querySelector<HTMLElement>(
        'li[role="treeitem"][data-value="root.beta"]'
      )!;
      row.focus();
      fireEvent.keyDown(row, { key: 'c', metaKey: true });

      await waitFor(() => expect(writeText).toHaveBeenCalled());
      expect(writeText.mock.calls[0][0]).toBe('"BBB"');
    });

    it('falls back to the root node when nothing inside the tree has focus', async () => {
      const writeText = mockClipboard();
      const { container } = render(
        <JsonTree data={{ beta: 'BBB' }} defaultExpanded maxDepth={-1} withCopyToClipboard />
      );

      const root = container.querySelector<HTMLElement>('li[role="treeitem"][data-value="root"]')!;
      fireEvent.keyDown(root, { key: 'c', metaKey: true });

      await waitFor(() => expect(writeText).toHaveBeenCalled());
      expect(JSON.parse(writeText.mock.calls[0][0])).toEqual({ beta: 'BBB' });
    });

    it('does not hijack copy from a form control inside the component', async () => {
      const writeText = mockClipboard();
      const { container } = render(
        <JsonTree data={{ a: 1 }} title="Test" withSearch withCopyToClipboard />
      );
      fireEvent.click(container.querySelector('.mantine-ActionIcon-root')!);

      const input = container.querySelector<HTMLElement>('input[placeholder]')!;
      fireEvent.keyDown(input, { key: 'c', metaKey: true });

      await Promise.resolve();
      expect(writeText).not.toHaveBeenCalled();
    });
  });

  describe('React element detection', () => {
    it('treats a plain object carrying type and props as data, not an element', () => {
      const { container } = render(
        <JsonTree
          data={{ field: { type: 'text', props: { label: 'Name' } } }}
          defaultExpanded
          maxDepth={-1}
        />
      );

      // The subtree must be reachable, not collapsed into `<Component />`
      expect(container.querySelector('[data-value="root.field.type"]')).toBeTruthy();
      expect(container.querySelector('[data-value="root.field.props.label"]')).toBeTruthy();
      expect(container.querySelector('[data-type="react-element"]')).toBeFalsy();
    });

    it('still detects real React elements', () => {
      const { container } = render(
        <JsonTree data={{ el: <Loader /> }} defaultExpanded maxDepth={-1} />
      );
      expect(container.querySelector('[data-type="react-element"]')).toBeTruthy();
    });
  });

  describe('circular references', () => {
    it('renders a marker instead of overflowing the stack', () => {
      const data: any = { name: 'node' };
      data.self = data;

      const { container } = render(<JsonTree data={data} defaultExpanded maxDepth={-1} />);

      const marker = container.querySelector('[data-type="circular"]');
      expect(marker).toBeTruthy();
      expect(marker?.textContent).toBe('[Circular]');
    });

    it('detects a cycle nested deeper than the root', () => {
      const parent: any = { id: 1, child: { id: 2 } };
      parent.child.parent = parent;

      const { container } = render(<JsonTree data={parent} defaultExpanded maxDepth={-1} />);
      expect(container.querySelector('[data-value="root.child.parent"]')).toBeTruthy();
      expect(container.querySelector('[data-type="circular"]')).toBeTruthy();
    });

    it('expands a shared reference in every branch that holds it', () => {
      const shared = { flag: true };
      const { container } = render(
        <JsonTree data={{ left: shared, right: shared }} defaultExpanded maxDepth={-1} />
      );

      // Shared but acyclic: both branches must expand, neither is a cycle
      expect(container.querySelector('[data-value="root.left.flag"]')).toBeTruthy();
      expect(container.querySelector('[data-value="root.right.flag"]')).toBeTruthy();
      expect(container.querySelector('[data-type="circular"]')).toBeFalsy();
    });

    it('survives a cycle through an array', () => {
      const arr: any[] = [1];
      arr.push(arr);
      const { container } = render(<JsonTree data={{ arr }} defaultExpanded maxDepth={-1} />);
      expect(container.querySelector('[data-type="circular"]')).toBeTruthy();
    });
  });
  describe('clipboard serialization', () => {
    it('keeps JSON-representable values exactly as JSON.stringify would', () => {
      expect(stringifyValue({ a: 1 })).toBe(JSON.stringify({ a: 1 }, null, 2));
      expect(stringifyValue([1, 'two'])).toBe(JSON.stringify([1, 'two'], null, 2));
      expect(stringifyValue('he said "hi"')).toBe('"he said \\"hi\\""');
      expect(stringifyValue(null)).toBe('null');
      expect(stringifyValue(42)).toBe('42');
    });

    it('falls back to the rendered form for values JSON drops', () => {
      // JSON.stringify returns undefined for these, which used to put the
      // literal text "undefined" on the clipboard for every one of them
      expect(stringifyValue(function handleClick() {})).toBe('[Function: handleClick]');
      expect(stringifyValue(Symbol.for('app.config'))).toBe('Symbol(app.config)');
      expect(stringifyValue(undefined)).toBe('undefined');
    });

    it('serializes BigInt instead of throwing', () => {
      // JSON.stringify throws a TypeError on BigInt, which the copy handlers
      // swallowed as a silent no-op
      expect(stringifyValue(BigInt(123))).toBe('123n');
      expect(stringifyValue({ id: BigInt(9007199254740991) })).toContain('"9007199254740991n"');
    });

    it('marks cycles instead of throwing', () => {
      const node: any = { name: 'node' };
      node.self = node;
      const out = stringifyValue(node);
      expect(out).toContain('"name": "node"');
      expect(out).toContain('"self": "[Circular]"');
    });

    it('marks a cycle nested below the root', () => {
      const parent: any = { id: 1, child: { id: 2 } };
      parent.child.parent = parent;
      const out = JSON.parse(stringifyValue(parent));
      expect(out).toEqual({ id: 1, child: { id: 2, parent: '[Circular]' } });
    });

    it('serializes a shared reference in full on both sides', () => {
      const shared = { flag: true };
      const out = JSON.parse(stringifyValue({ left: shared, right: shared }));
      // shared but acyclic: neither side may collapse to a marker
      expect(out).toEqual({ left: { flag: true }, right: { flag: true } });
    });

    it('survives a cycle through an array', () => {
      const arr: unknown[] = [1];
      arr.push(arr);
      expect(JSON.parse(stringifyValue(arr))).toEqual([1, '[Circular]']);
    });

    it('copies a node holding a cycle instead of doing nothing', async () => {
      const { writeText, restore } = stubClipboard();
      restoreClipboardAfter = restore;

      const data: any = { id: 'root' };
      data.self = data;

      const { container } = render(
        <JsonTree data={data} defaultExpanded maxDepth={-1} withCopyToClipboard />
      );
      const row = container.querySelector<HTMLElement>('li[role="treeitem"][data-value="root"]')!;
      row.focus();
      fireEvent.keyDown(row, { key: 'c', metaKey: true });

      await waitFor(() => expect(writeText).toHaveBeenCalled());
      expect(writeText.mock.calls[0][0]).toContain('"self": "[Circular]"');
    });
  });
  describe('addressable paths', () => {
    const findByPath = (node: any, path: string): any => {
      if (node.nodeData?.path === path) {
        return node;
      }
      for (const child of node.children ?? []) {
        const hit = findByPath(child, path);
        if (hit) {
          return hit;
        }
      }
      return null;
    };
    const collect = (node: any, out: any[] = []): any[] => {
      out.push(node);
      (node.children ?? []).forEach((c: any) => collect(c, out));
      return out;
    };

    it('addresses object keys and array indices, indices as numbers', () => {
      const tree = convertToTreeData({ address: { city: 'X' }, courses: ['a'] }, 'root', 'root');

      expect(tree.nodeData?.pathSegments).toEqual([]);
      expect(findByPath(tree, 'root.address.city').nodeData?.pathSegments).toEqual([
        'address',
        'city',
      ]);
      // a numeric segment marks an array index, a string marks an object key
      expect(findByPath(tree, 'root.courses.0').nodeData?.pathSegments).toEqual(['courses', 0]);
    });

    it('separates a dotted key from a nested object that share a path string', () => {
      const tree = convertToTreeData({ 'a.b': 1, a: { b: 2 } }, 'root', 'root');
      const colliding = collect(tree).filter((n: any) => n.nodeData?.path === 'root.a.b');

      // the display path cannot tell them apart — that is the whole point
      expect(colliding).toHaveLength(2);
      expect(colliding.map((n: any) => n.nodeData.pathSegments)).toEqual([['a.b'], ['a', 'b']]);
    });

    it('leaves Map and Set entries unaddressable', () => {
      const tree = convertToTreeData(
        { m: new Map<any, any>([[{ id: 1 }, 'v']]), s: new Set(['v']) },
        'root',
        'root'
      );
      const unaddressable = collect(tree).filter(
        (n: any) => n.nodeData?.pathSegments === undefined
      );

      // a Map key can be any value, a Set has no keys: neither can be written back
      expect(unaddressable.length).toBe(2);
      expect(findByPath(tree, 'root.m').nodeData?.pathSegments).toEqual(['m']);
    });

    it('leaves function properties unaddressable when expanded as an object', () => {
      const fn = function handleClick() {};
      (fn as any).meta = 'x';
      const tree = convertToTreeData({ fn }, 'root', 'root', 0, 'as-object');

      const meta = collect(tree).find((n: any) => n.nodeData?.key === 'meta');
      // the properties belong to a synthetic object that is not in the data
      expect(meta.nodeData?.pathSegments).toBeUndefined();
    });

    it('round-trips: a node address written back lands on that node', () => {
      const data = { 'a.b': 'dotted', a: { b: 'nested' }, list: ['x', 'y'] };
      const tree = convertToTreeData(data, 'root', 'root');
      const colliding = collect(tree).filter((n: any) => n.nodeData?.path === 'root.a.b');

      const afterDotted = setValueAtPath(data, colliding[0].nodeData.pathSegments, 'EDITED');
      expect(afterDotted).toEqual({ 'a.b': 'EDITED', a: { b: 'nested' }, list: ['x', 'y'] });

      const afterNested = setValueAtPath(data, colliding[1].nodeData.pathSegments, 'EDITED');
      expect(afterNested).toEqual({ 'a.b': 'dotted', a: { b: 'EDITED' }, list: ['x', 'y'] });

      const item = findByPath(tree, 'root.list.1');
      const afterItem: any = setValueAtPath(data, item.nodeData.pathSegments, 'EDITED');
      expect(afterItem.list).toEqual(['x', 'EDITED']);
      expect(Array.isArray(afterItem.list)).toBe(true);
    });
  });
  describe('editable values', () => {
    const cell = (container: HTMLElement, path: string) =>
      container.querySelector<HTMLElement>(
        `li[role="treeitem"][data-value="${path}"] [data-type]`
      )!;
    const input = (container: HTMLElement) => container.querySelector<HTMLInputElement>('input')!;

    const setup = (props: any = {}, data: any = { name: 'John', age: 30, isAdmin: false }) => {
      const onChange = jest.fn();
      const utils = render(
        <JsonTree data={data} defaultExpanded maxDepth={-1} onChange={onChange} {...props} />
      );
      return { ...utils, onChange };
    };

    it('is read-only until editable is set', () => {
      const { container, onChange } = setup();
      fireEvent.click(cell(container, 'root.name'));
      expect(container.querySelector('input')).toBeNull();
      expect(onChange).not.toHaveBeenCalled();
    });

    it('opens an editor when an editable value is clicked', () => {
      const { container } = setup({ editable: true });
      expect(cell(container, 'root.name').getAttribute('data-editable')).toBe('true');
      fireEvent.click(cell(container, 'root.name'));
      expect(input(container).value).toBe('John');
    });

    it('commits on Enter with the next data and a change payload', async () => {
      const user = userEvent.setup();
      const { container, onChange } = setup({ editable: true });

      await user.click(cell(container, 'root.name'));
      await user.clear(input(container));
      await user.type(input(container), 'Jane{Enter}');

      expect(onChange).toHaveBeenCalledTimes(1);
      const [nextData, change] = onChange.mock.calls[0];
      expect(nextData).toEqual({ name: 'Jane', age: 30, isAdmin: false });
      expect(change).toMatchObject({
        path: 'root.name',
        pathSegments: ['name'],
        key: 'name',
        type: 'string',
        previousValue: 'John',
        value: 'Jane',
      });
    });

    it('types spaces and moves the caret with arrows inside the editor', async () => {
      // Mantine's Tree preventDefaults Space and the arrow keys on the row above;
      // without the editor stopping propagation the field stays empty
      const user = userEvent.setup();
      const { container, onChange } = setup({ editable: true });

      await user.click(cell(container, 'root.name'));
      await user.clear(input(container));
      await user.type(input(container), 'a b c');
      expect(input(container).value).toBe('a b c');

      await user.keyboard('{ArrowLeft}{ArrowLeft}X');
      expect(input(container).value).toBe('a bX c');
      expect(document.activeElement).toBe(input(container));

      await user.keyboard('{Enter}');
      expect(onChange.mock.calls[0][0]).toEqual({ name: 'a bX c', age: 30, isAdmin: false });
    });

    it('cancels on Escape without reporting a change', async () => {
      const user = userEvent.setup();
      const { container, onChange } = setup({ editable: true });

      await user.click(cell(container, 'root.name'));
      await user.clear(input(container));
      await user.type(input(container), 'Jane{Escape}');

      expect(onChange).not.toHaveBeenCalled();
      expect(container.querySelector('input')).toBeNull();
    });

    it('commits on blur', async () => {
      const user = userEvent.setup();
      const { container, onChange } = setup({ editable: true });

      await user.click(cell(container, 'root.name'));
      await user.clear(input(container));
      await user.type(input(container), 'Jane');
      fireEvent.blur(input(container));

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange.mock.calls[0][0]).toEqual({ name: 'Jane', age: 30, isAdmin: false });
    });

    it('edits a number as a number, not a string', async () => {
      const user = userEvent.setup();
      const { container, onChange } = setup({ editable: true });

      await user.click(cell(container, 'root.age'));
      await user.clear(input(container));
      await user.type(input(container), '31{Enter}');

      expect(onChange.mock.calls[0][0].age).toBe(31);
    });

    it('toggles a boolean on click without opening an editor', () => {
      const { container, onChange } = setup({ editable: true });

      fireEvent.click(cell(container, 'root.isAdmin'));

      expect(container.querySelector('input')).toBeNull();
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange.mock.calls[0][0].isAdmin).toBe(true);
    });

    it('honours editableTypes', () => {
      const { container } = setup({ editable: true, editableTypes: ['string'] });
      expect(cell(container, 'root.name').getAttribute('data-editable')).toBe('true');
      expect(cell(container, 'root.age').getAttribute('data-editable')).toBeNull();
    });

    it('honours the isEditable gate', () => {
      const { container } = setup({
        editable: true,
        isEditable: ({ path }: any) => path !== 'root.name',
      });
      expect(cell(container, 'root.name').getAttribute('data-editable')).toBeNull();
      expect(cell(container, 'root.age').getAttribute('data-editable')).toBe('true');
    });

    it('rejects a value that fails validation', async () => {
      const user = userEvent.setup();
      const { container, onChange } = setup({
        editable: true,
        validate: ({ value }: any) => (String(value).length === 0 ? 'Required' : null),
      });

      await user.click(cell(container, 'root.name'));
      await user.clear(input(container));
      await user.type(input(container), '{Enter}');

      expect(onChange).not.toHaveBeenCalled();
      expect(container.textContent).toContain('Required');
      expect(container.querySelector('input')).not.toBeNull();
    });

    it('never offers to edit a Map or Set entry', () => {
      const { container } = setup(
        { editable: true },
        { m: new Map([['k', 'v']]), s: new Set(['v']), plain: 'yes' }
      );
      // their keys are synthetic, so there is no address to write back to
      const editable = container.querySelectorAll('[data-editable]');
      expect(editable).toHaveLength(1);
      expect(editable[0].getAttribute('data-value')).toBe('"yes"');
    });

    it('writes to the right node when two nodes share a display path', async () => {
      const user = userEvent.setup();
      const { container, onChange } = setup(
        { editable: true },
        { 'a.b': 'dotted', a: { b: 'nested' } }
      );

      // both rows render at data-value="root.a.b"
      const rows = container.querySelectorAll('li[role="treeitem"][data-value="root.a.b"]');
      expect(rows).toHaveLength(2);

      const nestedCell = rows[1].querySelector<HTMLElement>('[data-editable]')!;
      await user.click(nestedCell);
      await user.clear(input(container));
      await user.type(input(container), 'EDITED{Enter}');

      expect(onChange.mock.calls[0][0]).toEqual({ 'a.b': 'dotted', a: { b: 'EDITED' } });
      expect(onChange.mock.calls[0][1].pathSegments).toEqual(['a', 'b']);
    });

    it('keeps non-JSON values elsewhere in the tree intact', async () => {
      const user = userEvent.setup();
      const date = new Date('2024-01-15T10:30:00Z');
      const map = new Map([['k', 'v']]);
      const { container, onChange } = setup({ editable: true }, { label: 'old', date, map });

      await user.click(cell(container, 'root.label'));
      await user.clear(input(container));
      await user.type(input(container), 'new{Enter}');

      const next = onChange.mock.calls[0][0];
      // identity, not equality — a clone or JSON round-trip would destroy these
      expect(next.date).toBe(date);
      expect(next.map).toBe(map);
    });

    it('opens the editor with Enter on the focused row', async () => {
      const user = userEvent.setup();
      const { container } = setup({ editable: true });

      const row = container.querySelector<HTMLElement>(
        'li[role="treeitem"][data-value="root.name"]'
      )!;
      row.focus();
      await user.keyboard('{Enter}');

      expect(input(container).value).toBe('John');
    });

    it('adds no tab stop for editable values', () => {
      // one tab stop for the whole tree, as Mantine intends — a stop per value
      // would make a large tree impossible to tab past
      const { container } = setup({ editable: true });
      const cells = container.querySelectorAll('[data-editable]');
      expect(cells.length).toBeGreaterThan(0);
      cells.forEach((c) => expect(c.getAttribute('tabindex')).toBeNull());
    });
    it('adds nothing to the markup when editing is off', () => {
      // the read-only render path must stay exactly what it was before `editable`
      // existed, down to the inline custom properties
      const { container } = render(<JsonTree data={{ a: 1 }} defaultExpanded maxDepth={-1} />);
      const html = container.innerHTML;

      expect(html).not.toContain('editable-outline');
      expect(html).not.toContain('data-editable');
      expect(html).not.toContain('data-edit-key');
    });
    it('rejects an empty numeric field instead of committing zero', async () => {
      // NumberInput reports an empty field as '', and Number('') is 0 — committing
      // that writes a zero the user never typed while trying to clear the field
      const user = userEvent.setup();
      const { container, onChange } = setup({ editable: true });

      await user.click(cell(container, 'root.age'));
      await user.clear(input(container));
      await user.keyboard('{Enter}');

      expect(onChange).not.toHaveBeenCalled();
      expect(container.textContent).toContain('Required');
      expect(container.querySelector('input')).not.toBeNull();
    });

    it('never offers to edit a property of a class instance', () => {
      // it renders as an object, but setValueAtPath refuses a non-plain prototype:
      // offering the edit would throw at commit time
      class Profile {
        constructor(public city = 'Anytown') {}
      }
      const { container } = setup(
        { editable: true },
        { profile: new Profile(), plain: { city: 'X' } }
      );

      expect(cell(container, 'root.profile.city').getAttribute('data-editable')).toBeNull();
      // a plain object next to it must stay editable — no over-correction
      expect(cell(container, 'root.plain.city').getAttribute('data-editable')).toBe('true');
    });

    it('returns focus to the row when an edit is committed', async () => {
      const user = userEvent.setup();
      const { container } = setup({ editable: true });

      await user.click(cell(container, 'root.name'));
      await user.keyboard('{Enter}');

      // the editor unmounts with the input inside it; without this the keyboard
      // user lands on <body> and arrow navigation stops working
      expect(document.activeElement?.getAttribute('data-value')).toBe('root.name');
    });

    it('returns focus to the row when an edit is cancelled', async () => {
      const user = userEvent.setup();
      const { container } = setup({ editable: true });

      await user.click(cell(container, 'root.name'));
      await user.keyboard('{Escape}');

      expect(document.activeElement?.getAttribute('data-value')).toBe('root.name');
    });
    it('keeps the Tree guard when editorProps carries its own handlers', async () => {
      // spread last, a consumer onKeyDown replaced the guard and Mantine's Tree
      // reclaimed Space and the arrow keys — the field stopped accepting spaces
      const user = userEvent.setup();
      const consumerKeyDown = jest.fn();
      const { container, onChange } = setup({
        editable: true,
        editorProps: { onKeyDown: consumerKeyDown },
      });

      await user.click(cell(container, 'root.name'));
      await user.clear(input(container));
      await user.type(input(container), 'a b c');

      expect(input(container).value).toBe('a b c');
      // the consumer's handler still runs — it is composed, not discarded
      expect(consumerKeyDown).toHaveBeenCalled();

      await user.keyboard('{Enter}');
      expect(onChange.mock.calls[0][0].name).toBe('a b c');
    });
    it('runs validate on a boolean toggle too', async () => {
      // the toggle skips the editor, but it is still a commit — a consumer
      // `validate` that rejects the new state must be able to stop it
      const user = userEvent.setup();
      const validate = jest.fn((_payload: JsonTreeNodePayload) => 'not allowed');
      const { container, onChange } = setup({ editable: true, validate });

      await user.click(cell(container, 'root.isAdmin'));

      expect(validate).toHaveBeenCalledTimes(1);
      expect(validate.mock.calls[0][0]).toMatchObject({ type: 'boolean', value: true });
      expect(onChange).not.toHaveBeenCalled();
      expect(cell(container, 'root.isAdmin').textContent).toBe('false');
    });

    it('leaves Enter to a focused control inside the row', async () => {
      // the row can hold its own buttons; taking Enter here would make the
      // per-node copy button unreachable from the keyboard
      const user = userEvent.setup();
      // after setup(): userEvent installs a clipboard stub of its own
      const { writeText, restore } = stubClipboard();
      restoreClipboardAfter = restore;
      const { container } = setup({ editable: true, withCopyToClipboard: true });

      const row = container.querySelector<HTMLElement>(
        'li[role="treeitem"][data-value="root.name"]'
      )!;
      row.querySelector('button')!.focus();
      await user.keyboard('{Enter}');

      expect(container.querySelector('[class*="valueEditor"]')).toBeNull();
      await waitFor(() => expect(writeText).toHaveBeenCalled());
      expect(writeText.mock.calls[0][0]).toBe('"John"');
    });
    it('names the editor field for assistive technology', async () => {
      // an axe run on the open editor reported `label` and `label-title-only`:
      // the field was announced blank, with no clue which key it belonged to
      const user = userEvent.setup();
      const { container } = setup({ editable: true });

      await user.click(cell(container, 'root.name'));

      expect(input(container).getAttribute('aria-label')).toBe('Edit name');
      // and it stays overridable
      expect(input(container).getAttribute('aria-invalid')).toBeNull();
    });

    it('lets a consumer override the editor field name', async () => {
      const user = userEvent.setup();
      const { container } = setup({
        editable: true,
        editorProps: { 'aria-label': 'Full name' },
      });

      await user.click(cell(container, 'root.name'));

      expect(input(container).getAttribute('aria-label')).toBe('Full name');
    });
  });
});

// ─── Features inspired by Mantine's JsonViewer ──────────────────────────────

describe('JsonTree display options', () => {
  const collect = (node: any, out: any[] = []): any[] => {
    out.push(node);
    (node.children ?? []).forEach((c: any) => collect(c, out));
    return out;
  };
  const keysOf = (container: HTMLElement) =>
    Array.from(container.querySelectorAll('[data-key]')).map((el) => el.getAttribute('data-key'));
  const rowOf = (container: HTMLElement, key: string) =>
    container
      .querySelector(`[data-key="${key}"]`)!
      .closest('[data-json-tree-highlight], .mantine-Group-root');

  describe('sortKeys', () => {
    const data = { zebra: 1, apple: 2, mango: 3 };

    it('keeps the insertion order by default', () => {
      const { container } = render(<JsonTree data={data} defaultExpanded />);
      expect(keysOf(container)).toEqual(['zebra', 'apple', 'mango']);
    });

    it('sorts object keys alphabetically', () => {
      const { container } = render(<JsonTree data={data} defaultExpanded sortKeys />);
      expect(keysOf(container)).toEqual(['apple', 'mango', 'zebra']);
    });

    it('accepts a comparator', () => {
      const { container } = render(
        <JsonTree data={data} defaultExpanded sortKeys={(a, b) => b.localeCompare(a)} />
      );
      expect(keysOf(container)).toEqual(['zebra', 'mango', 'apple']);
    });

    it('never reorders an array, and keeps every path', () => {
      const tree = convertToTreeData(
        { b: ['z', 'a'], a: 1 },
        'root',
        'root',
        0,
        'as-string',
        [],
        [],
        {
          sortKeys: true,
        }
      );
      expect(tree.children!.map((n: any) => n.nodeData.key)).toEqual(['a', 'b']);
      const list = tree.children!.find((n: any) => n.nodeData.key === 'b') as any;
      expect(list.children.map((n: any) => n.nodeData.value)).toEqual(['z', 'a']);
      expect(list.children[1].nodeData.pathSegments).toEqual(['b', 1]);
    });
  });

  describe('groupArraysAfterLength', () => {
    const list = Array.from({ length: 25 }, (_, i) => `item-${i}`);
    const convert = (value: unknown, groupArraysAfterLength?: number) =>
      convertToTreeData(value, 'root', 'root', 0, 'as-string', [], [], { groupArraysAfterLength });

    it('computes the group size only past the limit', () => {
      expect(getArrayGroupSize(25, 10)).toBe(10);
      expect(getArrayGroupSize(10, 10)).toBe(0);
      expect(getArrayGroupSize(25, undefined)).toBe(0);
      expect(getArrayGroupSize(25, 0)).toBe(0);
      expect(getArrayGroupSize(25, Number.NaN)).toBe(0);
    });

    it('splits a long array into [start…end] groups', () => {
      const tree = convert({ list }, 10);
      const node = tree.children![0] as any;
      expect(node.children.map((n: any) => n.label)).toEqual(['[0…9]', '[10…19]', '[20…24]']);
      expect(node.children[2].children).toHaveLength(5);
      expect(node.nodeData.itemCount).toBe(25);
    });

    it('keeps the real path and address of every item', () => {
      const tree = convert({ list }, 10);
      const item = collect(tree).find((n: any) => n.nodeData?.value === 'item-12');
      expect(item.nodeData.path).toBe('root.list.12');
      expect(item.nodeData.pathSegments).toEqual(['list', 12]);
      expect(item.nodeData.depth).toBe(3);
    });

    it('gives a group no address, so it can never be edited or written to', () => {
      const tree = convert({ list }, 10);
      const group = (tree.children![0] as any).children[1];
      expect(group.nodeData.chunk).toEqual({ start: 10, end: 19 });
      expect(group.nodeData.pathSegments).toBeUndefined();
      expect(group.nodeData.value).toEqual(list.slice(10, 20));
    });

    it('leaves short arrays and objects alone', () => {
      const tree = convert(
        { short: ['a', 'b'], obj: Object.fromEntries(list.map((v, i) => [i, v])) },
        10
      );
      expect(collect(tree).some((n: any) => n.nodeData?.chunk)).toBe(false);
    });

    it('does not match a group label in a search', () => {
      const tree = convert({ list }, 10);
      const result = searchTree([tree], '1');
      const matchedGroupLabels = Array.from(result.directMatches).filter((p) => p.includes('…'));
      expect(matchedGroupLabels).toEqual([]);
      expect(result.directMatches.has('root.list.12')).toBe(true);
    });

    it('renders the groups, collapsed', () => {
      const { container, getByText } = render(
        <JsonTree data={{ list }} defaultExpanded maxDepth={2} groupArraysAfterLength={10} />
      );
      expect(getByText('[10…19]')).toBeInTheDocument();
      expect(container.textContent).not.toContain('item-12');
    });
  });

  describe('collapseStringsAfterLength', () => {
    const long = 'abcdefghijklmnopqrstuvwxyz';

    it('cuts a long string and reveals it on demand', async () => {
      const { container, getByRole } = render(
        <JsonTree data={{ text: long }} defaultExpanded collapseStringsAfterLength={5} />
      );
      expect(container.textContent).toContain('"abcde…"');
      expect(container.textContent).not.toContain(long);

      const toggle = getByRole('button', { name: 'show more' });
      expect(toggle).toHaveAttribute('aria-expanded', 'false');
      await userEvent.click(toggle);
      expect(container.textContent).toContain(`"${long}"`);
      expect(getByRole('button', { name: 'show less' })).toHaveAttribute('aria-expanded', 'true');
    });

    it('does not toggle the row when the toggle is clicked', async () => {
      const onNodeClick = jest.fn();
      const { getByRole } = render(
        <JsonTree
          data={{ text: long }}
          defaultExpanded
          collapseStringsAfterLength={5}
          onNodeClick={onNodeClick}
        />
      );
      await userEvent.click(getByRole('button', { name: 'show more' }));
      expect(onNodeClick).not.toHaveBeenCalled();
    });

    it('leaves short strings and other types alone', () => {
      const { container, queryByRole } = render(
        <JsonTree
          data={{ text: 'short', n: 12345678901 }}
          defaultExpanded
          collapseStringsAfterLength={5}
        />
      );
      expect(container.textContent).toContain('"short"');
      expect(container.textContent).toContain('12345678901');
      expect(queryByRole('button', { name: 'show more' })).toBeNull();
    });

    it('never splits an emoji in two', () => {
      const { container } = render(
        <JsonTree data={{ text: 'ab😀cdefgh' }} defaultExpanded collapseStringsAfterLength={3} />
      );
      // cutting at 3 would keep half of the surrogate pair
      expect(container.textContent).toContain('"ab…"');
    });
  });

  describe('highlightNode', () => {
    const data = { name: 'Alice', age: 31, tags: ['a'] };

    it('marks the rows it reports, with the node payload', () => {
      const highlightNode = jest.fn(({ key }: { key?: string }) =>
        key === 'name' ? 'changed' : key === 'tags' ? 'added' : null
      );
      const { container } = render(
        <JsonTree data={data} defaultExpanded highlightNode={highlightNode} />
      );

      expect(rowOf(container, 'name')).toHaveAttribute('data-json-tree-highlight', 'changed');
      expect(container.querySelector('[data-json-tree-highlight="added"]')).toHaveTextContent(
        'tags'
      );
      expect(rowOf(container, 'age')).not.toHaveAttribute('data-json-tree-highlight');

      expect(highlightNode).toHaveBeenCalledWith(
        expect.objectContaining({
          path: 'root.name',
          pathSegments: ['name'],
          type: 'string',
          value: 'Alice',
        })
      );
    });

    it('is never asked about an array group', () => {
      const highlightNode = jest.fn(() => null);
      render(
        <JsonTree
          data={{ list: Array.from({ length: 5 }, (_, i) => i) }}
          defaultExpanded
          maxDepth={-1}
          groupArraysAfterLength={2}
          highlightNode={highlightNode}
        />
      );
      const keys = highlightNode.mock.calls.map(([payload]: any) => payload.key);
      expect(keys.some((k: string | undefined) => k?.includes('…'))).toBe(false);
      expect(keys).toContain('3');
    });
  });

  describe('showValueTypes', () => {
    it('labels every value with its type', () => {
      const { container } = render(
        <JsonTree
          data={{ s: 'x', i: 1, f: 1.5, b: true, n: null, o: { a: 1 }, l: [1] }}
          defaultExpanded
          maxDepth={1}
          showValueTypes
        />
      );
      const badges = Array.from(container.querySelectorAll('.typeBadge')).map(
        (el) => el.textContent
      );
      expect(badges).toEqual([
        'object',
        'string',
        'int',
        'float',
        'bool',
        'null',
        'object',
        'array',
      ]);
    });

    it('shows no badge by default', () => {
      const { container } = render(<JsonTree data={{ s: 'x' }} defaultExpanded />);
      expect(container.querySelector('.typeBadge')).toBeNull();
    });

    it('reads numbers the way a JSON schema types them', () => {
      expect(getTypeLabel('number', 3)).toBe('int');
      expect(getTypeLabel('number', 3.5)).toBe('float');
      expect(getTypeLabel('nan', Number.NaN)).toBe('number');
      expect(getTypeLabel('boolean', false)).toBe('bool');
      expect(getTypeLabel('react-element', null)).toBe('element');
      expect(getTypeLabel('date', new Date())).toBe('date');
    });
  });

  describe('withQuotes and withKeyQuotes', () => {
    const data = { name: 'Alice', nested: { city: 'Rome' }, list: ['x'], m: new Map([['k', 1]]) };
    const keyTexts = (container: HTMLElement) =>
      Array.from(container.querySelectorAll('.key')).map((el) => el.textContent);
    const valueTexts = (container: HTMLElement) =>
      Array.from(container.querySelectorAll('.value[data-type="string"]')).map(
        (el) => el.textContent
      );

    it('quotes strings and leaves keys bare by default', () => {
      const { container } = render(<JsonTree data={data} defaultExpanded maxDepth={-1} />);
      expect(valueTexts(container)).toEqual(['"Alice"', '"Rome"', '"x"']);
      expect(keyTexts(container)).toEqual([
        'root',
        'name',
        'nested',
        'city',
        'list',
        '0',
        'm',
        '[0] k',
      ]);
    });

    it('drops the quotes around strings with withQuotes={false}', () => {
      const { container } = render(
        <JsonTree data={data} defaultExpanded maxDepth={-1} withQuotes={false} />
      );
      expect(valueTexts(container)).toEqual(['Alice', 'Rome', 'x']);
    });

    it('quotes object keys at every depth, never an index, a Map entry or a group', () => {
      const { container } = render(
        <JsonTree
          data={{ ...data, long: [1, 2, 3] }}
          defaultExpanded
          maxDepth={-1}
          withKeyQuotes
          groupArraysAfterLength={2}
        />
      );
      // the root's label is a name, not a key
      expect(keyTexts(container)).toEqual([
        'root',
        '"name"',
        '"nested"',
        '"city"',
        '"list"',
        '0',
        '"m"',
        '[0] k',
        '"long"',
        '[0…1]',
        '0',
        '1',
        '[2…2]',
        '2',
      ]);
      // data-key keeps the raw key, for selectors and tests
      expect(container.querySelector('[data-key="name"]')).toHaveTextContent('"name"');
    });

    it('applies withQuotes to a collapsed string, closed and open', async () => {
      const { container, getByRole } = render(
        <JsonTree
          data={{ text: 'abcdefghij' }}
          defaultExpanded
          collapseStringsAfterLength={3}
          withQuotes={false}
        />
      );
      expect(valueTexts(container)).toEqual(['abc…']);
      await userEvent.click(getByRole('button', { name: 'show more' }));
      expect(valueTexts(container)).toEqual(['abcdefghij']);
    });

    it('matches and highlights the text as it is displayed', () => {
      const quoted = searchTree([convertToTreeData({ name: 'Alice' })], '"name"', {
        withKeyQuotes: true,
      });
      expect(quoted.directMatches.has('root.name')).toBe(true);
      expect(searchTree([convertToTreeData({ name: 'Alice' })], '"name"').directMatches.size).toBe(
        0
      );
      expect(
        searchTree([convertToTreeData({ name: 'Alice' })], '"alice', { withQuotes: false })
          .directMatches.size
      ).toBe(0);
    });

    it('highlights a match inside a quoted key and value', async () => {
      const { container } = render(
        <JsonTree
          data={{ name: 'Alice' }}
          defaultExpanded
          withKeyQuotes
          withSearch
          searchQuery="li"
          searchDebounce={0}
        />
      );
      await waitFor(() => expect(container.querySelectorAll('.searchHighlight')).toHaveLength(1));
      expect(container.querySelector('.value')).toHaveTextContent('"Alice"');
      expect(container.querySelector('[data-key="name"]')).toHaveTextContent('"name"');
    });

    it('copies valid JSON whatever the display style', async () => {
      const { writeText, restore } = stubClipboard();
      restoreClipboardAfter = restore;
      const { container } = render(
        <JsonTree
          data={{ name: 'Alice' }}
          defaultExpanded
          withCopyAll
          withQuotes={false}
          withKeyQuotes
        />
      );
      fireEvent.click(container.querySelector('.copyAllButton')!);
      await waitFor(() => expect(writeText).toHaveBeenCalledWith('{\n  "name": "Alice"\n}'));
    });
  });
});

describe('allExpanded', () => {
  const data = {
    user: { name: 'Alice', address: { city: 'Rome' } },
    list: [1, 2, 3, 4, 5],
    text: 'abcdefghij',
  };
  const row = (container: HTMLElement, path: string) =>
    container.querySelector<HTMLElement>(`li[role="treeitem"][data-value="${path}"]`)!;

  it('expands every node, array groups included, whatever defaultExpanded and maxDepth say', () => {
    const { container } = render(
      <JsonTree data={data} allExpanded maxDepth={0} groupArraysAfterLength={2} />
    );
    expect(container.textContent).toContain('"Rome"');
    expect(container.textContent).toContain('[4…4]');
    expect(container.textContent).toContain('5');
    const parents = container.querySelectorAll('[data-has-children="true"]');
    expect(parents).toHaveLength(7); // root, user, address, list, three groups
    parents.forEach((el) => expect(el).toHaveAttribute('data-expanded', 'true'));
  });

  it('hides the node toggles, keeping their room, and the expand/collapse all controls', () => {
    const { container } = render(<JsonTree data={data} allExpanded withExpandAll title="Data" />);
    const toggles = Array.from(container.querySelectorAll<HTMLElement>('.expandCollapse'));
    expect(toggles.length).toBeGreaterThan(0);
    toggles.forEach((toggle) => {
      expect(toggle).toBeDisabled();
      expect(toggle).toHaveAttribute('aria-hidden', 'true');
      expect(toggle.style.visibility).toBe('hidden');
      expect(toggle.querySelector('svg')).toBeNull();
    });
    expect(container.querySelector('.controls')).toBeNull();
    expect(container.querySelector('[data-all-expanded]')).not.toBeNull();
  });

  it('keeps the toggles when it is off', () => {
    const { container } = render(<JsonTree data={data} withExpandAll />);
    expect(container.querySelector('.expandCollapse')).not.toBeNull();
    expect(container.querySelectorAll('.controls')).toHaveLength(2);
  });

  it('cannot be collapsed from the keyboard; ArrowLeft moves to the parent', async () => {
    const user = userEvent.setup();
    const { container } = render(<JsonTree data={data} allExpanded />);

    const isOpen = (path: string) =>
      row(container, path).querySelector('[data-has-children]')!.getAttribute('data-expanded');

    row(container, 'root.user').focus();
    await user.keyboard('{ArrowLeft}');
    expect(isOpen('root.user')).toBe('true');
    expect(document.activeElement).toBe(row(container, 'root'));

    row(container, 'root.user').focus();
    await user.keyboard(' ');
    expect(isOpen('root.user')).toBe('true');
    expect(container.textContent).toContain('"Rome"');

    // ArrowRight still walks into the children
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(row(container, 'root.user.name'));
  });

  it('ignores a controlled expanded, with a warning, and never reports a change', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const onExpandedChange = jest.fn();
    const { container } = render(
      <JsonTree
        data={data}
        allExpanded
        expanded={[]}
        onExpandedChange={onExpandedChange}
        withSearch
        searchQuery="Rome"
        searchDebounce={0}
      />
    );
    await waitFor(() => expect(container.querySelector('.searchHighlight')).not.toBeNull());
    expect(container.textContent).toContain('"Rome"');
    expect(onExpandedChange).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('`expanded` is ignored'));
    warn.mockRestore();
  });

  it('leaves collapseStringsAfterLength working', async () => {
    const { container, getByRole } = render(
      <JsonTree data={data} allExpanded collapseStringsAfterLength={6} />
    );
    expect(container.textContent).toContain('"abcdef…"');
    await userEvent.click(getByRole('button', { name: 'show more' }));
    expect(container.textContent).toContain('"abcdefghij"');
  });
});

describe('maxDisplayLength', () => {
  const keys = Object.fromEntries(Array.from({ length: 5 }, (_, i) => [`k${i}`, i]));
  const items = Array.from({ length: 7 }, (_, i) => `item-${i}`);
  const convert = (value: unknown, groupArraysAfterLength?: number) =>
    convertToTreeData(value, 'root', 'root', 0, 'as-string', [], [], { groupArraysAfterLength });
  const moreButton = (container: HTMLElement) =>
    container.querySelector<HTMLElement>('[data-json-tree-action="reveal"]');
  const row = (container: HTMLElement, path: string) =>
    Array.from(container.querySelectorAll<HTMLElement>('li[role="treeitem"]')).find(
      (li) => li.getAttribute('data-value') === path
    );

  describe('limitTreeEntries', () => {
    it('keeps the first entries and closes the container with a more row', () => {
      const [root] = limitTreeEntries([convert(keys)], 2);
      const children = root.children as any[];
      expect(children.map((c) => c.nodeData.key)).toEqual(['k0', 'k1', undefined]);
      expect(children[2].nodeData.more).toEqual({
        container: 'root',
        hidden: 3,
        next: 'root.k2',
        unit: 'keys',
      });
      expect(children[2].nodeData.depth).toBe(1);
    });

    it('limits nested containers too, and names their entries', () => {
      const [root] = limitTreeEntries(
        [convert({ list: items, m: new Map(items.map((v) => [v, v])), s: new Set(items) })],
        3
      );
      const units = (root.children as any[]).map((c) => c.children.at(-1).nodeData.more.unit);
      expect(units).toEqual(['items', 'entries', 'items']);
    });

    it('shows as many entries as were revealed', () => {
      const [root] = limitTreeEntries([convert(items)], 2, { root: 6 });
      const children = root.children as any[];
      expect(children).toHaveLength(7);
      expect(children[6].nodeData.more.hidden).toBe(1);
      const [all] = limitTreeEntries([convert(items)], 2, { root: 8 });
      expect((all.children as any[]).some((c) => c.nodeData.more)).toBe(false);
    });

    it('leaves a grouped array and its groups whole', () => {
      const [root] = limitTreeEntries([convert({ list: items }, 3)], 1);
      const list = (root.children as any[])[0];
      expect(list.children.map((c: any) => c.label)).toEqual(['[0…2]', '[3…5]', '[6…6]']);
      expect(list.children[0].children).toHaveLength(3);
    });

    it('never touches a container that fits', () => {
      const tree = convert({ a: 1, b: 2 });
      const [root] = limitTreeEntries([tree], 2);
      expect(root.children).toHaveLength(2);
    });
  });

  it('shows every entry by default', () => {
    const { container } = render(<JsonTree data={keys} defaultExpanded />);
    expect(moreButton(container)).toBeNull();
    expect(container.textContent).toContain('k4');
  });

  it('renders the more row and reveals the next page on click, focusing it', async () => {
    const { container } = render(
      <JsonTree data={{ list: items }} defaultExpanded maxDepth={-1} maxDisplayLength={3} />
    );
    expect(container.textContent).toContain('item-2');
    expect(container.textContent).not.toContain('item-3');
    expect(moreButton(container)).toHaveTextContent('… 4 more items');

    await userEvent.click(moreButton(container)!);
    expect(container.textContent).toContain('item-5');
    expect(container.textContent).not.toContain('item-6');
    expect(moreButton(container)).toHaveTextContent('… 1 more items');
    await waitFor(() => expect(document.activeElement).toBe(row(container, 'root.list.3')));

    await userEvent.click(moreButton(container)!);
    expect(container.textContent).toContain('item-6');
    expect(moreButton(container)).toBeNull();
  });

  it('reveals the next page with Enter on the focused row', async () => {
    const user = userEvent.setup();
    const { container } = render(<JsonTree data={keys} defaultExpanded maxDisplayLength={2} />);
    row(container, `root${'\u0000'}more`)!.focus();
    await user.keyboard('{Enter}');
    expect(container.textContent).toContain('k3');
    await waitFor(() => expect(document.activeElement).toBe(row(container, 'root.k2')));
  });

  it('never hides a search match behind the limit', async () => {
    const { container } = render(
      <JsonTree
        data={{ list: items }}
        defaultExpanded
        maxDisplayLength={2}
        withSearch
        searchQuery="item-6"
        searchDebounce={0}
      />
    );
    await waitFor(() => expect(container.textContent).toContain('item-6'));
    expect(moreButton(container)).toBeNull();
  });

  it('copies, counts and expands the full value', async () => {
    const { writeText, restore } = stubClipboard();
    restoreClipboardAfter = restore;
    const { container } = render(
      <JsonTree
        data={items}
        defaultExpanded
        maxDisplayLength={2}
        withCopyAll
        withKeyCountBadge
        title="Items"
      />
    );
    expect(container.querySelector('.keyCountBadge')).toHaveTextContent('7 items');
    fireEvent.click(container.querySelector('.copyAllButton')!);
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(JSON.stringify(items, null, 2)));
  });

  it('is never reported to highlightNode or onNodeClick', async () => {
    const highlightNode = jest.fn(() => null);
    const onNodeClick = jest.fn();
    const { container } = render(
      <JsonTree
        data={keys}
        defaultExpanded
        maxDisplayLength={2}
        highlightNode={highlightNode}
        onNodeClick={onNodeClick}
      />
    );
    const paths = new Set(highlightNode.mock.calls.map(([payload]: any) => payload.path));
    expect(Array.from(paths)).toEqual(['root', 'root.k0', 'root.k1']);
    await userEvent.click(moreButton(container)!);
    expect(onNodeClick).not.toHaveBeenCalled();
  });
});

describe('structural edits', () => {
  /** Feeds every change back, as a real consumer would */
  function Controlled({
    initial,
    onChange,
    ...props
  }: { initial: unknown; onChange?: jest.Mock } & Record<string, any>) {
    const [data, setData] = React.useState(initial);
    return (
      <JsonTree
        data={data}
        editable
        structuralEdits
        defaultExpanded
        maxDepth={-1}
        onChange={(next, change) => {
          setData(next);
          onChange?.(next, change);
        }}
        {...props}
      />
    );
  }

  const row = (container: HTMLElement, path: string) =>
    Array.from(container.querySelectorAll<HTMLElement>('li[role="treeitem"]')).find(
      (li) => li.getAttribute('data-value') === path
    );
  /** The row's own control, never one of a nested row */
  const own = (container: HTMLElement, path: string, selector: string) => {
    const li = row(container, path)!;
    return Array.from(li.querySelectorAll<HTMLElement>(selector)).find(
      (el) => el.closest('[role="treeitem"]') === li
    );
  };
  const action = (container: HTMLElement, path: string, name: string) =>
    own(container, path, `[data-json-tree-action="${name}"]`);
  const keyOf = (container: HTMLElement, path: string) => own(container, path, '.key')!;
  const input = (container: HTMLElement) => container.querySelector<HTMLInputElement>('input')!;

  const profile = {
    name: 'Ada',
    age: 36,
    tags: ['math', 'poetry', 'engines'],
    address: { city: 'London', zip: 'W1' },
  };

  it('is off unless both editable and structuralEdits are set', () => {
    const { container: a } = render(
      <JsonTree data={profile} editable defaultExpanded maxDepth={-1} onChange={() => {}} />
    );
    expect(a.querySelector('[data-json-tree-action]')).toBeNull();
    expect(a.querySelector('[data-json-tree-action="rename"]')).toBeNull();

    const { container: b } = render(
      <JsonTree data={profile} structuralEdits defaultExpanded maxDepth={-1} />
    );
    expect(b.querySelector('[data-json-tree-action]')).toBeNull();
  });

  it('offers only the edits it is given', () => {
    const { container } = render(<Controlled initial={profile} structuralEdits={['remove']} />);
    const actions = new Set(
      Array.from(container.querySelectorAll('[data-json-tree-action]')).map((el) =>
        el.getAttribute('data-json-tree-action')
      )
    );
    expect(Array.from(actions)).toEqual(['remove']);
    expect(container.querySelector('[data-json-tree-action="rename"]')).toBeNull();
  });

  it('puts each control only where it makes sense', () => {
    const { container } = render(<Controlled initial={profile} />);
    // the root can be added to, never renamed, removed or moved
    expect(action(container, 'root', 'add')).toBeDefined();
    expect(action(container, 'root', 'remove')).toBeUndefined();
    // an object key can be renamed and removed, not moved
    expect(own(container, 'root.name', '[data-json-tree-action="rename"]')).toBeDefined();
    expect(action(container, 'root.name', 'move-up')).toBeUndefined();
    // an array item can be moved and removed, not renamed
    expect(action(container, 'root.tags.1', 'move-up')).toBeDefined();
    expect(own(container, 'root.tags.1', '[data-json-tree-action="rename"]')).toBeUndefined();
    // the ends of an array cannot move past them
    expect(action(container, 'root.tags.0', 'move-up')).toBeDisabled();
    expect(action(container, 'root.tags.2', 'move-down')).toBeDisabled();
    // a primitive has nothing to add to
    expect(action(container, 'root.name', 'add')).toBeUndefined();
  });

  it('never offers an edit where the data cannot be written', () => {
    const { container } = render(
      <Controlled
        initial={{ m: new Map([['k', { a: 1 }]]), when: new Date(0), list: [1, 2, 3] }}
        groupArraysAfterLength={2}
      />
    );
    // Map entries have no address; a Date is not a container; a group is not data
    expect(row(container, 'root.m.[0] k')!.querySelector('[data-json-tree-action]')).toBeNull();
    expect(action(container, 'root.when', 'add')).toBeUndefined();
    expect(action(container, 'root.list.[0…1]', 'remove')).toBeUndefined();
    expect(action(container, 'root.m', 'add')).toBeUndefined();
  });

  it('respects isEditable for structural edits too', () => {
    const { container } = render(
      <Controlled
        initial={profile}
        isEditable={({ key }: JsonTreeNodePayload) => key !== 'address'}
      />
    );
    expect(action(container, 'root.address', 'remove')).toBeUndefined();
    expect(own(container, 'root.address', '[data-json-tree-action="rename"]')).toBeUndefined();
    expect(action(container, 'root.age', 'remove')).toBeDefined();
  });

  describe('rename', () => {
    it('renames a key in place and reports it', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      const { container } = render(<Controlled initial={profile} onChange={onChange} />);

      await user.click(keyOf(container, 'root.name'));
      expect(input(container).value).toBe('name');
      expect(input(container)).toHaveAttribute('aria-label', 'Rename name');
      await user.clear(input(container));
      await user.type(input(container), 'fullName{Enter}');

      const [next, change] = onChange.mock.calls[0];
      expect(Object.keys(next)).toEqual(['fullName', 'age', 'tags', 'address']);
      expect(change).toMatchObject({
        action: 'rename',
        path: 'root.fullName',
        pathSegments: ['fullName'],
        key: 'fullName',
        value: 'Ada',
        previousValue: 'Ada',
        previousPath: 'root.name',
        previousPathSegments: ['name'],
        previousKey: 'name',
      });
      await waitFor(() => expect(document.activeElement).toBe(row(container, 'root.fullName')));
    });

    it('rejects a key that already exists, and one validateKey refuses', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      const { container, getByText } = render(
        <Controlled
          initial={profile}
          onChange={onChange}
          validateKey={(key: string) => (key.startsWith('_') ? 'No private keys' : null)}
        />
      );

      await user.click(keyOf(container, 'root.name'));
      await user.clear(input(container));
      await user.type(input(container), 'age{Enter}');
      expect(getByText('Key already exists')).toBeInTheDocument();

      await user.clear(input(container));
      await user.type(input(container), '_secret{Enter}');
      expect(getByText('No private keys')).toBeInTheDocument();
      expect(onChange).not.toHaveBeenCalled();

      await user.keyboard('{Escape}');
      expect(container.querySelector('input')).toBeNull();
      expect(document.activeElement).toBe(row(container, 'root.name'));
    });

    it('keeps the expanded nodes below a renamed key open', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <Controlled initial={{ user: { address: { city: 'Rome' } } }} />
      );
      expect(container.textContent).toContain('"Rome"');

      await user.click(keyOf(container, 'root.user'));
      await user.clear(input(container));
      await user.type(input(container), 'person{Enter}');

      expect(row(container, 'root.person.address')).toBeDefined();
      expect(container.textContent).toContain('"Rome"');
    });

    it('renames from the keyboard with F2', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      const { container } = render(<Controlled initial={profile} onChange={onChange} />);
      row(container, 'root.age')!.focus();
      await user.keyboard('{F2}');
      await user.clear(input(container));
      await user.type(input(container), 'years{Enter}');
      expect(onChange.mock.calls[0][1]).toMatchObject({ action: 'rename', key: 'years' });
    });

    it('reports nothing when the key is unchanged', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      const { container } = render(<Controlled initial={profile} onChange={onChange} />);
      await user.click(keyOf(container, 'root.name'));
      await user.keyboard('{Enter}');
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('add', () => {
    it('adds a key to an object and opens the editor on its value', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      const { container } = render(<Controlled initial={profile} onChange={onChange} />);

      await user.click(action(container, 'root.address', 'add')!);
      expect(input(container)).toHaveAttribute('aria-label', 'New key');
      await user.type(input(container), 'country{Enter}');

      const [next, change] = onChange.mock.calls[0];
      expect(next.address).toEqual({ city: 'London', zip: 'W1', country: '' });
      expect(change).toMatchObject({
        action: 'add',
        path: 'root.address.country',
        pathSegments: ['address', 'country'],
        key: 'country',
        type: 'string',
        value: '',
        previousValue: undefined,
      });

      // the new string's editor is open straight away
      await waitFor(() => expect(input(container)).toHaveAttribute('aria-label', 'Edit country'));
      await user.type(input(container), 'UK{Enter}');
      expect(onChange.mock.calls[1][0].address.country).toBe('UK');
      await waitFor(() =>
        expect(document.activeElement).toBe(row(container, 'root.address.country'))
      );
    });

    it('never asks highlightNode about the new-key row', async () => {
      const user = userEvent.setup();
      const highlightNode = jest.fn(() => null);
      const { container } = render(
        <Controlled initial={{ address: { city: 'Rome' } }} highlightNode={highlightNode} />
      );
      highlightNode.mockClear();
      await user.click(action(container, 'root.address', 'add')!);
      expect(input(container)).toHaveAttribute('aria-label', 'New key');
      const values = highlightNode.mock.calls.map(([payload]: any) => payload.value);
      expect(values).not.toContain('');
    });

    it('rejects a key the object already has', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      const { container, getByText } = render(<Controlled initial={profile} onChange={onChange} />);
      await user.click(action(container, 'root.address', 'add')!);
      await user.type(input(container), 'city{Enter}');
      expect(getByText('Key already exists')).toBeInTheDocument();
      expect(onChange).not.toHaveBeenCalled();
    });

    it('cancels with Escape and gives focus back to the container', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      const { container } = render(<Controlled initial={profile} onChange={onChange} />);
      row(container, 'root.address')!.focus();
      await user.keyboard('{Insert}');
      expect(input(container)).toHaveAttribute('aria-label', 'New key');
      await user.keyboard('{Escape}');
      expect(container.querySelector('input')).toBeNull();
      expect(onChange).not.toHaveBeenCalled();
      expect(document.activeElement).toBe(row(container, 'root.address'));
    });

    it('adds to an empty object, opening it', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      const { container } = render(<Controlled initial={{ empty: {} }} onChange={onChange} />);
      await user.click(action(container, 'root.empty', 'add')!);
      await user.type(input(container), 'first{Enter}');
      expect(onChange.mock.calls[0][0]).toEqual({ empty: { first: '' } });
      expect(row(container, 'root.empty.first')).toBeDefined();
    });

    it('appends an item of the same type as the last one', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      const { container } = render(
        <Controlled
          initial={{ nums: [1, 2], flags: [true], rows: [{ a: 1 }] }}
          onChange={onChange}
        />
      );

      await user.click(action(container, 'root.nums', 'add')!);
      expect(onChange.mock.calls[0][0].nums).toEqual([1, 2, 0]);
      expect(onChange.mock.calls[0][1]).toMatchObject({
        action: 'add',
        path: 'root.nums.2',
        pathSegments: ['nums', 2],
        key: '2',
        type: 'number',
      });
      // a number opens its editor
      await waitFor(() => expect(input(container)).toHaveAttribute('aria-label', 'Edit 2'));
      await user.keyboard('{Escape}');

      await user.click(action(container, 'root.flags', 'add')!);
      expect(onChange.mock.calls[1][0].flags).toEqual([true, false]);
      await user.click(action(container, 'root.rows', 'add')!);
      expect(onChange.mock.calls[2][0].rows).toEqual([{ a: 1 }, {}]);
      // a boolean or an object has no editor to open: its row takes focus
      await waitFor(() => expect(document.activeElement).toBe(row(container, 'root.rows.1')));
    });

    it('starts from getNewValue when it is given', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      const getNewValue = jest.fn(() => null);
      const { container } = render(
        <Controlled initial={{ list: ['a'] }} onChange={onChange} getNewValue={getNewValue} />
      );
      await user.click(action(container, 'root.list', 'add')!);
      expect(getNewValue).toHaveBeenCalledWith(
        expect.objectContaining({ path: 'root.list', pathSegments: ['list'], value: ['a'] })
      );
      expect(onChange.mock.calls[0][0]).toEqual({ list: ['a', null] });
    });

    it('reveals a new item past maxDisplayLength', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <Controlled initial={{ list: [1, 2, 3] }} maxDisplayLength={2} getNewValue={() => 9} />
      );
      await user.click(action(container, 'root.list', 'add')!);
      await user.keyboard('{Escape}');
      expect(row(container, 'root.list.3')).toBeDefined();
    });
  });

  describe('remove', () => {
    it('removes a key and focuses the next one', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      const { container } = render(<Controlled initial={profile} onChange={onChange} />);

      await user.click(action(container, 'root.age', 'remove')!);
      const [next, change] = onChange.mock.calls[0];
      expect(next).toEqual({ name: 'Ada', tags: profile.tags, address: profile.address });
      expect(change).toMatchObject({
        action: 'remove',
        path: 'root.age',
        pathSegments: ['age'],
        key: 'age',
        type: 'number',
        value: undefined,
        previousValue: 36,
      });
      await waitFor(() => expect(document.activeElement).toBe(row(container, 'root.tags')));
    });

    it('removes an array item, shifting the rest and their expanded state', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      const { container } = render(
        <Controlled
          initial={{ list: [{ id: 1 }, { id: 2, deep: { x: 'X' } }] }}
          onChange={onChange}
        />
      );
      expect(container.textContent).toContain('"X"');

      await user.click(action(container, 'root.list.0', 'remove')!);
      expect(onChange.mock.calls[0][0]).toEqual({ list: [{ id: 2, deep: { x: 'X' } }] });
      // the second item is now the first, still open down to its leaves
      expect(container.textContent).toContain('"X"');
      await waitFor(() => expect(document.activeElement).toBe(row(container, 'root.list.0')));
    });

    it('removes the last entry and focuses the one before, then the container', async () => {
      const user = userEvent.setup();
      const { container } = render(<Controlled initial={{ list: ['a', 'b'] }} />);
      await user.click(action(container, 'root.list', 'add')!);
      await user.keyboard('{Escape}');
      row(container, 'root.list.2')!.focus();
      await user.keyboard('{Delete}');
      await waitFor(() => expect(document.activeElement).toBe(row(container, 'root.list.1')));
      await user.keyboard('{Backspace}');
      await user.keyboard('{Backspace}');
      await waitFor(() => expect(document.activeElement).toBe(row(container, 'root.list')));
    });
  });

  describe('reorder', () => {
    it('moves an item with its buttons and reports where it went', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      const { container } = render(<Controlled initial={profile} onChange={onChange} />);

      await user.click(action(container, 'root.tags.0', 'move-down')!);
      const [next, change] = onChange.mock.calls[0];
      expect(next.tags).toEqual(['poetry', 'math', 'engines']);
      expect(change).toMatchObject({
        action: 'reorder',
        path: 'root.tags.1',
        pathSegments: ['tags', 1],
        key: '1',
        value: 'math',
        previousPath: 'root.tags.0',
        previousPathSegments: ['tags', 0],
        previousKey: '0',
      });
      await waitFor(() => expect(document.activeElement).toBe(row(container, 'root.tags.1')));
    });

    it('moves with Alt + arrows, carrying the expanded state along', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      const { container } = render(
        <Controlled initial={{ list: ['a', { inner: { leaf: 'L' } }] }} onChange={onChange} />
      );
      row(container, 'root.list.1')!.focus();
      await user.keyboard('{Alt>}{ArrowUp}{/Alt}');
      expect(onChange.mock.calls[0][0]).toEqual({ list: [{ inner: { leaf: 'L' } }, 'a'] });
      expect(container.textContent).toContain('"L"');
      await waitFor(() => expect(document.activeElement).toBe(row(container, 'root.list.0')));

      // the first item cannot move up: nothing happens, focus stays
      await user.keyboard('{Alt>}{ArrowUp}{/Alt}');
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(document.activeElement).toBe(row(container, 'root.list.0'));
    });

    it('moves an item across the groups of a grouped array, opening its group', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      const { container } = render(
        <Controlled
          initial={{ list: ['a', 'b', 'c'] }}
          onChange={onChange}
          groupArraysAfterLength={2}
          maxDepth={2}
        />
      );
      // only the first group is open
      fireEvent.click(own(container, 'root.list.[0…1]', '.expandCollapse')!);
      await user.click(action(container, 'root.list.1', 'move-down')!);
      expect(onChange.mock.calls[0][0].list).toEqual(['a', 'c', 'b']);
      await waitFor(() => expect(document.activeElement).toBe(row(container, 'root.list.2')));
    });
  });

  it('reports a value edit as action "edit"', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    const { container } = render(<Controlled initial={profile} onChange={onChange} />);
    await user.click(own(container, 'root.name', '[data-edit-key]')!);
    await user.clear(input(container));
    await user.type(input(container), 'Lovelace{Enter}');
    expect(onChange.mock.calls[0][1]).toMatchObject({ action: 'edit', value: 'Lovelace' });
  });

  it('reports remapped expansion through onExpandedChange when controlled', async () => {
    const user = userEvent.setup();
    const onExpandedChange = jest.fn();
    const { container } = render(
      <Controlled
        initial={{ a: { b: { c: 1 } } }}
        expanded={['root', 'root.a', 'root.a.b']}
        onExpandedChange={onExpandedChange}
      />
    );
    await user.click(keyOf(container, 'root.a'));
    await user.clear(input(container));
    await user.type(input(container), 'z{Enter}');
    expect(onExpandedChange).toHaveBeenLastCalledWith(
      expect.arrayContaining(['root', 'root.z', 'root.z.b'])
    );
    expect(onExpandedChange.mock.calls.at(-1)[0]).not.toContain('root.a');
  });

  it('never confuses a dotted key with a nested one when remapping', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Controlled initial={{ a: { b: { deep: 1 } }, 'a.b': { other: 2 } }} />
    );
    await user.click(keyOf(container, 'root.a'));
    await user.clear(input(container));
    await user.type(input(container), 'z{Enter}');
    // 'a.b' kept its own expansion; 'z' took 'a''s
    expect(container.textContent).toContain('other');
    expect(container.textContent).toContain('deep');
  });
});

describe('structural edit helpers', () => {
  const tree = (value: unknown) => [convertToTreeData(value)];

  it('remaps every value below a renamed entry, and nothing else', () => {
    const remap = remapContainerEntries(tree({ a: { b: { c: 1 } }, x: 1 }), 'root', (k) =>
      k === 'a' ? 'z' : k
    );
    expect(Object.fromEntries(remap.moves)).toEqual({
      'root.a': 'root.z',
      'root.a.b': 'root.z.b',
      'root.a.b.c': 'root.z.b.c',
    });
    expect(
      applyRemap({ root: true, 'root.a': true, 'root.a.b': false, 'root.x': true }, remap)
    ).toEqual({ root: true, 'root.z': true, 'root.z.b': false, 'root.x': true });
  });

  it('drops a removed entry and shifts the indices after it', () => {
    const remap = remapContainerEntries(tree(['a', ['b'], ['c']]), 'root', (k) =>
      k === '0' ? null : String(Number(k) - 1)
    );
    expect(applyRemap({ 'root.0': true, 'root.1': true, 'root.2': false }, remap)).toEqual({
      'root.0': true,
      'root.1': false,
    });
  });

  it('keeps a value an unmoved node shares with a moved one', () => {
    const remap = remapContainerEntries(
      tree({ a: { b: { x: 1 } }, 'a.b': { y: 2 } }),
      'root',
      (k) => (k === 'a' ? 'z' : k)
    );
    expect(remap.keep.has('root.a.b')).toBe(true);
    expect(applyRemap({ 'root.a': true, 'root.a.b': true }, remap)).toEqual({
      'root.a.b': true,
      'root.z': true,
      'root.z.b': true,
    });
  });

  it('starts a new entry with the last entry type, emptied', () => {
    expect(getDefaultNewValue([])).toBe('');
    expect(getDefaultNewValue(['a'])).toBe('');
    expect(getDefaultNewValue([1])).toBe(0);
    expect(getDefaultNewValue([true])).toBe(false);
    expect(getDefaultNewValue([null])).toBeNull();
    expect(getDefaultNewValue([[1]])).toEqual([]);
    expect(getDefaultNewValue({ a: { b: 1 } })).toEqual({});
    expect(getDefaultNewValue([new Date()])).toBe('');
  });

  it('appends the new-key row to the right container only', () => {
    const [root] = appendDraftRow(tree({ a: { x: 1 }, b: { y: 2 } }), 'root.b');
    const [a, b] = root.children as any[];
    expect(a.children).toHaveLength(1);
    expect(b.children.at(-1).nodeData.draft).toEqual({ container: 'root.b' });
  });
});

describe('Containers with nothing to show', () => {
  const secret = function secretFn() {
    return 'SECRET';
  };

  it('never prints a hidden function through an array group', () => {
    const { container } = render(
      <JsonTree
        data={{ list: [1, 2, secret, secret, 5] }}
        defaultExpanded
        maxDepth={-1}
        displayFunctions="hide"
        groupArraysAfterLength={2}
      />
    );
    expect(container.textContent).not.toContain('SECRET');
    expect(container.textContent).toContain('[0…1]');
    expect(container.textContent).toContain('[4…4]');
    // the group holding only hidden functions is left out
    expect(container.textContent).not.toContain('[2…3]');
  });

  it('never prints a hidden function through an array that holds only functions', () => {
    const { container } = render(
      <JsonTree
        data={{ list: [secret, secret] }}
        defaultExpanded
        maxDepth={-1}
        displayFunctions="hide"
      />
    );
    expect(container.textContent).not.toContain('SECRET');
    expect(container.querySelector('[data-type="array"][data-value]')).toHaveAttribute(
      'data-value',
      '[]'
    );
  });

  it('shows empty containers as {} and []', () => {
    const { container } = render(<JsonTree data={{ a: {}, b: [] }} defaultExpanded />);
    expect(container.textContent).not.toContain('[object Object]');
    const values = Array.from(container.querySelectorAll('[data-value]')).map((el) =>
      el.getAttribute('data-value')
    );
    expect(values).toEqual(expect.arrayContaining(['{}', '[]']));
  });
});
