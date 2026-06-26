import { createChallenge } from "@/lib/utils";
import { Challenge } from "@/types";

export function createSampleChallenge(): Challenge {
  const challenge = createChallenge("Kanto SoulLink Crew", "gen-1", "firered-leafgreen", ["Lena", "Max", "Noah"]);
  const starters = challenge.encounters[0];
  starters.entries[0] = { ...starters.entries[0], pokemonId: "bulbasaur", nickname: "Blattwerk", level: 5, ability: "Notdünger", moves: ["Tackle", "Heuler"], status: "Im Team" };
  starters.entries[1] = { ...starters.entries[1], pokemonId: "charmander", nickname: "Funke", level: 5, ability: "Großbrand", moves: ["Kratzer", "Heuler"], status: "Im Team" };
  starters.entries[2] = { ...starters.entries[2], pokemonId: "squirtle", nickname: "Welle", level: 5, ability: "Sturzbach", moves: ["Tackle", "Rutenschlag"], status: "Im Team" };
  const route1 = challenge.encounters[1];
  route1.entries[0] = { ...route1.entries[0], pokemonId: "pidgey", nickname: "Wind", level: 3, moves: ["Tackle"], status: "Aktiv" };
  route1.entries[1] = { ...route1.entries[1], pokemonId: "rattata", nickname: "Zahn", level: 4, moves: ["Tackle"], status: "Aktiv" };
  route1.entries[2] = { ...route1.entries[2], pokemonId: "weedle", nickname: "Stachel", level: 3, moves: ["Giftstachel"], status: "Aktiv" };
  const forest = challenge.encounters[3];
  forest.entries[0] = { ...forest.entries[0], pokemonId: "caterpie", level: 5, moves: ["Tackle"], status: "Gestorben" };
  forest.entries[1] = { ...forest.entries[1], pokemonId: "pikachu", level: 4, moves: ["Donnerschock"], status: "Gestorben" };
  forest.entries[2] = { ...forest.entries[2], pokemonId: "weedle", level: 4, moves: ["Giftstachel"], status: "Gestorben" };
  return challenge;
}
