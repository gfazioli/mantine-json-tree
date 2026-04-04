import React, { useCallback, useEffect, useMemo } from 'react';
import { IconChevronRight, IconCopy, IconLibraryMinus, IconLibraryPlus } from '@tabler/icons-react';
import {
  ActionIcon,
  Badge,
  Box,
  Code,
  createVarsResolver,
  Factory,
  factory,
  getTreeExpandedState,
  Group,
  MantineSize,
  rem,
  ScrollArea,
  StylesApiProps,
  Text,
  Tooltip,
  Tree,
  useProps,
  useRandomClassName,
  useStyles,
  useTree,
  type BoxProps,
  type RenderTreeNodePayload,
  type StyleProp,
  type TooltipProps,
} from '@mantine/core';
import { JsonTreeMediaVariables } from './JsonTreeMediaVariables';
import {
  convertToTreeData,
  findNodeByPath,
  formatValue,
  isExpandable,
  type JSONTreeNodeData,
  type ValueType,
} from './lib/utils';
import classes from './JsonTree.module.css';

export type JsonTreeStylesNames =
  | 'root'
  | 'header'
  | 'controls'
  | 'expandCollapse'
  | 'key'
  | 'keyValueSeparator'
  | 'value'
  | 'bracket'
  | 'ellipsis'
  | 'itemsCount'
  | 'indentGuide'
  | 'copyButton'
  | 'lineNumber';

export type JsonTreeCssVariables = {
  root: '--json-tree-font-family' | '--json-tree-font-size';
  header: '--json-tree-header-background-color' | '--json-tree-header-sticky-offset';
  key: '--json-tree-color-key';
  value:
    | '--json-tree-color-string'
    | '--json-tree-color-number'
    | '--json-tree-color-boolean'
    | '--json-tree-color-null'
    | '--json-tree-color-function'
    | '--json-tree-color-react-element'
    | '--json-tree-color-date'
    | '--json-tree-color-nan'
    | '--json-tree-color-infinity'
    | '--json-tree-color-bigint'
    | '--json-tree-color-symbol'
    | '--json-tree-color-regexp'
    | '--json-tree-color-map'
    | '--json-tree-color-set';
  bracket: '--json-tree-color-bracket';
  indentGuide:
    | '--json-tree-indent-guide-color-0'
    | '--json-tree-indent-guide-color-1'
    | '--json-tree-indent-guide-color-2'
    | '--json-tree-indent-guide-color-3'
    | '--json-tree-indent-guide-color-4';
  expandCollapse: never;
  ellipsis: '--json-tree-color-ellipsis';
  lineNumber: '--json-tree-color-line-number';
  itemsCount: never;
  controls: never;
  keyValueSeparator: never;
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

  /** Callback when a node is expanded */
  onExpand?: (path: string) => void;

  /** Callback when a node is collapsed */
  onCollapse?: (path: string) => void;

  /** Whether to show the root expand/collapse all button @default false */
  withExpandAll?: boolean;

  /** Size of the font, supports responsive object @default 'xs' */
  size?: StyleProp<MantineSize | (string & {}) | number>;

  /** Title displayed above the JSON tree  */
  title?: React.ReactNode;

  /** Whether to show item counts for objects and arrays @default false */
  showItemsCount?: boolean;

  /** Whether to show a copy to clipboard button for each node @default false */
  withCopyToClipboard?: boolean;

  /** Whether to show indent guides (vertical lines) for nested nodes @default false */
  showIndentGuides?: boolean;

  /** Whether to show line numbers @default false */
  showLineNumbers?: boolean;

  /** Whether to show the full JSON path in a tooltip on hover @default false */
  showPathOnHover?: boolean;

  /** Props passed to the Tooltip component when showPathOnHover is enabled */
  tooltipProps?: Omit<TooltipProps, 'label' | 'children'>;

  /** Maximum height of the tree, enables scrolling when content exceeds this value */
  maxHeight?: React.CSSProperties['maxHeight'];

  /** Controlled expanded state (array of node paths that are expanded) */
  expanded?: string[];

  /** Callback when expanded state changes */
  onExpandedChange?: (expanded: string[]) => void;

  /** If set, the header is sticky @default `false` */
  stickyHeader?: boolean;

  /** Offset for the sticky header (e.g. to account for a fixed navbar) @default 0*/
  stickyHeaderOffset?: number | string;

  /** Icon for expand button */
  expandControlIcon?: React.ReactNode;

  /** Icon for collapse button */
  collapseControlIcon?: React.ReactNode;

  /** Icon for expand all control */
  expandAllControlIcon?: React.ReactNode;

  /** Icon for collapse all control */
  collapseAllControlIcon?: React.ReactNode;

  /** Icon for copy to clipboard button */
  copyToClipboardIcon?: React.ReactNode;

  /** How to display functions in the JSON data @default 'as-string' */
  displayFunctions?: JsonTreeFunctionDisplay;
}

