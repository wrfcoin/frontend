import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Stack,
  TextField,
  InputAdornment,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  StepConnector,
  CircularProgress,
} from '@mui/material';
import { stepConnectorClasses } from '@mui/material/StepConnector';
import { styled } from '@mui/material/styles';
import {
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  MyLocation as MyLocationIcon,
} from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, useMapEvents, Circle } from 'react-leaflet';
import { MAP_TILE_URL, MAP_TILE_ATTRIBUTION } from '../../config/mapTiles';
import type { LatLngExpression } from 'leaflet';
import OnboardingProgress from './OnboardingProgress';
import {
  stationRegistrationService,
  type StationProvider,
  type IngestionStatus,
} from '../../services/apiClient';
import { getAuthToken } from '../../services/authTokenStore';
import { STATION_NAME_PUBLIC_NOTICE } from '../../config/stationNamePublicNotice';

// --- Types ---

interface PlatformInfo {
  id: string;
  name: string;
  category: 'wifi' | 'lorawan' | 'cloud-api' | 'air-quality' | 'community';
  configType: 'api-key' | 'lorawan' | 'push-url';
  /**
   * The backend `provider` value this platform maps to. Only platforms with a
   * known backend provider can be registered today (ambient on the deployed
   * backend; acurite/davis/netatmo/ecowitt/tempest once backend #855 lands).
   * Platforms without a mapping are not yet registrable.
   */
  provider?: StationProvider;
}

/** Result handed back to the wizard once the station is really registered. */
export interface ManualSetupResult {
  stationName: string;
  stationId: string;
  ingestionStatus: IngestionStatus;
}

interface ManualSetupFlowProps {
  onComplete: (result: ManualSetupResult) => void;
  onBack: () => void;
}

// --- Data ---

const PLATFORMS: PlatformInfo[] = [
  { id: 'acurite', name: 'AcuRite', category: 'wifi', configType: 'api-key', provider: 'acurite' },
  { id: 'ambient', name: 'Ambient Weather', category: 'wifi', configType: 'api-key', provider: 'ambient' },
  { id: 'davis', name: 'Davis Instruments', category: 'wifi', configType: 'api-key', provider: 'davis' },
  { id: 'netatmo', name: 'Netatmo', category: 'wifi', configType: 'api-key', provider: 'netatmo' },
  { id: 'ecowitt', name: 'Ecowitt', category: 'wifi', configType: 'push-url', provider: 'ecowitt' },
  { id: 'weatherlink', name: 'WeatherLink', category: 'cloud-api', configType: 'api-key' },
  { id: 'helium', name: 'Helium Network', category: 'lorawan', configType: 'lorawan' },
  { id: 'ttn', name: 'The Things Network', category: 'lorawan', configType: 'lorawan' },
  { id: 'purpleair', name: 'PurpleAir', category: 'air-quality', configType: 'api-key' },
  { id: 'awair', name: 'Awair', category: 'air-quality', configType: 'api-key' },
  { id: 'sensorcommunity', name: 'Sensor.Community', category: 'community', configType: 'push-url' },
  { id: 'cwop', name: 'CWOP', category: 'community', configType: 'api-key' },
  { id: 'openaq', name: 'OpenAQ', category: 'community', configType: 'api-key' },
  { id: 'airnow', name: 'AirNow', category: 'air-quality', configType: 'api-key' },
  { id: 'iotex', name: 'IoTeX W3bstream', category: 'lorawan', configType: 'lorawan' },
  { id: 'foam', name: 'FOAM Protocol', category: 'lorawan', configType: 'lorawan' },
  { id: 'iota', name: 'IOTA Tangle', category: 'lorawan', configType: 'lorawan' },
  { id: 'streamr', name: 'Streamr Network', category: 'cloud-api', configType: 'push-url' },
  { id: 'ogc', name: 'Open Geospatial (OGC)', category: 'cloud-api', configType: 'api-key' },
  { id: 'openforis', name: 'OpenForis', category: 'community', configType: 'api-key' },
  { id: 'tempest', name: 'Tempest WeatherFlow', category: 'wifi', configType: 'api-key', provider: 'tempest' },
  { id: 'wunderground', name: 'Weather Underground', category: 'cloud-api', configType: 'api-key' },
];

