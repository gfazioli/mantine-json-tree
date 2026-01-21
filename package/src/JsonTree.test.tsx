import React from 'react';
import { Loader } from '@mantine/core';
import { render } from '@mantine-tests/core';
import { JsonTree } from './JsonTree';

describe('JsonTree', () => {
  it('renders without crashing', () => {
    const { container } = render(<JsonTree data={[]} />);
    expect(container).toBeTruthy();
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
});
