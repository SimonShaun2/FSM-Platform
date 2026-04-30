import { BookingFlowClient } from "@/src/components/booking/BookingFlowClient";

export default async function PublicBookingServicePage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return <BookingFlowClient slug={slug} step="service" />;
}