const STATION_NAME_SUGGESTIONS = [
  'Tony\'s Rooftop Observatory',
  'Hilltop Station Alpha',
  'Backyard Weather Lab',
  'Downtown Sensor Node',
  'The Wind Watcher',
  'Cloud Nine Station',
  'Sunrise Point',
  'Storm Chaser HQ',
];

const NEARBY_STATIONS: LatLngExpression[] = [
  [40.715, -74.005],
  [40.72, -73.99],
  [40.705, -74.01],
  [40.712, -73.998],
  [40.708, -74.002],
];

// --- Styled components ---

const DarkStepConnector = styled(StepConnector)(() => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: { top: 20 },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      background: 'linear-gradient(90deg, #38bdf8, #818cf8)',
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      background: 'linear-gradient(90deg, #38bdf8, #818cf8)',
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    height: 3,
    border: 0,
    backgroundColor: '#334155',
    borderRadius: 1,
  },
}));

// --- Sub-components ---

// Step 1: Platform Selector
interface PlatformSelectorProps {
  platforms: PlatformInfo[];
  selected: string | null;
  onSelect: (id: string) => void;
}

const PlatformSelector: React.FC<PlatformSelectorProps> = ({ platforms, selected, onSelect }) => {
  const [search, setSearch] = useState('');

  const filtered = platforms.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  const categories = [
    { key: 'wifi', label: 'WiFi Stations' },
    { key: 'lorawan', label: 'LoRaWAN / IoT' },
    { key: 'cloud-api', label: 'Cloud APIs' },
    { key: 'air-quality', label: 'Air Quality' },
    { key: 'community', label: 'Community Networks' },
  ];

  return (
    <Box>
      <TextField
        fullWidth
        placeholder="Search platforms..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#64748b' }} />
              </InputAdornment>
            ),
          },
        }}
        sx={{
          mb: 3,
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#1E293B',
            borderRadius: 2,
            '& fieldset': { borderColor: '#334155' },
            '&:hover fieldset': { borderColor: '#475569' },
            '&.Mui-focused fieldset': { borderColor: '#38bdf8' },
          },
          '& .MuiInputBase-input': { color: '#f8fafc' },
        }}
      />

      {categories.map(cat => {
        const catPlatforms = filtered.filter(p => p.category === cat.key);
        if (catPlatforms.length === 0) return null;

        return (
          <Box key={cat.key} sx={{ mb: 3 }}>
            <Typography
              variant="overline"
              sx={{ color: '#64748b', letterSpacing: 1.5, mb: 1, display: 'block' }}
            >
              {cat.label}
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: 1.5,
              }}
            >
              {catPlatforms.map(platform => {
                const isSelected = selected === platform.id;
                return (
                  <Paper
                    key={platform.id}
                    elevation={0}
                    onClick={() => onSelect(platform.id)}
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      textAlign: 'center',
                      borderRadius: 2,
                      border: '2px solid',
                      borderColor: isSelected ? '#38bdf8' : '#334155',
                      backgroundColor: isSelected ? 'rgba(56,189,248,0.08)' : '#1E293B',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: isSelected ? '#38bdf8' : '#475569',
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    {/* Platform icon placeholder */}
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 1.5,
                        backgroundColor: '#334155',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 1,
                        fontSize: 18,
                        fontWeight: 700,
                        color: isSelected ? '#38bdf8' : '#94a3b8',
                      }}
                    >
                      {platform.name.charAt(0)}
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{
                        color: isSelected ? '#f8fafc' : '#cbd5e1',
                        fontWeight: isSelected ? 600 : 400,
                        fontSize: 13,
                      }}
                    >
                      {platform.name}
                    </Typography>
                    {isSelected && (
                      <CheckCircleIcon
                        sx={{
                          fontSize: 16,
                          color: '#38bdf8',
                          mt: 0.5,
                        }}
                      />
                    )}
                  </Paper>
                );
              })}
            </Box>
          </Box>
        );
      })}

      {filtered.length === 0 && (
        <Typography sx={{ color: '#64748b', textAlign: 'center', py: 4 }}>
          No platforms match "{search}"
        </Typography>
      )}
    </Box>
  );
};

