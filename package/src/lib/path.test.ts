import { getValueAtPath, setValueAtPath } from './path';

describe('setValueAtPath', () => {
  it('replaces the root when there are no segments', () => {
    expect(setValueAtPath({ a: 1 }, [], 'replaced')).toBe('replaced');
  });

  it('writes a top-level key without mutating the original', () => {
    const original = { name: 'John', age: 30 };
    const next = setValueAtPath(original, ['name'], 'Jane');

    expect(next).toEqual({ name: 'Jane', age: 30 });
    expect(original).toEqual({ name: 'John', age: 30 });
    expect(next).not.toBe(original);
  });

  it('writes a nested key', () => {
    const original = { address: { city: 'Anytown', zip: '12345' } };
    const next = setValueAtPath(original, ['address', 'city'], 'Springfield');

    expect(next.address.city).toBe('Springfield');
    expect(next.address.zip).toBe('12345');
    expect(original.address.city).toBe('Anytown');
  });

  it('writes an array index', () => {
    const original = { courses: ['html', 'css', 'js'] };
    const next = setValueAtPath(original, ['courses', 1], 'scss');

    expect(next.courses).toEqual(['html', 'scss', 'js']);
    expect(original.courses).toEqual(['html', 'css', 'js']);
    expect(Array.isArray(next.courses)).toBe(true);
  });

  it('clones only the spine, leaving untouched branches identical', () => {
    const untouched = { deep: { value: 1 } };
    const original = { a: { b: { c: 'old' } }, untouched };
    const next = setValueAtPath(original, ['a', 'b', 'c'], 'new');

    // rewritten spine is fresh
    expect(next).not.toBe(original);
    expect(next.a).not.toBe(original.a);
    expect(next.a.b).not.toBe(original.a.b);
    // everything else is carried over by reference
    expect(next.untouched).toBe(untouched);
  });

  it('carries non-JSON values across by reference', () => {
    const date = new Date('2024-01-15T10:30:00Z');
    const map = new Map([['k', 'v']]);
    const set = new Set([1, 2]);
    const regexp = /pattern/gi;
    const fn = function handleClick() {};
    const big = BigInt(9007199254740991);
    const sym = Symbol.for('app.config');

    const original = { edit: 'before', date, map, set, regexp, fn, big, sym };
    const next = setValueAtPath(original, ['edit'], 'after');

    expect(next.edit).toBe('after');
    // identity, not equality: a structuredClone or JSON round-trip would break these
    expect(next.date).toBe(date);
    expect(next.map).toBe(map);
    expect(next.set).toBe(set);
    expect(next.regexp).toBe(regexp);
    expect(next.fn).toBe(fn);
    expect(next.big).toBe(big);
    expect(next.sym).toBe(sym);
  });

  it('keeps a special type intact when it sits on the spine below the target', () => {
    const date = new Date('2024-01-15T10:30:00Z');
    const original = { meta: { label: 'old', createdAt: date } };
    const next = setValueAtPath(original, ['meta', 'label'], 'new');

    expect(next.meta.label).toBe('new');
    expect(next.meta.createdAt).toBe(date);
    expect(next.meta.createdAt instanceof Date).toBe(true);
  });

  it('tells a dotted key apart from a nested object', () => {
    // both render at the string path "root.a.b" — segments are what disambiguate
    const dotted = setValueAtPath({ 'a.b': 1, a: { b: 2 } }, ['a.b'], 'X');
    expect(dotted).toEqual({ 'a.b': 'X', a: { b: 2 } });

    const nested = setValueAtPath({ 'a.b': 1, a: { b: 2 } }, ['a', 'b'], 'Y');
    expect(nested).toEqual({ 'a.b': 1, a: { b: 'Y' } });
  });

  it('tells an array index apart from a numeric object key', () => {
    const arr = setValueAtPath({ x: ['v'] }, ['x', 0], 'W');
    expect(arr).toEqual({ x: ['W'] });
    expect(Array.isArray(arr.x)).toBe(true);

    const obj = setValueAtPath({ x: { 0: 'v' } }, ['x', '0'], 'W');
    expect(obj).toEqual({ x: { 0: 'W' } });
    expect(Array.isArray(obj.x)).toBe(false);
  });

  it('refuses to write where the address does not resolve', () => {
    expect(() => setValueAtPath({ a: 1 }, ['missing'], 'x')).toThrow(/does not exist/);
    expect(() => setValueAtPath({ a: [1] }, ['a', 5], 'x')).toThrow(/out of range/);
    expect(() => setValueAtPath({ a: 'plain' }, ['a', 'b'], 'x')).toThrow(/not a plain object/);
  });

  it('refuses to write into a Map or a Set', () => {
    // their entries have no unambiguous segment: a Map key can be any value
    expect(() => setValueAtPath({ m: new Map([['k', 'v']]) }, ['m', 'k'], 'x')).toThrow(
      /not a plain object/
    );
    expect(() => setValueAtPath({ s: new Set(['v']) }, ['s', 0], 'x')).toThrow(
      /not a plain object/
    );
  });
});

describe('getValueAtPath', () => {
  it('reads nested values', () => {
    const data = { a: { b: ['x', 'y'] } };
    expect(getValueAtPath(data, ['a', 'b', 1])).toBe('y');
    expect(getValueAtPath(data, [])).toBe(data);
  });

  it('returns undefined for an address that does not resolve', () => {
    expect(getValueAtPath({ a: 1 }, ['a', 'b'])).toBeUndefined();
    expect(getValueAtPath({ a: 1 }, ['nope'])).toBeUndefined();
  });
});
