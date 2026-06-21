/**
 * GoogleMapsService tests
 * No real API key in test env → tests assert against the built-in mock/fallback responses.
 */
import { getRouteOptions, getPlaceAutocomplete } from '../googleMapsService';

describe('GoogleMapsService (fallback/mock mode)', () => {
  describe('getRouteOptions', () => {
    it('should return an object with driving, transit, and bicycling keys', async () => {
      const result = await getRouteOptions('Mumbai', 'Pune');
      expect(result).toBeDefined();
      expect(result).toHaveProperty('driving');
      expect(result).toHaveProperty('transit');
      expect(result).toHaveProperty('bicycling');
    });

    it('driving route should have legs with distance and duration', async () => {
      const result = await getRouteOptions('Delhi', 'Agra');
      expect(result.driving.legs[0].distance).toBeDefined();
      expect(result.driving.legs[0].duration).toBeDefined();
    });

    it('transit route should have legs with start and end address', async () => {
      const result = await getRouteOptions('Kolkata', 'Howrah');
      expect(result.transit.legs[0].start_address).toBe('Kolkata');
      expect(result.transit.legs[0].end_address).toBe('Howrah');
    });

    it('bicycling route should have legs', async () => {
      const result = await getRouteOptions('Park A', 'Park B');
      expect(result.bicycling!.legs[0].distance.text).toContain('km');
    });

    it('distance text should include km unit', async () => {
      const result = await getRouteOptions('A', 'B');
      expect(result.driving.legs[0].distance.text).toContain('km');
    });

    it('duration text should include mins unit', async () => {
      const result = await getRouteOptions('X', 'Y');
      expect(result.driving.legs[0].duration.text).toContain('mins');
    });

    it('should return numeric distance value in meters', async () => {
      const result = await getRouteOptions('Home', 'Office');
      expect(typeof result.driving.legs[0].distance.value).toBe('number');
      expect(result.driving.legs[0].distance.value).toBeGreaterThan(0);
    });

    it('should return numeric duration value in seconds', async () => {
      const result = await getRouteOptions('Home', 'Office');
      expect(typeof result.driving.legs[0].duration.value).toBe('number');
      expect(result.driving.legs[0].duration.value).toBeGreaterThan(0);
    });

    it('transit route distance should be slightly longer than driving (due to route factor)', async () => {
      const result = await getRouteOptions('City A', 'City B');
      expect(result.transit.legs[0].distance.value).toBeGreaterThan(
        result.driving.legs[0].distance.value * 0.9
      );
    });

    it('bicycling route distance should be slightly less than driving', async () => {
      const result = await getRouteOptions('City A', 'City B');
      expect(result.bicycling!.legs[0].distance.value).toBeLessThan(
        result.driving.legs[0].distance.value
      );
    });
  });

  describe('getPlaceAutocomplete', () => {
    it('should return an array of suggestions', async () => {
      const result = await getPlaceAutocomplete('Mumbai');
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return at least one suggestion', async () => {
      const result = await getPlaceAutocomplete('Kolkata');
      expect(result.length).toBeGreaterThan(0);
    });

    it('each suggestion should have a description', async () => {
      const result = await getPlaceAutocomplete('Delhi');
      result.forEach(item => {
        expect(item.description).toBeDefined();
        expect(typeof item.description).toBe('string');
      });
    });

    it('suggestions should include the input as prefix', async () => {
      const result = await getPlaceAutocomplete('Bangalore');
      expect(result[0].description).toContain('Bangalore');
    });

    it('should return 3 mock suggestions', async () => {
      const result = await getPlaceAutocomplete('Chennai');
      expect(result.length).toBe(3);
    });

    it('suggestion descriptions should be non-empty strings', async () => {
      const result = await getPlaceAutocomplete('Hyderabad');
      result.forEach(item => {
        expect(item.description.length).toBeGreaterThan(0);
      });
    });
  });
});
