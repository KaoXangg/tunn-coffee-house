/**
 * Pure Client-Side ISO/IEC 18004 QR Code Generator (Canvas & DataURL)
 * Zero external network calls — works offline, never blocked by ISP/AdBlock/CSP.
 */

interface QrVersionSpec {
  version: number;
  totalDataCodewords: number;
  ecCodewordsPerBlock: number;
  numBlocks: number;
  alignmentCenters: number[];
}

// ISO/IEC 18004 Error Correction Level L (01) Specifications for Versions 1-9
const QR_VERSIONS_L: QrVersionSpec[] = [
  { version: 1, totalDataCodewords: 19, ecCodewordsPerBlock: 7, numBlocks: 1, alignmentCenters: [] },
  { version: 2, totalDataCodewords: 34, ecCodewordsPerBlock: 10, numBlocks: 1, alignmentCenters: [6, 18] },
  { version: 3, totalDataCodewords: 55, ecCodewordsPerBlock: 15, numBlocks: 1, alignmentCenters: [6, 22] },
  { version: 4, totalDataCodewords: 80, ecCodewordsPerBlock: 20, numBlocks: 1, alignmentCenters: [6, 26] },
  { version: 5, totalDataCodewords: 108, ecCodewordsPerBlock: 26, numBlocks: 1, alignmentCenters: [6, 30] },
  { version: 6, totalDataCodewords: 136, ecCodewordsPerBlock: 18, numBlocks: 2, alignmentCenters: [6, 34] },
  { version: 7, totalDataCodewords: 156, ecCodewordsPerBlock: 20, numBlocks: 2, alignmentCenters: [6, 22, 38] },
  { version: 8, totalDataCodewords: 194, ecCodewordsPerBlock: 24, numBlocks: 2, alignmentCenters: [6, 24, 42] },
  { version: 9, totalDataCodewords: 232, ecCodewordsPerBlock: 30, numBlocks: 2, alignmentCenters: [6, 26, 46] },
];

// Galois Field GF(256) with primitive polynomial 0x11D
const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);

(function initGaloisField() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) {
      x ^= 0x11d;
    }
  }
  for (let i = 255; i < 512; i++) {
    GF_EXP[i] = GF_EXP[i - 255];
  }
})();

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

function getGeneratorPolynomial(degree: number): Uint8Array {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < degree; i++) {
    const next = new Uint8Array(poly.length + 1);
    const factor = GF_EXP[i];
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], factor);
    }
    poly = next;
  }
  return poly;
}

function computeReedSolomon(data: Uint8Array, ecLength: number): Uint8Array {
  const gen = getGeneratorPolynomial(ecLength);
  const msg = new Uint8Array(data.length + ecLength);
  msg.set(data, 0);

  for (let i = 0; i < data.length; i++) {
    const coef = msg[i];
    if (coef !== 0) {
      for (let j = 1; j < gen.length; j++) {
        msg[i + j] ^= gfMul(gen[j], coef);
      }
    }
  }
  return msg.slice(data.length);
}

