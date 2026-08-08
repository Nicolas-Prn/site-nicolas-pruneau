# Conventions du projet

## Contexte
Site vitrine d'un développeur freelance étudiant (ingénieur civil).
Cible : commerces, indépendants, PME et ASBL de la région de Charleroi.

## Contraintes techniques
- Sortie 100 % statique, déployée sur Cloudflare Pages
- Pas de framework JS lourd, pas de dépendance non justifiée
- Polices auto-hébergées (RGPD)
- Aucun service tiers côté client
- Mobile d'abord
- Cible Lighthouse ≥ 95 sur les 4 axes

## Contraintes de design
- Sobre, élégant, professionnel. Ne doit PAS avoir l'air généré par IA.
- Interdits : dégradés violet/bleu, glassmorphism, emojis comme icônes,
  ombres portées partout, animations au scroll, illustrations undraw,
  sections features 3 colonnes génériques.
- Voir design-bref.md pour la direction visuelle validée.

## Contraintes de contenu
- Aucun texte inventé, aucun placeholder en production.
- Le contenu de référence est dans content/copy.md.

## Fichiers non versionnés
`plan.md`, `design-bref.md` et `content/` contiennent la stratégie et les
tarifs internes : ils ne sont jamais commités (voir `.gitignore`). Ce sont
des documents de travail locaux, pas des artefacts du repo public.

## Développement

```
npm run dev
npm run build
npm run preview
```
