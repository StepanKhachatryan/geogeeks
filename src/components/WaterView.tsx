'use client';

import { createRealtimeClient, type SealedLiveQuery } from '@neon/realtime/client';
import { RealtimeProvider, useLiveQuery } from '@neon/realtime-react';
import { useEffect, useState, useSyncExternalStore } from 'react';
import {
  health,
  layers,
  realtimeConfigured,
  REALTIME_URL,
  sealedLayers,
  waterConfigured,
  type LayerRow,
} from '@/lib/water';
import styles from './WaterView.module.css';

const KIND_LABEL: Record<string, string> = {
  river: 'Գետեր',
  lake: 'Լճեր',
  canal: 'Ջրանցքներ',
};

/** False while prerendering, true in the browser: the client opens a socket. */
const subscribeNothing = () => () => {};
function useMounted() {
  return useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );
}

function Rows({ rows }: { rows: readonly LayerRow[] }) {
  if (rows.length === 0) return <p className={styles.empty}>Շերտեր դեռ չեն բեռնվել:</p>;
  return (
    <ul className={styles.rows}>
      {rows.map((row) => (
        <li key={row.kind}>
          <span>{KIND_LABEL[row.kind] ?? row.kind}</span>
          <strong>{row.features.toLocaleString('hy-AM')}</strong>
        </li>
      ))}
    </ul>
  );
}

/** Realtime: the same counts, but pushed when the table changes. */
function LiveLayers({ sealed }: { sealed: SealedLiveQuery<LayerRow> }) {
  const [client] = useState(() => createRealtimeClient({ url: REALTIME_URL }));
  return (
    <RealtimeProvider client={client}>
      <LiveRows sealed={sealed} />
    </RealtimeProvider>
  );
}

function LiveRows({ sealed }: { sealed: SealedLiveQuery<LayerRow> }) {
  const { data, status } = useLiveQuery(sealed);
  return (
    <>
      <p className={styles.state}>Realtime: {status}</p>
      <Rows rows={data ?? []} />
    </>
  );
}

export function WaterView() {
  const mounted = useMounted();
  const [postgis, setPostgis] = useState<string | null>(null);
  const [rows, setRows] = useState<LayerRow[] | null>(null);
  const [sealed, setSealed] = useState<SealedLiveQuery<LayerRow> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!waterConfigured) return;
    let cancelled = false;

    void (async () => {
      try {
        const [up, loaded] = await Promise.all([health(), layers()]);
        if (cancelled) return;
        setPostgis(up.postgis);
        setRows(loaded.layers);
        if (realtimeConfigured) {
          setSealed(await sealedLayers<SealedLiveQuery<LayerRow>>());
        }
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : String(cause));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!waterConfigured) {
    return (
      <section className="gg-section">
        <div className="gg-inner">
          <h1 className={styles.title}>Ջրային շերտեր</h1>
          <p className={styles.note}>
            Backend-ը կարգավորված չէ։ Գործարկեք <code>neon deploy</code>, որպեսզի{' '}
            <code>NEON_FUNCTION_WATER_BASE_URL</code> և <code>NEON_REALTIME_URL</code>{' '}
            փոփոխականները գրվեն <code>.env.local</code>-ում, ապա վերակառուցեք կայքը:
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="gg-section">
      <div className="gg-inner">
        <h1 className={styles.title}>Ջրային շերտեր</h1>
        <p className={styles.note}>
          Տվյալները մնում են բազայում. այս էջը ստանում է միայն քանակները, իսկ քարտեզը՝
          սալիկներ:
        </p>

        {error && <p className={styles.error}>{error}</p>}
        {postgis && <p className={styles.state}>PostGIS {postgis.split(' ')[0]}</p>}

        <h2 className={styles.heading}>Postgres</h2>
        {rows ? <Rows rows={rows} /> : <p className={styles.empty}>Բեռնվում է…</p>}

        {realtimeConfigured && (
          <>
            <h2 className={styles.heading}>Realtime</h2>
            {mounted && sealed ? (
              <LiveLayers sealed={sealed} />
            ) : (
              <p className={styles.empty}>Միանում է…</p>
            )}
          </>
        )}
      </div>
    </section>
  );
}
