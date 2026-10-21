import type { Meta, StoryObj } from '@storybook/react';
import AmbientWeatherCard from '../../components/Integrations/AmbientWeatherCard.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof AmbientWeatherCard> = {
  title: 'Integrations/AmbientWeatherCard',
  component: AmbientWeatherCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for AmbientWeatherCard component from Integrations.',
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
    devLog('AmbientWeatherCard rendered successfully');
  },
};
