/**
 * Turns the shapefiles inside a cadastre `.zip` into DXF drawings.
 *
 * A cadastre extract carries a parcel layer and, where there are buildings, a
 * building layer. Each recognised layer produces two drawings: one with the
 * boundaries as lines, one with the boundary vertices as points.
 *
 * Polygon rings become closed entities, holes included: in CAD they are
 * boundaries too. Coordinates pass through untouched, in whatever system the
 * shapefile was surveyed in.
 */

import { layerName, writeDxf, type DxfPoint, type Point } from './dxf';
import { parseShapefile, ShapefileError, type Shapefile } from './shapefile';

export type ZipEntries = Record<string, Uint8Array>;

/** The layers an Armenian cadastre extract is expected to contain. */
export const EXPECTED_LAYERS = ['parcel', 'building'] as const;
export type ExpectedLayer = (typeof EXPECTED_LAYERS)[number];

/** Uploads above this size are refused and pointed at the contact address. */
export const MAX_ZIP_BYTES = 7 * 1024 * 1024;

export type ConvertOptions = {
  /** One object per ring, or one object per segment. */
  mode: 'polyline' | 'line';
  useZ: boolean;
};

export type LayerSummary = {
  layer: ExpectedLayer;
  /** File name inside the archive, for the report. */
  source: string;
  kind: 'polygon' | 'polyline';
  features: number;
  rings: number;
  vertices: number;
  hasZ: boolean;
  projection?: string;
  skipped: number;
};

export type OutputFile = { name: string; content: string };

export type ConvertResult = {
  files: OutputFile[];
  layers: LayerSummary[];
  entities: number;
  vertices: number;
};

export const DEFAULT_OPTIONS: ConvertOptions = { mode: 'polyline', useZ: false };

export type LoadedLayer = { layer: ExpectedLayer; source: string; data: Shapefile };

/**
 * The archive's own name, made safe to write to disk. The drawings are named
 * after it because `parcel_lines.dxf` says nothing once it has been unzipped
 * next to another plot's `parcel_lines.dxf`.
 */
export function outputBase(zipName: string): string {
  const stem = (zipName.split(/[\\/]/).pop() ?? '').replace(/\.zip$/i, '');
  const safe = stem
    // Reserved on Windows, awkward everywhere; spaces break command lines.
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^[._]+|[._]+$/g, '');
  return safe.slice(0, 60) || 'cadastre';
}

/** Matches a member of the archive against the expected cadastre layer names. */
function classify(base: string): ExpectedLayer | null {
  const name = base.split('/').pop()?.toLowerCase() ?? '';
  return EXPECTED_LAYERS.find((layer) => name.includes(layer)) ?? null;
}

/** Groups the archive's members into one entry per shapefile base name. */
export function collectShapefiles(entries: ZipEntries) {
  const groups = new Map<
    string,
    { shp?: Uint8Array; dbf?: Uint8Array; prj?: Uint8Array; cpg?: Uint8Array }
  >();

  Object.entries(entries).forEach(([path, bytes]) => {
    // Skip the metadata folder macOS adds when compressing from Finder.
    if (path.includes('__MACOSX/') || path.split('/').pop()?.startsWith('._')) return;
    const match = /^(.*)\.(shp|dbf|prj|cpg)$/i.exec(path);
    if (!match) return;
    const [, base, extension] = match;
    const group = groups.get(base) ?? {};
    group[extension.toLowerCase() as 'shp' | 'dbf' | 'prj' | 'cpg'] = bytes;
    groups.set(base, group);
  });

  return [...groups.entries()]
    .filter(([, group]) => group.shp)
    .map(([base, group]) => ({ name: base.split('/').pop() || base, base, group }));
}

/**
 * Reads the parcel and building layers out of the archive. Either one may be
 * missing on its own — a plot with no buildings is normal — but an archive with
 * neither is not a cadastre extract.
 */
