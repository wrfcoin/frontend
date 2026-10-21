import type { Meta, StoryObj } from '@storybook/react';
import WeatherUndergroundCard from '../../components/Integrations/WeatherUndergroundCard.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof WeatherUndergroundCard> = {
  title: 'Integrations/WeatherUndergroundCard',
  component: WeatherUndergroundCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for WeatherUndergroundCard component from Integrations.',
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
    devLog('WeatherUndergroundCard rendered successfully');
  },
};
