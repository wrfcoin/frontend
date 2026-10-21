import type { Meta, StoryObj } from '@storybook/react';
import API3Card from '../../components/Integrations/API3Card.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof API3Card> = {
  title: 'Integrations/API3Card',
  component: API3Card,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for API3Card component from Integrations.',
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
    devLog('API3Card rendered successfully');
  },
};
