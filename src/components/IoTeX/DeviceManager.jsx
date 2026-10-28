import React, { useState, useEffect } from 'react';
import {
  WrfCard,
  WrfButton,
  WrfInput,
  WrfSelect,
  WrfDataTable,
  WrfTabs,
  WrfTabPanel,
} from '../DesignSystem';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import axios from 'axios';
import { canonicalizeWeatherPayload } from '../../utils/weatherPayloadCanonical';
import { devLog } from '../../utils/logger';

// Local notification helper (replaces CustomComponents notification)
const notification = {
  success: ({ message, description }) => devLog(message, description),
  error: ({ message, description }) => console.error(message, description),
  warning: ({ message, description }) => console.warn(message, description),
  info: ({ message, description }) => devLog(message, description),
};

// Custom icon replacements
const SendOutlined = () => <span className="icon">&#x1F4E4;</span>;
const InfoCircleOutlined = () => <span className="icon">&#x2139;&#xFE0F;</span>;
const LoadingOutlined = () => <span className="icon">&#x26AA;</span>;
const CheckCircleOutlined = () => <span className="icon">&#x2705;</span>;
const CloseCircleOutlined = () => <span className="icon">&#x274C;</span>;
const SyncOutlined = () => <span className="icon">&#x1F504;</span>;
const ApiOutlined = () => <span className="icon">&#x1F50C;</span>;
const GlobalOutlined = () => <span className="icon">&#x1F310;</span>;
const LinkOutlined = () => <span className="icon">&#x1F517;</span>;
const PlusOutlined = () => <span className="icon">&#x2795;</span>;

/**
 * Map one row of the backend's public /api/iotex/devices projection
 * ({ id, name, type, attestationStatus, lastSeen, ... }) onto the fields this
 * component reads. Only public fields are carried over; owner, publicKey and
 * other private metadata are never copied even if a response includes them.
 */
export const normalizeDevice = row => ({
  deviceId: row?.id ?? row?.deviceId ?? '',
  name: row?.name ?? '',
  deviceType: row?.type ?? row?.deviceType ?? '',
  attestationStatus: row?.attestationStatus ?? '',
  lastSeen: row?.lastSeen ?? null,
});

/** The list response is { success, data: [...], pagination }; accept a bare array too. */
export const unwrapDeviceList = body => {
  const rows = Array.isArray(body) ? body : body?.data;
  return Array.isArray(rows) ? rows.map(normalizeDevice) : [];
};

/**
 * IoTeX Device Manager Component
 *
 * This component provides an interface for managing IoTeX device attestation,
 * and W3bstream integration for weather data collection.
 */
