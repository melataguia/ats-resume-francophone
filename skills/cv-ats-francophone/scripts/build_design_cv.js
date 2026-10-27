#!/usr/bin/env node
/*
 * Build the design version of the CV (.docx) from the same cv_content.json
 * as the ATS version. Layouts follow the Reactive Resume templates
 * (rxresu.me, MIT licence): one column (onyx, rhyhorn, kakuna, porygon,
 * bronzor) and two columns (azurill, pikachu, gengar, ditto, chikorita,
 * glalie). Not for ATS portals: the layout uses tables and colored shapes.
 *
 * Usage: node build_design_cv.js cv_content.json output.docx [template]
 *        node build_design_cv.js --list
 * Template: the argument, else cv.design.template, else "onyx". Descriptive
 * names work too, in French or English: classique/classic, moderne/modern...
 * Requires the "docx" npm package (npm install docx).
 * See references/modeles_design.md for the templates and the "design" fields.
 *
 * Construit la version design du CV (.docx) à partir du même cv_content.json
 * que la version ATS. Les mises en page suivent les modèles de Reactive Resume
 * (rxresu.me, licence MIT) : une colonne (onyx, rhyhorn, kakuna, porygon,
 * bronzor) et deux colonnes (azurill, pikachu, gengar, ditto, chikorita,
 * glalie). Pas pour les portails ATS : la mise en page utilise des tableaux
 * et des formes de couleur.
 *
 * Utilisation : node build_design_cv.js cv_content.json sortie.docx [modèle]
 *               node build_design_cv.js --list
 * Modèle : l'argument, sinon cv.design.template, sinon « onyx ». Les noms
 * parlants marchent aussi, en français ou en anglais : classique/classic,
 * moderne/modern...
 * Nécessite le paquet npm « docx » (npm install docx).
 * Modèles et champs « design » : references/modeles_design.md.
 */
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

// Node resolves modules from this script's folder, not from the working
// directory: fall back to a "docx" installed where the command is run.
// Node cherche les modules depuis le dossier du script, pas depuis le dossier
// de travail : on se rabat sur un « docx » installé là où la commande est lancée.
function loadDocx() {
  try {
    return require("docx");
  } catch (_) {
    try {
      return require(require.resolve("docx", { paths: [process.cwd()] }));
    } catch (_) {
      console.error('Package "docx" introuvable. Lancer : npm install docx@9 (dans le dossier de travail).');
      process.exit(1);
    }
  }
}
const {
  Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell, Header,
  AlignmentType, BorderStyle, LevelFormat, ShadingType, TabStopType, WidthType,
  TableLayoutType, HeightRule, VerticalAlign, HorizontalPositionRelativeFrom,
  VerticalPositionRelativeFrom,
} = loadDocx();

// layout: single | sidebar. header: where name and contact go.
// heading: plain | rule | center | bar | label. sideFill: full-height sidebar color.
// layout : single | sidebar. header : où vont le nom et les coordonnées.
// heading : plain | rule | center | bar | label. sideFill : couleur de la barre latérale sur toute la hauteur.
const TEMPLATES = {
  onyx:      { layout: "single", header: "left", photo: "left", heading: "plain", accent: "2E4057", nameFont: "Georgia", ruleAfterHeader: true },
  rhyhorn:   { layout: "single", header: "left", photo: "right", heading: "rule", accent: "2B5C8A" },
  kakuna:    { layout: "single", header: "center", heading: "center", accent: "A0622D" },
  porygon:   { layout: "single", header: "boxed", photo: "right", heading: "bar", accent: "7B4B4B", nameFont: "Georgia" },
  bronzor:   { layout: "single", header: "center", heading: "label", accent: "2B5C8A", ruleAfterHeader: true },
  azurill:   { layout: "sidebar", side: "left", sideW: 0.30, header: "center", heading: "rule", accent: "1E7F86" },
  pikachu:   { layout: "sidebar", side: "left", sideW: 0.30, header: "mainBlock", heading: "rule", accent: "9A4A63" },
  gengar:    { layout: "sidebar", side: "left", sideW: 0.32, header: "sideTop", heading: "rule", accent: "B2385B", sideFill: "tint", topFill: true },
  ditto:     { layout: "sidebar", side: "left", sideW: 0.30, header: "band", heading: "plain", accent: "B5562A", nameFont: "Georgia" },
  chikorita: { layout: "sidebar", side: "right", sideW: 0.30, header: "left", photo: "left", heading: "rule", accent: "8A3A63", nameFont: "Georgia", sideFill: "accent" },
  glalie:    { layout: "sidebar", side: "left", sideW: 0.32, header: "sideTop", heading: "rule", accent: "4F6F4B", sideFill: "tint" },
};

