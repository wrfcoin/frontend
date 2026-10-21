import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  LinearProgress,
  TextField,
} from '@mui/material';
import { WrfBadge, WrfButton, WrfInput, WrfSelect, WrfModal } from '../DesignSystem';
import axios from 'axios';
import { devLog } from '../../utils/logger';

const STATUS_COLORS = {
  on: 'success',
  off: 'danger',
  testnet: 'info',
  error: 'danger',
  pending: 'warning',
  expires: 'warning',
};

const InternetComputerCard = ({ integrationState, onRefresh }) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ initialized: false });
  const [openTaskDialog, setOpenTaskDialog] = useState(false);
  const [openCanisterDialog, setOpenCanisterDialog] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(null);
  const [taskList, setTaskList] = useState([]);
  const [canisterList, setCanisterList] = useState([]);
  const [taskType, setTaskType] = useState('WEATHER_FORECAST');
  const [taskName, setTaskName] = useState('');
  const [canisterName, setCanisterName] = useState('');
  const [canisterCycles, setCanisterCycles] = useState('100000000000');

  useEffect(() => {
    fetchStatus();
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, []);

  useEffect(() => {
    if (integrationState && integrationState.status === 'on') {
      fetchStatus();
      fetchTasks();
      fetchCanisters();
    }
  }, [integrationState]);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/internet-computer/status');
      setStatus(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching Internet Computer status:', error);
      setLoading(false);
      // Using console.error instead of snackbar notification
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await axios.get('/api/internet-computer/tasks');
      setTaskList(response.data.tasks || []);
    } catch (error) {
      console.error('Error fetching Internet Computer tasks:', error);
    }
  };

  const fetchCanisters = async () => {
    try {
      const response = await axios.get('/api/internet-computer/canisters');
      setCanisterList(response.data.canisters || []);
    } catch (error) {
      console.error('Error fetching Internet Computer canisters:', error);
    }
  };

  const handleRefresh = () => {
    fetchStatus();
    fetchTasks();
    fetchCanisters();
    onRefresh && onRefresh();
  };

  const handleCreateTask = async () => {
    try {
      setLoading(true);

      // Set default task name if not provided
      const finalTaskName = taskName || `${getDefaultTaskName(taskType)}`;

      const response = await axios.post(
        `/api/internet-computer/${taskTypeToEndpoint(taskType)}`,
        {
          name: finalTaskName,
          type: taskType,
        },
      );

      setLoading(false);
      devLog(`Task ${finalTaskName} created successfully`);
      setOpenTaskDialog(false);
      fetchTasks();

      // Reset form
      setTaskName('');
      setTaskType('WEATHER_FORECAST');
    } catch (error) {
      setLoading(false);
      console.error('Error creating Internet Computer task:', error);
    }
  };

  const handleCreateCanister = async () => {
    try {
      setLoading(true);

      // Set default canister name if not provided
      const finalCanisterName = canisterName || 'My Canister';

      const response = await axios.post('/api/internet-computer/canisters', {
        name: finalCanisterName,
        cycles: canisterCycles,
      });

      setLoading(false);
      devLog(`Canister ${finalCanisterName} created successfully`);
      setOpenCanisterDialog(false);
      fetchCanisters();

      // Reset form
      setCanisterName('');
      setCanisterCycles('100000000000');
    } catch (error) {
      setLoading(false);
      console.error('Error creating Internet Computer canister:', error);
    }
  };

  const getDefaultTaskName = type => {
    switch (type) {
    case 'WEATHER_FORECAST':
      return 'Global Weather Forecast';
    case 'CLIMATE_SIMULATION':
      return 'Regional Climate Simulation';
    case 'AIR_QUALITY':
      return 'Urban Air Quality Model';
    default:
      return 'Generic Task';
    }
  };

  const taskTypeToEndpoint = type => {
    switch (type) {
    case 'WEATHER_FORECAST':
      return 'weather-forecast';
    case 'CLIMATE_SIMULATION':
      return 'climate-simulation';
    case 'AIR_QUALITY':
      return 'air-quality';
    default:
      return 'tasks';
    }
  };

  const getStatusChip = () => {
    const statusText = integrationState ? integrationState.status : 'off';
    const expiresText =
      integrationState && integrationState.expires ? ' (expires)' : '';
    const chipLabel = `${statusText}${expiresText}`;
    const statusColor = STATUS_COLORS[statusText] || 'primary';

    return (
      <WrfBadge
        color={statusColor}
        style={{ fontWeight: 'bold' }}
      >
        {chipLabel}
      </WrfBadge>
    );
  };

  const renderTaskDialog = () => (
    <WrfModal
      open={openTaskDialog}
      onClose={() => setOpenTaskDialog(false)}
      title={
        <>
          <i className="bi bi-cpu"></i> Create Computational Task
        </>
      }
    >
      <div style={{ padding: '16px' }}>
        <div className="form-group mb-3">
          <label htmlFor="taskName">Task Name</label>
          <WrfInput
            id="taskName"
            type="text"
            value={taskName}
            onChange={e => setTaskName(e.target.value)}
            placeholder={getDefaultTaskName(taskType)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="taskType">Task Type</label>
          <WrfSelect
            id="taskType"
            value={taskType}
            onChange={e => setTaskType(e.target.value)}
          >
            <option value="WEATHER_FORECAST">Weather Forecast</option>
            <option value="CLIMATE_SIMULATION">Climate Simulation</option>
            <option value="AIR_QUALITY">Air Quality Model</option>
          </WrfSelect>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', padding: '16px', borderTop: '1px solid var(--wrf-border, #e0e0e0)' }}>
        <WrfButton
          variant="secondary"
          onClick={() => setOpenTaskDialog(false)}
        >
          Cancel
        </WrfButton>
        <WrfButton
          variant="primary"
          onClick={handleCreateTask}
          disabled={loading}
        >
          Create Task
        </WrfButton>
      </div>
    </WrfModal>
  );

  const renderCanisterDialog = () => (
    <WrfModal
      open={openCanisterDialog}
      onClose={() => setOpenCanisterDialog(false)}
      title={
        <>
          <i className="bi bi-hdd"></i> Create New Canister
        </>
      }
    >
      <div style={{ padding: '16px' }}>
        <div className="form-group mb-3">
          <label htmlFor="canisterName">Canister Name</label>
          <WrfInput
            id="canisterName"
            type="text"
            value={canisterName}
            onChange={e => setCanisterName(e.target.value)}
            placeholder="My Canister"
          />
        </div>

        <div className="form-group">
          <label htmlFor="canisterCycles">Initial Cycles</label>
          <WrfInput
            id="canisterCycles"
            type="number"
            value={canisterCycles}
            onChange={e => setCanisterCycles(e.target.value)}
          />
          <small className="text-muted" style={{ display: 'block', marginTop: '4px', fontSize: '0.85em', color: '#6c757d' }}>
            Initial cycles allocation (recommended: at least 100B cycles)
          </small>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', padding: '16px', borderTop: '1px solid var(--wrf-border, #e0e0e0)' }}>
        <WrfButton
          variant="secondary"
          onClick={() => setOpenCanisterDialog(false)}
        >
          Cancel
        </WrfButton>
        <WrfButton
          variant="primary"
          onClick={handleCreateCanister}
          disabled={loading}
        >
          Create Canister
        </WrfButton>
      </div>
    </WrfModal>
  );

  const renderTasks = () => (
    <div className="mt-3">
      <h6 className="font-weight-bold">Computational Tasks</h6>
      {taskList.length === 0 ? (
        <p className="text-muted small mt-2">
          No tasks available. Create a new computational task to get started.
        </p>
      ) : (
        <div style={{ maxHeight: '200px', overflow: 'auto' }}>
          {taskList.map(task => (
            <div key={task.id} className="mb-2 p-2 bg-light rounded">
              <div className="font-weight-bold">{task.name || task.type}</div>
              <div className="d-flex justify-content-between align-items-center">
                <small className="text-muted">ID: {task.id}</small>
                <WrfBadge
                  color={
                    task.status === 'completed'
                      ? 'success'
                      : task.status === 'running'
                        ? 'info'
                        : task.status === 'error'
                          ? 'danger'
                          : 'primary'
                  }
                >
                  {task.status}
                </WrfBadge>
              </div>
            </div>
          ))}
        </div>
      )}
      <WrfButton
        variant="outline"
        size="sm"
        style={{ marginTop: '8px' }}
        onClick={() => setOpenTaskDialog(true)}
        disabled={!integrationState || integrationState.status !== 'on'}
      >
        <i className="bi bi-plus"></i> New Task
      </WrfButton>
    </div>
  );

  const renderCanisters = () => (
    <div className="mt-3">
      <h6 className="font-weight-bold">Canisters</h6>
      {canisterList.length === 0 ? (
        <p className="text-muted small mt-2">
          No canisters available. Create a new canister to get started.
        </p>
      ) : (
        <div style={{ maxHeight: '200px', overflow: 'auto' }}>
          {canisterList.map(canister => (
            <div key={canister.id} className="mb-2 p-2 bg-light rounded">
              <div className="font-weight-bold">{canister.name}</div>
              <div className="d-flex justify-content-between align-items-center">
                <small className="text-muted">ID: {canister.id}</small>
                <WrfBadge
                  color={
                    canister.status === 'running'
                      ? 'success'
                      : canister.status === 'stopped'
                        ? 'danger'
                        : 'primary'
                  }
                >
                  {canister.status}
                </WrfBadge>
              </div>
            </div>
          ))}
        </div>
      )}
      <WrfButton
        variant="outline"
        size="sm"
        style={{ marginTop: '8px' }}
        onClick={() => setOpenCanisterDialog(true)}
        disabled={!integrationState || integrationState.status !== 'on'}
      >
        <i className="bi bi-plus"></i> New Canister
      </WrfButton>
    </div>
  );

  return (
    <Card sx={{ height: '100%' }}>
      {loading && <LinearProgress />}

      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <i className="bi bi-cloud text-primary mr-2"></i>
            <Typography variant="h6" sx={{ mb: 0 }}>Internet Computer</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {getStatusChip()}
            <IconButton
              size="small"
              onClick={handleRefresh}
              disabled={loading}
            >
              <i className="bi bi-arrow-clockwise"></i>
            </IconButton>
          </Box>
        </Box>

        <hr style={{ marginBottom: '1rem' }} />

        {!integrationState || integrationState.status === 'off' ? (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Internet Computer integration is currently disabled
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={() => onRefresh && onRefresh()}
              disabled={loading}
            >
              <i className="bi bi-gear mr-1"></i> Enable Integration
            </Button>
          </Box>
        ) : (
          <div>
            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <Typography color="text.secondary" sx={{ mb: 0.5 }}>Status</Typography>
                <Typography>
                  {status.initialized ? 'Connected' : 'Disconnected'}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography color="text.secondary" sx={{ mb: 0.5 }}>Mode</Typography>
                <Typography>
                  {status.testMode ? 'Test Mode' : 'Production'}
                </Typography>
              </Grid>
            </Grid>

            <hr style={{ margin: '1rem 0' }} />

            {renderTasks()}

            <hr style={{ margin: '1rem 0' }} />

            {renderCanisters()}
          </div>
        )}
      </CardContent>

      {renderTaskDialog()}
      {renderCanisterDialog()}
    </Card>
  );
};

export default InternetComputerCard;
