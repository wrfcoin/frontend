/**
 * WebSocket Demo Menu Link Component
 * Adds the WebSocket demo to the navigation menu
 */

import React from 'react';
import { Link } from 'react-router';

const WebSocketMenuLink = ({ isActive = () => false, toggleExpandMenu = () => {} }) => {
  return (
    <div className="menu-item">
      <Link
        to="/websocket-demo"
        className={`menu-link ${isActive('/websocket-demo') ? 'active' : ''}`}
        onClick={() => toggleExpandMenu(null)}
      >
        <i className="bi bi-broadcast"></i>
        <span>WebSocket Demo</span>
      </Link>
    </div>
  );
};

export default WebSocketMenuLink;
