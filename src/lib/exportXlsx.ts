/**
 * Lightweight, zero-dependency .xlsx exporter using uncompressed ZIP (Store) + OpenXML.
 * Produces a styled Excel workbook that opens cleanly in Microsoft Excel, Google Sheets, and WPS.
 */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createZipBlob(files: Array<{ name: string; data: Uint8Array }>): Blob {
  const encoder = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = encoder.encode(file.name);
    const data = file.data;
    const crc = crc32(data);

    const localHeader = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(localHeader.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(6, 0x0800, true); // UTF-8
    lv.setUint16(8, 0, true); // Store (no compression)
    lv.setUint16(10, 0, true);
    lv.setUint16(12, 0, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, data.length, true);
    lv.setUint32(22, data.length, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);
    localHeader.set(nameBytes, 30);

    localParts.push(localHeader, data);

    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(centralHeader.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0x0800, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, 0, true);
    cv.setUint16(14, 0, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, data.length, true);
    cv.setUint32(24, data.length, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true);
    cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true);
    cv.setUint16(36, 0, true);
    cv.setUint32(38, 0, true);
    cv.setUint32(42, offset, true);
    centralHeader.set(nameBytes, 46);

    centralParts.push(centralHeader);
    offset += localHeader.length + data.length;
  }

  const centralSize = centralParts.reduce((acc, p) => acc + p.length, 0);
  const endRecord = new Uint8Array(22);
  const ev = new DataView(endRecord.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, files.length, true);
  ev.setUint16(10, files.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);
  ev.setUint16(20, 0, true);

  const blobParts: BlobPart[] = [
    ...localParts.map((u) => new Uint8Array(u)),
    ...centralParts.map((u) => new Uint8Array(u)),
    new Uint8Array(endRecord),
  ];

  return new Blob(blobParts, {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function colLetter(index: number): string {
  let n = index + 1;
  let str = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    str = String.fromCharCode(65 + rem) + str;
    n = Math.floor((n - 1) / 26);
  }
  return str;
}

export interface XlsxColumn {
  header: string;
  width: number;
}

export function downloadStyledXlsx(params: {
  filename: string;
  sheetName: string;
  title: string;
  subtitle?: string;
  columns: XlsxColumn[];
  rows: Array<Array<string | number>>;
}): void {
  const { filename, sheetName, title, subtitle, columns, rows } = params;
  const encoder = new TextEncoder();

  const lastCol = colLetter(columns.length - 1);
  const colsXml = columns
    .map((c, idx) => `<col min="${idx + 1}" max="${idx + 1}" width="${c.width}" customWidth="1"/>`)
    .join('');

  const sheetRows: string[] = [];

  // Row 1: Title
  sheetRows.push(
    `<row r="1" ht="28" customHeight="1"><c r="A1" t="inlineStr" s="1"><is><t>${escapeXml(
      title
    )}</t></is></c></row>`
  );

  // Row 2: Subtitle
  const headerRowNum = subtitle ? 4 : 3;
  if (subtitle) {
    sheetRows.push(
      `<row r="2" ht="20" customHeight="1"><c r="A2" t="inlineStr" s="2"><is><t>${escapeXml(
        subtitle
      )}</t></is></c></row>`
    );
  }

  // Header Row
  const headerCells = columns
    .map(
      (c, idx) =>
        `<c r="${colLetter(idx)}${headerRowNum}" t="inlineStr" s="3"><is><t>${escapeXml(
          c.header
        )}</t></is></c>`
    )
    .join('');
  sheetRows.push(`<row r="${headerRowNum}" ht="26" customHeight="1">${headerCells}</row>`);

  // Data Rows
  rows.forEach((row, rIdx) => {
    const excelRow = headerRowNum + 1 + rIdx;
    const styleId = rIdx % 2 === 1 ? '5' : '4';
    const cells = row
      .map((val, cIdx) => {
        const ref = `${colLetter(cIdx)}${excelRow}`;
        if (typeof val === 'number' && Number.isFinite(val)) {
          return `<c r="${ref}" s="${styleId}"><v>${val}</v></c>`;
        }
        return `<c r="${ref}" t="inlineStr" s="${styleId}"><is><t>${escapeXml(
          String(val ?? '')
        )}</t></is></c>`;
      })
      .join('');
    sheetRows.push(`<row r="${excelRow}" ht="22" customHeight="1">${cells}</row>`);
  });

  const merges = subtitle
    ? `<mergeCells count="2"><mergeCell ref="A1:${lastCol}1"/><mergeCell ref="A2:${lastCol}2"/></mergeCells>`
    : `<mergeCells count="1"><mergeCell ref="A1:${lastCol}1"/></mergeCells>`;

  const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetViews><sheetView workbookViewId="0"><pane ySplit="${headerRowNum}" topLeftCell="A${
    headerRowNum + 1
  }" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
  <cols>${colsXml}</cols>
  <sheetData>${sheetRows.join('')}</sheetData>
  ${merges}
</worksheet>`;

  // Styles:
  // 0: default
  // 1: title (14pt bold coffee-dark)
  // 2: subtitle (10pt italic coffee-muted)
  // 3: header (11pt bold white on #4B2E24, centered/left, border)
  // 4: data even (10pt #241914 on white, border, wrap)
  // 5: data odd (10pt #241914 on #F7F5EF, border, wrap)
  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="4">
    <font><sz val="10"/><color rgb="FF241914"/><name val="Calibri"/></font>
    <font><b/><sz val="14"/><color rgb="FF4B2E24"/><name val="Calibri"/></font>
    <font><i/><sz val="10"/><color rgb="FF8C7565"/><name val="Calibri"/></font>
    <font><b/><sz val="11"/><color rgb="FFF7F5EF"/><name val="Calibri"/></font>
  </fonts>
  <fills count="4">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF4B2E24"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFF7F5EF"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border>
      <left style="thin"><color rgb="FFD5C6AD"/></left>
      <right style="thin"><color rgb="FFD5C6AD"/></right>
      <top style="thin"><color rgb="FFD5C6AD"/></top>
      <bottom style="thin"><color rgb="FFD5C6AD"/></bottom>
      <diagonal/>
    </border>
  </borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="6">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment vertical="center"/></xf>
    <xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment vertical="center"/></xf>
    <xf numFmtId="0" fontId="3" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" horizontal="left"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="0" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
  </cellXfs>
</styleSheet>`;

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`;

  const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

  const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="${escapeXml(sheetName)}" sheetId="1" r:id="rId1"/></sheets>
</workbook>`;

  const workbookRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

  const blob = createZipBlob([
    { name: '[Content_Types].xml', data: encoder.encode(contentTypesXml) },
    { name: '_rels/.rels', data: encoder.encode(relsXml) },
    { name: 'xl/workbook.xml', data: encoder.encode(workbookXml) },
    { name: 'xl/_rels/workbook.xml.rels', data: encoder.encode(workbookRelsXml) },
    { name: 'xl/styles.xml', data: encoder.encode(stylesXml) },
    { name: 'xl/worksheets/sheet1.xml', data: encoder.encode(sheetXml) },
  ]);

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
