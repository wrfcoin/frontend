import type { Meta, StoryObj } from '@storybook/react';
import ApiDocumentation from '../../components/developer/ApiDocumentation.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof ApiDocumentation> = {
  title: 'developer/ApiDocumentation',
  component: ApiDocumentation,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for ApiDocumentation component from developer.',
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
    devLog('ApiDocumentation rendered successfully');
  },
};
