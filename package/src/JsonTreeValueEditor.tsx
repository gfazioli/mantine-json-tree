import { NumberInput, TextInput } from '@mantine/core';
import React, { useRef, useState } from 'react';
import type { ValueType } from './lib/utils';

export interface JsonTreeValueEditorProps {
  /** The value being edited */
  value: unknown;

  /** Its type, which decides the input to render */
  type: ValueType;

  /** Called with the parsed value when the edit is accepted */
  onCommit: (value: unknown) => void;

  /** Called when the edit is abandoned */
  onCancel: () => void;

  /** Returns an error message to reject the value, or null to accept it */
  validate?: (value: unknown) => string | null;

  /** Styles API props for the input */
  editorProps?: Record<string, unknown>;
}

/**
 * The inline editor for a primitive value.
 *
 * The draft lives here rather than in `JsonTree` on purpose: a keystroke must
 * not re-render the whole tree, so nothing leaves this component until the edit
 * is committed.
 *
 * Every pointer and keyboard event is stopped before it leaves. Mantine's Tree
 * puts its keyboard navigation on the `li[role="treeitem"]` and calls
 * `preventDefault()` on the arrow keys and on Space (`expandOnSpace` defaults to
 * true), so without this the caret cannot move and a space cannot be typed —
 * verified, the field simply stays empty.
 */
export function JsonTreeValueEditor({
  value,
  type,
  onCommit,
  onCancel,
  validate,
  editorProps,
}: JsonTreeValueEditorProps) {
  const [draft, setDraft] = useState<string | number>(() =>
    type === 'number' ? (value as number) : String(value ?? '')
  );
  const [error, setError] = useState<string | null>(null);
  // a commit triggered by Enter must not run again when the field then blurs
  const committedRef = useRef(false);

  const parse = (): unknown => (type === 'number' ? Number(draft) : String(draft));

  const commit = () => {
    if (committedRef.current) {
      return;
    }

    const next = parse();

    if (type === 'number' && !Number.isFinite(next as number)) {
      setError('Not a number');
      return;
    }

    const validationError = validate?.(next) ?? null;
    if (validationError !== null) {
      setError(validationError);
      return;
    }

    committedRef.current = true;
    onCommit(next);
  };

  const cancel = () => {
    committedRef.current = true;
    onCancel();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    // Tree owns arrows and Space on the row above; keep them in the field
    event.stopPropagation();

    if (event.key === 'Enter') {
      event.preventDefault();
      commit();
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      cancel();
    }
  };

  const shared = {
    autoFocus: true,
    error,
    size: 'xs' as const,
    onKeyDown: handleKeyDown,
    onClick: (event: React.MouseEvent) => event.stopPropagation(),
    onMouseDown: (event: React.MouseEvent) => event.stopPropagation(),
    onBlur: commit,
    ...editorProps,
  };

  if (type === 'number') {
    return (
      <NumberInput
        {...shared}
        value={draft}
        onChange={(next) => {
          setError(null);
          setDraft(next);
        }}
      />
    );
  }

  return (
    <TextInput
      {...shared}
      value={String(draft)}
      onChange={(event) => {
        setError(null);
        setDraft(event.currentTarget.value);
      }}
    />
  );
}

JsonTreeValueEditor.displayName = 'JsonTreeValueEditor';
