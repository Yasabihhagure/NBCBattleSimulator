export class Dice {
  static roll(count: number, faces: number): number {
    let total = 0;
    for (let i = 0; i < count; i++) {
      total += Math.floor(Math.random() * faces) + 1;
    }
    return total;
  }

  static parseAndRoll(notation: string): number {
      // Handle simple integers
      if (!isNaN(Number(notation))) {
          return Number(notation);
      }

    // Basic parsing for "3D6", "1D8+2", "2D6-1"
    const regex = /(\d+)D(\d+)([+-]\d+)?/i;
    const match = notation.match(regex);
    
    if (!match) {
        // Fallback or specific constant like "0" or error
        console.warn(`Invalid dice notation: ${notation}`);
        return 0;
    }

    const count = parseInt(match[1], 10);
    const faces = parseInt(match[2], 10);
    const modifier = match[3] ? parseInt(match[3], 10) : 0;

    return this.roll(count, faces) + modifier;
  }
}
