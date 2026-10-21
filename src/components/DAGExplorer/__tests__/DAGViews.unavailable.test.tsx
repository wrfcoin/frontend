/** @jest-environment jsdom */
import { jest } from '@jest/globals';
import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
const flags = { demoSurfaces: false };
jest.unstable_mockModule('../../../config/features', () => ({ default: flags, FEATURES: flags }));
const get = jest.fn(async () => { throw new Error('404: no dag API'); });
jest.unstable_mockModule('../../../services/apiClient', () => ({ apiClient: { get } }));
const { default: DAGExplorer } = await import('../DAGExplorer');
const { default: DAGBlockExplorer } = await import('../../BlockExplorerDAG/DAGBlockExplorer');
afterEach(() => { cleanup(); get.mockClear(); flags.demoSurfaces = false; });
it.each([DAGExplorer, DAGBlockExplorer])('an unsupported DAG view has no block claims, controls or requests', View => {
  render(<View />);
  expect(screen.getByText('DAG data is unavailable')).toBeInTheDocument();
  expect(screen.queryByPlaceholderText(/Search block/)).not.toBeInTheDocument();
  expect(screen.queryByText('Heights:')).not.toBeInTheDocument();
  expect(screen.queryByRole('slider')).not.toBeInTheDocument();
  expect(get).not.toHaveBeenCalled();
});
it.each([[DAGExplorer, 'dag-explorer'], [DAGBlockExplorer, 'dag-block-explorer']] as const)('the opt-in graph is labelled illustrative', async (View, id) => {
  flags.demoSurfaces = true;
  render(<View />);
  expect(screen.getByTestId(`${id}-sample-badge`)).toHaveTextContent('Sample data');
  await waitFor(() => expect(get).toHaveBeenCalledWith('/dag/blocks'));
});
