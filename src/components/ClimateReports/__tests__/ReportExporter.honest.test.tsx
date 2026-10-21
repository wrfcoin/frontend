/** @jest-environment jsdom */
//
// frontend#330 — ReportExporter animated a random progress bar and then
// claimed "Report generated successfully!" with no artifact and no service.
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ReportExporter from '../ReportExporter';
import type { Region } from '../ClimateReportDashboard';

const annualData = [{ year: 2024 }, { year: 2025 }] as any;
const region: Region = {
  id: 'test-region',
  name: 'Test Region',
  type: 'custom',
  stationCount: 0,
  center: [0.0, 10.0],
  bbox: [[0.0, 10.0], [20.0, 20.0]],
};

describe('ReportExporter (frontend#330)', () => {
  it('says export is not available instead of faking progress and success', () => {
    render(<ReportExporter region={region} annualData={annualData} seasonData={[] as any} />);
    fireEvent.click(screen.getByRole('button', { name: /Generate Report/ }));
    expect(screen.getByTestId('report-export-not-live')).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/Generating report|generated successfully|published to blockchain|\d+%/);
    expect(screen.getByRole('button', { name: /Generate Report/ })).toBeDisabled();
  });
});
