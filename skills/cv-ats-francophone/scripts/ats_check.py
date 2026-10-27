#!/usr/bin/env python3
"""
ATS read test for a CV (.docx or .pdf).

Extracts the text the way a simple ATS parser would (reading order, body only)
and reports what a recruiter's software would miss.

Usage:
  python3 ats_check.py CV.docx [--content cv_content.json] [--keywords keywords.txt]
                               [--strict] [--lang fr|en]

Requires python-docx (pip install python-docx) and, for PDFs, poppler
(pdftotext, pdfinfo).

  --content   the JSON used to build the CV: checks every job title, company
              and date is present and in order.
  --keywords  one keyword per line (from the job offer); "a|b" lists synonyms.
              Prints coverage and missing keywords.
  --strict    the file is meant to be the ATS version: tables, text boxes,
              header/footer text and images become errors, not warnings.

Exit code 0 = no blocking error, 1 = at least one error.
"""
import argparse, json, re, subprocess, sys, unicodedata, zipfile
from pathlib import Path

AI_WORDS_FR = ["passionné", "passionnée", "dynamique", "force de proposition", "au cœur de",
               "véritable", "incontournable", "synergie", "levier", "booster", "fort de",
               "n'hésitez pas", "en constante évolution", "à l'ère de", "plonger", "naviguer"]
AI_WORDS_EN = ["passionate", "spearheaded", "leveraged", "synergy", "dynamic", "results-driven",
               "go-getter", "delve", "tapestry", "seamless", "cutting-edge", "game-changer",
               "detail-oriented team player", "hard-working"]


def norm(s):
    s = unicodedata.normalize("NFKD", s.lower())
    s = "".join(ch for ch in s if not unicodedata.combining(ch))
    return re.sub(r"\s+", " ", s)


def has_phrase(phrase, text):
    """Whole-word match on normalized text ("fort de" must not match "effort de")."""
    return re.search(r"(?<![a-z0-9])" + re.escape(norm(phrase)) + r"(?![a-z0-9])", text) is not None


def docx_text(path):
    try:
        import docx
    except ImportError:
        sys.exit("Module python-docx manquant : pip install python-docx")
    d = docx.Document(path)
    body = [p.text for p in d.paragraphs]
    tables = []
    for t in d.tables:
        for row in t.rows:
            for cell in row.cells:
                tables.append(cell.text)
    hf = []
    for s in d.sections:
        for part in (s.header, s.footer):
            hf += [p.text for p in part.paragraphs if p.text.strip()]
    with zipfile.ZipFile(path) as z:
        xml = z.read("word/document.xml").decode("utf8", "ignore")
        media = [n for n in z.namelist() if n.startswith("word/media/")]
    textboxes = xml.count("<w:txbxContent")
    return {"body": "\n".join(body), "table_text": "\n".join(tables), "n_tables": len(d.tables),
            "header_footer": hf, "textboxes": textboxes, "images": len(media)}


