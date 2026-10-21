/**
 * PortfolioInsights Component (Placeholder)
 *
 * Phase 2 component - Portfolio analytics and charts.
 * Will include: Performance chart, allocation breakdown, gas spending analysis.
 */

import React from 'react';
import { BarChart2, PieChart, TrendingUp } from 'lucide-react';

const PortfolioInsights = () => {
  return (
    <div className="wallet-card portfolio-insights">
      <div className="placeholder-content">
        <div className="placeholder-icon">
          <BarChart2 size={40} />
        </div>
        <h3>Portfolio Insights</h3>
        <p>Performance charts and analytics coming in Phase 2</p>
        <div className="placeholder-features">
          <span><TrendingUp size={14} /> Performance Tracking</span>
          <span><PieChart size={14} /> Allocation Breakdown</span>
          <span><BarChart2 size={14} /> Gas Analysis</span>
        </div>
      </div>
      <style>{`
        .portfolio-insights {
          min-height: 200px;
        }
        .placeholder-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 40px 20px;
          text-align: center;
        }
        .placeholder-icon {
          width: 72px;
          height: 72px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 16px;
          background: color-mix(in srgb, var(--accent-primary, #3B82F6) 15%, transparent);
          color: var(--accent-primary, #3B82F6);
        }
        .placeholder-content h3 {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--text-primary, #F8FAFC);
          margin: 0;
        }
        .placeholder-content p {
          font-size: 0.875rem;
          color: var(--text-muted, #64748B);
          margin: 0;
        }
        .placeholder-features {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          justify-content: center;
          margin-top: 8px;
        }
        .placeholder-features span {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          color: var(--text-secondary, #94A3B8);
        }
      `}</style>
    </div>
  );
};

export default PortfolioInsights;
