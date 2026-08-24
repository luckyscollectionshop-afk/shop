const indianProducts = [
  {
    name: "Pearl Jhumka Earrings",
    price: "CHF 39",
    badge: "NEW",
  },
  {
    name: "Traditional Gold Jhumka",
    price: "CHF 49",
    badge: "BESTSELLER",
  },
  {
    name: "Kundan Necklace",
    price: "CHF 69",
    badge: "NEW",
  },
  {
    name: "Temple Jewellery Set",
    price: "CHF 89",
    badge: "LIMITED",
  },
];

const foodProducts = [
  {
    name: "Mango Pickle",
    price: "CHF 8",
    badge: "NEW",
  },
  {
    name: "South Indian Spice Mix",
    price: "CHF 6",
    badge: "BESTSELLER",
  },
  {
    name: "Murukku",
    price: "CHF 7",
    badge: "SALE",
  },
  {
    name: "Homemade Sambar Powder",
    price: "CHF 6",
    badge: "NEW",
  },
];

function ProductCard({
  product,
}: {
  product: {
    name: string;
    price: string;
    badge: string;
  };
}) {
  return (
    <div className="group min-w-[240px] max-w-[240px] shrink-0">
      <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-[#f1eee8]">
        <div className="absolute left-3 top-3 z-10 bg-[#b89b5e] px-3 py-1 text-[10px] font-medium tracking-[0.18em] text-white">
          {product.badge}
        </div>

        <div className="flex h-full items-center justify-center text-sm tracking-widest text-[#aaa39a]">
          PRODUCT IMAGE
        </div>
      </div>

      <div className="mt-4">
        <h3 className="text-sm tracking-wide text-[#292722]">
          {product.name}
        </h3>

        <p className="mt-1 text-sm text-[#756f65]">{product.price}</p>
      </div>
    </div>
  );
}

function ProductSection({
  title,
  products,
}: {
  title: string;
  products: typeof indianProducts;
}) {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.3em] text-[#b89b5e]">
              Discover
            </p>

            <h2 className="font-serif text-3xl text-[#292722] md:text-4xl">
              {title}
            </h2>
          </div>

          <button className="hidden text-xs uppercase tracking-[0.2em] text-[#756f65] transition hover:text-[#b89b5e] sm:block">
            View All →
          </button>
        </div>

        <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide">
          {products.map((product) => (
            <ProductCard key={product.name} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-[#faf8f4] text-[#292722]">
      {/* Navigation */}
      <header className="border-b border-[#e8e2d8] bg-[#faf8f4]">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <div className="font-serif text-2xl tracking-wide">
            Lucky&apos;s Collection
          </div>

          <nav className="hidden items-center gap-8 text-xs uppercase tracking-[0.18em] text-[#756f65] md:flex">
            <a href="#" className="transition hover:text-[#b89b5e]">
              Home
            </a>
            <a href="#" className="transition hover:text-[#b89b5e]">
              Indian Store
            </a>
            <a href="#" className="transition hover:text-[#b89b5e]">
              Food
            </a>
            <a href="#" className="transition hover:text-[#b89b5e]">
              About
            </a>
          </nav>

          <div className="flex items-center gap-5 text-sm">
            <button aria-label="Search">⌕</button>
            <button aria-label="Shopping bag">♡</button>
            <button aria-label="Cart">🛍</button>
            <form action="/auth/signout" method="POST">
  <button
    type="submit"
    className="text-xs uppercase tracking-widest"
  >
    Sign Out
  </button>
</form>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative flex min-h-[620px] items-center overflow-hidden bg-[#eee8dd]">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-6 py-20 md:grid-cols-2">
          <div className="max-w-xl">
            <p className="mb-5 text-xs font-medium uppercase tracking-[0.35em] text-[#b89b5e]">
              Curated with love
            </p>

            <h1 className="font-serif text-5xl leading-[1.05] text-[#292722] md:text-7xl">
              Something beautiful,
              <br />
              just for you.
            </h1>

            <p className="mt-7 max-w-md text-base leading-7 text-[#756f65]">
              Discover a beautiful collection of Indian jewellery, traditional
              treasures and delicious favourites, thoughtfully brought
              together for you.
            </p>

            <button className="mt-9 border border-[#292722] px-7 py-3 text-xs uppercase tracking-[0.2em] transition hover:bg-[#292722] hover:text-white">
              Explore Collection
            </button>
          </div>

          <div className="flex aspect-[4/5] items-center justify-center bg-[#e2d9ca]">
            <span className="text-xs tracking-[0.3em] text-[#aaa095]">
              HERO IMAGE
            </span>
          </div>
        </div>
      </section>

      {/* Product sections */}
      <ProductSection title="Indian Store" products={indianProducts} />

      <div className="border-t border-[#e8e2d8]" />

      <ProductSection title="Food Items" products={foodProducts} />

      {/* Footer */}
      <footer className="border-t border-[#e8e2d8] py-12">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <p className="font-serif text-xl">Lucky&apos;s Collection</p>
          <p className="mt-2 text-xs tracking-widest text-[#756f65]">
            BEAUTY • TRADITION • TASTE
          </p>
        </div>
      </footer>
    </main>
  );
}