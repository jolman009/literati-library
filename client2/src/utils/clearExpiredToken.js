// Vestigial — token expiry is now handled server-side via httpOnly cookie maxAge.
// Kept as a no-op for any stale import references.
export const clearExpiredToken = () => false;
