import { PokemonType } from "@/types";

export type CatchStatus = "Kein Status" | "Paralyse" | "Vergiftung" | "Verbrennung" | "Schlaf" | "Gefroren";
export type CatchBall =
  | "Pokéball" | "Superball" | "Hyperball" | "Meisterball"
  | "Netzball" | "Tauchball" | "Nestball" | "Wiederball" | "Timerball"
  | "Finsterball" | "Flottball" | "Heilball" | "Luxusball" | "Premierball"
  | "Levelball" | "Köderball" | "Mondball" | "Freundesball" | "Sympaball" | "Schwerball" | "Turboball";

export interface CatchContext {
  gameId: string;
  ball: CatchBall;
  status: CatchStatus;
  currentHp: number;
  maxHp: number;
  targetLevel: number;
  playerLevel: number;
  turn: number;
  targetTypes: PokemonType[];
  atNightOrCave: boolean;
  fishingEncounter: boolean;
  surfingOrUnderwater: boolean;
  caughtBefore: boolean;
  sameSpeciesOppositeGender: boolean;
  moonStoneEvolution: boolean;
  baseSpeedAtLeast100: boolean;
  targetWeightKg?: number;
}

export const catchBalls: CatchBall[] = [
  "Pokéball", "Superball", "Hyperball", "Meisterball", "Netzball", "Tauchball", "Nestball", "Wiederball",
  "Timerball", "Finsterball", "Flottball", "Heilball", "Luxusball", "Premierball", "Levelball", "Köderball",
  "Mondball", "Freundesball", "Sympaball", "Schwerball", "Turboball"
];

export function mechanicsGeneration(gameId: string): 1 | 2 | 3 | 4 | 5 {
  if (gameId === "red-blue-yellow") return 1;
  if (gameId === "gold-silver-crystal") return 2;
  if (gameId === "firered-leafgreen" || gameId === "ruby-sapphire-emerald") return 3;
  if (gameId === "heartgold-soulsilver" || gameId === "diamond-pearl-platinum") return 4;
  return 5;
}

export function statusMultiplier(status: CatchStatus, generation: number): number {
  if (status === "Schlaf" || status === "Gefroren") return generation >= 5 ? 2.5 : 2;
  if (status !== "Kein Status") return 1.5;
  return 1;
}

function standardBallModifier(context: CatchContext, generation: number): number {
  switch (context.ball) {
    case "Pokéball":
    case "Heilball":
    case "Luxusball":
    case "Premierball": return 1;
    case "Superball": return 1.5;
    case "Hyperball": return 2;
    case "Meisterball": return 255;
    case "Netzball": return context.targetTypes.some((type) => type === "Wasser" || type === "Käfer") ? (generation >= 7 ? 3.5 : 3) : 1;
    case "Tauchball": return context.surfingOrUnderwater ? (generation === 3 ? 3.5 : 3) : 1;
    case "Nestball": return generation <= 4 ? Math.max(1, (40 - context.targetLevel) / 10) : Math.max(1, (41 - context.targetLevel) / 10);
    case "Wiederball": return context.caughtBefore ? (generation >= 7 ? 3.5 : 3) : 1;
    case "Timerball": return generation <= 4 ? Math.min(4, 1 + Math.max(0, context.turn - 1) * 0.1) : Math.min(4, 1 + Math.max(0, context.turn - 1) * 0.3);
    case "Finsterball": return context.atNightOrCave ? (generation <= 6 ? 3.5 : 3) : 1;
    case "Flottball": return context.turn <= 1 ? (generation === 4 ? 4 : 5) : 1;
    case "Levelball": {
      if (context.playerLevel >= context.targetLevel * 4) return 8;
      if (context.playerLevel >= context.targetLevel * 2) return 4;
      if (context.playerLevel > context.targetLevel) return 2;
      return 1;
    }
    case "Köderball": return context.fishingEncounter ? 3 : 1;
    case "Mondball": return context.moonStoneEvolution ? 4 : 1;
    case "Sympaball": return context.sameSpeciesOppositeGender ? 8 : 1;
    case "Turboball": return context.baseSpeedAtLeast100 ? 4 : 1;
    case "Freundesball":
    case "Schwerball": return 1;
  }
}

