import { Challenge, Encounter, Location, PokemonEntry, PokemonStatus, SoulLinkGroup } from "@/types";
import { games, locations } from "@/data/games";
import { ruleTemplates } from "@/data/rules";

export const uid = (prefix = "id") => `${prefix}-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;

export const statusStyles: Record<PokemonStatus, string> = {
  Aktiv: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  "Im Team": "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
  "In der Box": "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
  Besiegt: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200",
  Gestorben: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
  Freigelassen: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200",
  "Nicht gefangen": "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
};

export function createEntry(participantId: string, locationId: string): PokemonEntry {
  return { id: uid("entry"), participantId, locationId, moves: [], status: "Nicht gefangen" };
}

export function createEmptyEncounters(participantIds: string[], gameId: string): { locations: Location[]; encounters: Encounter[] } {
  const gameLocations = locations.filter((location) => location.gameIds.includes(gameId)).sort((a, b) => a.order - b.order);
  return {
    locations: gameLocations,
    encounters: gameLocations.map((location) => ({
      id: uid("encounter"),
      locationId: location.id,
      entries: participantIds.map((id) => createEntry(id, location.id))
    }))
  };
}

export function createChallenge(name: string, generationId: string, gameId: string, participantNames: string[]): Challenge {
  const participants = participantNames.slice(0, 5).map((participantName, index) => ({
    id: uid("participant"),
    name: participantName.trim(),
    color: ["#ef4444", "#3b82f6", "#22c55e", "#a855f7", "#f59e0b"][index]
  }));
  const data = createEmptyEncounters(participants.map((p) => p.id), gameId);
  const now = new Date().toISOString();
  return {
    id: uid("challenge"),
    name: name.trim(),
    generationId,
    gameId,
    participants,
    rules: ruleTemplates.map((rule) => ({ ...rule, id: uid("rule") })),
    extraRules: "",
    locations: data.locations,
    encounters: data.encounters,
    settings: { autoKillLinkedPokemon: true, darkMode: true },
    createdAt: now,
    updatedAt: now
  };
}

export function getSoulLinkGroup(challenge: Challenge, encounter: Encounter): SoulLinkGroup {
  const entryIds = encounter.entries.map((entry) => entry.id);
  const filled = encounter.entries.filter((entry) => entry.pokemonId && entry.status !== "Nicht gefangen");
  const dead = encounter.entries.some((entry) => entry.status === "Gestorben");
  const status = encounter.entries.every((entry) => !entry.pokemonId) ? "Leer" : dead ? "Tot" : filled.length === challenge.participants.length ? "Aktiv" : "Unvollständig";
  return { id: `soul-${encounter.locationId}`, locationId: encounter.locationId, entryIds, status };
}

export function enrichChallengeForParticipants(challenge: Challenge): Challenge {
  const encounters = challenge.encounters.map((encounter) => ({
    ...encounter,
    entries: challenge.participants.map((participant) => encounter.entries.find((entry) => entry.participantId === participant.id) ?? createEntry(participant.id, encounter.locationId))
  }));
  return { ...challenge, encounters, updatedAt: new Date().toISOString() };
}

export const defaultGame = games[0];
