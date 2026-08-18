import { render } from '@mantine-tests/core';
import { Loader } from '@mantine/core';
import { fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { JsonTree } from './JsonTree';
import { setValueAtPath } from './lib/path';
import { convertToTreeData, filterTreeBySearch, searchTree, stringifyValue } from './lib/utils';

describe('JsonTree', () => {
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
      const writeText = jest.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText },
        configurable: true,
        writable: true,
      });
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
      const writeText = jest.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText },
        configurable: true,
        writable: true,
      });

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
  });
});
