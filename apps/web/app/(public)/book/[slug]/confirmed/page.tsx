import { BookingConfirmed } from "@/src/components/booking/BookingFlowClient";

export default async function PublicBookingConfirmedPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ref?: string }>;
}) {
  const { slug } = await params;
  const { ref } = await searchParams;

  return <BookingConfirmed slug={slug} referenceNumber={ref ?? null} />;
}
