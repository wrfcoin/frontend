import type { Meta, StoryObj } from '@storybook/react';
import GraphQLQueryInterface from '../../components/ComputationalNFT/GraphQLQueryInterface.jsx';
import { devLog } from '../../../utils/logger';

const meta: Meta<typeof GraphQLQueryInterface> = {
  title: 'ComputationalNFT/GraphQLQueryInterface',
  component: GraphQLQueryInterface,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auto-generated story for GraphQLQueryInterface component from ComputationalNFT.',
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
    devLog('GraphQLQueryInterface rendered successfully');
  },
};
