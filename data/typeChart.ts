import { PokemonType } from "@/types";
import { allTypes } from "./games";

export const typeChart: Record<PokemonType, Partial<Record<PokemonType, 0 | 0.5 | 2>>> = {
  Normal: { Gestein: 0.5, Geist: 0, Stahl: 0.5 },
  Feuer: { Feuer: 0.5, Wasser: 0.5, Pflanze: 2, Eis: 2, Käfer: 2, Gestein: 0.5, Drache: 0.5, Stahl: 2 },
  Wasser: { Feuer: 2, Wasser: 0.5, Pflanze: 0.5, Boden: 2, Gestein: 2, Drache: 0.5 },
  Elektro: { Wasser: 2, Elektro: 0.5, Pflanze: 0.5, Boden: 0, Flug: 2, Drache: 0.5 },
  Pflanze: { Feuer: 0.5, Wasser: 2, Pflanze: 0.5, Gift: 0.5, Boden: 2, Flug: 0.5, Käfer: 0.5, Gestein: 2, Drache: 0.5, Stahl: 0.5 },
  Eis: { Feuer: 0.5, Wasser: 0.5, Pflanze: 2, Eis: 0.5, Boden: 2, Flug: 2, Drache: 2, Stahl: 0.5 },
  Kampf: { Normal: 2, Eis: 2, Gift: 0.5, Flug: 0.5, Psycho: 0.5, Käfer: 0.5, Gestein: 2, Geist: 0, Unlicht: 2, Stahl: 2, Fee: 0.5 },
  Gift: { Pflanze: 2, Gift: 0.5, Boden: 0.5, Gestein: 0.5, Geist: 0.5, Stahl: 0, Fee: 2 },
  Boden: { Feuer: 2, Elektro: 2, Pflanze: 0.5, Gift: 2, Flug: 0, Käfer: 0.5, Gestein: 2, Stahl: 2 },
  Flug: { Elektro: 0.5, Pflanze: 2, Kampf: 2, Käfer: 2, Gestein: 0.5, Stahl: 0.5 },
  Psycho: { Kampf: 2, Gift: 2, Psycho: 0.5, Unlicht: 0, Stahl: 0.5 },
  Käfer: { Feuer: 0.5, Pflanze: 2, Kampf: 0.5, Gift: 0.5, Flug: 0.5, Psycho: 2, Geist: 0.5, Unlicht: 2, Stahl: 0.5, Fee: 0.5 },
  Gestein: { Feuer: 2, Eis: 2, Kampf: 0.5, Boden: 0.5, Flug: 2, Käfer: 2, Stahl: 0.5 },
  Geist: { Normal: 0, Psycho: 2, Geist: 2, Unlicht: 0.5 },
  Drache: { Drache: 2, Stahl: 0.5, Fee: 0 },
  Unlicht: { Kampf: 0.5, Psycho: 2, Geist: 2, Unlicht: 0.5, Fee: 0.5 },
  Stahl: { Feuer: 0.5, Wasser: 0.5, Elektro: 0.5, Eis: 2, Gestein: 2, Stahl: 0.5, Fee: 2 },
  Fee: { Feuer: 0.5, Kampf: 2, Gift: 0.5, Drache: 2, Unlicht: 2, Stahl: 0.5 }
};

export function getEffectiveness(attack: PokemonType, defense: PokemonType): 0 | 0.5 | 1 | 2 {
  return typeChart[attack][defense] ?? 1;
}

export function calculateDefense(types: PokemonType[]) {
  return allTypes.map((attackType) => {
    const multiplier = types.reduce<number>((total, defenseType) => total * getEffectiveness(attackType, defenseType), 1);
    return { attackType, multiplier };
  });
}
