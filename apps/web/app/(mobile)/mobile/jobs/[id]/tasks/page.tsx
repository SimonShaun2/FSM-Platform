import { redirect } from "next/navigation";

export default async function MobileJobTasksPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  redirect(`/mobile/jobs/${id}?tab=tasks`);
}
