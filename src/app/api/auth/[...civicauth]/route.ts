// src/app/api/auth/[...civicauth]/route.ts
import { handler } from "@civic/auth-web3/nextjs";

export const GET = handler();
// Add other HTTP methods (POST, etc.) if Civic documentation requires them for this handler.
