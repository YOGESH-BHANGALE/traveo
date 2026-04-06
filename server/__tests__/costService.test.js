const { calculateFare, splitFare, FARE_RATES } = require('../services/costService');

describe('costService', () => {
  describe('calculateFare', () => {
    test('calculates car fare correctly', () => {
      // 10km, 20min, car: 30 + 10*10 + 1.5*20 = 30 + 100 + 30 = 160
      const fare = calculateFare(10000, 1200, 'car');
      expect(fare).toBe(160);
    });

    test('calculates auto fare correctly', () => {
      // 5km, 10min, auto: 25 + 8*5 + 1.2*10 = 25 + 40 + 12 = 77
      const fare = calculateFare(5000, 600, 'auto');
      expect(fare).toBe(77);
    });

    test('defaults to "any" rates for unknown vehicle type', () => {
      const fareAny = calculateFare(5000, 600, 'any');
      const fareUnknown = calculateFare(5000, 600, 'unknown');
      expect(fareAny).toBe(fareUnknown);
    });

    test('returns base fare for zero distance and duration', () => {
      const fare = calculateFare(0, 0, 'car');
      expect(fare).toBe(FARE_RATES.car.baseFare);
    });

    test('rounds result to integer', () => {
      const fare = calculateFare(1111, 333, 'bike');
      expect(Number.isInteger(fare)).toBe(true);
    });
  });

  describe('splitFare', () => {
    test('splits fare equally between 2 riders', () => {
      const result = splitFare(200, 2);
      expect(result.farePerPerson).toBe(100);
      expect(result.numberOfRiders).toBe(2);
      expect(result.totalFare).toBe(200);
    });

    test('calculates savings correctly', () => {
      const result = splitFare(200, 2);
      // savings = totalFare - farePerPerson = 200 - 100 = 100
      expect(result.savingsPerPerson).toBe(100);
      expect(result.savingsPercentage).toBe(50);
    });

    test('rounds up fare per person (ceiling)', () => {
      // 100 / 3 = 33.33 → ceil = 34
      const result = splitFare(100, 3);
      expect(result.farePerPerson).toBe(34);
    });

    test('throws for zero riders', () => {
      expect(() => splitFare(200, 0)).toThrow();
    });

    test('handles single rider (no split)', () => {
      const result = splitFare(150, 1);
      expect(result.farePerPerson).toBe(150);
      expect(result.savingsPercentage).toBe(0);
    });
  });
});
