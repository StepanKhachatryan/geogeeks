import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="gg-section">
      <div className="gg-inner" style={{ paddingBlock: 'clamp(40px, 8vw, 120px)' }}>
        <h1 style={{ fontSize: 'clamp(26px, 3.4vw, 44px)', margin: '0 0 12px', letterSpacing: '-0.02em' }}>
          404
        </h1>
        <p style={{ margin: '0 0 24px', color: 'var(--gg-warm-grey)' }}>
          Էջը չի գտնվել: / Page not found.
        </p>
        <Link href="/" className="gg-back">
          GeoGeeks
        </Link>
      </div>
    </section>
  );
}