// Descriptive names (French, English), accepted next to the Reactive Resume names.
// Noms parlants (français, anglais), acceptés en plus des noms de Reactive Resume.
const NAMES = {
  onyx: ["classique", "classic"],
  rhyhorn: ["épuré", "clean"],
  kakuna: ["centré", "centered"],
  porygon: ["encadré", "boxed"],
  bronzor: ["structuré", "structured"],
  azurill: ["aéré", "airy"],
  pikachu: ["moderne", "modern"],
  gengar: ["créatif", "creative"],
  ditto: ["bandeau", "banner"],
  chikorita: ["audacieux", "bold"],
  glalie: ["doux", "soft"],
};
// Lowercase without accents, so "Épuré", "epure" and "épuré" all match.
// Minuscules sans accents : « Épuré », « epure » et « épuré » se valent.
const key = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const ALIASES = {};
for (const [k, names] of Object.entries(NAMES)) for (const n of [k, ...names]) ALIASES[key(n)] = k;

const [, , inPath, outPath, tplArg] = process.argv;
if (inPath === "--list") {
  for (const [k, t] of Object.entries(TEMPLATES)) {
    const layout = t.layout === "single" ? "1 colonne" : `2 colonnes, barre à ${t.side === "left" ? "gauche" : "droite"}`;
    console.log(k.padEnd(10), NAMES[k].join(" / ").padEnd(24), layout);
  }
  process.exit(0);
}
if (!inPath || !outPath) {
  console.error("Usage: node build_design_cv.js cv_content.json output.docx [template]");
  process.exit(1);
}
const cv = JSON.parse(fs.readFileSync(inPath, "utf8"));
const design = cv.design || {};
const asked = tplArg || design.template || "onyx";
const TPL_NAME = ALIASES[key(asked)];
const T = TEMPLATES[TPL_NAME];
if (!T) {
  const known = Object.keys(TEMPLATES).map((k) => `${k} (${NAMES[k].join(", ")})`).join(", ");
  console.error(`Modèle inconnu « ${asked} ». Modèles : ${known}`);
  process.exit(1);
}

const lang = (cv.lang || "fr").toLowerCase().startsWith("en") ? "en" : "fr";
const H = {
  fr: { profile: "Profil", skills: "Compétences", experience: "Expériences professionnelles",
        projects: "Projets", education: "Formation", languages: "Langues",
        certifications: "Certifications", volunteering: "Bénévolat", extra: "Informations complémentaires",
        present: "Présent" },
  en: { profile: "Profile", skills: "Skills", experience: "Professional Experience",
        projects: "Projects", education: "Education", languages: "Languages",
        certifications: "Certifications", volunteering: "Volunteering", extra: "Additional Information",
        present: "Present" },
}[lang];
const L = { ...H, ...(cv.headings || {}) };

// Colors / Couleurs
const hex = (s) => String(s).replace("#", "").toUpperCase();
const mix = (a, b, t) => {
  const pa = [0, 2, 4].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [0, 2, 4].map((i) => parseInt(b.slice(i, i + 2), 16));
  return pa.map((v, i) => Math.round(v * (1 - t) + pb[i] * t).toString(16).padStart(2, "0")).join("").toUpperCase();
};
const ACC = hex(design.accent || T.accent);
const TINT = mix(ACC, "FFFFFF", 0.86);
const DARK = { ink: "1F2328", muted: "5B6168", head: ACC, rule: ACC, sub: ACC, sep: "B0B4BA", bullets: "dot-dark" };
const LIGHT = { ink: "FFFFFF", muted: mix("FFFFFF", ACC, 0.22), head: "FFFFFF", rule: "FFFFFF", sub: "FFFFFF", sep: mix("FFFFFF", ACC, 0.4), bullets: "dot-light" };

const FONT = design.font || "Calibri";
const NAME_FONT = design.nameFont || T.nameFont || FONT;
const SZ = 20; // 10 pt body / corps 10 pt
const PW = cv.paper === "letter" ? 12240 : 11906;
const PH = cv.paper === "letter" ? 15840 : 16838;

