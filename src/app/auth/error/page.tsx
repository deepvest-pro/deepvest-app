'use client';

import Link from 'next/link';

export default function AuthErrorPage() {
  return (
    <article>
      <h1>Authentication Error</h1>
      <p>
        Sorry, there was a problem with your authentication request. This could be due to an expired
        link or invalid token.
      </p>
      <div>
        <Link href="/auth/sign-in">Sign In</Link>
        <Link href="/">Go Home</Link>
      </div>
    </article>
  );
}
