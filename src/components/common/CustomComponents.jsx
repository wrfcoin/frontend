import React from 'react';
import { devLog } from '../../utils/logger';

/**
 * Custom UI Components
 * Lightweight replacements for Ant Design components
 */

// Layout Components
export const Card = ({ children, title, ...props }) => (
  <div className="custom-card" {...props}>
    {title && <div className="custom-card-header">{title}</div>}
    <div className="custom-card-body">{children}</div>
  </div>
);

export const Button = ({
  children,
  type,
  icon,
  onClick,
  disabled,
  ...props
}) => (
  <button
    className={`custom-button custom-button-${type || 'default'} ${disabled ? 'disabled' : ''}`}
    onClick={disabled ? null : onClick}
    disabled={disabled}
    {...props}
  >
    {icon && <span className="button-icon">{icon}</span>}
    {children}
  </button>
);

export const Select = ({
  value,
  onChange,
  children,
  placeholder,
  ...props
}) => (
  <select
    className="custom-select"
    value={value}
    onChange={onChange}
    {...props}
  >
    {placeholder && <option value="">{placeholder}</option>}
    {children}
  </select>
);

export const Option = ({ value, children, ...props }) => (
  <option value={value} {...props}>
    {children}
  </option>
);

export const Input = ({ value, onChange, placeholder, ...props }) => (
  <input
    className="custom-input"
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    {...props}
  />
);

export const TextArea = ({
  value,
  onChange,
  rows = 4,
  placeholder,
  ...props
}) => (
  <textarea
    className="custom-textarea"
    value={value}
    onChange={onChange}
    rows={rows}
    placeholder={placeholder}
    {...props}
  />
);

// Typography Components
export const Typography = ({ children, ...props }) => (
  <div className="custom-typography" {...props}>
    {children}
  </div>
);

Typography.Title = ({ level = 1, children, ...props }) => {
  const Tag = `h${level}`;
  return (
    <Tag className={`custom-title custom-title-${level}`} {...props}>
      {children}
    </Tag>
  );
};

Typography.Text = ({ children, type, strong, ...props }) => (
  <span
    className={`custom-text ${type ? `custom-text-${type}` : ''} ${strong ? 'custom-text-strong' : ''}`}
    {...props}
  >
    {children}
  </span>
);

Typography.Paragraph = ({ children, ...props }) => (
  <p className="custom-paragraph" {...props}>
    {children}
  </p>
);

// Layout Components
export const Row = ({ children, gutter, ...props }) => (
  <div
    className="custom-row"
    style={{ gap: gutter ? `${gutter}px` : '0' }}
    {...props}
  >
    {children}
  </div>
);

export const Col = ({ children, span, ...props }) => (
  <div
    className="custom-col"
    style={{ flex: span ? `${span}/24` : '1' }}
    {...props}
  >
    {children}
  </div>
);

export const Space = ({
  children,
  direction = 'horizontal',
  size = 'small',
  ...props
}) => (
  <div
    className={`custom-space custom-space-${direction} custom-space-${size}`}
    {...props}
  >
    {children}
  </div>
);

// Feedback Components
export const Alert = ({ message, type, showIcon, closable, ...props }) => (
  <div className={`custom-alert custom-alert-${type || 'info'}`} {...props}>
    {showIcon && <span className="alert-icon">ℹ</span>}
    <span className="alert-message">{message}</span>
    {closable && <button className="alert-close">×</button>}
  </div>
);

export const Tag = ({ children, color, ...props }) => (
  <span className={`custom-tag custom-tag-${color || 'default'}`} {...props}>
    {children}
  </span>
);

// Form Components
export const Form = ({ children, onFinish, ...props }) => (
  <form className="custom-form" onSubmit={onFinish} {...props}>
    {children}
  </form>
);

export const FormItem = ({ label, children, ...props }) => (
  <div className="custom-form-item" {...props}>
    {label && <label className="custom-form-label">{label}</label>}
    <div className="custom-form-control">{children}</div>
  </div>
);

// Data Display Components
export const List = ({ dataSource, renderItem, ...props }) => (
  <ul className="custom-list" {...props}>
    {dataSource?.map((item, index) => (
      <li key={index} className="custom-list-item">
        {renderItem(item, index)}
      </li>
    ))}
  </ul>
);

