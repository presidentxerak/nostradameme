# Oracle Background Videos

Ce dossier contient les 4 vidéos de fond de l'oracle.
Chaque vidéo tourne en boucle derrière la carte de prophétie.

## Fichiers attendus

| Fichier | État du marché | Description | Quand joué |
|---|---|---|---|
| `oracle-idle.mp4` | Stand-by | L'oracle attend, ambiance mystique calme. Orbe pulse doucement. La carte affiche la question + boutons YES/NO inactifs. | Aucun marché ouvert, ou utilisateur n'a pas encore parié |
| `oracle-launch.mp4` | Lancement | L'oracle s'active, énergie qui monte, orbe s'illumine. La carte affiche la question + boutons YES/NO prêts. Transition dramatique. | Le marché vient d'ouvrir, ou l'utilisateur arrive sur la page |
| `oracle-active.mp4` | Prédiction en cours | L'oracle vibre d'énergie, particules flottent, orbe tourne. La carte affiche la question + boutons YES/NO actifs avec le tug-of-war. | Marché ouvert, paris en cours |
| `oracle-reveal.mp4` | Résultat | Flash dramatique, l'oracle lève les mains, révélation. La carte affiche le résultat (YES ou NO) avec effets de victoire/défaite. | Le marché vient d'être résolu |

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
- Idle : particules violettes lentes
- Launch : traînées d'énergie violettes montantes
- Active : orbe pulsant entre vert (`#10b981`) et rouge (`#ef4444`) selon le ratio YES/NO
- Reveal : flash blanc → pluie dorée (`#f59e0b`) si victoire, voile rouge si défaite

## Intégration dans le code

Les vidéos sont lues par le composant `OracleCharacter` :

```tsx
<video
  src={`/videos/oracle-${state}.mp4`}
  autoPlay
  loop
  muted
  playsInline
  className="absolute inset-0 h-full w-full object-cover"
/>
```

Les 4 états mappent directement :
- `idle` → `oracle-idle.mp4`
- `launch` → `oracle-launch.mp4`
- `active` → `oracle-active.mp4`
- `reveal` → `oracle-reveal.mp4`
