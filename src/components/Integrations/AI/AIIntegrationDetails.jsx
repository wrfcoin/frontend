import React, { useState, useEffect } from 'react';
import { WrfBadge } from '../../DesignSystem';
import './AIIntegrationDetails.css';

const AIIntegrationDetails = ({ integrationId }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [modelData, setModelData] = useState([]);
  const [apiStatus, setApiStatus] = useState({});
  const [stats, setStats] = useState({
    requestsToday: 0,
    modelsAvailable: 0,
    successRate: 0,
    avgResponseTime: 0,
  });
  const [selectedModel, setSelectedModel] = useState(null);
  const [testPrompt, setTestPrompt] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [testLoading, setTestLoading] = useState(false);

  // Simulated data for AI integrations
  const integrationDetails = {
    openai: {
      name: 'OpenAI',
      description:
        'Access to GPT-4o and DALL-E models for generating text, images, and more.',
      icon: 'bi-robot',
      color: '#10A37F',
      website: 'https://openai.com',
      apiDocs: 'https://platform.openai.com/docs/api-reference',
      maxContext: '128k tokens',
      capabilities: [
        'Text Generation',
        'Image Generation',
        'Embedding',
        'Function Calling',
      ],
      supportedModels: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo', 'dall-e-3'],
      defaultModel: 'gpt-4o',
      status: 'Connected',
      lastSync: '1 minute ago',
    },
    anthropic: {
      name: 'Anthropic',
      description:
        'Claude models for natural language generation with enhanced safety features.',
      icon: 'bi-lightbulb',
      color: '#3C46FF',
      website: 'https://www.anthropic.com',
      apiDocs:
        'https://docs.anthropic.com/claude/reference/getting-started-with-the-api',
      maxContext: '100k tokens',
      capabilities: [
        'Text Generation',
        'Function Calling',
        'Analysis',
        'Summarization',
      ],
      supportedModels: [
        'claude-3-7-sonnet-20250219',
        'claude-3-opus',
        'claude-3-sonnet',
        'claude-3-haiku',
      ],
      defaultModel: 'claude-3-7-sonnet-20250219',
      status: 'Connected',
      lastSync: '5 minutes ago',
    },
    langchain: {
      name: 'LangChain Analytics',
      description:
        'External AI-powered analytics for environmental data trends and network insights.',
      icon: 'bi-robot',
      color: '#1C3FAA',
      website: 'https://langchain.com',
      apiDocs: 'https://docs.langchain.com',
      maxContext: 'Unlimited (External Processing)',
      capabilities: [
        'Environmental Analysis',
        'Network Monitoring',
        'Governance Insights',
        'Cross-Chain Analytics',
      ],
      supportedModels: [
        'Environmental Trends Agent',
        'Network Health Monitor',
        'Governance Advisor',
      ],
      defaultModel: 'Environmental Trends Agent',
      status: 'Available',
      lastSync: 'Real-time',
      independence: 'Complete - No blockchain dependencies',
    },
    perplexity: {
      name: 'Perplexity',
      description:
        'AI models with integrated web search functionality for up-to-date information.',
      icon: 'bi-search',
      color: '#5436DA',
      website: 'https://www.perplexity.ai',
      apiDocs: 'https://docs.perplexity.ai',
      maxContext: '4k tokens',
      capabilities: ['Text Generation', 'Web Search', 'Question Answering'],
      supportedModels: [
        'llama-3.1-sonar-small-128k-online',
        'llama-3.1-sonar-large-128k-online',
        'llama-3.1-sonar-huge-128k-online',
      ],
      defaultModel: 'llama-3.1-sonar-small-128k-online',
      status: 'Configuration Required',
      lastSync: 'Never',
    },
    grok: {
      name: 'Grok AI (xAI)',
      description:
        'Grok AI models for competitive reasoning and inference tasks.',
      icon: 'bi-lightning',
      color: '#FF5E00',
      website: 'https://x.ai',
      apiDocs: 'https://docs.x.ai',
      maxContext: '8k tokens',
      capabilities: ['Text Generation', 'Problem Solving', 'Code Generation'],
      supportedModels: [
        'grok-2-1212',
        'grok-2-vision-1212',
        'grok-vision-beta',
        'grok-beta',
      ],
      defaultModel: 'grok-2-1212',
      status: 'Update Available',
      lastSync: '1.5 hours ago',
    },
    wolfram: {
      name: 'Wolfram Alpha',
      description:
        'Computational knowledge engine for mathematical and scientific computations.',
      icon: 'bi-calculator',
      color: '#DD1100',
      website: 'https://www.wolframalpha.com',
      apiDocs: 'https://products.wolframalpha.com/api/',
      maxContext: 'N/A',
      capabilities: [
        'Computation',
        'Data Analysis',
        'Formula Solving',
        'Visualization',
      ],
      supportedModels: [
        'Full Results API',
        'Short Answers API',
        'Spoken Results API',
      ],
      defaultModel: 'Full Results API',
      status: 'Connected',
      lastSync: '32 minutes ago',
    },
    gemini: {
      name: 'Google Gemini',
      description:
        'Google\'s multimodal AI system for text, code, and vision tasks.',
      icon: 'bi-google',
      color: '#4285F4',
      website: 'https://ai.google.dev',
      apiDocs: 'https://ai.google.dev/docs',
      maxContext: '32k tokens',
      capabilities: [
        'Text Generation',
        'Code Generation',
        'Image Analysis',
        'Multimodal',
      ],
      supportedModels: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.0-pro'],
      defaultModel: 'gemini-1.5-pro',
      status: 'Connected',
      lastSync: '10 minutes ago',
    },
    localai: {
      name: 'Local AI Provider',
      description:
        'Self-hosted open-source models running within the Wrfcoin Core network.',
      icon: 'bi-cpu',
      color: '#6610F2',
      website: 'https://localai.io',
      apiDocs: 'https://localai.io/docs/',
      maxContext: 'Varies by model',
      capabilities: [
        'Text Generation',
        'Embedding',
        'Image Generation',
        'Audio Processing',
      ],
      supportedModels: [
        'orca-mini',
        'llama2-7b',
        'stable-diffusion',
        'whisper-small',
      ],
      defaultModel: 'llama2-7b',
      status: 'Connected',
      lastSync: '15 minutes ago',
    },
    mistral: {
      name: 'Mistral AI',
      description: 'Efficient and powerful open-source language models.',
      icon: 'bi-hurricane',
      color: '#00A9FF',
      website: 'https://mistral.ai',
      apiDocs: 'https://docs.mistral.ai',
      maxContext: '32k tokens',
      capabilities: ['Text Generation', 'Document Processing', 'Reasoning'],
      supportedModels: [
        'mistral-large-latest',
        'mistral-medium-latest',
        'mistral-small-latest',
      ],
      defaultModel: 'mistral-large-latest',
      status: 'Connected',
      lastSync: '8 minutes ago',
    },
    meta: {
      name: 'Meta AI',
      description: 'Open-source Llama models for a variety of language tasks.',
      icon: 'bi-meta',
      color: '#0668E1',
      website: 'https://ai.meta.com',
      apiDocs: 'https://llama.meta.com/docs',
      maxContext: '4k tokens',
      capabilities: ['Text Generation', 'Translation', 'Classification'],
      supportedModels: ['llama-3-70b', 'llama-3-8b', 'llama-2-7b'],
      defaultModel: 'llama-3-70b',
      status: 'Not Connected',
      lastSync: 'Never',
    },
  };

  // Simulated model data - more specific models with parameters
  const mockModelData = {
    openai: [
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        type: 'LLM',
        tokens: 128000,
        specialization: 'General',
        createdAt: '2025-05-05',
        status: 'Active',
        cost: '$0.01/1K tokens',
      },
      {
        id: 'gpt-4-turbo',
        name: 'GPT-4 Turbo',
        type: 'LLM',
        tokens: 128000,
        specialization: 'General',
        createdAt: '2024-11-01',
        status: 'Active',
        cost: '$0.01/1K tokens',
      },
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        type: 'LLM',
        tokens: 16000,
        specialization: 'General',
        createdAt: '2023-11-06',
        status: 'Active',
        cost: '$0.0005/1K tokens',
      },
      {
        id: 'dall-e-3',
        name: 'DALL-E 3',
        type: 'Image',
        tokens: 'N/A',
        specialization: 'Image Generation',
        createdAt: '2023-10-03',
        status: 'Active',
        cost: '$0.04/image',
      },
    ],
    anthropic: [
      {
        id: 'claude-3-7-sonnet-20250219',
        name: 'Claude 3.7 Sonnet',
        type: 'LLM',
        tokens: 100000,
        specialization: 'General',
        createdAt: '2025-02-19',
        status: 'Active',
        cost: '$3.00/1M tokens',
      },
      {
        id: 'claude-3-opus',
        name: 'Claude 3 Opus',
        type: 'LLM',
        tokens: 200000,
        specialization: 'Advanced Reasoning',
        createdAt: '2024-03-04',
        status: 'Active',
        cost: '$15.00/1M tokens',
      },
      {
        id: 'claude-3-sonnet',
        name: 'Claude 3 Sonnet',
        type: 'LLM',
        tokens: 200000,
        specialization: 'General',
        createdAt: '2024-03-04',
        status: 'Active',
        cost: '$7.50/1M tokens',
      },
      {
        id: 'claude-3-haiku',
        name: 'Claude 3 Haiku',
        type: 'LLM',
        tokens: 200000,
        specialization: 'Efficient',
        createdAt: '2024-03-04',
        status: 'Active',
        cost: '$1.00/1M tokens',
      },
    ],
    perplexity: [
      {
        id: 'llama-3.1-sonar-small-128k-online',
        name: 'Llama 3.1 Sonar Small',
        type: 'LLM',
        tokens: 128000,
        specialization: 'Online Search',
        createdAt: '2025-03-15',
        status: 'Not Configured',
        cost: '$0.10/query',
      },
      {
        id: 'llama-3.1-sonar-large-128k-online',
        name: 'Llama 3.1 Sonar Large',
        type: 'LLM',
        tokens: 128000,
        specialization: 'Online Search',
        createdAt: '2025-03-15',
        status: 'Not Configured',
        cost: '$0.20/query',
      },
      {
        id: 'llama-3.1-sonar-huge-128k-online',
        name: 'Llama 3.1 Sonar Huge',
        type: 'LLM',
        tokens: 128000,
        specialization: 'Online Search',
        createdAt: '2025-03-15',
        status: 'Not Configured',
        cost: '$0.40/query',
      },
    ],
    grok: [
      {
        id: 'grok-2-1212',
        name: 'Grok 2',
        type: 'LLM',
        tokens: 131072,
        specialization: 'General',
        createdAt: '2024-12-12',
        status: 'Active',
        cost: '$0.20/1K tokens',
      },
      {
        id: 'grok-2-vision-1212',
        name: 'Grok 2 Vision',
        type: 'Multimodal',
        tokens: 8192,
        specialization: 'Vision + Text',
        createdAt: '2024-12-12',
        status: 'Active',
        cost: '$0.30/1K tokens',
      },
      {
        id: 'grok-vision-beta',
        name: 'Grok Vision Beta',
        type: 'Multimodal',
        tokens: 8192,
        specialization: 'Vision + Text',
        createdAt: '2024-08-01',
        status: 'Deprecated',
        cost: '$0.30/1K tokens',
      },
      {
        id: 'grok-beta',
        name: 'Grok Beta',
        type: 'LLM',
        tokens: 131072,
        specialization: 'General',
        createdAt: '2024-08-01',
        status: 'Deprecated',
        cost: '$0.20/1K tokens',
      },
    ],
    wolfram: [
      {
        id: 'full',
        name: 'Full Results API',
        type: 'Computation',
        tokens: 'N/A',
        specialization: 'Computational Knowledge',
        createdAt: '2024-09-01',
        status: 'Active',
        cost: '$0.05/query',
      },
      {
        id: 'short',
        name: 'Short Answers API',
        type: 'Computation',
        tokens: 'N/A',
        specialization: 'Quick Answers',
        createdAt: '2024-09-01',
        status: 'Active',
        cost: '$0.03/query',
      },
      {
        id: 'spoken',
        name: 'Spoken Results API',
        type: 'Computation',
        tokens: 'N/A',
        specialization: 'Voice Response',
        createdAt: '2024-09-01',
        status: 'Active',
        cost: '$0.04/query',
      },
    ],
    gemini: [
      {
        id: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        type: 'Multimodal',
        tokens: 32000,
        specialization: 'General',
        createdAt: '2024-11-01',
        status: 'Active',
        cost: '$0.00025/1K tokens',
      },
      {
        id: 'gemini-1.5-flash',
        name: 'Gemini 1.5 Flash',
        type: 'LLM',
        tokens: 32000,
        specialization: 'Efficient',
        createdAt: '2024-11-01',
        status: 'Active',
        cost: '$0.00008/1K tokens',
      },
      {
        id: 'gemini-1.0-pro',
        name: 'Gemini 1.0 Pro',
        type: 'LLM',
        tokens: 8192,
        specialization: 'General',
        createdAt: '2023-12-13',
        status: 'Deprecated',
        cost: '$0.00025/1K tokens',
      },
    ],
    localai: [
      {
        id: 'orca-mini',
        name: 'Orca Mini',
        type: 'LLM',
        tokens: 2048,
        specialization: 'Efficient',
        createdAt: '2024-04-12',
        status: 'Active',
        cost: 'Free',
      },
      {
        id: 'llama2-7b',
        name: 'Llama 2 (7B)',
        type: 'LLM',
        tokens: 4096,
        specialization: 'General',
        createdAt: '2023-07-18',
        status: 'Active',
        cost: 'Free',
      },
      {
        id: 'stable-diffusion',
        name: 'Stable Diffusion',
        type: 'Image',
        tokens: 'N/A',
        specialization: 'Image Generation',
        createdAt: '2023-08-22',
        status: 'Active',
        cost: 'Free',
      },
      {
        id: 'whisper-small',
        name: 'Whisper Small',
        type: 'Audio',
        tokens: 'N/A',
        specialization: 'Speech Recognition',
        createdAt: '2022-09-21',
        status: 'Active',
        cost: 'Free',
      },
    ],
    mistral: [
      {
        id: 'mistral-large-latest',
        name: 'Mistral Large',
        type: 'LLM',
        tokens: 32000,
        specialization: 'General',
        createdAt: '2024-04-10',
        status: 'Active',
        cost: '$0.008/1K tokens',
      },
      {
        id: 'mistral-medium-latest',
        name: 'Mistral Medium',
        type: 'LLM',
        tokens: 32000,
        specialization: 'General',
        createdAt: '2024-04-10',
        status: 'Active',
        cost: '$0.0027/1K tokens',
      },
      {
        id: 'mistral-small-latest',
        name: 'Mistral Small',
        type: 'LLM',
        tokens: 32000,
        specialization: 'General',
        createdAt: '2024-04-10',
        status: 'Active',
        cost: '$0.0007/1K tokens',
      },
    ],
    meta: [
      {
        id: 'llama-3-70b',
        name: 'Llama 3 (70B)',
        type: 'LLM',
        tokens: 8192,
        specialization: 'General',
        createdAt: '2024-04-19',
        status: 'Not Connected',
        cost: 'N/A',
      },
      {
        id: 'llama-3-8b',
        name: 'Llama 3 (8B)',
        type: 'LLM',
        tokens: 8192,
        specialization: 'Efficient',
        createdAt: '2024-04-19',
        status: 'Not Connected',
        cost: 'N/A',
      },
      {
        id: 'llama-2-7b',
        name: 'Llama 2 (7B)',
        type: 'LLM',
        tokens: 4096,
        specialization: 'General',
        createdAt: '2023-07-18',
        status: 'Not Connected',
        cost: 'N/A',
      },
    ],
  };

  // Simulated API status data
  const mockApiStatus = {
    openai: {
      status: 'operational',
      latency: 212,
      uptime: 99.97,
      rateLimits: {
        tier: 'Standard',
        requestsPerMin: 60,
        tokensPerMin: 250000,
      },
      rateRemaining: {
        requests: 54,
        tokens: 238450,
      },
    },
    anthropic: {
      status: 'operational',
      latency: 310,
      uptime: 99.92,
      rateLimits: {
        tier: 'Standard',
        requestsPerMin: 50,
        tokensPerMin: 200000,
      },
      rateRemaining: {
        requests: 42,
        tokens: 178900,
      },
    },
    perplexity: {
      status: 'not_configured',
      latency: null,
      uptime: null,
      rateLimits: null,
      rateRemaining: null,
    },
    grok: {
      status: 'degraded_performance',
      latency: 560,
      uptime: 98.5,
      rateLimits: {
        tier: 'Pro',
        requestsPerMin: 120,
        tokensPerMin: 500000,
      },
      rateRemaining: {
        requests: 27,
        tokens: 132000,
      },
    },
    wolfram: {
      status: 'operational',
      latency: 410,
      uptime: 99.8,
      rateLimits: {
        tier: 'Standard',
        requestsPerMin: 100,
        tokensPerMin: null,
      },
      rateRemaining: {
        requests: 87,
        tokens: null,
      },
    },
    gemini: {
      status: 'operational',
      latency: 245,
      uptime: 99.95,
      rateLimits: {
        tier: 'Pro',
        requestsPerMin: 150,
        tokensPerMin: 300000,
      },
      rateRemaining: {
        requests: 124,
        tokens: 287500,
      },
    },
    localai: {
      status: 'operational',
      latency: 520,
      uptime: 100,
      rateLimits: {
        tier: 'Local',
        requestsPerMin: 'Unlimited',
        tokensPerMin: 'Hardware Limited',
      },
      rateRemaining: {
        requests: 'Unlimited',
        tokens: 'Hardware Limited',
      },
    },
    mistral: {
      status: 'operational',
      latency: 289,
      uptime: 99.91,
      rateLimits: {
        tier: 'Standard',
        requestsPerMin: 80,
        tokensPerMin: 250000,
      },
      rateRemaining: {
        requests: 67,
        tokens: 215000,
      },
    },
    meta: {
      status: 'not_connected',
      latency: null,
      uptime: null,
      rateLimits: null,
      rateRemaining: null,
    },
  };

  // Simulated usage statistics
  const calculateStats = provider => {
    if (provider === 'openai') {
      return {
        requestsToday: 1267,
        modelsAvailable: 4,
        successRate: 99.2,
        avgResponseTime: 256,
        totalTokensUsed: 1235000,
        popularModels: [
          { name: 'gpt-4o', usage: 62 },
          { name: 'gpt-3.5-turbo', usage: 32 },
          { name: 'dall-e-3', usage: 6 },
        ],
        recentErrors: [
          { time: '12:30:45', message: 'Rate limit exceeded' },
          { time: '09:15:22', message: 'Invalid request parameters' },
        ],
      };
    } else if (provider === 'anthropic') {
      return {
        requestsToday: 845,
        modelsAvailable: 4,
        successRate: 99.7,
        avgResponseTime: 320,
        totalTokensUsed: 875000,
        popularModels: [
          { name: 'claude-3-7-sonnet-20250219', usage: 58 },
          { name: 'claude-3-opus', usage: 25 },
          { name: 'claude-3-haiku', usage: 17 },
        ],
        recentErrors: [
          { time: '14:22:10', message: 'Context length exceeded' },
        ],
      };
    } else if (provider === 'gemini') {
      return {
        requestsToday: 623,
        modelsAvailable: 3,
        successRate: 99.5,
        avgResponseTime: 229,
        totalTokensUsed: 950000,
        popularModels: [
          { name: 'gemini-1.5-pro', usage: 73 },
          { name: 'gemini-1.5-flash', usage: 27 },
        ],
        recentErrors: [{ time: '13:05:17', message: 'Invalid request format' }],
      };
    } else if (provider === 'grok') {
      return {
        requestsToday: 412,
        modelsAvailable: 4,
        successRate: 97.8,
        avgResponseTime: 460,
        totalTokensUsed: 520000,
        popularModels: [
          { name: 'grok-2-1212', usage: 68 },
          { name: 'grok-2-vision-1212', usage: 32 },
        ],
        recentErrors: [
          { time: '15:12:33', message: 'Service temporarily unavailable' },
          { time: '14:45:12', message: 'Rate limit exceeded' },
          { time: '12:30:05', message: 'Authentication error' },
        ],
      };
    } else if (provider === 'wolfram') {
      return {
        requestsToday: 302,
        modelsAvailable: 3,
        successRate: 99.1,
        avgResponseTime: 428,
        totalQueriesUsed: 1860,
        popularEndpoints: [
          { name: 'Full Results API', usage: 52 },
          { name: 'Short Answers API', usage: 48 },
        ],
        recentErrors: [
          { time: '14:45:12', message: 'Input interpretation error' },
        ],
      };
    } else if (provider === 'localai') {
      return {
        requestsToday: 178,
        modelsAvailable: 4,
        successRate: 99.3,
        avgResponseTime: 650,
        gpuUtilization: 42,
        cpuUtilization: 38,
        memoryUsage: '6.2 GB',
        popularModels: [
          { name: 'llama2-7b', usage: 55 },
          { name: 'orca-mini', usage: 30 },
          { name: 'stable-diffusion', usage: 15 },
        ],
        recentErrors: [
          { time: '15:33:22', message: 'Resources temporarily exhausted' },
        ],
      };
    } else if (provider === 'mistral') {
      return {
        requestsToday: 715,
        modelsAvailable: 3,
        successRate: 99.4,
        avgResponseTime: 305,
        totalTokensUsed: 675000,
        popularModels: [
          { name: 'mistral-large-latest', usage: 45 },
          { name: 'mistral-medium-latest', usage: 35 },
          { name: 'mistral-small-latest', usage: 20 },
        ],
        recentErrors: [
          { time: '11:17:32', message: 'Context length exceeded' },
        ],
      };
    } else {
      // Default for perplexity or meta which are not set up
      return {
        requestsToday: 0,
        modelsAvailable:
          provider === 'perplexity' ? 3 : provider === 'meta' ? 3 : 0,
        successRate: 0,
        avgResponseTime: 0,
        recentErrors: [],
      };
    }
  };

  // Load data based on selected integration
  useEffect(() => {
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      if (integrationId) {
        setModelData(mockModelData[integrationId] || []);
        setApiStatus(mockApiStatus[integrationId] || {});
        setStats(calculateStats(integrationId));
      }
      setLoading(false);
    }, 800);
  }, [integrationId]);

  // Handle model selection
  const handleModelSelect = model => {
    setSelectedModel(model);
  };

  // Handle prompt test
  const handlePromptTest = () => {
    if (!testPrompt.trim()) return;

    setTestLoading(true);
    setTestResult(null);

    // Simulate API call
    setTimeout(() => {
      setTestResult({
        text: `This is a simulated response for the prompt: "${testPrompt}" using the ${selectedModel ? selectedModel.name : integrationDetails[integrationId]?.defaultModel} model.`,
        tokens: {
          prompt: Math.floor(testPrompt.length / 4),
          completion: Math.floor(Math.random() * 100) + 50,
          total:
            Math.floor(testPrompt.length / 4) +
            Math.floor(Math.random() * 100) +
            50,
        },
        latency: Math.floor(Math.random() * 1000) + 200,
        model: selectedModel
          ? selectedModel.id
          : integrationDetails[integrationId]?.supportedModels[0],
      });
      setTestLoading(false);
    }, 2000);
  };

  // Get details for current integration
  const details = integrationId ? integrationDetails[integrationId] : null;

  if (loading) {
    return (
      <div className="ai-integration-loading">
        <div className="loading-spinner" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p>Loading AI integration data...</p>
      </div>
    );
  }

  return (
    <div className="ai-integration-container">
      {details ? (
        <>
          <div className="ai-integration-header">
            <div
              className="integration-icon"
              style={{ backgroundColor: details.color }}
            >
              <i className={`bi ${details.icon}`}></i>
            </div>
            <div className="integration-info">
              <h2>{details.name}</h2>
              <p>{details.description}</p>
              <div className="integration-meta">
                <span className="api-docs">
                  <i className="bi bi-file-earmark-code"></i>{' '}
                  <a
                    href={details.apiDocs}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    API Docs
                  </a>
                </span>
                <span className="context-length">
                  <i className="bi bi-braces"></i> Max Context:{' '}
                  {details.maxContext}
                </span>
                <span
                  className={`status ${details.status.toLowerCase().replace(' ', '-')}`}
                >
                  <i className="bi bi-circle-fill"></i> {details.status}
                </span>
                {details.lastSync !== 'Never' && (
                  <span className="last-sync">
                    <i className="bi bi-arrow-repeat"></i> Last synced:{' '}
                    {details.lastSync}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="ai-tabs">
            <button
              className={activeTab === 'overview' ? 'active' : ''}
              onClick={() => setActiveTab('overview')}
            >
              <i className="bi bi-grid"></i> Overview
            </button>
            <button
              className={activeTab === 'models' ? 'active' : ''}
              onClick={() => setActiveTab('models')}
            >
              <i className="bi bi-layers"></i> Models
              <WrfBadge color="primary">{modelData.length}</WrfBadge>
            </button>
            <button
              className={activeTab === 'playground' ? 'active' : ''}
              onClick={() => setActiveTab('playground')}
            >
              <i className="bi bi-terminal"></i> Playground
            </button>
            <button
              className={activeTab === 'settings' ? 'active' : ''}
              onClick={() => setActiveTab('settings')}
            >
              <i className="bi bi-gear"></i> Settings
            </button>
          </div>

          <div className="ai-content">
            {activeTab === 'overview' && (
              <div className="overview-tab">
                <div className="stats-cards">
                  <div className="stat-card">
                    <div className="stat-icon">
                      <i className="bi bi-arrow-repeat"></i>
                    </div>
                    <div className="stat-info">
                      <h3>{stats.requestsToday.toLocaleString()}</h3>
                      <p>Requests Today</p>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon">
                      <i className="bi bi-layers"></i>
                    </div>
                    <div className="stat-info">
                      <h3>{stats.modelsAvailable}</h3>
                      <p>Available Models</p>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon">
                      <i className="bi bi-check-circle"></i>
                    </div>
                    <div className="stat-info">
                      <h3>{stats.successRate}%</h3>
                      <p>Success Rate</p>
                    </div>
                    <div className="stat-percentage">
                      <span
                        className={
                          stats.successRate >= 99
                            ? 'good'
                            : stats.successRate >= 95
                              ? 'average'
                              : 'poor'
                        }
                      >
                        {stats.successRate >= 99
                          ? 'Excellent'
                          : stats.successRate >= 95
                            ? 'Good'
                            : 'Poor'}
                      </span>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon">
                      <i className="bi bi-stopwatch"></i>
                    </div>
                    <div className="stat-info">
                      <h3>{stats.avgResponseTime} ms</h3>
                      <p>Avg Response Time</p>
                    </div>
                    <div className="stat-percentage">
                      <span
                        className={
                          stats.avgResponseTime <= 300
                            ? 'good'
                            : stats.avgResponseTime <= 500
                              ? 'average'
                              : 'poor'
                        }
                      >
                        {stats.avgResponseTime <= 300
                          ? 'Fast'
                          : stats.avgResponseTime <= 500
                            ? 'Average'
                            : 'Slow'}
                      </span>
                    </div>
                  </div>
                </div>

                {apiStatus.status !== 'not_configured' &&
                  apiStatus.status !== 'not_connected' && (
                  <>
                    <div className="api-status-section">
                      <h3>API Status</h3>
                      <div className="api-status-grid">
                        <div className="api-status-card">
                          <div className="status-label">Service Status</div>
                          <div
                            className={`status-value status-${apiStatus.status}`}
                          >
                            <i className="bi bi-circle-fill"></i>
                            {apiStatus.status === 'operational'
                              ? 'Operational'
                              : apiStatus.status === 'degraded_performance'
                                ? 'Degraded Performance'
                                : 'Service Disruption'}
                          </div>
                        </div>

                        <div className="api-status-card">
                          <div className="status-label">Current Latency</div>
                          <div className="status-value">
                            <i className="bi bi-stopwatch"></i>
                            {apiStatus.latency} ms
                          </div>
                        </div>

                        <div className="api-status-card">
                          <div className="status-label">Uptime</div>
                          <div className="status-value">
                            <i className="bi bi-arrow-up-circle"></i>
                            {apiStatus.uptime}%
                          </div>
                        </div>

                        <div className="api-status-card">
                          <div className="status-label">Rate Tier</div>
                          <div className="status-value">
                            <i className="bi bi-award"></i>
                            {apiStatus.rateLimits?.tier || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="model-usage-section">
                      <h3>Popular Models</h3>
                      {stats.popularModels ? (
                        <div className="model-usage-chart">
                          {stats.popularModels.map((model, index) => (
                            <div key={index} className="model-usage-bar">
                              <div className="model-name">{model.name}</div>
                              <div className="usage-bar-container">
                                <div
                                  className="usage-bar"
                                  style={{ width: `${model.usage}%` }}
                                ></div>
                                <div className="usage-percentage">
                                  {model.usage}%
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : stats.popularEndpoints ? (
                        <div className="model-usage-chart">
                          {stats.popularEndpoints.map((endpoint, index) => (
                            <div key={index} className="model-usage-bar">
                              <div className="model-name">
                                {endpoint.name}
                              </div>
                              <div className="usage-bar-container">
                                <div
                                  className="usage-bar"
                                  style={{ width: `${endpoint.usage}%` }}
                                ></div>
                                <div className="usage-percentage">
                                  {endpoint.usage}%
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="no-data-message">
                          <i className="bi bi-exclamation-circle"></i>
                          <p>No usage data available</p>
                        </div>
                      )}
                    </div>
                  </>
                )}

                <div className="capabilities-section">
                  <h3>Capabilities</h3>
                  <div className="capability-tags">
                    {details.capabilities.map((capability, index) => (
                      <span key={index} className="capability-tag">
                        {capability}
                      </span>
                    ))}
                  </div>
                </div>

                {apiStatus.status === 'not_configured' && (
                  <div className="configuration-required">
                    <div className="configuration-message">
                      <i className="bi bi-exclamation-triangle"></i>
                      <div className="message-content">
                        <h4>Configuration Required</h4>
                        <p>
                          This AI integration requires configuration before use.
                          Please provide your API key and settings.
                        </p>
                        <button
                          className="configure-button"
                          onClick={() => setActiveTab('settings')}
                        >
                          <i className="bi bi-gear"></i> Configure Now
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {apiStatus.status === 'not_connected' && (
                  <div className="configuration-required">
                    <div className="configuration-message">
                      <i className="bi bi-plug"></i>
                      <div className="message-content">
                        <h4>Not Connected</h4>
                        <p>
                          This AI provider is currently not connected. Connect
                          it to access its models and capabilities.
                        </p>
                        <button
                          className="configure-button"
                          onClick={() => setActiveTab('settings')}
                        >
                          <i className="bi bi-link"></i> Connect Now
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'models' && (
              <div className="models-tab">
                <div className="models-header">
                  <h3>Available Models</h3>
                  <div className="models-filter">
                    <input type="text" placeholder="Filter models..." />
                    <select defaultValue="all">
                      <option value="all">All Types</option>
                      <option value="LLM">Text (LLM)</option>
                      <option value="Image">Image</option>
                      <option value="Multimodal">Multimodal</option>
                      <option value="Audio">Audio</option>
                      <option value="Computation">Computation</option>
                    </select>
                  </div>
                </div>

                <div className="models-list">
                  {modelData.map(model => (
                    <div
                      key={model.id}
                      className={`model-card ${model.status === 'Active' ? 'active' : model.status === 'Deprecated' ? 'deprecated' : 'inactive'}`}
                      onClick={() => handleModelSelect(model)}
                    >
                      <div className="model-header">
                        <h4 className="model-name">{model.name}</h4>
                        <span
                          className={`model-status ${model.status.toLowerCase()}`}
                        >
                          {model.status}
                        </span>
                      </div>
                      <div className="model-details">
                        <div className="model-detail">
                          <span className="detail-label">Type:</span>
                          <span className="detail-value">{model.type}</span>
                        </div>
                        {model.tokens !== 'N/A' && (
                          <div className="model-detail">
                            <span className="detail-label">Context:</span>
                            <span className="detail-value">
                              {model.tokens.toLocaleString()} tokens
                            </span>
                          </div>
                        )}
                        <div className="model-detail">
                          <span className="detail-label">Focus:</span>
                          <span className="detail-value">
                            {model.specialization}
                          </span>
                        </div>
                        <div className="model-detail">
                          <span className="detail-label">Released:</span>
                          <span className="detail-value">
                            {model.createdAt}
                          </span>
                        </div>
                        <div className="model-detail">
                          <span className="detail-label">Cost:</span>
                          <span className="detail-value">{model.cost}</span>
                        </div>
                      </div>
                      <div className="model-actions">
                        <button
                          className="use-model-btn"
                          onClick={e => {
                            e.stopPropagation();
                            handleModelSelect(model);
                            setActiveTab('playground');
                          }}
                        >
                          <i className="bi bi-terminal"></i> Use in Playground
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'playground' && (
              <div className="playground-tab">
                <div className="playground-header">
                  <h3>Model Playground</h3>
                  <div className="model-selector">
                    <label>Model:</label>
                    <select
                      value={selectedModel?.id || details.defaultModel}
                      onChange={e => {
                        const model = modelData.find(
                          m => m.id === e.target.value,
                        );
                        setSelectedModel(model);
                      }}
                    >
                      {modelData
                        .filter(m => m.status !== 'Not Connected')
                        .map(model => (
                          <option key={model.id} value={model.id}>
                            {model.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                {details.status === 'Not Connected' ||
                details.status === 'Configuration Required' ? (
                    <div className="playground-unconfigured">
                      <i className="bi bi-exclamation-triangle"></i>
                      <h4>Configuration Required</h4>
                      <p>
                      Please connect to {details.name} first to use the
                      playground.
                      </p>
                      <button
                        className="configure-button"
                        onClick={() => setActiveTab('settings')}
                      >
                        <i className="bi bi-gear"></i> Configure Now
                      </button>
                    </div>
                  ) : (
                    <div className="playground-content">
                      <div className="prompt-section">
                        <div className="prompt-header">
                          <label htmlFor="promptInput">Prompt:</label>
                          <div className="prompt-controls">
                            <button className="clear-btn">
                              <i className="bi bi-x-circle"></i> Clear
                            </button>
                            <button className="example-btn">
                              <i className="bi bi-lightning"></i> Use Example
                            </button>
                          </div>
                        </div>
                        <textarea
                          id="promptInput"
                          className="prompt-input"
                          placeholder={`Enter a prompt for ${selectedModel?.name || details.name}...`}
                          value={testPrompt}
                          onChange={e => setTestPrompt(e.target.value)}
                        ></textarea>
                        <div className="prompt-footer">
                          <div className="token-count">
                            <i className="bi bi-hash"></i> Est. Tokens:{' '}
                            {testPrompt ? Math.floor(testPrompt.length / 4) : 0}
                          </div>
                          <button
                            className="submit-prompt-btn"
                            onClick={handlePromptTest}
                            disabled={testLoading || !testPrompt.trim()}
                          >
                            {testLoading ? (
                              <>
                                <span
                                  className="loading-spinner loading-spinner-sm"
                                  role="status"
                                  aria-hidden="true"
                                ></span>
                                <span>Processing...</span>
                              </>
                            ) : (
                              <>
                                <i className="bi bi-play-fill"></i> Run
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="response-section">
                        <div className="response-header">
                          <label>Response:</label>
                          {testResult && (
                            <button className="copy-btn">
                              <i className="bi bi-clipboard"></i> Copy
                            </button>
                          )}
                        </div>
                        <div className="response-content">
                          {testLoading ? (
                            <div className="response-loading">
                              <div
                                className="loading-spinner"
                                role="status"
                              >
                                <span className="visually-hidden">
                                Loading...
                                </span>
                              </div>
                              <p>Generating response...</p>
                            </div>
                          ) : testResult ? (
                            <div className="response-text">{testResult.text}</div>
                          ) : (
                            <div className="response-placeholder">
                              <i className="bi bi-chat-dots"></i>
                              <p>
                              Enter a prompt and click Run to see the response
                              </p>
                            </div>
                          )}
                        </div>
                        {testResult && (
                          <div className="response-metrics">
                            <div className="metric">
                              <span className="metric-label">Prompt Tokens:</span>
                              <span className="metric-value">
                                {testResult.tokens.prompt}
                              </span>
                            </div>
                            <div className="metric">
                              <span className="metric-label">
                              Completion Tokens:
                              </span>
                              <span className="metric-value">
                                {testResult.tokens.completion}
                              </span>
                            </div>
                            <div className="metric">
                              <span className="metric-label">Total Tokens:</span>
                              <span className="metric-value">
                                {testResult.tokens.total}
                              </span>
                            </div>
                            <div className="metric">
                              <span className="metric-label">Response Time:</span>
                              <span className="metric-value">
                                {testResult.latency} ms
                              </span>
                            </div>
                            <div className="metric">
                              <span className="metric-label">Model:</span>
                              <span className="metric-value">
                                {testResult.model}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="settings-tab">
                <h3>API Settings</h3>

                <div className="settings-section">
                  <h4>Authentication</h4>
                  <div className="settings-form">
                    <div className="form-group">
                      <label>API Key</label>
                      <div className="api-key-field">
                        <input
                          type="password"
                          value={
                            details.status.toLowerCase() !== 'not connected' &&
                            details.status.toLowerCase() !==
                              'configuration required'
                              ? '••••••••••••••••••••••••'
                              : ''
                          }
                          placeholder="Enter your API key..."
                        />
                        <button className="show-key-btn">
                          <i className="bi bi-eye"></i>
                        </button>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>API Base URL</label>
                      <input
                        type="text"
                        value={`https://api.${integrationId.toLowerCase()}.com/v1`}
                        readOnly
                      />
                    </div>

                    <div className="form-group">
                      <label>Organization ID</label>
                      <input type="text" placeholder="Optional" />
                    </div>

                    <div className="settings-actions">
                      <button className="test-connection-btn">
                        <i className="bi bi-lightning-charge"></i> Test
                        Connection
                      </button>
                      <button className="save-settings-btn">
                        <i className="bi bi-save"></i> Save Settings
                      </button>
                    </div>
                  </div>
                </div>

                <div className="settings-section">
                  <h4>Default Model Settings</h4>
                  <div className="settings-form">
                    <div className="form-group">
                      <label>Default Model</label>
                      <select defaultValue={details.defaultModel}>
                        {details.supportedModels.map((model, index) => (
                          <option key={index} value={model}>
                            {model}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Temperature</label>
                      <div className="slider-container">
                        <input
                          type="range"
                          min="0"
                          max="2"
                          step="0.1"
                          defaultValue="0.7"
                        />
                        <span className="slider-value">0.7</span>
                      </div>
                      <div className="slider-labels">
                        <span>Precise</span>
                        <span>Creative</span>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Maximum Output Tokens</label>
                      <input type="number" defaultValue="1024" />
                    </div>
                  </div>
                </div>

                <div className="settings-section">
                  <h4>Rate Limiting</h4>
                  <div className="toggle-option">
                    <span>Enable Local Rate Limiting</span>
                    <label className="toggle-switch">
                      <input type="checkbox" defaultChecked />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                  <div className="form-group">
                    <label>Max Requests Per Minute</label>
                    <input
                      type="number"
                      defaultValue={apiStatus.rateLimits?.requestsPerMin || 60}
                    />
                  </div>
                </div>

                <div className="settings-section">
                  <h4>Advanced Options</h4>
                  <div className="toggle-option">
                    <span>Enable Response Caching</span>
                    <label className="toggle-switch">
                      <input type="checkbox" defaultChecked />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                  <div className="toggle-option">
                    <span>Log All Requests</span>
                    <label className="toggle-switch">
                      <input type="checkbox" defaultChecked />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                  <div className="toggle-option">
                    <span>Fallback to Local Models</span>
                    <label className="toggle-switch">
                      <input type="checkbox" defaultChecked />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="danger-zone">
                    <h5>Danger Zone</h5>
                    <button className="reset-settings-btn">
                      <i className="bi bi-arrow-counterclockwise"></i> Reset
                      Settings
                    </button>
                    <button className="disconnect-btn">
                      <i className="bi bi-x-circle"></i> Disconnect{' '}
                      {details.name}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="no-integration-selected">
          <i className="bi bi-robot"></i>
          <h3>Select an AI/ML Integration</h3>
          <p>Choose an integration from the grid to view details</p>
        </div>
      )}
    </div>
  );
};

export default AIIntegrationDetails;
