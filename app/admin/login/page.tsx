import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = { title: "Sign in" };

/** already signed in? straight to the panel */
async function LoginGate() {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  if (session) redirect("/admin");
  return <LoginForm />;
}

export default function LoginPage() {
  return (
    <main className="ga-login">
      <div className="ga-login-card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/gameplan-logo-white.png" alt="Gameplan" width={148} height={37} className="ga-login-logo" />
        <h1>Admin sign in</h1>
        <p className="ga-muted">Messages from the website forms.</p>
        <Suspense fallback={<div className="ga-login-form ga-skeleton" aria-busy="true" />}>
          <LoginGate />
        </Suspense>
      </div>
    </main>
  );
}
