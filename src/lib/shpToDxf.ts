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

import { layerName, writeDxf, type DxfPoint, type DxfText, type Point } from './dxf';
import { parseShapefile, ShapefileError, type Feature, type Shapefile } from './shapefile';

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

/**
 * The cadastre code, as the register writes it: region, community, block and
 * parcel, and for a building the unit within that parcel -- 01-011-0564-0019-002.
 * The widths are the register's own; a value already that wide is left alone,
 * and one that is wider is never cut, since a truncated code is a wrong code.
 */
const CODE_FIELDS: { name: string; width: number }[] = [
  { name: 'RGN_CC', width: 2 },
  { name: 'CMM_CC', width: 3 },
  { name: 'BLK_CC', width: 4 },
  { name: 'PRC_CC', width: 4 },
];
const BUILDING_FIELD = { name: 'BLD_CC', width: 3 };

function attribute(feature: Feature, name: string): string {
  const key = Object.keys(feature.attributes).find(
    (candidate) => candidate.toUpperCase() === name,
  );
  if (key === undefined) return '';
  const value = feature.attributes[key];
  return value === null || value === undefined ? '' : String(value).trim();
}

/**
 * Builds the code, or nothing at all: a partial code read off a drawing is
 * worse than no code, because it looks like a whole one.
 */
export function cadastreCode(feature: Feature, layer: ExpectedLayer): string {
  const fields = layer === 'building' ? [...CODE_FIELDS, BUILDING_FIELD] : CODE_FIELDS;
  const parts: string[] = [];

  for (const field of fields) {
    const raw = attribute(feature, field.name);
    // A building with no unit number is still a building on a known parcel.
    if (!raw) {
      if (field.name === BUILDING_FIELD.name) break;
      return '';
    }
    parts.push(raw.padStart(field.width, '0'));
  }

  return parts.length >= CODE_FIELDS.length ? parts.join('-') : '';
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
    // Its own layer, so the codes can be turned off, restyled or resized in CAD
    // without touching the geometry.
    const codeLayer = layerName(`${layer}_codes`);

    const rings: { layer: string; points: Point[]; closed: boolean }[] = [];
    const seen = new Set<string>();
    const points: DxfPoint[] = [];
    const texts: DxfText[] = [];

    data.features.forEach((feature) => {
      const own: Point[][] = [];

      feature.parts.forEach((part) => {
        const ring = dropRepeats(part, data.kind === 'polygon');
        if (ring.length < 2) return;
        own.push(ring);
        rings.push({ layer: lineLayer, points: ring, closed: data.kind === 'polygon' });
        ring.forEach((vertex) => {
          // One marker per distinct corner: neighbouring parcels share vertices.
          const key = `${vertex[0].toFixed(6)}|${vertex[1].toFixed(6)}|${useZ ? vertex[2].toFixed(6) : 0}`;
          if (seen.has(key)) return;
          seen.add(key);
          points.push({ layer: pointLayer, at: vertex });
        });
      });

      // One label per feature, on its largest ring: a parcel with a hole in it
      // is still one parcel, and its code belongs in the body, not the hole.
      const code = own.length > 0 ? cadastreCode(feature, layer) : '';
      if (!code) return;
      const ring = own.reduce((widest, candidate) =>
        span(candidate) > span(widest) ? candidate : widest,
      );
      texts.push({
        layer: codeLayer,
        at:
          data.kind === 'polygon'
            ? labelPoint(own, ring, useZ)
            : ring[Math.floor(ring.length / 2)],
        text: code,
        height: textHeight(ring, code.length),
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
      content: writeDxf({ entities: rings, texts, mode: options.mode, useZ }),
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

/** The longer side of a ring's bounding box, for picking the largest part. */
function span(ring: Point[]): number {
  const box = bounds(ring);
  return Math.max(box.width, box.height);
}

function bounds(ring: Point[]) {
  let minX = ring[0][0];
  let maxX = ring[0][0];
  let minY = ring[0][1];
  let maxY = ring[0][1];
  ring.forEach(([x, y]) => {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  });
  return { minX, maxX, minY, maxY, width: maxX - minX, height: maxY - minY };
}

/**
 * Area centroid of the ring, which for a concave parcel still lands inside it
 * far more often than the middle of its bounding box does. A ring with no area
 * -- a line, or a shape folded onto itself -- falls back to that middle.
 */
function centroid(ring: Point[], useZ: boolean): Point {
  let twiceArea = 0;
  let x = 0;
  let y = 0;

  for (let i = 0; i < ring.length; i += 1) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[(i + 1) % ring.length];
    const cross = x1 * y2 - x2 * y1;
    twiceArea += cross;
    x += (x1 + x2) * cross;
    y += (y1 + y2) * cross;
  }

  const z = useZ ? ring.reduce((total, point) => total + point[2], 0) / ring.length : 0;
  if (Math.abs(twiceArea) < 1e-9) {
    const box = bounds(ring);
    return [(box.minX + box.maxX) / 2, (box.minY + box.maxY) / 2, z];
  }
  return [x / (3 * twiceArea), y / (3 * twiceArea), z];
}

/**
 * Where to write the code. The area centroid is the natural answer, but a
 * parcel built around a courtyard has its centroid in the courtyard, and a code
 * printed in the hole reads as the hole's. So the horizontal line through the
 * centroid is cut by every ring of the feature, and the label goes in the
 * middle of the widest stretch that is inside the parcel and outside its holes
 * -- the same idea as PostGIS's point on surface.
 */
function labelPoint(rings: Point[][], outer: Point[], useZ: boolean): Point {
  const base = centroid(outer, useZ);
  const y = base[1];
  const crossings: number[] = [];

  rings.forEach((ring) => {
    for (let i = 0; i < ring.length; i += 1) {
      const [x1, y1] = ring[i];
      const [x2, y2] = ring[(i + 1) % ring.length];
      // Half-open test, so a vertex exactly on the line is counted once.
      if (y1 > y === y2 > y) continue;
      crossings.push(x1 + ((y - y1) / (y2 - y1)) * (x2 - x1));
    }
  });

  crossings.sort((a, b) => a - b);
  let widest = 0;
  let at = base[0];
  for (let i = 0; i + 1 < crossings.length; i += 2) {
    const width = crossings[i + 1] - crossings[i];
    if (width > widest) {
      widest = width;
      at = (crossings[i] + crossings[i + 1]) / 2;
    }
  }

  return widest > 0 ? [at, y, base[2]] : base;
}

/**
 * A height that lets the code sit inside the shape it names. A drawing holds
 * one parcel and several much smaller buildings, so a single height for the
 * whole file would either overflow the buildings or be unreadable on the
 * parcel. `txt` glyphs run about 0.6 of their height wide, and the code is
 * fitted to roughly three quarters of the shape's shorter side.
 */
function textHeight(ring: Point[], characters: number): number {
  const box = bounds(ring);
  const shorter = Math.min(box.width, box.height) || Math.max(box.width, box.height);
  const height = (shorter * 0.75) / Math.max(characters * 0.6, 1);
  return Math.min(Math.max(height, 0.05), 10);
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
