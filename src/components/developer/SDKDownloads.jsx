/**
 * SDK Downloads Component
 * Provides access to various SDK packages and development tools
 */

import React, { useState, useEffect } from 'react';
import { WrfButton } from '../DesignSystem';
import './SDKDownloads.css';
import DemoSurfaceGate from '../common/DemoSurfaceGate';

// frontend#352: in the demo build this sample's actions are disabled; none of
// them reached a backend, and several reported success after a timer.
const SAMPLE_ACTION = 'Sample only: no SDK package is published here.';

const SDKDownloadsSample = () => {
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [downloadStats, setDownloadStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDownloadStats();
  }, []);

  const loadDownloadStats = async () => {
    try {
      // Simulate loading download statistics
      setTimeout(() => {
        setDownloadStats({
          javascript: { downloads: 15420, version: '2.1.3' },
          python: { downloads: 8950, version: '1.8.2' },
          java: { downloads: 6340, version: '1.5.1' },
          go: { downloads: 4210, version: '0.9.4' },
          php: { downloads: 3180, version: '1.2.0' },
          'c-sharp': { downloads: 2850, version: '1.1.2' },
        });
        setLoading(false);
      }, 800);
    } catch (error) {
      console.error('Error loading download stats:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="sdk-downloads loading">
        <div className="loading-spinner">Loading SDK packages...</div>
      </div>
    );
  }

  const sdkPackages = [
    {
      id: 'javascript',
      name: 'JavaScript SDK',
      icon: '🟨',
      description:
        'Comprehensive JavaScript/TypeScript SDK for browser and Node.js applications',
      features: [
        'TypeScript support with full type definitions',
        'Works in browser and Node.js environments',
        'Built-in request retry and error handling',
        'Automatic API key management',
        'Real-time WebSocket connections',
        'Comprehensive test suite included',
      ],
      installation: {
        npm: 'npm install @wrfcoin/sdk',
        yarn: 'yarn add @wrfcoin/sdk',
        cdn: 'https://unpkg.com/@wrfcoin/sdk@latest/dist/wrfcoin.min.js',
      },
      examples: {
        basic: `import { WRFCoinClient } from '@wrfcoin/sdk';

const client = new WRFCoinClient({
  apiKey: 'your-api-key-here',
  environment: 'production'
});

// Get blockchain status
const status = await client.blockchain.getStatus();
devLog('Block height:', status.blockHeight);

// Submit weather data
const result = await client.weather.submitData({
  stationId: 'station-1',
  temperature: 22.5,
  humidity: 65,
  pressure: 1013.25
});`,
        websocket: `// Real-time data streaming
const stream = client.realtime.subscribe('weather-updates');
stream.on('data', (weatherData) => {
  devLog('New weather data:', weatherData);
});

stream.on('error', (error) => {
  console.error('Stream error:', error);
});`,
      },
    },
    {
      id: 'python',
      name: 'Python SDK',
      icon: '🐍',
      description: 'Python SDK with async support and pandas integration',
      features: [
        'Async/await support for better performance',
        'Pandas DataFrame integration',
        'Built-in data validation with Pydantic',
        'Comprehensive logging and debugging',
        'CLI tools for common operations',
        'Jupyter notebook examples included',
      ],
      installation: {
        pip: 'pip install wrfcoin-sdk',
        conda: 'conda install -c conda-forge wrfcoin-sdk',
        poetry: 'poetry add wrfcoin-sdk',
      },
      examples: {
        basic: `from wrfcoin import WRFCoinClient
import asyncio

client = WRFCoinClient(
    api_key="your-api-key-here",
    environment="production"
)

# Synchronous usage
status = client.blockchain.get_status()
print(f"Block height: {status.block_height}")

# Asynchronous usage
async def main():
    async with client:
        weather_data = await client.weather.submit_data(
            station_id="station-1",
            temperature=22.5,
            humidity=65,
            pressure=1013.25
        )
        print(f"Data submitted: {weather_data.id}")

asyncio.run(main())`,
        dataframe: `# Pandas integration for data analysis
import pandas as pd

# Get historical weather data as DataFrame
df = client.weather.get_historical_data(
    station_id="station-1",
    start_date="2024-01-01",
    end_date="2024-07-15",
    format="dataframe"
)

# Perform analysis
avg_temp = df['temperature'].mean()
print(f"Average temperature: {avg_temp:.2f}°C")`,
      },
    },
    {
      id: 'java',
      name: 'Java SDK',
      icon: '☕',
      description: 'Enterprise-grade Java SDK with Spring Boot integration',
      features: [
        'Spring Boot auto-configuration',
        'Reactive programming with Project Reactor',
        'Built-in connection pooling',
        'Comprehensive metrics and monitoring',
        'Maven and Gradle support',
        'Enterprise security features',
      ],
      installation: {
        maven: `<dependency>
    <groupId>org.wrfcoin</groupId>
    <artifactId>wrfcoin-sdk</artifactId>
    <version>1.5.1</version>
</dependency>`,
        gradle: 'implementation "org.wrfcoin:wrfcoin-sdk:1.5.1"',
      },
      examples: {
        basic: `import org.wrfcoin.sdk.WRFCoinClient;
import org.wrfcoin.sdk.config.ClientConfig;

// Configure client
ClientConfig config = ClientConfig.builder()
    .apiKey("your-api-key-here")
    .environment("production")
    .retryEnabled(true)
    .build();

WRFCoinClient client = new WRFCoinClient(config);

// Get blockchain status
BlockchainStatus status = client.blockchain().getStatus();
System.out.println("Block height: " + status.getBlockHeight());

// Submit weather data
WeatherDataRequest request = WeatherDataRequest.builder()
    .stationId("station-1")
    .temperature(22.5)
    .humidity(65)
    .pressure(1013.25)
    .build();

WeatherDataResponse response = client.weather().submitData(request);
System.out.println("Data ID: " + response.getId());`,
        reactive: `// Reactive programming with WebFlux
import reactor.core.publisher.Flux;

// Stream real-time data
Flux<WeatherData> weatherStream = client.weather()
    .streamRealTimeData("station-1");

weatherStream
    .filter(data -> data.getTemperature() > 30.0)
    .doOnNext(data -> System.out.println("High temperature alert: " + data))
    .subscribe();`,
      },
    },
    {
      id: 'go',
      name: 'Go SDK',
      icon: '🐹',
      description: 'High-performance Go SDK with built-in concurrency support',
      features: [
        'Native Go modules support',
        'Built-in context cancellation',
        'Concurrent request handling',
        'Minimal external dependencies',
        'Comprehensive benchmarks',
        'CLI tools and examples',
      ],
      installation: {
        'go-get': 'go get github.com/wrfcoin/go-sdk',
        'go-mod': 'go mod tidy',
      },
      examples: {
        basic: `package main

import (
import { devLog } from '../../utils/logger';
    "context"
    "fmt"
    "log"
    
    "github.com/wrfcoin/go-sdk/wrfcoin"
)

func main() {
    client := wrfcoin.NewClient(&wrfcoin.Config{
        APIKey:      "your-api-key-here",
        Environment: "production",
    })

    ctx := context.Background()

    // Get blockchain status
    status, err := client.Blockchain.GetStatus(ctx)
    if err != nil {
        log.Fatal(err)
    }
    fmt.Printf("Block height: %d\n", status.BlockHeight)

    // Submit weather data
    data := &wrfcoin.WeatherData{
        StationID:   "station-1",
        Temperature: 22.5,
        Humidity:    65,
        Pressure:    1013.25,
    }

    result, err := client.Weather.SubmitData(ctx, data)
    if err != nil {
        log.Fatal(err)
    }
    fmt.Printf("Data ID: %s\n", result.ID)
}`,
        concurrent: `// Concurrent data processing
func processStations(ctx context.Context, client *wrfcoin.Client, stations []string) {
    var wg sync.WaitGroup
    results := make(chan *wrfcoin.WeatherData, len(stations))

    for _, stationID := range stations {
        wg.Add(1)
        go func(id string) {
            defer wg.Done()
            
            data, err := client.Weather.GetLatestData(ctx, id)
            if err != nil {
                log.Printf("Error for station %s: %v", id, err)
                return
            }
            
            results <- data
        }(stationID)
    }

    go func() {
        wg.Wait()
        close(results)
    }()

    for data := range results {
        fmt.Printf("Station %s: %.1f°C\n", data.StationID, data.Temperature)
    }
}`,
      },
    },
    {
      id: 'php',
      name: 'PHP SDK',
      icon: '🐘',
      description: 'Modern PHP SDK with PSR compliance and Laravel integration',
      features: [
        'PSR-4, PSR-7, and PSR-18 compliant',
        'Laravel service provider included',
        'Guzzle HTTP client integration',
        'Comprehensive PHPDoc annotations',
        'PHPStan level 8 compliant',
        'Symfony integration available',
      ],
      installation: {
        composer: 'composer require wrfcoin/php-sdk',
      },
      examples: {
        basic: `<?php

use WRFCoin\\SDK\\Client;
use WRFCoin\\SDK\\Config\\ClientConfig;

$config = new ClientConfig([
    'api_key' => 'your-api-key-here',
    'environment' => 'production',
]);

$client = new Client($config);

// Get blockchain status
$status = $client->blockchain()->getStatus();
echo "Block height: " . $status->getBlockHeight() . "\\n";

// Submit weather data
$weatherData = [
    'station_id' => 'station-1',
    'temperature' => 22.5,
    'humidity' => 65,
    'pressure' => 1013.25,
];

$result = $client->weather()->submitData($weatherData);
echo "Data ID: " . $result->getId() . "\\n";`,
        laravel: `// Laravel integration
// config/services.php
'wrfcoin' => [
    'api_key' => env('WRFCOIN_API_KEY'),
    'environment' => env('WRFCOIN_ENVIRONMENT', 'production'),
],

// In your controller
use WRFCoin\\SDK\\Facades\\WRFCoin;

class WeatherController extends Controller
{
    public function store(Request $request)
    {
        $result = WRFCoin::weather()->submitData([
            'station_id' => $request->station_id,
            'temperature' => $request->temperature,
            'humidity' => $request->humidity,
            'pressure' => $request->pressure,
        ]);

        return response()->json($result);
    }
}`,
      },
    },
    {
      id: 'c-sharp',
      name: 'C# SDK',
      icon: '🔷',
      description: '.NET SDK with async/await and dependency injection support',
      features: [
        'Full async/await support',
        'Dependency injection integration',
        'Strong typing with generics',
        'Built-in configuration management',
        'Comprehensive XML documentation',
        'NuGet package available',
      ],
      installation: {
        nuget: 'Install-Package WRFCoin.SDK',
        'dotnet-cli': 'dotnet add package WRFCoin.SDK',
      },
      examples: {
        basic: `using WRFCoin.SDK;
using WRFCoin.SDK.Models;

var config = new ClientConfiguration
{
    ApiKey = "your-api-key-here",
    Environment = "production"
};

var client = new WRFCoinClient(config);

// Get blockchain status
var status = await client.Blockchain.GetStatusAsync();
Console.WriteLine($"Block height: {status.BlockHeight}");

// Submit weather data
var weatherData = new WeatherDataRequest
{
    StationId = "station-1",
    Temperature = 22.5m,
    Humidity = 65,
    Pressure = 1013.25m
};

var result = await client.Weather.SubmitDataAsync(weatherData);
Console.WriteLine($"Data ID: {result.Id}");`,
        di: `// Dependency injection setup
// Program.cs or Startup.cs
services.AddWRFCoinClient(options =>
{
    options.ApiKey = Configuration["WRFCoin:ApiKey"];
    options.Environment = Configuration["WRFCoin:Environment"];
});

// In your controller
[ApiController]
[Route("api/[controller]")]
public class WeatherController : ControllerBase
{
    private readonly IWRFCoinClient _wrfCoinClient;

    public WeatherController(IWRFCoinClient wrfCoinClient)
    {
        _wrfCoinClient = wrfCoinClient;
    }

    [HttpPost]
    public async Task<IActionResult> SubmitData([FromBody] WeatherDataRequest request)
    {
        var result = await _wrfCoinClient.Weather.SubmitDataAsync(request);
        return Ok(result);
    }
}`,
      },
    },
  ];

  const selectedSDK = sdkPackages.find(sdk => sdk.id === selectedLanguage);

  return (
    <div className="sdk-downloads">
      {/* Language Selector */}
      <div className="language-selector">
        <h3>Choose Your Language</h3>
        <div className="language-grid">
          {sdkPackages.map(sdk => (
            <button
              key={sdk.id}
              className={`language-card ${selectedLanguage === sdk.id ? 'active' : ''}`}
              onClick={() => setSelectedLanguage(sdk.id)}
            >
              <div className="language-icon">{sdk.icon}</div>
              <div className="language-info">
                <h4>{sdk.name}</h4>
                <div className="language-stats">
                  <span className="version">
                    v{downloadStats[sdk.id]?.version}
                  </span>
                  <span className="downloads">
                    {downloadStats[sdk.id]?.downloads?.toLocaleString()}{' '}
                    downloads
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* SDK Details */}
      {selectedSDK && (
        <div className="sdk-details">
          <div className="sdk-header">
            <div className="sdk-title">
              <span className="sdk-icon">{selectedSDK.icon}</span>
              <h2>{selectedSDK.name}</h2>
            </div>
            <div className="sdk-actions">
              <WrfButton
                variant="primary"
                disabled title={SAMPLE_ACTION}
              >
                Download Latest
              </WrfButton>
              <WrfButton
                variant="secondary"
                disabled title={SAMPLE_ACTION}
              >
                Documentation
              </WrfButton>
            </div>
          </div>

          <p className="sdk-description">{selectedSDK.description}</p>

          {/* Features */}
          <div className="sdk-section">
            <h3>✨ Key Features</h3>
            <div className="features-grid">
              {selectedSDK.features.map((feature, index) => (
                <div key={index} className="feature-item">
                  <span className="feature-bullet">•</span>
                  {feature}
                </div>
              ))}
            </div>
          </div>

          {/* Installation */}
          <div className="sdk-section">
            <h3>⚡ Quick Installation</h3>
            <div className="installation-methods">
              {Object.entries(selectedSDK.installation).map(
                ([method, command]) => (
                  <div key={method} className="installation-method">
                    <div className="method-header">
                      <span className="method-name">
                        {method.toUpperCase()}
                      </span>
                      <button
                        className="copy-btn"
                        onClick={() =>
                          navigator.clipboard.writeText(
                            typeof command === 'string' ? command : command,
                          )
                        }
                      >
                        Copy
                      </button>
                    </div>
                    <pre className="command-block">
                      <code>
                        {typeof command === 'string' ? command : command}
                      </code>
                    </pre>
                  </div>
                ),
              )}
            </div>
          </div>

          {/* Code Examples */}
          <div className="sdk-section">
            <h3>💻 Code Examples</h3>
            <div className="examples-container">
              {Object.entries(selectedSDK.examples).map(
                ([exampleType, code]) => (
                  <div key={exampleType} className="example-block">
                    <div className="example-header">
                      <h4>
                        {exampleType.charAt(0).toUpperCase() +
                          exampleType.slice(1)}{' '}
                        Usage
                      </h4>
                      <button
                        className="copy-btn"
                        onClick={() => navigator.clipboard.writeText(code)}
                      >
                        Copy Code
                      </button>
                    </div>
                    <pre className="code-block">
                      <code>{code}</code>
                    </pre>
                  </div>
                ),
              )}
            </div>
          </div>

          {/* Additional Resources */}
          <div className="sdk-section">
            <h3>📖 Additional Resources</h3>
            <div className="resources-grid">
              <button
                type="button"
                className="resource-card"
                disabled
                title={SAMPLE_ACTION}
              >
                <div className="resource-icon">📁</div>
                <div className="resource-info">
                  <h4>Example Projects</h4>
                  <p>Download complete example applications and tutorials</p>
                </div>
              </button>

              <button
                type="button"
                className="resource-card"
                disabled
                title={SAMPLE_ACTION}
              >
                <div className="resource-icon">📋</div>
                <div className="resource-info">
                  <h4>API Reference</h4>
                  <p>Complete API documentation and method reference</p>
                </div>
              </button>

              <button
                type="button"
                className="resource-card"
                disabled
                title={SAMPLE_ACTION}
              >
                <div className="resource-icon">📝</div>
                <div className="resource-info">
                  <h4>Changelog</h4>
                  <p>Version history and release notes</p>
                </div>
              </button>

              <button
                type="button"
                className="resource-card"
                disabled
                title={SAMPLE_ACTION}
              >
                <div className="resource-icon">🔄</div>
                <div className="resource-info">
                  <h4>Migration Guide</h4>
                  <p>Upgrade guides and breaking change information</p>
                </div>
              </button>
            </div>
          </div>

          {/* Community and Support */}
          <div className="sdk-section">
            <h3>🤝 Community & Support</h3>
            <div className="support-options">
              <div className="support-item">
                <span className="support-icon">💬</span>
                <div className="support-info">
                  <h4>Discord Community</h4>
                  <p>
                    Join our Discord server for real-time help and discussions
                  </p>
                  <button type="button" className="support-link" disabled title={SAMPLE_ACTION}>
                    Join Discord →
                  </button>
                </div>
              </div>

              <div className="support-item">
                <span className="support-icon">🐛</span>
                <div className="support-info">
                  <h4>GitHub Issues</h4>
                  <p>Report bugs, request features, or contribute to the SDK</p>
                  <button type="button" className="support-link" disabled title={SAMPLE_ACTION}>
                    View on GitHub →
                  </button>
                </div>
              </div>

              <div className="support-item">
                <span className="support-icon">📧</span>
                <div className="support-info">
                  <h4>Developer Support</h4>
                  <p>Get direct support from our developer relations team</p>
                  <button type="button" className="support-link" disabled title={SAMPLE_ACTION}>
                    Contact Support →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// frontend#352: display-only fabricated surface. The default build shows an
// honest not-live state and never mounts the sample.
const SDKDownloads = () => (
  <DemoSurfaceGate
    title="SDK downloads are not live"
    description="No SDK packages are published from this site, and the download counts were never measured."
    testId="sdk-downloads"
  >
    <SDKDownloadsSample />
  </DemoSurfaceGate>
);

export default SDKDownloads;
