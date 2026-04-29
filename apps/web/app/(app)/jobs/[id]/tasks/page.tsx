import { redirect } from "next/navigation";

export default async function JobTasksPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  redirect(`/jobs/${id}`);
}
