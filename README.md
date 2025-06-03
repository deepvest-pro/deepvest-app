This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### Environment Setup

Before running the application, you need to set up your environment variables:

1. Create a `.env` file in the root of the project with the following variables:

```
# Supabase - приватные ключи, доступны только на сервере
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# URL приложения
APP_URL=http://localhost:3000
```

> **IMPORTANT**: Supabase keys with the `NEXT_PUBLIC_` prefix have been deprecated and should not be used for security reasons. All Supabase operations should be performed server-side only.

### Running the Development Server

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Security Best Practices

This project follows these security best practices:

1. **Server-side Access Only** - All Supabase operations are performed on the server side only (using Server Components, Server Actions, or Middleware).
2. **No Client-side Supabase Keys** - The project doesn't expose Supabase API keys to the client.
3. **Secure Authentication Flow** - Auth tokens are managed through HTTP cookies, not localStorage.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
