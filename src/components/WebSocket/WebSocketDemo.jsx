/**
 * WebSocket Demo Component
 * Demonstrates the animated status indicator functionality
 */

import React, { useState, useEffect } from 'react';
import WebSocketStatusIndicator from './WebSocketStatusIndicator';
import { getWebSocketClient } from '../../services/websocketService';
import useWebSocketStatus from '../../hooks/useWebSocketStatus';

const WebSocketDemo = () => {
  const [wsClient, setWsClient] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const status = useWebSocketStatus(wsClient);

  useEffect(() => {
    // Initialize WebSocket client
    const client = getWebSocketClient({ url: import.meta.env.VITE_WEBSOCKET_URL || '' });
    setWsClient(client);

    // Listen for messages
    const handleMessage = data => {
      setMessages(prev => [
        ...prev.slice(-9),
        {
          id: Date.now(),
          data,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    };

    client.on('message', handleMessage);

    return () => {
      client.off('message', handleMessage);
    };
  }, []);

  const sendMessage = () => {
    if (wsClient && messageInput.trim()) {
      wsClient.send({
        type: 'demo_message',
        content: messageInput,
        timestamp: new Date().toISOString(),
      });
      setMessageInput('');
    }
  };

  const simulateDisconnect = () => {
    if (wsClient) {
      wsClient.disconnect();
    }
  };

  const reconnect = () => {
    if (wsClient) {
      wsClient.connect(import.meta.env.VITE_WEBSOCKET_URL || '').catch(console.error);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>WebSocket Status Indicator Demo</h2>

      {/* Status Indicators in different positions */}
      <div
        style={{
          position: 'relative',
          height: '300px',
          border: '1px solid #ddd',
          borderRadius: '8px',
          marginBottom: '20px',
        }}
      >
        <WebSocketStatusIndicator
          wsClient={wsClient}
          position="top-right"
          showDetails={true}
          autoHide={false}
        />

        <WebSocketStatusIndicator
          wsClient={wsClient}
          position="top-left"
          showDetails={false}
          autoHide={true}
        />

        <WebSocketStatusIndicator
          wsClient={wsClient}
          position="bottom-right"
          showDetails={true}
          autoHide={false}
        />

        <div
          style={{ padding: '20px', textAlign: 'center', paddingTop: '100px' }}
        >
          <h3>Status Indicators Demo Area</h3>
          <p>Check the corners for different indicator configurations</p>
        </div>
      </div>

      {/* Connection Controls */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Connection Controls</h3>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <button
            onClick={reconnect}
            disabled={status.isConnected}
            style={{
              padding: '8px 16px',
              backgroundColor: status.isConnected ? '#ccc' : '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: status.isConnected ? 'not-allowed' : 'pointer',
            }}
          >
            Connect
          </button>

          <button
            onClick={simulateDisconnect}
            disabled={!status.isConnected}
            style={{
              padding: '8px 16px',
              backgroundColor: !status.isConnected ? '#ccc' : '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: !status.isConnected ? 'not-allowed' : 'pointer',
            }}
          >
            Disconnect
          </button>
        </div>

        <div style={{ fontSize: '14px', color: '#666' }}>
          <strong>Status:</strong> {status.status} |<strong> Messages:</strong>{' '}
          {status.messageCount} |<strong> Uptime:</strong> {status.uptime}s
          {status.retryAttempt > 0 && (
            <span>
              {' '}
              | <strong>Retry:</strong> {status.retryAttempt}
            </span>
          )}
        </div>
      </div>

      {/* Message Testing */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Message Testing</h3>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <input
            type="text"
            value={messageInput}
            onChange={e => setMessageInput(e.target.value)}
            placeholder="Enter test message..."
            style={{
              flex: 1,
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
            }}
            onKeyPress={e => e.key === 'Enter' && sendMessage()}
          />
          <button
            onClick={sendMessage}
            disabled={!status.isConnected || !messageInput.trim()}
            style={{
              padding: '8px 16px',
              backgroundColor:
                !status.isConnected || !messageInput.trim()
                  ? '#ccc'
                  : '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor:
                !status.isConnected || !messageInput.trim()
                  ? 'not-allowed'
                  : 'pointer',
            }}
          >
            Send
          </button>
        </div>
      </div>

      {/* Message Log */}
      <div>
        <h3>Recent Messages</h3>
        <div
          style={{
            height: '200px',
            overflow: 'auto',
            border: '1px solid #ddd',
            borderRadius: '4px',
            padding: '10px',
            backgroundColor: '#f9f9f9',
            fontFamily: 'monospace',
            fontSize: '12px',
          }}
        >
          {messages.length === 0 ? (
            <div
              style={{ color: '#666', textAlign: 'center', paddingTop: '80px' }}
            >
              No messages yet. Send a message to test the indicator!
            </div>
          ) : (
            messages.map(msg => (
              <div key={msg.id} style={{ marginBottom: '5px' }}>
                <span style={{ color: '#666' }}>[{msg.timestamp}]</span>{' '}
                <span>{JSON.stringify(msg.data)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default WebSocketDemo;
