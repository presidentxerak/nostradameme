# Oracle Background Videos

Ce dossier contient les vidéos de fond de l'oracle.
Chaque vidéo tourne en boucle derrière la carte de prophétie. Le composant
`components/oracle-video.tsx` choisit la phase à afficher en fonction du
cycle de vie du marché (3 minutes de fenêtre de pari).

## Fichiers utilisés par le code

| Fichier | Phase | Description | Quand joué |
|---|---|---|---|
| `prediction-stand.mp4` | `stand` | L'oracle attend, ambiance mystique calme. | Aucun marché ouvert, ou les 30 premières secondes de la fenêtre de pari |
| `prediction-start.mp4` | `start` | L'oracle s'active, énergie qui monte. | Phase principale de la fenêtre (entre 30s écoulées et 30s restantes) |
| `prediction-ended.mp4` | `ended` | Flash dramatique, révélation. | Marché fermé / résolu, ou les 30 dernières secondes |

Le mapping est défini dans `components/oracle-video.tsx` :

```ts
const VIDEO_SRC: Record<VideoPhase, string> = {
  stand: "/videos/prediction-stand.mp4",
  start: "/videos/prediction-start.mp4",
  ended: "/videos/prediction-ended.mp4",
};
```

## Specs techniques

- **Format** : MP4 (H.264) — compatibilité maximale navigateurs
- **Résolution** : 1080x1920 (portrait, mobile-first) ou 1920x1080 (paysage, avec crop CSS)
- **Durée** : 5-15 secondes par vidéo (bouclées)
- **Taille max** : < 5 MB chacune (optimisé web)
- **Audio** : aucun (les vidéos jouent en muet avec `muted autoplay loop`)
- **Fond** : tons sombres (#0a0a0f → #1a0a2e) pour s'intégrer au thème
- **Zone centrale libre** : laisser le centre vide pour la carte de prophétie en overlay

## Palette de couleurs des vidéos

- Fond principal : `#0a0a0f` (noir profond)
- Lueurs : `#7c3aed` (violet oracle) / `#9d5cf0` (violet clair)
- Stand : particules violettes lentes
- Start : traînées d'énergie violettes montantes, orbe pulsant
- Ended : flash blanc → pluie dorée (`#f59e0b`) si victoire, voile rouge si défaite
