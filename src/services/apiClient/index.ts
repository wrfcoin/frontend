import { resolveServiceBaseUrls } from './runtime';
import { ApiClient } from './client';
import { WeatherService } from './weatherService';
import { EarningsService } from './earningsService';
import { GovernanceService } from './governanceService';
import { WalletService } from './walletService';
import { ComputeService } from './computeService';
import { ValidatorApiService } from './validatorService';
import { StationRegistrationService } from './stationRegistrationService';

export const serviceBaseUrls = resolveServiceBaseUrls();

export const apiClient = new ApiClient({ baseUrl: serviceBaseUrls.api });
export const weatherService = new WeatherService(serviceBaseUrls);
export const earningsService = new EarningsService(serviceBaseUrls);
export const governanceService = new GovernanceService(serviceBaseUrls);
export const walletService = new WalletService(serviceBaseUrls);
export const computeService = new ComputeService(serviceBaseUrls);
export const validatorApiService = new ValidatorApiService(serviceBaseUrls);
export const stationRegistrationService = new StationRegistrationService(serviceBaseUrls);

export * from './types';
export * from './stationRegistrationService';
export * from './client';
export * from './runtime';
export * from './number';
