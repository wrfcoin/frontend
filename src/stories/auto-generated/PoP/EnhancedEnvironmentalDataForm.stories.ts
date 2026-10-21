import type { Meta, StoryObj } from '@storybook/react';
import EnhancedEnvironmentalDataForm from '../../components/PoP/EnhancedEnvironmentalDataForm.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof EnhancedEnvironmentalDataForm> = {
  title: 'PoP/EnhancedEnvironmentalDataForm',
  component: EnhancedEnvironmentalDataForm,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for EnhancedEnvironmentalDataForm component from PoP.',
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
    devLog('EnhancedEnvironmentalDataForm rendered successfully');
  },
};
