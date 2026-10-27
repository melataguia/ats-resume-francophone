---
name: cv-ats-francophone
description: Rédige un CV adapté à une offre d'emploi, en français ou en anglais, optimisé pour les logiciels de recrutement (ATS) et conforme aux usages des pays francophones (Belgique, France, Suisse, Luxembourg, Québec, Afrique francophone). Produit une version ATS en Word et PDF, une version design sur modèle, un test de lecture, un score de mots-clés et une lettre de motivation sur demande. À utiliser dès qu'on parle de CV, curriculum, candidature, offre d'emploi, ATS ou lettre de motivation. Also use it for English CVs, resumes, job applications and cover letters for jobs in these countries, for example an English CV for a multinational in Brussels, Luxembourg, Geneva or Paris.
---

# CV ATS francophone

Ce skill transforme le parcours réel d'une personne et une offre d'emploi en un CV qui passe les logiciels de recrutement (ATS) et qui respecte les usages du pays du poste. Le CV peut être en français ou en anglais : beaucoup d'entreprises de ces pays demandent un CV en anglais. Il ne rajoute jamais d'expérience, de diplôme ou de chiffre que la personne n'a pas.

Les chemins ci-dessous sont relatifs au dossier qui contient ce SKILL.md (`SKILL_DIR`).

## Étape 0 · Le profil complet de la personne
Le skill travaille à partir d'un **profil complet** (toutes les expériences, formations, compétences, langues, certifications, avec les vrais chiffres).
- Si la personne a déjà un fichier de profil (par exemple `profil.md` dans son projet) ou a joint un CV, le lire.
- Sinon, proposer de le créer avec le modèle `references/profil_modele.md` : à partir de son CV actuel s'il est joint, puis en posant seulement les questions qui manquent (une seule série courte).
- Conseiller à la personne de garder ce profil : il sert à toutes ses candidatures suivantes, en français comme en anglais.

## Étape 1 · Lire l'offre, repérer l'ATS, le pays et la langue, évaluer l'adéquation
- Si un lien est fourni, le lire. Identifier l'ATS à partir de l'URL de l'offre ou du bouton « Postuler » avec le tableau de `references/ats_rules.md` §3. Inconnu → appliquer les règles Workday (les plus strictes).
- Identifier le **pays du poste** et lire sa section dans `references/pays_francophones.md`. C'est le pays du poste qui compte, pas celui du candidat.
- Identifier la **langue du CV** (étape 3).
- Donner une **évaluation honnête** : pourcentage réaliste d'adéquation, points forts, manques, recommandation en une ligne (postuler / postuler avec réserve / ne pas postuler). Ne pas flatter.

## Étape 2 · Extraire les mots-clés
Écrire `keywords.txt` avec 15 à 30 termes de l'offre (intitulé, outils, méthodes, domaine, certifications, langues exigées ; synonymes séparés par `|`), selon `references/ats_rules.md` §4. Si le CV n'est pas dans la langue de l'offre, garder le terme de l'offre et ajouter sa traduction en synonyme (`qualité des données|data quality`).

## Étape 3 · Choisir la langue, l'angle et les intitulés
- **Langue du CV** : celle que demande l'entreprise, sinon celle de l'offre. Les multinationales, les institutions européennes, les organisations internationales, la tech et les cabinets de conseil demandent souvent un CV en anglais, même pour un poste à Bruxelles, Luxembourg, Genève ou Paris. Offre bilingue ou doute → demander, ou proposer les deux versions.
- **CV en anglais** : les usages du pays du poste restent valables (photo, permis, langues CECR, longueur, papier). Appliquer en plus la section « CV en anglais » de `references/pays_francophones.md` (diplômes, intitulés, contrats, orthographe) et la partie anglaise de `references/style_redaction.md`.
- Mettre en avant les expériences qui répondent à l'offre ; l'ordre peut suivre la pertinence plutôt que la date quand ça aide (en gardant les dates exactes).
- Intitulés de poste : `titre réel · spécialité alignée sur l'offre` (voir `references/style_redaction.md`). Le titre du contrat reste visible, traduit fidèlement dans un CV en anglais.
- Reprendre le vocabulaire exact de l'offre **quand c'est vrai**. Reformuler le réel, ne jamais inventer.

