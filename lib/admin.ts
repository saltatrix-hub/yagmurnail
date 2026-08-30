import { env } from 'cloudflare:workers';
import { headers } from 'next/headers';

export type AdminStatus = 'authorized' | 'anonymous' | 'forbidden';

export async function getAdminStatus(): Promise<AdminStatus> {
  const requestHeaders = await headers();
  const email = requestHeaders.get('oai-authenticated-user-email')?.trim().toLowerCase();
  if (!email) return 'anonymous';

  const adminEmail = (env as unknown as { ADMIN_EMAIL?: string }).ADMIN_EMAIL?.trim().toLowerCase();
  return adminEmail && email === adminEmail ? 'authorized' : 'forbidden';
}
