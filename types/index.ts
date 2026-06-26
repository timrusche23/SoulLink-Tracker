export type ID = string;

export type PokemonType =
  | "Normal" | "Feuer" | "Wasser" | "Elektro" | "Pflanze" | "Eis"
  | "Kampf" | "Gift" | "Boden" | "Flug" | "Psycho" | "Käfer"
  | "Gestein" | "Geist" | "Drache" | "Unlicht" | "Stahl" | "Fee";

export type PokemonStatus =
  | "Aktiv"
  | "Im Team"
  | "In der Box"
  | "Besiegt"
  | "Gestorben"
  | "Freigelassen"
  | "Nicht gefangen";

export interface Generation {
  id: ID;
  number: number;
  name: string;
  availableTypes: PokemonType[];
}

export interface Game {
  id: ID;
  generationId: ID;
  name: string;
  region: string;
}

export interface Participant {
  id: ID;
  name: string;
  color: string;
  avatar?: string;
}

export interface Location {
  id: ID;
  gameIds: ID[];
  name: string;
  category: "Route" | "Höhle" | "Wald" | "Stadt" | "Spezial" | "Geschenk" | "Starter" | "Fossil" | "Statisch" | "Safari";
  order: number;
  custom?: boolean;
}

export interface Pokemon {
  id: ID;
  nationalDex: number;
  name: string;
  generationIntroduced: number;
  types: PokemonType[];
  sprite?: string;
}

export interface PokemonEntry {
  id: ID;
  participantId: ID;
  locationId: ID;
  pokemonId?: ID;
  nickname?: string;
  level?: number;
  ability?: string;
  moves: string[];
  notes?: string;
  status: PokemonStatus;
}

export interface Encounter {
  id: ID;
  locationId: ID;
  entries: PokemonEntry[];
  notes?: string;
}

export interface SoulLinkGroup {
  id: ID;
  locationId: ID;
  entryIds: ID[];
  status: "Aktiv" | "Tot" | "Unvollständig" | "Leer";
}

export interface ChallengeRule {
  id: ID;
  title: string;
  description: string;
  enabled: boolean;
  order: number;
}

export interface TypeEffectiveness {
  attackType: PokemonType;
  defenseType: PokemonType;
  multiplier: 0 | 0.5 | 1 | 2;
  generationFrom: number;
}

export interface ChallengeSettings {
  autoKillLinkedPokemon: boolean;
  darkMode: boolean;
}

export interface Challenge {
  id: ID;
  name: string;
  generationId: ID;
  gameId: ID;
  participants: Participant[];
  rules: ChallengeRule[];
  extraRules: string;
  locations: Location[];
  encounters: Encounter[];
  settings: ChallengeSettings;
  createdAt: string;
  updatedAt: string;
}
