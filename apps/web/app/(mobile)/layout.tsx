import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { AuthRouteBridge } from "@/src/components/layout/AuthRouteBridge";
import { MobileAppShell } from "@/src/components/mobile/MobileAppShell";
import { readServerAuthSession } from "@/src/lib/auth";

export default async function MobileLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const session = readServerAuthSession(cookieStore);

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "technician") {
    notFound();
  }

  return (
    <AuthRouteBridge session={session}>
      <MobileAppShell session={session}>{children}</MobileAppShell>
    </AuthRouteBridge>
  );
}
