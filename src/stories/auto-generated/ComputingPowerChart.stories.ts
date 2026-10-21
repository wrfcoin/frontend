import type { Meta, StoryObj } from '@storybook/react';
import ComputingPowerChart from '../../Dashboard/Charts/ComputingPowerChart.jsx';
import { devLog } from '../../utils/logger';

const meta: Meta<typeof ComputingPowerChart> = {
  title: 'Components/Dashboard/Charts/ComputingPowerChart',
  component: ComputingPowerChart,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# ComputingPowerChart

Component from the Dashboard/Charts category.

- **Props**: 0
- **Complexity**: medium
- **Lines**: 178
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    // No props detected
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    // No props detected
  },
};

export const Interactive: Story = {
  args: {
    // No props detected
  },
  play: async ({ canvasElement }) => {
    devLog('ComputingPowerChart rendered successfully');
  },
};
