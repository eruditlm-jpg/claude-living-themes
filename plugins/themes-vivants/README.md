# Thèmes vivants

Les quatre thèmes vivants de la collection (Lucioles, Océan nocturne, Forêt sous la pluie, Ville néon) réunis en un seul plugin. La commande `/ambiance` permet de passer de l'un à l'autre sans rien réinstaller, et le choix est retenu pour les sessions suivantes. Chaque scène garde sa réaction à la session : contexte, appels d'outils, échecs ou coût.

## Commandes

- `/ambiance` : liste les thèmes et indique celui qui est actif.
- `/ambiance lucioles`, `/ambiance ocean`, `/ambiance foret`, `/ambiance ville` : change de thème. Les noms accentués (`océan`, `forêt`, `néon`) et quelques synonymes (`mer`, `pluie`, `prairie`) marchent aussi.
- `/ambiance aucun` : retire le fond.

Claude Code a déjà sa propre commande `/theme`, pour les couleurs du terminal : d'où le nom `/ambiance`.

N'installe pas en plus les thèmes séparés : deux thèmes actifs se disputent l'arrière-plan.

## Installation

```
/plugin install themes-vivants --marketplace eruditlm-jpg/claude-living-themes
```
