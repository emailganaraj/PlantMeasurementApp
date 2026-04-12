/**
 * Time Utilities - All date/time operations should use IST (Indian Standard Time)
 * 
 * This utility ensures consistent date/time handling throughout the app
 * for display, storage, and API communications.
 */

/**
 * Get current IST timestamp as ISO string
 * @returns ISO string in IST timezone
 */
export const getCurrentISTTimestamp = (): string => {
  const now = new Date();
  // Convert to IST (UTC+5:30)
  const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
  const istTime = new Date(now.getTime() + istOffset + (now.getTimezoneOffset() * 60 * 1000));
  return istTime.toISOString();
};

/**
 * Format date for display in IST
 * @param timestamp - ISO string or Date object
 * @returns Formatted date string in IST (e.g., "15/04/2026")
 */
export const formatISTDate = (timestamp: string | Date): string => {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  // Convert to IST (UTC+5:30)
  const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
  const istTime = new Date(date.getTime() + istOffset + (date.getTimezoneOffset() * 60 * 1000));
  
  return istTime.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Kolkata'
  });
};

/**
 * Format time for display in IST
 * @param timestamp - ISO string or Date object
 * @returns Formatted time string in IST (e.g., "14:30")
 */
export const formatISTTime = (timestamp: string | Date): string => {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  // Convert to IST (UTC+5:30)
  const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
  const istTime = new Date(date.getTime() + istOffset + (date.getTimezoneOffset() * 60 * 1000));
  
  return istTime.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Kolkata'
  });
};

/**
 * Format date and time for display in IST
 * @param timestamp - ISO string or Date object
 * @returns Formatted date-time string in IST (e.g., "15/04/2026 at 14:30")
 */
export const formatISTDateTime = (timestamp: string | Date): string => {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  // Convert to IST (UTC+5:30)
  const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
  const istTime = new Date(date.getTime() + istOffset + (date.getTimezoneOffset() * 60 * 1000));
  
  return istTime.toLocaleString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Kolkata'
  });
};

/**
 * Get current date and time in IST for chat messages
 * @returns Object with date and time strings
 */
export const getCurrentISTChatTime = (): { date: string; time: string } => {
  const now = new Date();
  // Convert to IST (UTC+5:30)
  const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
  const istTime = new Date(now.getTime() + istOffset + (now.getTimezoneOffset() * 60 * 1000));
  
  return {
    date: istTime.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'Asia/Kolkata'
    }),
    time: istTime.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Kolkata'
    })
  };
};

/**
 * Convert any timestamp to IST Date object
 * @param timestamp - ISO string or Date object
 * @returns Date object in IST
 */
export const toISTDate = (timestamp: string | Date): Date => {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  // Convert to IST (UTC+5:30)
  const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
  return new Date(date.getTime() + istOffset + (date.getTimezoneOffset() * 60 * 1000));
};
