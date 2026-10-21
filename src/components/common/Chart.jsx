// Stub Chart component for forgotten UI components
import React from 'react';

const Chart = ({ data = [], type = 'line', height = 200, ...props }) => {
  return (
    <div
      style={{
        height,
        background: '#1a1a2e',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#666',
        fontSize: '14px',
        border: '1px dashed #333',
      }}
      {...props}
    >
      Chart Component ({type}) - {data.length} data points
    </div>
  );
};

export default Chart;
