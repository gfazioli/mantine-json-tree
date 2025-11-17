import React, { useMemo } from 'react';
import { IconChevronDown, IconCopy, IconLibraryMinus, IconLibraryPlus } from '@tabler/icons-react';
import {
  ActionIcon,
  Badge,
  Box,
  Code,
  createVarsResolver,
  Factory,
  factory,
  getFontSize,
  getTreeExpandedState,
  Group,
  MantineSize,
  rem,
  StylesApiProps,
  Text,
  Tree,
  useMantineTheme,
  useProps,
  useStyles,
  useTree,
  type BoxProps,
  type MantineTheme,
  type RenderTreeNodePayload,
} from '@mantine/core';
import {
  convertToTreeData,
  formatValue,
  isExpandable,
  type JSONTreeNodeData,
  type ValueType,
} from './lib/utils';
import classes from './JsonTree.module.css';

export type JsonTreeDirection = 'clockwise' | 'counter-clockwise';

export type JsonTreeStylesNames =
  | 'root'
  | 'header'
  | 'key'
  | 'value'
  | 'bracket'
  | 'indentGuide'
  | 'copyButton';

export type JsonTreeCssVariables = {
  root: '--json-tree-font-family' | '--json-tree-font-size';
  header: '--json-tree-header-background-color' | '--json-tree-header-sticky-offset';
  key: '--json-tree-color-key';
  value:
    | '--json-tree-value-font-family'
    | '--json-tree-color-string'
    | '--json-tree-color-number'
    | '--json-tree-color-boolean'
    | '--json-tree-color-null';
  bracket: '--json-tree-color-bracket';
  indentGuide:
    | '--json-tree-indent-guide-color-0'
    | '--json-tree-indent-guide-color-1'
    | '--json-tree-indent-guide-color-2'
    | '--json-tree-indent-guide-color-3'
    | '--json-tree-indent-guide-color-4';
  copyButton: never;
};

export interface JsonTreeBaseProps {
  /** The data to display (object, array, or any JSON-serializable value) */
  data: unknown;

  /** Whether nodes should be expanded by default @default false */
  defaultExpanded?: boolean;

  /** Maximum depth to auto-expand (0 = collapsed, -1 = expand all) @default 2 */
  maxDepth?: number;

  /** Callback when a node is clicked */
  onNodeClick?: (path: string, value: any) => void;

  /** Callback when a value is copied to clipboard */
  onCopy?: (copy: string, value: unknown) => void;

  /** Whether to show the root expand/collapse all button @default false */
  withExpandAll?: boolean;

  /** Size of the font @default 'xs' */
  size?: MantineSize | (string & {}) | number;

  /** Title displayed above the JSON tree  */
  title?: React.ReactNode;

  /** Whether to show item counts for objects and arrays @default false */
  showItemsCount?: boolean;

  /** Whether to show a copy to clipboard button for each node @default false */
  withCopyToClipboard?: boolean;

  /** Whether to show indent guides (vertical lines) for nested nodes @default false */
  showIndentGuides?: boolean;

  /** If set, the header is sticky @default `false` */
  stickyHeader?: boolean;

  /** Offset for the sticky header (e.g. to account for a fixed navbar) @default 0*/
  stickyHeaderOffset?: number | string;
}

export interface JsonTreeProps
  extends BoxProps,
    JsonTreeBaseProps,
    StylesApiProps<JsonTreeFactory> {}

export type JsonTreeFactory = Factory<{
  props: JsonTreeProps;
  ref: HTMLDivElement;
  stylesNames: JsonTreeStylesNames;
  vars: JsonTreeCssVariables;
}>;

export const defaultProps: Partial<JsonTreeProps> = {
  defaultExpanded: false,
  maxDepth: 2,
  withExpandAll: false,
  showItemsCount: false,
  withCopyToClipboard: false,
  showIndentGuides: false,
  stickyHeader: false,
};

