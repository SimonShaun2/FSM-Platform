import { TechnicianProfileClient } from "@/src/components/technicians/TechnicianProfileClient";

export default async function TechnicianProfilePage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <TechnicianProfileClient technicianId={id} />;
}