// Step 2: Configuration form
interface ConfigurationFormProps {
  platform: PlatformInfo;
  config: Record<string, string>;
  onConfigChange: (key: string, value: string) => void;
  validationStatus: 'idle' | 'validating' | 'success' | 'error';
  validationMessage: string;
  onValidate: () => void;
}

const ConfigurationForm: React.FC<ConfigurationFormProps> = ({
  platform,
  config,
  onConfigChange,
  validationStatus,
  validationMessage,
  onValidate,
}) => {

  if (platform.configType === 'api-key') {
    return (
      <Box>
        <Typography variant="subtitle1" sx={{ color: '#f8fafc', fontWeight: 700, mb: 1 }}>
          Connect via {platform.name} API
        </Typography>
        <Typography variant="body2" sx={{ color: '#94a3b8', mb: 3 }}>
          Enter your {platform.name} API key to authorize data access.
        </Typography>

        <TextField
          fullWidth
          label="API Key"
          type="password"
          value={config.apiKey || ''}
          onChange={e => onConfigChange('apiKey', e.target.value)}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  {validationStatus === 'validating' && (
                    <CircularProgress size={20} sx={{ color: '#38bdf8' }} />
                  )}
                  {validationStatus === 'success' && (
                    <CheckCircleIcon
                      sx={{
                        color: '#34d399',
                        animation: 'checkPop 0.3s ease-out',
                        '@keyframes checkPop': {
                          '0%': { transform: 'scale(0)' },
                          '60%': { transform: 'scale(1.2)' },
                          '100%': { transform: 'scale(1)' },
                        },
                      }}
                    />
                  )}
                </InputAdornment>
              ),
            },
          }}
          sx={{
            mb: 2,
            '& .MuiOutlinedInput-root': {
              backgroundColor: '#1E293B',
              '& fieldset': { borderColor: '#334155' },
              '&:hover fieldset': { borderColor: '#475569' },
              '&.Mui-focused fieldset': { borderColor: '#38bdf8' },
            },
            '& .MuiInputBase-input': { color: '#f8fafc' },
            '& .MuiInputLabel-root': { color: '#94a3b8' },
          }}
        />

        {config.apiKey && validationStatus !== 'success' && (
          <Button
            variant="outlined"
            onClick={onValidate}
            disabled={validationStatus === 'validating'}
            sx={{
              color: '#38bdf8',
              borderColor: '#38bdf8',
              textTransform: 'none',
              '&:hover': { borderColor: '#0ea5e9', backgroundColor: 'rgba(56,189,248,0.08)' },
            }}
          >
            Test Connection
          </Button>
        )}

        {validationStatus === 'success' && (
          <Typography variant="body2" sx={{ color: '#34d399', mt: 1 }}>
            {validationMessage || 'Connection verified successfully'}
          </Typography>
        )}
        {validationStatus === 'error' && (
          <Typography variant="body2" sx={{ color: '#ef4444', mt: 1 }}>
            {validationMessage || 'Invalid API key. Please check and try again.'}
          </Typography>
        )}
      </Box>
    );
  }

  if (platform.configType === 'lorawan') {
    return (
      <Box>
        <Typography variant="subtitle1" sx={{ color: '#f8fafc', fontWeight: 700, mb: 1 }}>
          LoRaWAN Device Configuration
        </Typography>
        <Typography variant="body2" sx={{ color: '#94a3b8', mb: 3 }}>
          Enter your device's LoRaWAN credentials from the {platform.name} console.
        </Typography>

        <Stack spacing={2.5}>
          {[
            { key: 'devEUI', label: 'DevEUI', placeholder: '70B3D5XXXXXXXXXX' },
            { key: 'appEUI', label: 'AppEUI (JoinEUI)', placeholder: '0000000000000000' },
            { key: 'appKey', label: 'AppKey', placeholder: '128-bit hex key' },
          ].map(field => (
            <TextField
              key={field.key}
              fullWidth
              label={field.label}
              placeholder={field.placeholder}
              value={config[field.key] || ''}
              onChange={e => onConfigChange(field.key, e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#1E293B',
                  fontFamily: 'monospace',
                  '& fieldset': { borderColor: '#334155' },
                  '&:hover fieldset': { borderColor: '#475569' },
                  '&.Mui-focused fieldset': { borderColor: '#38bdf8' },
                },
                '& .MuiInputBase-input': { color: '#f8fafc' },
                '& .MuiInputLabel-root': { color: '#94a3b8' },
              }}
            />
          ))}
        </Stack>
      </Box>
    );
  }

  // push-url
  return (
    <Box>
      <Typography variant="subtitle1" sx={{ color: '#f8fafc', fontWeight: 700, mb: 1 }}>
        Data Push Configuration
      </Typography>
      <Typography variant="body2" sx={{ color: '#94a3b8', mb: 3 }}>
        {platform.name} stations push data to a per-station ingest URL. We&apos;ll
        generate your unique URL once you finish setup &mdash; you&apos;ll then
        paste it into your device&apos;s custom server / webhook settings.
      </Typography>

      <Paper
        elevation={0}
        sx={{
          p: 2,
          backgroundColor: '#1E293B',
          borderRadius: 2,
          border: '1px solid #334155',
        }}
      >
        <Typography variant="body2" sx={{ color: '#94a3b8' }}>
          Your ingest URL will be shown on the next-to-last screen after your
          station is registered.
        </Typography>
      </Paper>
    </Box>
  );
};

