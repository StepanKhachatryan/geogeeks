'use client';

import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { useLanguage } from '@/i18n/LanguageProvider';
import type { MessageKey } from '@/i18n/messages';
import {
  convert,
  DEFAULT_OPTIONS,
  errorKey,
  MAX_ZIP_BYTES,
  readShapefiles,
  type ConvertOptions,
  type ConvertResult,
  type LoadedLayer,
} from '@/lib/shpToDxf';
import { unlockConfig } from '@/lib/unlock';
import { UnlockGate } from './UnlockGate';
import styles from './ShpToDxfTool.module.css';

type Loaded = { fileName: string; layers: LoadedLayer[] };

/** JSZip is only fetched once someone actually converts something. */
async function jsZip() {
  const { default: JSZip } = await import('jszip');
  return JSZip;
}

async function unzip(file: File) {
  const JSZip = await jsZip();
  const zip = await JSZip.loadAsync(file);
  const entries: Record<string, Uint8Array> = {};
  await Promise.all(
    Object.values(zip.files)
      .filter((entry) => !entry.dir)
      .map(async (entry) => {
        entries[entry.name] = await entry.async('uint8array');
      }),
  );
  return entries;
}

/** The name a `.prj` gives its coordinate system, without the rest of the WKT. */
function crsName(wkt?: string): string | undefined {
  if (!wkt) return undefined;
  const match = /^\s*(?:PROJCS|GEOGCS|PROJCRS|GEOGCRS)\s*\[\s*"([^"]+)"/i.exec(wkt);
  return match ? match[1].replace(/_/g, ' ') : undefined;
}

const LATIN_NAME = /^[\w\s().,+-]+$/;

/** Off unless the deployment sets both the flag and the verification endpoint. */
const unlock = unlockConfig();
const GATED = unlock.required && Boolean(unlock.endpoint);

