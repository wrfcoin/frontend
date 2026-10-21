/**
 * @deprecated This barrel re-exports legacy UI components.
 * New code should import from '@/components/DesignSystem' instead.
 */

// Legacy Bootstrap-style stubs
export { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from './card';
export { Button } from './button';
export { Input } from './input';
export { Badge } from './badge';
export { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';
export { Avatar, AvatarImage, AvatarFallback } from './avatar';

// Wrf-prefixed themed components (pending migration to DesignSystem)
export { default as WrfCard } from './WrfCard';
export { default as WrfButton } from './WrfButton';
export { default as WrfInput } from './WrfInput';
export { default as WrfBadge } from './WrfBadge';
export { default as WrfSkeleton } from './WrfSkeleton';
export { default as WrfEmptyState } from './WrfEmptyState';
export { default as WrfStatCard } from './WrfStatCard';
export { default as WrfDataTable } from './WrfDataTable';

// Design tokens (deprecated - use @/components/DesignSystem/tokens)
export * from './tokens-compat';
