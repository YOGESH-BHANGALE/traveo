import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('next/navigation', () => ({ 
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  usePathname: () => '/trips/new'
}));
jest.mock('next/link', () => ({ __esModule: true, default: ({ href, children }) => <a href={href}>{children}</a> }));
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...p }) => <div {...p}>{children}</div>,
    button: ({ children, ...p }) => <button {...p}>{children}</button>,
    // Pass all props including onSubmit through for form elements
    form: ({ children, onSubmit, className }) => (
      <form onSubmit={onSubmit} className={className}>{children}</form>
    ),
  },
}));
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn() },
  error: jest.fn(),
  success: jest.fn(),
}));
jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: true, loading: false }),
}));
jest.mock('@/components/Navbar', () => () => <nav data-testid="navbar" />);
jest.mock('@/components/BottomNav', () => () => <nav data-testid="bottom-nav" />);
jest.mock('@/components/DriverBottomNav', () => () => <nav data-testid="driver-bottom-nav" />);
jest.mock('@/components/AppHeader', () => ({ title, onBack }) => (
  <div data-testid="app-header">
    <button onClick={onBack}>Back</button>
    <h1>{title}</h1>
  </div>
));
jest.mock('@/components/LocationInput', () => ({ label, placeholder, onChange }) => (
  <div>
    <label>{label}</label>
    <input
      placeholder={placeholder}
      data-testid={`location-${label.toLowerCase().replace(/\s+/g, '-')}`}
      onChange={(e) => onChange({ address: e.target.value, lat: 30.3165, lng: 78.0322 })}
    />
  </div>
));

const mockCreate = jest.fn();
jest.mock('@/lib/api', () => ({
  tripsAPI: { create: (...args) => mockCreate(...args) },
}));

import NewTripPage from '@/app/trips/new/page';

describe('NewTripPage', () => {
  beforeEach(() => mockCreate.mockReset());

  test('renders the form with all key fields', () => {
    render(<NewTripPage />);
    expect(screen.getByPlaceholderText(/where are you starting/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/where are you going/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e\.g\. 200/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /post trip/i })).toBeInTheDocument();
  });

  test('renders all 5 vehicle type buttons', () => {
    render(<NewTripPage />);
    ['Auto', 'Car', 'Bike', 'Bus', 'Any'].forEach((v) => {
      expect(screen.getByText(v)).toBeInTheDocument();
    });
  });

  test('shows per-person fare when total fare is entered', async () => {
    render(<NewTripPage />);
    
    // First change seats to 2 so we can test the per-person calculation
    const seatsSelect = document.querySelector('select');
    fireEvent.change(seatsSelect, { target: { value: '2' } });
    
    // Then enter the fare
    const fareInput = screen.getByPlaceholderText(/e\.g\. 200/i);
    fireEvent.change(fareInput, { target: { value: '200' } });
    
    await waitFor(() => {
      // 200 ÷ 2 = 100 per person
      expect(screen.getByText(/₹100 per person/i)).toBeInTheDocument();
    });
  });

  test('shows error toast when source is missing on submit', async () => {
    render(<NewTripPage />);
    const form = document.querySelector('form');
    fireEvent.submit(form);
    await waitFor(() => {
      // The component calls toast.error() where toast is the default export
      // Our mock sets default.error as a jest.fn()
      const toastModule = require('react-hot-toast');
      expect(toastModule.default.error).toHaveBeenCalledWith(
        expect.stringMatching(/pickup and destination/i)
      );
    });
  });

  test('submits form and calls tripsAPI.create with correct data', async () => {
    mockCreate.mockResolvedValue({ data: { trip: { _id: 'trip123' } } });
    render(<NewTripPage />);

    // Fill source and destination via mocked LocationInput
    // The mock automatically provides lat/lng when onChange is called
    fireEvent.change(screen.getByTestId('location-pickup-location'), {
      target: { value: 'Station Road' },
    });
    fireEvent.change(screen.getByTestId('location-destination'), {
      target: { value: 'Clock Tower' },
    });

    // Fill date and time - use a future date to pass validation
    const dateInput = document.querySelector('input[type="date"]');
    const timeInput = document.querySelector('input[type="time"]');
    fireEvent.change(dateInput, { target: { value: '2026-04-10' } });
    fireEvent.change(timeInput, { target: { value: '09:00' } });

    fireEvent.change(screen.getByPlaceholderText(/e\.g\. 200/i), { target: { value: '150' } });

    const form = document.querySelector('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          vehicleType: 'auto',
          estimatedFare: 150,
          date: '2026-04-10',
          time: '09:00',
          seats: 1,
          source: expect.objectContaining({
            address: 'Station Road',
            lat: 30.3165,
            lng: 78.0322,
          }),
          destination: expect.objectContaining({
            address: 'Clock Tower',
            lat: 30.3165,
            lng: 78.0322,
          }),
        })
      );
    });
  });
});