/** Display mode for functions in JSON data */
export type JsonTreeFunctionDisplay = 'as-string' | 'hide' | 'as-object';

export interface JsonTreeProps
  extends BoxProps, JsonTreeBaseProps, StylesApiProps<JsonTreeFactory> {}

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
  showLineNumbers: false,
  showPathOnHover: false,
  stickyHeader: false,
  displayFunctions: 'as-string',
  expandAllControlIcon: <IconLibraryPlus size={16} />,
  collapseAllControlIcon: <IconLibraryMinus size={16} />,
  copyToClipboardIcon: <IconCopy size={12} />,
};

interface RenderNodeContext {
  getStyles: ReturnType<typeof useStyles<JsonTreeFactory>>;
  copyToClipboardIcon: React.ReactNode;
  expandControlIcon: React.ReactNode;
  collapseControlIcon: React.ReactNode;
  onExpand?: (path: string) => void;
  onCollapse?: (path: string) => void;
  onExpandedChange?: (expanded: string[]) => void;
}

function renderJSONNode(
  { node, expanded, hasChildren, elementProps, tree }: RenderTreeNodePayload,
  props: JsonTreeProps,
  ctx: RenderNodeContext,
  onNodeClick?: (path: string, value: any) => void
) {
  const {
    getStyles,
    copyToClipboardIcon,
    expandControlIcon,
    collapseControlIcon,
    onExpand,
    onCollapse,
    onExpandedChange,
  } = ctx;
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

  const {
    showItemsCount,
    withCopyToClipboard,
    onCopy,
    showIndentGuides,
    showLineNumbers,
    showPathOnHover,
    tooltipProps,
  } = props;

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const copy = JSON.stringify(value, null, 2);
      await navigator.clipboard.writeText(copy);
      onCopy?.(copy, value);
    } catch (error) {
      // Clipboard write may fail silently in unsupported contexts
    }
  };

  const handleClick = () => {
    if (onNodeClick) {
      onNodeClick(path, value);
    }
  };

  const handleToggleExpanded = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (expanded) {
      onCollapse?.(node.value);
    } else {
      onExpand?.(node.value);
    }

    if (onExpandedChange) {
      // In controlled mode, derive next state and let parent update via onExpandedChange.
      // tree.toggleExpanded is not called — the useEffect will sync from the new prop.
      const newState = { ...tree.expandedState, [node.value]: !expanded };
      onExpandedChange(Object.keys(newState).filter((k) => newState[k]));
    } else {
      // In uncontrolled mode, mutate internal tree state directly
      tree.toggleExpanded(node.value);
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
          {...getStyles('indentGuide', {
            style: {
              left: `${i * 32 + 8}px`,
            },
          })}
          data-color-index={colorIndex}
        />
      );
    }
    return guides;
  };

  const lineNumber = showLineNumbers ? <span {...getStyles('lineNumber')} /> : null;

  const wrapWithTooltip = (content: React.ReactElement) =>
    showPathOnHover ? (
      <Tooltip label={path} position="top-start" withArrow openDelay={300} {...tooltipProps}>
        {content}
      </Tooltip>
    ) : (
      content
    );

  // Render primitive value
  if (!hasChildren) {
    return wrapWithTooltip(
      <Group
        gap={4}
        wrap="nowrap"
        {...elementProps}
        onClick={handleClick}
        style={{ cursor: onNodeClick ? 'pointer' : 'default', position: 'relative' }}
      >
        {lineNumber}
        {renderIndentGuides()}
        {key !== undefined && (
          <>
            <Text component="span" {...getStyles('key')} data-key={key}>
              {key}
            </Text>
            <Text component="span" {...getStyles('keyValueSeparator')}>
              :
            </Text>
          </>
        )}
        {(() => {
          const formattedValue = formatValue(value, type);
          return (
            <Code {...getStyles('value')} data-type={type} data-value={formattedValue}>
              {formattedValue}
            </Code>
          );
        })()}

        {withCopyToClipboard && (
          <ActionIcon
            size="xs"
            variant="subtle"
            color="gray"
            onClick={handleCopy}
            {...getStyles('copyButton')}
          >
            {copyToClipboardIcon}
          </ActionIcon>
        )}
      </Group>
    );
  }

  // Render expandable object/array
  const openBracket = type === 'array' ? '[' : '{';
  const closeBracket = type === 'array' ? ']' : '}';

  const expandCollapseIcon = (() => {
    if (!expandControlIcon && !collapseControlIcon) {
      return (
        <IconChevronRight
          size={14}
          style={{
            transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        />
      );
    }

    if (expandControlIcon && !collapseControlIcon) {
      return React.cloneElement(expandControlIcon as React.ReactElement<any>, {
        style: {
          ...(expandControlIcon as React.ReactElement<any>).props?.style,
          transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease',
        },
      });
    }

    if (!expandControlIcon && collapseControlIcon) {
      return expanded ? collapseControlIcon : <IconChevronRight size={14} />;
    }
    return expanded ? collapseControlIcon : expandControlIcon;
  })();

  return wrapWithTooltip(
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
      {lineNumber}
      {renderIndentGuides()}
      <ActionIcon
        size="xs"
        variant="subtle"
        onClick={handleToggleExpanded}
        {...getStyles('expandCollapse')}
      >
        {expandCollapseIcon}
      </ActionIcon>

      {key !== undefined && (
        <>
          <Text component="span" {...getStyles('key')}>
            {key}
          </Text>
          <Text component="span" {...getStyles('keyValueSeparator')}>
            :
          </Text>
        </>
      )}

      <Text component="span" {...getStyles('bracket')}>
        {openBracket}
      </Text>

      {!expanded && (
        <>
          <Text component="span" size="xs" {...getStyles('ellipsis')}>
            ...
          </Text>
          <Text component="span" {...getStyles('bracket')}>
            {closeBracket}
          </Text>
          {itemCount !== undefined && showItemsCount && (
            <Badge size="xs" variant="light" color="gray" {...getStyles('itemsCount')}>
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
          {copyToClipboardIcon}
        </ActionIcon>
      )}
    </Group>
  );
}

const varsResolver = createVarsResolver<JsonTreeFactory>(
  (_, { stickyHeader, stickyHeaderOffset }) => {
    return {
      root: {
        '--json-tree-font-family': 'var(--mantine-font-family-monospace)',
        '--json-tree-font-size': undefined,
      },
      header: {
        '--json-tree-header-background-color': 'inherit',
        '--json-tree-header-sticky-offset': stickyHeader ? rem(stickyHeaderOffset) : undefined,
      },
      key: {
        '--json-tree-color-key': 'var(--mantine-color-blue-5)',
      },
      value: {
        '--json-tree-color-string': 'var(--mantine-color-green-7)',
        '--json-tree-color-number': 'var(--mantine-color-violet-7)',
        '--json-tree-color-boolean': 'var(--mantine-color-orange-7)',
        '--json-tree-color-null': 'var(--mantine-color-gray-6)',
        '--json-tree-color-function': 'var(--mantine-color-cyan-7)',
        '--json-tree-color-react-element': 'var(--mantine-color-pink-7)',
        '--json-tree-color-date': 'var(--mantine-color-teal-7)',
        '--json-tree-color-nan': 'var(--mantine-color-red-7)',
        '--json-tree-color-infinity': 'var(--mantine-color-red-7)',
        '--json-tree-color-bigint': 'var(--mantine-color-indigo-7)',
        '--json-tree-color-symbol': 'var(--mantine-color-yellow-7)',
        '--json-tree-color-regexp': 'var(--mantine-color-lime-7)',
        '--json-tree-color-map': 'var(--mantine-color-grape-7)',
        '--json-tree-color-set': 'var(--mantine-color-grape-7)',
      },
      bracket: { '--json-tree-color-bracket': 'var(--mantine-color-gray-5)' },
      indentGuide: {
        '--json-tree-indent-guide-color-0': 'var(--mantine-color-blue-4)',
        '--json-tree-indent-guide-color-1': 'var(--mantine-color-lime-4)',
        '--json-tree-indent-guide-color-2': 'var(--mantine-color-violet-4)',
        '--json-tree-indent-guide-color-3': 'var(--mantine-color-green-4)',
        '--json-tree-indent-guide-color-4': 'var(--mantine-color-lime-4)',
      },
      expandCollapse: {},
      keyValueSeparator: {},
      ellipsis: { '--json-tree-color-ellipsis': 'var(--mantine-color-dark-3)' },
      lineNumber: { '--json-tree-color-line-number': 'var(--mantine-color-gray-5)' },
      itemsCount: {},
      controls: {},
      copyButton: {},
    };
  }
);

export const JsonTree = factory<JsonTreeFactory>((_props) => {
  const props = useProps('JsonTree', defaultProps, _props);

  const {
    data,
    defaultExpanded,
    maxDepth,
    onNodeClick,
    onCopy,
    onExpand,
    onCollapse,
    withExpandAll,
    title,
    showItemsCount,
    withCopyToClipboard,
    showIndentGuides,
    showLineNumbers,
    showPathOnHover,
    tooltipProps,
    maxHeight,
    expanded: controlledExpanded,
    onExpandedChange,
    stickyHeaderOffset,
    stickyHeader,
    displayFunctions,
    expandAllControlIcon,
    collapseAllControlIcon,
    copyToClipboardIcon,
    expandControlIcon,
    collapseControlIcon,
    size,

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

  const responsiveClassName = useRandomClassName();

  // Convert JSON data to Mantine Tree format
  const treeData = useMemo(
    () => [convertToTreeData(data, undefined, 'root', 0, displayFunctions)],
    [data, displayFunctions]
  );

  // Calculate initial expanded state — use controlled prop if provided
  const initialExpandedState = useMemo(() => {
    if (controlledExpanded) {
      const state: Record<string, boolean> = {};
      controlledExpanded.forEach((path) => {
        state[path] = true;
      });
      return state;
    }

    if (defaultExpanded) {
      if (maxDepth === -1) {
        return getTreeExpandedState(treeData, '*');
      }

      const expandedNodes: string[] = [];
      const traverse = (nodes: JSONTreeNodeData[], depth: number) => {
        nodes.forEach((node) => {
          if (depth < (maxDepth ?? Infinity) && node.children) {
            expandedNodes.push(node.value);
            traverse(node.children as JSONTreeNodeData[], depth + 1);
          }
        });
      };
      traverse(treeData, 0);
      return getTreeExpandedState(treeData, expandedNodes);
    }
    return {};
  }, [treeData, defaultExpanded, maxDepth, controlledExpanded]);

  const tree = useTree({
    initialExpandedState,
  });

  // Sync controlled expanded state
  useEffect(() => {
    if (controlledExpanded) {
      const state: Record<string, boolean> = {};
      controlledExpanded.forEach((path) => {
        state[path] = true;
      });
      tree.setExpandedState(state);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- tree.setExpandedState changes on every render; using tree would cause infinite loop
  }, [controlledExpanded]);

  // Keyboard handler for Ctrl+C copy on focused node
  const handleKeyDown = useCallback(
    async (e: React.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'c' && withCopyToClipboard) {
        e.preventDefault();
        const focused = (e.currentTarget as HTMLElement).querySelector(
          '[data-value][tabindex="0"], [data-value]:focus'
        );
        if (focused) {
          const nodePath = focused.getAttribute('data-value');
          if (nodePath) {
            const nodeData = findNodeByPath(treeData, nodePath);
            if (nodeData?.nodeData) {
              try {
                const copy = JSON.stringify(nodeData.nodeData.value, null, 2);
                await navigator.clipboard.writeText(copy);
                onCopy?.(copy, nodeData.nodeData.value);
              } catch {
                // Clipboard write may fail silently in unsupported contexts
              }
            }
          }
        }
      }
    },
    [withCopyToClipboard, treeData, onCopy]
  );

  const renderCtx: RenderNodeContext = {
    getStyles,
    copyToClipboardIcon,
    expandControlIcon,
    collapseControlIcon,
    onExpand,
    onCollapse,
    onExpandedChange,
  };

  const treeComponent = (
    <Tree
      data={treeData}
      tree={tree}
      levelOffset={32}
      renderNode={(payload) => renderJSONNode(payload, props, renderCtx, onNodeClick)}
    />
  );

  return (
    <>
      <JsonTreeMediaVariables size={size} selector={`.${responsiveClassName}`} />
      <Box
        {...getStyles('root', { className: responsiveClassName })}
        {...others}
        data-line-numbers={showLineNumbers || undefined}
        onKeyDown={handleKeyDown}
      >
        {(title || withExpandAll) && (
          <Group {...getStyles('header')} justify="space-between" mod={{ sticky: stickyHeader }}>
            {title || <div />}
            {withExpandAll && isExpandable(data) && (
              <Group gap="xs" style={{ top: 10, zIndex: 1 }}>
                <ActionIcon
                  size="xs"
                  variant="transparent"
                  onClick={() => {
                    const allState = getTreeExpandedState(treeData, '*');
                    if (onExpandedChange) {
                      onExpandedChange(Object.keys(allState).filter((k) => allState[k]));
                    } else {
                      tree.expandAllNodes();
                    }
                  }}
                  {...getStyles('controls')}
                >
                  {expandAllControlIcon}
                </ActionIcon>

                <ActionIcon
                  size="xs"
                  variant="transparent"
                  onClick={() => {
                    if (onExpandedChange) {
                      onExpandedChange([]);
                    } else {
                      tree.collapseAllNodes();
                    }
                  }}
                  {...getStyles('controls')}
                >
                  {collapseAllControlIcon}
                </ActionIcon>
              </Group>
            )}
          </Group>
        )}
        {maxHeight ? (
          <ScrollArea.Autosize mah={maxHeight}>{treeComponent}</ScrollArea.Autosize>
        ) : (
          treeComponent
        )}
      </Box>
    </>
  );
});

JsonTree.classes = classes;
JsonTree.displayName = 'JsonTree';
