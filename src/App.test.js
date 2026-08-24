import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('axios', () => ({ get: jest.fn(), post: jest.fn(), patch: jest.fn() }));

test('renders the account entry screen', () => {
  render(<App />);
  expect(screen.getByText(/Converse sem deixar a chave escapar/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/Seu apelido/i)).toBeInTheDocument();
});
