/**
 * @file photoPermissionService.ts
 * @description Classifies photo access without reading assets; separates OS prompts from permission checks.
 */
import {
  getPermissionsAsync,
  requestPermissionsAsync,
  type PermissionResponse,
} from 'expo-media-library';

export type PhotoAccess = 'all' | 'limited' | 'denied';

/** Maps native permissions, including older platforms without accessPrivileges. */
export function classifyPhotoAccess(
  permission: PermissionResponse,
): PhotoAccess {
  if (permission.accessPrivileges === 'limited') return 'limited';
  if (permission.status !== 'granted' || permission.accessPrivileges === 'none')
    return 'denied';
  return 'all';
}

/** Requests photo-only read permission while the consent screen remains mounted. */
export async function requestPhotoAccess(): Promise<PhotoAccess> {
  return classifyPhotoAccess(await requestPermissionsAsync(false, ['photo']));
}

/** Checks current access without opening an OS permission prompt. */
export async function getPhotoAccess(): Promise<PhotoAccess> {
  return classifyPhotoAccess(await getPermissionsAsync(false, ['photo']));
}
