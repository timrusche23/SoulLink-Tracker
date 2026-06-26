import { Pokemon } from "@/types";

const img = (id: number) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;

export const pokemon: Pokemon[] = [
  { id: "bulbasaur", nationalDex: 1, name: "Bisasam", generationIntroduced: 1, types: ["Pflanze", "Gift"], sprite: img(1) },
  { id: "charmander", nationalDex: 4, name: "Glumanda", generationIntroduced: 1, types: ["Feuer"], sprite: img(4) },
  { id: "squirtle", nationalDex: 7, name: "Schiggy", generationIntroduced: 1, types: ["Wasser"], sprite: img(7) },
  { id: "caterpie", nationalDex: 10, name: "Raupy", generationIntroduced: 1, types: ["Käfer"], sprite: img(10) },
  { id: "weedle", nationalDex: 13, name: "Hornliu", generationIntroduced: 1, types: ["Käfer", "Gift"], sprite: img(13) },
  { id: "pidgey", nationalDex: 16, name: "Taubsi", generationIntroduced: 1, types: ["Normal", "Flug"], sprite: img(16) },
  { id: "rattata", nationalDex: 19, name: "Rattfratz", generationIntroduced: 1, types: ["Normal"], sprite: img(19) },
  { id: "spearow", nationalDex: 21, name: "Habitak", generationIntroduced: 1, types: ["Normal", "Flug"], sprite: img(21) },
  { id: "pikachu", nationalDex: 25, name: "Pikachu", generationIntroduced: 1, types: ["Elektro"], sprite: img(25) },
  { id: "sandshrew", nationalDex: 27, name: "Sandan", generationIntroduced: 1, types: ["Boden"], sprite: img(27) },
  { id: "nidoran-f", nationalDex: 29, name: "Nidoran♀", generationIntroduced: 1, types: ["Gift"], sprite: img(29) },
  { id: "zubat", nationalDex: 41, name: "Zubat", generationIntroduced: 1, types: ["Gift", "Flug"], sprite: img(41) },
  { id: "oddish", nationalDex: 43, name: "Myrapla", generationIntroduced: 1, types: ["Pflanze", "Gift"], sprite: img(43) },
  { id: "geodude", nationalDex: 74, name: "Kleinstein", generationIntroduced: 1, types: ["Gestein", "Boden"], sprite: img(74) },
  { id: "gastly", nationalDex: 92, name: "Nebulak", generationIntroduced: 1, types: ["Geist", "Gift"], sprite: img(92) },
  { id: "chikorita", nationalDex: 152, name: "Endivie", generationIntroduced: 2, types: ["Pflanze"], sprite: img(152) },
  { id: "cyndaquil", nationalDex: 155, name: "Feurigel", generationIntroduced: 2, types: ["Feuer"], sprite: img(155) },
  { id: "totodile", nationalDex: 158, name: "Karnimani", generationIntroduced: 2, types: ["Wasser"], sprite: img(158) },
  { id: "sentret", nationalDex: 161, name: "Wiesor", generationIntroduced: 2, types: ["Normal"], sprite: img(161) },
  { id: "hoothoot", nationalDex: 163, name: "Hoothoot", generationIntroduced: 2, types: ["Normal", "Flug"], sprite: img(163) },
  { id: "treecko", nationalDex: 252, name: "Geckarbor", generationIntroduced: 3, types: ["Pflanze"], sprite: img(252) },
  { id: "torchic", nationalDex: 255, name: "Flemmli", generationIntroduced: 3, types: ["Feuer"], sprite: img(255) },
  { id: "mudkip", nationalDex: 258, name: "Hydropi", generationIntroduced: 3, types: ["Wasser"], sprite: img(258) },
  { id: "turtwig", nationalDex: 387, name: "Chelast", generationIntroduced: 4, types: ["Pflanze"], sprite: img(387) },
  { id: "chimchar", nationalDex: 390, name: "Panflam", generationIntroduced: 4, types: ["Feuer"], sprite: img(390) },
  { id: "piplup", nationalDex: 393, name: "Plinfa", generationIntroduced: 4, types: ["Wasser"], sprite: img(393) },
  { id: "snivy", nationalDex: 495, name: "Serpifeu", generationIntroduced: 5, types: ["Pflanze"], sprite: img(495) },
  { id: "tepig", nationalDex: 498, name: "Floink", generationIntroduced: 5, types: ["Feuer"], sprite: img(498) },
  { id: "oshawott", nationalDex: 501, name: "Ottaro", generationIntroduced: 5, types: ["Wasser"], sprite: img(501) }
];
