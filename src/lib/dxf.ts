/**
 * Writer for AutoCAD R12 ASCII DXF (AC1009).
 *
 * R12 is the most widely accepted DXF flavour: AutoCAD, BricsCAD, ZWCAD,
 * nanoCAD, QGIS and GDAL all read it, and unlike R2000 it needs no entity
 * handles or object dictionary, so the file stays small and predictable.
 */

export type Point = [number, number, number];

export type DxfEntity = {
  layer: string;
  points: Point[];
  /** Closed rings repeat their first point implicitly, as CAD expects. */
  closed: boolean;
};

export type DxfPoint = {
  layer: string;
  at: Point;
};

export type DxfText = {
  layer: string;
  /** Centre of the label, horizontally and vertically. */
  at: Point;
  text: string;
  height: number;
};

export type DxfOptions = {
  entities?: DxfEntity[];
  /** Vertex markers, written as POINT entities. */
  points?: DxfPoint[];
  /** Labels, written as TEXT entities centred on their point. */
  texts?: DxfText[];
  /** `polyline` keeps each ring as one object; `line` explodes it to segments. */
  mode: 'polyline' | 'line';
  /** Writes Z ordinates and marks polylines as 3D. */
  useZ: boolean;
};

const POLYLINE_CLOSED = 1;
const POLYLINE_3D = 8;
const VERTEX_3D = 32;
/** AutoCAD colour indices cycled over the layers, skipping white on white. */
const LAYER_COLORS = [5, 3, 1, 2, 6, 4, 30, 40, 50, 140];

export function writeDxf({
  entities = [],
  points = [],
  texts = [],
  mode,
  useZ,
}: DxfOptions): string {
  const out: string[] = [];
  const pair = (code: number, value: string | number) => {
    out.push(String(code), String(value));
  };

  const layers = [
    ...new Set([
      ...entities.map((entity) => entity.layer),
      ...points.map((point) => point.layer),
      ...texts.map((text) => text.layer),
    ]),
  ];
  const bounds = extent([
    ...entities,
    ...points.map((point) => ({ layer: point.layer, points: [point.at], closed: false })),
    ...texts.map((text) => ({ layer: text.layer, points: [text.at], closed: false })),
  ]);

  pair(0, 'SECTION');
  pair(2, 'HEADER');
  pair(9, '$ACADVER');
  pair(1, 'AC1009');
  pair(9, '$INSBASE');
  point(pair, [0, 0, 0], 10);
  pair(9, '$EXTMIN');
  point(pair, [bounds.min[0], bounds.min[1], useZ ? bounds.min[2] : 0], 10);
  pair(9, '$EXTMAX');
  point(pair, [bounds.max[0], bounds.max[1], useZ ? bounds.max[2] : 0], 10);
  if (points.length > 0) {
    // Draw points as a circle with a centre dot; without this CAD shows a
    // single pixel that is easy to miss.
    pair(9, '$PDMODE');
    pair(70, 34);
    pair(9, '$PDSIZE');
    pair(40, '0.0');
  }
  pair(0, 'ENDSEC');

  pair(0, 'SECTION');
  pair(2, 'TABLES');

  pair(0, 'TABLE');
  pair(2, 'LTYPE');
  pair(70, 1);
  pair(0, 'LTYPE');
  pair(2, 'CONTINUOUS');
  pair(70, 64);
  pair(3, 'Solid line');
  pair(72, 65);
  pair(73, 0);
  pair(40, '0.0');
  pair(0, 'ENDTAB');

  if (texts.length > 0) {
    pair(0, 'TABLE');
    pair(2, 'STYLE');
    pair(70, 1);
    pair(0, 'STYLE');
    pair(2, 'STANDARD');
    pair(70, 0);
    pair(40, '0.0');
    pair(41, '1.0');
    pair(50, '0.0');
    pair(71, 0);
    pair(42, '1.0');
    pair(3, 'txt');
    pair(4, '');
    pair(0, 'ENDTAB');
  }

  pair(0, 'TABLE');
  pair(2, 'LAYER');
  pair(70, layers.length);
  layers.forEach((layer, index) => {
    pair(0, 'LAYER');
    pair(2, layer);
    pair(70, 0);
    pair(62, LAYER_COLORS[index % LAYER_COLORS.length]);
    pair(6, 'CONTINUOUS');
  });
  pair(0, 'ENDTAB');

  pair(0, 'ENDSEC');

  pair(0, 'SECTION');
  pair(2, 'ENTITIES');
  entities.forEach((entity) => {
    if (mode === 'line') writeLines(pair, entity, useZ);
    else writePolyline(pair, entity, useZ);
  });
  points.forEach((vertex) => {
    pair(0, 'POINT');
    pair(8, vertex.layer);
    point(pair, vertex.at, 10, useZ);
  });
  texts.forEach((label) => writeText(pair, label, useZ));
  pair(0, 'ENDSEC');

  pair(0, 'EOF');

  return `${out.join('\r\n')}\r\n`;
}