// Step 3: Location picker
interface LocationPickerProps {
  position: [number, number];
  onPositionChange: (pos: [number, number]) => void;
}

const DraggableMarkerHandler: React.FC<{
  onMove: (lat: number, lng: number) => void;
}> = ({ onMove }) => {
  useMapEvents({
    click(e) {
      onMove(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const LocationPicker: React.FC<LocationPickerProps> = ({ position, onPositionChange }) => {
  const [stationCount] = useState(0);
  const mapRef = useRef<any>(null);

  const handleGeolocate = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      pos => {
        const newPos: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        onPositionChange(newPos);
        mapRef.current?.flyTo(newPos, 14);
      },
      () => {
        // Geolocation denied or unavailable - keep current position
      },
    );
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="subtitle1" sx={{ color: '#f8fafc', fontWeight: 700 }}>
            Pin Your Station Location
          </Typography>
          <Typography variant="body2" sx={{ color: '#94a3b8' }}>
            Click the map or drag the marker to set your station's location.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          size="small"
          startIcon={<MyLocationIcon />}
          onClick={handleGeolocate}
          sx={{
            color: '#38bdf8',
            borderColor: '#38bdf8',
            textTransform: 'none',
            '&:hover': { borderColor: '#0ea5e9', backgroundColor: 'rgba(56,189,248,0.08)' },
          }}
        >
          My Location
        </Button>
      </Stack>

      <Box
        sx={{
          height: 320,
          borderRadius: 2,
          overflow: 'hidden',
          border: '1px solid #334155',
          '& .leaflet-container': { height: '100%', width: '100%', background: '#0F172A' },
        }}
      >
        <MapContainer
          center={position}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
        >
          <TileLayer
            url={MAP_TILE_URL}
            attribution={MAP_TILE_ATTRIBUTION}
          />
          <DraggableMarkerHandler
            onMove={(lat, lng) => onPositionChange([lat, lng])}
          />
          <Marker position={position} />

          {/* Nearby existing stations as blue circles */}
          {NEARBY_STATIONS.map((pos, i) => (
            <Circle
              key={i}
              center={pos}
              radius={60}
              pathOptions={{
                color: '#38bdf8',
                fillColor: '#38bdf8',
                fillOpacity: 0.4,
                weight: 1,
              }}
            />
          ))}
        </MapContainer>
      </Box>

      <Stack direction="row" justifyContent="space-between" sx={{ mt: 1.5 }}>
        <Typography variant="caption" sx={{ color: '#64748b' }}>
          Lat: {position[0].toFixed(6)}, Lng: {position[1].toFixed(6)}
        </Typography>
        <Typography variant="caption" sx={{ color: '#38bdf8' }}>
          {stationCount} stations nearby
        </Typography>
      </Stack>
    </Box>
  );
};

// Step 4: Name your station
interface StationNamerProps {
  name: string;
  onNameChange: (name: string) => void;
}

export const StationNamer: React.FC<StationNamerProps> = ({ name, onNameChange }) => {
  const [suggestions] = useState(() => {
    const shuffled = [...STATION_NAME_SUGGESTIONS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 4);
  });

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ color: '#f8fafc', fontWeight: 700, mb: 1 }}>
        Name Your Station
      </Typography>
      <Typography variant="body2" sx={{ color: '#94a3b8', mb: 3 }}>
        Give your station a memorable name. This will appear on the network map and your dashboard.
      </Typography>

      <TextField
        fullWidth
        placeholder="e.g., Rooftop Weather Station"
        value={name}
        onChange={e => onNameChange(e.target.value)}
        helperText={STATION_NAME_PUBLIC_NOTICE}
        slotProps={{ formHelperText: { sx: { color: '#fbbf24', fontSize: 13, mx: 0 } } }}
        sx={{
          mb: 3,
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#1E293B',
            fontSize: 18,
            fontWeight: 600,
            '& fieldset': { borderColor: '#334155' },
            '&:hover fieldset': { borderColor: '#475569' },
            '&.Mui-focused fieldset': { borderColor: '#38bdf8' },
          },
          '& .MuiInputBase-input': { color: '#f8fafc' },
        }}
      />

      <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 1.5 }}>
        Need inspiration? Try one of these:
      </Typography>
      <Stack direction="row" gap={1} flexWrap="wrap">
        {suggestions.map(suggestion => (
          <Button
            key={suggestion}
            variant="outlined"
            size="small"
            onClick={() => onNameChange(suggestion)}
            sx={{
              textTransform: 'none',
              borderColor: '#334155',
              color: '#cbd5e1',
              borderRadius: 5,
              fontSize: 12,
              '&:hover': {
                borderColor: '#38bdf8',
                backgroundColor: 'rgba(56,189,248,0.05)',
              },
            }}
          >
            {suggestion}
          </Button>
        ))}
      </Stack>
    </Box>
  );
};

