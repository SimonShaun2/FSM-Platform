import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { CSVImportWizardClient } from "@/src/components/csv-import/CSVImportWizardClient";
import { readServerAuthSession } from "@/src/lib/auth";
import { getDefaultRouteForRole } from "@/src/lib/route-access";

export default async function OnboardingImportPage() {
  const cookieStore = await cookies();
  const session = readServerAuthSession(cookieStore);

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "owner" && session.role !== "admin") {
    redirect(getDefaultRouteForRole(session.role));
  }

  return <CSVImportWizardClient />;
}
