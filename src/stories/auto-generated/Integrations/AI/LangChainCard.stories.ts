import type { Meta, StoryObj } from '@storybook/react';
import LangChainCard from '../../components/Integrations/AI/LangChainCard.jsx';
import { devLog } from '../../../../utils/logger';

const meta: Meta<typeof LangChainCard> = {
  title: 'Integrations/AI/LangChainCard',
  component: LangChainCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for LangChainCard component from Integrations/AI.',
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
    devLog('LangChainCard rendered successfully');
  },
};
