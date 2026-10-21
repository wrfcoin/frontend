/**
 * @jest-environment jsdom
 *
 * #214 follow-up — ConnectionStatus must not fabricate connection health.
 *
 * The old component invented Math.random latency and dice-rolled status flips
 * for four hardcoded "healthy" endpoints while mounted app-wide as a banner.
 * These tests pin the honest contract: the rendered state is exactly the real
 * WebSocket signal from useWebSocket(), unmonitored channels say
 * "Not monitored", and no latency figure is ever shown unless supplied.
 *
 * What this suite does NOT pin: the banner's 5s debounce timing, and the
 * behavior of externally supplied `connections` beyond pass-through rendering.
 */
import { jest } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

const mockUseWebSocket = jest.fn();
await jest.unstable_mockModule('../../../hooks/useWebSocket', () => ({
  default: mockUseWebSocket,
}));

const { default: ConnectionStatus } = await import('../ConnectionStatus.jsx');

describe('ConnectionStatus (#214: no fabricated health)', () => {
  beforeEach(() => {
    mockUseWebSocket.mockReset();
  });

  it('reports the real WebSocket status and marks unprobed channels "Not monitored"', () => {
    mockUseWebSocket.mockReturnValue({ status: 'connected', reconnect: jest.fn() });
    render(<ConnectionStatus />);

    expect(screen.getByText('Connected (1 of 4 channels monitored)')).toBeTruthy();
    // The three unprobed channels are visibly unknown, not silently "healthy".
    expect(screen.getAllByText('Not monitored').length).toBe(3);
  });

  it('never shows a latency figure it did not measure', () => {
    mockUseWebSocket.mockReturnValue({ status: 'connected', reconnect: jest.fn() });
    const { container } = render(<ConnectionStatus />);

    // Expand the details pane — latency cells render there when present.
    fireEvent.click(screen.getByText('Connected (1 of 4 channels monitored)'));
    expect(container.textContent).not.toMatch(/\d+ms/);
  });

  it('renders Disconnected from the real signal and wires Reconnect to the real client', () => {
    const reconnect = jest.fn();
    mockUseWebSocket.mockReturnValue({ status: 'disconnected', reconnect });
    render(<ConnectionStatus />);

    // Header label and row status label both read "Disconnected"; the header
    // is the first occurrence and is the expand toggle.
    fireEvent.click(screen.getAllByText('Disconnected')[0]);
    fireEvent.click(screen.getByRole('button', { name: /reconnect/i }));
    expect(reconnect).toHaveBeenCalledTimes(1);
  });

  it('maps the hook\'s \'error\' state to Disconnected rather than guessing', () => {
    mockUseWebSocket.mockReturnValue({ status: 'error', reconnect: jest.fn() });
    render(<ConnectionStatus compact />);

    expect(screen.getByText('Offline')).toBeTruthy();
  });

  it('renders externally supplied connections exactly as given', () => {
    mockUseWebSocket.mockReturnValue({ status: 'connected', reconnect: jest.fn() });
    render(
      <ConnectionStatus
        connections={[
          { id: 'x', name: 'Gateway', icon: 'api', status: 'degraded', latency: 210, endpoint: 'https://gw' },
        ]}
      />,
    );

    fireEvent.click(screen.getAllByText('Degraded')[0]);
    expect(screen.getByText('Gateway')).toBeTruthy();
    expect(screen.getByText('210ms')).toBeTruthy();
  });
});