export const Table = ({ dataSource = [], columns = [], ...props }) => (
  <div className="custom-table" {...props}>
    <table>
      <thead>
        <tr>
          {columns.map((col, idx) => (
            <th key={idx}>{col.title}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {dataSource.map((row, idx) => (
          <tr key={idx}>
            {columns.map((col, colIdx) => (
              <td key={colIdx}>
                {col.render
                  ? col.render(row[col.dataIndex], row)
                  : row[col.dataIndex]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// Utility Components
export const Divider = ({ type = 'horizontal', ...props }) => (
  <hr className={`custom-divider custom-divider-${type}`} {...props} />
);

export const Spin = ({ spinning, children, ...props }) => (
  <div className={`custom-spin ${spinning ? 'spinning' : ''}`} {...props}>
    {spinning && <div className="custom-spin-indicator">⚪</div>}
    <div className={spinning ? 'custom-spin-content' : ''}>{children}</div>
  </div>
);

// Message API replacement
// Checkbox Component
const CheckboxBase = ({ checked, onChange, children, ...props }) => (
  <label className="custom-checkbox" {...props}>
    <input type="checkbox" checked={checked} onChange={onChange} />
    <span className="checkbox-mark"></span>
    {children && <span className="checkbox-label">{children}</span>}
  </label>
);

// Checkbox.Group component for multiple checkbox options
const CheckboxGroup = ({ options = [], value = [], onChange, ...props }) => {
  const handleChange = (optionValue) => {
    const newValue = value.includes(optionValue)
      ? value.filter(v => v !== optionValue)
      : [...value, optionValue];
    onChange?.(newValue);
  };

  return (
    <div className="custom-checkbox-group" {...props}>
      {options.map((option) => (
        <CheckboxBase
          key={option.value}
          checked={value.includes(option.value)}
          onChange={() => handleChange(option.value)}
          disabled={option.disabled}
        >
          {option.label}
        </CheckboxBase>
      ))}
    </div>
  );
};

export const Checkbox = Object.assign(CheckboxBase, { Group: CheckboxGroup });

// Statistic Component
export const Statistic = ({ title, value, prefix, suffix, ...props }) => (
  <div className="custom-statistic" {...props}>
    <div className="statistic-title">{title}</div>
    <div className="statistic-value">
      {prefix}
      {value}
      {suffix}
    </div>
  </div>
);

// Badge Component
export const Badge = ({ children, count, ...props }) => (
  <span className="custom-badge" {...props}>
    {children}
    {count && <span className="badge-count">{count}</span>}
  </span>
);

// Tooltip Component
export const Tooltip = ({ title, children, ...props }) => (
  <div className="custom-tooltip" title={title} {...props}>
    {children}
  </div>
);

// Progress Component
export const Progress = ({ percent, ...props }) => (
  <div className="custom-progress" {...props}>
    <div className="progress-bar" style={{ width: `${percent}%` }}></div>
    <span className="progress-text">{percent}%</span>
  </div>
);

// Layout Component
export const Layout = ({ children, ...props }) => (
  <div className="custom-layout" {...props}>
    {children}
  </div>
);

Layout.Header = ({ children, ...props }) => (
  <header className="custom-layout-header" {...props}>
    {children}
  </header>
);

Layout.Content = ({ children, ...props }) => (
  <main className="custom-layout-content" {...props}>
    {children}
  </main>
);

Layout.Footer = ({ children, ...props }) => (
  <footer className="custom-layout-footer" {...props}>
    {children}
  </footer>
);

Layout.Sider = ({ children, ...props }) => (
  <aside className="custom-layout-sider" {...props}>
    {children}
  </aside>
);

export const message = {
  success: content => devLog('✅', content),
  error: content => console.error('❌', content),
  warning: content => console.warn('⚠️', content),
  info: content => console.info('ℹ️', content),
};

export const notification = {
  success: ({ message, description }) => devLog('✅', message, description),
  error: ({ message, description }) => console.error('❌', message, description),
  warning: ({ message, description }) => console.warn('⚠️', message, description),
  info: ({ message, description }) => console.info('ℹ️', message, description),
};

export const Tabs = ({ children, defaultActiveKey, onChange, ...props }) => {
  const [activeKey, setActiveKey] = React.useState(defaultActiveKey || '1');
  const handleChange = (key) => {
    setActiveKey(key);
    onChange?.(key);
  };
  return (
    <div className="custom-tabs" {...props}>
      {React.Children.map(children, (child) =>
        React.cloneElement(child, { activeKey, onChange: handleChange }),
      )}
    </div>
  );
};

Tabs.TabPane = ({ children, tab, key, activeKey, ...props }) => (
  <div
    className="custom-tab-pane"
    style={{ display: activeKey === key ? 'block' : 'none' }}
    {...props}
  >
    {children}
  </div>
);

export const Modal = ({ visible, open, title, onOk, onCancel, children, ...props }) => {
  const isOpen = visible || open;
  if (!isOpen) return null;
  return (
    <div className="custom-modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }}>
      <div className="custom-modal" style={{
        background: '#1a1a2e', borderRadius: '12px', padding: '24px', minWidth: '400px', maxWidth: '80%', color: '#fff',
      }} {...props}>
        {title && <h3 style={{ margin: '0 0 16px 0' }}>{title}</h3>}
        <div className="custom-modal-content">{children}</div>
        <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ padding: '8px 16px', background: '#333', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer' }}>Cancel</button>
          <button onClick={onOk} style={{ padding: '8px 16px', background: '#3498db', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer' }}>OK</button>
        </div>
      </div>
    </div>
  );
};
