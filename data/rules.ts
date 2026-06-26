import { ChallengeRule } from "@/types";

export const ruleTemplates: ChallengeRule[] = [
  { id: "rule-first", title: "Erstes Pokémon", description: "Pro Route darf nur das erste Pokémon gefangen werden.", enabled: true, order: 1 },
  { id: "rule-death", title: "Verbundener Tod", description: "Wenn ein Pokémon stirbt, sterben alle mit ihm verbundenen Pokémon.", enabled: true, order: 2 },
  { id: "rule-dupes", title: "Dupes Clause", description: "Doppelte Pokémon oder Entwicklungen derselben Entwicklungsreihe sind nicht erlaubt.", enabled: true, order: 3 },
  { id: "rule-types", title: "Primärtypen-Regel", description: "Pokémon mit gleichen Primärtypen dürfen nicht gleichzeitig im Team sein.", enabled: false, order: 4 },
  { id: "rule-sync", title: "Gemeinsamer Fortschritt", description: "Jeder Teilnehmer muss dasselbe Gebiet abgeschlossen haben, bevor es weitergeht.", enabled: true, order: 5 },
  { id: "rule-items", title: "Keine Heilitems", description: "Heilitems im Kampf sind nicht erlaubt.", enabled: false, order: 6 },
  { id: "rule-set", title: "Kampfstil Folge", description: "Der Kampfstil wird auf „Folge“ gestellt.", enabled: false, order: 7 },
  { id: "rule-grave", title: "Friedhofsbox", description: "Besiegte Pokémon müssen dauerhaft in eine Friedhofsbox verschoben werden.", enabled: true, order: 8 }
];