const varsResolver = createVarsResolver<JsonTreeFactory>(
  (_, { size, stickyHeader, stickyHeaderOffset }) => {
    return {
      root: {
        '--json-tree-font-family': 'var(--mantine-font-family-monospace)',
        '--json-tree-font-size': getFontSize(size) || 'var(--mantine-font-size-xs)',
      },
      header: {
        '--json-tree-header-background-color': 'inherit',
        '--json-tree-header-sticky-offset': stickyHeader ? rem(stickyHeaderOffset) : undefined,
      },
      key: {
        '--json-tree-color-key': 'var(--mantine-color-blue-5)',
      },
      value: {
        '--json-tree-value-font-family': 'var(--mantine-font-family-monospace)',
        '--json-tree-color-string': 'var(--mantine-color-green-7)',
        '--json-tree-color-number': 'var(--mantine-color-violet-7)',
        '--json-tree-color-boolean': 'var(--mantine-color-orange-7)',
        '--json-tree-color-null': 'var(--mantine-color-gray-6)',
      },
      bracket: { '--json-tree-color-bracket': 'var(--mantine-color-gray-5)' },
      indentGuide: {
        '--json-tree-indent-guide-color-0': 'var(--mantine-color-blue-4)',
        '--json-tree-indent-guide-color-1': 'var(--mantine-color-lime-4)',
        '--json-tree-indent-guide-color-2': 'var(--mantine-color-violet-4)',
        '--json-tree-indent-guide-color-3': 'var(--mantine-color-green-4)',
        '--json-tree-indent-guide-color-4': 'var(--mantine-color-lime-4)',
      },
      copyButton: {},
    };
  }
);

