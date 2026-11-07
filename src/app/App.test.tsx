import { screen, waitFor, within } from '@testing-library/react';
import axe from 'axe-core';
import { describe, expect, it } from 'vitest';

import { renderApp } from '@/test/renderApp';

describe('PiCode app', () => {
  it('renders the session from the design', async () => {
    renderApp();
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(
      'Goal:Fix API server bug and add tests',
    );
    expect(screen.getByRole('navigation', { name: 'Open sessions' })).toHaveTextContent(
      'Fix API Server Bug',
    );
    expect(await screen.findByText(/Thinking… \(2m 14s\)/)).toBeInTheDocument();
    expect(screen.getByText('Message 12 of 12')).toBeInTheDocument();
  });

  it('sends a message and shows the agent reply', async () => {
    const { user } = renderApp();
    const box = await screen.findByRole('textbox', { name: 'Message' });
    await user.type(box, 'Please run the tests{Enter}');

    expect(box).toHaveValue('');
    const conversation = screen.getByRole('heading', {
      name: 'Conversation',
      level: 2,
    }).parentElement!;
    expect(await within(conversation).findByText('Please run the tests')).toBeInTheDocument();
    await waitFor(() => expect(within(conversation).getByText(/tests pass/)).toBeInTheDocument(), {
      timeout: 4000,
    });
  });

  it('offers slash commands that fill in the message', async () => {
    const { user } = renderApp();
    const box = await screen.findByRole('textbox', { name: 'Message' });
    await user.type(box, '/com');
    expect(screen.getByRole('listbox', { name: 'Commands' })).toBeInTheDocument();
    await user.keyboard('{Enter}');
    expect(box).toHaveValue('Commit the changes with a descriptive message.');
  });

  it('moves the playhead from the inspector', async () => {
    const { user } = renderApp();
    await screen.findByText('Message 12 of 12');
    const inspector = screen.getByRole('complementary', { name: 'Inspector' });
    await user.click(within(inspector).getAllByRole('button', { name: 'Previous message' })[0]!);
    expect(screen.getByText('Message 11 of 12')).toBeInTheDocument();
    expect(screen.getByRole('slider', { name: 'Timeline playhead' })).toHaveAttribute(
      'aria-valuenow',
      '11',
    );
    expect(screen.getByRole('slider', { name: 'Timeline overview playhead' })).toHaveAttribute(
      'aria-valuenow',
      '11',
    );
  });

  it('forks a session from the playhead into a new tab', async () => {
    const { user } = renderApp();
    await screen.findByText('Message 12 of 12');
    await user.click(screen.getByRole('button', { name: 'Fork from here' }));
    await waitFor(() =>
      expect(screen.getByRole('navigation', { name: 'Open sessions' })).toHaveTextContent(
        'Fix API Server Bug (fork)',
      ),
    );
  });

  it('has no detectable accessibility violations', async () => {
    const { container } = renderApp();
    await screen.findByText('Message 12 of 12');
    const results = await axe.run(container, {
      // jsdom cannot compute colours or layout; contrast is checked in a real browser instead.
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(
      results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`),
    ).toEqual([]);
  });
});
