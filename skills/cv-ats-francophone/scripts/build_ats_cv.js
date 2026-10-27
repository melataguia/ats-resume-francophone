#!/usr/bin/env node
/*
 * Build a single-column, ATS-safe CV (.docx) from a JSON content file.
 * No tables, no text boxes, no header/footer, no images: every piece of
 * text is a plain paragraph in reading order, so Workday, Taleo, iCIMS,
 * SmartRecruiters, Greenhouse, Lever, Teamtailor... parse it cleanly.
 *
 * Usage: node build_ats_cv.js cv_content.json output.docx
 * Requires the "docx" npm package (npm install docx).
 * See references/ats_rules.md for the JSON schema.
 *
 * Construit un CV ATS sur une colonne (.docx) à partir d'un fichier JSON.
 * Aucun tableau, aucune zone de texte, rien dans l'en-tête ou le pied de
 * page, aucune image : chaque texte est un paragraphe simple dans l'ordre
 * de lecture, pour que Workday, Taleo, iCIMS, SmartRecruiters, Greenhouse,
 * Lever, Teamtailor... le lisent correctement.
 *
 * Utilisation : node build_ats_cv.js cv_content.json sortie.docx
 * Nécessite le paquet npm « docx » (npm install docx).
 * Schéma JSON : references/ats_rules.md.
 */
const fs = require("fs");

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
      console.error('Package "docx" introuvable. Lancer : npm install docx (dans le dossier de travail).');
      process.exit(1);
    }
  }
}
const {
  Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle,
  LevelFormat,
} = loadDocx();

const [, , inPath, outPath] = process.argv;
if (!inPath || !outPath) {
  console.error("Usage: node build_ats_cv.js cv_content.json output.docx");
  process.exit(1);
}
const cv = JSON.parse(fs.readFileSync(inPath, "utf8"));
const lang = (cv.lang || "fr").toLowerCase().startsWith("en") ? "en" : "fr";
const ACC = (cv.accent || "1F3A5F").replace("#", "");
const FONT = cv.font || "Arial";

const H = {
  fr: { profile: "Profil", skills: "Compétences", experience: "Expériences professionnelles",
        projects: "Projets", education: "Formation", languages: "Langues",
        certifications: "Certifications", volunteering: "Bénévolat", extra: "Informations complémentaires",
        present: "Présent", colon: " : " },
  en: { profile: "Profile", skills: "Skills", experience: "Professional Experience",
        projects: "Projects", education: "Education", languages: "Languages",
        certifications: "Certifications", volunteering: "Volunteering", extra: "Additional Information",
        present: "Present", colon: ": " },
}[lang];
const T = { ...H, ...(cv.headings || {}) };

const SIZE = 20; // 10 pt body / corps 10 pt
const run = (text, o = {}) => new TextRun({ text, font: FONT, size: o.size || SIZE, bold: o.bold, italics: o.italics, color: o.color });
const para = (children, o = {}) => new Paragraph({ children, spacing: { after: o.after ?? 60, before: o.before ?? 0 }, alignment: o.align, keepNext: o.keepNext });

function heading(text) {
  return new Paragraph({
    children: [run(text.toUpperCase(), { bold: true, size: 22, color: ACC })],
    spacing: { before: 200, after: 80 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: ACC, space: 2 } },
    keepNext: true,
  });
}
const bullet = (text) => new Paragraph({
  children: [run(text)], numbering: { reference: "ats-bullets", level: 0 }, spacing: { after: 40 },
});
const dates = (s, e) => [s, e === "present" || e === "Présent" || e === "Present" ? T.present : e].filter(Boolean).join(" - ");

const body = [];

// Name, title, contact: plain paragraphs at the very top (never in a table or header).
// Nom, titre, coordonnées : paragraphes simples tout en haut (jamais dans un tableau ni dans l'en-tête).
body.push(para([run(cv.name, { bold: true, size: 36 })], { after: 40 }));
if (cv.title) body.push(para([run(cv.title, { bold: true, size: 22, color: ACC })], { after: 40 }));
const c = cv.contact || {};
const contactBits = [c.location, c.phone, c.email].filter(Boolean);
if (contactBits.length) body.push(para([run(contactBits.join(" | "))], { after: 20 }));
const linkBits = [c.linkedin, c.portfolio, ...(c.other || [])].filter(Boolean);
if (linkBits.length) body.push(para([run(linkBits.join(" | "))], { after: 20 }));
if (c.extra) body.push(para([run(c.extra)], { after: 20 }));

if (cv.summary) {
  body.push(heading(T.profile));
  body.push(para([run(cv.summary)], { after: 60 }));
}

if (cv.skills && cv.skills.length) {
  body.push(heading(T.skills));
  for (const g of cv.skills) {
    const items = Array.isArray(g.items) ? g.items.join(", ") : g.items;
    body.push(para([run(g.label + T.colon, { bold: true }), run(items)], { after: 40 }));
  }
}

function entries(list, title) {
  if (!list || !list.length) return;
  body.push(heading(title));
  for (const e of list) {
    body.push(para([run(e.title, { bold: true })], { before: 100, after: 20, keepNext: true }));
    const meta = [e.company, e.location, dates(e.start, e.end)].filter(Boolean).join(" | ");
    if (meta) body.push(para([run(meta, { italics: true, color: "444444" })], { after: 40, keepNext: true }));
    if (e.context) body.push(para([run(e.context)], { after: 40 }));
    for (const b of e.bullets || []) body.push(bullet(b));
  }
}
entries(cv.experience, T.experience);
entries(cv.projects, T.projects);

if (cv.education && cv.education.length) {
  body.push(heading(T.education));
  for (const e of cv.education) {
    body.push(para([run(e.degree, { bold: true })], { before: 80, after: 20, keepNext: true }));
    const meta = [e.school, e.location, dates(e.start, e.end)].filter(Boolean).join(" | ");
    body.push(para([run(meta, { italics: true, color: "444444" })], { after: 40 }));
    for (const b of e.bullets || []) body.push(bullet(b));
  }
}

if (cv.languages && cv.languages.length) {
  body.push(heading(T.languages));
  body.push(para([run(cv.languages.map((l) => `${l.name}${T.colon}${l.level}`).join(" | "))]));
}

if (cv.certifications && cv.certifications.length) {
  body.push(heading(T.certifications));
  for (const ct of cv.certifications) body.push(bullet(ct));
}

entries(cv.volunteering, T.volunteering);

if (cv.extra && cv.extra.length) {
  body.push(heading(T.extra));
  for (const x of cv.extra) body.push(bullet(x));
}

const doc = new Document({
  creator: cv.name,
  title: `CV ${cv.name}`,
  styles: { default: { document: { run: { font: FONT, size: SIZE } } } },
  numbering: {
    config: [{
      reference: "ats-bullets",
      levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
                 style: { paragraph: { indent: { left: 360, hanging: 240 } } } }],
    }],
  },
  sections: [{
    properties: { page: { size: (cv.paper === "letter") ? { width: 12240, height: 15840 } : { width: 11906, height: 16838 },
                          margin: { top: 850, right: 850, bottom: 850, left: 850 } } },
    children: body,
  }],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(outPath, buf);
  console.log("ATS CV written:", outPath);
});
