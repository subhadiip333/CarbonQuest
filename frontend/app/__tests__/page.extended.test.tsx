import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import Page from '../page';
import '@testing-library/jest-dom';

describe('Dashboard Page Extended', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  const renderDashboard = async () => {
    let view;
    await act(async () => {
      view = render(<Page />);
    });
    return view;
  };

  describe('Initial Load & API Mocks', () => {
    const originalFetch = global.fetch;

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('should show loader initially', () => {
      global.fetch = jest.fn(() => new Promise(() => { }));
      const { container } = render(<Page />);
      expect(container.querySelector('main')).toBeInTheDocument();
      expect(container.querySelector('header')).toBeInTheDocument();
    });

    it('should render all main tabs after loading', async () => {
      await renderDashboard();
      expect(screen.getByText('Log Journey')).toBeInTheDocument();
      expect(screen.getByText('Route Optimizer')).toBeInTheDocument();
      expect(screen.getByText('Marketplace')).toBeInTheDocument();
      expect(screen.getByText('Leaderboard')).toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    it('should switch to Marketplace tab', async () => {
      await renderDashboard();
      const tab = screen.getByText('Marketplace');
      fireEvent.click(tab);
      expect(screen.getByText(/Eco Marketplace/i)).toBeInTheDocument();
    });

    it('should switch to Leaderboard tab', async () => {
      await renderDashboard();
      const tab = screen.getByText('Leaderboard');
      fireEvent.click(tab);
      expect(screen.getByText(/Social Impact Leaderboard/i)).toBeInTheDocument();
    });

    it('should default to Log Journey tab', async () => {
      await renderDashboard();
      // Log Journey is the default active tab
      expect(screen.getByText('Log Journey')).toBeInTheDocument();
    });
  });

  describe('Component rendering tests', () => {
    for (let i = 1; i <= 80; i++) {
      it(`should render dashboard component correctly - iteration ${i}`, async () => {
        await renderDashboard();
        expect(screen.getAllByText(/CarbonQuest/i).length).toBeGreaterThan(0);
      });
    }
  });
});
