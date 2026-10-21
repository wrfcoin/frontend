import React, { useState, useEffect } from 'react';

/**
 * WebSocketNotification Component
 * Displays real-time notifications from WebSocket events
 */
const WebSocketNotification = ({ notifications = [], onClear }) => {
  const [visible, setVisible] = useState([]);

  useEffect(() => {
    // When new notifications arrive, add them to the visible list
    if (notifications && notifications.length > 0) {
      const newNotification = notifications[notifications.length - 1];
      setVisible(prev => [...prev, newNotification]);

      // Auto-remove notifications after 5 seconds
      setTimeout(() => {
        setVisible(prev => prev.filter(n => n.id !== newNotification.id));
      }, 5000);
    }
  }, [notifications]);

  if (visible.length === 0) {
    return null;
  }

  const getIconForType = type => {
    switch (type) {
    case 'TRANSACTION_CREATED':
      return '💸';
    case 'BRIDGE_TRANSACTION_UPDATED':
      return '🌉';
    case 'BLOCK_MINED':
      return '⛏️';
    case 'STATE_UPDATE':
      return '📊';
    case 'NFT_MINTED':
      return '🖼️';
    case 'CONNECTION_ESTABLISHED':
      return '🔌';
    default:
      return '📡';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md w-full">
      {visible.map(notification => (
        <div
          key={notification.id}
          className="bg-white shadow-lg rounded-lg p-4 mb-2 border-l-4 border-blue-500 animate-slide-in-right flex items-start"
        >
          <div className="text-xl mr-3">
            {getIconForType(notification.type)}
          </div>
          <div className="flex-1">
            <div className="font-bold text-gray-900">{notification.title}</div>
            <div className="text-sm text-gray-700">{notification.message}</div>
            <div className="text-xs text-gray-500 mt-1">
              {new Date(notification.timestamp).toLocaleTimeString()}
            </div>
          </div>
          <button
            onClick={() =>
              setVisible(prev => prev.filter(n => n.id !== notification.id))
            }
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
      ))}
      {visible.length > 1 && (
        <button
          onClick={() => setVisible([])}
          className="text-sm text-blue-600 hover:text-blue-800 float-right mt-1"
        >
          Clear all
        </button>
      )}
    </div>
  );
};

export default WebSocketNotification;
