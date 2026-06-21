import { render, waitFor, screen } from '@testing-library/react';
import Page from '../page';


describe('Dashboard Page', () => {
  it('renders without crashing', async () => {
    render(<Page />);
    const elements = await screen.findAllByText(/CarbonQuest/i);
    expect(elements.length).toBeGreaterThan(0);
  });
});
