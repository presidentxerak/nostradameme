import { fnv1a } from "@/lib/utils/hash";

export const ORACLE_QUOTES: readonly string[] = [
  "The ancient scroll whispers of a green candle...",
  "Even the blind can see what the chart foretells.",
  "The frog of fate hops toward YES.",
  "The oracle saw this in the embers of a forgotten memecoin.",
  "Whispers from the moon echo in the hearts of degens.",
  "The cards are drawn. The orb is lit. The vibes are immaculate.",
  "A single tear rolls down the oracle's cheek for those who fade.",
  "The stars align, but so do the liquidation engines.",
  "Behold: the oracle grins. The bulls tremble with joy.",
  "A chill runs through the chamber. The bears are listening.",
  "The oracle dreamed of rockets and emerald fields.",
  "Beware the ides of dumps, for they come swiftly.",
  "The orb is cloudy. The oracle is also cloudy.",
  "A sage nod from Nostradameme himself.",
  "The ancient meme foretold this exact price action.",
  "The runes read: 'send it.'",
  "The oracle's cat refuses to come out. A bad omen.",
  "The pepes sing in the key of YES.",
  "The wojaks weep, for the oracle sees NO ahead.",
  "In the silence between candles, the oracle speaks.",
  "The frogs have voted. The votes are loud.",
  "Even the crystal ball has FOMO today.",
  "The oracle rolled a natural twenty. Bullish.",
  "A fog of uncertainty blankets the prophecy room.",
  "The oracle saw a massive green dildo in a vision.",
  "A whisper from the void: 'hodl, mortals, hodl.'",
  "The chart reveals itself to those who meditate.",
  "The oracle flipped a coin. The coin said YES.",
  "The oracle flipped a coin. The coin is still spinning.",
  "A gentle breeze of copium fills the chamber.",
  "The runes tremble with quiet confidence.",
  "The oracle sees a bull dancing atop a bear's grave.",
  "The oracle sees a bear drinking from a bull's skull.",
  "The incense burns blue. The oracle approves.",
  "The oracle's tea leaves spell out 'wagmi.'",
  "The oracle's tea leaves spell out 'ngmi.'",
  "A single candle in the darkness points the way.",
  "The oracle's third eye twitches with certainty.",
  "The oracle's third eye twitches with doubt.",
  "A thousand degens cry out in unison. The oracle hears them.",
  "The tide is turning. Or is it? The oracle isn't sure.",
  "The oracle laughs at your stop losses.",
  "In the crystal depths, a rocket is forming.",
  "In the crystal depths, a crab scuttles sideways.",
  "The oracle has seen this play out before. It always ends the same.",
  "A soft glow surrounds the YES option. Take the hint.",
  "A soft glow surrounds the NO option. Heed the warning.",
  "The oracle's incense smells suspiciously bullish.",
  "The prophecy is sealed in wax, fire, and hopium.",
  "The oracle says nothing. The silence says everything.",
] as const;

if (ORACLE_QUOTES.length !== 50) {
  throw new Error(
    `Oracle quotes must be exactly 50. Got ${ORACLE_QUOTES.length}`,
  );
}

export function getMarketQuote(marketId: string): string {
  const idx = fnv1a(marketId) % ORACLE_QUOTES.length;
  return ORACLE_QUOTES[idx] ?? ORACLE_QUOTES[0]!;
}
