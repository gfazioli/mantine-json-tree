import {
  getValueAtPath,
  insertAtPath,
  moveAtPath,
  removeAtPath,
  renameKeyAtPath,
  setValueAtPath,
} from './path';

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

describe('structural edits', () => {
  const when = new Date(0);
  const original = {
    user: { first: 'Ada', last: 'Lovelace', born: when },
    list: ['a', 'b', 'c', 'd'],
    other: { untouched: true },
  };

  describe('renameKeyAtPath', () => {
    it('renames a key in place, keeping the key order and every other reference', () => {
      const next = renameKeyAtPath(original, ['user', 'first'], 'given');
      expect(Object.keys(next.user)).toEqual(['given', 'last', 'born']);
      expect((next.user as any).given).toBe('Ada');
      expect(next.user.born).toBe(when);
      expect(next.other).toBe(original.other);
      expect(original.user.first).toBe('Ada');
    });

    it('renames a top-level key', () => {
      expect(Object.keys(renameKeyAtPath({ a: 1, b: 2 }, ['a'], 'z'))).toEqual(['z', 'b']);
    });

    it('refuses a key that already exists, an index and a missing key', () => {
      expect(() => renameKeyAtPath(original, ['user', 'first'], 'last')).toThrow('already exists');
      expect(() => renameKeyAtPath(original, ['list', 0], 'x')).toThrow('only an object key');
      expect(() => renameKeyAtPath(original, ['user', 'nope'], 'x')).toThrow('does not exist');
      expect(() => renameKeyAtPath(original, [], 'x')).toThrow('root');
    });

    it('accepts renaming a key to itself', () => {
      expect(renameKeyAtPath({ a: 1 }, ['a'], 'a')).toEqual({ a: 1 });
    });

    it('keeps symbol keys when renaming and removing', () => {
      const tag = Symbol('tag');
      const source = { a: 1, b: 2, [tag]: 'kept' };
      expect((renameKeyAtPath(source, ['a'], 'z') as any)[tag]).toBe('kept');
      expect((removeAtPath(source, ['b']) as any)[tag]).toBe('kept');
    });

    it('stores a __proto__ key as data, never as the prototype', () => {
      const next = renameKeyAtPath({ a: 1 } as Record<string, unknown>, ['a'], '__proto__');
      expect(Object.getPrototypeOf(next)).toBe(Object.prototype);
      expect(Object.hasOwn(next, '__proto__')).toBe(true);
    });
  });

  describe('removeAtPath', () => {
    it('removes a key', () => {
      const next = removeAtPath(original, ['user', 'last']);
      expect(next.user).toEqual({ first: 'Ada', born: when });
      expect(original.user.last).toBe('Lovelace');
    });

    it('removes an array item and shifts the rest up', () => {
      expect(removeAtPath(original, ['list', 1]).list).toEqual(['a', 'c', 'd']);
    });

    it('refuses an address that does not resolve', () => {
      expect(() => removeAtPath(original, ['list', 9])).toThrow('out of range');
      expect(() => removeAtPath(original, ['user', 'nope'])).toThrow('does not exist');
      expect(() => removeAtPath(original, ['user', 'born', 'x'])).toThrow('not a plain object');
    });
  });

  describe('insertAtPath', () => {
    it('adds a key at the end of an object', () => {
      const next = insertAtPath(original, ['user'], 'title', 'Countess');
      expect(Object.keys(next.user)).toEqual(['first', 'last', 'born', 'title']);
    });

    it('appends to an array, or inserts at an index', () => {
      expect(insertAtPath(original, ['list'], undefined, 'e').list).toEqual([
        'a',
        'b',
        'c',
        'd',
        'e',
      ]);
      expect(insertAtPath(original, ['list'], 0, 'z').list[0]).toBe('z');
    });

    it('adds to the root', () => {
      expect(insertAtPath([1], [], undefined, 2)).toEqual([1, 2]);
      expect(insertAtPath({}, [], 'a', 1)).toEqual({ a: 1 });
    });

    it('refuses an existing key, a missing key and a non-container', () => {
      expect(() => insertAtPath(original, ['user'], 'first', 'x')).toThrow('already exists');
      expect(() => insertAtPath(original, ['user'], undefined, 'x')).toThrow('a key is needed');
      expect(() => insertAtPath(original, ['user', 'born'], 'x', 1)).toThrow('not a plain object');
    });
  });

  describe('moveAtPath', () => {
    it('moves an item down and up', () => {
      expect(moveAtPath(original, ['list', 0], 2).list).toEqual(['b', 'c', 'a', 'd']);
      expect(moveAtPath(original, ['list', 3], 0).list).toEqual(['d', 'a', 'b', 'c']);
      expect(original.list).toEqual(['a', 'b', 'c', 'd']);
    });

    it('refuses an object key and an index out of range', () => {
      expect(() => moveAtPath(original, ['user', 'first'], 0)).toThrow('only an array item');
      expect(() => moveAtPath(original, ['list', 0], 4)).toThrow('cannot move');
    });
  });
});