// --- Main component ---

const ManualSetupFlow: React.FC<ManualSetupFlowProps> = ({ onComplete, onBack }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [config, setConfig] = useState<Record<string, string>>({});
  const [validationStatus, setValidationStatus] = useState<'idle' | 'validating' | 'success' | 'error'>('idle');
  const [validationMessage, setValidationMessage] = useState('');
  const [position, setPosition] = useState<[number, number]>([40.7128, -74.006]);
  const [stationName, setStationName] = useState('');
  const [registering, setRegistering] = useState(false);
  const [registerError, setRegisterError] = useState('');

  const platform = PLATFORMS.find(p => p.id === selectedPlatform) ?? null;

  // Monotonic token so a stale verify response (after the key was edited) is
  // ignored rather than wrongly marking new credentials as verified.
  const verifySeq = useRef(0);

  // Try to get geolocation on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setPosition([pos.coords.latitude, pos.coords.longitude]),
        () => {}, // keep default
      );
    }
  }, []);

  const handleConfigChange = (key: string, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    // Any credential edit invalidates a prior verification and supersedes any
    // verify request currently in flight.
    if (validationStatus !== 'idle') {
      verifySeq.current += 1;
      setValidationStatus('idle');
      setValidationMessage('');
    }
  };

  // Real key verification against the backend (this replaced an old client-side
  // `key.length > 8` check). For api-key providers we call POST /weather/stations/verify-key.
  const handleValidate = useCallback(async () => {
    if (!platform?.provider) {
      setValidationStatus('error');
      setValidationMessage(
        `${platform?.name ?? 'This platform'} isn't supported for self-service registration yet.`,
      );
      return;
    }
    const apiKey = (config.apiKey || '').trim();
    if (!apiKey) {
      setValidationStatus('error');
      setValidationMessage('Enter your API key first.');
      return;
    }
    verifySeq.current += 1;
    const requestSeq = verifySeq.current;
    setValidationStatus('validating');
    setValidationMessage('');
    try {
      const result = await stationRegistrationService.verifyStationKey({
        provider: platform.provider,
        apiKey,
        appKey: config.appKey?.trim() || undefined,
      });
      if (requestSeq !== verifySeq.current) return; // superseded by a newer edit
      if (result.valid) {
        setValidationStatus('success');
        setValidationMessage(result.message || 'Connection verified successfully');
        const detected = result.devices[0];
        if (detected?.mac) {
          setConfig(prev => ({ ...prev, mac: detected.mac as string }));
        }
        if (detected?.name && !stationName.trim()) {
          setStationName(detected.name);
        }
      } else {
        setValidationStatus('error');
        setValidationMessage(
          result.message || 'Those credentials were not accepted. Please check and try again.',
        );
      }
    } catch (err) {
      if (requestSeq !== verifySeq.current) return;
      setValidationStatus('error');
      setValidationMessage(
        err instanceof Error ? err.message : 'Key verification failed. Please try again.',
      );
    }
  }, [platform, config.apiKey, config.appKey, stationName]);

  const canProceed = (): boolean => {
    switch (activeStep) {
    case 0:
      return selectedPlatform !== null;
    case 1:
      if (!platform) return false;
      if (platform.configType === 'api-key') return validationStatus === 'success';
      if (platform.configType === 'lorawan')
        return !!(config.devEUI && config.appEUI && config.appKey);
      return true; // push-url is ready by default
    case 2:
      return true; // location always has default
    case 3:
      return stationName.trim().length > 0 && !registering;
    default:
      return false;
    }
  };

  // Actually register the station with the backend. Requires an authenticated
  // wallet session (the JWT is attached by ApiClient). We never fabricate a
  // success: a missing token or backend error is surfaced to the user.
  const handleRegister = useCallback(async () => {
    if (!platform?.provider) {
      setRegisterError(
        `${platform?.name ?? 'This platform'} isn't supported for self-service registration yet.`,
      );
      return;
    }
    if (!getAuthToken()) {
      setRegisterError(
        'You need a connected wallet to register a station. Please connect your wallet, then try again.',
      );
      return;
    }
    setRegisterError('');
    setRegistering(true);
    try {
      const result = await stationRegistrationService.registerStation({
        name: stationName.trim(),
        latitude: position[0],
        longitude: position[1],
        provider: platform.provider,
        apiKey: config.apiKey?.trim() || undefined,
        appKey: config.appKey?.trim() || undefined,
        hardware: platform.name,
        mac: config.mac?.trim() || undefined,
      });
      onComplete({
        stationName: stationName.trim(),
        stationId: result.stationId,
        ingestionStatus: result.ingestionStatus,
      });
    } catch (err) {
      setRegisterError(
        err instanceof Error ? err.message : 'Station registration failed. Please try again.',
      );
    } finally {
      setRegistering(false);
    }
  }, [platform, stationName, position, config.apiKey, config.appKey, config.mac, onComplete]);

  const handleNext = () => {
    if (activeStep < 3) {
      setActiveStep(prev => prev + 1);
    } else {
      void handleRegister();
    }
  };

  const handleBack = () => {
    if (activeStep === 0) {
      onBack();
    } else {
      setActiveStep(prev => prev - 1);
    }
  };

  const stepLabels = ['Platform', 'Configure', 'Location', 'Name'];

  return (
    <Box sx={{ minHeight: '100vh', background: '#0F172A', p: 3 }}>
      <Box sx={{ maxWidth: 680, mx: 'auto' }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
          <IconButton onClick={handleBack} sx={{ color: '#94a3b8' }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#f8fafc' }}>
            Manual Setup
          </Typography>
        </Stack>

        {/* MUI Stepper */}
        <Stepper
          activeStep={activeStep}
          alternativeLabel
          connector={<DarkStepConnector />}
          sx={{ mb: 4 }}
        >
          {stepLabels.map((label, index) => (
            <Step key={label} completed={index < activeStep}>
              <StepLabel
                slotProps={{
                  label: {
                    sx: {
                      color: index <= activeStep ? '#f8fafc' : '#64748b',
                      fontWeight: index === activeStep ? 700 : 400,
                      fontSize: 13,
                    },
                  },
                }}
                StepIconProps={{
                  sx: {
                    color: '#334155',
                    '&.Mui-active': { color: '#38bdf8' },
                    '&.Mui-completed': { color: '#38bdf8' },
                  },
                }}
              >
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Step content */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            backgroundColor: 'rgba(30,41,59,0.5)',
            borderRadius: 3,
            border: '1px solid #334155',
            minHeight: 300,
          }}
        >
          {activeStep === 0 && (
            <PlatformSelector
              platforms={PLATFORMS}
              selected={selectedPlatform}
              onSelect={id => {
                setSelectedPlatform(id);
                setConfig({});
                setValidationStatus('idle');
              }}
            />
          )}

          {activeStep === 1 && platform && (
            <ConfigurationForm
              platform={platform}
              config={config}
              onConfigChange={handleConfigChange}
              validationStatus={validationStatus}
              validationMessage={validationMessage}
              onValidate={handleValidate}
            />
          )}

          {activeStep === 2 && (
            <LocationPicker position={position} onPositionChange={setPosition} />
          )}

          {activeStep === 3 && (
            <StationNamer name={stationName} onNameChange={setStationName} />
          )}
        </Paper>

        {/* Registration error (final step) */}
        {activeStep === 3 && registerError && (
          <Typography variant="body2" sx={{ color: '#ef4444', mt: 2 }} role="alert">
            {registerError}
          </Typography>
        )}

        {/* Navigation buttons */}
        <Stack direction="row" justifyContent="space-between" sx={{ mt: 3 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
            disabled={registering}
            sx={{
              color: '#94a3b8',
              borderColor: '#334155',
              textTransform: 'none',
              '&:hover': { borderColor: '#475569' },
            }}
          >
            Back
          </Button>
          <Button
            variant="contained"
            endIcon={
              registering ? (
                <CircularProgress size={18} sx={{ color: '#64748b' }} />
              ) : (
                <ArrowForwardIcon />
              )
            }
            onClick={handleNext}
            disabled={!canProceed()}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: 2,
              px: 4,
              background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
              '&:hover': { background: 'linear-gradient(135deg, #0ea5e9, #6366f1)' },
              '&.Mui-disabled': {
                background: '#334155',
                color: '#64748b',
              },
            }}
          >
            {activeStep === 3 ? (registering ? 'Registering…' : 'Finish Setup') : 'Continue'}
          </Button>
        </Stack>
      </Box>
    </Box>
  );
};

export default ManualSetupFlow;
