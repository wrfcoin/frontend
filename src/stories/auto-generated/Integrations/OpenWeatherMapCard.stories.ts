import type { Meta, StoryObj } from '@storybook/react';
import OpenWeatherMapCard from '../../components/Integrations/OpenWeatherMapCard.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof OpenWeatherMapCard> = {
  title: 'Integrations/OpenWeatherMapCard',
  component: OpenWeatherMapCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for OpenWeatherMapCard component from Integrations.',
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
    devLog('OpenWeatherMapCard rendered successfully');
  },
};
