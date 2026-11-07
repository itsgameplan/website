import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { MessagesPanel } from "@/components/admin/messages-panel";

export const metadata: Metadata = { title: "Messages" };

/** only signed-in admins get past this; everyone else goes to the sign-in page */
async function AdminGate() {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  if (!session) redirect("/admin/login");
  return <MessagesPanel user={{ name: session.user.name, email: session.user.email }} />;
}

export default function AdminPage() {
  return (
    <Suspense fallback={<main className="ga-shell"><p className="ga-muted ga-pad">Loading…</p></main>}>
      <AdminGate />
    </Suspense>
  );
}
