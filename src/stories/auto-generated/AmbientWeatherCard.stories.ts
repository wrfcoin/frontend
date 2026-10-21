import type { Meta, StoryObj } from '@storybook/react';
import AmbientWeatherCard from '../../Integrations/AmbientWeatherCard.jsx';

const meta: Meta<typeof AmbientWeatherCard> = {
  title: 'Components/Integrations/AmbientWeatherCard',
  component: AmbientWeatherCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    // No props detected
  },
};
