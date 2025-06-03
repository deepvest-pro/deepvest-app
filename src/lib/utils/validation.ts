/**
 * Common validation utilities
 */

/**
 * Validates email format
 * @param email Email to validate
 * @returns true if valid, false otherwise
 */
export const isValidEmail = (email: string): boolean => {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
};

/**
 * Validates if email is not empty and has valid format
 * @param email Email to validate
 * @returns Error message if invalid, null if valid
 */
export const validateEmail = (email: string): string | null => {
  if (!email) {
    return 'Please enter an email address';
  }

  if (!isValidEmail(email)) {
    return 'Please enter a valid email address';
  }

  return null;
};

/**
 * Checks if email already exists in a list
 * @param email Email to check
 * @param existingEmails Array of existing emails or objects with email property
 * @returns true if email exists, false otherwise
 */
export const emailExists = (
  email: string,
  existingEmails: string[] | { email: string }[],
): boolean => {
  if (typeof existingEmails[0] === 'string') {
    return (existingEmails as string[]).includes(email);
  }

  return (existingEmails as { email: string }[]).some(item => item.email === email);
};
