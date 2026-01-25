/**
 * Email Generator Utility
 * Generates corporate email addresses based on user's name
 */

/**
 * Default company domain for email generation
 * TODO: Move this to environment variables or app configuration
 */
const COMPANY_DOMAIN = "corpex.com";

/**
 * Normalizes a name by removing special characters and converting to lowercase
 */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/[^a-z0-9-]/g, "") // Remove special characters except hyphens
    .replace(/-+/g, "-"); // Replace multiple hyphens with single hyphen
}

/**
 * Generates a corporate email address from first name and last name
 * Format: firstname.lastname@company.com
 *
 * @param firstName - User's first name
 * @param lastName - User's last name
 * @param domain - Optional custom domain (defaults to COMPANY_DOMAIN)
 * @returns Generated email address
 *
 * @example
 * generateEmail("John", "Doe") // returns "john.doe@corpex.com"
 * generateEmail("Jean-Claude", "Van Damme") // returns "jean-claude.van-damme@corpex.com"
 */
export function generateEmail(
  firstName: string,
  lastName: string,
  domain: string = COMPANY_DOMAIN
): string {
  const normalizedFirstName = normalizeName(firstName);
  const normalizedLastName = normalizeName(lastName);

  return `${normalizedFirstName}.${normalizedLastName}@${domain}`;
}

/**
 * Validates if an email follows the corporate email format
 */
export function isValidCorporateEmail(email: string): boolean {
  const emailRegex = /^[a-z0-9-]+\.[a-z0-9-]+@[a-z0-9-]+\.[a-z]{2,}$/;
  return emailRegex.test(email);
}