export function readShapefiles(entries: ZipEntries): LoadedLayer[] {
  const found = collectShapefiles(entries);
  if (found.length === 0) throw new ShapefileError('NO_SHP_IN_ZIP');

  const text = new TextDecoder();
  const loaded: LoadedLayer[] = [];

  found.forEach(({ name, base, group }) => {
    const layer = classify(base);
    if (!layer || loaded.some((entry) => entry.layer === layer)) return;
    loaded.push({
      layer,
      source: name,
      data: parseShapefile({
        shp: group.shp as Uint8Array,
        dbf: group.dbf,
        prj: group.prj ? text.decode(group.prj) : undefined,
        cpg: group.cpg ? text.decode(group.cpg) : undefined,
      }),
    });
  });

  if (loaded.length === 0) throw new ShapefileError('NO_EXPECTED_LAYERS');

  // parcel first, so the report and the file list read in a stable order.
  return loaded.sort(
    (a, b) => EXPECTED_LAYERS.indexOf(a.layer) - EXPECTED_LAYERS.indexOf(b.layer),
  );
}

/**
 * `prefix` is the uploaded archive's name, which every drawing is named after.
 */
export function convert(
  loaded: LoadedLayer[],
  options: ConvertOptions,
  prefix = '',
): ConvertResult {
  const stem = prefix ? `${prefix}_` : '';
  const files: OutputFile[] = [];
  const layers: LayerSummary[] = [];
  let entities = 0;
  let vertexTotal = 0;

  loaded.forEach(({ layer, source, data }) => {
    const useZ = options.useZ && data.hasZ;
    const lineLayer = layerName(layer);
    const pointLayer = layerName(`${layer}_points`);

    const rings: { layer: string; points: Point[]; closed: boolean }[] = [];
    const seen = new Set<string>();
    const points: DxfPoint[] = [];

    data.features.forEach((feature) => {
      feature.parts.forEach((part) => {
        const ring = dropRepeats(part, data.kind === 'polygon');
        if (ring.length < 2) return;
        rings.push({ layer: lineLayer, points: ring, closed: data.kind === 'polygon' });
        ring.forEach((vertex) => {
          // One marker per distinct corner: neighbouring parcels share vertices.
          const key = `${vertex[0].toFixed(6)}|${vertex[1].toFixed(6)}|${useZ ? vertex[2].toFixed(6) : 0}`;
          if (seen.has(key)) return;
          seen.add(key);
          points.push({ layer: pointLayer, at: vertex });
        });
      });
    });

    if (rings.length === 0) return;

    const drawn =
      options.mode === 'line'
        ? rings.reduce((total, ring) => total + ring.points.length - (ring.closed ? 0 : 1), 0)
        : rings.length;
    entities += drawn;
    vertexTotal += points.length;

    files.push({
      name: `${stem}${layer}_lines.dxf`,
      content: writeDxf({ entities: rings, mode: options.mode, useZ }),
    });
    files.push({
      name: `${stem}${layer}_points.dxf`,
      content: writeDxf({ points, mode: options.mode, useZ }),
    });

    layers.push({
      layer,
      source,
      kind: data.kind,
      features: data.features.length,
      rings: rings.length,
      vertices: points.length,
      hasZ: data.hasZ,
      projection: data.projection,
      skipped: data.skipped,
    });
  });

  if (files.length === 0) throw new ShapefileError('NO_GEOMETRY');

  return { files, layers, entities, vertices: vertexTotal };
}

/**
 * Shapefile rings repeat their first point at the end; a closed DXF polyline
 * states the closure in a flag instead, so the duplicate has to go. Consecutive
 * duplicates anywhere in the ring are dropped for the same reason.
 */
function dropRepeats(part: Point[], closed: boolean): Point[] {
  const out: Point[] = [];
  part.forEach((current) => {
    const last = out[out.length - 1];
    if (last && last[0] === current[0] && last[1] === current[1] && last[2] === current[2]) return;
    out.push(current);
  });
  if (closed && out.length > 2) {
    const first = out[0];
    const last = out[out.length - 1];
    if (first[0] === last[0] && first[1] === last[1] && first[2] === last[2]) out.pop();
  }
  return out;
}

/** Message keys for the failures the converter raises. */
export function errorKey(error: unknown): string {
  if (!(error instanceof ShapefileError)) return 'tool.error.generic';
  const [code] = error.message.split(':');
  switch (code) {
    case 'NO_SHP_IN_ZIP':
      return 'tool.error.noShp';
    case 'NO_EXPECTED_LAYERS':
      return 'tool.error.layers';
    case 'NO_GEOMETRY':
      return 'tool.error.noGeometry';
    case 'UNSUPPORTED_TYPE':
      return 'tool.error.unsupported';
    case 'EMPTY_SHP':
    case 'NOT_A_SHP':
      return 'tool.error.badShp';
    default:
      return 'tool.error.generic';
  }
}
