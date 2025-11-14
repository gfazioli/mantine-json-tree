import React from 'react';
import { IconChevronDown, IconCopy } from '@tabler/icons-react';
import {
  ActionIcon,
  Badge,
  Code,
  Group,
  Text,
  Tooltip,
  type RenderTreeNodePayload,
} from '@mantine/core';
import { formatValue, type JSONTreeNodeData, type ValueType } from './utils';
import classes from '../JsonTree.module.css';

/**
 * Custom render function for Tree nodes with JSON formatting.
 */
export function renderJSONNode(
  { node, expanded, hasChildren, elementProps, tree }: RenderTreeNodePayload,
  theme: any,
  onNodeClick?: (path: string, value: any) => void
) {
  const jsonNode = node as JSONTreeNodeData;
  const { type, value, key, path, itemCount } = jsonNode.nodeData || {
    type: 'null' as ValueType,
    value: null,
    path: 'unknown',
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(JSON.stringify(value, null, 2));
      //   notifications.show({
      //     title: 'Copied',
      //     message: 'Value copied to clipboard',
      //     color: 'green',
      //   });
    } catch (error) {
      //   notifications.show({
      //     title: 'Error',
      //     message: 'Failed to copy to clipboard',
      //     color: 'red',
      //   });
    }
  };

  const handleClick = () => {
    if (onNodeClick) {
      onNodeClick(path, value);
    }
  };

  // Render primitive value
  if (!hasChildren) {
    return (
      <Group
        gap={4}
        wrap="nowrap"
        {...elementProps}
        onClick={handleClick}
        style={{ cursor: onNodeClick ? 'pointer' : 'default' }}
      >
        {key !== undefined && (
          <>
            <Text component="span" className={classes.key}>
              {key}
            </Text>
            <Text component="span" c="dimmed">
              :
            </Text>
          </>
        )}
        <Code className={classes.value} data-type={type}>
          {formatValue(value, type)}
        </Code>
        <Tooltip label="Copy value">
          <ActionIcon
            size="xs"
            variant="subtle"
            color="gray"
            onClick={handleCopy}
            className={classes.copyButton}
          >
            <IconCopy size={12} />
          </ActionIcon>
        </Tooltip>
      </Group>
    );
  }

  // Render expandable object/array
  const openBracket = type === 'array' ? '[' : '{';
  const closeBracket = type === 'array' ? ']' : '}';

  return (
    <Group
      gap={4}
      wrap="nowrap"
      {...elementProps}
      onClick={handleClick}
      style={{ cursor: onNodeClick ? 'pointer' : 'default' }}
    >
      <ActionIcon
        size="xs"
        variant="subtle"
        onClick={(e) => {
          e.stopPropagation();
          tree.toggleExpanded(node.value);
        }}
      >
        <IconChevronDown
          size={14}
          style={{
            transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)',
            transition: 'transform 0.2s ease',
          }}
        />
      </ActionIcon>

      {key !== undefined && (
        <>
          <Text component="span" className={classes.key}>
            {key}
          </Text>
          <Text component="span" c="dimmed">
            :
          </Text>
        </>
      )}

      <Text component="span" className={classes.bracket} c="dimmed">
        {openBracket}
      </Text>

      {!expanded && (
        <>
          <Text component="span" c="dimmed" size="xs">
            ...
          </Text>
          <Text component="span" className={classes.bracket} c="dimmed">
            {closeBracket}
          </Text>
          {itemCount !== undefined && (
            <Badge size="xs" variant="light" color="gray">
              {itemCount}
            </Badge>
          )}
        </>
      )}

      <Tooltip label="Copy value">
        <ActionIcon
          size="xs"
          variant="subtle"
          color="gray"
          onClick={handleCopy}
          className={classes.copyButton}
        >
          <IconCopy size={12} />
        </ActionIcon>
      </Tooltip>
    </Group>
  );
}
