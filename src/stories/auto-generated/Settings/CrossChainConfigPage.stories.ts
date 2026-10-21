import type { Meta, StoryObj } from '@storybook/react';
import CrossChainConfigPage from '../../components/Settings/CrossChainConfigPage.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof CrossChainConfigPage> = {
  title: 'Settings/CrossChainConfigPage',
  component: CrossChainConfigPage,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for CrossChainConfigPage component from Settings.',
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
    devLog('CrossChainConfigPage rendered successfully');
  },
};
