import type { HTMLAttributes } from 'react';

export interface RicherEditorProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children'
> {
  'aria-label'?: string;
}

export function RicherEditor({
  'aria-label': ariaLabel = 'Document editor',
  className,
  ...props
}: RicherEditorProps) {
  const rootClassName = ['richer-editor', className].filter(Boolean).join(' ');

  return (
    <div
      {...props}
      aria-label={ariaLabel}
      className={rootClassName}
      contentEditable
      role="textbox"
      suppressContentEditableWarning
    />
  );
}
