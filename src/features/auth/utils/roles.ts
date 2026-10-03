import type { User } from '../types/auth.types';

/**
 * A user who belongs to the admin console (either the `admin` role or any
 * custom role carrying permissions). These accounts post ads through the
 * admin console rather than the public seller flow.
 */
export const isConsoleUser = (user: User | null | undefined): boolean =>
  !!user && (user.role === 'admin' || !!user.permissions?.length);
