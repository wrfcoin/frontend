/** @jest-environment jsdom */
import React from 'react';
import { jest } from '@jest/globals';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockUseIoTWebSocket = jest.fn();

jest.unstable_mockModule('../../../hooks/useIoTWebSocket', () => ({
  useIoTWebSocket: mockUseIoTWebSocket,
}));

jest.unstable_mockModule('@mui/material', () => ({
  Box: ({ children, ...p }: any) => <div {...p}>{children}</div>,
  Card: ({ children }: any) => <div>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  Typography: ({ children, ...p }: any) => <span {...p}>{children}</span>,
  Stack: ({ children }: any) => <div>{children}</div>,
  Chip: ({ label }: any) => <span>{label}</span>,
  Paper: ({ children }: any) => <div>{children}</div>,
  Grid: ({ children }: any) => <div>{children}</div>,
  Alert: ({ children, severity }: any) => <div role="alert" data-severity={severity}>{children}</div>,
  CircularProgress: () => <div role="progressbar" />,
  Button: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
  FormControl: ({ children }: any) => <div>{children}</div>,
  InputLabel: ({ children }: any) => <label>{children}</label>,
  Select: ({ children }: any) => <select>{children}</select>,
  MenuItem: ({ children, value }: any) => <option value={value}>{children}</option>,
  Switch: ({ checked, onChange }: any) => <input type="checkbox" checked={checked} onChange={onChange} />,
  FormControlLabel: ({ label, control }: any) => <label>{label}{control}</label>,
  IconButton: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
  Tooltip: ({ children }: any) => <>{children}</>,
  useTheme: () => ({ palette: {} }),
  alpha: (c: string, _: number) => c,
}));

jest.unstable_mockModule('@mui/icons-material', () => ({
  PlayArrow: () => null,
  Pause: () => null,
  Stop: () => null,
  Refresh: () => null,
  Download: () => null,
  Timeline: () => null,
  ThermostatAuto: () => null,
  Water: () => null,
  Air: () => null,
  Speed: () => null,
  Compress: () => null,
  LocationOn: () => null,
}));

jest.unstable_mockModule('react-chartjs-2', () => ({
  Line: () => null,
  Doughnut: () => null,
  Bar: () => null,
}));

jest.unstable_mockModule('chart.js', () => ({
  Chart: { register: () => {} },
  CategoryScale: class {},
  LinearScale: class {},
  PointElement: class {},
  LineElement: class {},
  Title: class {},
  Tooltip: class {},
  Legend: class {},
  ArcElement: class {},
  BarElement: class {},
}));

jest.unstable_mockModule('../../../services/api', () => ({
  SensorPlatform: {},
  SensorData: {},
}));

const baseHookResult = {
  data: [],
  isConnected: false,
  isConnecting: false,
  error: null,
  connect: jest.fn(),
  disconnect: jest.fn(),
  clearData: jest.fn(),
};

const { default: SensorDataStream } = await import('../SensorDataStream');

describe('SensorDataStream — defensive rendering', () => {
  afterEach(() => jest.clearAllMocks());

  it('shows "No Data Available" empty state when disconnected with no data', async () => {
    mockUseIoTWebSocket.mockReturnValue({ ...baseHookResult });
    await act(async () => {
      render(<SensorDataStream platforms={[]} selectedPlatform={null} />);
    });
    expect(screen.getByText('No Data Available')).toBeInTheDocument();
  });

  it('shows error alert when hook reports an error', async () => {
    mockUseIoTWebSocket.mockReturnValue({ ...baseHookResult, error: 'WebSocket connection failed' });
    await act(async () => {
      render(<SensorDataStream platforms={[]} selectedPlatform={null} />);
    });
    expect(screen.getByRole('alert')).toHaveTextContent('WebSocket connection failed');
  });

  it('does not crash when measurements field is missing from a data point', async () => {
    mockUseIoTWebSocket.mockReturnValue({
      ...baseHookResult,
      isConnected: true,
      data: [
        { timestamp: Date.now(), measurements: undefined, deviceId: 'dev-1', platform: 'ambient', location: undefined },
      ],
    });
    await act(async () => {
      render(<SensorDataStream platforms={[]} selectedPlatform={null} />);
    });
    // Should not throw — renders data points list (even if empty due to guard)
    expect(screen.getByText(/Data Points:/)).toBeInTheDocument();
  });
});
