"use client";

import { useParams } from "next/navigation";
import { MobileJobDetail } from "@/src/components/mobile/MobileJobDetail";

export default function MobileJobDetailPage() {
  const params = useParams<{ id: string }>();

  return <MobileJobDetail jobId={params.id} />;
}
