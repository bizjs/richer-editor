import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { RicherEditor } from './index';

describe('RicherEditor public component', () => {
  it('renders an accessible editor surface', () => {
    render(<RicherEditor />);

    expect(
      screen.getByRole('textbox', { name: 'Document editor' }),
    ).toBeInTheDocument();
  });
});
