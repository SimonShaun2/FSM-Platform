import { PublicReviewClient } from "@/src/components/reviews/PublicReviewClient";

export default async function PublicReviewPage({
  params
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return <PublicReviewClient token={token} />;
}
