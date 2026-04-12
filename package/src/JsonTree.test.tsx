import React from 'react';
import { fireEvent } from '@testing-library/react';
import { Loader } from '@mantine/core';
import { render } from '@mantine-tests/core';
import { JsonTree } from './JsonTree';

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
});
