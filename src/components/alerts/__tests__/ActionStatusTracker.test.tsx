/**
 * @jest-environment jsdom
 */
/**
 * Tests for ActionStatusTracker component (Issue #256)
 */
import { jest } from '@jest/globals';
import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import ActionStatusTracker from '../ActionStatusTracker';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ActionStatusTracker', () => {
  it('returns null when status is idle', () => {
    const { container } = render(
      <ActionStatusTracker
        status="idle"
        result={null}
        error={null}
        onReset={jest.fn()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('shows "Executing action..." text when status is executing', () => {
    render(
      <ActionStatusTracker
        status="executing"
        result={null}
        error={null}
        onReset={jest.fn()}
      />,
    );
    expect(screen.getByText('Executing action...')).toBeInTheDocument();
    expect(screen.getByTestId('action-status-tracker')).toBeInTheDocument();
  });

  it('shows success message text when status is success', () => {
    render(
      <ActionStatusTracker
        status="success"
        result={{ incidentId: 'INC-12345', message: 'Bridge relay restarted successfully' }}
        error={null}
        onReset={jest.fn()}
      />,
    );
    expect(screen.getByText('Bridge relay restarted successfully')).toBeInTheDocument();
    expect(screen.getByText(/INC-12345/)).toBeInTheDocument();
    expect(screen.getByText('Reset')).toBeInTheDocument();
  });

  it('shows error message text when status is failure', () => {
    render(
      <ActionStatusTracker
        status="failure"
        result={null}
        error="Permission denied: insufficient role"
        onReset={jest.fn()}
      />,
    );
    expect(screen.getByText('Permission denied: insufficient role')).toBeInTheDocument();
    expect(screen.getByText('Reset')).toBeInTheDocument();
  });

  it('calls onReset when Reset button is clicked', () => {
    const onReset = jest.fn();
    render(
      <ActionStatusTracker
        status="success"
        result={{ message: 'Action completed' }}
        error={null}
        onReset={onReset}
      />,
    );

    fireEvent.click(screen.getByText('Reset'));
    expect(onReset).toHaveBeenCalledTimes(1);
  });
});
