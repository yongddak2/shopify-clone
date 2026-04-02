import Link from "next/link";

const bestProducts = [
  { id: 1, name: "오버사이즈 코튼 티셔츠", price: 39000 },
  { id: 2, name: "와이드 데님 팬츠", price: 69000 },
  { id: 3, name: "린넨 블렌드 셔츠", price: 59000 },
  { id: 4, name: "크롭 카디건", price: 49000 },
  { id: 5, name: "미니멀 슬랙스", price: 55000 },
  { id: 6, name: "코튼 후드 집업", price: 65000 },
  { id: 7, name: "스트라이프 니트", price: 58000 },
  { id: 8, name: "테일러드 재킷", price: 89000 },
];

function formatPrice(price: number) {
  return price.toLocaleString("ko-KR");
}

export default function Home() {
  return (
    <>
      {/* 히어로 섹션 */}
      <section className="relative h-[80vh] bg-[var(--section-bg)] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-5xl md:text-7xl font-light tracking-[0.3em] mb-8 text-[var(--text-primary)]">
            SHOPIFY
          </h1>
          <p className="text-sm tracking-widest text-[var(--text-muted)] mb-10">
            MINIMAL CLOTHING STORE
          </p>
          <Link
            href="/products"
            className="inline-block bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] text-xs tracking-[0.2em] px-10 py-4 hover:bg-[var(--btn-primary-hover)] transition-colors"
          >
            SHOP NOW
          </Link>
        </div>
      </section>

      {/* BEST 상품 섹션 */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-20">
        <h2 className="text-center text-2xl tracking-[0.2em] font-light mb-14 text-[var(--text-primary)]">
          BEST
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-10">
          {bestProducts.map((product) => (
            <Link key={product.id} href={`/products/${product.id}`} className="group">
              {/* 이미지 placeholder */}
              <div className="aspect-[3/4] bg-[var(--card-bg)] mb-4 overflow-hidden">
                <div className="w-full h-full bg-[var(--section-bg)] group-hover:scale-105 transition-transform duration-500" />
              </div>
              <p className="text-sm text-[var(--text-secondary)] mb-1">{product.name}</p>
              <p className="text-sm text-[var(--text-muted)]">
                {formatPrice(product.price)}원
              </p>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
