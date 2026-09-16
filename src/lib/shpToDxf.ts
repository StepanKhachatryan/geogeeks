/**
 * Turns the shapefiles inside a `.zip` into one DXF drawing.
 *
 * Polygon rings become closed entities, so a polygon arrives in CAD as its
 * boundary lines. Holes are kept: they are boundaries too. Coordinates pass
 * through untouched, in whatever system the shapefile was surveyed in.
 */

import { layerName, writeDxf, type DxfEntity, type Point } from './dxf';
import { parseShapefile, ShapefileError, type Shapefile } from './shapefile';

export type ZipEntries = Record<string, Uint8Array>;

export type ConvertOptions = {
  /** One object per ring, or one object per segment. */
  mode: 'polyline' | 'line';
  /** Layer per source file, or per value of `layerField`. */
  layerBy: 'file' | 'field';
  layerField?: string;
  useZ: boolean;
};

export type SourceSummary = {
  name: string;
  kind: 'polygon' | 'polyline';
  features: number;
  rings: number;
  points: number;
  hasZ: boolean;
  fields: { name: string; type: string }[];
  projection?: string;
  skipped: number;
};

export type ConvertResult = {
  dxf: string;
  entities: number;
  layers: string[];
  sources: SourceSummary[];
  bbox: { xmin: number; ymin: number; xmax: number; ymax: number };
};

export const DEFAULT_OPTIONS: ConvertOptions = {
  mode: 'polyline',
  layerBy: 'file',
  useZ: false,
};

/** Groups the archive's members into one entry per shapefile base name. */
export function collectShapefiles(entries: ZipEntries) {
  const groups = new Map<string, { shp?: Uint8Array; dbf?: Uint8Array; prj?: Uint8Array; cpg?: Uint8Array }>();

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
    .map(([base, group]) => ({ name: base.split('/').pop() || base, group }));
}

/** Reads the shapefiles without converting, so the UI can offer real choices. */
export function readShapefiles(entries: ZipEntries): { name: string; data: Shapefile }[] {
  const found = collectShapefiles(entries);
  if (found.length === 0) throw new ShapefileError('NO_SHP_IN_ZIP');

  const text = new TextDecoder();
  return found.map(({ name, group }) => ({
    name,
    data: parseShapefile({
      shp: group.shp as Uint8Array,
      dbf: group.dbf,
      prj: group.prj ? text.decode(group.prj) : undefined,
      cpg: group.cpg ? text.decode(group.cpg) : undefined,
    }),
  }));
}

export function convert(
  files: { name: string; data: Shapefile }[],
  options: ConvertOptions,
): ConvertResult {
  const entities: DxfEntity[] = [];
  const sources: SourceSummary[] = [];
  const bbox = { xmin: Infinity, ymin: Infinity, xmax: -Infinity, ymax: -Infinity };

  files.forEach(({ name, data }) => {
    const fallbackLayer = layerName(name);
    let rings = 0;
    let points = 0;

    data.features.forEach((feature) => {
      const layer =
        options.layerBy === 'field' && options.layerField
          ? layerName(String(feature.attributes[options.layerField] ?? ''), fallbackLayer)
          : fallbackLayer;

      feature.parts.forEach((part) => {
        const cleaned = dropRepeats(part, data.kind === 'polygon');
        if (cleaned.length < 2) return;
        rings += 1;
        points += cleaned.length;
        cleaned.forEach(([x, y]) => {
          if (x < bbox.xmin) bbox.xmin = x;
          if (y < bbox.ymin) bbox.ymin = y;
          if (x > bbox.xmax) bbox.xmax = x;
          if (y > bbox.ymax) bbox.ymax = y;
        });
        entities.push({ layer, points: cleaned, closed: data.kind === 'polygon' });
      });
    });

    sources.push({
      name,
      kind: data.kind,
      features: data.features.length,
      rings,
      points,
      hasZ: data.hasZ,
      fields: data.fields,
      projection: data.projection,
      skipped: data.skipped,
    });
  });

  if (entities.length === 0) throw new ShapefileError('NO_GEOMETRY');

  const useZ = options.useZ && files.some(({ data }) => data.hasZ);
  const dxf = writeDxf({ entities, mode: options.mode, useZ });
  const drawn =
    options.mode === 'line'
      ? entities.reduce((total, entity) => total + entity.points.length - (entity.closed ? 0 : 1), 0)
      : entities.length;

  return {
    dxf,
    entities: drawn,
    layers: [...new Set(entities.map((entity) => entity.layer))],
    sources,
    bbox,
  };
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
