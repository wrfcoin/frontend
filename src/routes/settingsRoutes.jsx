import React from 'react';
import { Route } from 'react-router-dom';
import lazy from './lazyImport';
import PageWrapper from '../components/common/PageWrapper';
import FEATURES from '../config/features';

const Settings = lazy(() => import('../components/Settings/Settings'));
const UserPreferencesPage = lazy(() => import('../components/Settings/UserPreferencesPage'));
const PrivacyPage = lazy(() => import('../components/Settings/PrivacyPage'));
const NetworkPage = lazy(() => import('../components/Settings/NetworkPage'));
const SecurityPage = lazy(() => import('../components/Settings/SecurityPage'));
const IntegrationsPage = lazy(() => import('../components/Settings/IntegrationsPage'));
const ModuleController = lazy(() => import('../components/Settings/ModuleController'));
const NotificationPreferences = lazy(() => import('../components/Notifications/NotificationPreferences'));
const PushSetup = lazy(() => import('../components/Notifications/PushSetup'));
const AccessibilitySettings = lazy(() => import('../components/AccessibilityHub'));
const KeyboardShortcutsOverlay = lazy(() => import('../components/AccessibilityHub/KeyboardShortcutsOverlay'));
const ScreenReaderHelper = lazy(() => import('../components/AccessibilityHub/ScreenReaderHelper'));
const LanguageSwitcher = lazy(() => import('../components/I18n'));
const TranslationManager = lazy(() => import('../components/I18n/TranslationManager'));
const ExportDashboard = lazy(() => import('../components/ExportManager'));
const ReportTemplateSelector = lazy(() => import('../components/ExportManager/ReportTemplateSelector'));
const ScheduledExports = lazy(() => import('../components/ExportManager/ScheduledExports'));

export default function settingsRoutes({ isFeatureEnabled = () => false } = {}) {
  return <>
    {/* Core Settings */}
    <Route path="/settings" element={<PageWrapper tabType="settings"><Settings /></PageWrapper>} />
    <Route path="/settings/preferences" element={<PageWrapper tabType="settings"><UserPreferencesPage /></PageWrapper>} />
    <Route path="/settings/privacy" element={<PageWrapper tabType="settings"><PrivacyPage /></PageWrapper>} />
    <Route path="/settings/network" element={<PageWrapper tabType="settings"><NetworkPage /></PageWrapper>} />
    <Route path="/settings/security" element={<PageWrapper tabType="settings"><SecurityPage /></PageWrapper>} />
    <Route path="/settings/integrations" element={<PageWrapper tabType="settings"><IntegrationsPage /></PageWrapper>} />
    <Route path="/settings/modules" element={<PageWrapper tabType="settings"><ModuleController /></PageWrapper>} />

    {/* Notifications */}
    {isFeatureEnabled('notifications') && <>
      <Route path="/notifications/preferences" element={<PageWrapper tabType="settings"><NotificationPreferences /></PageWrapper>} />
      <Route path="/notifications/push-setup" element={<PageWrapper tabType="settings"><PushSetup /></PageWrapper>} />
    </>}

    {/* Accessibility */}
    {FEATURES.accessibilityHub && <>
      <Route path="/accessibility" element={<PageWrapper tabType="settings"><AccessibilitySettings /></PageWrapper>} />
      <Route path="/accessibility/shortcuts" element={<PageWrapper tabType="settings"><KeyboardShortcutsOverlay /></PageWrapper>} />
      <Route path="/accessibility/screen-reader" element={<PageWrapper tabType="settings"><ScreenReaderHelper /></PageWrapper>} />
    </>}

    {/* I18n */}
    {FEATURES.i18n && <>
      <Route path="/language" element={<PageWrapper tabType="settings"><LanguageSwitcher /></PageWrapper>} />
      <Route path="/language/translations" element={<PageWrapper tabType="settings"><TranslationManager /></PageWrapper>} />
    </>}

    {/* Export Manager */}
    {FEATURES.exportManager && <>
      <Route path="/exports" element={<PageWrapper tabType="settings"><ExportDashboard /></PageWrapper>} />
      <Route path="/exports/templates" element={<PageWrapper tabType="settings"><ReportTemplateSelector /></PageWrapper>} />
      <Route path="/exports/scheduled" element={<PageWrapper tabType="settings"><ScheduledExports /></PageWrapper>} />
    </>}
  </>;
}
