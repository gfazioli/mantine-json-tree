import { NumberInput, TextInput, type NumberInputProps, type TextInputProps } from '@mantine/core';
import React, { useRef, useState } from 'react';
import type { ValueType } from './lib/utils';

/**
 * Props forwarded to the inline editor input.
 *
 * The props the editor owns are excluded: `value`, `defaultValue` and `onChange`
 * drive the draft, and `error` carries the validation message.
 */
export type JsonTreeEditorProps = Omit<
  TextInputProps & NumberInputProps,
  'value' | 'defaultValue' | 'onChange' | 'error'
>;

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

  /** Props forwarded to the input */
  editorProps?: JsonTreeEditorProps;

  /** The key being edited, used to name the field for assistive technology */
  label?: string;
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
  label,
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

    if (type === 'number') {
      // NumberInput reports an empty field as '', and Number('') is 0 — committing
      // that would write a zero the user never typed while trying to clear it
      if (draft === '' || draft === null || draft === undefined) {
        setError('Required');
        return;
      }
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

  // `editorProps` is spread first, and the editor's own handlers then wrap the
  // consumer's rather than being replaced by them. Spreading it last let a
  // consumer `onKeyDown` overwrite the guard above, at which point Mantine's Tree
  // reclaims the arrow keys and Space and the field stops accepting spaces —
  // exactly the failure the guard exists to prevent.
  const shared = {
    ...editorProps,
    // Without a name, assistive technology announces an empty edit field with no
    // clue which key it belongs to. Derived from the data's own key, so the only
    // English in it is the verb — and a consumer can still override it.
    'aria-label': editorProps?.['aria-label'] ?? (label ? `Edit ${label}` : 'Edit value'),
    autoFocus: true,
    error,
    size: editorProps?.size ?? ('xs' as const),
    onKeyDown: (event: React.KeyboardEvent) => {
      editorProps?.onKeyDown?.(event as React.KeyboardEvent<HTMLInputElement>);
      handleKeyDown(event);
    },
    onClick: (event: React.MouseEvent) => {
      editorProps?.onClick?.(event as React.MouseEvent<HTMLInputElement>);
      event.stopPropagation();
    },
    onMouseDown: (event: React.MouseEvent) => {
      editorProps?.onMouseDown?.(event as React.MouseEvent<HTMLInputElement>);
      event.stopPropagation();
    },
    onBlur: (event: React.FocusEvent) => {
      editorProps?.onBlur?.(event as React.FocusEvent<HTMLInputElement>);
      commit();
    },
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
