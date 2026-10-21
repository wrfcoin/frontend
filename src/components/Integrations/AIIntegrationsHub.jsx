import DemoSurfaceGate from '../common/DemoSurfaceGate';
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Routes, Route } from 'react-router';
import { sanitizeInput } from '../../utils/security';
import { WrfButton } from '../DesignSystem';
import './IntegrationCards.css';

// Import all AI integration components
import AnthropicCard from './AnthropicCard';
import OpenAICard from './OpenAICard';
import PerplexityCard from './PerplexityCard';
import XAICard from './XAICard';
import GeminiCard from './GeminiCard';
import HuggingFaceCard from './HuggingFaceCard';
import LocalModelCard from './LocalModelCard';
import ModelContextCard from './ModelContextCard';
import ModelContextConfig from './ModelContextConfig';
import WolframCard from './WolframCard';
import LangChainCard from './AI/LangChainCard';
import AIMLDashboard from '../AI/AIMLDashboard';

/**
 * AI Integrations Hub Component
 *
 * This component serves as the central hub for managing and configuring all AI integrations.
 * It allows users to select their preferred AI providers and configure their API keys.
 */
const AIIntegrationsHubSample = () => {
  const [integrationStatus, setIntegrationStatus] = useState({});
  const navigate = useNavigate();
  const { provider } = useParams();

  // Fetch the status of all integrations on component mount
  useEffect(() => {
    fetchAllProviderStatus();
  }, []);

  // Fetch status of all providers
  const fetchAllProviderStatus = async () => {
    try {
      const response = await fetch('/api/ai-plugins/status');
      const data = await response.json();

      if (data.success && data.providers) {
        // Sanitize the provider status data before setting to state
        const sanitizedProviders = {};
        Object.keys(data.providers).forEach(key => {
          const sanitizedKey = sanitizeInput(key);
          sanitizedProviders[sanitizedKey] = sanitizeInput(data.providers[key]);
        });

        setIntegrationStatus(sanitizedProviders);
      }
    } catch (error) {
      console.error('Error fetching AI providers status:', error);
    }
  };

  // Configuration for all supported AI providers
  const providers = [
    {
      id: 'dashboard',
      name: 'AI/ML Dashboard',
      description:
        'Comprehensive monitoring and management dashboard for AI/ML models, training jobs, and data pipelines.',
      icon: '/assets/icons/ai-dashboard-logo.svg',
      component: AIMLDashboard,
    },
    {
      // Keep OpenAI as a plugin option without direct dependency
      id: 'openai',
      name: 'OpenAI',
      description:
        'Connect to OpenAI to use GPT-4o and DALL-E models for text, image, and analysis tasks.',
      icon: '/assets/icons/openai-logo.svg',
      component: OpenAICard,
    },
    {
      id: 'anthropic',
      name: 'Anthropic (Claude)',
      description:
        'Use Claude models for advanced reasoning and comprehensive understanding of meteorological data.',
      icon: '/assets/icons/anthropic-logo.svg',
      component: AnthropicCard,
    },
    {
      id: 'perplexity',
      name: 'Perplexity',
      description:
        'Access Perplexity models for real-time information search and data analysis capabilities.',
      icon: '/assets/icons/perplexity-logo.svg',
      component: PerplexityCard,
    },
    {
      id: 'wolfram',
      name: 'Wolfram Alpha & Language',
      description:
        'Leverage the computational knowledge engine for advanced data analysis and scientific computing.',
      icon: '/assets/icons/wolfram-logo.svg',
      component: WolframCard,
    },
    {
      id: 'xai',
      name: 'xAI (Grok)',
      description:
        'Connect to xAI Grok models for advanced reasoning and data processing.',
      icon: '/assets/icons/xai-logo.svg',
      component: XAICard,
    },
    {
      id: 'gemini',
      name: 'Google Gemini',
      description:
        'Use Google Gemini models for multimodal analysis of weather and climate data.',
      icon: '/assets/icons/gemini-logo.svg',
      component: GeminiCard,
    },
    {
      id: 'huggingface',
      name: 'HuggingFace',
      description:
        'Access thousands of open source AI models for various specialized tasks.',
      icon: '/assets/icons/huggingface-logo.svg',
      component: HuggingFaceCard,
    },
    {
      id: 'modelcontext',
      name: 'Model Context Protocol',
      description:
        'Enhance AI model context management, enabling better interoperability between models and improved data handling.',
      icon: '/assets/icons/modelcontext-logo.svg',
      component: ModelContextCard,
    },
    {
      id: 'langchain',
      name: 'LangChain Analytics',
      description:
        'External AI-powered analytics for environmental data trends and network insights.',
      icon: '/assets/icons/langchain-logo.svg',
      component: LangChainCard,
    },
    {
      id: 'local',
      name: 'Local Models',
      description:
        'Configure locally hosted models for enhanced privacy and custom needs.',
      icon: '/assets/icons/local-model-logo.svg',
      component: LocalModelCard,
    },
  ];

  // Handle selection of a provider to configure
  const handleSelectProvider = providerId => {
    navigate(`/integrations/ai/${providerId}`);
  };

  // Handle back button click
  const handleBackToHub = () => {
    navigate('/integrations/ai');
  };

  // Determine which view to show
  const renderContent = () => {
    // If a specific provider is selected, show that provider's configuration
    if (provider) {
      // Sanitize the provider parameter to prevent XSS
      const sanitizedProviderId = sanitizeInput(provider);
      const selectedProvider = providers.find(
        p => p.id === sanitizedProviderId,
      );

      if (!selectedProvider) {
        return (
          <div className="provider-not-found">
            <h2>Provider Not Found</h2>
            <p>The AI provider "{sanitizedProviderId}" was not found.</p>
            <WrfButton variant="primary" onClick={handleBackToHub}>
              Back to AI Hub
            </WrfButton>
          </div>
        );
      }

      // Handle special case for Model Context Protocol
      if (sanitizedProviderId === 'modelcontext') {
        return (
          <div className="provider-detail-view">
            <ModelContextConfig />
          </div>
        );
      }

      const ProviderComponent = selectedProvider.component;

      return (
        <div className="provider-detail-view">
          <div className="back-button-container">
            <button className="back-button" onClick={handleBackToHub}>
              &larr; Back to AI Hub
            </button>
          </div>
          <ProviderComponent />
        </div>
      );
    }

    // Otherwise, show the list of all providers
    return (
      <div className="ai-integrations-hub">
        <div className="hub-header">
          <h1>AI Integrations Hub</h1>
          <p>
            Connect your preferred AI services to enhance Wrfcoin with advanced
            analysis, forecasting, and visualization capabilities. Select a
            provider below to configure.
          </p>
        </div>

        <div className="integration-cards-container">
          {providers.map(provider => (
            <div
              key={provider.id}
              className="integration-card"
              onClick={() => handleSelectProvider(provider.id)}
            >
              <div className="integration-card-header">
                <div className="integration-card-icon">
                  {/* Use only verified local resources or validate external URLs */}
                  <img
                    src={
                      provider.icon.startsWith('/')
                        ? provider.icon
                        : '/assets/icons/default-ai-logo.svg'
                    }
                    alt={`${sanitizeInput(provider.name)} Logo`}
                    onError={e => {
                      e.target.onerror = null;
                      e.target.src = '/assets/icons/default-ai-logo.svg';
                    }}
                  />
                </div>
                <div className="integration-card-title">
                  <h3>{sanitizeInput(provider.name)}</h3>
                </div>
              </div>

              <div className="integration-card-content">
                <p>{sanitizeInput(provider.description)}</p>
              </div>

              <div className="integration-card-footer">
                <span
                  className={`card-status ${sanitizeInput(integrationStatus[provider.id] || 'unconfigured')}`}
                >
                  {integrationStatus[provider.id] === 'connected'
                    ? 'Connected'
                    : integrationStatus[provider.id] === 'configured'
                      ? 'Configured'
                      : 'Not Configured'}
                </span>
                <button className="configure-button">Configure</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Routes>
      <Route path="/" element={renderContent()} />
      <Route path="/:provider" element={renderContent()} />
    </Routes>
  );
};

const AIIntegrationsHub = (props) => (
  <DemoSurfaceGate
    testId="ai-integrations"
    title="AI integrations is not live on this testnet"
    description="This preview contains illustrative data or simulated actions, not verified testnet results."
  >
    <AIIntegrationsHubSample {...props} />
  </DemoSurfaceGate>
);

export default AIIntegrationsHub;
