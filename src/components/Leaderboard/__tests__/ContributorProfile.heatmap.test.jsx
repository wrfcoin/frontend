/** @jest-environment jsdom */
//
// frontend#329 — the "Contribution Activity" heatmap was 365 days of
// Math.random() generated at module load and rendered on a page whose other
// panels are live. Default build: honest not-available panel. Demo: sample.
import { jest } from '@jest/globals';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

const featuresMock = { demoSurfaces: false };
jest.unstable_mockModule('../../../config/features', () => ({
  default: featuresMock,
  FEATURES: featuresMock,
}));
jest.unstable_mockModule('../../../services/apiClient', () => ({
  apiClient: { get: jest.fn() },
}));

const { apiClient } = await import('../../../services/apiClient');
// The ungated page: the default export is the frontend#415 not-live gate.
const { ContributorProfile } = await import('../ContributorProfile');

function renderProfile() {
  apiClient.get.mockImplementation((path) => {
    if (path.endsWith('/achievements')) return Promise.resolve({ achievements: [] });
    if (path.endsWith('/stations')) return Promise.resolve({ stations: [] });
    if (path.endsWith('/activity')) return Promise.resolve({ activity: [] });
    return Promise.resolve({
      profile: {
        name: 'Test Contributor', avatar: 'TC', avatarColor: '#000', bio: '', memberSince: '2024',
        location: 'X', reputationTier: 'Bronze', totalStations: 0, totalReadings: 0, avgQualityScore: 0,
        totalWrfEarned: 0, globalRank: 1, consistencyStreak: 0,
      },
    });
  });
  return render(
    <MemoryRouter initialEntries={['/leaderboard/profile/0xabc']}>
      <Routes>
        <Route path="/leaderboard/profile/:address" element={<ContributorProfile />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ContributorProfile contribution activity (frontend#329)', () => {
  it('shows the honest not-available panel by default, with no sample calendar', async () => {
    featuresMock.demoSurfaces = false;
    renderProfile();
    await waitFor(() => expect(apiClient.get).toHaveBeenCalled());
    await waitFor(() => {
      expect(screen.getByTestId('contribution-activity-not-live')).toBeInTheDocument();
    });
    expect(document.body.textContent).not.toMatch(/SAMPLE DATA|illustrative/);
    expect(document.querySelectorAll('rect').length).toBe(0);
  });
});
