import type { Meta, StoryObj } from '@storybook/react';
import SecurityPage from '../../components/Settings/SecurityPage.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof SecurityPage> = {
  title: 'Settings/SecurityPage',
  component: SecurityPage,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for SecurityPage component from Settings.',
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
    devLog('SecurityPage rendered successfully');
  },
};