function encodeDataCodewords(text: string): { spec: QrVersionSpec; codewords: Uint8Array } {
  const utf8Bytes = new TextEncoder().encode(text);

  // Pick smallest version that fits: 4 bits mode + 8 bits length (for V1-9) + 8*N bits
  const spec =
    QR_VERSIONS_L.find((v) => v.totalDataCodewords >= utf8Bytes.length + 2) ||
    QR_VERSIONS_L[QR_VERSIONS_L.length - 1];

  const maxPayloadBytes = spec.totalDataCodewords - 2;
  const payload =
    utf8Bytes.length > maxPayloadBytes ? utf8Bytes.slice(0, maxPayloadBytes) : utf8Bytes;

  const bits: number[] = [];
  const pushBits = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) {
      bits.push((val >>> i) & 1);
    }
  };

  // Byte mode indicator (0100)
  pushBits(0b0100, 4);
  // Character count indicator (8 bits for versions 1-9 in Byte mode)
  pushBits(payload.length, 8);
  // Data bytes
  for (let i = 0; i < payload.length; i++) {
    pushBits(payload[i], 8);
  }

  // Terminator (up to 4 zero bits)
  const totalDataBits = spec.totalDataCodewords * 8;
  const terminatorLen = Math.min(4, totalDataBits - bits.length);
  pushBits(0, terminatorLen);

  // Pad to byte boundary
  while (bits.length % 8 !== 0) {
    bits.push(0);
  }

  // Pad with alternating 0xEC and 0x11
  let padToggle = 0;
  while (bits.length < totalDataBits) {
    pushBits(padToggle === 0 ? 0xec : 0x11, 8);
    padToggle ^= 1;
  }

  const dataBytes = new Uint8Array(spec.totalDataCodewords);
  for (let i = 0; i < spec.totalDataCodewords; i++) {
    let byte = 0;
    for (let b = 0; b < 8; b++) {
      byte = (byte << 1) | bits[i * 8 + b];
    }
    dataBytes[i] = byte;
  }

  // Split into blocks & compute EC
  const blockSize = spec.totalDataCodewords / spec.numBlocks;
  const dataBlocks: Uint8Array[] = [];
  const ecBlocks: Uint8Array[] = [];

  for (let b = 0; b < spec.numBlocks; b++) {
    const blockData = dataBytes.slice(b * blockSize, (b + 1) * blockSize);
    dataBlocks.push(blockData);
    ecBlocks.push(computeReedSolomon(blockData, spec.ecCodewordsPerBlock));
  }

  // Interleave data blocks and EC blocks
  const finalCodewords: number[] = [];
  for (let i = 0; i < blockSize; i++) {
    for (let b = 0; b < spec.numBlocks; b++) {
      finalCodewords.push(dataBlocks[b][i]);
    }
  }
  for (let i = 0; i < spec.ecCodewordsPerBlock; i++) {
    for (let b = 0; b < spec.numBlocks; b++) {
      finalCodewords.push(ecBlocks[b][i]);
    }
  }

  return { spec, codewords: new Uint8Array(finalCodewords) };
}

function computeFormatInfoBits(ecLevelBits: number, maskPattern: number): number {
  const data = (ecLevelBits << 3) | maskPattern;
  let rem = data << 10;
  const gen = 0b10100110111; // x^10 + x^8 + x^5 + x^4 + x^2 + x + 1
  for (let i = 14; i >= 10; i--) {
    if ((rem >>> i) & 1) {
      rem ^= gen << (i - 10);
    }
  }
  return ((data << 10) | rem) ^ 0b101010000010010;
}

function computeVersionInfoBits(version: number): number {
  let rem = version << 12;
  const gen = 0b1111100100101;
  for (let i = 17; i >= 12; i--) {
    if ((rem >>> i) & 1) {
      rem ^= gen << (i - 12);
    }
  }
  return (version << 12) | rem;
}

