import { type TreeNodeData } from '@mantine/core';
import type { JsonTreeFunctionDisplay } from '../JsonTree';

export interface JSONTreeNodeData extends TreeNodeData {
  nodeData?: {
    type: ValueType;
    value: any;
    key?: string;
    path: string;
    itemCount?: number;
    depth?: number;
  };
}

/**
 * Type of a JSON value for rendering purposes.
 */
export type ValueType =
  | 'object'
  | 'array'
  | 'string'
  | 'number'
  | 'boolean'
  | 'null'
  | 'undefined'
  | 'function'
  | 'react-element'
  | 'date'
  | 'nan'
  | 'infinity'
  | 'bigint'
  | 'symbol'
  | 'regexp'
  | 'map'
  | 'set';

/**
 * Check if a value is a React element.
 */
function isReactElement(value: any): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value.$$typeof === Symbol.for('react.element') ||
      value.$$typeof === Symbol.for('react.transitional.element') ||
      (typeof value.type !== 'undefined' && typeof value.props !== 'undefined'))
  );
}

/**
 * Get the type of a value for display purposes.
 */
export function getValueType(value: any): ValueType {
  if (value === null) {
    return 'null';
  }
  if (value === undefined) {
    return 'undefined';
  }
  if (typeof value === 'number') {
    if (Number.isNaN(value)) {
      return 'nan';
    }
    if (!Number.isFinite(value)) {
      return 'infinity';
    }
    return 'number';
  }
  if (isReactElement(value)) {
    return 'react-element';
  }
  if (value instanceof Date) {
    return 'date';
  }
  if (value instanceof RegExp) {
    return 'regexp';
  }
  if (value instanceof Map) {
    return 'map';
  }
  if (value instanceof Set) {
    return 'set';
  }
  if (typeof value === 'bigint') {
    return 'bigint';
  }
  if (typeof value === 'symbol') {
    return 'symbol';
  }
  if (Array.isArray(value)) {
    return 'array';
  }
  if (typeof value === 'function') {
    return 'function';
  }
  return typeof value as ValueType;
}

/**
 * Check if a value is expandable (object or array with content).
 */
export function isExpandable(value: any): boolean {
  const type = getValueType(value);
  if (type === 'object') {
    return Object.keys(value).length > 0;
  }
  if (type === 'array') {
    return value.length > 0;
  }
  if (type === 'map') {
    return value.size > 0;
  }
  if (type === 'set') {
    return value.size > 0;
  }
  return false;
}

/**
 * Format a primitive value for display.
 */
export function formatValue(value: any, type: ValueType): string {
  if (type === 'string') {
    return `"${value}"`;
  }
  if (type === 'null') {
    return 'null';
  }
  if (type === 'undefined') {
    return 'undefined';
  }
  if (type === 'nan') {
    return 'NaN';
  }
  if (type === 'infinity') {
    return value > 0 ? 'Infinity' : '-Infinity';
  }
  if (type === 'function') {
    const name = value.name;
    return name ? `[Function: ${name}]` : '[Function]';
  }
  if (type === 'react-element') {
    const componentName = value.type?.displayName || value.type?.name || value.type;
    return `<${typeof componentName === 'string' ? componentName : 'Component'} />`;
  }
  if (type === 'date') {
    return value.toISOString();
  }
  if (type === 'bigint') {
    return `${value}n`;
  }
  if (type === 'symbol') {
    return value.toString();
  }
  if (type === 'regexp') {
    return value.toString();
  }
  if (type === 'map') {
    return `Map(${value.size})`;
  }
  if (type === 'set') {
    return `Set(${value.size})`;
  }
  return String(value);
}

/**
 * Get the count of items in an object or array.
 */
export function getItemCount(value: any): number {
  if (Array.isArray(value)) {
    return value.length;
  }
  if (value instanceof Map || value instanceof Set) {
    return value.size;
  }
  if (typeof value === 'object' && value !== null) {
    return Object.keys(value).length;
  }
  return 0;
}

/**
 * Convert JSON data to Mantine Tree format.
 */
export function convertToTreeData(
  value: any,
  key?: string,
  path: string = 'root',
  depth: number = 0,
  displayFunctions: JsonTreeFunctionDisplay = 'as-string'
): JSONTreeNodeData {
  const type = getValueType(value);

  // Handle React elements as primitive values to avoid circular reference issues
  if (type === 'react-element') {
    return {
      value: path,
      label: key || 'root',
      nodeData: { type, value, key, path, depth },
    };
  }

  // Handle Date, BigInt, Symbol, RegExp, NaN, Infinity as primitive values
  if (
    type === 'date' ||
    type === 'bigint' ||
    type === 'symbol' ||
    type === 'regexp' ||
    type === 'nan' ||
    type === 'infinity'
  ) {
    return {
      value: path,
      label: key || 'root',
      nodeData: { type, value, key, path, depth },
    };
  }

  // Handle functions based on displayFunctions setting
  if (type === 'function') {
    if (displayFunctions === 'hide') {
      // Return null to skip this node (will be filtered later)
      return null as any;
    }
    if (displayFunctions === 'as-string') {
      // Treat as primitive string value
      return {
        value: path,
        label: key || 'root',
        nodeData: { type, value, key, path, depth },
      };
    }
    // displayFunctions === 'as-object': treat function as object to show its properties
    const functionProps = Object.getOwnPropertyNames(value).reduce(
      (acc, prop) => {
        acc[prop] = value[prop];
        return acc;
      },
      {} as Record<string, any>
    );
    return convertToTreeData(functionProps, key, path, depth, displayFunctions);
  }

  const expandable = isExpandable(value);
  const nodeValue = path;

  if (!expandable) {
    return {
      value: nodeValue,
      label: key || 'root',
      nodeData: { type, value, key, path, depth },
    };
  }

  let entries: [string, any][] = [];
  if (type === 'array') {
    entries = value.map((item: any, index: number) => [String(index), item] as [string, any]);
  } else if (type === 'map') {
    entries = Array.from(value.entries()).map(
      ([k, v], index) => [`[${index}] ${String(k)}`, v] as [string, any]
    );
  } else if (type === 'set') {
    entries = Array.from(value.values()).map(
      (item: any, index: number) => [String(index), item] as [string, any]
    );
  } else {
    entries = Object.entries(value);
  }

  const children = entries
    .map(([k, v]) => convertToTreeData(v, k, `${path}.${k}`, depth + 1, displayFunctions))
    .filter((node) => node !== null); // Filter out hidden functions

  return {
    value: nodeValue,
    label: key || 'root',
    children,
    nodeData: { type, value, key, path, itemCount: getItemCount(value), depth },
  };
}
