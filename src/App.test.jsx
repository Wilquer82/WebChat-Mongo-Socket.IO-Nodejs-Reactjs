import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import App from './App.jsx';

vi.mock('axios', () => ({ get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() }));

describe('App', () => {
  test('renders the account entry screen', () => {
    render(<App />);
    expect(screen.getByText(/Converse sem deixar a chave escapar/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Seu apelido/i)).toBeInTheDocument();
  });

  test('renders language and theme controls', () => {
    render(<App />);
    expect(screen.getAllByRole('button', { name: /PT|EN/i }).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByRole('button', { name: /Casual/i })).toBeInTheDocument();
  });
});