export function generateQrMatrix(text: string): boolean[][] {
  const { spec, codewords } = encodeDataCodewords(text || 'https://tunn-coffee-house.vercel.app');
  const size = spec.version * 4 + 17;

  const modules: boolean[][] = Array.from({ length: size }, () =>
    Array(size).fill(false)
  );
  const isFunction: boolean[][] = Array.from({ length: size }, () =>
    Array(size).fill(false)
  );

  const setFunctionModule = (r: number, c: number, dark: boolean) => {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      modules[r][c] = dark;
      isFunction[r][c] = true;
    }
  };

  // 1. Finder patterns + separators
  const drawFinderPattern = (topR: number, leftC: number) => {
    for (let dr = -1; dr <= 7; dr++) {
      for (let dc = -1; dc <= 7; dc++) {
        const r = topR + dr;
        const c = leftC + dc;
        if (r < 0 || r >= size || c < 0 || c >= size) continue;
        const inOuter = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6;
        const inWhiteRing = dr >= 1 && dr <= 5 && dc >= 1 && dc <= 5;
        const inCenter = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
        const dark = inOuter && (!inWhiteRing || inCenter);
        setFunctionModule(r, c, dark);
      }
    }
  };

  drawFinderPattern(0, 0);
  drawFinderPattern(0, size - 7);
  drawFinderPattern(size - 7, 0);

  // 2. Timing patterns
  for (let i = 8; i < size - 8; i++) {
    setFunctionModule(6, i, i % 2 === 0);
    setFunctionModule(i, 6, i % 2 === 0);
  }

  // 3. Alignment patterns
  const centers = spec.alignmentCenters;
  for (let i = 0; i < centers.length; i++) {
    for (let j = 0; j < centers.length; j++) {
      const cr = centers[i];
      const cc = centers[j];
      // Skip if overlapping with finder patterns
      if (
        (cr === 6 && cc === 6) ||
        (cr === 6 && cc === size - 7) ||
        (cr === size - 7 && cc === 6)
      ) {
        continue;
      }
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const dist = Math.max(Math.abs(dr), Math.abs(dc));
          setFunctionModule(cr + dr, cc + dc, dist !== 1);
        }
      }
    }
  }

  // 4. Dark module & reserve format info areas
  setFunctionModule(4 * spec.version + 9, 8, true);

  for (let i = 0; i <= 8; i++) {
    if (!isFunction[8][i]) setFunctionModule(8, i, false);
    if (!isFunction[i][8]) setFunctionModule(i, 8, false);
  }
  for (let i = 0; i < 8; i++) {
    if (!isFunction[8][size - 1 - i]) setFunctionModule(8, size - 1 - i, false);
    if (!isFunction[size - 1 - i][8]) setFunctionModule(size - 1 - i, 8, false);
  }

  // Reserve version info if version >= 7
  if (spec.version >= 7) {
    const vBits = computeVersionInfoBits(spec.version);
    for (let i = 0; i < 18; i++) {
      const bit = ((vBits >>> i) & 1) === 1;
      const a = size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      setFunctionModule(b, a, bit);
      setFunctionModule(a, b, bit);
    }
  }

  // 5. Place data bits in zigzag upward/downward 2-column strips
  let bitIdx = 0;
  const totalBits = codewords.length * 8;
  let upward = true;

  for (let rightCol = size - 1; rightCol >= 1; rightCol -= 2) {
    if (rightCol === 6) rightCol = 5; // skip vertical timing pattern column
    for (let vert = 0; vert < size; vert++) {
      const r = upward ? size - 1 - vert : vert;
      for (let j = 0; j < 2; j++) {
        const c = rightCol - j;
        if (!isFunction[r][c]) {
          let dark = false;
          if (bitIdx < totalBits) {
            const byte = codewords[bitIdx >>> 3];
            dark = ((byte >>> (7 - (bitIdx & 7))) & 1) === 1;
            bitIdx++;
          }
          modules[r][c] = dark;
        }
      }
    }
    upward = !upward;
  }

  // 6. Apply mask pattern 0 ((r + c) % 2 === 0) and write Format Information bits
  const maskPattern = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!isFunction[r][c] && (r + c) % 2 === 0) {
        modules[r][c] = !modules[r][c];
      }
    }
  }

  // Format info for Level L (01) and Mask 0 (000)
  // Bit 14 is MSB, Bit 0 is LSB (ISO/IEC 18004 Figure 25)
  const formatBits = computeFormatInfoBits(0b01, maskPattern);
  const getFormatBit = (bitIndex: number) => ((formatBits >>> bitIndex) & 1) === 1;

  // Copy 1: around top-left finder pattern
  // Vertical column 8 (rows 0..5, 7, 8) -> Bits 0..7
  for (let i = 0; i <= 5; i++) modules[i][8] = getFormatBit(i);
  modules[7][8] = getFormatBit(6);
  modules[8][8] = getFormatBit(7);
  // Horizontal row 8 (cols 7, 5..0) -> Bits 8..14
  modules[8][7] = getFormatBit(8);
  for (let i = 9; i <= 14; i++) modules[8][14 - i] = getFormatBit(i);

  // Copy 2: top-right (row 8, cols size-1..size-8 -> Bits 0..7)
  for (let i = 0; i <= 7; i++) {
    modules[8][size - 1 - i] = getFormatBit(i);
  }
  // bottom-left (col 8, rows size-7..size-1 -> Bits 8..14)
  for (let i = 8; i <= 14; i++) {
    modules[size - 15 + i][8] = getFormatBit(i);
  }

  return modules;
}

export function renderQrToDataUrl(
  text: string,
  options?: {
    pixelSize?: number;
    marginModules?: number;
    darkColor?: string;
    lightColor?: string;
  }
): string {
  if (typeof document === 'undefined') return '';

  const matrix = generateQrMatrix(text);
  const moduleCount = matrix.length;
  const margin = options?.marginModules ?? 3;
  const totalModules = moduleCount + margin * 2;
  const targetSize = options?.pixelSize ?? 600;
  const scale = Math.max(4, Math.floor(targetSize / totalModules));
  const canvasSize = totalModules * scale;

  const canvas = document.createElement('canvas');
  canvas.width = canvasSize;
  canvas.height = canvasSize;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = options?.lightColor || '#F7F5EF';
  ctx.fillRect(0, 0, canvasSize, canvasSize);

  ctx.fillStyle = options?.darkColor || '#4B2E24';
  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      if (matrix[r][c]) {
        ctx.fillRect((c + margin) * scale, (r + margin) * scale, scale, scale);
      }
    }
  }

  return canvas.toDataURL('image/png');
}
