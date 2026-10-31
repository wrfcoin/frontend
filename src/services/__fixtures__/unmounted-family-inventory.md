# Unmounted API-family inventory (Round 8)

Frontend main `32cc1d5e683e488a4dcfe600aa9feb04a5a4c27e`; backend main `090d9797447f82ab2e4713ea5bf800e52c260994`. The backend mount generator reports 60 concrete families. The conservative frontend scan reports **86 absent names**, rather than twenty literal families. This is a source inventory, not a claim that every listed string is a backend request: nested bases create names such as `attest`/`submit` under `pop`, `networks` under `cross-chain`, and `audit` under `hsm`; external messaging APIs also appear. Relative service-client fallback paths require separate inspection.

Import reachability below comes from the production fabrication walker. An import is not proof of a mounted UI, and a gate mention is not proof of containment. Capability-protected routes, provider overrides and mixed gates require runtime controls. No deployed/runtime or self-hosted runner evidence is claimed. Backend source was read only through fresh main Git objects; no host calls.

Identity credential reads and writes contained fabricated fallback records and local success mutations despite an absent backend family. The accompanying family change removes those substitutions and reports unavailable. The remaining rows are an ordered follow-up inventory, not marked completed by this table. Known next checks: activity feed (404 silently means empty); unused MEV and validator adapters; social multiplier (404 substitutes 1.0); unsupported integration/settings callers and sample-gated domains. Referrals and DeFi retirement have already landed; cross-chain is mounted and its nested names must not be retired as absent families.