export const JsonTree = factory<JsonTreeFactory>((_props, ref) => {
  const props = useProps('JsonTree', defaultProps, _props);

  const {
    data,
    defaultExpanded,
    maxDepth,
    onNodeClick,
    onCopy,
    withExpandAll,
    variant,
    title,
    showItemsCount,
    withCopyToClipboard,
    showIndentGuides,
    stickyHeaderOffset,
    stickyHeader,

    classNames,
    style,
    styles,
    unstyled,
    vars,
    className,

    ...others
  } = props;

  const getStyles = useStyles<JsonTreeFactory>({
    name: 'JsonTree',
    props,
    classes,
    className,
    style,
    classNames,
    styles,
    unstyled,
    vars,
    varsResolver,
  });

  const theme = useMantineTheme();

  // Convert JSON data to Mantine Tree format
  const treeData = useMemo(() => [convertToTreeData(data)], [data]);

  // Calculate initial expanded state based on maxDepth
  const initialExpandedState = useMemo(() => {
    if (defaultExpanded) {
      // Expand all nodes if maxDepth is -1
      if (maxDepth === -1) {
        return getTreeExpandedState(treeData, '*');
      }

      // Otherwise, expand nodes up to maxDepth
      const expandedNodes: string[] = [];
      const traverse = (nodes: JSONTreeNodeData[], depth: number) => {
        nodes.forEach((node) => {
          if (depth < maxDepth && node.children) {
            expandedNodes.push(node.value);
            traverse(node.children as JSONTreeNodeData[], depth + 1);
          }
        });
      };
      traverse(treeData, 0);
      return getTreeExpandedState(treeData, expandedNodes);
    }
    return {};
  }, [treeData, defaultExpanded, maxDepth]);

  const tree = useTree({
    initialExpandedState,
  });

  function renderJSONNode(
    { node, expanded, hasChildren, elementProps, tree }: RenderTreeNodePayload,
    _: MantineTheme,
    props: JsonTreeProps,
    onNodeClick?: (path: string, value: any) => void
  ) {
    const jsonNode = node as JSONTreeNodeData;

    const {
      type,
      value,
      key,
      path,
      itemCount,
      depth = 0,
    } = jsonNode.nodeData || {
      type: 'null' as ValueType,
      value: null,
      path: 'unknown',
      depth: 0,
    };

    const { showItemsCount, withCopyToClipboard, onCopy, showIndentGuides } = props;

    const handleCopy = async (e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        const copy = JSON.stringify(value, null, 2);
        await navigator.clipboard.writeText(copy);
        onCopy?.(copy, value);
      } catch (error) {
        // =jon= future use: Handle copy error if needed
      }
    };

    const handleClick = () => {
      if (onNodeClick) {
        onNodeClick(path, value);
      }
    };

    // Render indent guides (vertical lines)
    const renderIndentGuides = () => {
      if (!showIndentGuides || depth === 0) {
        return null;
      }

      const guides = [];
      for (let i = 0; i < depth; i++) {
        const colorIndex = i % 5;
        guides.push(
          <div
            key={i}
            {...getStyles('indentGuide')}
            data-color-index={colorIndex}
            style={{
              left: `${i * 32 + 8}px`,
            }}
          />
        );
      }
      return guides;
    };

    // Render primitive value
    if (!hasChildren) {
      return (
        <Group
          gap={4}
          wrap="nowrap"
          {...elementProps}
          onClick={handleClick}
          style={{ cursor: onNodeClick ? 'pointer' : 'default', position: 'relative' }}
        >
          {renderIndentGuides()}
          {key !== undefined && (
            <>
              <Text component="span" {...getStyles('key')}>
                {key}
              </Text>
              <Text component="span" c="dimmed">
                :
              </Text>
            </>
          )}
          <Code {...getStyles('value')} data-type={type}>
            {formatValue(value, type)}
          </Code>

          {withCopyToClipboard && (
            <ActionIcon
              size="xs"
              variant="subtle"
              color="gray"
              onClick={handleCopy}
              {...getStyles('copyButton')}
            >
              <IconCopy size={12} />
            </ActionIcon>
          )}
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
        data-expanded={expanded}
        data-has-children={hasChildren}
        data-type={type}
        style={{ cursor: onNodeClick ? 'pointer' : 'default', position: 'relative' }}
      >
        {renderIndentGuides()}
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
            <Text component="span" {...getStyles('key')}>
              {key}
            </Text>
            <Text component="span" c="dimmed">
              :
            </Text>
          </>
        )}

        <Text component="span" {...getStyles('bracket')}>
          {openBracket}
        </Text>

        {!expanded && (
          <>
            <Text component="span" c="dimmed" size="xs">
              ...
            </Text>
            <Text component="span" {...getStyles('bracket')}>
              {closeBracket}
            </Text>
            {itemCount !== undefined && showItemsCount && (
              <Badge size="xs" variant="light" color="gray">
                {itemCount}
              </Badge>
            )}
          </>
        )}

        {withCopyToClipboard && (
          <ActionIcon
            size="xs"
            variant="subtle"
            color="gray"
            onClick={handleCopy}
            {...getStyles('copyButton')}
          >
            <IconCopy size={12} />
          </ActionIcon>
        )}
      </Group>
    );
  }

  return (
    <Box ref={ref} {...getStyles('root')} {...others}>
      {(title || withExpandAll) && (
        <Group {...getStyles('header')} justify="space-between" mod={{ sticky: stickyHeader }}>
          {title || <div />}
          {withExpandAll && isExpandable(data) && (
            <Group gap="xs" style={{ top: 10, zIndex: 1, borderRadius: '8px' }}>
              <ActionIcon size="xs" variant="transparent" onClick={() => tree.expandAllNodes()}>
                <IconLibraryPlus size={16} />
              </ActionIcon>

              <ActionIcon size="xs" variant="transparent" onClick={() => tree.collapseAllNodes()}>
                <IconLibraryMinus size={16} />
              </ActionIcon>
            </Group>
          )}
        </Group>
      )}
      <Tree
        data={treeData}
        tree={tree}
        levelOffset={32}
        renderNode={(payload) => renderJSONNode(payload, theme, props, onNodeClick)}
      />
    </Box>
  );
});

JsonTree.classes = classes;
JsonTree.displayName = 'JsonTree';
