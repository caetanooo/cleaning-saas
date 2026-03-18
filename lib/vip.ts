/**
 * VIP email list — users who get full access without a paid subscription.
 * To add or remove a VIP, edit this array and redeploy.
 */
export const VIP_EMAILS: string[] = [
  "debbie.rj@gmail.com",
  "caetanochavesmaria@gmail.com",
  "garofalogui@gmail.com",
  "pedro.caetano.3anos@gmail.com",
];

export function isVipEmail(email: string): boolean {
  return VIP_EMAILS.includes(email.toLowerCase().trim());
}
