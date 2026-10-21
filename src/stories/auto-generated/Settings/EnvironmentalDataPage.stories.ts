import type { Meta, StoryObj } from '@storybook/react';
import EnvironmentalDataPage from '../../components/Settings/EnvironmentalDataPage.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof EnvironmentalDataPage> = {
  title: 'Settings/EnvironmentalDataPage',
  component: EnvironmentalDataPage,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for EnvironmentalDataPage component from Settings.',
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
    devLog('EnvironmentalDataPage rendered successfully');
  },
};
