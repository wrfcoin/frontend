import type { Meta, StoryObj } from '@storybook/react';
import ComprehensiveGovernanceDashboard from '../../Governance/ComprehensiveGovernanceDashboard.jsx';

const meta: Meta<typeof ComprehensiveGovernanceDashboard> = {
  title: 'Components/Governance/ComprehensiveGovernanceDashboard',
  component: ComprehensiveGovernanceDashboard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    // No props detected
  },
};
