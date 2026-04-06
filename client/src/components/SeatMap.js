'use client';

import { motion } from 'framer-motion';

/**
 * SeatMap — reusable visual seat picker
 * Works for both planned rides and live autos
 *
 * Props:
 *   totalSeats: number
 *   bookedSeats: number[]  — seat numbers already booked
 *   selectedSeat: number | null
 *   onSelect: (seatNumber) => void
 *   disabled: boolean
 *   layout: 'auto' | 'car'  — visual layout style
 */
export default function SeatMap({
  totalSeats = 3,
  bookedSeats = [],
  selectedSeat = null,
  onSelect,
  disabled = false,
  layout = 'auto',
}) {
  const seats = Array.from({ length: totalSeats }, (_, i) => i + 1);

  const getState = (seatNum) => {
    if (bookedSeats.includes(seatNum)) return 'booked';
    if (selectedSeat === seatNum) return 'selected';
    return 'available';
  };

  const SEAT_STYLES = {
    available: 'bg-brand-800 border-brand-600 text-brand-300 hover:border-accent-400 hover:bg-accent-400/10 cursor-pointer',
    booked: 'bg-brand-900 border-brand-800 text-brand-600 cursor-not-allowed opacity-50',
    selected: 'bg-accent-400 border-accent-400 text-brand-900 cursor-pointer shadow-lg shadow-accent-400/30',
  };

  const SEAT_ICONS = {
    available: '💺',
    booked: '🚫',
    selected: '✅',
  };

  // Auto layout: 1 driver + rows of 2
  if (layout === 'auto') {
    const passengerSeats = seats;
    const rows = [];
    for (let i = 0; i < passengerSeats.length; i += 2) {
      rows.push(passengerSeats.slice(i, i + 2));
    }

    return (
      <div className="bg-brand-900 rounded-2xl border border-brand-800 p-4">
        <p className="text-xs font-semibold text-brand-400 uppercase tracking-wide mb-3">Select Your Seat</p>

        {/* Auto body */}
        <div className="relative bg-brand-800 rounded-2xl border border-brand-700 p-4 overflow-hidden">
          {/* Windshield */}
          <div className="flex justify-center mb-3">
            <div className="w-20 h-6 bg-brand-700 rounded-t-full border border-brand-600 flex items-center justify-center">
              <span className="text-[10px] text-brand-400">🚗 Front</span>
            </div>
          </div>

          {/* Driver seat */}
          <div className="flex justify-end mb-3 pr-2">
            <div className="w-12 h-12 bg-brand-700 border-2 border-brand-500 rounded-xl flex flex-col items-center justify-center">
              <span className="text-lg">🧑‍✈️</span>
              <span className="text-[9px] text-brand-400">Driver</span>
            </div>
          </div>

          {/* Passenger rows */}
          <div className="space-y-2">
            {rows.map((row, rowIdx) => (
              <div key={rowIdx} className="flex justify-center gap-3">
                {row.map((seatNum) => {
                  const state = getState(seatNum);
                  return (
                    <motion.button
                      key={seatNum}
                      whileTap={state !== 'booked' ? { scale: 0.9 } : {}}
                      onClick={() => state !== 'booked' && !disabled && onSelect?.(seatNum)}
                      disabled={state === 'booked' || disabled}
                      className={`w-14 h-14 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${SEAT_STYLES[state]}`}
                    >
                      <span className="text-lg">{SEAT_ICONS[state]}</span>
                      <span className="text-[10px] font-bold mt-0.5">S{seatNum}</span>
                    </motion.button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Rear bumper */}
          <div className="flex justify-center mt-3">
            <div className="w-20 h-4 bg-brand-700 rounded-b-full border border-brand-600" />
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-3 text-xs text-brand-400">
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-brand-800 border border-brand-600 rounded" /> Available</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-accent-400 rounded" /> Selected</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-brand-900 border border-brand-800 rounded opacity-50" /> Booked</span>
        </div>
      </div>
    );
  }

  // Car layout: grid
  return (
    <div className="bg-brand-900 rounded-2xl border border-brand-800 p-4">
      <p className="text-xs font-semibold text-brand-400 uppercase tracking-wide mb-3">Select Your Seat</p>
      <div className="grid grid-cols-3 gap-2">
        {seats.map((seatNum) => {
          const state = getState(seatNum);
          return (
            <motion.button
              key={seatNum}
              whileTap={state !== 'booked' ? { scale: 0.9 } : {}}
              onClick={() => state !== 'booked' && !disabled && onSelect?.(seatNum)}
              disabled={state === 'booked' || disabled}
              className={`h-14 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${SEAT_STYLES[state]}`}
            >
              <span className="text-lg">{SEAT_ICONS[state]}</span>
              <span className="text-[10px] font-bold mt-0.5">S{seatNum}</span>
            </motion.button>
          );
        })}
      </div>
      <div className="flex items-center justify-center gap-4 mt-3 text-xs text-brand-400">
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-brand-800 border border-brand-600 rounded" /> Available</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-accent-400 rounded" /> Selected</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-brand-900 border border-brand-800 rounded opacity-50" /> Booked</span>
      </div>
    </div>
  );
}
