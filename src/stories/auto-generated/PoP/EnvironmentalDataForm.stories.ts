import type { Meta, StoryObj } from '@storybook/react';
import EnvironmentalDataForm from '../../components/PoP/EnvironmentalDataForm.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof EnvironmentalDataForm> = {
  title: 'PoP/EnvironmentalDataForm',
  component: EnvironmentalDataForm,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for EnvironmentalDataForm component from PoP.',
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
    devLog('EnvironmentalDataForm rendered successfully');
  },
};
