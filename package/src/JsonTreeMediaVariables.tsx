import React from 'react';
import {
  filterProps,
  getBaseValue,
  getFontSize,
  getSortedBreakpoints,
  InlineStyles,
  keys,
  MantineBreakpoint,
  MantineSize,
  useMantineTheme,
  type StyleProp,
} from '@mantine/core';

interface JsonTreeMediaVariablesProps {
  size?: StyleProp<MantineSize | (string & {}) | number>;
  selector: string;
}

export function JsonTreeMediaVariables({ size, selector }: JsonTreeMediaVariablesProps) {
  const theme = useMantineTheme();

  const baseStyles: Record<string, string | undefined> = filterProps({
    '--json-tree-font-size': getFontSize(getBaseValue(size)) || 'var(--mantine-font-size-xs)',
  });

  const queries = keys(theme.breakpoints).reduce<Record<string, Record<string, string>>>(
    (acc, breakpoint) => {
      if (!acc[breakpoint]) {
        acc[breakpoint] = {};
      }

      if (typeof size === 'object' && size[breakpoint] !== undefined) {
        const resolved = getFontSize(size[breakpoint]);
        if (resolved) {
          acc[breakpoint]['--json-tree-font-size'] = resolved;
        }
      }

      return acc;
    },
    {}
  );

  const sortedBreakpoints = getSortedBreakpoints(keys(queries), theme.breakpoints).filter(
    (breakpoint) => keys(queries[breakpoint.value]).length > 0
  );

  const media = sortedBreakpoints.map((breakpoint) => ({
    query: `(min-width: ${theme.breakpoints[breakpoint.value as MantineBreakpoint]})`,
    styles: queries[breakpoint.value],
  }));

  return <InlineStyles styles={baseStyles} media={media} selector={selector} />;
}
