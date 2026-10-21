import type { Meta, StoryObj } from '@storybook/react';
import ValidatorReputationScore from '../../components/Oracle/ValidatorReputationScore.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof ValidatorReputationScore> = {
  title: 'Oracle/ValidatorReputationScore',
  component: ValidatorReputationScore,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for ValidatorReputationScore component from Oracle.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    // Auto-generated argTypes - customize as needed
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
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    // Add interaction tests here
    devLog('ValidatorReputationScore rendered successfully');
  },
};
