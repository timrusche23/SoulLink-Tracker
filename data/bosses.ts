import { PokemonType } from "@/types";

export interface BossBattle {
  id: string;
  gameId: string;
  category: "Arena" | "Rivale" | "Top Vier" | "Champ";
  name: string;
  location: string;
  order: number;
  levels: string;
  aceLevel: number;
  specialty?: PokemonType;
  note?: string;
  phase?: "Johto" | "Kanto" | "Hauptgeschichte" | "Pokémon-Liga" | "Postgame";
}

const gyms = (gameId: string, rows: Array<[string, string, PokemonType, string, number]>, phase: BossBattle["phase"] = "Hauptgeschichte", startOrder = 1) =>
  rows.map(([name, location, specialty, levels, aceLevel], index): BossBattle => ({
    id: `${gameId}-gym-${startOrder + index}`,
    gameId,
    category: "Arena",
    name,
    location,
    specialty,
    levels,
    aceLevel,
    order: startOrder + index,
    phase
  }));

const rivals = (gameId: string, rows: Array<[string, string, string, number, string?]>, phase: BossBattle["phase"] = "Hauptgeschichte") =>
  rows.map(([name, location, levels, aceLevel, note], index): BossBattle => ({
    id: `${gameId}-rival-${index + 1}`,
    gameId,
    category: "Rivale",
    name,
    location,
    levels,
    aceLevel,
    note,
    order: index + 1,
    phase
  }));

