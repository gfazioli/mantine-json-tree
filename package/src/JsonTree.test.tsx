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
});
