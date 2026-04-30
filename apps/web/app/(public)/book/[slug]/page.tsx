import { BookingFlowClient } from "@/src/components/booking/BookingFlowClient";

export default async function PublicBookingPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return <BookingFlowClient slug={slug} step="location" />;
}
