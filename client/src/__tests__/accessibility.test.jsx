import React from 'react';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  usePathname: () => '/',
}));

jest.mock('next/link', () => {
  return function MockLink({ href, children, className }) {
    return <a href={href} className={className}>{children}</a>;
  };
});

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ 
    isAuthenticated: false, 
    loading: false,
    user: null 
  }),
}));

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
    form: ({ children, ...props }) => <form {...props}>{children}</form>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn() },
}));

jest.mock('@/components/Navbar', () => () => <nav data-testid="navbar">Navbar</nav>);
jest.mock('@/components/BottomNav', () => () => <nav data-testid="bottom-nav">BottomNav</nav>);
jest.mock('@/components/DriverBottomNav', () => () => <nav data-testid="driver-bottom-nav">DriverBottomNav</nav>);
jest.mock('@/components/AppHeader', () => ({ title, onBack }) => (
  <div data-testid="app-header">
    {onBack && <button onClick={onBack}>Back</button>}
    <h1>{title}</h1>
  </div>
));
jest.mock('@/components/LocationInput', () => ({ label, placeholder, onChange }) => (
  <div>
    <label>{label}</label>
    <input
      placeholder={placeholder}
      aria-label={label}
      onChange={(e) => onChange({ address: e.target.value, lat: 30.3165, lng: 78.0322 })}
    />
  </div>
));

import LoginPage from '@/app/auth/login/page';
import BottomNav from '@/components/BottomNav';

describe('Accessibility Tests', () => {
  test('LoginPage should not have accessibility violations', async () => {
    const { container } = render(<LoginPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('BottomNav should not have accessibility violations', async () => {
    const { container } = render(<BottomNav />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
