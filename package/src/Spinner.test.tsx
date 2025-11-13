import React from 'react';
import { render } from '@mantine-tests/core';
import { Spinner } from './Spinner';

describe('Spinner', () => {
  it('renders without crashing', () => {
    const { container } = render(<Spinner />);
    expect(container).toBeTruthy();
  });
});
