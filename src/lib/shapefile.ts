/**
 * Minimal shapefile reader for polygon and polyline geometry.
 *
 * Coordinates are returned exactly as stored. Nothing is reprojected: a CAD
 * drawing has to keep the survey coordinates of the source data, so the `.prj`
 * is read only to report which system the file is in.
 *
 * Reference: ESRI Shapefile Technical Description (July 1998), and the dBASE
 * III table layout used by the companion `.dbf`.
 */

export type ShapeKind = 'polygon' | 'polyline';

export type Feature = {
  /** Rings (polygons) or parts (polylines), each an array of [x, y, z] points. */
  parts: [number, number, number][][];
  attributes: Record<string, string | number | null>;
};

export type Shapefile = {
  kind: ShapeKind;
  features: Feature[];
  /** True when the source carried real Z values. */
  hasZ: boolean;
  fields: { name: string; type: string }[];
  bbox: { xmin: number; ymin: number; xmax: number; ymax: number };
  /** Raw WKT from the `.prj`, when the archive had one. */
  projection?: string;
  /** Records skipped because their shape type is not supported. */
  skipped: number;
};

export type ShapefileParts = {
  shp: Uint8Array;
  dbf?: Uint8Array;
  prj?: string;
  cpg?: string;
};

export class ShapefileError extends Error {}

const SHAPE_TYPES: Record<number, { kind: ShapeKind; z: boolean }> = {
  3: { kind: 'polyline', z: false },
  5: { kind: 'polygon', z: false },
  13: { kind: 'polyline', z: true },
  15: { kind: 'polygon', z: true },
  23: { kind: 'polyline', z: false },
  25: { kind: 'polygon', z: false },
};

const DELETED_RECORD = 0x2a;
const FIELD_TERMINATOR = 0x0d;

export function parseShapefile(parts: ShapefileParts): Shapefile {
  const view = new DataView(parts.shp.buffer, parts.shp.byteOffset, parts.shp.byteLength);

  if (parts.shp.byteLength < 100) throw new ShapefileError('EMPTY_SHP');
  if (view.getInt32(0, false) !== 9994) throw new ShapefileError('NOT_A_SHP');

  const headerType = view.getInt32(32, true);
  const header = SHAPE_TYPES[headerType];
  if (!header) throw new ShapefileError(`UNSUPPORTED_TYPE:${headerType}`);

  const bbox = {
    xmin: view.getFloat64(36, true),
    ymin: view.getFloat64(44, true),
    xmax: view.getFloat64(52, true),
    ymax: view.getFloat64(60, true),
  };

  // The declared length is in 16-bit words and counts the 100-byte header.
  const declared = view.getInt32(24, false) * 2;
  const end = Math.min(
    Number.isFinite(declared) && declared > 100 ? declared : parts.shp.byteLength,
    parts.shp.byteLength,
  );

  const features: Feature[] = [];
  let hasZ = false;
  let skipped = 0;
  let offset = 100;

  while (offset + 8 <= end) {
    const contentLength = view.getInt32(offset + 4, false) * 2;
    const content = offset + 8;
    if (contentLength <= 0 || content + contentLength > end) break;

    const recordType = view.getInt32(content, true);
    const shape = SHAPE_TYPES[recordType];

    if (shape && shape.kind === header.kind) {
      const record = readParts(view, content, contentLength, shape.z);
      if (record.parts.length > 0) features.push({ parts: record.parts, attributes: {} });
      if (record.hasZ) hasZ = true;
    } else if (recordType !== 0) {
      // Type 0 is the null shape, which every reader is expected to skip.
      skipped += 1;
    }

    offset = content + contentLength;
  }

  const table = parts.dbf ? parseDbf(parts.dbf, parts.cpg) : { fields: [], rows: [] };
  features.forEach((feature, index) => {
    feature.attributes = table.rows[index] ?? {};
  });

  return {
    kind: header.kind,
    features,
    hasZ,
    fields: table.fields,
    bbox,
    projection: parts.prj?.trim() || undefined,
    skipped,
  };
}

