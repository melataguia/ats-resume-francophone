# Modèles de la version design

La version design reprend les mises en page de Reactive Resume (https://rxresu.me, code sous licence MIT). On peut voir chaque modèle dans la galerie https://rxresu.me/resume-templates avant de choisir. Elle est construite par `scripts/build_design_cv.js` à partir du **même** `cv_content.json` que la version ATS.

À ne jamais déposer sur un portail ATS : la mise en page utilise des tableaux et des formes de couleur. Pour un portail, c'est toujours la version ATS.

Tous les modèles fonctionnent en français et en anglais : avec `"lang": "en"`, les titres de rubrique et « Present » passent en anglais.

## Les 11 modèles

Chaque modèle a son nom d'origine (celui de Reactive Resume) et un nom parlant, en français et en anglais. Les trois marchent, avec ou sans accents : `onyx`, `classique` ou `classic` donnent le même modèle. Avec une personne non technique, parler avec les noms parlants.

| Modèle | Nom parlant | Colonnes | Allure | Pour qui |
|---|---|---|---|---|
| `onyx` | classique / classic | 1 | Photo à gauche du nom, nom en serif, titres de rubrique sobres | Banque, finance, audit, juridique, secteur public. Choix par défaut. |
| `rhyhorn` | épuré / clean | 1 | Photo à droite, titres soulignés de la couleur | Tech, data, ingénierie, conseil |
| `kakuna` | centré / centered | 1 | Tout centré, titres centrés | Profils juniors, enseignement, santé |
| `porygon` | encadré / boxed | 1 | En-tête encadré, titres en bandeaux pleins | Hôtellerie, commerce, logistique, profils opérationnels |
| `bronzor` | structuré / structured | 1 | Une ligne par rubrique, intitulé à gauche | Profils seniors, institutions, CV de 2 pages |
| `azurill` | aéré / airy | 2, barre à gauche | En-tête centré, compétences et formation à gauche | Tech, produit, gestion de projet |
| `pikachu` | moderne / modern | 2, barre à gauche | Photo dans la barre, nom dans un bloc coloré | Conseil, RH, formation |
| `gengar` | créatif / creative | 2, barre à gauche | Barre teintée, bloc coloré avec le nom, profil sur fond teinté | Marketing, communication, vente |
| `ditto` | bandeau / banner | 2, barre à gauche | Bandeau coloré sur toute la largeur | Architecture, design, métiers créatifs |
| `chikorita` | audacieux / bold | 2, barre à droite | Barre pleine couleur à droite, texte blanc | Marketing, marque, événementiel |
| `glalie` | doux / soft | 2, barre à gauche | Barre teintée claire avec nom et coordonnées encadrées | Environnement, ONG, secteur associatif |

Les modèles à une colonne se lisent du haut vers le bas comme la version ATS. Ce sont les plus sûrs quand le CV sera aussi transmis à un recruteur qui le copie dans un outil.

## Choisir le modèle
1. Si la personne a un modèle préféré dans son profil, le prendre.
2. Sinon, partir du secteur (tableau ci-dessus) et du ton de l'offre : entreprise classique → une colonne ; agence, start-up, métier créatif → deux colonnes.
3. Tenir compte du pays (`references/pays_francophones.md`) :
   - **Suisse, Afrique (entreprises locales)** : photo attendue ou fréquente → un modèle avec photo, si la personne en fournit une.
   - **Québec** : pas de photo (ne pas renseigner `photo`, ou `"design": { "photo": false }`) ; `"paper": "letter"` fonctionne avec tous les modèles.
   - **Belgique, France, Luxembourg** : photo facultative ; tous les modèles conviennent.
4. Proposer **un** modèle avec une phrase de justification, et citer deux autres choix possibles. Ne pas construire les onze.

## Champs de `cv_content.json` utilisés par la version design
```json
{
  "photo": "photo.jpg",
  "design": {
    "template": "onyx",
    "accent": "1F3A5F",
    "font": "Calibri",
    "nameFont": "Georgia",
    "photo": true
  }
}
```
- `photo` : chemin vers une photo **carrée** (.jpg ou .png), relatif au fichier JSON. La version ATS l'ignore.
- `design.template` : un des 11 modèles, par son nom d'origine ou son nom parlant. On peut aussi le donner en 3e argument de la commande.
- `design.accent` : couleur principale (hexadécimal). Chaque modèle a sa couleur par défaut, proche de celle de Reactive Resume.
- `design.font`, `design.nameFont` : polices du texte et du nom. Par défaut Calibri, et Georgia pour le nom dans onyx, porygon, ditto et chikorita. Ces polices sont installées avec Word sur Windows et Mac.
- `design.photo: false` : masque la photo sans la retirer du fichier.

## Commandes
```bash
node SKILL_DIR/scripts/build_design_cv.js --list
node SKILL_DIR/scripts/build_design_cv.js cv_content.json CV_<Nom>_<Entreprise>_Design.docx classique
soffice --headless --convert-to pdf CV_<Nom>_<Entreprise>_Design.docx
```
Livrer le PDF de la version design quand c'est possible : les polices et les couleurs sont figées. Sans `soffice`, la personne l'exporte en PDF depuis Word.

## Limites connues
- La photo est carrée (pas de rognage en cercle).
- Les icônes de contact de Reactive Resume sont remplacées par des séparateurs « | ».
- Les autres modèles de Reactive Resume (Ditgar, Lapras, Leafish, Meowth, Persian, Scizor, Smeargle) ne sont pas reproduits : leur mise en page est proche d'un des 11 ci-dessus.
