import { redirect } from "next/navigation";

export default async function MobileJobCompletePage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  redirect(`/mobile/signature?jobId=${id}`);
}
