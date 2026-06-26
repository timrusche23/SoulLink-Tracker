import { Game, Generation, Location, PokemonType } from "@/types";

export const allTypes: PokemonType[] = ["Normal", "Feuer", "Wasser", "Elektro", "Pflanze", "Eis", "Kampf", "Gift", "Boden", "Flug", "Psycho", "Käfer", "Gestein", "Geist", "Drache", "Unlicht", "Stahl", "Fee"];

export const generations: Generation[] = [
  { id: "gen-1", number: 1, name: "Generation 1", availableTypes: allTypes.filter((t) => !["Unlicht", "Stahl", "Fee"].includes(t)) },
  { id: "gen-2", number: 2, name: "Generation 2", availableTypes: allTypes.filter((t) => t !== "Fee") },
  { id: "gen-3", number: 3, name: "Generation 3", availableTypes: allTypes.filter((t) => t !== "Fee") },
  { id: "gen-4", number: 4, name: "Generation 4", availableTypes: allTypes.filter((t) => t !== "Fee") },
  { id: "gen-5", number: 5, name: "Generation 5", availableTypes: allTypes.filter((t) => t !== "Fee") }
];

export const games: Game[] = [
  { id: "red-blue-yellow", generationId: "gen-1", name: "Rot / Blau / Gelb", region: "Kanto" },
  { id: "firered-leafgreen", generationId: "gen-1", name: "Feuerrot / Blattgrün", region: "Kanto" },
  { id: "gold-silver-crystal", generationId: "gen-2", name: "Gold / Silber / Kristall", region: "Johto" },
  { id: "heartgold-soulsilver", generationId: "gen-2", name: "HeartGold / SoulSilver", region: "Johto" },
  { id: "ruby-sapphire-emerald", generationId: "gen-3", name: "Rubin / Saphir / Smaragd", region: "Hoenn" },
  { id: "diamond-pearl-platinum", generationId: "gen-4", name: "Diamant / Perl / Platin", region: "Sinnoh" },
  { id: "black-white", generationId: "gen-5", name: "Schwarz / Weiß", region: "Einall" },
  { id: "black2-white2", generationId: "gen-5", name: "Schwarz 2 / Weiß 2", region: "Einall" }
];

const kanto = ["Starter-Pokémon", "Route 1", "Route 2", "Vertania-Wald", "Route 3", "Mondberg", "Route 4", "Route 24", "Route 25", "Route 5", "Route 6", "Digda-Höhle", "Route 11", "Felstunnel", "Route 8", "Pokémon-Turm", "Safari-Zone", "Kraftwerk", "Seeschauminseln", "Siegesstraße"];
const johto = ["Starter-Pokémon", "Route 29", "Route 46", "Route 30", "Dunkelhöhle", "Route 31", "Knofensa-Turm", "Route 32", "Einheitstunnel", "Route 33", "Flegmon-Brunnen", "Ilex-Wald", "Route 34", "Nationalpark", "Route 36", "Route 37", "Teak City Geschenk", "See des Zorns", "Eispfad", "Siegesstraße"];
const hoenn = ["Starter-Pokémon", "Route 101", "Route 103", "Route 102", "Blütenburgwald", "Route 104", "Metarost City Geschenk", "Route 116", "Metaflurtunnel", "Route 110", "Route 117", "Feuriger Pfad", "Route 113", "Meteorfälle", "Safari-Zone", "Route 119", "Route 120", "Route 121", "Tiefseehöhle", "Siegesstraße"];
const sinnoh = ["Starter-Pokémon", "Route 201", "See der Wahrheit", "Route 202", "Route 203", "Erzelingen-Mine", "Route 204", "Verwüsteter Pfad", "Ewigwald", "Route 205", "Alte Villa", "Route 206", "Kraterberg", "Route 209", "Trostu-Ruinen", "Route 210", "Eiseninsel", "Route 216", "See der Stärke", "Siegesstraße"];
const unova = ["Starter-Pokémon", "Route 1", "Traumbrache", "Route 2", "Grundwassersenke", "Route 3", "Septerna-Wald", "Route 4", "Wüstenresort", "Alter Palast", "Route 5", "Elektrolithhöhle", "Route 6", "Panaero-Höhle", "Route 7", "Turm des Himmels", "Route 8", "Drachenstiege", "Riesengrotte", "Siegesstraße"];

function makeLocations(names: string[], gameIds: string[]): Location[] {
  return names.map((name, index) => ({
    id: `${gameIds[0]}-${index + 1}`,
    gameIds,
    name,
    category: name.includes("Starter") ? "Starter" : name.includes("Route") ? "Route" : name.includes("Wald") ? "Wald" : name.includes("Höhle") || name.includes("Berg") || name.includes("Mine") || name.includes("Tunnel") ? "Höhle" : name.includes("Geschenk") ? "Geschenk" : name.includes("Safari") ? "Safari" : "Spezial",
    order: index + 1
  }));
}

export const locations: Location[] = [
  ...makeLocations(kanto, ["red-blue-yellow", "firered-leafgreen"]),
  ...makeLocations(johto, ["gold-silver-crystal", "heartgold-soulsilver"]),
  ...makeLocations(hoenn, ["ruby-sapphire-emerald"]),
  ...makeLocations(sinnoh, ["diamond-pearl-platinum"]),
  ...makeLocations(unova, ["black-white", "black2-white2"])
];