// Building blocks / Briques de base
const run = (text, o = {}) => new TextRun({
  text, font: o.font || FONT, size: o.size || SZ, bold: o.bold, italics: o.italics,
  color: o.color, allCaps: o.caps, characterSpacing: o.spacing,
});
// "Keep with next" inside a table cell makes Word push the whole row to the
// next page, leaving page 1 empty: only use it when the body is not a table.
// « Paragraphe solidaire du suivant » dans une cellule pousse toute la ligne à la page
// suivante et laisse la page 1 vide : seulement quand le corps n'est pas un tableau.
const KEEP = T.layout === "single" && T.heading !== "label";
const P = (children, o = {}) => new Paragraph({
  children: [].concat(children), alignment: o.align, keepNext: KEEP && o.keepNext, border: o.border, indent: o.indent,
  spacing: { before: o.before ?? 0, after: o.after ?? 40 },
  tabStops: o.tab ? [{ type: TabStopType.RIGHT, position: o.tab }] : undefined,
  shading: o.fill ? { type: ShadingType.CLEAR, fill: o.fill, color: "auto" } : undefined,
});
const tiny = () => new Paragraph({ children: [new TextRun({ text: "", size: 2 })], spacing: { before: 0, after: 0, line: 20 } });
const NB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const NO_BORDERS = { top: NB, bottom: NB, left: NB, right: NB, insideHorizontal: NB, insideVertical: NB };
const line = (color, size = 6) => ({ style: BorderStyle.SINGLE, size, color, space: 2 });
// Table cells: no "space", Word shifts cell borders that carry one.
// Cellules : pas de « space », Word décale les bordures de cellule qui en ont un.
const cellLine = (color, size = 6) => ({ style: BorderStyle.SINGLE, size, color });

// rows: [[{ children, fill, margins, vAlign, borders, span }]]; widths in twips.
// rows : [[{ children, fill, margins, vAlign, borders, span }]] ; largeurs en twips.
function table(widths, rows, o = {}) {
  return new Table({
    width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
    columnWidths: widths, layout: TableLayoutType.FIXED, borders: o.borders || NO_BORDERS,
    rows: rows.map((row, ri) => {
      let col = 0;
      return new TableRow({
        height: o.heights && o.heights[ri] ? o.heights[ri] : undefined,
        cantSplit: o.cantSplit,
        children: row.map((c) => {
          const span = c.span || 1;
          const w = widths.slice(col, col + span).reduce((a, b) => a + b, 0);
          col += span;
          const kids = c.children.length && c.children[c.children.length - 1] instanceof Paragraph ? c.children : [...c.children, tiny()];
          return new TableCell({
            width: { size: w, type: WidthType.DXA }, columnSpan: span > 1 ? span : undefined,
            margins: c.margins || { top: 0, bottom: 0, left: 0, right: 0 },
            shading: c.fill ? { type: ShadingType.CLEAR, fill: c.fill, color: "auto" } : undefined,
            verticalAlign: c.vAlign, borders: c.borders, children: kids,
          });
        }),
      });
    }),
  });
}

// 1x1 PNG of one color, stretched into a shape behind the text.
// PNG 1x1 d'une seule couleur, étiré en forme derrière le texte.
function solidPng(color) {
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (buf) => {
    let c = 0xffffffff;
    for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const c = Buffer.alloc(4); c.writeUInt32BE(crc(td));
    return Buffer.concat([len, td, c]);
  };
  const ihdr = Buffer.from([0, 0, 0, 1, 0, 0, 0, 1, 8, 2, 0, 0, 0]);
  const rgb = [0, 2, 4].map((i) => parseInt(color.slice(i, i + 2), 16));
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(Buffer.from([0, ...rgb]))), chunk("IEND", Buffer.alloc(0)),
  ]);
}
const rect = (color, x, y, w, h, z = 1) => new ImageRun({
  type: "png", data: solidPng(color), transformation: { width: Math.round(w / 15), height: Math.round(h / 15) },
  floating: {
    horizontalPosition: { relative: HorizontalPositionRelativeFrom.PAGE, offset: x * 635 },
    verticalPosition: { relative: VerticalPositionRelativeFrom.PAGE, offset: y * 635 },
    behindDocument: true, allowOverlap: true, zIndex: z,
  },
});