## Étape 4 · Écrire le contenu une fois : `cv_content.json`
Écrire tout le contenu dans `cv_content.json` (schéma : `references/ats_rules.md` §5). `"lang": "fr"` ou `"lang": "en"` (titres de rubrique, « Présent »/« Present » et ponctuation suivent la langue). Dates en MM/AAAA, `"end": "present"` pour un poste en cours, `"paper": "letter"` pour le Québec. Appliquer les règles du pays (photo, date de naissance, permis, langues CECR, longueur) et `references/style_redaction.md` (verbes d'action, vrais chiffres, aucun mot creux, aucun tiret long).
Pour les deux langues : `cv_content.json` et `cv_content_en.json`, écrits à partir du même profil. Chaque version est rédigée et relue dans sa langue, pas traduite mot à mot.

## Étape 5 · Construire le CV
```bash
cd <dossier de travail> && (npm ls docx >/dev/null 2>&1 || npm install docx@9)
node SKILL_DIR/scripts/build_ats_cv.js cv_content.json CV_<Nom>_<Entreprise>_ATS.docx
soffice --headless --convert-to pdf CV_<Nom>_<Entreprise>_ATS.docx
```
Version anglaise en plus de la française : même commande avec `cv_content_en.json` et le suffixe `_EN` (`CV_<Nom>_<Entreprise>_ATS_EN.docx`).
Si `soffice` n'est pas disponible, livrer le .docx seul et indiquer que la personne peut l'exporter en PDF depuis Word.
Les scripts n'ont que deux dépendances, installées seulement si elles manquent : `docx` (npm, écrit les fichiers Word) et `python-docx` (PyPI, les relit pour le test ATS). Ils n'accèdent pas au réseau et n'écrivent que le fichier demandé.
**Version design (facultative)** : si la personne veut aussi un CV plus visuel (pour un envoi par e-mail ou un entretien), le construire à partir du **même** `cv_content.json`, sur un des 11 modèles inspirés de Reactive Resume (rxresu.me). Choisir le modèle selon `references/modeles_design.md` (secteur, pays, photo), puis :
```bash
node SKILL_DIR/scripts/build_design_cv.js cv_content.json CV_<Nom>_<Entreprise>_Design.docx <modèle>
soffice --headless --convert-to pdf CV_<Nom>_<Entreprise>_Design.docx
```
Expliquer qu'il ne doit pas être déposé sur un portail ATS.

## Étape 6 · Test de lecture ATS (obligatoire avant de livrer)
Prérequis : `python3 -c "import docx" || pip install "python-docx~=1.1"` ; pour le PDF, `pdftotext` (paquet poppler). La langue du contrôle est lue dans `cv_content.json`.
```bash
python3 SKILL_DIR/scripts/ats_check.py CV_..._ATS.docx --content cv_content.json --keywords keywords.txt --strict
python3 SKILL_DIR/scripts/ats_check.py CV_..._ATS.pdf --content cv_content.json
```
- Le résultat doit être **PASSE** ; sinon corriger et reconstruire. Tester chaque langue avec son propre `cv_content` et ses mots-clés.
- Couverture des mots-clés visée : **70 % ou plus**, atteinte seulement avec du contenu vrai. Les mots-clés manquants que la personne possède vraiment → les ajouter. Ceux qu'elle n'a pas → les lister dans le rapport, ne jamais les inventer.

## Étape 7 · Livrer
Envoyer les fichiers, puis un rapport court, dans la langue de la conversation (pas forcément celle du CV) :
- adéquation et recommandation ;
- score de mots-clés (x/y, %) et manques réels, avec une piste pour chacun (formation courte, projet, formulation dans la lettre) ;
- ATS détecté et quel fichier utiliser (portail → .docx ATS, ou le PDF si le portail le préfère ; e-mail → version design si elle existe, avec le modèle choisi et deux autres modèles possibles) ;
- une ligne de suivi à coller dans un tableau : `Date | Entreprise | Poste | Lieu | ATS | Langue | Fichier | Score | Lien`.

## Étape 8 · Lettre de motivation (sur demande)
Dans la langue du CV, 3 paragraphes courts : pourquoi cette entreprise, ce que la personne apporte (preuves tirées du CV), la suite (disponibilité, entretien). Formules d'usage :
- en français : « Madame, Monsieur, » (Belgique, France, Suisse, Québec) ou le nom de la personne si connu ; fin « Je vous prie d'agréer, Madame, Monsieur, mes salutations distinguées. » ou, plus sobre, « Cordialement, » ;
- en anglais : « Dear Hiring Manager, » ou « Dear <Prénom Nom>, » si le nom est connu ; fin « Kind regards, ».
Mêmes règles de style que le CV.

## Règles qui ne se discutent pas
- Aucune invention : expérience, diplôme, certification, chiffre, niveau de langue.
- Traduire sans enjoliver : un intitulé de poste ou de diplôme traduit reste fidèle à l'original (diplôme : original entre parenthèses).
- Niveaux de langue honnêtes, au format CECR quand c'est l'usage du pays, dans les deux langues.
- Pas de données sensibles inutiles dans la version ATS (photo, âge, état civil), sauf usage du pays clairement attendu et accepté par la personne.
- Pas de tiret long (—), pas de mots creux (listes française et anglaise dans `references/style_redaction.md`).

## Fichiers
- `references/ats_rules.md` · règles ATS, détection de l'ATS, méthode des mots-clés, schéma JSON, commandes.
- `references/pays_francophones.md` · usages du CV par pays, et CV en anglais dans ces pays.
- `references/style_redaction.md` · style en français et en anglais, mots interdits, règle des intitulés.
- `references/profil_modele.md` · modèle de profil complet à remplir une fois.
- `references/modeles_design.md` · les 11 modèles de la version design, comment choisir, champs `photo` et `design`.
- `scripts/build_ats_cv.js` · construit le CV ATS (.docx) depuis `cv_content.json`.
- `scripts/build_design_cv.js` · construit la version design (.docx) sur un modèle, depuis le même `cv_content.json`.
- `scripts/ats_check.py` · test de lecture ATS et score de mots-clés.
