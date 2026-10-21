import type { Meta, StoryObj } from '@storybook/react';
import AcuRiteWeatherSubmission from '../../Environmental/AcuRiteWeatherSubmission.jsx';
import { devLog } from '../../utils/logger';

const meta: Meta<typeof AcuRiteWeatherSubmission> = {
  title: 'Components/Environmental/AcuRiteWeatherSubmission',
  component: AcuRiteWeatherSubmission,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# AcuRiteWeatherSubmission

Component from the Environmental category.

- **Props**: 0
- **Complexity**: medium
- **Lines**: 228
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
    devLog('AcuRiteWeatherSubmission rendered successfully');
  },
};
