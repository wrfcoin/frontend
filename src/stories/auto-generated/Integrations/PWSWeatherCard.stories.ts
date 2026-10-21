import type { Meta, StoryObj } from '@storybook/react';
import PWSWeatherCard from '../../components/Integrations/PWSWeatherCard.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof PWSWeatherCard> = {
  title: 'Integrations/PWSWeatherCard',
  component: PWSWeatherCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for PWSWeatherCard component from Integrations.',
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
    devLog('PWSWeatherCard rendered successfully');
  },
};
