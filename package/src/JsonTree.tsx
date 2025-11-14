import React, { useMemo } from 'react';
import { IconLibraryMinus, IconLibraryPlus } from '@tabler/icons-react';
import {
  ActionIcon,
  Box,
  createVarsResolver,
  Factory,
  factory,
  getTreeExpandedState,
  Group,
  MantineSize,
  px,
  StylesApiProps,
  Tooltip,
  Tree,
  useMantineTheme,
  useProps,
  useStyles,
  useTree,
  type BoxProps,
} from '@mantine/core';
import { renderJSONNode } from './lib/render';
import { convertToTreeData, isExpandable, type JSONTreeNodeData } from './lib/utils';
import classes from './JsonTree.module.css';

export type JsonTreeDirection = 'clockwise' | 'counter-clockwise';

export type JsonTreeStylesNames = 'root';

export type JsonTreeCssVariables = {
  root: '--json-tree-padding';
};

export interface JsonTreeBaseProps {
  /** The data to display (object, array, or any JSON-serializable value) */
  data: any;

  /** Whether nodes should be expanded by default */
  defaultExpanded?: boolean;

  /** Maximum depth to auto-expand (0 = collapsed, -1 = expand all) */
  maxDepth?: number;

  /** Visual variant of the tree viewer */
  mode?: 'default' | 'compact';

  /** Callback when a node is clicked */
  onNodeClick?: (path: string, value: any) => void;

  /** Whether to show the root expand/collapse all button */
  showExpandAll?: boolean;
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
  maxDepth: 1,
  mode: 'default',
  showExpandAll: true,
};

const varsResolver = createVarsResolver<JsonTreeFactory>((_, { maxDepth }) => {
  return {
    root: {
      '--json-tree-padding': maxDepth.toString(),
    },
  };
});

export const JsonTree = factory<JsonTreeFactory>((_props, ref) => {
  const props = useProps('JsonTree', defaultProps, _props);

  const {
    data,
    defaultExpanded,
    maxDepth,
    mode,
    onNodeClick,
    showExpandAll,
    variant,

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

  const getSizeValue = (size: MantineSize | (string & {}) | number): number => {
    if (typeof size === 'string' && ['lg', 'xl', 'md', 'sm', 'xs'].includes(size)) {
      return {
        xl: 58,
        lg: 44,
        md: 36,
        sm: 22,
        xs: 18,
      }[size];
    }

    return px(size) as number;
  };

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

  return (
    <Box ref={ref} {...getStyles('root')} data-variant={variant} {...props}>
      {showExpandAll && isExpandable(data) && (
        <Group
          mt={-14}
          mr={-10}
          bg="dark.8"
          gap="xs"
          mb="sm"
          justify="flex-end"
          pos="sticky"
          style={{ top: 10, zIndex: 1, borderRadius: '8px' }}
        >
          <Tooltip zIndex={9999} label="Expand all nodes" withArrow withinPortal>
            <ActionIcon
              size="xs"
              variant="light"
              color="blue"
              onClick={() => tree.expandAllNodes()}
            >
              <IconLibraryPlus size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip zIndex={9999} label="Collapse all nodes" withArrow withinPortal>
            <ActionIcon
              size="xs"
              variant="light"
              color="blue"
              onClick={() => tree.collapseAllNodes()}
            >
              <IconLibraryMinus size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      )}
      <Tree
        data={treeData}
        tree={tree}
        levelOffset={32}
        renderNode={(payload) => renderJSONNode(payload, theme, onNodeClick)}
      />
    </Box>
  );
});

JsonTree.classes = classes;
JsonTree.displayName = 'JsonTree';
