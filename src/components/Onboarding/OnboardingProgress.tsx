import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
  labels?: string[];
}

const OnboardingProgress: React.FC<OnboardingProgressProps> = ({
  currentStep,
  totalSteps,
  labels,
}) => {
  const theme = useTheme();

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
      {Array.from({ length: totalSteps }, (_, i) => {
        const isComplete = i < currentStep;
        const isActive = i === currentStep;
        return (
          <React.Fragment key={i}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 14,
                  transition: 'all 0.3s ease',
                  ...(isComplete
                    ? {
                      background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
                      color: '#fff',
                    }
                    : isActive
                      ? {
                        background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                        color: '#fff',
                        boxShadow: '0 0 12px rgba(245,158,11,0.5)',
                      }
                      : {
                        backgroundColor: '#334155',
                        color: '#94a3b8',
                      }),
                }}
              >
                {isComplete ? '\u2713' : i + 1}
              </Box>
              {labels && labels[i] && (
                <Typography
                  variant="caption"
                  sx={{
                    mt: 0.5,
                    color: isActive ? '#f8fafc' : '#94a3b8',
                    fontWeight: isActive ? 600 : 400,
                    textAlign: 'center',
                    lineHeight: 1.2,
                    fontSize: 11,
                  }}
                >
                  {labels[i]}
                </Typography>
              )}
            </Box>
            {i < totalSteps - 1 && (
              <Box
                sx={{
                  flex: 2,
                  height: 2,
                  borderRadius: 1,
                  transition: 'background 0.3s ease',
                  background: isComplete
                    ? 'linear-gradient(90deg, #38bdf8, #818cf8)'
                    : '#334155',
                  mb: labels ? 2.5 : 0,
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </Box>
  );
};

export default OnboardingProgress;