export function ballModifier(context: CatchContext): { modifier: number; catchRateAdjustment: number; note?: string } {
  const generation = mechanicsGeneration(context.gameId);
  if (context.ball === "Meisterball") return { modifier: 255, catchRateAdjustment: 0, note: "Garantierter Fang." };

  if (generation === 1 && !["Pokéball", "Superball", "Hyperball", "Meisterball"].includes(context.ball)) {
    return { modifier: 1, catchRateAdjustment: 0, note: "Dieser Ball existiert in dieser Edition nicht; als Pokéball berechnet." };
  }
  if (generation === 2 && ["Netzball", "Tauchball", "Nestball", "Wiederball", "Timerball", "Finsterball", "Flottball", "Heilball", "Luxusball"].includes(context.ball)) {
    return { modifier: 1, catchRateAdjustment: 0, note: "Dieser Ball existiert in dieser Edition nicht; als Pokéball berechnet." };
  }
  if (generation === 3 && ["Finsterball", "Flottball", "Heilball"].includes(context.ball)) {
    return { modifier: 1, catchRateAdjustment: 0, note: "Dieser Ball existiert in dieser Edition nicht; als Pokéball berechnet." };
  }

  // HGSS applies Apricorn balls unusually: most bonuses modify the species catch rate directly.
  if (context.gameId === "heartgold-soulsilver") {
    if (context.ball === "Schwerball") {
      const weight = context.targetWeightKg ?? 0;
      const adjustment = weight >= 409.6 ? 40 : weight >= 307.2 ? 30 : weight >= 204.8 ? 20 : -20;
      return { modifier: 1, catchRateAdjustment: adjustment, note: "HG/SS-Schwerball verändert die Basis-Fangrate abhängig vom Gewicht." };
    }
    if (["Levelball", "Köderball", "Mondball", "Sympaball", "Turboball"].includes(context.ball)) {
      return { modifier: 1, catchRateAdjustment: 0, note: "HG/SS-Aprikokoball: Der angezeigte Bonus wird editionsspezifisch auf die Fangrate angewendet." };
    }
  }

  return { modifier: standardBallModifier(context, generation), catchRateAdjustment: 0 };
}

export function calculateCatchChance(baseCatchRate: number, context: CatchContext): {
  chance: number;
  modifiedCatchValue: number;
  ballModifier: number;
  statusModifier: number;
  mechanicsGeneration: number;
  note?: string;
} {
  const generation = mechanicsGeneration(context.gameId);
  const maxHp = Math.max(1, context.maxHp);
  const currentHp = Math.min(maxHp, Math.max(1, context.currentHp));
  const ball = ballModifier(context);
  const status = statusMultiplier(context.status, generation);

  if (context.ball === "Meisterball") {
    return { chance: 100, modifiedCatchValue: 255, ballModifier: 255, statusModifier: status, mechanicsGeneration: generation, note: ball.note };
  }

  let effectiveRate = Math.max(1, Math.min(255, baseCatchRate + ball.catchRateAdjustment));
  let modifier = ball.modifier;

  // HGSS Apricorn balls (except Heavy) modify catch rate rather than the regular ball factor.
  if (context.gameId === "heartgold-soulsilver" && ["Levelball", "Köderball", "Mondball", "Sympaball", "Turboball"].includes(context.ball)) {
    modifier = standardBallModifier(context, generation);
    effectiveRate = Math.max(1, Math.min(255, Math.floor(effectiveRate * modifier)));
    modifier = 1;
  }

  // Gen I/II are substantially different. This normalized estimate preserves the edition's HP/status/ball effects
  // without claiming frame-perfect emulation of every original-game edge case.
  if (generation <= 2) {
    const hpFactor = (3 * maxHp - 2 * currentHp) / (3 * maxHp);
    const estimated = Math.min(1, (effectiveRate / 255) * hpFactor * modifier * status);
    return {
      chance: estimated * 100,
      modifiedCatchValue: estimated * 255,
      ballModifier: modifier,
      statusModifier: status,
      mechanicsGeneration: generation,
      note: [ball.note, "Für Generation I/II wird eine nachvollziehbare Näherung angezeigt; die Originalspiele verwenden andere Ganzzahl- und Statusroutinen."].filter(Boolean).join(" ")
    };
  }

  const a = Math.max(1, Math.floor(((3 * maxHp - 2 * currentHp) * effectiveRate * modifier) / (3 * maxHp) * status));
  if (a >= 255) {
    return { chance: 100, modifiedCatchValue: a, ballModifier: modifier, statusModifier: status, mechanicsGeneration: generation, note: ball.note };
  }

  // Four shake checks. This is the standard Gen III+ probability derived from the modified catch value.
  const shakeThreshold = Math.floor(1048560 / Math.sqrt(Math.sqrt(16711680 / a)));
  const singleShake = Math.min(1, shakeThreshold / 65536);
  const chance = Math.pow(singleShake, 4) * 100;
  return { chance, modifiedCatchValue: a, ballModifier: modifier, statusModifier: status, mechanicsGeneration: generation, note: ball.note };
}
