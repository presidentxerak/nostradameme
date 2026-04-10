# Oracle Lottie animation

Drop `oracle.json` in this directory.

The component `components/oracle-character.tsx` tries to fetch
`/lottie/oracle.json` at runtime. If the file is missing or fails to
parse, it falls back to the pure-SVG oracle defined in
`components/oracle-svg.tsx`, so the game remains fully functional.

Design direction for the Lottie animation (designer brief):

- Hooded oracle figure, dark purple cloak, glowing orb in hand.
- 5 distinct states matched to the game: bullish (hand raised, green glow),
  bearish (head shake, red glow), uncertain (left/right glances, amber),
  balanced (neutral, violet pulse), dormant (eyes closed, dim).
- Loop softly, 60fps preferred.
- Keep background transparent.
