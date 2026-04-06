import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/dashboard'),
}));

// Mock next/link
jest.mock('next/link', () => {
  return function MockLink({ href, children, className }) {
    return <a href={href} className={className}>{children}</a>;
  };
});

// Mock AuthContext
jest.mock('@/context/AuthContext', () => ({
  useAuth: jest.fn(() => ({ isAuthenticated: true })),
}));

import BottomNav from '@/components/BottomNav';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';

describe('BottomNav', () => {
  test('renders nothing when not authenticated', () => {
    useAuth.mockReturnValue({ isAuthenticated: false });
    const { container } = render(<BottomNav />);
    expect(container.firstChild).toBeNull();
  });

  test('renders nav items when authenticated', () => {
    useAuth.mockReturnValue({ isAuthenticated: true });
    render(<BottomNav />);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  test('renders all 5 nav links', () => {
    useAuth.mockReturnValue({ isAuthenticated: true });
    render(<BottomNav />);
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(5);
  });

  test('links point to correct routes', () => {
    useAuth.mockReturnValue({ isAuthenticated: true });
    render(<BottomNav />);
    const links = screen.getAllByRole('link');
    const hrefs = links.map((l) => l.getAttribute('href'));
    expect(hrefs).toContain('/dashboard');
    expect(hrefs).toContain('/explore');
    expect(hrefs).toContain('/trips/new');
    expect(hrefs).toContain('/rides');
    expect(hrefs).toContain('/profile');
  });

  test('active route link has accent color for active state', () => {
    usePathname.mockReturnValue('/dashboard');
    useAuth.mockReturnValue({ isAuthenticated: true });
    render(<BottomNav />);
    const dashboardLink = screen.getAllByRole('link').find(
      (l) => l.getAttribute('href') === '/dashboard'
    );
    // Check that the link or its children have accent color styling
    const linkText = dashboardLink.querySelector('span');
    expect(linkText.className).toContain('accent-400');
  });
});
