'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { useLanguage } from '@/i18n/LanguageProvider';
import type { MessageKey } from '@/i18n/messages';
import type { Shapefile } from '@/lib/shapefile';
import {
  convert,
  DEFAULT_OPTIONS,
  errorKey,
  readShapefiles,
  type ConvertOptions,
  type ConvertResult,
} from '@/lib/shpToDxf';
import styles from './ShpToDxfTool.module.css';

type Loaded = { fileName: string; files: { name: string; data: Shapefile }[] };

/** JSZip is only fetched once someone actually converts something. */
async function unzip(file: File) {
  const { default: JSZip } = await import('jszip');
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

export function ShpToDxfTool() {
  const { t, lang } = useLanguage();
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
    setBusy(true);
    try {
      const files = readShapefiles(await unzip(file));
      setLoaded({ fileName: file.name, files });
      setOptions({ ...DEFAULT_OPTIONS, useZ: files.some(({ data }) => data.hasZ) });
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
      return convert(loaded.files, options);
    } catch {
      return null;
    }
  }, [loaded, options]);

  const fields = useMemo(() => {
    if (!loaded) return [];
    const names = new Set<string>();
    loaded.files.forEach(({ data }) =>
      data.fields.forEach((field) => {
        if (field.type === 'C' || field.type === 'N') names.add(field.name);
      }),
    );
    return [...names];
  }, [loaded]);

  const hasZ = loaded?.files.some(({ data }) => data.hasZ) ?? false;
  const projection = loaded?.files.map(({ data }) => data.projection).find(Boolean);

  const download = () => {
    if (!result || !loaded) return;
    const blob = new Blob([result.dxf], { type: 'application/dxf' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = `${loaded.fileName.replace(/\.zip$/i, '')}.dxf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(href);
  };

  const number = (value: number) => value.toLocaleString(lang === 'en' ? 'en-US' : 'hy-AM');

  return (
    <div className={styles.tool}>
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
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#0c8495" strokeWidth="1.6">
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
              <h3 className={styles.sectionTitle}>{t('tool.options')}</h3>

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
                    <span>{mode === 'polyline' ? t('tool.modePolyline') : t('tool.modeLine')}</span>
                  </label>
                ))}
              </fieldset>

              <fieldset className={styles.group}>
                <legend className={styles.legend}>{t('tool.layer')}</legend>
                <label className={styles.choice}>
                  <input
                    type="radio"
                    name="layer"
                    checked={options.layerBy === 'file'}
                    onChange={() => setOptions((current) => ({ ...current, layerBy: 'file' }))}
                  />
                  <span>{t('tool.layerFile')}</span>
                </label>
                <label className={`${styles.choice} ${fields.length === 0 ? styles.disabled : ''}`}>
                  <input
                    type="radio"
                    name="layer"
                    disabled={fields.length === 0}
                    checked={options.layerBy === 'field'}
                    onChange={() =>
                      setOptions((current) => ({
                        ...current,
                        layerBy: 'field',
                        layerField: current.layerField ?? fields[0],
                      }))
                    }
                  />
                  <span>{t('tool.layerField')}</span>
                </label>
                {options.layerBy === 'field' && fields.length > 0 && (
                  <select
                    className={styles.select}
                    value={options.layerField ?? fields[0]}
                    onChange={(event) =>
                      setOptions((current) => ({ ...current, layerField: event.target.value }))
                    }
                  >
                    {fields.map((field) => (
                      <option key={field} value={field}>
                        {field}
                      </option>
                    ))}
                  </select>
                )}
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

              <button type="button" className={styles.primary} onClick={download}>
                {t('tool.download')}
              </button>
            </div>

            <div className={styles.summary}>
              <h3 className={styles.sectionTitle}>{t('tool.result')}</h3>
              <dl className={styles.stats}>
                <div>
                  <dt>{t('tool.geometry')}</dt>
                  <dd>
                    {loaded.files[0].data.kind === 'polygon' ? t('tool.polygon') : t('tool.polyline')}
                  </dd>
                </div>
                <div>
                  <dt>{t('tool.features')}</dt>
                  <dd>{number(result.sources.reduce((total, source) => total + source.features, 0))}</dd>
                </div>
                <div>
                  <dt>{t('tool.rings')}</dt>
                  <dd>{number(result.sources.reduce((total, source) => total + source.rings, 0))}</dd>
                </div>
                <div>
                  <dt>{t('tool.entities')}</dt>
                  <dd>{number(result.entities)}</dd>
                </div>
                <div>
                  <dt>{t('tool.layers')}</dt>
                  <dd>{number(result.layers.length)}</dd>
                </div>
                <div>
                  <dt>{t('tool.crs')}</dt>
                  <dd>{crsName(projection) ?? t('tool.crsUnknown')}</dd>
                </div>
              </dl>
              <p className={styles.note}>{t('tool.crsNote')}</p>
              {result.sources.some((source) => source.skipped > 0) && (
                <p className={styles.note}>
                  {t('tool.skipped')}:{' '}
                  {number(result.sources.reduce((total, source) => total + source.skipped, 0))}
                </p>
              )}
              <ul className={styles.files}>
                {result.sources.map((source) => (
                  <li key={source.name}>
                    <strong>{source.name}</strong> — {number(source.features)} / {number(source.rings)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
