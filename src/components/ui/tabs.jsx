// UI Stub - Tabs components
import React, { createContext, useContext, useState } from 'react';

const TabsContext = createContext({ value: '', setValue: () => {} });

export const Tabs = ({ children, defaultValue, value, onValueChange, className = '', ...props }) => {
  const [internalValue, setInternalValue] = useState(defaultValue || '');
  const currentValue = value !== undefined ? value : internalValue;
  const handleChange = (newValue) => {
    if (onValueChange) {
      onValueChange(newValue);
    } else {
      setInternalValue(newValue);
    }
  };

  return (
    <TabsContext.Provider value={{ value: currentValue, setValue: handleChange }}>
      <div className={`tabs ${className}`} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

export const TabsList = ({ children, className = '', ...props }) => (
  <div
    className={`tabs-list ${className}`}
    style={{
      display: 'flex',
      gap: '4px',
      background: '#1a1a2e',
      padding: '4px',
      borderRadius: '8px',
      marginBottom: '16px',
    }}
    {...props}
  >
    {children}
  </div>
);

export const TabsTrigger = ({ children, value, className = '', ...props }) => {
  const { value: currentValue, setValue } = useContext(TabsContext);
  const isActive = currentValue === value;

  return (
    <button
      className={`tabs-trigger ${className}`}
      onClick={() => setValue(value)}
      style={{
        padding: '8px 16px',
        background: isActive ? '#3498db' : 'transparent',
        border: 'none',
        borderRadius: '6px',
        color: isActive ? '#fff' : '#888',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: isActive ? '500' : '400',
      }}
      {...props}
    >
      {children}
    </button>
  );
};

export const TabsContent = ({ children, value, className = '', ...props }) => {
  const { value: currentValue } = useContext(TabsContext);
  if (currentValue !== value) return null;

  return (
    <div className={`tabs-content ${className}`} {...props}>
      {children}
    </div>
  );
};
