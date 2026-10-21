import type { Meta, StoryObj } from '@storybook/react';
import SuiWalrusCard from '../../components/Integrations/SuiWalrusCard.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof SuiWalrusCard> = {
  title: 'Integrations/SuiWalrusCard',
  component: SuiWalrusCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for SuiWalrusCard component from Integrations.',
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
    devLog('SuiWalrusCard rendered successfully');
  },
};
