import type { Meta, StoryObj } from '@storybook/react';
import SecurityDocs from '../../components/Resources/SecurityDocs.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof SecurityDocs> = {
  title: 'Resources/SecurityDocs',
  component: SecurityDocs,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for SecurityDocs component from Resources.',
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
    devLog('SecurityDocs rendered successfully');
  },
};