function photo(px) {
  if (!cv.photo || design.photo === false) return null;
  const p = path.resolve(path.dirname(inPath), cv.photo);
  if (!fs.existsSync(p)) {
    console.warn("Photo introuvable, ignorée :", p);
    return null;
  }
  const ext = path.extname(p).toLowerCase();
  return new ImageRun({ type: ext === ".png" ? "png" : "jpg", data: fs.readFileSync(p), transformation: { width: px, height: px } });
}

// Header pieces / Éléments de l'en-tête
const c = cv.contact || {};
const contactItems = [c.location, c.phone, c.email, c.linkedin, c.portfolio, ...(c.other || [])].filter(Boolean);

function nameBlock(pal, align, nameSize = 40) {
  const out = [P(run(cv.name, { bold: true, size: nameSize, font: NAME_FONT, color: pal.ink }), { align, after: 40 })];
  if (cv.title) out.push(P(run(cv.title, { size: 22, color: pal.sub }), { align, after: 100 }));
  return out;
}
function contactBlock(pal, align, stacked, boxed) {
  const out = [];
  if (stacked) {
    const border = boxed ? { top: line(pal.rule, 4), bottom: line(pal.rule, 4), left: line(pal.rule, 4), right: line(pal.rule, 4) } : undefined;
    for (const t of contactItems) out.push(P(run(t, { size: 18, color: pal.ink }), { align, after: 30, border }));
  } else if (contactItems.length) {
    const runs = [];
    contactItems.forEach((t, i) => {
      if (i) runs.push(run("   |   ", { size: 18, color: pal.sep }));
      runs.push(run(t, { size: 18, color: pal.ink }));
    });
    out.push(P(runs, { align, after: 40 }));
  }
  if (c.extra) out.push(P(run(c.extra, { size: 18, color: pal.muted }), { align, after: 40 }));
  return out;
}

// Section titles / Titres de rubrique
function heading(text, pal, style = T.heading) {
  const o = { before: 220, after: 100, keepNext: true };
  switch (style) {
    case "bar":
      return P(run(text.toUpperCase(), { bold: true, size: 18, spacing: 40, font: NAME_FONT, color: "FFFFFF" }), { ...o, fill: ACC, indent: { left: 0 } });
    case "center":
      return P(run(text, { bold: true, size: 24, color: pal.head }), { ...o, align: AlignmentType.CENTER });
    case "plain":
      return P(run(text, { bold: true, size: 26, font: NAME_FONT, color: pal.head }), o);
    default: // rule: underlined title / titre souligné
      return P(run(text, { bold: true, size: 24, color: pal.head }), { ...o, border: { bottom: line(pal.rule) } });
  }
}

// Entries: wide = two lines with right-aligned details; narrow = stacked.
// Entrées : large = deux lignes avec détails alignés à droite ; étroit = empilé.
const dates = (s, e) => [s, e === "present" || e === "Présent" || e === "Present" ? L.present : e].filter(Boolean).join(" - ");
const bullet = (text, pal) => new Paragraph({
  children: [run(text, { color: pal.ink })], numbering: { reference: pal.bullets, level: 0 }, spacing: { after: 30 },
});
function entry(e, pal, w, narrow) {
  const out = [];
  if (narrow) {
    out.push(P(run(e.head, { bold: true, color: pal.ink }), { before: 80, after: 0, keepNext: true }));
    if (e.sub) out.push(P(run(e.sub, { color: pal.ink }), { after: 0, keepNext: true }));
    const meta = [e.headRight, e.subRight].filter(Boolean).join(" · ");
    if (meta) out.push(P(run(meta, { size: 18, color: pal.muted }), { after: 40 }));
  } else {
    const right = (t) => (t ? [run("\t" + t, { size: 18, color: pal.muted })] : []);
    out.push(P([run(e.head, { bold: true, color: pal.ink }), ...right(e.headRight)], { tab: w, before: 100, after: 0, keepNext: true }));
    if (e.sub || e.subRight) out.push(P([run(e.sub || "", { color: pal.ink }), ...right(e.subRight)], { tab: w, after: 40, keepNext: true }));
  }
  if (e.context) out.push(P(run(e.context, { color: pal.ink }), { after: 40 }));
  for (const b of e.bullets || []) out.push(bullet(b, pal));
  return out;
}
const asExperience = (e) => ({ head: e.company || e.title, headRight: e.location, sub: e.company ? e.title : "", subRight: dates(e.start, e.end), context: e.context, bullets: e.bullets });
const asEducation = (e) => ({ head: e.school || e.degree, headRight: e.location, sub: e.school ? e.degree : "", subRight: dates(e.start, e.end), bullets: e.bullets });
const asProject = (e) => ({ head: e.title, headRight: dates(e.start, e.end), sub: [e.company, e.location].filter(Boolean).join(", "), context: e.context, bullets: e.bullets });

