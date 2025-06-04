// Server component wrapper
export const dynamic = 'force-dynamic';

import { AuthLayoutClient } from './layout.client';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthLayoutClient>{children}</AuthLayoutClient>;
}
