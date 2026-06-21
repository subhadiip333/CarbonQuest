import '@testing-library/jest-dom';

window.HTMLElement.prototype.scrollIntoView = jest.fn();

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

global.fetch = jest.fn((url) => {
  let data = {};
  if (url.includes('/activities') || url.includes('/challenges') || url.includes('/marketplace') || url.includes('/leaderboard') || url.includes('/coach/history') || url.includes('/places/autocomplete') || url.includes('/coach/journal')) {
    data = [];
  } else if (url.includes('/profile')) {
    data = { name: 'Test User', level: 1, xp: 0, xpNeeded: 100, coins: 0, greenPoints: 0, streakDays: 0, avatarState: 'healthy', avatarScore: 50 };
  } else if (url.includes('/coach/forecast')) {
    data = { predictedEmissionsKg: 100, trend: 'improving', trajectoryScore: 80, explanation: 'Test' };
  }
  return Promise.resolve({
    json: () => Promise.resolve({ data, status: 'success' }),
  });
});
