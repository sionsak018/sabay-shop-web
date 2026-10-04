export const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim();

export const isGoogleSignInEnabled = Boolean(GOOGLE_CLIENT_ID);