// Label + items, as a 3-column grid (wide) or stacked (narrow).
// Intitulé + éléments, en grille de 3 colonnes (large) ou empilés (étroit).
function labelled(items, pal, w, narrow) {
  const cell = (it) => [
    P(run(it.label, { bold: true, color: pal.ink }), { after: 0 }),
    P(run(it.text, { size: 18, color: pal.muted }), { after: 80 }),
  ];
  if (narrow) return items.flatMap(cell);
  const cw = Math.floor(w / 3);
  const rows = [];
  for (let i = 0; i < items.length; i += 3) {
    rows.push([0, 1, 2].map((j) => ({ children: items[i + j] ? cell(items[i + j]) : [], margins: { top: 0, bottom: 0, left: 0, right: 120 } })));
  }
  // A grid row never breaks across pages (a label on page 1, its text on page 2).
  // Une ligne de grille ne se coupe jamais entre deux pages (intitulé en page 1, texte en page 2).
  return [table([cw, cw, w - 2 * cw], rows, { cantSplit: true })];
}

const SECTIONS = {
  profile: (pal) => (cv.summary ? [P(run(cv.summary, { color: pal.ink }), { after: 60 })] : []),
  experience: (pal, w, n) => (cv.experience || []).flatMap((e) => entry(asExperience(e), pal, w, n)),
  projects: (pal, w, n) => (cv.projects || []).flatMap((e) => entry(asProject(e), pal, w, n)),
  volunteering: (pal, w, n) => (cv.volunteering || []).flatMap((e) => entry(asProject(e), pal, w, n)),
  education: (pal, w, n) => (cv.education || []).flatMap((e) => entry(asEducation(e), pal, w, n)),
  skills: (pal, w, n) => (cv.skills && cv.skills.length
    ? labelled(cv.skills.map((g) => ({ label: g.label, text: Array.isArray(g.items) ? g.items.join(", ") : g.items })), pal, w, n) : []),
  languages: (pal, w, n) => (cv.languages && cv.languages.length
    ? labelled(cv.languages.map((l) => ({ label: l.name, text: l.level })), pal, w, n) : []),
  certifications: (pal) => (cv.certifications || []).map((ct) => {
    const [name, ...rest] = ct.split(" · ");
    return P([run(name, { bold: true, color: pal.ink }), ...(rest.length ? [run(" · " + rest.join(" · "), { size: 18, color: pal.muted })] : [])], { after: 50 });
  }),
  extra: (pal) => (cv.extra || []).map((x) => bullet(x, pal)),
};
function section(key, pal, w, narrow, withHeading = true) {
  const content = SECTIONS[key](pal, w, narrow);
  if (!content.length) return [];
  return withHeading ? [heading(L[key], pal), ...content] : content;
}

const SINGLE_ORDER = ["profile", "experience", "projects", "education", "skills", "certifications", "languages", "volunteering", "extra"];
const MAIN_ORDER = ["profile", "experience", "projects", "volunteering"];
const SIDE_ORDER = ["skills", "education", "languages", "certifications", "extra"];

// Header with an optional photo beside the text.
// En-tête avec une photo facultative à côté du texte.
function headerWithPhoto(textKids, side, w, px = 90) {
  const ph = photo(px);
  if (!ph) return textKids;
  const pw = px * 15 + 300;
  const photoCell = { children: [P(ph, { after: 0, align: side === "right" ? AlignmentType.RIGHT : AlignmentType.LEFT })], vAlign: VerticalAlign.CENTER };
  const textCell = { children: textKids, vAlign: VerticalAlign.CENTER };
  return side === "right"
    ? [table([w - pw, pw], [[textCell, photoCell]])]
    : [table([pw, w - pw], [[photoCell, textCell]])];
}
function centeredHeader(pal) {
  const ph = photo(90);
  return [
    ...(ph ? [P(ph, { align: AlignmentType.CENTER, after: 80 })] : []),
    ...nameBlock(pal, AlignmentType.CENTER),
    ...contactBlock(pal, AlignmentType.CENTER, false),
  ];
}

// Layouts / Mises en page
const body = [];
let headers;
let margin;