type Pair = (code: number, value: string | number) => void;

/**
 * A label centred on its point. R12 reads the alignment point (11, 21, 31)
 * rather than the insertion point whenever 72 or 73 is set, so both are
 * written; readers that ignore justification still land on the same place.
 */
function writeText(pair: Pair, label: DxfText, useZ: boolean) {
  pair(0, 'TEXT');
  pair(8, label.layer);
  point(pair, label.at, 10, useZ);
  pair(40, format(label.height));
  pair(1, label.text);
  pair(7, 'STANDARD');
  pair(72, 1); // centred horizontally
  pair(73, 2); // centred vertically
  point(pair, label.at, 11, useZ);
}

function writePolyline(pair: Pair, entity: DxfEntity, useZ: boolean) {
  if (entity.points.length < 2) return;
  const flags = (entity.closed ? POLYLINE_CLOSED : 0) | (useZ ? POLYLINE_3D : 0);

  pair(0, 'POLYLINE');
  pair(8, entity.layer);
  pair(66, 1); // vertices follow
  pair(70, flags);
  point(pair, [0, 0, 0], 10);

  entity.points.forEach((vertex) => {
    pair(0, 'VERTEX');
    pair(8, entity.layer);
    point(pair, vertex, 10, useZ);
    if (useZ) pair(70, VERTEX_3D);
  });

  pair(0, 'SEQEND');
  pair(8, entity.layer);
}

function writeLines(pair: Pair, entity: DxfEntity, useZ: boolean) {
  const points = entity.closed ? [...entity.points, entity.points[0]] : entity.points;
  for (let i = 0; i + 1 < points.length; i += 1) {
    const from = points[i];
    const to = points[i + 1];
    if (from[0] === to[0] && from[1] === to[1] && (!useZ || from[2] === to[2])) continue;
    pair(0, 'LINE');
    pair(8, entity.layer);
    point(pair, from, 10, useZ);
    point(pair, to, 11, useZ);
  }
}

function point(pair: Pair, [x, y, z]: Point, code: number, useZ = true) {
  pair(code, format(x));
  pair(code + 10, format(y));
  pair(code + 20, format(useZ ? z : 0));
}

/** Fixed notation with six decimals: DXF readers reject exponent notation. */
function format(value: number): string {
  if (!Number.isFinite(value)) return '0.0';
  const text = value.toFixed(6).replace(/(\.\d*?)0+$/, '$1');
  return text.endsWith('.') ? `${text}0` : text;
}

function extent(entities: DxfEntity[]) {
  const min: Point = [0, 0, 0];
  const max: Point = [0, 0, 0];
  let seen = false;
  entities.forEach((entity) =>
    entity.points.forEach((p) => {
      if (!seen) {
        min[0] = max[0] = p[0];
        min[1] = max[1] = p[1];
        min[2] = max[2] = p[2];
        seen = true;
        return;
      }
      for (let axis = 0; axis < 3; axis += 1) {
        if (p[axis] < min[axis]) min[axis] = p[axis];
        if (p[axis] > max[axis]) max[axis] = p[axis];
      }
    }),
  );
  return { min, max };
}

/**
 * DXF layer names cannot contain these characters, and R12 keeps them short and
 * upper case. An empty or unusable name falls back to the caller's default.
 */
export function layerName(raw: string, fallback = 'SHAPE'): string {
  const cleaned = raw
    .replace(/[<>/\\":;?*|=`,]/g, '_')
    .replace(/\s+/g, '_')
    .trim()
    .toUpperCase()
    .slice(0, 31);
  return cleaned || fallback;
}
