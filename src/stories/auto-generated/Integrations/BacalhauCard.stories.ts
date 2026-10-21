import type { Meta, StoryObj } from '@storybook/react';
import BacalhauCard from '../../components/Integrations/BacalhauCard.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof BacalhauCard> = {
  title: 'Integrations/BacalhauCard',
  component: BacalhauCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for BacalhauCard component from Integrations.',
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
    devLog('BacalhauCard rendered successfully');
  },
};