if (T.layout === "single") {
  margin = { top: 720, bottom: 720, left: 760, right: 760 };
  const W = PW - margin.left - margin.right;
  if (T.header === "center") {
    body.push(...centeredHeader(DARK));
  } else if (T.header === "boxed") {
    const ph = photo(80);
    const text = [...nameBlock(DARK, AlignmentType.LEFT, 36), ...contactBlock(DARK, AlignmentType.LEFT, false)];
    const b = cellLine(ACC, 8);
    const pad = { top: 160, bottom: 160, left: 200, right: 200 };
    body.push(ph
      ? table([W - 1700, 1700], [[
        { children: text, margins: pad, vAlign: VerticalAlign.CENTER, borders: { top: b, bottom: b, left: b, right: NB } },
        { children: [P(ph, { after: 0, align: AlignmentType.RIGHT })], margins: pad, vAlign: VerticalAlign.CENTER, borders: { top: b, bottom: b, left: NB, right: b } },
      ]])
      : table([W], [[{ children: text, margins: pad, borders: { top: b, bottom: b, left: b, right: b } }]]));
  } else {
    body.push(...headerWithPhoto([...nameBlock(DARK, AlignmentType.LEFT), ...contactBlock(DARK, AlignmentType.LEFT, false)], T.photo, W));
  }
  if (T.ruleAfterHeader) body.push(P([], { after: 120, border: { bottom: line(T.heading === "label" ? ACC : "C8CCD2") } }));

  if (T.heading === "label") {
    // Bronzor: one row per section, label on the left.
    // Bronzor : une ligne par rubrique, intitulé à gauche.
    const LW = 2100;
    const top = { top: cellLine(ACC, 6), bottom: NB, left: NB, right: NB };
    const rows = SINGLE_ORDER
      .map((k) => [k, section(k, DARK, W - LW, false, false)])
      .filter(([, kids]) => kids.length)
      .map(([k, kids]) => [
        { children: [P(run(L[k], { bold: true, size: 18, color: ACC }), { after: 0 })], borders: top, margins: { top: 120, bottom: 120, left: 0, right: 200 } },
        { children: kids, borders: top, margins: { top: 100, bottom: 120, left: 0, right: 0 } },
      ]);
    body.push(table([LW, W - LW], rows));
  } else {
    for (const k of SINGLE_ORDER) body.push(...section(k, DARK, W, false));
  }
} else {
  // Two columns spread to the page edges; colors come from cell shading and
  // full-height shapes in the page header, so sidebars reach the bottom of every page.
  // Deux colonnes jusqu'aux bords de la page ; les couleurs viennent du fond des cellules et de
  // formes pleine hauteur dans l'en-tête, pour que les barres descendent en bas de chaque page.
  margin = { top: 360, bottom: 360, left: 0, right: 0 };
  const SW = Math.round(PW * T.sideW);
  const MW = PW - SW;
  const PAD = 400;
  const sideIn = SW - 2 * PAD;
  const mainIn = MW - 2 * PAD;
  const sidePal = T.sideFill === "accent" ? LIGHT : DARK;
  const sideColor = T.sideFill === "accent" ? ACC : T.sideFill === "tint" ? TINT : null;
  const sideX = T.side === "left" ? 0 : MW;
  const cellPad = { top: 300, bottom: 300, left: PAD, right: PAD };

  const side = [];
  const main = [];
  const rows = [];
  const heights = [];
  const order = (sideCell, mainCell) => (T.side === "left" ? [sideCell, mainCell] : [mainCell, sideCell]);
  const widths = T.side === "left" ? [SW, MW] : [MW, SW];
  let mainSections = MAIN_ORDER;
  const firstStrips = [];

  if (T.header === "center") {
    rows.push([{ children: centeredHeader(DARK), span: 2, margins: { top: 300, bottom: 100, left: PAD, right: PAD } }]);
    heights.push(null);
  } else if (T.header === "band") {
    const BAND = 1750;
    const ph = photo(84);
    rows.push(order(
      { children: ph ? [P(ph, { align: AlignmentType.CENTER, after: 0 })] : [], fill: ACC, vAlign: VerticalAlign.CENTER, margins: { ...cellPad, top: 0, bottom: 0 } },
      { children: nameBlock(LIGHT, AlignmentType.LEFT), fill: ACC, vAlign: VerticalAlign.CENTER, margins: { ...cellPad, top: 0, bottom: 0 } },
    ));
    heights.push({ value: BAND, rule: HeightRule.EXACT });
    firstStrips.push(rect(ACC, 0, 0, PW, margin.top + 10, 2));
    main.push(...contactBlock(DARK, AlignmentType.LEFT, false), P([], { after: 60 }));
  } else if (T.header === "sideTop" && T.topFill) {
    // Gengar: name block on the accent color, summary on a tinted band.
    // Gengar : bloc du nom sur la couleur d'accent, profil sur un bandeau teinté.
    const ph = photo(84);
    const head = [...(ph ? [P(ph, { after: 100 })] : []), ...nameBlock(LIGHT, AlignmentType.LEFT, 36), ...contactBlock(LIGHT, AlignmentType.LEFT, true)];
    const summary = cv.summary ? [heading(L.profile, DARK), ...SECTIONS.profile(DARK)] : [];
    rows.push(order({ children: head, fill: ACC, margins: cellPad }, { children: summary, fill: TINT, margins: cellPad }));
    heights.push(null);
    firstStrips.push(rect(ACC, sideX, 0, SW, margin.top + 10, 2), rect(TINT, T.side === "left" ? SW : 0, 0, MW, margin.top + 10, 2));
    mainSections = MAIN_ORDER.filter((k) => k !== "profile");
  } else if (T.header === "sideTop") {
    // Glalie: name and contact at the top of the tinted sidebar.
    // Glalie : nom et coordonnées en haut de la barre latérale teintée.
    const ph = photo(90);
    if (ph) side.push(P(ph, { align: AlignmentType.CENTER, after: 100 }));
    side.push(...nameBlock(sidePal, AlignmentType.CENTER, 36), ...contactBlock(sidePal, AlignmentType.LEFT, true, true));
  } else if (T.header === "mainBlock") {
    // Pikachu: photo on top of the sidebar, name in a colored block over the main column.
    // Pikachu : photo en haut de la barre, nom dans un bloc coloré au-dessus de la colonne principale.
    const ph = photo(110);
    if (ph) side.push(P(ph, { align: AlignmentType.LEFT, after: 60 }));
    main.push(table([mainIn], [[{
      children: [...nameBlock(LIGHT, AlignmentType.LEFT, 36), P([], { after: 60, border: { bottom: line(LIGHT.sep, 4) } }), ...contactBlock(LIGHT, AlignmentType.LEFT, false)],
      fill: ACC, margins: { top: 260, bottom: 200, left: 300, right: 300 },
    }]]));
  } else {
    // Chikorita: header at the top of the main column.
    // Chikorita : en-tête en haut de la colonne principale.
    main.push(...headerWithPhoto([...nameBlock(DARK, AlignmentType.LEFT, 36), ...contactBlock(DARK, AlignmentType.LEFT, true)], T.photo, mainIn, 84));
  }

  for (const k of SIDE_ORDER) side.push(...section(k, sidePal, sideIn, true));
  for (const k of mainSections) main.push(...section(k, DARK, mainIn, false));
  rows.push(order({ children: side, margins: cellPad }, { children: main, margins: cellPad }));
  heights.push(null);
  body.push(table(widths, rows, { heights }));

  const shapes = sideColor ? [rect(sideColor, sideX, 0, SW, PH)] : [];
  const hp = (kids) => new Header({ children: [new Paragraph({ children: kids, spacing: { before: 0, after: 0, line: 20 } })] });
  if (shapes.length || firstStrips.length) {
    headers = { default: hp(shapes), ...(firstStrips.length ? { first: hp([...shapes, ...firstStrips]) } : {}) };
  }
}

const bulletLevel = (reference, color) => ({
  reference,
  levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
             style: { run: { color }, paragraph: { indent: { left: 300, hanging: 200 } } } }],
});

const doc = new Document({
  creator: cv.name,
  title: `CV ${cv.name}`,
  styles: { default: { document: { run: { font: FONT, size: SZ } } } },
  numbering: { config: [bulletLevel("dot-dark", ACC), bulletLevel("dot-light", "FFFFFF")] },
  sections: [{
    properties: {
      titlePage: !!(headers && headers.first),
      page: { size: { width: PW, height: PH }, margin: { ...margin, header: 0, footer: 0 } },
    },
    headers,
    children: body,
  }],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(outPath, buf);
  console.log(`CV design (${TPL_NAME}) written:`, outPath);
});