const DeviceManager = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formDeviceId, setFormDeviceId] = useState('');
  const [formDeviceName, setFormDeviceName] = useState('');
  const [formDeviceType, setFormDeviceType] = useState('WEATHER_STATION');
  const [formLatitude, setFormLatitude] = useState('');
  const [formLongitude, setFormLongitude] = useState('');
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [attestationMethods, setAttestationMethods] = useState(['tee']);
  const [activeTab, setActiveTab] = useState('1');

  // Form state for weather data submission (replacing Form.useForm)
  const [formValues, setFormValues] = useState({});
  const dataForm = {
    resetFields: () => setFormValues({}),
    getFieldsValue: () => formValues,
    setFieldsValue: (values) => setFormValues(prev => ({ ...prev, ...values })),
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/iotex/devices');
      setDevices(unwrapDeviceList(response.data));
    } catch (error) {
      console.error('Error fetching devices:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to fetch devices',
      });
    } finally {
      setLoading(false);
    }
  };

  const registerDevice = async () => {
    if (!formDeviceId || !formDeviceName || !formDeviceType) {
      notification.warning({
        message: 'Validation Error',
        description: 'Please fill all required fields',
      });
      return;
    }

    setLoading(true);
    try {
      const deviceData = {
        deviceId: formDeviceId,
        name: formDeviceName,
        deviceType: formDeviceType,
        manufacturer: 'WRF Labs',
        modelNumber: 'WS-2025-PRO',
        firmwareVersion: '1.0.0',
        latitude: parseFloat(formLatitude),
        longitude: parseFloat(formLongitude),
        sensors: [
          'temperature',
          'humidity',
          'pressure',
          'wind',
          'rainfall',
          'solar',
        ],
      };

      const response = await axios.post('/api/iotex/devices', deviceData);

      if (response.data) {
        notification.success({
          message: 'Success',
          description: `Device ${response.data.deviceId} registered successfully`,
        });
        fetchDevices();
        resetForm();
      }
    } catch (error) {
      console.error('Error registering device:', error);
      notification.error({
        message: 'Error',
        description: error.response?.data?.error || 'Failed to register device',
      });
    } finally {
      setLoading(false);
    }
  };

  const requestAttestation = async deviceId => {
    setLoading(true);
    try {
      const response = await axios.post(
        `/api/iotex/devices/${deviceId}/attestation`,
        {
          methods: attestationMethods,
        },
      );

      if (response.data) {
        notification.success({
          message: 'Success',
          description: `Attestation requested for device ${deviceId}`,
        });
        fetchDevices();
      }
    } catch (error) {
      console.error('Error requesting attestation:', error);
      notification.error({
        message: 'Error',
        description:
          error.response?.data?.error || 'Failed to request attestation',
      });
    } finally {
      setLoading(false);
    }
  };

  const submitWeatherData = async values => {
    if (!selectedDeviceId) {
      notification.warning({
        message: 'No Device Selected',
        description: 'Please select a device to submit data for',
      });
      return;
    }

    setLoading(true);
    try {
      const timestamp = new Date().toISOString();
      const weatherData = {
        measurements: {
          temperature_c: parseFloat(values.temperature),
          humidity: parseFloat(values.humidity),
          pressure_hpa: parseFloat(values.pressure),
          wind_speed_ms: parseFloat(values.windSpeed),
          windDirection: parseFloat(values.windDirection),
          precipitation: parseFloat(values.rainfall || 0),
          solarRadiation: parseFloat(values.solarRadiation || 0),
        },
        batteryLevel: parseInt(values.batteryLevel || 100),
        signalStrength: parseInt(values.signalStrength || 90),
        maintenanceStatus: 'OK',
      };
      const canonicalized = canonicalizeWeatherPayload({
        station_id: selectedDeviceId,
        timestamp,
        measurements: weatherData.measurements,
      });
      if (canonicalized.telemetry) {
        const telemetry = {
          ...canonicalized.telemetry,
          surface: 'frontend/iotex-device-manager',
        };
        if (
          typeof window !== 'undefined' &&
          typeof window.dispatchEvent === 'function'
        ) {
          window.dispatchEvent(
            new CustomEvent('legacy-format-detected', { detail: telemetry }),
          );
        }
        console.info('legacy-format-detected', telemetry);
      }

      const response = await axios.post(
        `/api/iotex/devices/${selectedDeviceId}/data`,
        {
          ...weatherData,
          timestamp,
          data: canonicalized.canonicalPayload,
          canonicalPayload: canonicalized.canonicalPayload,
          canonicalTelemetry: canonicalized.telemetry,
        },
      );

      if (response.data) {
        notification.success({
          message: 'Success',
          description: `Weather data submitted for device ${selectedDeviceId}`,
        });
        dataForm.resetFields();
      }
    } catch (error) {
      console.error('Error submitting weather data:', error);
      notification.error({
        message: 'Error',
        description:
          error.response?.data?.error || 'Failed to submit weather data',
      });
    } finally {
      setLoading(false);
    }
  };

  const checkAttestationStatus = async deviceId => {
    setLoading(true);
    try {
      const response = await axios.get(
        `/api/iotex/devices/${deviceId}/attestation`,
      );

      if (response.data) {
        notification.info({
          message: 'Attestation Status',
          description: `Device ${deviceId}: ${response.data.attestationStatus.toUpperCase()}`,
        });
      }
    } catch (error) {
      console.error('Error checking attestation status:', error);
      notification.error({
        message: 'Error',
        description:
          error.response?.data?.error || 'Failed to check attestation status',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormDeviceId('');
    setFormDeviceName('');
    setFormDeviceType('WEATHER_STATION');
    setFormLatitude('');
    setFormLongitude('');
  };

  const renderAttestationStatus = (status) => {
    if (!status) return <Chip label="Unknown" size="small" />;

    switch (status.toLowerCase()) {
    case 'attested':
      return (
        <Chip color="success" icon={<CheckCircleOutlined />} label="Attested" size="small" />
      );
    case 'pending':
      return (
        <Chip color="info" icon={<SyncOutlined />} label="Pending" size="small" />
      );
    case 'unverified':
      return <Chip color="warning" label="Unverified" size="small" />;
    case 'revoked':
      return (
        <Chip color="error" icon={<CloseCircleOutlined />} label="Revoked" size="small" />
      );
    case 'expired':
      return <Chip color="error" label="Expired" size="small" />;
    default:
      return <Chip label={status} size="small" />;
    }
  };

  const columns = [
    {
      key: 'deviceId',
      label: 'Device ID',
    },
    {
      key: 'name',
      label: 'Name',
    },
    {
      key: 'deviceType',
      label: 'Type',
      render: (type) => <Chip color="primary" label={type} size="small" />,
    },
    {
      key: 'attestationStatus',
      label: 'Attestation Status',
      render: renderAttestationStatus,
    },
    {
      key: 'lastSeen',
      label: 'Last Seen',
      render: (lastSeen) =>
        lastSeen ? new Date(lastSeen).toLocaleString() : 'Never',
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_value, record) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <WrfButton
            size="sm"
            variant="outline"
            onClick={() => requestAttestation(record.deviceId)}
            disabled={record.attestationStatus === 'ATTESTED'}
          >
            Attest
          </WrfButton>
          <WrfButton
            size="sm"
            variant="outline"
            onClick={() => checkAttestationStatus(record.deviceId)}
          >
            Check Status
          </WrfButton>
          <WrfButton
            size="sm"
            variant="primary"
            onClick={() => setSelectedDeviceId(record.deviceId)}
          >
            Submit Data
          </WrfButton>
        </div>
      ),
    },
  ];

  const handleWeatherFormSubmit = (e) => {
    e.preventDefault();
    submitWeatherData(formValues);
  };

  const handleFormValueChange = (field) => (e) => {
    setFormValues(prev => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <div className="device-manager">
      <WrfCard headerTitle="IoTeX W3bstream Integration" variant="filled">
        <WrfTabs
          items={[
            { label: 'Device Management', value: '1' },
            { label: 'Weather Data Submission', value: '2' },
          ]}
          value={activeTab}
          onChange={setActiveTab}
        />
        <WrfTabPanel value="1" activeValue={activeTab}>
          <div style={{ marginBottom: 16 }}>
            <WrfButton
              variant="primary"
              startIcon={<SyncOutlined />}
              onClick={fetchDevices}
              loading={loading}
              sx={{ marginRight: '8px' }}
            >
              Refresh
            </WrfButton>
            <span style={{ marginLeft: 8, fontSize: 14 }}>
              {devices.length} device(s) registered
            </span>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}>
              <CircularProgress />
            </div>
          ) : (
            <WrfDataTable
              data={devices}
              columns={columns}
              pageSize={5}
            />
          )}

          <div style={{ marginTop: 24 }}>
            <h3>Register New Device</h3>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '16px',
                marginTop: 16,
              }}
            >
              <div style={{ width: 200 }}>
                <WrfInput
                  placeholder="Device ID"
                  value={formDeviceId}
                  onChange={e => setFormDeviceId(e.target.value)}
                />
              </div>
              <div style={{ width: 200 }}>
                <WrfInput
                  placeholder="Device Name"
                  value={formDeviceName}
                  onChange={e => setFormDeviceName(e.target.value)}
                />
              </div>
              <div style={{ width: 200 }}>
                <WrfSelect
                  value={formDeviceType}
                  onChange={(e) => setFormDeviceType(e.target.value)}
                  options={[
                    { value: 'WEATHER_STATION', label: 'Weather Station' },
                    { value: 'AIR_QUALITY_MONITOR', label: 'Air Quality Monitor' },
                    { value: 'TEMPERATURE_SENSOR', label: 'Temperature Sensor' },
                    { value: 'WIND_SENSOR', label: 'Wind Sensor' },
                    { value: 'RAINFALL_SENSOR', label: 'Rainfall Sensor' },
                  ]}
                />
              </div>
              <div style={{ width: 150 }}>
                <WrfInput
                  placeholder="Latitude"
                  value={formLatitude}
                  onChange={e => setFormLatitude(e.target.value)}
                />
              </div>
              <div style={{ width: 150 }}>
                <WrfInput
                  placeholder="Longitude"
                  value={formLongitude}
                  onChange={e => setFormLongitude(e.target.value)}
                />
              </div>
            </div>
            <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: '16px' }}>
              <FormControl size="small" sx={{ width: 300 }}>
                <InputLabel>Attestation Methods</InputLabel>
                <Select
                  multiple
                  value={attestationMethods}
                  onChange={(e) => setAttestationMethods(e.target.value)}
                  label="Attestation Methods"
                >
                  <MenuItem value="tee">Trusted Execution Environment (TEE)</MenuItem>
                  <MenuItem value="tpm">Trusted Platform Module (TPM)</MenuItem>
                  <MenuItem value="secure_element">Secure Element</MenuItem>
                  <MenuItem value="sovereign">IoTeX Sovereign Attestation</MenuItem>
                  <MenuItem value="hardware_token">Hardware Token</MenuItem>
                  <MenuItem value="multi_factor">Multi-Factor Attestation</MenuItem>
                </Select>
              </FormControl>
              <WrfButton
                variant="primary"
                startIcon={<PlusOutlined />}
                onClick={registerDevice}
                loading={loading}
              >
                Register Device
              </WrfButton>
            </div>
          </div>
        </WrfTabPanel>

        <WrfTabPanel value="2" activeValue={activeTab}>
          <div style={{ marginBottom: 16 }}>
            <h3>Submit Weather Data</h3>
            <p style={{ margin: '4px 0 8px', color: '#5f6368' }}>
              Canonical v1 payload fields: <code>temperature_c</code>,{' '}
              <code>humidity</code>, <code>pressure_hpa</code>,{' '}
              <code>wind_speed_ms</code>, <code>precipitation</code>.
            </p>
            {selectedDeviceId ? (
              <p>
                Submitting data for device:{' '}
                <Chip color="primary" label={selectedDeviceId} size="small" />
              </p>
            ) : (
              <p>
                Select a device from the Device Management tab to submit data
              </p>
            )}
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}>
              <CircularProgress />
            </div>
          ) : (
            <form onSubmit={handleWeatherFormSubmit}>
              <fieldset disabled={!selectedDeviceId} style={{ border: 'none', padding: 0, margin: 0 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                  <div style={{ width: 200 }}>
                    <WrfInput
                      label="Temperature (\u00B0C)"
                      type="number"
                      slotProps={{ htmlInput: { step: '0.1' } }}
                      required
                      value={formValues.temperature || ''}
                      onChange={handleFormValueChange('temperature')}
                    />
                  </div>

                  <div style={{ width: 200 }}>
                    <WrfInput
                      label="Humidity (%)"
                      type="number"
                      slotProps={{ htmlInput: { min: '0', max: '100' } }}
                      required
                      value={formValues.humidity || ''}
                      onChange={handleFormValueChange('humidity')}
                    />
                  </div>

                  <div style={{ width: 200 }}>
                    <WrfInput
                      label="Pressure (hPa)"
                      type="number"
                      slotProps={{ htmlInput: { step: '0.1' } }}
                      required
                      value={formValues.pressure || ''}
                      onChange={handleFormValueChange('pressure')}
                    />
                  </div>

                  <div style={{ width: 200 }}>
                    <WrfInput
                      label="Wind Speed (m/s)"
                      type="number"
                      slotProps={{ htmlInput: { step: '0.1', min: '0' } }}
                      required
                      value={formValues.windSpeed || ''}
                      onChange={handleFormValueChange('windSpeed')}
                    />
                  </div>

                  <div style={{ width: 200 }}>
                    <WrfInput
                      label="Wind Direction (degrees)"
                      type="number"
                      slotProps={{ htmlInput: { min: '0', max: '360' } }}
                      required
                      value={formValues.windDirection || ''}
                      onChange={handleFormValueChange('windDirection')}
                    />
                  </div>

                  <div style={{ width: 200 }}>
                    <WrfInput
                      label="Rainfall (mm)"
                      type="number"
                      slotProps={{ htmlInput: { step: '0.1', min: '0' } }}
                      value={formValues.rainfall || ''}
                      onChange={handleFormValueChange('rainfall')}
                    />
                  </div>

                  <div style={{ width: 200 }}>
                    <WrfInput
                      label="Solar Radiation (W/m\u00B2)"
                      type="number"
                      slotProps={{ htmlInput: { min: '0' } }}
                      value={formValues.solarRadiation || ''}
                      onChange={handleFormValueChange('solarRadiation')}
                    />
                  </div>

                  <div style={{ width: 200 }}>
                    <WrfInput
                      label="Battery Level (%)"
                      type="number"
                      slotProps={{ htmlInput: { min: '0', max: '100' } }}
                      value={formValues.batteryLevel || ''}
                      onChange={handleFormValueChange('batteryLevel')}
                    />
                  </div>

                  <div style={{ width: 200 }}>
                    <WrfInput
                      label="Signal Strength (%)"
                      type="number"
                      slotProps={{ htmlInput: { min: '0', max: '100' } }}
                      value={formValues.signalStrength || ''}
                      onChange={handleFormValueChange('signalStrength')}
                    />
                  </div>
                </div>

                <div style={{ marginTop: 16 }}>
                  <WrfButton
                    variant="primary"
                    type="submit"
                    disabled={!selectedDeviceId}
                    loading={loading}
                  >
                    Submit Weather Data
                  </WrfButton>
                </div>
              </fieldset>
            </form>
          )}
        </WrfTabPanel>
      </WrfCard>
    </div>
  );
};

export default DeviceManager;