| Raw absent name | Source and import classification |
| --- | --- |
| activity | `src/components/RealTime/ActivityFeed.jsx` (reachable import; inspect caller) |
| acurite | `src/components/environmental/AcuRiteWeatherSubmission.jsx` (not in route import graph) |
| address | `src/config/network.ts` (reachable import; inspect caller) |
| ai-marketplace | `src/components/AIMarketplace/AIMarketplace.jsx` (reachable import; inspect caller)<br>`src/components/AIMarketplace/ModelDeploy.jsx` (contains sample gate; inspect live body)<br>`src/components/AIMarketplace/ModelDetail.jsx` (reviewed mixed gate; inspect live body) |
| ai-plugins | `src/components/Integrations/AIIntegrationsHub.jsx` (contains sample gate; inspect live body)<br>`src/components/Integrations/AnthropicCard.jsx` (only behind recognized sample gate)<br>`src/components/Integrations/GeminiCard.jsx` (only behind recognized sample gate)<br>`src/components/Integrations/HuggingFaceCard.jsx` (only behind recognized sample gate)<br>`src/components/Integrations/LocalModelCard.jsx` (only behind recognized sample gate)<br>`src/components/Integrations/ModelContextCard.jsx` (only behind recognized sample gate)<br>`src/components/Integrations/OpenAICard.jsx` (only behind recognized sample gate)<br>`src/components/Integrations/PerplexityCard.jsx` (only behind recognized sample gate)<br>`src/components/Integrations/XAICard.jsx` (only behind recognized sample gate) |
| analyze | `src/services/mevProtectionService.js` (not in route import graph) |
| api | `src/components/Settings/ComputeContributionPage.jsx` (reachable import; inspect caller)<br>`src/hooks/useActiveAlerts.ts` (reachable import; inspect caller)<br>`src/hooks/useExecuteRemediation.ts` (reachable import; inspect caller)<br>`src/hooks/useP2PSyncStatus.ts` (reachable import; inspect caller)<br>`src/hooks/useRemediationActions.ts` (not in route import graph)<br>`src/hooks/useStateSyncStatus.ts` (reachable import; inspect caller)<br>`src/services/bridgeService.ts` (not in route import graph)<br>`src/services/fleetTelemetryClient.ts` (not in route import graph) |
| attest | `src/services/popService.js` (reachable import; inspect caller) |
| audit | `src/services/hsmService.ts` (reachable import; inspect caller) |
| bacalhau | `src/components/Integrations/BacalhauPanel.jsx` (reachable import; inspect caller) |
| bridge | `src/components/Bridge/BridgeMonitorDashboard.jsx` (not in route import graph)<br>`src/components/BridgeAdvanced/BridgeRouteOptimizer.tsx` (reachable import; inspect caller)<br>`src/components/BridgeAdvanced/LiquidityDepthChart.tsx` (reachable import; inspect caller)<br>`src/hooks/useBridgeFinalityStatus.ts` (reachable import; inspect caller)<br>`src/services/bridgeStatusService.js` (reachable import; inspect caller) |
| carbon | `src/components/CarbonTracking/CarbonTrackingDashboard.jsx` (contains sample gate; inspect live body) |
| climate | `src/components/ClimateReports/ClimateReportDashboard.tsx` (contains sample gate; inspect live body) |
| collaborative | `src/components/CollaborativeAnalysis/AnalysisTemplate.jsx` (reachable import; inspect caller)<br>`src/components/CollaborativeAnalysis/AnnotationLayer.jsx` (reachable import; inspect caller)<br>`src/components/CollaborativeAnalysis/CollaborativeAnalysis.jsx` (contains sample gate; inspect live body)<br>`src/components/CollaborativeAnalysis/SharedInsights.jsx` (reachable import; inspect caller)<br>`src/components/CollaborativeAnalysis/TeamPanel.jsx` (reachable import; inspect caller)<br>`src/components/CollaborativeAnalysis/WorkspaceEditor.jsx` (contains sample gate; inspect live body) |
| community | `src/components/CommunityForums/CommunityForums.jsx` (reachable import; inspect caller)<br>`src/components/CommunityForums/CooperativeHub.jsx` (reachable import; inspect caller)<br>`src/components/CommunityForums/EventCalendar.jsx` (reachable import; inspect caller)<br>`src/components/CommunityForums/ForumThread.jsx` (reachable import; inspect caller)<br>`src/components/CommunityForums/LocalGroup.jsx` (reachable import; inspect caller)<br>`src/components/CommunityForums/MemberProfile.jsx` (reachable import; inspect caller) |
| compliance | `src/services/hsmService.ts` (reachable import; inspect caller) |
| computational | `src/components/ComputationalNFT/ExecutionForm.jsx` (reachable import; inspect caller)<br>`src/components/ComputationalNFT/ExecutionMonitor.jsx` (reachable import; inspect caller)<br>`src/components/nft/CreateNFTForm.jsx` (not in route import graph)<br>`src/components/nft/NFTDetail.jsx` (not in route import graph)<br>`src/components/nft/NFTGallery.jsx` (not in route import graph)<br>`src/pages/ComputationalNFTList.jsx` (reachable import; inspect caller)<br>`src/pages/ComputationalNFTPage.jsx` (reachable import; inspect caller) |
| compute | `src/components/ComputeMarketplace/JobQueue.jsx` (reachable import; inspect caller) |
| configure | `src/components/Settings/ComputeContributionPage.jsx` (reachable import; inspect caller) |
| consensus | `src/services/consensusService.ts` (reachable import; inspect caller) |
| cooperatives | `src/components/Leaderboard/CooperativeHub.jsx` (contains sample gate; inspect live body) |
| dag | `src/components/BlockExplorerDAG/DAGBlockExplorer.tsx` (reachable import; inspect caller)<br>`src/components/DAGExplorer/DAGExplorer.tsx` (reachable import; inspect caller) |
| developer | `src/components/developer/ApiKeyManager.jsx` (reachable import; inspect caller)<br>`src/components/developer/UsageAnalytics.jsx` (reachable import; inspect caller) |
| disable | `src/services/mevProtectionService.js` (not in route import graph) |
| earnings | `src/components/Settings/ComputeContributionPage.jsx` (reachable import; inspect caller)<br>`src/components/Settings/NASStoragePage.jsx` (reachable import; inspect caller) |
| enable | `src/services/mevProtectionService.js` (not in route import graph) |
| field | `src/components/FieldTools/FieldMap.tsx` (not in route import graph)<br>`src/components/FieldTools/LocalDataCache.tsx` (not in route import graph)<br>`src/components/FieldTools/OfflineSubmissionQueue.tsx` (not in route import graph)<br>`src/components/FieldTools/SyncManager.tsx` (not in route import graph) |
| filecoin | `src/components/Integrations/FilecoinPanel.jsx` (reachable import; inspect caller) |
| fleet | `src/components/FleetManagement/FleetDashboard.tsx` (reachable import; inspect caller) |
| flux | `src/components/Dashboard/InfrastructureCapacityDashboard.jsx` (reviewed mixed gate; inspect live body)<br>`src/components/Integrations/FluxCard.jsx` (only behind recognized sample gate) |
| forecast-studio | `src/components/ForecastStudio/ForecastHistory.jsx` (contains sample gate; inspect live body)<br>`src/components/ForecastStudio/ForecastPreview.jsx` (reachable import; inspect caller)<br>`src/components/ForecastStudio/ForecastStudio.jsx` (reachable import; inspect caller) |
| gamification | `src/components/Gamification/AchievementsBadges.jsx` (only behind recognized sample gate)<br>`src/components/Gamification/GamificationDashboard.jsx` (contains sample gate; inspect live body)<br>`src/components/Gamification/LeaderboardDashboard.jsx` (only behind recognized sample gate) |
| golem | `src/components/Golem/GolemDashboard.jsx` (reachable import; inspect caller)<br>`src/components/Integrations/GolemCard.jsx` (only behind recognized sample gate) |
| heartbeat | `src/components/Settings/ComputeContributionPage.jsx` (reachable import; inspect caller) |
| helium | `src/components/Integrations/HeliumNetworkPanel.jsx` (reachable import; inspect caller) |
| hsm | `src/services/config.ts` (reachable import; inspect caller)<br>`src/services/hsmService.ts` (reachable import; inspect caller) |
| identity | `src/components/Identity/IdentityDashboard.tsx` (reachable import; inspect caller)<br>`src/components/Identity/NamingService.tsx` (reachable import; inspect caller)<br>`src/components/Identity/ReputationDisplay.tsx` (reachable import; inspect caller)<br>`src/hooks/useCredentialLifecycle.ts` (reachable import; inspect caller)<br>`src/services/blockchainMessaging.js` (reachable import; inspect caller) |
| iexec | `src/components/iExec/iExecDashboard.jsx` (reachable import; inspect caller) |
| integrations | `src/components/Integrations/AI/LangChainCard.jsx` (only behind recognized sample gate)<br>`src/components/Integrations/EnhancedIntegrationsHub.tsx` (contains sample gate; inspect live body)<br>`src/components/Integrations/IntegrationWizard.tsx` (only behind recognized sample gate)<br>`src/services/ChainlinkService.js` (not in route import graph) |
| internet-computer | `src/components/Integrations/InternetComputerCard.jsx` (only behind recognized sample gate) |
| iot | `src/components/AdvancedOnboarding/AutoDetectWizard.tsx` (reachable import; inspect caller) |
| leaderboard | `src/components/Leaderboard/ContributorProfile.jsx` (contains sample gate; inspect live body) |
| map | `src/services/bridgeService.ts` (not in route import graph) |
| mcp | `src/components/ModelContext/MCPContextSelector.jsx` (reachable import; inspect caller)<br>`src/components/ModelContext/MCPDashboard.jsx` (reachable import; inspect caller)<br>`src/components/ModelContext/MCPModelSelector.jsx` (reachable import; inspect caller) |
| messages | `src/services/blockchainMessaging.js` (reachable import; inspect caller) |
| metrics | `src/components/developer/RealTimeApiDashboard.jsx` (reachable import; inspect caller) |
| mev-protection | `src/services/mevProtectionService.js` (not in route import graph) |
| model-context | `src/components/Integrations/ModelContextConfig.jsx` (only behind recognized sample gate) |
| module-controller | `src/components/WorkflowManagerUI.jsx` (not in route import graph) |
| mpc | `src/components/ComputationalNFT/MPCPrivacyControls.jsx` (reachable import; inspect caller) |
| multisig | `src/services/hsmService.ts` (reachable import; inspect caller) |
| nas | `src/components/Settings/NASStoragePage.jsx` (reachable import; inspect caller) |
| network | `src/components/NetworkInsights/NetworkTopologyMap.tsx` (contains sample gate; inspect live body) |
| networks | `src/services/bridgeService.ts` (not in route import graph) |
| openforis | `src/components/Integrations/OpenForisCard.jsx` (only behind recognized sample gate) |
| payloads | `src/services/blockchainMessaging.js` (reachable import; inspect caller) |
| pipeline | `src/components/PipelineBuilder/RecipeMarketplace.jsx` (reachable import; inspect caller) |
| plugins | `src/components/Integrations/N8nCard.jsx` (only behind recognized sample gate)<br>`src/components/Integrations/N8nConfig.jsx` (reachable import; inspect caller) |
| pop | `src/components/environmental/EnvironmentalSubmissions.jsx` (not in route import graph)<br>`src/components/environmental/SubmitEnvironmentalDataForm.jsx` (not in route import graph)<br>`src/services/popService.js` (reachable import; inspect caller) |
| protocol | `src/hooks/useProtocolTransition.ts` (reachable import; inspect caller) |
| push | `src/utils/pwaUtils.ts` (only behind recognized sample gate) |
| register | `src/components/Settings/ComputeContributionPage.jsx` (reachable import; inspect caller) |
| send | `src/services/bridgeService.ts` (not in route import graph) |
| sensor-community | `src/components/SensorCommunity/SensorCommunityWrapper.jsx` (reachable import; inspect caller) |
| services | `src/components/Settings/NASStoragePage.jsx` (reachable import; inspect caller)<br>`src/components/Settings/ServiceManagementPage.jsx` (reachable import; inspect caller) |
| sharding | `src/services/blockchainService.ts` (reachable import; inspect caller) |
| social | `src/hooks/useProofOfMeme.js` (reachable import; inspect caller) |
| staking | `src/components/DeFi/StakingPanel.tsx` (reachable import; inspect caller)<br>`src/components/Staking/LiquidStakingDashboard.tsx` (reachable import; inspect caller)<br>`src/services/PerformanceOptimizer.js` (reachable import; inspect caller) |
| status | `src/components/Debug/ConnectionStatus.jsx` (reachable import; inspect caller)<br>`src/services/hsmService.ts` (reachable import; inspect caller)<br>`src/services/mevProtectionService.js` (not in route import graph) |
| streamr | `src/components/Integrations/StreamrCard.jsx` (only behind recognized sample gate) |
| submissions | `src/services/popService.js` (reachable import; inspect caller) |
| submit | `src/services/popService.js` (reachable import; inspect caller) |
| system | `src/components/Settings/ServiceManagementPage.jsx` (reachable import; inspect caller) |
| tasks | `src/components/Settings/ComputeContributionPage.jsx` (reachable import; inspect caller) |
| tataucloud | `src/components/TatauCloud/TatauCloudDashboard.jsx` (reachable import; inspect caller) |
| transactions | `src/services/bridgeService.ts` (not in route import graph)<br>`src/services/governanceService.ts` (reachable import; inspect caller) |
| tx | `src/components/Dashboard/RecentTransactions.jsx` (reachable import; inspect caller)<br>`src/config/network.ts` (reachable import; inspect caller) |
| upload | `src/components/DataUpload/BatchUploadPage.tsx` (contains sample gate; inspect live body) |
| users | `src/services/blockchainMessaging.js` (reachable import; inspect caller)<br>`src/services/popService.js` (reachable import; inspect caller) |
| validator | `src/components/ValidatorOps/ValidatorOperationsCenter.tsx` (reachable import; inspect caller) |
| validators | `src/services/validatorService.js` (not in route import graph) |
| verify | `src/services/bridgeService.ts` (not in route import graph) |
| weather-earnings | `src/services/config.ts` (reachable import; inspect caller) |
| webhooks | `src/hooks/useWebhookObservability.ts` (not in route import graph; hook deleted in frontend#527) |
| wolfram | retired 2026-11-01: `WolframCard.jsx` keeps the AppID on the device and calls no API (bring-your-own-key; the one Wolfram call is the proof card's `/api/integrations/wolfram/reading-check`) |
| zk | `src/components/ZKVerification/PrivacyProofExplorer.tsx` (contains sample gate; inspect live body)<br>`src/components/ZKVerification/ProofVerificationUI.tsx` (reachable import; inspect caller)<br>`src/hooks/useZkProver.js` (only behind recognized sample gate) |
