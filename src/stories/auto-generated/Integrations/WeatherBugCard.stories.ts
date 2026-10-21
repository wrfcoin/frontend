import type { Meta, StoryObj } from '@storybook/react';
import WeatherBugCard from '../../components/Integrations/WeatherBugCard.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof WeatherBugCard> = {
  title: 'Integrations/WeatherBugCard',
  component: WeatherBugCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for WeatherBugCard component from Integrations.',
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
    devLog('WeatherBugCard rendered successfully');
  },
};
