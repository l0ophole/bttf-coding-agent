import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

import { Select } from './Select';

const OPTIONS = [
  { value: 'safe', label: 'Safe' },
  { value: 'workspace', label: 'Workspace' },
  { value: 'full', label: 'Full' },
];

function Example() {
  const [value, setValue] = useState('safe');
  return <Select label="Tool access" value={value} options={OPTIONS} onChange={setValue} />;
}

describe('Select', () => {
  it('opens with the keyboard and chooses with Enter', async () => {
    const user = userEvent.setup();
    render(<Example />);
    const trigger = screen.getByRole('button', { name: 'Tool access Safe' });
    trigger.focus();

    await user.keyboard('{ArrowDown}');
    const listbox = await screen.findByRole('listbox', { name: 'Tool access' });
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('option', { name: 'Safe' })).toHaveAttribute('aria-selected', 'true');

    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');
    expect(listbox).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tool access Full' })).toHaveFocus();
  });

  it('closes on Escape without changing the value', async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.click(screen.getByRole('button', { name: 'Tool access Safe' }));
    await screen.findByRole('listbox');
    await user.keyboard('{ArrowDown}{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tool access Safe' })).toHaveFocus();
  });

  it('jumps to an option by typing', async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.click(screen.getByRole('button', { name: 'Tool access Safe' }));
    const listbox = await screen.findByRole('listbox');
    await user.keyboard('w');
    const active = listbox.getAttribute('aria-activedescendant');
    expect(document.getElementById(active!)).toHaveTextContent('Workspace');
  });
});
