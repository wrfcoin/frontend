# IoT Sensor Dashboard

A comprehensive React TypeScript dashboard for monitoring and managing IoT sensor networks in the
WRFCoin platform. This dashboard provides real-time visualization, device management, and data
streaming capabilities for 20+ supported IoT sensor platforms.

## Components Overview

### 1. SensorNetworkDashboard (Main Component)

The central dashboard component that orchestrates all IoT sensor network functionality.

**Features:**

- Real-time metrics overview (total devices, active networks, data points, health score)
- Platform grid view with detailed information for each sensor network
- Tabbed interface for different views (Overview, Map, Data Stream, Device Registration)
- Auto-refresh functionality with manual refresh controls
- Responsive Material-UI design

**Props:**

```typescript
interface SensorNetworkDashboardProps {
  onPlatformSelect?: (platform: SensorPlatform) => void;
  initialView?: 'overview' | 'map' | 'data' | 'register';
}
```

### 2. SensorMapView

Interactive map component for visualizing sensor locations globally.

**Features:**

- Mock interactive map with sensor location markers
- Clustering algorithm for nearby sensors
- Layer controls for different platforms and data types
- Real-time updates toggle
- Heatmap overlay option
- Location-based filtering
- Detailed location cards with device counts and capabilities

**Props:**

```typescript
interface SensorMapViewProps {
  platforms: SensorPlatform[];
  selectedPlatform: SensorPlatform | null;
  onPlatformSelect: (platform: SensorPlatform) => void;
}
```

### 3. DeviceRegistrationFlow

Multi-step wizard for registering new IoT devices with the network.

**Features:**

- 4-step registration process (Device Info → Location & Capabilities → Security → Review)
- Platform selection with detailed information
- GPS location detection
- Device capability selection
- Cryptographic attestation generation (simulated)
- Form validation and error handling
- Expandable help sections

**Props:**

```typescript
interface DeviceRegistrationFlowProps {
  platforms: SensorPlatform[];
  onRegistrationComplete?: (registration: DeviceRegistration) => void;
}
```

### 4. SensorDataStream

Real-time data visualization and streaming component.

**Features:**

- Live data streaming with WebSocket simulation
- Multiple chart types (Line charts with Chart.js)
- Real-time statistics cards
- Data export functionality
- Configurable time ranges and data types
- Auto-scaling charts
- Recent data points table
- Stream controls (play/pause/stop)

**Props:**

```typescript
interface SensorDataStreamProps {
  platforms: SensorPlatform[];
  selectedPlatform: SensorPlatform | null;
}
```

## Custom Hooks

### useIoTWebSocket

Custom hook for WebSocket connections to real-time sensor data streams.

**Features:**

- Auto-reconnection with exponential backoff
- Connection state management
- Data filtering by location, platforms, and data types
- Error handling and recovery
- Message sending capabilities
- Data accumulation with automatic cleanup

**Usage:**

```typescript
const { data, isConnected, connect, disconnect } = useIoTWebSocket('/sensors/stream', {
  location: 'nyc',
  platforms: ['helium', 'iotex'],
  dataTypes: ['temperature', 'humidity'],
  onData: sensorData => console.log('New data:', sensorData),
});
```

## API Integration

The dashboard integrates with the WRFCoin backend API through the extended `api.ts` service:

### New API Types

- `SensorPlatform` - IoT platform information
- `SensorData` - Individual sensor measurements
- `AggregatedSensorData` - Processed sensor data
- `DeviceRegistration` - Device registration information
- `IoTMetrics` - System-wide IoT metrics

### New API Methods

- `sensorAPI.getPlatforms()` - Get all sensor platforms
- `sensorAPI.getMetrics()` - Get IoT system metrics
- `sensorAPI.getDataStream(location)` - Get sensor data stream
- `sensorAPI.aggregateData(params)` - Aggregate sensor data
- `sensorAPI.registerDevice(data)` - Register new device
- `sensorAPI.submitIoTeXData(data)` - Submit IoTeX sensor data
- `sensorAPI.registerHeliumDevice(data)` - Register Helium device

## Usage Examples

### Basic Usage

```tsx
import { SensorNetworkDashboard } from '../components/IoTDashboard';

function App() {
  return (
    <div>
      <SensorNetworkDashboard
        initialView="overview"
        onPlatformSelect={platform => console.log('Selected:', platform)}
      />
    </div>
  );
}
```

### Using Individual Components

```tsx
import {
  SensorMapView,
  SensorDataStream,
  DeviceRegistrationFlow,
} from '../components/IoTDashboard';

function CustomDashboard() {
  const [platforms, setPlatforms] = useState([]);
  const [selectedPlatform, setSelectedPlatform] = useState(null);

  return (
    <div>
      <SensorMapView
        platforms={platforms}
        selectedPlatform={selectedPlatform}
        onPlatformSelect={setSelectedPlatform}
      />

      <SensorDataStream platforms={platforms} selectedPlatform={selectedPlatform} />

      <DeviceRegistrationFlow
        platforms={platforms}
        onRegistrationComplete={result => console.log('Registered:', result)}
      />
    </div>
  );
}
```

### Real-time Data Streaming

