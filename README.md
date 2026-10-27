# CV ATS francophone · skill Claude

Un skill Claude gratuit pour rédiger un CV **adapté à chaque offre**, **en français ou en anglais**, et **lisible par les logiciels de recrutement (ATS)**, selon les usages des pays francophones : **Belgique, France, Suisse romande, Luxembourg, Québec et Afrique francophone**.

La plupart des skills CV existants suivent les normes américaines ou britanniques. Celui-ci part des réalités francophones : langues au format CECR (essentielles en Belgique, en Suisse et au Luxembourg), photo et date de naissance selon le pays, permis de séjour en Suisse, papier lettre et règles anti-discrimination au Québec, équivalences de diplômes étrangers.

Beaucoup d'entreprises de ces pays (multinationales, institutions européennes, organisations internationales, tech, conseil) demandent un CV en anglais. Le skill le rédige aussi en anglais, en gardant les usages du pays du poste : un CV en anglais pour Genève n'est pas un CV américain.

## Ce qu'il fait
1. **Évalue honnêtement** l'adéquation entre votre profil et l'offre (pourcentage, points forts, manques, recommandation).
2. **Repère l'ATS** de l'entreprise à partir du lien de l'offre (Workday, SmartRecruiters, Taleo, iCIMS, Greenhouse, Lever, Teamtailor, Recruitee, SuccessFactors...) et applique ses règles.
3. **Choisit la langue du CV** : celle que demande l'entreprise, sinon celle de l'offre. En anglais, il traduit fidèlement les intitulés de poste et de diplôme (original entre parenthèses), les types de contrat et les lieux.
4. **Extrait les mots-clés** de l'offre et les reprend dans votre CV, **seulement quand c'est vrai**.
5. **Construit un CV ATS** en Word (.docx) et en PDF texte : une colonne, aucun tableau, aucune zone de texte, dates au format MM/AAAA.
6. **Construit une version design** (facultative) sur 11 modèles inspirés de [Reactive Resume](https://rxresu.me), pour un envoi par e-mail ou un entretien.
7. **Teste la lecture** du CV comme le ferait un ATS : nom, e-mail, téléphone, chaque poste, chaque entreprise, chaque date. Si quelque chose ne passe pas, il corrige avant de livrer.
8. **Donne un score de mots-clés** (par exemple 9/11, 82 %) et la liste honnête de ce qui manque.
9. Rédige la **lettre de motivation** sur demande, en français ou en anglais.

Il n'invente jamais d'expérience, de diplôme, de chiffre ni de niveau de langue.

## Les modèles de la version design
![Les 11 modèles de la version design](exemples/apercu_modeles.png)

Une colonne : onyx, rhyhorn, kakuna, porygon, bronzor. Deux colonnes : azurill, pikachu, gengar, ditto, chikorita, glalie. Le skill propose un modèle selon le secteur et le pays (photo attendue en Suisse, à éviter au Québec). La version design ne se dépose jamais sur un portail ATS : c'est la version ATS qui sert pour les portails.

## Exemples
Profil fictif de Camille DUPONT, Data Analyst à Liège :

| Fichier source | Résultat |
|---|---|
| `exemples/cv_content_exemple.json` + `keywords_exemple.txt` | `CV_Camille_DUPONT_Exemple_ATS.pdf` (français) |
| `exemples/cv_content_example_en.json` + `keywords_example_en.txt` | `CV_Camille_DUPONT_Example_ATS_EN.pdf` (anglais) |
| `exemples/cv_content_exemple.json` (modèle pikachu) | `CV_Camille_DUPONT_Exemple_Design.pdf` |

Résultats du test :
```
Français : MOTS-CLÉS 9/11 (82 %)  · manquants : Tableau, Azure · TEST DE LECTURE ATS : PASSE
Anglais  : MOTS-CLÉS 10/12 (83 %) · manquants : Tableau, Azure · TEST DE LECTURE ATS : PASSE
```

## Installation

### Claude.ai (web, desktop, mobile)
1. Téléchargez ce dépôt (bouton **Code → Download ZIP**) et décompressez-le.
2. Recompressez **uniquement** le dossier `skills/cv-ats-francophone` (le fichier ZIP doit contenir ce dossier, avec `SKILL.md` dedans).
3. Dans les paramètres de Claude, section **Skills**, importez ce ZIP et activez le skill.

### Claude Code
```bash
git clone https://github.com/melataguia/ats-resume-francophone.git
cp -r ats-resume-francophone/skills/cv-ats-francophone ~/.claude/skills/
```
Prérequis pour les scripts : Node.js (avec le paquet `docx`, installé automatiquement par le skill), Python 3 avec `python-docx`, poppler (`pdftotext`) pour tester un PDF, et LibreOffice ou Word pour l'export PDF (facultatif).

## Utilisation
Joignez votre CV actuel (ou remplissez une fois `references/profil_modele.md`), collez l'offre ou son lien, et demandez par exemple :
- « Adapte mon CV à cette offre pour un poste à Bruxelles. »
- « Mon CV passe-t-il les ATS ? Voici le lien de l'offre. »
- « Fais-moi un CV pour cette offre à Genève et la lettre de motivation. »
- « Cette entreprise de Luxembourg demande un CV en anglais : fais-le. »
- « Fais aussi une version design avec le modèle gengar. »
- « Tailor my CV to this job in Brussels, in English. »

Conseil : gardez votre profil complet dans un fichier. Le skill choisit à chaque fois ce qui sert pour l'offre, dans la langue demandée.

## Contenu
```
skills/cv-ats-francophone/
├── SKILL.md                      instructions pour Claude
├── references/
│   ├── ats_rules.md              règles ATS, détection de l'ATS, mots-clés, format du contenu
│   ├── pays_francophones.md      usages du CV par pays, et CV en anglais dans ces pays
│   ├── style_redaction.md        style en français et en anglais, mots creux à éviter, intitulés de poste
│   ├── modeles_design.md         les 11 modèles de la version design et comment choisir
│   └── profil_modele.md          modèle de profil complet
└── scripts/
    ├── build_ats_cv.js           construit le CV ATS (.docx)
    ├── build_design_cv.js        construit la version design (.docx) sur un modèle
    └── ats_check.py              test de lecture ATS + score de mots-clés
exemples/                         profil fictif en français et en anglais, mots-clés, CV générés, aperçu des modèles
```

## Contribuer
Les usages évoluent et varient selon les secteurs. Vous recrutez au Sénégal, au Maroc, en Côte d'Ivoire, à Genève ou à Montréal et vous voyez une règle à corriger ou à ajouter ? Ouvrez une *issue* ou une *pull request* sur `references/pays_francophones.md`, avec une source si possible.
Vous avez vu un ATS mal lire un CV produit par ce skill ? Décrivez le cas (sans données personnelles) dans une *issue*.

## Avertissement
Ce skill aide à présenter un parcours réel de façon claire. Il ne garantit pas un entretien : les ATS et les recruteurs ont chacun leurs critères. Les usages par pays sont des pratiques courantes, pas des règles légales, sauf mention contraire.

## Crédits
Les mises en page de la version design reprennent celles des modèles de [Reactive Resume](https://rxresu.me) d'Amruth Pillai (licence MIT). Le code de ce dépôt est écrit pour Word et ne reprend pas celui de Reactive Resume.

## Auteur
Créé par **Bidias Melataguia**, fondateur de The Analyst. Licence MIT : libre d'utilisation, de modification et de partage.

## In English
A free Claude skill that tailors a CV to each job offer, **in French or in English**, and makes it readable by applicant tracking systems (ATS), following the CV conventions of French-speaking countries: Belgium, France, French-speaking Switzerland, Luxembourg, Quebec and francophone Africa. Many employers there (multinationals, EU institutions, international organisations) ask for an English CV: the skill writes it in English while keeping the conventions of the job's country (CEFR language levels, photo rules, Swiss residence permit, letter paper in Quebec), and translates job and degree titles faithfully, with the original degree title in brackets.

It detects the company's ATS from the job link, extracts the offer's keywords and uses them only when they are true, builds an ATS-safe CV in Word and PDF plus an optional designed version (11 layouts inspired by Reactive Resume), tests how an ATS reads it and scores keyword coverage. It never invents experience, degrees, figures or language levels. English example: `exemples/cv_content_example_en.json` gives `exemples/CV_Camille_DUPONT_Example_ATS_EN.pdf` (keywords 10/12, ATS read test passed). Installation: same steps as above.
