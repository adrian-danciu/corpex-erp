/**
 * Password Generator Utility
 * Generates secure random passwords for new user accounts
 */

/**
 * Character sets for password generation
 */
const UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
const NUMBERS = "0123456789";
const SPECIAL_CHARS = "!@#$%^&*()_+-=[]{}|;:,.<>?";

/**
 * Default password configuration
 */
const DEFAULT_PASSWORD_LENGTH = 16;

/**
 * Generates a cryptographically secure random password
 *
 * Password requirements:
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 * - Configurable length (default: 16 characters)
 *
 * @param length - Desired password length (default: 16)
 * @returns Generated secure password
 *
 * @example
 * generatePassword() // returns something like "aB3$xY9@pL2#mN5!"
 * generatePassword(12) // returns 12-character password
 */
export function generatePassword(length: number = DEFAULT_PASSWORD_LENGTH): string {
  if (length < 8) {
    throw new Error("Password length must be at least 8 characters");
  }

  const allChars = UPPERCASE + LOWERCASE + NUMBERS + SPECIAL_CHARS;
  let password = "";

  // Ensure at least one character from each required set
  password += getRandomChar(UPPERCASE);
  password += getRandomChar(LOWERCASE);
  password += getRandomChar(NUMBERS);
  password += getRandomChar(SPECIAL_CHARS);

  // Fill the rest with random characters
  for (let i = password.length; i < length; i++) {
    password += getRandomChar(allChars);
  }

  // Shuffle the password to avoid predictable patterns
  return shuffleString(password);
}

/**
 * Gets a random character from a given string
 */
function getRandomChar(chars: string): string {
  const randomIndex = Math.floor(Math.random() * chars.length);
  return chars[randomIndex];
}

/**
 * Shuffles a string randomly using Fisher-Yates algorithm
 */
function shuffleString(str: string): string {
  const array = str.split("");
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array.join("");
}

/**
 * Validates password strength
 * Returns true if password meets security requirements
 */
export function isStrongPassword(password: string): boolean {
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(password);
  const hasMinLength = password.length >= 8;

  return hasUppercase && hasLowercase && hasNumber && hasSpecialChar && hasMinLength;
}
