import React from 'react';
import { JsonTree, JsonTreeProps } from './JsonTree';

export default {
  title: 'JsonTree',
  args: {},
  argTypes: {},
};

export function Usage(props: JsonTreeProps) {
  const data = {
    name: 'John Doe',
    age: 30,
    isAdmin: false,
    courses: ['html', 'css', 'js'],
    wife: null,
    address: {
      street: '123 Main St',
      city: 'Anytown',
      zip: '12345',
    },
    action: { type: 'click', payload: undefined },
    projects: [
      {
        name: 'Project A',
        status: 'completed',
      },
      {
        name: 'Project B',
        status: 'in progress',
      },
    ],
  };

  return <JsonTree data={data} />;
}
