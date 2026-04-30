import { ProductCatalogClient } from "@/src/components/products/ProductCatalogClient";

export default async function ProductDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <ProductCatalogClient editor={{ mode: "edit", productId: id }} />;
}
