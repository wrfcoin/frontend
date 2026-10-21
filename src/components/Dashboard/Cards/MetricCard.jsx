import React from 'react';

const MetricCard = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  color = 'blue',
  status,
}) => {
  const getValueColor = () => {
    const colorMap = {
      blue: '#0066cc',
      green: '#2e7d32',
      orange: '#e65100',
      purple: '#6a1b9a',
      red: '#d32f2f',
      teal: '#00796b',
    };

    return colorMap[color] || '#333333';
  };

  const getStatusClass = () => {
    if (!status) return '';
    return `status-${status.toLowerCase()}`;
  };

  const getTrendClass = () => {
    if (!trend) return '';
    return trend === 'up' ? 'trend-up' : 'trend-down';
  };

  const getTrendColor = () => {
    return trend === 'up' ? '#2e7d32' : '#d32f2f';
  };

  const cardStyle = {
    background: '#fff',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '15px',
    marginRight: '15px',
    minWidth: '180px',
    minHeight: '140px',
  };

  const titleStyle = {
    fontSize: '14px',
    color: '#666',
    fontWeight: 'normal',
    margin: 0,
  };

  const valueStyle = {
    fontSize: '32px',
    fontWeight: 'bold',
    color: getValueColor(),
    margin: '10px 0',
  };

  const subtitleStyle = {
    fontSize: '13px',
    color: '#666',
    marginTop: 'auto',
  };

  const trendStyle = {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '16px',
    fontSize: '12px',
    backgroundColor:
      trend === 'up' ? 'rgba(46, 125, 50, 0.15)' : 'rgba(211, 47, 47, 0.15)',
    color: getTrendColor(),
    marginTop: '8px',
  };

  const statusStyle = {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '16px',
    fontSize: '12px',
    backgroundColor:
      status === 'Normal'
        ? 'rgba(25, 118, 210, 0.15)'
        : status === 'Latest'
          ? 'rgba(46, 125, 50, 0.15)'
          : 'rgba(25, 118, 210, 0.15)',
    color:
      status === 'Normal'
        ? '#1976d2'
        : status === 'Latest'
          ? '#2e7d32'
          : '#1976d2',
    marginTop: '8px',
  };

  return (
    <div style={cardStyle}>
      <div style={titleStyle}>{title}</div>
      <div style={valueStyle}>{value}</div>

      {trend && trendValue && <div style={trendStyle}>{trendValue}</div>}

      {status && <div style={statusStyle}>{status}</div>}

      {subtitle && <div style={subtitleStyle}>{subtitle}</div>}
    </div>
  );
};

export default MetricCard;
