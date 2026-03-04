import { render, screen } from '@testing-library/react';
import { describe, test, expect, beforeEach } from 'vitest';
import Popup from '../src/popup/Popup.jsx';

describe('Popup', () => {
  beforeEach(async () => {
    // Clear chrome.storage before each test
    await chrome.storage.local.clear();
  });

  test('renders ShelfQuest title', async () => {
    render(<Popup />);
    const title = await screen.findByText('ShelfQuest');
    expect(title).toBeInTheDocument();
  });

  test('shows login form when unauthenticated', async () => {
    render(<Popup />);
    const prompt = await screen.findByText('Sign in to your ShelfQuest account');
    expect(prompt).toBeInTheDocument();
  });

  test('shows greeting when authenticated', async () => {
    await chrome.storage.local.set({
      shelfquest_token: 'fake-token',
      shelfquest_user: { name: 'Alice', email: 'alice@example.com' },
    });

    render(<Popup />);
    const greeting = await screen.findByText(/Hello,/);
    expect(greeting).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });
});
