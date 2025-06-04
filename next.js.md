# Next.JS

## Quick Start

Integrate Civic Auth into your Next.js application using the following steps (a working example is available in our [github examples repo](https://github.com/civicteam/civic-auth-examples/tree/main/packages/civic-auth/nextjs)):

{% hint style="warning" %}
**Important**: Make sure your application is using Next.js version ^14.2.25 or ^15.2.3 (or higher).\
Earlier versions are affected by a security vulnerability ([CVE-2025-29927](https://nextjs.org/blog/cve-2025-29927)) that may allow middleware to be bypassed.
{% endhint %}

{% hint style="info" %}
This guide assumes you are using Typescript. Please adjust the snippets as needed to remove the types if you are using plain JS.
{% endhint %}

{% hint style="info" %}
If you plan to use Web3 features, select "Auth + Web3" from the tabs below.
{% endhint %}

### **1. Add the Civic Auth Plugin**

This is where you give your app the Client ID provided when you sign up at [auth.civic.com](https://auth.civic.com).

The defaults should work out of the box for most customers, but if you want to configure your app, see [below](next.js.md#advanced-configuration) for details.

{% tabs %}
{% tab title="Auth" %}
{% code title="next.config.ts" %}
```typescript
import { createCivicAuthPlugin } from "@civic/auth/nextjs"
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

const withCivicAuth = createCivicAuthPlugin({
  clientId: "YOUR CLIENT ID"
});

export default withCivicAuth(nextConfig)
```
{% endcode %}
{% endtab %}

{% tab title="Auth + Web3" %}
{% code title="next.config.ts" %}
```typescript
import { createCivicAuthPlugin } from "@civic/auth-web3/nextjs"
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

const withCivicAuth = createCivicAuthPlugin({
  clientId: "YOUR CLIENT ID"
});

export default withCivicAuth(nextConfig)
```
{% endcode %}
{% endtab %}
{% endtabs %}

{% hint style="info" %}
Typescript support in configuration files was introduced in [Next 15](https://nextjs.org/docs/pages/api-reference/config/typescript#version-changes).

If your config file is a JS file (next.config.mjs), make sure to change the extension to .ts, or remove the type information.
{% endhint %}

### **2. Create the Civic Auth API Route**

This is where your app will handle login and logout requests.

Create this file at the following path:

`src/app/api/auth/[...civicauth]/route.ts`

{% tabs %}
{% tab title="Auth" %}
{% code title="route.ts" %}
```typescript
import { handler } from "@civic/auth/nextjs"

export const GET = handler()
```
{% endcode %}
{% endtab %}

{% tab title="Auth + Web3" %}
{% code title="route.ts" %}
```typescript
import { handler } from "@civic/auth-web3/nextjs"

export const GET = handler()
```
{% endcode %}
{% endtab %}
{% endtabs %}

{% hint style="info" %}
These steps apply to the [App Router](https://nextjs.org/docs/app). If you are using the Pages Router, please [contact us](https://discord.com/invite/MWmhXauJw8/?referrer=home-discord) for integration steps.
{% endhint %}

### **3. Middleware**

Middleware is used to protect your backend routes, server components and server actions from unauthenticated requests.

Using the Civic Auth middleware ensures that only logged-in users have access to secure parts of your service.

{% tabs %}
{% tab title="Auth" %}
{% code title="src/middleware.ts" %}
```typescript
import { authMiddleware } from "@civic/auth/nextjs/middleware"

export default authMiddleware();

export const config = {
  // include the paths you wish to secure here
  matcher: [
    /*
     * Match all request paths except:
     * - _next directory (Next.js static files)
     * - favicon.ico, sitemap.xml, robots.txt
     * - image files
     */
    '/((?!_next|favicon.ico|sitemap.xml|robots.txt|.*\\.jpg|.*\\.png|.*\\.svg|.*\\.gif).*)',
  ],
}
```
{% endcode %}
{% endtab %}

{% tab title="Auth + Web3" %}
{% code title="src/middleware.ts" %}
```typescript
import { authMiddleware } from "@civic/auth-web3/nextjs/middleware"

export default authMiddleware();

export const config = {
  // include the paths you wish to secure here
  matcher: [
    /*
     * Match all request paths except:
     * - _next directory (Next.js static files)
     * - favicon.ico, sitemap.xml, robots.txt
     * - image files
     */
    '/((?!_next|favicon.ico|sitemap.xml|robots.txt|.*\\.jpg|.*\\.png|.*\\.svg|.*\\.gif).*)',
  ], 
}
```
{% endcode %}
{% endtab %}
{% endtabs %}

#### Middleware Chaining

If you are already using middleware in your Next.js app, then you can chain them with Civic Auth as follows:

{% tabs %}
{% tab title="Auth" %}
{% code title="src/middleware.ts" %}
```typescript
import { auth } from "@civic/auth/nextjs"
import { NextRequest, NextResponse } from "next/server";

const withCivicAuth = auth();

const otherMiddleware = (request: NextRequest) => {
    console.log("my middleware");
    return NextResponse.next();
}

export default withCivicAuth(otherMiddleware);
```
{% endcode %}
{% endtab %}

{% tab title="Auth + Web3" %}
{% code title="src/middleware.ts" %}
```typescript
import { auth } from "@civic/auth-web3/nextjs"
import { NextRequest, NextResponse } from "next/server";

const withCivicAuth = auth();

const otherMiddleware = (request: NextRequest) => {
    console.log("my middleware");
    return NextResponse.next();
}

export default withCivicAuth(otherMiddleware);
```
{% endcode %}
{% endtab %}
{% endtabs %}

### **4. Frontend Integration**

Add the Civic Auth context to your app to give your frontend access to the logged-in user.

{% tabs %}
{% tab title="Auth" %}
```javascript
import { CivicAuthProvider } from "@civic/auth/nextjs";

function Layout({ children }) {
  return (
    // ... the rest of your app layout
    <CivicAuthProvider>
      {children}
    </CivicAuthProvider>
  )
}
```
{% endtab %}

{% tab title="Auth + Web3" %}
```javascript
import { CivicAuthProvider } from "@civic/auth-web3/nextjs";

function Layout({ children }) {
  return (
    // ... the rest of your app layout
    <CivicAuthProvider>
      {children}
    </CivicAuthProvider>
  )
}
```
{% endtab %}
{% endtabs %}

{% hint style="info" %}
Unlike the pure [React](react.md) integration, you do _not_ have to add your client ID again here!\
\
Make sure to create the [Civic Auth API route](next.js.md#id-2.-create-the-civic-auth-api-route), as it serves the essential PKCE code challenge.
{% endhint %}

## Usage

### Getting User Information on the Frontend

The Next.js integration can use all the components described in the [React integration page](react.md), such as the `UserButton` , for showing a Sign-In button and displaying the username:

{% tabs %}
{% tab title="Auth" %}
{% code title="TitleBar.ts" %}
```typescript
import { UserButton } from "@civic/auth/react";

export function TitleBar() {
  return (
    <div>
      <h1>My App</h1>
      <UserButton />
    </div>
  );
};
```
{% endcode %}
{% endtab %}

{% tab title="Auth + Web3" %}
{% code title="TitleBar.ts" %}
```typescript
import { UserButton } from "@civic/auth-web3/react";

export function TitleBar() {
  return (
    <div>
      <h1>My App</h1>
      <UserButton />
    </div>
  );
};
```
{% endcode %}
{% endtab %}
{% endtabs %}

or if you need to rollout your own button:

{% tabs %}
{% tab title="Auth + Web3" %}
{% code title="TitleBar.ts" %}
```typescript
export function TitleBar() {
  const doSignIn = useCallback(() => {
    console.log("Starting sign-in process");
    signIn()
      .then(() => {
        console.log("Sign-in completed successfully");
      })
      .catch((error) => {
        console.error("Sign-in failed:", error);
      });
  }, [signIn]);

  return (
    <div>
      <h1>My App</h1>
      <button onClick={doSignIn}>
        Sign in
      </button>
    </div>
  );
}

```
{% endcode %}
{% endtab %}
{% endtabs %}

or the useUser hook, for retrieving information about the user in code:

{% tabs %}
{% tab title="Auth" %}
{% code title="MyComponent.ts" %}
```typescript
import { useUser } from "@civic/auth/react";

export function MyComponent() {
  const { user } = useUser();
  
  if (!user) return <div>User not logged in</div>
  
  return <div>Hello { user.name }!</div>
}
```
{% endcode %}
{% endtab %}

{% tab title="Auth + Web3" %}
{% code title="MyComponent.ts" %}
```typescript
import { useUser } from "@civic/auth-web3/react";

export function MyComponent() {
  const { user } = useUser();
  
  if (!user) return <div>User not logged in</div>
  
  return <div>Hello { user.name }!</div>
}
```
{% endcode %}
{% endtab %}
{% endtabs %}

See the [React Usage page](react.md) for more details.

### Getting User Information on the Backend

Retrieve user information on backend code, such as in React Server Components, React Server Actions, or api routes using `getUser`:

{% tabs %}
{% tab title="Auth" %}
```typescript
import { getUser } from "@civic/auth/nextjs";

const user = await getUser();
```
{% endtab %}

{% tab title="Auth + Web3" %}
```typescript
import { getUser } from "@civic/auth-web3/nextjs";

const user = await getUser();
```
{% endtab %}
{% endtabs %}

For example, in a Next.js Server Component:

{% tabs %}
{% tab title="Auth" %}
```typescript
import { getUser } from "@civic/auth/nextjs";

export async function MyServerComponent() {
  const user = await getUser();
  
  if (!user) return <div>User not logged in</div>
  
  return <div>Hello { user.name }!</div>
}
```
{% endtab %}

{% tab title="Auth + Web3" %}
```typescript
import { getUser } from "@civic/auth-web3/nextjs";

export async function MyServerComponent() {
  const user = await getUser();
  
  if (!user) return <div>User not logged in</div>
  
  return <div>Hello { user.name }!</div>
}
```
{% endtab %}
{% endtabs %}

{% hint style="info" %}
The `name` property is used as an example here, check out the [React Usage page](react.md) to see the entire basic user object structure.
{% endhint %}

## Advanced Configuration

Civic Auth is a "low-code" solution, so most of the configuration takes place via the [dashboard](https://auth.civic.com). Changes you make there will be updated automatically in your integration without any code changes. The only required parameter you need to provide is the client ID.

The integration also offers the ability customize the library according to the needs of your Next.js app. For example, to restrict authentication checks to specific pages and routes in your app. You can do so inside `next.config.js` as follows:

{% tabs %}
{% tab title="Auth" %}
{% code title="next.config.ts" %}
```typescript
import { createCivicAuthPlugin } from "@civic/auth/nextjs"

const withCivicAuth = createCivicAuthPlugin({
  clientId: "YOUR CLIENT ID",
  ... // other config
});

export default withCivicAuth(nextConfig) // your next config here
```
{% endcode %}
{% endtab %}

{% tab title="Auth + Web3" %}
{% code title="next.config.ts" %}
```typescript
import { createCivicAuthPlugin } from "@civic/auth-web3/nextjs"

const withCivicAuth = createCivicAuthPlugin({
  clientId: "YOUR CLIENT ID",
  ... // other config
});

export default withCivicAuth(nextConfig) // your next config here
```
{% endcode %}
{% endtab %}
{% endtabs %}

Here are the available configuration options:

<table><thead><tr><th width="161.57421875">Field</th><th width="73.28515625">Required</th><th width="171">Default</th><th>Example</th><th>Description</th></tr></thead><tbody><tr><td>clientId</td><td>Yes</td><td>-</td><td><code>2cc5633d-2c92-48da-86aa-449634f274b9</code></td><td>The key obtained on signup to <a href="https://auth.civic.com">auth.civic.com</a></td></tr><tr><td>loginSuccessUrl</td><td>No</td><td>-</td><td><code>/myCustomSuccessEndpoint</code></td><td>In a NextJS app, we will redirect your user to this page once the login is finished. If not set, users will be sent back to the root of your app.</td></tr><tr><td>callbackUrl</td><td>No</td><td>/api/auth/callback</td><td>/api/myroute/callback</td><td><p>If you cannot host Civic's SDK handlers in the default location, you can specify a custom callback route here.</p><p></p><p>This route is where you must attach Civic's GET handler as described <a href="https://app.gitbook.com/o/-MbHRfakrvYmMaAu3Awh/s/PrqdylKqzZDnu8FytHLf/~/changes/83/integration/next.js#id-2.-create-the-civic-auth-api-route">here</a> , so that Civic can complete the OAuth token exchange.</p><p></p><p>If you just want to send your users to a specific route after login, use <code>loginSuccessUrl</code> instead.</p></td></tr><tr><td>loginUrl</td><td>No</td><td>/</td><td>/admin</td><td>The path your user will be sent to if they access a resource that needs them to be logged in. If you have a dedicated login page, you can set it here.</td></tr><tr><td>logoutUrl</td><td>No</td><td>/</td><td>/goodbye</td><td>The path your user will be sent to after a successful log-out.</td></tr><tr><td>include</td><td>No</td><td>["/*"]</td><td><p>[</p><p>"/admin/*", "/api/admin/*"</p><p>]</p></td><td>An array of path <a href="https://man7.org/linux/man-pages/man7/glob.7.html">globs</a> that require a user to be logged-in to access. If not set, will include all paths matched by your Next.js <a href="next.js.md#middleware">middleware</a>.</td></tr><tr><td>exclude</td><td>No</td><td>-</td><td>["public/home"]</td><td>An array of path <a href="https://man7.org/linux/man-pages/man7/glob.7.html">globs</a> that are excluded from the Civic Auth <a href="next.js.md#middleware">middleware</a>. In some cases, it might be easier and safer to specify exceptions rather than keep an inclusion list up to date.</td></tr><tr><td><p></p><p>basePath</p></td><td>No</td><td>/</td><td>/my-app</td><td>Allows applications to be served from custom subpaths instead of the root domain. This enables seamless authentication integration when deploying your Next.js application within subdirectories, ensuring all auth-related routes and assets maintain proper functionality regardless of the URL structure.</td></tr></tbody></table>
