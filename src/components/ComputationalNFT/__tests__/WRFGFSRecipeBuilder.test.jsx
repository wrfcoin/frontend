/** @jest-environment jsdom */
import { jest } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import '@testing-library/jest-dom';

const mockUseSubmitForecastTask = jest.fn();
const mockUseForecastTaskStatus = jest.fn();
const mockUseForecastTaskResults = jest.fn();

jest.unstable_mockModule('../../../hooks/api/useComputeQueries', () => ({
  useSubmitForecastTask: mockUseSubmitForecastTask,
  useForecastTaskStatus: mockUseForecastTaskStatus,
  useForecastTaskResults: mockUseForecastTaskResults,
}));

const { default: WRFGFSRecipeBuilder } = await import('../WRFGFSRecipeBuilder');
const theme = createTheme();

function renderBuilder(props = {}) {
  return render(
    <ThemeProvider theme={theme}>
      <WRFGFSRecipeBuilder {...props} />
    </ThemeProvider>,
  );
}

function clickLatestStepButton(label) {
  const buttons = screen.getAllByRole('button', { name: label });
  fireEvent.click(buttons[buttons.length - 1]);
}

describe('WRFGFSRecipeBuilder live flow states', () => {
  let warnSpy;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    mockUseSubmitForecastTask.mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue({
        taskId: 'task-1',
        status: 'queued',
      }),
      isPending: false,
    });
    mockUseForecastTaskStatus.mockReturnValue({
      data: undefined,
      error: null,
    });
    mockUseForecastTaskResults.mockReturnValue({
      data: undefined,
      error: null,
    });
  });

  afterEach(() => {
    warnSpy.mockRestore();
    jest.clearAllMocks();
  });

  it('renders task-failure state when status API reports failed', async () => {
    mockUseForecastTaskStatus.mockReturnValue({
      data: {
        status: 'failed',
        taskId: 'task-1',
        error: 'Consensus validation failed',
      },
      error: null,
    });

    renderBuilder();

    await waitFor(() => {
      expect(screen.getByText('Forecast task failed')).toBeInTheDocument();
    });
    expect(
      screen.getByText(/Consensus validation failed/i, { selector: 'p' }),
    ).toBeInTheDocument();
  });

  it('shows configuration readiness progress while the recipe is still incomplete', () => {
    renderBuilder({
      initialRecipe: {
        model: 'wrf',
        datasets: ['gfs'],
      },
    });

    expect(screen.getByText('Configuration readiness')).toBeInTheDocument();
    expect(screen.getByText('2 of 4 required checks complete.')).toBeInTheDocument();
    expect(screen.getByText('2 checks remaining')).toBeInTheDocument();
    expect(
      screen.getByText('Choose a compute provider and validation method.'),
    ).toBeInTheDocument();
  });

  it('streams live task activity updates when status polling returns logs', async () => {
    mockUseForecastTaskStatus.mockReturnValue({
      data: {
        status: 'running',
        taskId: 'task-1',
        progress: 42,
        updatedAt: '2026-04-05T16:00:00.000Z',
        logs: ['Scheduler accepted recipe', 'Dequeued weather model job'],
      },
      error: null,
    });

    renderBuilder({
      initialRecipe: {
        model: 'wrf',
        datasets: ['gfs'],
        computeEnvironment: 'dedicated-weather-cluster',
        validation: 'timestamp',
        resolution: 'high',
      },
    });

    await waitFor(() => {
      expect(screen.getByText('Live job activity')).toBeInTheDocument();
    });

    expect(screen.getByText(/Task running at 42%/i)).toBeInTheDocument();
    expect(screen.getByText('Scheduler accepted recipe')).toBeInTheDocument();
    expect(screen.getByText('Dequeued weather model job')).toBeInTheDocument();
  });

  it('shows a live progress snapshot while the task is running', async () => {
    mockUseForecastTaskStatus.mockReturnValue({
      data: {
        status: 'running',
        taskId: 'task-1',
        progress: 42,
        updatedAt: '2026-04-05T16:00:00.000Z',
      },
      error: null,
    });

    renderBuilder({
      initialRecipe: {
        model: 'wrf',
        datasets: ['gfs'],
        computeEnvironment: 'dedicated-weather-cluster',
        validation: 'timestamp',
        resolution: 'high',
      },
    });

    await waitFor(() => {
      expect(screen.getByText('42% complete')).toBeInTheDocument();
    });
  });

  it('renders success state with clickable output, verification, and receipt links', async () => {
    mockUseForecastTaskStatus.mockReturnValue({
      data: {
        status: 'completed',
        taskId: 'task-1',
      },
      error: null,
    });
    mockUseForecastTaskResults.mockReturnValue({
      data: {
        status: 'completed',
        taskId: 'task-1',
        outputCid: 'bafy-output',
        verificationReportCid: 'ipfs://bafy-verify',
        receiptTxHash: '0xabc123',
      },
      error: null,
    });

    renderBuilder();

    await waitFor(() => {
      expect(screen.getByText('Recipe submitted successfully')).toBeInTheDocument();
    });

    expect(screen.getByRole('link', { name: 'bafy-output' })).toHaveAttribute(
      'href',
      'https://ipfs.io/ipfs/bafy-output',
    );
    expect(screen.getByRole('link', { name: 'ipfs://bafy-verify' })).toHaveAttribute(
      'href',
      'https://ipfs.io/ipfs/bafy-verify',
    );
    expect(screen.getByRole('link', { name: '0xabc123' })).toHaveAttribute(
      'href',
      'https://etherscan.io/tx/0xabc123',
    );
  });

  it('shows validation-failure message when submission response has no task identifier', async () => {
    mockUseSubmitForecastTask.mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue({
        status: 'queued',
      }),
      isPending: false,
    });

    renderBuilder({
      initialStep: 3,
      initialRecipe: {
        model: 'gfs',
        datasets: ['noaa-api'],
        computeEnvironment: 'local-wrf',
        validation: 'timestamp',
        resolution: 'standard',
      },
    });

    clickLatestStepButton('Submit Recipe');

    await waitFor(() => {
      expect(
        screen.getByText('Submission response did not include a task identifier.'),
      ).toBeInTheDocument();
    });
  });

  it('shows fallback failure message when task fails without an explicit error', async () => {
    mockUseForecastTaskStatus.mockReturnValue({
      data: {
        status: 'failed',
        taskId: 'task-1',
      },
      error: null,
    });

    renderBuilder();

    await waitFor(() => {
      expect(screen.getByText('The compute task failed.')).toBeInTheDocument();
    });
  });

  it('renders cancelled state with retry action', async () => {
    mockUseForecastTaskStatus.mockReturnValue({
      data: {
        status: 'cancelled',
        taskId: 'task-1',
      },
      error: null,
    });

    renderBuilder();

    await waitFor(() => {
      expect(screen.getByText('Forecast task cancelled')).toBeInTheDocument();
    });
  });

  it('shows results polling errors as failure state', async () => {
    mockUseForecastTaskResults.mockReturnValue({
      data: undefined,
      error: new Error('Results endpoint unavailable'),
    });

    renderBuilder();

    await waitFor(() => {
      expect(screen.getByText('Forecast task failed')).toBeInTheDocument();
    });
    expect(screen.getByText('Results endpoint unavailable')).toBeInTheDocument();
  });

  it('shows field-level error when no model is selected on step 0', () => {
    renderBuilder();
    expect(
      screen.getByText('Select a forecast model to continue.'),
    ).toBeInTheDocument();
  });

  it('shows field-level error when no datasets are selected on step 1', () => {
    renderBuilder({ initialStep: 1 });
    expect(
      screen.getByText('Select at least one dataset to continue.'),
    ).toBeInTheDocument();
  });

  it('shows field-level errors on both required selects when step 2 is empty', () => {
    renderBuilder({ initialStep: 2 });
    expect(screen.getByText('Compute provider is required.')).toBeInTheDocument();
    expect(screen.getByText('Validation method is required.')).toBeInTheDocument();
  });

  it('hides compute field error once a compute provider is selected', () => {
    renderBuilder({
      initialStep: 2,
      initialRecipe: { computeEnvironment: 'local-wrf' },
    });
    expect(
      screen.queryByText('Compute provider is required.'),
    ).not.toBeInTheDocument();
    expect(screen.getByText('Validation method is required.')).toBeInTheDocument();
  });

  it('shows a success toast when task results arrive as completed', async () => {
    mockUseForecastTaskResults.mockReturnValue({
      data: {
        status: 'completed',
        taskId: 'task-1',
        outputCid: 'bafy-out',
      },
      error: null,
    });

    renderBuilder();

    await waitFor(() => {
      expect(
        screen.getByText('Recipe completed — results are ready.'),
      ).toBeInTheDocument();
    });
  });

  it('shows an error toast when status API reports failed', async () => {
    mockUseForecastTaskStatus.mockReturnValue({
      data: {
        status: 'failed',
        taskId: 'task-1',
        error: 'Consensus validation failed',
      },
      error: null,
    });

    renderBuilder();

    await waitFor(() => {
      const toastMessages = screen.getAllByText(/Consensus validation failed/i);
      expect(toastMessages.length).toBeGreaterThan(0);
    });
  });

  it('shows a warning toast when task is cancelled', async () => {
    mockUseForecastTaskStatus.mockReturnValue({
      data: { status: 'cancelled', taskId: 'task-1' },
      error: null,
    });

    renderBuilder();

    await waitFor(() => {
      expect(
        screen.getByText('Forecast task was cancelled.'),
      ).toBeInTheDocument();
    });
  });

  it('shows Submitting… label on the submit button while pending', () => {
    mockUseSubmitForecastTask.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: true,
    });

    renderBuilder({
      initialStep: 3,
      initialRecipe: {
        model: 'gfs',
        datasets: ['noaa-api'],
        computeEnvironment: 'local-wrf',
        validation: 'timestamp',
        resolution: 'standard',
      },
    });

    expect(screen.getByRole('button', { name: /Submitting/i })).toBeInTheDocument();
  });
});
