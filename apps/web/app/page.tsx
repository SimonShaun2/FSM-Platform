import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AUTH_COOKIE_NAME } from "../lib/auth";

export default async function HomePage() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get(AUTH_COOKIE_NAME);

  if (authCookie?.value) {
    redirect("/dashboard");
  }

  redirect("/login");
}
