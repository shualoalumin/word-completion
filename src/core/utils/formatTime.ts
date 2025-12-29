/**
 * Format seconds to MM:SS string
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(Math.abs(seconds) / 60);
  const secs = Math.abs(seconds) % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format duration with overtime indicator
 */
export function formatDuration(
  baseDuration: number,
  overtime: number,
  isOvertime: boolean
): string {
  if (isOvertime) {
    return formatTime(baseDuration + overtime);
  }
  return formatTime(baseDuration);
}





