import React, { useState, useEffect } from 'react';
import { Activity, CheckCircle, Clock } from 'lucide-react';
import { retryDynamicImport } from '../../utils/retryDynamicImport.js';
import { getWebSocketClient } from '../../services/websocketService';
import { FEATURES } from '../../config/features';
import './ProgressiveLoader.css';

// GET /api/stats is not on the public edge allowlist (it 404s there), so the
// public build (full studio off) has no backend probe to show: the step is
// left out rather than reported as a warning or a success it never measured.
const PROBE_BACKEND = FEATURES.fullStudio;

const fetchWithTimeout = async (url, options = {}, timeoutMs = 1000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
};

const ProgressiveLoader = ({ onComplete }) => {
  const [loadingSteps, setLoadingSteps] = useState(() => [
    { id: 'ui', name: 'User Interface', status: 'loading', progress: 0 },
    ...(PROBE_BACKEND
      ? [{ id: 'backend', name: 'Backend Services', status: 'pending', progress: 0 }]
      : []),
    {
      id: 'websocket',
      name: 'Real-time Connection',
      status: 'pending',
      progress: 0,
    },
    { id: 'services', name: 'Core Services', status: 'pending', progress: 0 },
  ]);

  const [currentStep, setCurrentStep] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);

  useEffect(() => {
    let isCancelled = false;
    const timeoutIds = [];
    const delay = milliseconds =>
      new Promise(resolve => {
        const timeoutId = setTimeout(resolve, milliseconds);
        timeoutIds.push(timeoutId);
      });

    const initializeSteps = async () => {
      // Step 1: UI Ready (immediate)
      updateStepProgress('ui', 'completed', 100);
      setCurrentStep(1);

      // Small delay to show progress
      await delay(200);
      if (isCancelled) return;

      // Step 2: Backend Services (quick health check) — internal builds only.
      if (PROBE_BACKEND) {
        updateStepProgress('backend', 'loading', 0);
        try {
          // Quick health check instead of full initialization
          const response = await fetchWithTimeout('/api/stats', {
            method: 'GET',
          });
          if (isCancelled) return;
          updateStepProgress(
            'backend',
            response.ok ? 'completed' : 'warning',
            100,
          );
        } catch (error) {
          if (isCancelled) return;
          updateStepProgress('backend', 'warning', 100);
        }
        if (isCancelled) return;
        setCurrentStep(2);

        await delay(100);
        if (isCancelled) return;
      }

      // Step 3: WebSocket (statically imported; initialize here after UI is ready)
      updateStepProgress('websocket', 'loading', 0);
      try {
        const wsClient = getWebSocketClient({
          url: import.meta.env.VITE_WEBSOCKET_URL || '',
          channels: ['blocks'],
          autoReconnect: true,
          maxReconnectAttempts: 3,
          timeout: 2000,
        });
        window._wsClient = wsClient;
        if (isCancelled) return;
        updateStepProgress('websocket', 'completed', 100);
      } catch (error) {
        if (isCancelled) return;
        updateStepProgress('websocket', 'warning', 100);
      }
      setCurrentStep(3);

      await delay(100);
      if (isCancelled) return;

      // Step 4: Core Services (lazy loading)
      updateStepProgress('services', 'loading', 0);
      try {
        const module = await retryDynamicImport(
          () => import('../../services/PerformanceOptimizer'),
          {
            retries: 2,
            retryDelayMs: 250,
          },
        );
        if (isCancelled) return;
        module.default.initialize();
        updateStepProgress('services', 'completed', 100);
      } catch (error) {
        if (isCancelled) return;
        updateStepProgress('services', 'warning', 100);
      }
      setCurrentStep(4);

      // Complete loading
      const completeTimeoutId = setTimeout(() => {
        if (!isCancelled) {
          onComplete();
        }
      }, 200);
      timeoutIds.push(completeTimeoutId);
    };

    initializeSteps();

    return () => {
      isCancelled = true;
      timeoutIds.forEach(timeoutId => clearTimeout(timeoutId));
    };
  }, [onComplete]);

  const updateStepProgress = (stepId, status, progress) => {
    setLoadingSteps(prev => {
      const nextSteps = prev.map(step =>
        step.id === stepId ? { ...step, status, progress } : step,
      );

      const completed = nextSteps.filter(s => s.status === 'completed').length;
      const total = nextSteps.length;
      setOverallProgress(Math.round((completed / total) * 100));

      return nextSteps;
    });
  };

  const getStepIcon = step => {
    switch (step.status) {
    case 'completed':
      return <CheckCircle className="text-green-500" size={20} />;
    case 'loading':
      return <Activity className="text-blue-500 animate-spin" size={20} />;
    case 'warning':
      return <Clock className="text-yellow-500" size={20} />;
    default:
      return (
        <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
      );
    }
  };

  return (
    <div className="progressive-loader">
      <div className="loader-container">
        <div className="loader-header">
          <h2>Starting Wrfcoin Platform</h2>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <span className="progress-text">{overallProgress}%</span>
        </div>

        <div className="loading-steps">
          {loadingSteps.map((step, index) => (
            <div
              key={step.id}
              className={`loading-step ${step.status} ${index <= currentStep ? 'active' : ''}`}
            >
              <div className="step-icon">{getStepIcon(step)}</div>
              <div className="step-content">
                <span className="step-name">{step.name}</span>
                <div className="step-progress">
                  <div
                    className="step-progress-fill"
                    style={{ width: `${step.progress}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="loader-footer">
          <p>Optimizing for faster loading...</p>
        </div>
      </div>
    </div>
  );
};

export default ProgressiveLoader;
