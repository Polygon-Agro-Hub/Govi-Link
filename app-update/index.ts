/**
 * Public API for src/features/app-update
 *
 * Import from this barrel — do not import individual files directly from outside
 * the feature folder, so internal file renames don't ripple through the codebase.
 *
 * Usage:
 *   import { AppUpdateProvider, useAppUpdate } from '@/features/app-update';
 */

export { AppUpdateProvider, useAppUpdate } from './AppUpdateProvider';
export { APP_UPDATE_CONFIG } from './config';
export { UpdatePrompt } from './UpdatePrompt';
export type {
  UpdatePolicy,
  PlatformPolicy,
  UpdateMessages,
  UpdateDecision,
  StorePlatform,
} from './updatePolicy';
