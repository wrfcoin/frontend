import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {
  WrfCard,
  WrfBadge,
  WrfSelect,
  WrfSkeleton,
  WrfAlert,
  WrfEmptyState,
} from '../components/DesignSystem';
import { fetchPolicies } from '../services/governanceService';

const sectionAccentColors = {
  Rights: '#1d4ed8',
  Duties: '#7c3aed',
  Sanctions: '#b91c1c',
  Appeals: '#0369a1',
};

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Espa\u00f1ol' },
  { value: 'fr', label: 'Fran\u00e7ais' },
  { value: 'de', label: 'Deutsch' },
  { value: 'zh', label: '\u4e2d\u6587' },
  { value: 'ar', label: '\u0627\u0644\u0639\u0631\u0628\u064a\u0629' },
  { value: 'ja', label: '\u65e5\u672c\u8a9e' },
];

const sectionBadgeStatus = {
  Rights: 'info',
  Duties: 'warning',
  Sanctions: 'error',
  Appeals: 'info',
};

function MultilingualPolicyPage() {
  const [lang, setLang] = useState('en');

  const { data, isLoading, error } = useQuery({
    queryKey: ['policies', lang],
    queryFn: () => fetchPolicies(lang),
    refetchInterval: 30000,
    staleTime: 15000,
  });

  if (isLoading) {
    return (
      <Box sx={{ p: 2.5, maxWidth: 1200, mx: 'auto' }}>
        <WrfSkeleton variant="card" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2.5, maxWidth: 1200, mx: 'auto' }}>
        <WrfAlert severity="error">{error.message}</WrfAlert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2.5, maxWidth: 1200, mx: 'auto' }}>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1.5,
          mb: 0.5,
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Governance Policy Pages
        </Typography>
        <WrfSelect
          label="Language"
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          options={LANGUAGES}
          fullWidth={false}
          sx={{ minWidth: 160 }}
          aria-label="Select language"
        />
      </Box>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2.5 }}>
        Governance rights, duties, sanctions, and appeals policies. Select a
        language above to view localized content.
      </Typography>

      <Box sx={{ display: 'grid', gap: 2 }}>
        {/* Language metadata */}
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1.25,
            alignItems: 'center',
          }}
        >
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Displaying policy in:{' '}
            <strong>
              {LANGUAGES.find((l) => l.value === lang)?.label ?? lang}
            </strong>
          </Typography>
          <Typography sx={{ color: 'divider' }}>|</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Language key:{' '}
            <Typography
              component="code"
              variant="body2"
              sx={{
                bgcolor: 'action.hover',
                px: 0.75,
                borderRadius: 0.5,
                fontSize: 12,
              }}
            >
              {lang}
            </Typography>
          </Typography>
        </Box>

        {/* Policy sections */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 2,
          }}
        >
          {data.sections.map((section) => {
            const accent = sectionAccentColors[section.name] ?? '#374151';
            return (
              <WrfCard
                key={section.name}
                variant="elevated"
                sx={{ borderTop: `4px solid ${accent}` }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 1,
                  }}
                >
                  <Typography sx={{ fontWeight: 700, fontSize: 16, color: accent }}>
                    {section.name}
                  </Typography>
                  <WrfBadge label={section.version} status="neutral" />
                </Box>
                <Typography
                  variant="caption"
                  sx={{ color: 'text.disabled', mb: 1.25, display: 'block' }}
                >
                  Updated {section.updatedDate}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: 'text.primary', lineHeight: 1.6 }}
                >
                  {section.content}
                </Typography>
                {section.items && section.items.length > 0 && (
                  <Box
                    component="ul"
                    sx={{
                      mt: 1.25,
                      pl: 2.25,
                      fontSize: 13,
                      color: 'text.secondary',
                    }}
                  >
                    {section.items.map((item, idx) => (
                      <li key={idx} style={{ marginBottom: 4 }}>
                        {item}
                      </li>
                    ))}
                  </Box>
                )}
              </WrfCard>
            );
          })}
        </Box>

        {/* Changelog */}
        <WrfCard headerTitle="Recent Policy Updates">
          {data.changeLog && data.changeLog.length > 0 ? (
            <Box sx={{ display: 'grid', gap: 1.25 }}>
              {data.changeLog.map((entry, idx) => (
                <Box
                  key={idx}
                  sx={{
                    display: 'flex',
                    gap: 1.75,
                    alignItems: 'flex-start',
                    pb: 1.25,
                    borderBottom:
                      idx < data.changeLog.length - 1
                        ? '1px solid'
                        : 'none',
                    borderColor: 'divider',
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      minWidth: 80,
                      color: 'text.disabled',
                      fontWeight: 600,
                      pt: 0.25,
                    }}
                  >
                    {entry.date}
                  </Typography>
                  <Box sx={{ flex: 1 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        mb: 0.375,
                      }}
                    >
                      <WrfBadge
                        label={entry.section}
                        status={sectionBadgeStatus[entry.section] ?? 'neutral'}
                      />
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {entry.version}
                      </Typography>
                    </Box>
                    <Typography variant="body2">{entry.summary}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          ) : (
            <WrfEmptyState
              variant="no-data"
              title="No recent changes"
              description="No recent policy changes."
            />
          )}
        </WrfCard>
      </Box>
    </Box>
  );
}

export default MultilingualPolicyPage;
