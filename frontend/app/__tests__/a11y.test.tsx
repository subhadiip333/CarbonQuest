import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import Page from '../page';

expect.extend(toHaveNoViolations);

describe('Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<Page />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
