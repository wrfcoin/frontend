import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import { indexOracleNetwork } from '../../services/SearchService';
import {
  unwrapEnvelope,
  asArray,
  countActive,
} from '../../utils/apiEnvelope';
import PageTitle from '../common/PageTitle';
import usePageNavigation from '../../hooks/usePageNavigation';
import {
  WrfCard,
  WrfStatCard,
  WrfDataTable,
  WrfAlert,
  WrfButton,
  WrfTooltip,
} from '../DesignSystem';
import { SlashingEventLog } from '../oracle/SlashingEventLog';
import './OracleDashboard.css';
import { devLog } from '../../utils/logger';

// Icons replaced with custom implementations
// Custom icon replacements
const SendOutlined = () => <span className="icon">&#x1f4e4;</span>;
const InfoCircleOutlined = () => <span className="icon">&#x2139;&#xfe0f;</span>;
const LoadingOutlined = () => <span className="icon">&#x26aa;</span>;
const CheckCircleOutlined = () => <span className="icon">&#x2705;</span>;
const CloseCircleOutlined = () => <span className="icon">&#x274c;</span>;
const SyncOutlined = () => <span className="icon">&#x1f504;</span>;
const ApiOutlined = () => <span className="icon">&#x1f50c;</span>;
const GlobalOutlined = () => <span className="icon">&#x1f310;</span>;
const LinkOutlined = () => <span className="icon">&#x1f517;</span>;

const OracleDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    activeValidators: 0,
    totalDataPoints: 0,
    averageAccuracy: 0,
    networkStatus: 'offline',
    crossChainBridges: 0,
    recentRequests: 0,
  });
  const [validators, setValidators] = useState([]);
  const [dataSubmissions, setDataSubmissions] = useState([]);
  const [bridgeStatus, setBridgeStatus] = useState([]);
  const { prevPage, nextPage, goToPrev, goToNext } = usePageNavigation();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch oracle network status - use relative URL paths
        const statusResponse = await axios.get('/api/oracle/status');

        // Fetch validators
        const validatorsResponse = await axios.get('/api/oracle/validators');

        // Fetch recent data submissions
        const submissionsResponse = await axios.get(
          '/api/oracle/data-submissions',
        );

        // Fetch bridge status
        const bridgeResponse = await axios.get('/api/oracle/bridges');

        // backend#909 moved every oracle route onto an envelope:
        //   single resource -> { success: true, data }
        //   list            -> { success: true, data: [...], pagination }
        // Read through unwrapEnvelope so this component works against both the
        // new and the old backend. Frontend and backend deploy independently,
        // so a hard cutover would render zeros for the length of the skew
        // window — which is the failure this change exists to prevent, not one
        // to reintroduce in the other direction.
        const status = unwrapEnvelope(statusResponse.data);
        const validatorPayload = unwrapEnvelope(validatorsResponse.data);
        const submissionPayload = unwrapEnvelope(submissionsResponse.data);
        const bridgePayload = unwrapEnvelope(bridgeResponse.data);

        const validators = asArray(validatorPayload, 'validators');
        const dataSubmissions = asArray(submissionPayload, 'submissions');
        const bridges = asArray(bridgePayload, 'bridges');

        // `activeCount` was a top-level field on the pre-envelope responses and
        // is absent from a paginated list body, so derive it from the rows
        // rather than reading a key that no longer exists.
        const activeValidators =
          validatorPayload?.activeCount ?? countActive(validators);
        const activeBridges = bridgePayload?.activeCount ?? countActive(bridges);

        // Update state with fetched data
        setStats({
          activeValidators,
          totalDataPoints: status?.totalDataPoints || 0,
          averageAccuracy: status?.averageAccuracy || 0,
          networkStatus: status?.status || 'offline',
          crossChainBridges: activeBridges,
          recentRequests: dataSubmissions.length,
        });

        setValidators(validators);
        setDataSubmissions(dataSubmissions);
        setBridgeStatus(bridges);

        // Index Oracle Network data for search functionality
        try {
          const oracleNetworkData = {
            validators,
            bridges,
            dataFeeds: dataSubmissions,
          };

          indexOracleNetwork(oracleNetworkData);
          devLog('Oracle Network data indexed for search');
        } catch (indexError) {
          console.error('Error indexing Oracle Network data:', indexError);
        }

        setError(null);
      } catch (err) {
        console.error('Error fetching Oracle Network data:', err);
        setError('Failed to load Oracle Network data. Please try again later.');

      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Refresh data every 30 seconds
    const intervalId = setInterval(fetchData, 30000);

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);


  // Table columns for validators
  const validatorColumns = [
    {
      key: 'name',
      label: 'Name',
      render: (value, row) => (
        <span>
          {value}
          <Box
            component="span"
            sx={{
              display: 'inline-block',
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: row.status === 'ACTIVE' ? 'success.main' : 'error.main',
              ml: 1,
            }}
          />
        </span>
      ),
    },
    {
      key: 'location',
      label: 'Location',
      render: (value) => <Chip label={value} color="primary" size="small" />,
    },
    {
      key: 'accuracy',
      label: 'Accuracy',
      sortable: true,
      render: (value) => (
        <WrfTooltip title={`${(value * 100).toFixed(1)}%`}>
          <Box sx={{ width: 100, display: 'inline-block' }}>
            <LinearProgress
              variant="determinate"
              value={Math.round(value * 100)}
              color={
                value >= 0.95
                  ? 'success'
                  : value >= 0.9
                    ? 'primary'
                    : 'error'
              }
              sx={{ height: 6, borderRadius: 3 }}
            />
          </Box>
        </WrfTooltip>
      ),
    },
    {
      key: 'responseTime',
      label: 'Response Time',
      sortable: true,
      render: (value) => `${value} ms`,
    },
    {
      key: 'reliability',
      label: 'Reliability',
      sortable: true,
      render: (value) => (
        <WrfTooltip title={`${(value * 100).toFixed(1)}%`}>
          <Box sx={{ width: 100, display: 'inline-block' }}>
            <LinearProgress
              variant="determinate"
              value={Math.round(value * 100)}
              color={
                value >= 0.98
                  ? 'success'
                  : value >= 0.95
                    ? 'primary'
                    : 'error'
              }
              sx={{ height: 6, borderRadius: 3 }}
            />
          </Box>
        </WrfTooltip>
      ),
    },
  ];

  // Table columns for data submissions
  const submissionColumns = [
    {
      key: 'type',
      label: 'Type',
      render: (value) => <Chip label={value} color="success" size="small" />,
    },
    {
      key: 'location',
      label: 'Location',
      render: (value) => (
        <span>
          <GlobalOutlined /> {value}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => {
        switch (value) {
        case 'verified':
          return (
            <Chip
              label="Verified"
              color="success"
              size="small"
              icon={<CheckCircleOutlined />}
            />
          );
        case 'pending':
          return (
            <Chip
              label="Pending"
              color="info"
              size="small"
              icon={<SyncOutlined />}
            />
          );
        case 'rejected':
          return (
            <Chip
              label="Rejected"
              color="error"
              size="small"
              icon={<CloseCircleOutlined />}
            />
          );
        default:
          return <Chip label={value} size="small" />;
        }
      },
    },
    {
      key: 'confidence',
      label: 'Confidence',
      render: (value) =>
        value > 0 ? `${(value * 100).toFixed(1)}%` : 'N/A',
    },
    {
      key: 'validations',
      label: 'Validations',
    },
    {
      key: 'timestamp',
      label: 'Timestamp',
      render: (value) => new Date(value).toLocaleString(),
    },
  ];

  // Table columns for bridge status
  const bridgeColumns = [
    {
      key: 'name',
      label: 'Bridge',
      render: (value) => (
        <span>
          <LinkOutlined /> {value}
        </span>
      ),
    },
    {
      key: 'network',
      label: 'Network',
      render: (value) => (
        <Chip label={value} size="small" sx={{ bgcolor: '#722ed1', color: '#fff' }} />
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => {
        return value === 'online' ? (
          <Chip
            label="Online"
            color="success"
            size="small"
            icon={<CheckCircleOutlined />}
          />
        ) : (
          <Chip
            label="Offline"
            color="error"
            size="small"
            icon={<CloseCircleOutlined />}
          />
        );
      },
    },
    {
      key: 'latency',
      label: 'Latency',
      render: (value) => (value ? `${value.toFixed(1)} sec` : 'N/A'),
    },
    {
      key: 'lastSync',
      label: 'Last Sync',
      render: (value) => {
        const date = new Date(value);
        const now = new Date();
        const diffMs = now - date;
        const diffMin = Math.round(diffMs / 60000);

        if (diffMin < 60) {
          return `${diffMin} min ago`;
        } else if (diffMin < 1440) {
          return `${Math.round(diffMin / 60)} hours ago`;
        } else {
          return `${Math.round(diffMin / 1440)} days ago`;
        }
      },
    },
  ];

  if (loading) {
    return (
      <div className="oracle-dashboard-loading">
        <CircularProgress size={40} />
        <p>Loading Oracle Network data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="oracle-dashboard oracle-dashboard-error">
        <WrfAlert severity="error" title="Oracle Network Unavailable">
          {error}
        </WrfAlert>
      </div>
    );
  }

  return (
    <div className="oracle-dashboard">
      <PageTitle
        title="Climate Data Oracle Network"
        subtitle="Monitor oracle network status and cross-chain operations"
        stats={{
          Validators: stats.activeValidators,
          'Data Points': stats.totalDataPoints.toLocaleString(),
          Status: stats.networkStatus === 'online' ? 'Online' : 'Offline',
          Accuracy: `${(stats.averageAccuracy * 100).toFixed(1)}%`,
        }}
        showNavigation={true}
        onPrev={goToPrev}
        onNext={goToNext}
        prevLabel={prevPage?.title}
        nextLabel={nextPage?.title}
      />

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <WrfStatCard
            label="Network Status"
            value={stats.networkStatus === 'online' ? 'Online' : 'Offline'}
            color={stats.networkStatus === 'online' ? '#3f8600' : '#cf1322'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <WrfStatCard
            label="Active Validators"
            value={stats.activeValidators}
            color="#1890ff"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <WrfStatCard
            label="Cross-Chain Bridges"
            value={stats.crossChainBridges}
            color="#722ed1"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <WrfStatCard
            label="Average Accuracy"
            value={`${(stats.averageAccuracy * 100).toFixed(1)}%`}
            color={stats.averageAccuracy >= 0.95 ? '#3f8600' : '#faad14'}
          />
        </Grid>
      </Grid>

      <WrfCard
        headerTitle="Validator Status"
        className="dashboard-card"
        headerAction={
          <WrfButton variant="primary" size="sm">
            Add Validator
          </WrfButton>
        }
      >
        <WrfDataTable
          data={validators}
          columns={validatorColumns}
          pageSize={5}
        />
      </WrfCard>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <WrfCard headerTitle="Recent Data Submissions" className="dashboard-card">
            <WrfDataTable
              data={dataSubmissions}
              columns={submissionColumns}
              pageSize={5}
            />
          </WrfCard>
        </Grid>
        <Grid item xs={12} md={6}>
          <WrfCard headerTitle="Cross-Chain Bridge Status" className="dashboard-card">
            <WrfDataTable
              data={bridgeStatus}
              columns={bridgeColumns}
              pageSize={5}
            />
          </WrfCard>
        </Grid>
      </Grid>

      <WrfCard headerTitle="Recent Slashing Events" className="dashboard-card">
        <SlashingEventLog compact />
      </WrfCard>
    </div>
  );
};

export default OracleDashboard;
