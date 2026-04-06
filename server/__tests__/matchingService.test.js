const { haversineDistance, calculateMatchScore } = require('../services/matchingService');

describe('matchingService', () => {
  describe('haversineDistance', () => {
    test('returns 0 for identical coordinates', () => {
      const dist = haversineDistance(28.6139, 77.2090, 28.6139, 77.2090);
      expect(dist).toBe(0);
    });

    test('calculates distance between Delhi and Mumbai (~1150km)', () => {
      // Delhi: 28.6139, 77.2090 | Mumbai: 19.0760, 72.8777
      const dist = haversineDistance(28.6139, 77.2090, 19.0760, 72.8777);
      expect(dist).toBeGreaterThan(1_100_000); // > 1100 km in meters
      expect(dist).toBeLessThan(1_200_000);    // < 1200 km
    });

    test('calculates short distance accurately (~111m per 0.001 degree lat)', () => {
      const dist = haversineDistance(28.6139, 77.2090, 28.6149, 77.2090);
      expect(dist).toBeGreaterThan(100);
      expect(dist).toBeLessThan(120);
    });

    test('is symmetric (A→B == B→A)', () => {
      const d1 = haversineDistance(12.9716, 77.5946, 13.0827, 80.2707);
      const d2 = haversineDistance(13.0827, 80.2707, 12.9716, 77.5946);
      expect(Math.abs(d1 - d2)).toBeLessThan(0.001);
    });
  });

  describe('calculateMatchScore', () => {
    test('returns 100 for perfect match (0 distance, 0 time diff)', () => {
      const score = calculateMatchScore(0, 0, 0);
      expect(score).toBe(100);
    });

    test('returns 0 when both distances and time exceed thresholds', () => {
      const score = calculateMatchScore(2000, 2000, 60);
      expect(score).toBe(0);
    });

    test('score decreases as destination distance increases', () => {
      const s1 = calculateMatchScore(0, 0, 0);
      const s2 = calculateMatchScore(500, 0, 0);
      const s3 = calculateMatchScore(1000, 0, 0);
      expect(s1).toBeGreaterThan(s2);
      expect(s2).toBeGreaterThan(s3);
    });

    test('score decreases as time difference increases', () => {
      const s1 = calculateMatchScore(0, 0, 0);
      const s2 = calculateMatchScore(0, 0, 15);
      const s3 = calculateMatchScore(0, 0, 30);
      expect(s1).toBeGreaterThan(s2);
      expect(s2).toBeGreaterThan(s3);
    });

    test('score is always between 0 and 100', () => {
      const cases = [
        [0, 0, 0], [500, 300, 10], [1000, 1000, 30], [2000, 2000, 60],
      ];
      cases.forEach(([d, s, t]) => {
        const score = calculateMatchScore(d, s, t);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      });
    });
  });
});
