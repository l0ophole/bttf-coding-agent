import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

import { Tab, TabList, TabPanel, Tabs } from './Tabs';

function Example() {
  const [value, setValue] = useState('one');
  return (
    <Tabs value={value} onValueChange={setValue}>
      <TabList aria-label="Example">
        <Tab value="one">One</Tab>
        <Tab value="two">Two</Tab>
        <Tab value="three">Three</Tab>
      </TabList>
      <TabPanel value="one">First panel</TabPanel>
      <TabPanel value="two">Second panel</TabPanel>
      <TabPanel value="three">Third panel</TabPanel>
    </Tabs>
  );
}

describe('Tabs', () => {
  it('wires tabs to panels', () => {
    render(<Example />);
    const tab = screen.getByRole('tab', { name: 'One' });
    expect(tab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel', { name: 'One' })).toHaveTextContent('First panel');
    // Inactive panels exist (so aria-controls resolves) but are hidden and empty.
    const controlled = document.getElementById(
      screen.getByRole('tab', { name: 'Two' }).getAttribute('aria-controls')!,
    );
    expect(controlled).toHaveAttribute('hidden');
    expect(controlled).toBeEmptyDOMElement();
  });

  it('moves with arrow keys, Home and End using a roving tabindex', async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.click(screen.getByRole('tab', { name: 'One' }));

    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveFocus();
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute('tabindex', '-1');

    await user.keyboard('{End}');
    expect(screen.getByRole('tab', { name: 'Three' })).toHaveAttribute('aria-selected', 'true');

    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute('aria-selected', 'true');
  });
});
