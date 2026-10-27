# Règles ATS, détection du système et format du contenu

## 1. Pourquoi deux versions
- **Version ATS** (toujours) : une seule colonne, aucun tableau, aucune zone de texte, rien dans l'en-tête ou le pied de page, aucune image. C'est celle qu'on dépose sur un portail de candidature (Workday, SmartRecruiters, Taleo...).
- **Version design** (facultative, sur demande) : une mise en page soignée (couleurs, deux colonnes possibles), construite par `scripts/build_design_cv.js` sur un des 11 modèles décrits dans `references/modeles_design.md`. À envoyer par e-mail à un recruteur, à imprimer pour un entretien, ou quand l'offre demande d'écrire directement à une personne.
Les deux sont construites à partir du **même fichier `cv_content.json`** : on écrit le contenu une fois, on le met en forme deux fois.

## 2. Règles de la version ATS (non négociables)
- Nom, titre et coordonnées en paragraphes simples tout en haut (jamais dans un tableau ni dans l'en-tête Word).
- Titres de rubrique standards : Profil, Compétences, Expériences professionnelles, Formation, Langues, Certifications (ou Profile, Skills, Professional Experience, Education, Languages, Certifications).
- Chaque expérience : ligne 1 = intitulé du poste ; ligne 2 = `Entreprise | Lieu | MM/AAAA - MM/AAAA`. Toujours dans cet ordre.
- Dates au format **MM/AAAA** (07/2023 - 07/2025). Poste actuel : « Présent ». Pas de mois en lettres abrégées, pas de tiret long.
- Puces simples (•), pas de symboles décoratifs, pas d'icônes de téléphone ou d'e-mail.
- Police standard (Arial), corps 10 pt, 1 à 2 pages.
- Les compétences sont en texte (« Data : SQL, Power BI, Python »), jamais en barres ou en étoiles.
- Les mots-clés de l'offre sont écrits **à l'identique** quand c'est vrai (si l'offre dit « tests de non-régression », pas seulement « TNR »). Sigle + forme longue la première fois : « Anti-Money Laundering (AML) ».
- Fichier : .docx par défaut ; PDF texte (exporté depuis le .docx) si le portail le préfère. Jamais de PDF scanné.

## 3. Repérer l'ATS de l'entreprise
Regarde l'URL du lien « Postuler » ou de la page de l'offre :

| Indice dans l'URL | ATS | Points d'attention |
|---|---|---|
| `myworkdayjobs.com`, `wd3.myworkday` | Workday | Réputé le plus exigeant. Il pré-remplit le formulaire depuis le CV : intitulé, entreprise et dates doivent être sur des lignes séparées et régulières, sinon les champs restent vides. Le PDF texte est lu correctement ; le .docx reste le choix le plus sûr par précaution. |
| `smartrecruiters.com`, `jobs.smartrecruiters` | SmartRecruiters | Très utilisé en Belgique. Lit bien le .docx et le PDF texte. Les compétences sont extraites telles quelles : forme exacte de l'offre. |
| `taleo.net`, `oraclecloud.com/hcmUI` | Oracle Taleo / Recruiting Cloud | Ancien parseur : aucun tableau, aucune colonne, .docx de préférence. |
| `icims.com` | iCIMS | Ignore souvent en-têtes et pieds de page. |
| `greenhouse.io`, `boards.greenhouse` | Greenhouse | Parseur correct, mais les recruteurs lisent le CV en entier : soigner le haut de page. |
| `lever.co` | Lever | Idem Greenhouse. |
| `teamtailor.com` | Teamtailor | Fréquent dans les PME belges et françaises ; lecture humaine rapide, CV court et clair. |
| `recruitee.com` | Recruitee | Idem Teamtailor. |
| `successfactors`, `jobs.sap.com` | SAP SuccessFactors | Strict sur la structure ; .docx conseillé. |
| `jobvite.com`, `bamboohr.com`, `personio` | Jobvite, BambooHR, Personio | Parseurs standards. |
| Adresse e-mail seulement | Pas d'ATS visible | La version design en PDF suffit. |

Si l'ATS n'est pas identifiable, appliquer les règles de Workday (les plus strictes) : ce qui passe Workday passe partout.