function readParts(view: DataView, content: number, length: number, hasZDimension: boolean) {
  // shape type (4) + bbox (32), then the part index and the point count.
  let cursor = content + 36;
  const numParts = view.getInt32(cursor, true);
  const numPoints = view.getInt32(cursor + 4, true);
  cursor += 8;

  if (numParts <= 0 || numPoints <= 0) return { parts: [], hasZ: false };

  const starts: number[] = [];
  for (let i = 0; i < numParts; i += 1) starts.push(view.getInt32(cursor + i * 4, true));
  cursor += numParts * 4;

  const xy = cursor;
  const zStart = xy + numPoints * 16 + 16; // the Z block opens with its own range
  const zAvailable = hasZDimension && zStart + numPoints * 8 <= content + length;

  const parts: [number, number, number][][] = [];
  let sawZ = false;

  for (let part = 0; part < numParts; part += 1) {
    const from = starts[part];
    const to = part + 1 < numParts ? starts[part + 1] : numPoints;
    const points: [number, number, number][] = [];
    for (let i = from; i < to; i += 1) {
      const x = view.getFloat64(xy + i * 16, true);
      const y = view.getFloat64(xy + i * 16 + 8, true);
      let z = 0;
      if (zAvailable) {
        const value = view.getFloat64(zStart + i * 8, true);
        // Shapefiles write "no data" as any value below -1e38.
        if (Number.isFinite(value) && value > -1e38) {
          z = value;
          if (value !== 0) sawZ = true;
        }
      }
      points.push([x, y, z]);
    }
    if (points.length >= 2) parts.push(points);
  }

  return { parts, hasZ: sawZ };
}

type Table = {
  fields: { name: string; type: string }[];
  rows: Record<string, string | number | null>[];
};

/** dBASE III table reader: enough to expose attributes as layer names. */
function parseDbf(dbf: Uint8Array, cpg?: string): Table {
  if (dbf.byteLength < 32) return { fields: [], rows: [] };
  const view = new DataView(dbf.buffer, dbf.byteOffset, dbf.byteLength);

  const recordCount = view.getUint32(4, true);
  const headerLength = view.getUint16(8, true);
  const recordLength = view.getUint16(10, true);
  const decode = decoder(cpg);

  const fields: { name: string; type: string; length: number }[] = [];
  for (let position = 32; position + 32 <= headerLength; position += 32) {
    if (dbf[position] === FIELD_TERMINATOR) break;
    const raw = dbf.subarray(position, position + 11);
    const zero = raw.indexOf(0);
    const name = decode(raw.subarray(0, zero === -1 ? raw.length : zero)).trim();
    if (!name) break;
    fields.push({
      name,
      type: String.fromCharCode(dbf[position + 11]),
      length: dbf[position + 16],
    });
  }

  const rows: Record<string, string | number | null>[] = [];
  for (let index = 0; index < recordCount; index += 1) {
    const start = headerLength + index * recordLength;
    if (start + recordLength > dbf.byteLength) break;
    if (dbf[start] === DELETED_RECORD) continue;

    const row: Record<string, string | number | null> = {};
    let cursor = start + 1;
    fields.forEach((field) => {
      const text = decode(dbf.subarray(cursor, cursor + field.length)).trim();
      cursor += field.length;
      if (field.type === 'N' || field.type === 'F') {
        const value = Number(text);
        row[field.name] = text === '' || Number.isNaN(value) ? null : value;
      } else if (field.type === 'L') {
        row[field.name] = /^[YyTt]$/.test(text) ? 'true' : text === '' ? null : 'false';
      } else {
        row[field.name] = text === '' ? null : text;
      }
    });
    rows.push(row);
  }

  return { fields: fields.map(({ name, type }) => ({ name, type })), rows };
}

/** Uses the encoding named by the `.cpg`, falling back to UTF-8 then Latin-1. */
function decoder(cpg?: string): (bytes: Uint8Array) => string {
  const label = cpg?.trim().toLowerCase().replace(/^cp/, 'windows-');
  const candidates = [label, 'utf-8'].filter(Boolean) as string[];
  const trailingNulls = /\0+$/;
  for (const candidate of candidates) {
    try {
      const textDecoder = new TextDecoder(candidate, { fatal: false });
      return (bytes) => textDecoder.decode(bytes).replace(trailingNulls, '');
    } catch {
      // Unknown label: try the next candidate.
    }
  }
  return (bytes) => String.fromCharCode(...bytes).replace(trailingNulls, '');
}
