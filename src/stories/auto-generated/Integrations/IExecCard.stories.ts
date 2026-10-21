import type { Meta, StoryObj } from '@storybook/react';
import IExecCard from '../../components/Integrations/IExecCard.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof IExecCard> = {
  title: 'Integrations/IExecCard',
  component: IExecCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for IExecCard component from Integrations.',
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
    devLog('IExecCard rendered successfully');
  },
};
