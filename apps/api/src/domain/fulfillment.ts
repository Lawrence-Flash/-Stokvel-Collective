export function normalizeCollectionCode(collectionOtp: string): string {
  return collectionOtp.trim().replace(/\s+/g, '');
}

export function isAuthorizedToRedeem(hubManagerId: string, assignedManagerId: string): boolean {
  if (!hubManagerId) {
    return true;
  }
  return hubManagerId === assignedManagerId;
}