```tsx
import { useIoTWebSocket } from '../hooks/useIoTWebSocket';

function StreamingComponent() {
  const { data, isConnected, connect, disconnect } = useIoTWebSocket('/sensors/stream/nyc', {
    platforms: ['helium', 'sensor_community'],
    dataTypes: ['temperature', 'humidity', 'air_quality'],
    onData: newData => {
      console.log('Received sensor data:', newData);
    },
  });

  return (
    <div>
      <button onClick={connect} disabled={isConnected}>
        Start Streaming
      </button>
      <button onClick={disconnect} disabled={!isConnected}>
        Stop Streaming
      </button>
      <div>Data points: {data.length}</div>
    </div>
  );
}
```

## Supported IoT Platforms

The dashboard supports 20+ IoT sensor platforms including:

1. **Helium Network** - People-powered wireless network
2. **The Things Network** - LoRaWAN IoT network
3. **Sensor.Community** - Citizen science air quality monitoring
4. **IoTeX** - Blockchain-based IoT platform
5. **IOTA Tangle** - Feeless IoT microtransactions
6. **Streamr** - Real-time data marketplace
7. **FOAM Protocol** - Proof of location network
8. **OpenAQ** - Global air quality data
9. **OpenForis** - Forest monitoring platform
10. **OGC (Open Geospatial Consortium)** - Geospatial standards

## Data Types Supported

- Temperature (°C)
- Humidity (%)
- Air Pressure (hPa)
- Air Quality Index (AQI)
- PM2.5 and PM10 (µg/m³)
- Wind Speed/Direction (m/s, degrees)
- Rainfall (mm)
- Noise Level (dB)
- UV Index
- CO2 Levels (ppm)
- Location (GPS coordinates)
- Battery Level (%)
- Signal Strength (dBm)

## Styling and Theming

The dashboard uses Material-UI components with custom styling:

- Consistent color scheme with platform-specific colors
- Responsive grid layouts
- Dark/light theme support through Material-UI theme
- Custom animations for real-time data updates
- Glassmorphism effects for modern UI appearance

## Performance Considerations

- **Data Limiting**: Automatic cleanup of old data points (max 1000 points)
- **Chart Optimization**: Limited chart data points for smooth rendering
- **Debounced Updates**: Throttled real-time updates to prevent UI blocking
- **Lazy Loading**: Components loaded on-demand
- **Memoization**: React.memo and useMemo for expensive calculations
- **Virtual Scrolling**: For large data lists (can be implemented)

## Backend Integration

The dashboard expects the following backend endpoints:

### Core Endpoints (Port 3002)

- `GET /api/iot/networks` - Get all IoT platforms
- `GET /api/iot/networks/:id` - Get specific platform
- `GET /api/iot/metrics` - Get system metrics

### Sensor Data Endpoints

- `POST /sensors/aggregate-data` - Aggregate sensor data
- `GET /sensors/stream/:location` - Get data stream
- `POST /sensors/register-device` - Register new device
- `POST /sensors/iotex/submit` - Submit IoTeX data
- `POST /sensors/helium/register` - Register Helium device

### WebSocket Endpoints

- `ws://localhost:3002/sensors/stream/:location` - Real-time data stream

## Error Handling

The dashboard includes comprehensive error handling:

- **Network Errors**: Automatic retry with exponential backoff
- **WebSocket Disconnections**: Auto-reconnection with fallback
- **Form Validation**: Real-time validation with user feedback
- **API Failures**: User-friendly error messages with retry options
- **Loading States**: Skeleton screens and progress indicators

## Testing

Components are designed to be testable with:

- **Mock Data**: Comprehensive mock data for development
- **Storybook Integration**: Components documented in Storybook
- **Unit Tests**: Jest/React Testing Library compatible
- **E2E Tests**: Playwright integration ready

## Future Enhancements

Potential improvements for the dashboard:

1. **Real Map Integration**: Mapbox/Google Maps integration
2. **Advanced Analytics**: Machine learning insights
3. **Alert System**: Real-time threshold monitoring
4. **Offline Support**: PWA with offline data caching
5. **Mobile App**: React Native version
6. **Advanced Filtering**: Complex query builder
7. **Data Export**: Multiple formats (CSV, Excel, PDF)
8. **Custom Dashboards**: User-configurable layouts
9. **Geofencing**: Location-based alerts
10. **Historical Analysis**: Time-series data analysis

## Dependencies

Required dependencies for the IoT Dashboard:

```json
{
  "@mui/material": "^7.2.0",
  "@mui/icons-material": "^7.2.0",
  "@emotion/react": "^11.14.0",
  "@emotion/styled": "^11.14.1",
  "chart.js": "^4.4.0",
  "react-chartjs-2": "^5.2.0",
  "axios": "^1.5.0",
  "react": "^18.2.0",
  "react-dom": "^18.2.0"
}
```

## Contributing

When contributing to the IoT Dashboard:

1. Follow the existing TypeScript patterns
2. Use Material-UI components consistently
3. Add proper error handling and loading states
4. Include comprehensive prop documentation
5. Test with mock data during development
6. Follow the existing folder structure
7. Add Storybook stories for new components

## License

Part of the WRFCoin platform - see main project license.
