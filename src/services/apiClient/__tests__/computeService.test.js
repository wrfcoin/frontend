import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ComputeService } from '../computeService';
import { ApiErrorCode } from '../../../utils/apiError';

describe('ComputeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it('normalizes submit/status/results payloads', async () => {
    const service = new ComputeService({
      api: 'https://api.example.com',
      weather: 'https://api.example.com',
      earnings: 'https://api.example.com',
      governance: 'https://api.example.com',
      wallet: 'https://api.example.com',
      compute: 'https://api.example.com',
      validator: 'https://api.example.com',
    });

    global.fetch
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true, data: { taskId: 'task-1', status: 'queued' } }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true, data: { status: 'running', progress: 37 } }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            data: {
              status: 'completed',
              results: { outputCid: 'bafy-output', verification_report_cid: 'bafy-verify' },
            },
          }),
          { status: 200 },
        ),
      );

    const submission = await service.submitForecastTask({
      model: 'wrf',
      datasets: ['gfs'],
      computeEnvironment: 'dedicated-weather-cluster',
      validation: 'timestamp',
      resolution: 'high',
      forecastHours: 48,
      carbonOffset: false,
      academicEndorsement: false,
    });

    const status = await service.getTaskStatus(submission.taskId);
    const results = await service.getTaskResults(submission.taskId);

    expect(submission).toMatchObject({ taskId: 'task-1', status: 'queued' });
    expect(status).toMatchObject({ status: 'running', progress: 37 });
    expect(results).toMatchObject({ status: 'completed', outputCid: 'bafy-output', verificationReportCid: 'bafy-verify' });
  });

  it('throws a typed server error on malformed status payloads', async () => {
    const service = new ComputeService({
      api: 'https://api.example.com',
      weather: 'https://api.example.com',
      earnings: 'https://api.example.com',
      governance: 'https://api.example.com',
      wallet: 'https://api.example.com',
      compute: 'https://api.example.com',
      validator: 'https://api.example.com',
    });

    global.fetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true, data: null }), { status: 200 }),
    );

    await expect(service.getTaskStatus('task-1')).rejects.toMatchObject({
      code: ApiErrorCode.SERVER_ERROR,
    });
  });
});