export const bossBattles: BossBattle[] = [
  ...gyms("red-blue-yellow", [
    ["Rocko", "Marmoria City", "Gestein", "10–14", 14], ["Misty", "Azuria City", "Wasser", "18–21", 21],
    ["Major Bob", "Orania City", "Elektro", "18–24", 24], ["Erika", "Prismania City", "Pflanze", "24–29", 29],
    ["Koga", "Fuchsania City", "Gift", "37–43", 43], ["Sabrina", "Saffronia City", "Psycho", "37–43", 43],
    ["Pyro", "Zinnoberinsel", "Feuer", "42–47", 47], ["Giovanni", "Vertania City", "Boden", "42–50", 50]
  ]),
  ...rivals("red-blue-yellow", [
    ["Rivale", "Route 22", "5", 5, "Früher optionaler Kampf"], ["Rivale", "Azuria City", "15–18", 18],
    ["Rivale", "M.S. Anne", "16–20", 20], ["Rivale", "Pokémon-Turm", "22–25", 25],
    ["Rivale", "Silph Co.", "35–40", 40], ["Rivale", "Route 22", "45–53", 53], ["Champ-Kampf", "Pokémon-Liga", "59–65", 65]
  ]),
  ...gyms("firered-leafgreen", [
    ["Rocko", "Marmoria City", "Gestein", "12–14", 14], ["Misty", "Azuria City", "Wasser", "18–21", 21],
    ["Major Bob", "Orania City", "Elektro", "21–24", 24], ["Erika", "Prismania City", "Pflanze", "24–29", 29],
    ["Koga", "Fuchsania City", "Gift", "37–43", 43], ["Sabrina", "Saffronia City", "Psycho", "37–43", 43],
    ["Pyro", "Zinnoberinsel", "Feuer", "42–47", 47], ["Giovanni", "Vertania City", "Boden", "42–50", 50]
  ]),
  ...rivals("firered-leafgreen", [["Rivale", "Route 22", "5–9", 9], ["Rivale", "Azuria City", "15–18", 18], ["Rivale", "M.S. Anne", "16–20", 20], ["Rivale", "Pokémon-Turm", "22–25", 25], ["Rivale", "Silph Co.", "35–40", 40], ["Rivale", "Route 22", "45–53", 53], ["Champ-Kampf", "Pokémon-Liga", "57–63", 63]]),
  ...gyms("gold-silver-crystal", [
    ["Falk", "Viola City", "Flug", "7–9", 9], ["Kai", "Azalea City", "Käfer", "14–16", 16], ["Bianka", "Dukatia City", "Normal", "18–20", 20],
    ["Jens", "Teak City", "Geist", "21–25", 25], ["Hartwig", "Anemonia City", "Kampf", "27–30", 30], ["Jasmin", "Oliviana City", "Stahl", "30–35", 35],
    ["Norbert", "Mahagonia City", "Eis", "27–31", 31], ["Sandra", "Ebenholz City", "Drache", "37–40", 40]
  ], "Johto"),
  ...gyms("gold-silver-crystal", [
    ["Rocko", "Marmoria City", "Gestein", "41–44", 44], ["Misty", "Azuria City", "Wasser", "42–47", 47],
    ["Major Bob", "Orania City", "Elektro", "40–46", 46], ["Erika", "Prismania City", "Pflanze", "41–46", 46],
    ["Janina", "Fuchsania City", "Gift", "33–39", 39], ["Sabrina", "Saffronia City", "Psycho", "46–48", 48],
    ["Pyro", "Seeschauminseln", "Feuer", "45–50", 50], ["Blau", "Vertania City", "Normal", "54–58", 58]
  ], "Kanto", 9),
  ...rivals("gold-silver-crystal", [["Rivale", "Professor Linds Labor", "5", 5], ["Rivale", "Azalea City", "12–16", 16], ["Rivale", "Knofensa-Turm", "20–22", 22], ["Rivale", "Untergrund", "30–32", 32], ["Rivale", "Siegesstraße", "34–38", 38]], "Johto"),
  ...gyms("heartgold-soulsilver", [
    ["Falk", "Viola City", "Flug", "9–13", 13], ["Kai", "Azalea City", "Käfer", "15–17", 17], ["Bianka", "Dukatia City", "Normal", "17–19", 19],
    ["Jens", "Teak City", "Geist", "21–25", 25], ["Hartwig", "Anemonia City", "Kampf", "29–31", 31], ["Jasmin", "Oliviana City", "Stahl", "30–35", 35],
    ["Norbert", "Mahagonia City", "Eis", "30–34", 34], ["Sandra", "Ebenholz City", "Drache", "38–41", 41]
  ], "Johto"),
  ...gyms("heartgold-soulsilver", [
    ["Rocko", "Marmoria City", "Gestein", "51–54", 54], ["Misty", "Azuria City", "Wasser", "49–54", 54],
    ["Major Bob", "Orania City", "Elektro", "47–53", 53], ["Erika", "Prismania City", "Pflanze", "51–56", 56],
    ["Janina", "Fuchsania City", "Gift", "44–50", 50], ["Sabrina", "Saffronia City", "Psycho", "53–55", 55],
    ["Pyro", "Seeschauminseln", "Feuer", "54–59", 59], ["Blau", "Vertania City", "Normal", "52–60", 60]
  ], "Kanto", 9),
  ...rivals("heartgold-soulsilver", [["Silber", "Professor Linds Labor", "5", 5], ["Silber", "Azalea City", "14–18", 18], ["Silber", "Turmruine", "20–22", 22], ["Silber", "Untergrund", "30–34", 34], ["Silber", "Siegesstraße", "36–40", 40]], "Johto"),
  ...gyms("ruby-sapphire-emerald", [
    ["Felizia", "Metarost City", "Gestein", "12–15", 15], ["Kamillo", "Faustauhaven", "Kampf", "16–19", 19], ["Walter", "Malvenfroh City", "Elektro", "20–24", 24],
    ["Flavia", "Bad Lavastadt", "Feuer", "24–29", 29], ["Norman", "Blütenburg City", "Normal", "27–31", 31], ["Wibke", "Baumhausen City", "Flug", "29–33", 33],
    ["Ben & Svenja", "Moosbach City", "Psycho", "41–42", 42], ["Wassili/Juan", "Xeneroville", "Wasser", "40–46", 46]
  ]),
  ...rivals("ruby-sapphire-emerald", [["Maike/Brix", "Route 103", "5", 5], ["Maike/Brix", "Route 110", "18–20", 20], ["Maike/Brix", "Route 119", "29–31", 31], ["Heiko", "Siegesstraße", "44–45", 45]],),
  ...gyms("diamond-pearl-platinum", [
    ["Veit", "Erzelingen", "Gestein", "12–14", 14], ["Silvana", "Ewigenau", "Pflanze", "19–22", 22], ["Hilda", "Schleiede", "Kampf", "27–32", 32],
    ["Marinus", "Weideburg", "Wasser", "27–37", 37], ["Lamina", "Herzhofen", "Geist", "24–36", 36], ["Adam", "Fleetburg", "Stahl", "36–41", 41],
    ["Frida", "Blizzach", "Eis", "38–44", 44], ["Volkner", "Sonnewik", "Elektro", "46–50", 50]
  ]),
  ...rivals("diamond-pearl-platinum", [["Barry", "Route 203", "7–9", 9], ["Barry", "Herzhofen", "26–28", 28], ["Barry", "Fleetburg", "35–37", 37], ["Barry", "Pokémon-Liga", "48–51", 51]]),
  ...gyms("black-white", [
    ["Benny/Maik/Colin", "Orion City", "Pflanze", "12–14", 14], ["Aloe", "Septerna City", "Normal", "18–20", 20], ["Artie", "Stratos City", "Käfer", "21–23", 23],
    ["Kamilla", "Rayono City", "Elektro", "25–27", 27], ["Turner", "Marea City", "Boden", "29–31", 31], ["Géraldine", "Panaero City", "Flug", "33–35", 35],
    ["Sandro", "Nevaio City", "Eis", "37–39", 39], ["Lysander/Lilia", "Twindrake City", "Drache", "41–43", 43]
  ]),
  ...rivals("black-white", [["Bell/Cheren", "Route 1", "5", 5], ["Cheren", "Route 3", "12–14", 14], ["Bell", "Route 4", "18–20", 20], ["Cheren", "Route 10", "43–45", 45], ["N", "Pokémon-Liga", "50–52", 52]]),
  ...gyms("black2-white2", [
    ["Cheren", "Eventura City", "Normal", "11–13", 13], ["Mica", "Vapydro City", "Gift", "16–18", 18], ["Artie", "Stratos City", "Käfer", "22–24", 24],
    ["Kamilla", "Rayono City", "Elektro", "28–30", 30], ["Turner", "Marea City", "Boden", "31–33", 33], ["Géraldine", "Panaero City", "Flug", "37–39", 39],
    ["Sandro", "Twindrake City", "Drache", "46–48", 48], ["Benson", "Abidaya City", "Wasser", "49–51", 51]
  ]),
  ...rivals("black2-white2", [["Matisse", "Route 19", "5", 5], ["Matisse", "Vapydro-Werke", "12–14", 14], ["Matisse", "Route 4", "24–26", 26], ["Matisse", "Siegesstraße", "55–57", 57]])
];
