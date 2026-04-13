// ── Home Page ──────────────────────────────────────────────────────────────────
import { PageWrapper } from "../components/layout/PageWrapper";
import HeroBanner from "../components/ui/HeroBanner";
import SectionHeader from "../components/ui/SectionHeader";
import ProductCard from "../components/ui/ProductCard";
import { useGetProductsQuery } from "../features/storefront/api";

// ── Product Grid ───────────────────────────────────────────────────────────────
function ProductGrid({ params }: { params: Parameters<typeof useGetProductsQuery>[0] }) {
  const { data, isLoading, isError } = useGetProductsQuery(params);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 px-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card-bg rounded-xl h-64 animate-pulse" />
        ))}
      </div>
    );
  }

  if (isError || !data?.items.length) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 px-4">
      {data.items.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────────
export function HomePage() {
  return (
    <PageWrapper>

      {/* ── Hero Banner ─────────────────────────────────────────────────────── */}
      <HeroBanner />

      {/* ── Discounts Section ───────────────────────────────────────────────── */}
      <div className="mt-5">
        <SectionHeader
          title="Скидки"
          linkTo="/catalog?has_discount=true"
        />
        <ProductGrid params={{ has_discount: true, page_size: 6 }} />
      </div>

      {/* ── Best Sellers Section ─────────────────────────────────────────────── */}
      <div className="mt-5">
        <SectionHeader
          title="Хит продаж"
          linkTo="/catalog"
        />
        <ProductGrid params={{ page_size: 8 }} />
      </div>

    </PageWrapper>
  );
}
