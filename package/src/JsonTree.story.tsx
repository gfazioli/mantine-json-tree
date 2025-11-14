import React from 'react';
import { ScrollArea, Stack, Title } from '@mantine/core';
import { JsonTree } from './JsonTree';

export default {
  title: 'JsonTree',
  args: {},
  argTypes: {},
};

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

export function Usage() {
  return (
    <Stack>
      <JsonTree data={data} />
      <JsonTree data={'Simple String'} />
      <JsonTree data={true} />
      <JsonTree data={false} />
      <JsonTree data={[1, 2, 3]} />
      <JsonTree data={{ on: true }} />
      <JsonTree data={null} />
      <JsonTree data={undefined} />
    </Stack>
  );
}

export function WithSize() {
  return (
    <Stack>
      <JsonTree data={data} />
      <JsonTree data={data} size="xs" />
      <JsonTree data={data} size="xl" />
    </Stack>
  );
}

export function WithTitle() {
  return (
    <Stack>
      <JsonTree data={data} />
      <JsonTree data={data} title="Convert.json" />
      <JsonTree data={data} title="Convert.json" styles={{ header: { backgroundColor: 'red' } }} />

      <JsonTree data={data} title={<Title order={2}>data.json</Title>} />
    </Stack>
  );
}

export function ContainerHeight() {
  return (
    <Stack h={100} style={{ border: '1px solid red' }}>
      <JsonTree data={data} />
    </Stack>
  );
}

export function WrapScrollArea() {
  return (
    <Stack style={{ border: '1px solid red' }}>
      <ScrollArea style={{ height: 200 }} type="scroll">
        <JsonTree data={data} />
      </ScrollArea>
    </Stack>
  );
}

export function WrapScrollAreaAndTitle() {
  return (
    <Stack style={{ border: '1px solid red' }} pos="relative">
      <ScrollArea style={{ height: 200 }} type="scroll">
        <JsonTree data={data} title="contact.json" withExpandAll />
      </ScrollArea>
    </Stack>
  );
}

export function WrapScrollAreaAndTitleStickyHeader() {
  return (
    <Stack style={{ border: '1px solid red' }} pos="relative">
      <ScrollArea style={{ height: 200 }} type="scroll">
        <JsonTree data={data} title="contact.json" withExpandAll stickyHeader />
      </ScrollArea>
    </Stack>
  );
}

export function WrapScrollAreaAndTitleStickyHeaderBgColor() {
  return (
    <Stack style={{ border: '1px solid red' }} pos="relative">
      <ScrollArea style={{ height: 200 }} type="scroll">
        <JsonTree bg="red" data={data} title="contact.json" withExpandAll stickyHeader />
      </ScrollArea>
    </Stack>
  );
}
