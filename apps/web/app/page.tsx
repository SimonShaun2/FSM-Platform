import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getDefaultRouteForRole } from "@/src/lib/route-access";
import { readServerAuthSession } from "@/src/lib/auth";

export default async function HomePage() {
  const cookieStore = await cookies();
  const session = readServerAuthSession(cookieStore);

  if (session?.role) {
    redirect(getDefaultRouteForRole(session.role));
  }

  redirect("/login");
}
