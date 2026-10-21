/**
 * @jest-environment jsdom
 */
/**
 * Tests for RemediationActionPanel component (Issue #256)
 */
import { jest } from '@jest/globals';
import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, within } from '@testing-library/react';
import RemediationActionPanel from '../RemediationActionPanel';
import type { RemediationAction } from '../../../hooks/useActiveAlerts';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const makeActions: () => RemediationAction[] = () => [
  {
    action: 'restart_bridge_relay',
    riskLevel: 'medium',
    description: 'Restart the cross-chain bridge relay service',
    requiresReason: true,
    cooldownRemaining: 0,
    enabled: true,
  },
  {
    action: 'flush_cache',
    riskLevel: 'low',
    description: 'Flush the Redis cache layer',
    requiresReason: false,
    cooldownRemaining: 0,
    enabled: true,
  },
  {
    action: 'failover_database',
    riskLevel: 'high',
    description: 'Trigger database failover to replica',
    requiresReason: true,
    cooldownRemaining: 0,
    enabled: true,
  },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('RemediationActionPanel', () => {
  it('renders action names and risk level chips', () => {
    render(
      <RemediationActionPanel
        alertId="alert-1"
        alertName="Test Alert"
        actions={makeActions()}
        userRole="admin"
        onExecute={jest.fn()}
      />,
    );

    expect(screen.getByText('restart_bridge_relay')).toBeInTheDocument();
    expect(screen.getByText('flush_cache')).toBeInTheDocument();
    expect(screen.getByText('failover_database')).toBeInTheDocument();
    expect(screen.getByText('medium')).toBeInTheDocument();
    expect(screen.getByText('low')).toBeInTheDocument();
    expect(screen.getByText('high')).toBeInTheDocument();
  });

  it('does NOT render Execute button when userRole is operator', () => {
    render(
      <RemediationActionPanel
        alertId="alert-1"
        alertName="Test Alert"
        actions={makeActions()}
        userRole="operator"
        onExecute={jest.fn()}
      />,
    );

    expect(screen.queryByText('Execute')).not.toBeInTheDocument();
  });

  it('renders Execute buttons when userRole is admin', () => {
    render(
      <RemediationActionPanel
        alertId="alert-1"
        alertName="Test Alert"
        actions={makeActions()}
        userRole="admin"
        onExecute={jest.fn()}
      />,
    );

    // Should have one Execute button per action
    const executeButtons = screen.getAllByText('Execute');
    expect(executeButtons.length).toBe(3);
  });

  it('opens confirmation dialog when clicking execute on a medium-risk action', () => {
    render(
      <RemediationActionPanel
        alertId="alert-1"
        alertName="Test Alert"
        actions={makeActions()}
        userRole="admin"
        onExecute={jest.fn()}
      />,
    );

    // Find the action row containing 'restart_bridge_relay' and click its Execute
    const actionRows = screen.getAllByTestId('action-row');
    const mediumRiskRow = actionRows.find((row) =>
      within(row).queryByText('restart_bridge_relay'),
    )!;
    const executeBtn = within(mediumRiskRow).getByText('Execute');
    fireEvent.click(executeBtn);

    // Dialog should appear with "Provide a reason" title
    expect(screen.getByText('Provide a reason')).toBeInTheDocument();
  });

  it('shows "Reason is required" when submitting dialog with empty reason', () => {
    render(
      <RemediationActionPanel
        alertId="alert-1"
        alertName="Test Alert"
        actions={makeActions()}
        userRole="admin"
        onExecute={jest.fn()}
      />,
    );

    // Open the dialog for a requiresReason action
    const actionRows = screen.getAllByTestId('action-row');
    const mediumRiskRow = actionRows.find((row) =>
      within(row).queryByText('restart_bridge_relay'),
    )!;
    fireEvent.click(within(mediumRiskRow).getByText('Execute'));

    // Click Confirm without entering a reason
    fireEvent.click(screen.getByText('Confirm'));

    expect(screen.getByText('Reason is required')).toBeInTheDocument();
  });

  it('calls onExecute with action name and reason when confirmed', () => {
    const onExecute = jest.fn();
    render(
      <RemediationActionPanel
        alertId="alert-1"
        alertName="Test Alert"
        actions={makeActions()}
        userRole="admin"
        onExecute={onExecute}
      />,
    );

    // Open dialog for restart_bridge_relay
    const actionRows = screen.getAllByTestId('action-row');
    const mediumRiskRow = actionRows.find((row) =>
      within(row).queryByText('restart_bridge_relay'),
    )!;
    fireEvent.click(within(mediumRiskRow).getByText('Execute'));

    // Type a reason into the TextField
    const textarea = screen.getByPlaceholderText(
      'Enter reason for executing this action...',
    );
    fireEvent.change(textarea, { target: { value: 'Latency SLA breach' } });

    // Confirm
    fireEvent.click(screen.getByText('Confirm'));

    expect(onExecute).toHaveBeenCalledTimes(1);
    expect(onExecute).toHaveBeenCalledWith(
      'restart_bridge_relay',
      'Latency SLA breach',
    );
  });
});
