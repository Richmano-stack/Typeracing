import { prisma } from '@/lib/prisma';

/**
 * Generates a unique 6-character alphanumeric room code
 * Format: uppercase letters and numbers (e.g., "ABC123")
 * 
 * @returns Promise<string> - Unique room code
 */
export async function generateRoomCode(): Promise<string> {
  const MAX_RETRIES = 10;
  const CODE_LENGTH = 6;
  
  // Characters to use: uppercase letters (A-Z) and numbers (0-9)
  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    // Generate random code
    let code = '';
    for (let i = 0; i < CODE_LENGTH; i++) {
      code += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
    }
    
    // Check if code already exists
    const existingRoom = await prisma.raceRoom.findUnique({
      where: { roomCode: code },
      select: { id: true },
    });
    
    if (!existingRoom) {
      return code;
    }
  }
  
  // If we've exhausted retries, throw an error
  throw new Error('Failed to generate unique room code after maximum retries');
}

/**
 * Validates room code format
 * @param code - Room code to validate
 * @returns boolean - True if valid format
 */
export function isValidRoomCode(code: string): boolean {
  // Must be exactly 6 characters, alphanumeric uppercase
  return /^[A-Z0-9]{6}$/.test(code);
}

