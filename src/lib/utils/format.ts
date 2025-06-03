/**
 * Utility functions for formatting data
 */

/**
 * Format date to be more readable
 */
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Format status for display (capitalize and replace underscores)
 */
export const formatStatus = (status: string): string => {
  return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
};

/**
 * Get status color for badges
 */
export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'idea':
      return 'gray';
    case 'concept':
      return 'blue';
    case 'prototype':
      return 'cyan';
    case 'mvp':
      return 'green';
    case 'beta':
      return 'yellow';
    case 'launched':
      return 'orange';
    case 'growing':
      return 'red';
    case 'scaling':
      return 'purple';
    case 'established':
      return 'indigo';
    case 'acquired':
      return 'pink';
    case 'closed':
      return 'gray';
    default:
      return 'gray';
  }
};

/**
 * Get team member status badge color
 */
export const getTeamMemberStatusColor = (status: string): 'green' | 'blue' | 'gray' | 'orange' => {
  switch (status) {
    case 'active':
      return 'green';
    case 'invited':
      return 'blue';
    case 'inactive':
      return 'gray';
    case 'ghost':
      return 'orange';
    default:
      return 'gray';
  }
};

/**
 * Format URL to ensure it has protocol
 */
export const formatUrl = (url: string): string => {
  if (!url) return '';
  return url.startsWith('http') ? url : `https://${url}`;
};

/**
 * Validate if a string is a valid URL
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(formatUrl(url));
    return true;
  } catch {
    return false;
  }
};

/**
 * Format file size in human readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Truncate text to specified length
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

/**
 * Generate initials from name
 */
export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};