def pdf_text(path):
    try:
        out = subprocess.run(["pdftotext", "-layout", str(path), "-"], capture_output=True, text=True)
        meta = subprocess.run(["pdfinfo", str(path)], capture_output=True, text=True).stdout
    except FileNotFoundError:
        sys.exit("pdftotext / pdfinfo manquants : installer poppler (brew install poppler, apt install poppler-utils)")
    m = re.search(r"^Pages:\s+(\d+)", meta, re.M)
    return {"body": out.stdout, "table_text": "", "n_tables": 0, "header_footer": [],
            "textboxes": 0, "images": 0, "pages": int(m.group(1)) if m else None}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("cv")
    ap.add_argument("--content")
    ap.add_argument("--keywords")
    ap.add_argument("--strict", action="store_true")
    ap.add_argument("--lang", help="fr|en (par défaut : champ \"lang\" du --content, sinon fr)")
    a = ap.parse_args()
    cv = json.load(open(a.content, encoding="utf8")) if a.content else {}
    lang = a.lang or cv.get("lang") or "fr"

    p = Path(a.cv)
    info = pdf_text(p) if p.suffix.lower() == ".pdf" else docx_text(p)
    # What a weak parser reliably sees: the body. What a good one may see: body + tables.
    seen = info["body"]
    full = info["body"] + "\n" + info["table_text"]
    errors, warns, oks = [], [], []
    lvl = errors if a.strict else warns

    # Layout traps
    if info["n_tables"]:
        lvl.append(f"{info['n_tables']} tableau(x) : beaucoup d'ATS (Workday, Taleo, iCIMS) mélangent ou perdent leur contenu.")
    if info["textboxes"]:
        lvl.append(f"{info['textboxes']} zone(s) de texte : souvent ignorées par les ATS.")
    if info["header_footer"]:
        lvl.append("Texte dans l'en-tête ou le pied de page : souvent ignoré. -> " + " / ".join(info["header_footer"])[:120])
    if info["images"]:
        warns.append(f"{info['images']} image(s) : aucun texte important ne doit être dans une image.")

    # Contact data must be readable in the body text
    if re.search(r"[\w.+-]+@[\w-]+\.[\w.]+", seen):
        oks.append("E-mail lisible.")
    elif re.search(r"[\w.+-]+@[\w-]+\.[\w.]+", full):
        errors.append("E-mail présent seulement dans un tableau : risque fort de ne pas être lu.")
    else:
        errors.append("E-mail introuvable.")
    phone = r"(\+\d{2,3}[\s.]?)?\(?\d{1,4}\)?([\s.-]?\d{2,4}){3,5}"
    if re.search(phone, seen):
        oks.append("Téléphone lisible.")
    elif re.search(phone, full):
        errors.append("Téléphone présent seulement dans un tableau.")
    else:
        errors.append("Téléphone introuvable.")
    first_lines = [l for l in seen.splitlines() if l.strip()][:3]
    if a.content:
        name = cv.get("name", "")
        if name and any(norm(name) in norm(l) for l in first_lines):
            oks.append("Nom en tête du document.")
        else:
            errors.append("Le nom n'apparaît pas dans les 3 premières lignes lues.")

    # Style traps
    if "—" in full:
        errors.append("Tiret long (—) présent : à remplacer.")
    if "–" in full:
        warns.append("Tiret moyen (–) présent : préférer « - » dans les dates, « · » ou une virgule ailleurs.")
    words = AI_WORDS_EN if lang.startswith("en") else AI_WORDS_FR
    nf = norm(full)
    hits = [w for w in words if has_phrase(w, nf)]
    if hits:
        warns.append("Tournures qui sonnent IA ou creuses : " + ", ".join(hits))
    # Month names, French or English, full or abbreviated ("janv. 2023", "March 2023").
    months = re.findall(
        r"\b(janv(?:ier)?|f[ée]vr(?:ier)?|mars|avr(?:il)?|mai|juin|juil(?:let)?|ao[uû]t|sept(?:embre)?|oct(?:obre)?"
        r"|nov(?:embre)?|d[ée]c(?:embre)?|jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?"
        r"|aug(?:ust)?|sep(?:tember)?|october|november|december)\.?\s+\d{4}", full, re.I)
    if months:
        warns.append(f"{len(months)} date(s) avec mois en toutes lettres : préférer MM/AAAA pour les ATS.")
    if info.get("pages"):
        max_pages = 3 if cv.get("paper") == "letter" else 2
        msg = f"{info['pages']} page(s)"
        (warns.append(msg + f" : au-delà de {max_pages}, raccourcir.") if info["pages"] > max_pages
         else oks.append(msg + "."))

    # Structure check against the content JSON
    if a.content:
        pos, ns = 0, norm(seen)
        for e in cv.get("experience", []):
            for field in ("title", "company", "start"):
                val = e.get(field)
                if not val:
                    continue
                # Prefer the occurrence after the previous title; else any occurrence (out of order).
                i = ns.find(norm(val), pos) if field == "title" else ns.find(norm(val))
                if field == "title" and i < 0:
                    i = ns.find(norm(val))
                if i < 0:
                    errors.append(f"Introuvable dans le texte lu : {field} = « {val} »")
                elif field == "title":
                    if i < pos:
                        warns.append(f"Ordre inattendu pour « {val} »")
                    pos = i
        if not any("Introuvable" in x for x in errors):
            oks.append("Tous les postes, entreprises et dates de début sont lus.")

    # Keyword coverage
    if a.keywords:
        kws = [l.strip() for l in open(a.keywords, encoding="utf8") if l.strip() and not l.startswith("#")]
        found, missing = [], []
        for k in kws:
            alts = [x.strip() for x in k.split("|")]
            hit = any(has_phrase(x, nf) for x in alts)
            (found if hit else missing).append(alts[0])
        pct = round(100 * len(found) / len(kws)) if kws else 0
        print(f"\nMOTS-CLÉS : {len(found)}/{len(kws)} ({pct} %)")
        print("  Présents : " + (", ".join(found) or "aucun"))
        print("  Manquants : " + (", ".join(missing) or "aucun"))

    print("\nTEST DE LECTURE ATS :", p.name)
    for x in oks:
        print("  OK      ", x)
    for x in warns:
        print("  ATTENTION", x)
    for x in errors:
        print("  ERREUR  ", x)
    print("\nRésultat :", "À CORRIGER" if errors else "PASSE")
    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()
