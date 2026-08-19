/**
 * Renders a ticket's display code from the deployment's configurable prefix
 * (AppSettings.ticketPrefix) and its sequential ticketNumber, e.g. "KYM-1042".
 */
export function formatTicketNumber(
  prefix: string,
  ticketNumber: number,
): string {
  return `${prefix}-${ticketNumber}`;
}
