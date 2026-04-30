import { ProductCatalogClient } from "@/src/components/products/ProductCatalogClient";

export default function NewProductPage() {
  return <ProductCatalogClient editor={{ mode: "create" }} />;
}
