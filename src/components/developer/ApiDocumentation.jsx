/**
 * API Documentation Component
 * Interactive API documentation with examples and testing capabilities
 */

import React, { useState, useEffect } from 'react';
import './ApiDocumentation.css';
import { devLog } from '../../utils/logger';
import DemoSurfaceGate from '../common/DemoSurfaceGate';

// frontend#352: in the demo build this sample's actions are disabled; none of
// them reached a backend, and several reported success after a timer.
const SAMPLE_ACTION = 'Sample only: requests are not sent; the former responses were invented.';

const ApiDocumentationSample = () => {
  const [selectedCategory, setSelectedCategory] = useState('getting-started');
  const [selectedEndpoint, setSelectedEndpoint] = useState(null);
  const [apiSpec, setApiSpec] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApiSpec();
  }, []);

  const loadApiSpec = async () => {
    try {
      // In a real implementation, this would load from the API spec endpoint
      setApiSpec(mockApiSpec);
    } catch (error) {
      console.error('Error loading API spec:', error);
    } finally {
      setLoading(false);
    }
  };

  const executeApiCall = async (endpoint, method, body = null) => {
    // Mock API call execution for demonstration
    devLog('Executing API call:', { endpoint, method, body });

    // Simulate API response
    return {
      status: 200,
      data: {
        success: true,
        message: 'This is a simulated API response',
        timestamp: new Date().toISOString(),
      },
    };
  };

  if (loading) {
    return (
      <div className="api-documentation loading">
        <div className="loading-spinner">Loading documentation...</div>
      </div>
    );
  }

  return (
    <div className="api-documentation">
      <div className="docs-layout">
        {/* Sidebar Navigation */}
        <div className="docs-sidebar">
          <div className="sidebar-header">
            <h3>API Documentation</h3>
          </div>

          <nav className="docs-nav">
            {Object.entries(apiSpec.categories).map(([key, category]) => (
              <div key={key} className="nav-section">
                <button
                  className={`nav-category ${selectedCategory === key ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(key)}
                >
                  <span className="category-icon">{category.icon}</span>
                  {category.title}
                </button>

                {selectedCategory === key && (
                  <div className="nav-endpoints">
                    {category.endpoints.map((endpoint, index) => (
                      <button
                        key={index}
                        className={`nav-endpoint ${selectedEndpoint === endpoint ? 'active' : ''}`}
                        onClick={() => setSelectedEndpoint(endpoint)}
                      >
                        <span
                          className={`method-badge ${endpoint.method.toLowerCase()}`}
                        >
                          {endpoint.method}
                        </span>
                        {endpoint.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="docs-content">
          {!selectedEndpoint ? (
            <CategoryOverview category={apiSpec.categories[selectedCategory]} />
          ) : (
            <EndpointDetails
              endpoint={selectedEndpoint}
              onExecute={executeApiCall}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// Category Overview Component
const CategoryOverview = ({ category }) => (
  <div className="category-overview">
    <div className="category-header">
      <h1>
        <span className="category-icon-large">{category.icon}</span>
        {category.title}
      </h1>
      <p className="category-description">{category.description}</p>
    </div>

    <div className="endpoints-grid">
      {category.endpoints.map((endpoint, index) => (
        <div key={index} className="endpoint-card">
          <div className="endpoint-header">
            <span className={`method-badge ${endpoint.method.toLowerCase()}`}>
              {endpoint.method}
            </span>
            <h3>{endpoint.name}</h3>
          </div>
          <p className="endpoint-description">{endpoint.description}</p>
          <div className="endpoint-path">
            <code>{endpoint.path}</code>
          </div>
        </div>
      ))}
    </div>

    {category.examples && (
      <div className="category-examples">
        <h2>Quick Start Examples</h2>
        {category.examples.map((example, index) => (
          <div key={index} className="example-block">
            <h3>{example.title}</h3>
            <p>{example.description}</p>
            <pre>
              <code>{example.code}</code>
            </pre>
          </div>
        ))}
      </div>
    )}
  </div>
);

// Endpoint Details Component
const EndpointDetails = ({ endpoint, onExecute }) => {
  const [requestBody, setRequestBody] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleExecute = async () => {
    setLoading(true);
    try {
      let body = null;
      if (requestBody.trim()) {
        body = JSON.parse(requestBody);
      }
      const result = await onExecute(endpoint.path, endpoint.method, body);
      setResponse(result);
    } catch (error) {
      setResponse({
        status: 400,
        error: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="endpoint-details">
      <div className="endpoint-header">
        <div className="endpoint-title">
          <span className={`method-badge ${endpoint.method.toLowerCase()}`}>
            {endpoint.method}
          </span>
          <h1>{endpoint.name}</h1>
        </div>
        <div className="endpoint-path">
          <code>{endpoint.path}</code>
        </div>
      </div>

      <p className="endpoint-description">{endpoint.description}</p>

      {/* Parameters */}
      {endpoint.parameters && endpoint.parameters.length > 0 && (
        <div className="section">
          <h2>Parameters</h2>
          <div className="parameters-table">
            <div className="table-header">
              <div>Name</div>
              <div>Type</div>
              <div>Required</div>
              <div>Description</div>
            </div>
            {endpoint.parameters.map((param, index) => (
              <div key={index} className="table-row">
                <div className="param-name">
                  <code>{param.name}</code>
                </div>
                <div className="param-type">{param.type}</div>
                <div className="param-required">
                  {param.required ? '✓' : '○'}
                </div>
                <div className="param-description">{param.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Request Body */}
      {endpoint.requestBody && (
        <div className="section">
          <h2>Request Body</h2>
          <div className="request-body-spec">
            <pre>
              <code>{JSON.stringify(endpoint.requestBody, null, 2)}</code>
            </pre>
          </div>
        </div>
      )}

      {/* Response Examples */}
      <div className="section">
        <h2>Response Examples</h2>
        {endpoint.responses.map((response, index) => (
          <div key={index} className="response-example">
            <h3>
              <span
                className={`status-badge status-${Math.floor(response.status / 100)}xx`}
              >
                {response.status}
              </span>
              {response.description}
            </h3>
            <pre>
              <code>{JSON.stringify(response.example, null, 2)}</code>
            </pre>
          </div>
        ))}
      </div>

      {/* Code Examples */}
      {endpoint.codeExamples && (
        <div className="section">
          <h2>Code Examples</h2>
          <div className="code-examples">
            {Object.entries(endpoint.codeExamples).map(([language, code]) => (
              <div key={language} className="code-example">
                <h3>{language}</h3>
                <pre>
                  <code>{code}</code>
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* API Tester */}
      <div className="section api-tester">
        <h2>Try It Out</h2>
        <div className="tester-controls">
          {['POST', 'PUT', 'PATCH'].includes(endpoint.method) && (
            <div className="request-body-input">
              <label>Request Body (JSON):</label>
              <textarea
                value={requestBody}
                onChange={e => setRequestBody(e.target.value)}
                placeholder="Enter JSON request body..."
                rows={6}
              />
            </div>
          )}

          <button
            className="execute-btn"
            disabled title={SAMPLE_ACTION}
          >
            {loading ? 'Executing...' : `Execute ${endpoint.method} Request`}
          </button>
        </div>

        {response && (
          <div className="response-output">
            <h3>Response</h3>
            <div className="response-status">
              <span
                className={`status-badge status-${Math.floor(response.status / 100)}xx`}
              >
                {response.status}
              </span>
            </div>
            <pre>
              <code>
                {JSON.stringify(response.data || response.error, null, 2)}
              </code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

// Mock API Specification
const mockApiSpec = {
  categories: {
    'getting-started': {
      title: 'Getting Started',
      icon: '🚀',
      description:
        'Learn the basics of the WRFCoin API and get up and running quickly.',
      endpoints: [
        {
          name: 'Authentication',
          method: 'POST',
          path: '/api/auth/authenticate',
          description: 'Authenticate your API key and get started',
          parameters: [
            {
              name: 'X-API-Key',
              type: 'string',
              required: true,
              description: 'Your API key',
            },
          ],
          responses: [
            {
              status: 200,
              description: 'Authentication successful',
              example: { success: true, user: { id: '123', plan: 'standard' } },
            },
          ],
        },
      ],
      examples: [
        {
          title: 'Basic Authentication',
          description: 'How to authenticate with your API key',
          code: `curl -H "X-API-Key: your-api-key" \\
  https://api.wrfcoin.org/api/auth/authenticate`,
        },
      ],
    },
    blockchain: {
      title: 'Blockchain',
      icon: '⛓️',
      description:
        'Access blockchain data, transactions, and network information.',
      endpoints: [
        {
          name: 'Get Blockchain Status',
          method: 'GET',
          path: '/api/blockchain/status',
          description: 'Get current blockchain status and health metrics',
          responses: [
            {
              status: 200,
              description: 'Blockchain status',
              example: {
                status: 'healthy',
                blockHeight: 123456,
                networkHashrate: '456.7 TH/s',
                difficulty: 1234567890,
              },
            },
          ],
          codeExamples: {
            JavaScript: `const response = await fetch('/api/blockchain/status', {
  headers: { 'X-API-Key': 'your-api-key' }
});
const data = await response.json();`,
            Python: `import requests

response = requests.get('/api/blockchain/status', 
  headers={'X-API-Key': 'your-api-key'})
data = response.json()`,
          },
        },
        {
          name: 'Get Block',
          method: 'GET',
          path: '/api/blockchain/blocks/{id}',
          description: 'Get detailed information about a specific block',
          parameters: [
            {
              name: 'id',
              type: 'string',
              required: true,
              description: 'Block hash or height',
            },
          ],
          responses: [
            {
              status: 200,
              description: 'Block information',
              example: {
                hash: '0x123...',
                height: 123456,
                timestamp: '2024-07-15T00:00:00Z',
                transactions: 42,
              },
            },
          ],
        },
      ],
    },
    weather: {
      title: 'Weather Data',
      icon: '🌤️',
      description:
        'Access weather station data and submit environmental measurements.',
      endpoints: [
        {
          name: 'Get Weather Stations',
          method: 'GET',
          path: '/api/weather/stations',
          description: 'Get list of registered weather stations',
          responses: [
            {
              status: 200,
              description: 'List of weather stations',
              example: {
                stations: [
                  {
                    id: 'station-1',
                    name: 'Bryan AcuRite Station',
                    location: { lat: 30.628, lon: -96.3344 },
                    isActive: true,
                  },
                ],
              },
            },
          ],
        },
        {
          name: 'Submit Weather Data',
          method: 'POST',
          path: '/api/weather/data',
          description: 'Submit weather data from your station',
          requestBody: {
            stationId: 'string',
            temperature: 'number',
            humidity: 'number',
            pressure: 'number',
            timestamp: 'string',
          },
          responses: [
            {
              status: 201,
              description: 'Data submitted successfully',
              example: { success: true, dataId: 'data-123' },
            },
          ],
        },
      ],
    },
  },
};

// frontend#352: display-only fabricated surface. The default build shows an
// honest not-live state and never mounts the sample.
const ApiDocumentation = () => (
  <DemoSurfaceGate
    title="Interactive API documentation is not live"
    description="The endpoint catalogue and try-it responses here were written by hand, not generated from the served API."
    testId="api-documentation"
  >
    <ApiDocumentationSample />
  </DemoSurfaceGate>
);

export default ApiDocumentation;
