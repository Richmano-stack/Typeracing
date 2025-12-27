/**
 * Room validation utilities
 */

export function sanitizeGuestName(name: string): string {
  // Remove HTML tags and limit length
  return name
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .trim()
    .slice(0, 20) // Limit to 20 characters
    .replace(/[^\w\s-]/g, ''); // Remove special characters except spaces and hyphens
}

export function validateRoomCode(code: string): boolean {
  // Must be exactly 6 characters, alphanumeric uppercase
  return /^[A-Z0-9]{6}$/.test(code);
}

export function validateMaxPlayers(maxPlayers: number): boolean {
  return maxPlayers >= 2 && maxPlayers <= 20;
}

export function validateProgress(progress: number): boolean {
  return progress >= 0 && progress <= 100;
}

export function validateWPM(wpm: number): boolean {
  return wpm >= 0 && wpm <= 500; // Reasonable WPM limit
}

