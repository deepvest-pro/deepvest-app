// This is a server component
export const dynamic = 'force-dynamic';

import { LoginPageClient } from '@/components/auth/LoginPageClient';

export default function LoginPage() {
  return <LoginPageClient />;
}
