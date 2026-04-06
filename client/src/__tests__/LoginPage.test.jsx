import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('next/link', () => ({ __esModule: true, default: ({ href, children }) => <a href={href}>{children}</a> }));
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...p }) => <div {...p}>{children}</div>,
    button: ({ children, ...p }) => <button {...p}>{children}</button>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn() },
  success: jest.fn(),
  error: jest.fn(),
}));

const mockLogin = jest.fn();
jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ login: mockLogin }),
}));

import LoginPage from '@/app/auth/login/page';

describe('LoginPage', () => {
  beforeEach(() => {
    mockLogin.mockReset();
  });

  test('renders email and password fields', () => {
    render(<LoginPage />);
    // First select a role
    const riderButton = screen.getByText(/I'm a Rider/i);
    fireEvent.click(riderButton);
    // Now check for fields
    expect(screen.getByPlaceholderText(/you@example.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter your password/i)).toBeInTheDocument();
  });

  test('renders login button', () => {
    render(<LoginPage />);
    // First select a role
    const riderButton = screen.getByText(/I'm a Rider/i);
    fireEvent.click(riderButton);
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
  });

  test('renders sign up link', () => {
    render(<LoginPage />);
    expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument();
  });

  test('calls login with email and password on submit', async () => {
    mockLogin.mockResolvedValue({});
    render(<LoginPage />);

    // First select a role
    const riderButton = screen.getByText(/I'm a Rider/i);
    fireEvent.click(riderButton);

    fireEvent.change(screen.getByPlaceholderText(/you@example.com/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/enter your password/i), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123', 'user');
    });
  });

  test('shows error toast on login failure', async () => {
    const toast = require('react-hot-toast').default;
    mockLogin.mockRejectedValue({
      response: { data: { message: 'Invalid credentials' } },
    });
    render(<LoginPage />);

    // First select a role
    const riderButton = screen.getByText(/I'm a Rider/i);
    fireEvent.click(riderButton);

    fireEvent.change(screen.getByPlaceholderText(/you@example.com/i), {
      target: { value: 'bad@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/enter your password/i), {
      target: { value: 'wrongpass' },
    });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Invalid credentials');
    });
  });

  test('toggles password visibility', () => {
    render(<LoginPage />);
    
    // First select a role
    const riderButton = screen.getByText(/I'm a Rider/i);
    fireEvent.click(riderButton);
    
    const passwordInput = screen.getByPlaceholderText(/enter your password/i);
    expect(passwordInput.type).toBe('password');

    // Find the toggle button (eye icon button) - it's the last button that's not the submit button
    const buttons = screen.getAllByRole('button');
    const toggleBtn = buttons.find(btn => btn.type === 'button' && !btn.textContent.includes('Log In'));
    fireEvent.click(toggleBtn);
    expect(passwordInput.type).toBe('text');
  });
});