## 4. Mots-clés
Avant de rédiger, extraire de l'offre 15 à 30 termes dans `keywords.txt` (un par ligne, synonymes séparés par `|`) :
- intitulé du poste, outils et logiciels, méthodes, domaines métier, certifications, langues exigées ;
- pas de compétences comportementales génériques (« rigueur ») sauf si l'offre insiste ;
- si le CV n'est pas dans la langue de l'offre (offre en français, CV en anglais demandé, ou l'inverse), garder le terme de l'offre et ajouter sa traduction en synonyme : `qualité des données|data quality`.
Exemple :
```
Business Analyst|analyste métier
SQL
Power BI
user stories
tests d'acceptation|UAT
AML|anti-blanchiment
néerlandais
```
Le script `ats_check.py --keywords keywords.txt` donne le taux de couverture. Objectif : **70 % ou plus**, sans jamais ajouter un mot-clé que le profil ne justifie pas. Les manques réels sont listés honnêtement dans le rapport.

## 5. Format de `cv_content.json`
```json
{
  "lang": "fr",
  "accent": "1F3A5F",
  "paper": "a4",
  "name": "Prénom NOM",
  "title": "Intitulé aligné sur l'offre",
  "contact": {
    "location": "Ville (Région)",
    "phone": "+32 ...",
    "email": "...",
    "linkedin": "linkedin.com/in/...",
    "portfolio": "...",
    "extra": "Permis B | Disponible immédiatement (optionnel)"
  },
  "summary": "3 à 4 lignes.",
  "skills": [ { "label": "Analyse fonctionnelle", "items": ["user stories", "BPMN"] } ],
  "experience": [
    { "title": "Titre réel · spécialité alignée sur l'offre",
      "company": "Nom de l'entreprise", "location": "Bruxelles",
      "start": "07/2023", "end": "07/2025",
      "bullets": ["Verbe d'action + quoi + résultat chiffré quand il existe."] }
  ],
  "projects": [ { "title": "...", "company": "...", "start": "...", "end": "present", "bullets": [] } ],
  "education": [ { "degree": "...", "school": "...", "location": "...", "start": "09/2022", "end": "06/2025" } ],
  "languages": [ { "name": "Français", "level": "langue maternelle (C2)" } ],
  "certifications": ["Nom · Organisme · année"],
  "volunteering": [ { "title": "...", "company": "...", "start": "...", "end": "present", "bullets": [] } ],
  "extra": ["Ligne libre optionnelle"],
  "photo": "photo.jpg",
  "design": { "template": "onyx", "accent": "1F3A5F" }
}
```
`"lang": "en"` pour un CV en anglais : titres de rubrique (Profile, Skills, Professional Experience, Education, Languages...), « Present » et ponctuation (« Skills: SQL ») passent en anglais ; le contenu, lui, est rédigé en anglais dans le JSON. `"paper": "letter"` pour le Québec (sinon A4). `"end": "present"` s'affiche « Présent » (fr) ou « Present » (en). Les champs vides sont simplement omis. `photo` et `design` ne servent qu'à la version design (détail dans `references/modeles_design.md`) ; la version ATS les ignore.

## 6. Commandes
```bash
SKILL_DIR=<dossier contenant ce SKILL.md>
cd <dossier de travail> && npm ls docx >/dev/null 2>&1 || npm install docx
node $SKILL_DIR/scripts/build_ats_cv.js cv_content.json CV_..._ATS.docx
soffice --headless --convert-to pdf CV_..._ATS.docx        # version PDF texte
node $SKILL_DIR/scripts/build_design_cv.js cv_content.json CV_..._Design.docx onyx   # version design (facultative)
python3 $SKILL_DIR/scripts/ats_check.py CV_..._ATS.docx --content cv_content.json --keywords keywords.txt --strict
python3 $SKILL_DIR/scripts/ats_check.py CV_..._ATS.pdf --content cv_content.json
python3 $SKILL_DIR/scripts/ats_check.py CV_..._Design.docx --content cv_content.json   # informatif
```
Si le test de la version ATS affiche « À CORRIGER », corriger et relancer avant de livrer.