export function ShpToDxfTool({ guide }: { guide?: ReactNode }) {
  const { t, lang } = useLanguage();
  const [paid, setPaid] = useState(!GATED);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [options, setOptions] = useState<ConvertOptions>(DEFAULT_OPTIONS);
  const [error, setError] = useState<MessageKey | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const accept = useCallback(async (file: File) => {
    setError(null);
    if (!/\.zip$/i.test(file.name) && file.type !== 'application/zip') {
      setError('tool.error.notZip');
      return;
    }
    if (file.size > MAX_ZIP_BYTES) {
      setError('tool.error.tooBig');
      return;
    }
    setBusy(true);
    try {
      const layers = readShapefiles(await unzip(file));
      setLoaded({ fileName: file.name, layers });
      setOptions({ ...DEFAULT_OPTIONS, useZ: layers.some(({ data }) => data.hasZ) });
    } catch (cause) {
      setLoaded(null);
      setError(errorKey(cause) as MessageKey);
    } finally {
      setBusy(false);
    }
  }, []);

  const result = useMemo<ConvertResult | null>(() => {
    if (!loaded) return null;
    try {
      return convert(loaded.layers, options);
    } catch {
      return null;
    }
  }, [loaded, options]);

  const hasZ = loaded?.layers.some(({ data }) => data.hasZ) ?? false;
  const projection = loaded?.layers.map(({ data }) => data.projection).find(Boolean);
  const notices: MessageKey[] = [];
  if (loaded && result) {
    if (!LATIN_NAME.test(loaded.fileName.replace(/\.zip$/i, ''))) notices.push('tool.noticeLatin');
    if (!result.layers.some((layer) => layer.layer === 'building')) {
      notices.push('tool.noticeNoBuilding');
    }
    if (!result.layers.some((layer) => layer.layer === 'parcel')) {
      notices.push('tool.noticeNoParcel');
    }
  }

  const download = async () => {
    if (!result || !loaded) return;
    const base = loaded.fileName.replace(/\.zip$/i, '') || 'cadastre';
    const JSZip = await jsZip();
    const zip = new JSZip();
    result.files.forEach((file) => zip.file(file.name, file.content));
    const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });

    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = `${base}_dxf.zip`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(href);
  };

  const number = (value: number) => value.toLocaleString(lang === 'en' ? 'en-US' : 'hy-AM');

  return (
    <div className={styles.layout}>
      <div className={styles.main}>
        {!loaded && (
          <div
            className={`${styles.drop} ${dragging ? styles.dropActive : ''}`}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              const file = event.dataTransfer.files[0];
              if (file) void accept(file);
            }}
          >
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#0c8495"
              strokeWidth="1.6"
            >
              <path d="M12 16V4" />
              <path d="M7 9l5-5 5 5" />
              <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
            </svg>
            <p className={styles.dropText}>{busy ? t('tool.reading') : t('tool.drop')}</p>
            <button type="button" className={styles.primary} onClick={() => input.current?.click()}>
              {t('tool.browse')}
            </button>
            <input
              ref={input}
              type="file"
              accept=".zip,application/zip"
              className={styles.input}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void accept(file);
                event.target.value = '';
              }}
            />
            <p className={styles.limit}>{t('tool.limit')}</p>
            <p className={styles.privacy}>{t('tool.privacy')}</p>
          </div>
        )}

        {error && <p className={styles.error}>{t(error)}</p>}

        {loaded && result && (
          <div className={styles.panel}>
            <div className={styles.head}>
              <div>
                <span className={styles.label}>{t('tool.file')}</span>
                <p className={styles.fileName}>{loaded.fileName}</p>
              </div>
              <button
                type="button"
                className={styles.secondary}
                onClick={() => {
                  setLoaded(null);
                  setError(null);
                }}
              >
                {t('tool.reset')}
              </button>
            </div>

            <div className={styles.columns}>
              <div className={styles.options}>
                <h2 className={styles.sectionTitle}>{t('tool.options')}</h2>

                <fieldset className={styles.group}>
                  <legend className={styles.legend}>{t('tool.mode')}</legend>
                  {(['polyline', 'line'] as const).map((mode) => (
                    <label key={mode} className={styles.choice}>
                      <input
                        type="radio"
                        name="mode"
                        checked={options.mode === mode}
                        onChange={() => setOptions((current) => ({ ...current, mode }))}
                      />
                      <span>
                        {mode === 'polyline' ? t('tool.modePolyline') : t('tool.modeLine')}
                      </span>
                    </label>
                  ))}
                </fieldset>

                <label className={`${styles.choice} ${hasZ ? '' : styles.disabled}`}>
                  <input
                    type="checkbox"
                    disabled={!hasZ}
                    checked={options.useZ && hasZ}
                    onChange={(event) =>
                      setOptions((current) => ({ ...current, useZ: event.target.checked }))
                    }
                  />
                  <span>{hasZ ? t('tool.z') : t('tool.noZ')}</span>
                </label>
              </div>

              <div className={styles.summary}>
                <h2 className={styles.sectionTitle}>{t('tool.result')}</h2>

                {/* Narrow screens scroll the table rather than clipping a column. */}
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th scope="col">{t('tool.files')}</th>
                        <th scope="col">{t('tool.features')}</th>
                        <th scope="col">{t('tool.rings')}</th>
                        <th scope="col">{t('tool.vertices')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.layers.map((layer) => (
                        <tr key={layer.layer}>
                          <th scope="row">
                            {layer.layer === 'parcel'
                              ? t('tool.layerParcel')
                              : t('tool.layerBuilding')}
                          </th>
                          <td>{number(layer.features)}</td>
                          <td>{number(layer.rings)}</td>
                          <td>{number(layer.vertices)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <dl className={styles.stats}>
                  <div>
                    <dt>{t('tool.entities')}</dt>
                    <dd>{number(result.entities)}</dd>
                  </div>
                  <div>
                    <dt>{t('tool.crs')}</dt>
                    <dd>{crsName(projection) ?? t('tool.crsUnknown')}</dd>
                  </div>
                </dl>

                <p className={styles.note}>{t('tool.crsNote')}</p>
                {notices.map((notice) => (
                  <p key={notice} className={styles.notice}>
                    {t(notice)}
                  </p>
                ))}
                {result.layers.some((layer) => layer.skipped > 0) && (
                  <p className={styles.note}>
                    {t('tool.skipped')}:{' '}
                    {number(result.layers.reduce((total, layer) => total + layer.skipped, 0))}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <aside className={styles.side}>
        {paid ? (
          <div className={styles.deliver}>
            <h2 className={styles.sectionTitle}>{t('tool.files')}</h2>
            <button
              type="button"
              className={styles.primary}
              disabled={!result}
              onClick={() => void download()}
            >
              {t('tool.download')}
            </button>
            {result ? (
              <ul className={styles.outputs}>
                {result.files.map((file) => (
                  <li key={file.name}>{file.name}</li>
                ))}
              </ul>
            ) : (
              <p className={styles.note}>{t('tool.downloadHint')}</p>
            )}
          </div>
        ) : (
          <UnlockGate
            config={unlock}
            onUnlocked={() => {
              setPaid(true);
              void download();
            }}
          />
        )}
        {guide}
      </aside>
    </div>
  );
}
