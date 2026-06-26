"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Cloud, Download, LogIn, LogOut, Plus, RefreshCcw, Trash2, Upload } from "lucide-react";
import { games, generations, allTypes } from "@/data/games";
import { pokemon } from "@/data/pokemon";
import { bossBattles } from "@/data/bosses";
import { calculateDefense, getEffectiveness } from "@/data/typeChart";
import { calculateCatchChance, catchBalls, CatchBall, CatchStatus, mechanicsGeneration } from "@/data/catchRate";
import { createChallenge, createEntry, enrichChallengeForParticipants, getSoulLinkGroup, statusStyles, uid } from "@/lib/utils";
import { clearChallenge, loadChallenge, saveChallenge } from "@/lib/storage";
import { Challenge, ChallengeRule, Encounter, PokemonEntry, PokemonStatus, PokemonType } from "@/types";

const nav = ["Dashboard", "Routen", "Teams", "Arenen & Rivalen", "Fangchance", "Schwächentabelle", "Regeln", "Einstellungen"] as const;
type Tab = (typeof nav)[number];
interface AccountUser { id: string; username: string; displayName: string; preferredDarkMode: boolean }
interface ChallengeSummary { id: string; name: string; gameId: string; generationId: string; participantCount: number; updatedAt: string }
type AuthMode = "login";
const statuses: PokemonStatus[] = ["Aktiv", "Im Team", "In der Box", "Besiegt", "Gestorben", "Freigelassen", "Nicht gefangen"];
const filters = ["alle", "aktiv", "gestorben", "unvollständig", "im Team", "in der Box", "noch nicht gefangen"] as const;

const typeColors: Record<PokemonType, { background: string; color: string }> = {
  Normal: { background: "#A8A77A", color: "#111827" },
  Feuer: { background: "#EE8130", color: "#ffffff" },
  Wasser: { background: "#6390F0", color: "#ffffff" },
  Elektro: { background: "#F7D02C", color: "#111827" },
  Pflanze: { background: "#7AC74C", color: "#111827" },
  Eis: { background: "#96D9D6", color: "#111827" },
  Kampf: { background: "#C22E28", color: "#ffffff" },
  Gift: { background: "#A33EA1", color: "#ffffff" },
  Boden: { background: "#E2BF65", color: "#111827" },
  Flug: { background: "#A98FF3", color: "#111827" },
  Psycho: { background: "#F95587", color: "#ffffff" },
  Käfer: { background: "#A6B91A", color: "#111827" },
  Gestein: { background: "#B6A136", color: "#111827" },
  Geist: { background: "#735797", color: "#ffffff" },
  Drache: { background: "#6F35FC", color: "#ffffff" },
  Unlicht: { background: "#705746", color: "#ffffff" },
  Stahl: { background: "#B7B7CE", color: "#111827" },
  Fee: { background: "#D685AD", color: "#111827" }
};

function effectivenessStyle(multiplier: number) {
  if (multiplier === 0) return { backgroundColor: "#64748b", color: "#ffffff" };
  if (multiplier === 0.5) return { backgroundColor: "#ef4444", color: "#ffffff" };
  if (multiplier === 2) return { backgroundColor: "#22c55e", color: "#052e16" };
  return { backgroundColor: "#f1f5f9", color: "#334155" };
}

export function ChallengeApp() {
  const [mounted, setMounted] = useState(false);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("Dashboard");
  const [filter, setFilter] = useState<(typeof filters)[number]>("alle");
  const [query, setQuery] = useState("");
  const [user, setUser] = useState<AccountUser | null>(null);
  const [challengeList, setChallengeList] = useState<ChallengeSummary[]>([]);
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);
  const [syncState, setSyncState] = useState<"local" | "saving" | "saved" | "error">("local");
  const [darkMode, setDarkMode] = useState(true);
  const fileInput = useRef<HTMLInputElement | null>(null);
  const firstLoad = useRef(true);

  function applyDarkMode(next: boolean) {
    document.documentElement.classList.toggle("dark", next);
    setDarkMode(next);
  }

  function hydrateChallenge(payload: Challenge, preferredDarkMode = darkMode) {
    return enrichChallengeForParticipants({
      ...payload,
      settings: {
        ...payload.settings,
        darkMode: preferredDarkMode
      }
    });
  }

  async function persistDarkModePreference(next: boolean) {
    applyDarkMode(next);
    setUser((current) => (current ? { ...current, preferredDarkMode: next } : current));
    setChallenge((current) => (current ? { ...current, settings: { ...current.settings, darkMode: next }, updatedAt: new Date().toISOString() } : current));

    if (!user) return;

    try {
      const response = await fetch("/api/auth/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferredDarkMode: next })
      });

      if (!response.ok) throw new Error("preference-save-failed");
    } catch {
      window.alert("Der Dark Mode konnte nicht im Account gespeichert werden.");
    }
  }

  async function refreshChallengeList(selectId?: string, preferredDarkMode = darkMode) {
    const response = await fetch("/api/challenges", { cache: "no-store" });
    if (!response.ok) return;
    const data = (await response.json()) as { challenges: ChallengeSummary[] };
    setChallengeList(data.challenges);
    const targetId = selectId ?? data.challenges[0]?.id;
    if (targetId) {
      const detail = await fetch(`/api/challenges/${targetId}`, { cache: "no-store" });
      if (detail.ok) {
        const payload = (await detail.json()) as { challenge: Challenge };
        setChallenge(hydrateChallenge(payload.challenge, preferredDarkMode));
      }
    }
  }

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        const data = (await response.json()) as { user: AccountUser | null };
        const preferred = data.user?.preferredDarkMode ?? true;

        applyDarkMode(preferred);
        setUser(data.user);

        if (data.user) {
          await refreshChallengeList(undefined, preferred);
          const listResponse = await fetch("/api/challenges", { cache: "no-store" });
          const listData = (await listResponse.json()) as { challenges: ChallengeSummary[] };
          if (listData.challenges.length === 0) {
            const sample = hydrateChallenge(loadChallenge(), preferred);
            await fetch(`/api/challenges/${sample.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(sample)
            });
            setChallenge(sample);
            await refreshChallengeList(sample.id, preferred);
          }
          setSyncState("saved");
        } else {
          setChallenge(null);
          setAuthMode("login");
          setSyncState("local");
        }
      } catch {
        setChallenge(null);
        setAuthMode("login");
        setSyncState("error");
      } finally {
        firstLoad.current = false;
        setMounted(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!challenge || firstLoad.current) return;
    if (!user) {
      saveChallenge(challenge);
      setSyncState("local");
      return;
    }
    setSyncState("saving");
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/challenges/${challenge.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(challenge) });
        if (!response.ok) throw new Error("save failed");
        setSyncState("saved");
        setChallengeList((current) => {
          const summary: ChallengeSummary = { id: challenge.id, name: challenge.name, gameId: challenge.gameId, generationId: challenge.generationId, participantCount: challenge.participants.length, updatedAt: new Date().toISOString() };
          return [summary, ...current.filter((item) => item.id !== challenge.id)];
        });
      } catch {
        setSyncState("error");
      }
    }, 700);
    return () => window.clearTimeout(timer);
  }, [challenge, user]);

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body = { username: String(form.get("username") ?? ""), password: String(form.get("password") ?? "") };
    const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = (await response.json()) as { user?: AccountUser; error?: string };
    if (!response.ok || !data.user) return window.alert(data.error ?? "Anmeldung fehlgeschlagen.");

    setUser(data.user);
    setAuthMode(null);
    applyDarkMode(data.user.preferredDarkMode);
    const listResponse = await fetch("/api/challenges", { cache: "no-store" });
    const listData = (await listResponse.json()) as { challenges: ChallengeSummary[] };
    setChallengeList(listData.challenges);

    if (listData.challenges[0]) {
      await refreshChallengeList(listData.challenges[0].id, data.user.preferredDarkMode);
    } else {
      const fresh = hydrateChallenge(
        createChallenge("Neue SoulLink-Challenge", games[0].generationId, games[0].id, [data.user.displayName]),
        data.user.preferredDarkMode
      );
      await fetch(`/api/challenges/${fresh.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(fresh) });
      setChallenge(fresh);
      await refreshChallengeList(fresh.id, data.user.preferredDarkMode);
    }
    setSyncState("saved");
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setChallenge(null);
    setChallengeList([]);
    setAuthMode("login");
    setSyncState("local");
    applyDarkMode(true);
  }

  async function selectCloudChallenge(id: string) {
    const response = await fetch(`/api/challenges/${id}`, { cache: "no-store" });
    if (!response.ok) return;
    const data = (await response.json()) as { challenge: Challenge };
    setChallenge(hydrateChallenge(data.challenge));
  }

  async function deleteCurrentCloudChallenge() {
    if (!user || !challenge || !window.confirm("Diese Challenge dauerhaft vom Server löschen?")) return;
    const response = await fetch(`/api/challenges/${challenge.id}`, { method: "DELETE" });
    if (!response.ok) return window.alert("Die Challenge konnte nicht gelöscht werden.");
    const remaining = challengeList.filter((item) => item.id !== challenge.id);
    setChallengeList(remaining);
    if (remaining[0]) await selectCloudChallenge(remaining[0].id);
    else {
      const fresh = hydrateChallenge(
        createChallenge("Neue SoulLink-Challenge", games[0].generationId, games[0].id, [user.displayName]),
        user.preferredDarkMode
      );
      setChallenge(fresh);
    }
  }

  const generation = useMemo(() => generations.find((g) => g.id === challenge?.generationId) ?? generations[0], [challenge]);
  const game = useMemo(() => games.find((g) => g.id === challenge?.gameId) ?? games[0], [challenge]);
  const availablePokemon = useMemo(() => pokemon.filter((p) => p.generationIntroduced <= generation.number), [generation.number]);

  if (!mounted) return <main className="min-h-screen p-6">Lade Anmeldung…</main>;
  if (!user || !challenge) return <LoginScreen onSubmit={handleAuth} />;
  const activeChallenge = challenge;

  const updateChallenge = (updater: (draft: Challenge) => Challenge) => setChallenge((current) => (current ? updater(current) : current));

  const stats = challenge.encounters.reduce(
    (acc, encounter) => {
      const group = getSoulLinkGroup(challenge, encounter);
      if (group.status === "Aktiv") acc.active += 1;
      if (group.status === "Tot") acc.deadLinks += 1;
      if (group.status === "Unvollständig") acc.incomplete += 1;
      acc.deadPokemon += encounter.entries.filter((entry) => entry.status === "Gestorben").length;
      return acc;
    },
    { active: 0, deadLinks: 0, incomplete: 0, deadPokemon: 0 }
  );

  function patchEntry(encounterId: string, participantId: string, patch: Partial<PokemonEntry>) {
    updateChallenge((current) => {
      const encounters = current.encounters.map((encounter) => {
        if (encounter.id !== encounterId) return encounter;
        const entries = encounter.entries.map((entry) => (entry.participantId === participantId ? { ...entry, ...patch } : entry));
        const shouldKillAll = current.settings.autoKillLinkedPokemon && patch.status === "Gestorben";
        return { ...encounter, entries: shouldKillAll ? entries.map((entry) => (entry.pokemonId ? { ...entry, status: "Gestorben" as PokemonStatus } : entry)) : entries };
      });
      return { ...current, encounters, updatedAt: new Date().toISOString() };
    });
  }

  function addParticipant() {
    if (activeChallenge.participants.length >= 5) return;
    const name = window.prompt("Name des neuen Teilnehmers");
    if (!name?.trim()) return;
    const participant = { id: uid("participant"), name: name.trim(), color: ["#ef4444", "#3b82f6", "#22c55e", "#a855f7", "#f59e0b"][activeChallenge.participants.length] ?? "#64748b" };
    updateChallenge((current) => ({
      ...current,
      participants: [...current.participants, participant],
      encounters: current.encounters.map((encounter) => ({ ...encounter, entries: [...encounter.entries, createEntry(participant.id, encounter.locationId)] }))
    }));
  }

  function removeParticipant(id: string) {
    if (activeChallenge.participants.length <= 1) return;
    if (!window.confirm("Teilnehmer wirklich löschen? Die zugehörigen Pokémon-Einträge werden entfernt.")) return;
    updateChallenge((current) => ({
      ...current,
      participants: current.participants.filter((p) => p.id !== id),
      encounters: current.encounters.map((encounter) => ({ ...encounter, entries: encounter.entries.filter((entry) => entry.participantId !== id) }))
    }));
  }

  function createNewChallenge(formData: FormData) {
    const name = String(formData.get("challengeName") || "Neue SoulLink-Challenge");
    const gameId = String(formData.get("gameId") || games[0].id);
    const selectedGame = games.find((g) => g.id === gameId) ?? games[0];
    const names = Array.from({ length: 5 }, (_, index) => String(formData.get(`participant-${index}`) || "").trim()).filter(Boolean);
    if (names.length < 1 || names.length > 5) return window.alert("Bitte 1 bis 5 Teilnehmernamen eintragen.");
    setChallenge(hydrateChallenge(createChallenge(name, selectedGame.generationId, gameId, names), user?.preferredDarkMode ?? darkMode));
    setActiveTab("Dashboard");
  }

  function addLocation() {
    const name = window.prompt("Name des eigenen Fangorts");
    if (!name?.trim()) return;
    updateChallenge((current) => {
      const location = { id: uid("location"), gameIds: [current.gameId], name: name.trim(), category: "Spezial" as const, order: current.locations.length + 1, custom: true };
      return {
        ...current,
        locations: [...current.locations, location],
        encounters: [...current.encounters, { id: uid("encounter"), locationId: location.id, entries: current.participants.map((p) => createEntry(p.id, location.id)) }]
      };
    });
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(activeChallenge, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeChallenge.name.toLowerCase().replace(/[^a-z0-9]+/gi, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importJson(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    file.text().then((text) => {
      try {
        const imported = JSON.parse(text) as Challenge;
        if (!imported.id || !Array.isArray(imported.participants)) throw new Error("Ungültige Datei");
        setChallenge(hydrateChallenge(imported, user?.preferredDarkMode ?? darkMode));
      } catch {
        window.alert("Die JSON-Datei konnte nicht importiert werden.");
      }
    });
  }

  const visibleEncounters = challenge.encounters.filter((encounter) => {
    const location = challenge.locations.find((l) => l.id === encounter.locationId);
    const group = getSoulLinkGroup(challenge, encounter);
    const text = `${location?.name ?? ""} ${encounter.entries.map((entry) => `${pokemon.find((p) => p.id === entry.pokemonId)?.name ?? ""} ${entry.nickname ?? ""}`).join(" ")}`.toLowerCase();
    const matchesQuery = text.includes(query.toLowerCase());
    const matchesFilter = filter === "alle" ||
      (filter === "aktiv" && group.status === "Aktiv") ||
      (filter === "gestorben" && group.status === "Tot") ||
      (filter === "unvollständig" && group.status === "Unvollständig") ||
      (filter === "im Team" && encounter.entries.some((e) => e.status === "Im Team")) ||
      (filter === "in der Box" && encounter.entries.some((e) => e.status === "In der Box")) ||
      (filter === "noch nicht gefangen" && encounter.entries.some((e) => e.status === "Nicht gefangen"));
    return matchesQuery && matchesFilter;
  });

  return (
    <main className="min-h-screen bg-gradient-to-br from-red-50 via-white to-sky-50 text-slate-950 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/85 backdrop-blur dark:border-slate-800/80 dark:bg-slate-950/85">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <div className="rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-red-950 px-5 py-4 shadow-lg shadow-red-950/20">
                <p className="text-xs font-bold uppercase tracking-[0.35em] text-red-400">Pokémon SoulLink</p>
                <p className="mt-2 text-lg font-black text-white">Challenge Manager</p>
                <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200">
                  <Cloud size={14} />
                  {syncState === "saving"
                    ? "Speichert …"
                    : syncState === "saved"
                      ? "Server-Speicherung aktiv"
                      : syncState === "error"
                        ? "Speichern fehlgeschlagen"
                        : "Nur lokal gespeichert"}
                </p>
              </div>

              <div className="min-w-0 flex-1 rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div className="min-w-0 flex-1">
                    <label htmlFor="challenge-switcher" className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
                      Aktive Challenge
                    </label>
                    <select
                      id="challenge-switcher"
                      aria-label="Challenge auswählen"
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-400/30 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
                      value={challenge.id}
                      onChange={(event) => void selectCloudChallenge(event.target.value)}
                    >
                      {challengeList.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                      {!challengeList.some((item) => item.id === challenge.id) && <option value={challenge.id}>{challenge.name}</option>}
                    </select>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <span className="rounded-full bg-slate-100 px-3 py-2 dark:bg-slate-800">{game.name}</span>
                    <span className="rounded-full bg-slate-100 px-3 py-2 dark:bg-slate-800">{challenge.participants.length} Spieler</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 xl:min-w-[260px]">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Angemeldet</p>
                <p className="truncate text-lg font-bold text-slate-900 dark:text-white">{user.displayName}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">@{user.username}</p>
              </div>
              <button onClick={() => void logout()} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white" title="Abmelden">
                <LogOut size={18} />
                Abmelden
              </button>
            </div>
          </div>

          <nav className="mt-4 flex gap-2 overflow-x-auto pb-1" aria-label="Hauptnavigation">
            {nav.map((item) => (
              <button
                key={item}
                onClick={() => setActiveTab(item)}
                className={`whitespace-nowrap rounded-2xl px-4 py-3 text-sm font-bold transition ${
                  activeTab === item
                    ? "bg-red-500 text-white shadow-lg shadow-red-500/25"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {item}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-6">
        {activeTab === "Dashboard" && <Dashboard challenge={challenge} gameName={game.name} stats={stats} setActiveTab={setActiveTab} />}
        {activeTab === "Routen" && <RoutesView challenge={challenge} visibleEncounters={visibleEncounters} availablePokemon={availablePokemon} query={query} setQuery={setQuery} filter={filter} setFilter={setFilter} patchEntry={patchEntry} addLocation={addLocation} />}
        {activeTab === "Teams" && <TeamsView challenge={challenge} />}
        {activeTab === "Arenen & Rivalen" && <BossesView gameId={challenge.gameId} />}
        {activeTab === "Fangchance" && <CatchRateView gameId={challenge.gameId} generation={generation.number} />}
        {activeTab === "Schwächentabelle" && <TypeView generation={generation.number} availableTypes={generation.availableTypes} />}
        {activeTab === "Regeln" && <RulesView challenge={challenge} updateChallenge={updateChallenge} />}
        {activeTab === "Einstellungen" && (
          <SettingsView challenge={challenge} createNewChallenge={createNewChallenge} addParticipant={addParticipant} removeParticipant={removeParticipant} updateChallenge={updateChallenge} exportJson={exportJson} importJson={importJson} fileInput={fileInput} user={user} deleteCurrentCloudChallenge={deleteCurrentCloudChallenge} darkMode={darkMode} onDarkModeChange={persistDarkModePreference} />
        )}
      </section>
    </main>
  );
}

function LoginScreen({ onSubmit }: { onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-10 text-slate-50 [color-scheme:dark]">
    <div className="mx-auto grid min-h-[80vh] max-w-md place-items-center">
      <form onSubmit={onSubmit} className="w-full rounded-3xl border border-slate-800 bg-slate-900/95 p-7 shadow-2xl shadow-black/40 backdrop-blur">
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-red-400">Pokémon SoulLink</p>
        <h1 className="mt-2 text-3xl font-black text-white">Anmelden</h1>
        <p className="mt-3 text-sm text-slate-300">Diese Anwendung ist privat. Ein Account muss vom Administrator angelegt werden.</p>
        <label className="mt-6 block text-sm font-semibold text-slate-200">Benutzername<input name="username" type="text" required minLength={3} maxLength={32} autoComplete="username" autoCapitalize="none" spellCheck={false} autoFocus className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-white placeholder:text-slate-500 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/50" /></label>
        <label className="mt-4 block text-sm font-semibold text-slate-200">Passwort<input name="password" type="password" required minLength={8} autoComplete="current-password" className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-white placeholder:text-slate-500 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/50" /></label>
        <button type="submit" className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-3 font-bold text-white transition hover:bg-red-600"><LogIn size={18} />Anmelden</button>
      </form>
    </div>
  </main>;
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-3xl border border-white/70 bg-white/85 p-5 shadow-soft backdrop-blur dark:border-slate-800 dark:bg-slate-900/85 ${className}`}>{children}</div>;
}

function Dashboard({ challenge, gameName, stats, setActiveTab }: { challenge: Challenge; gameName: string; stats: { active: number; deadLinks: number; incomplete: number; deadPokemon: number }; setActiveTab: (tab: Tab) => void }) {
  const teamEntries = challenge.encounters.flatMap((encounter) => encounter.entries).filter((entry) => entry.status === "Im Team");
  const last = [...challenge.encounters].reverse().find((encounter) => encounter.entries.some((entry) => entry.pokemonId));
  return <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
    <Card><h2 className="text-3xl font-black">Dashboard</h2><p className="mt-2 text-slate-600 dark:text-slate-300">{gameName} · {challenge.participants.length} Teilnehmer · zuletzt gespeichert {new Date(challenge.updatedAt).toLocaleString("de-DE")}</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[
        ["Fangorte", challenge.locations.length], ["Aktive SoulLinks", stats.active], ["Gestorbene Pokémon", stats.deadPokemon], ["Unvollständig", stats.incomplete]
      ].map(([label, value]) => <div key={label} className="rounded-2xl bg-slate-100 p-4 dark:bg-slate-800"><p className="text-sm text-slate-500 dark:text-slate-400">{label}</p><p className="text-3xl font-black">{value}</p></div>)}</div>
      <button onClick={() => setActiveTab("Routen")} className="mt-6 rounded-2xl bg-red-500 px-5 py-3 font-bold text-white shadow-sm hover:bg-red-600">Routen bearbeiten</button>
    </Card>
    <Card><h3 className="text-xl font-black">Aktuelle Teams</h3><div className="mt-4 space-y-4">{challenge.participants.map((participant) => <div key={participant.id}><p className="font-bold" style={{ color: participant.color }}>{participant.name}</p><div className="mt-2 flex flex-wrap gap-2">{teamEntries.filter((entry) => entry.participantId === participant.id).map((entry) => <PokemonPill key={entry.id} entry={entry} />)}{teamEntries.filter((entry) => entry.participantId === participant.id).length === 0 && <span className="text-sm text-slate-500">Kein Team-Pokémon</span>}</div></div>)}</div><p className="mt-5 text-sm text-slate-500">Letzter Fangort: {challenge.locations.find((l) => l.id === last?.locationId)?.name ?? "Noch keiner"}</p></Card>
  </div>;
}

function RoutesView(props: { challenge: Challenge; visibleEncounters: Encounter[]; availablePokemon: typeof pokemon; query: string; setQuery: (q: string) => void; filter: (typeof filters)[number]; setFilter: (f: (typeof filters)[number]) => void; patchEntry: (encounterId: string, participantId: string, patch: Partial<PokemonEntry>) => void; addLocation: () => void }) {
  return <div className="space-y-5"><div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><h2 className="text-3xl font-black">Routen & Encounter</h2><p className="text-slate-600 dark:text-slate-300">Jede Karte ist eine SoulLink-Gruppe.</p></div><button onClick={props.addLocation} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 font-bold text-white dark:bg-white dark:text-slate-950"><Plus size={18}/> Eigener Ort</button></div>
    <Card className="flex flex-col gap-3 md:flex-row"><input aria-label="Routen, Pokémon oder Spitznamen suchen" value={props.query} onChange={(e) => props.setQuery(e.target.value)} placeholder="Suche nach Route, Pokémon, Spitzname…" className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-950"/><select aria-label="Statusfilter" value={props.filter} onChange={(e) => props.setFilter(e.target.value as (typeof filters)[number])} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-950">{filters.map((f) => <option key={f}>{f}</option>)}</select></Card>
    <div className="grid gap-4">{props.visibleEncounters.map((encounter) => <EncounterCard key={encounter.id} challenge={props.challenge} encounter={encounter} availablePokemon={props.availablePokemon} patchEntry={props.patchEntry} />)}</div></div>;
}

function EncounterCard({ challenge, encounter, availablePokemon, patchEntry }: { challenge: Challenge; encounter: Encounter; availablePokemon: typeof pokemon; patchEntry: (encounterId: string, participantId: string, patch: Partial<PokemonEntry>) => void }) {
  const location = challenge.locations.find((l) => l.id === encounter.locationId);
  const group = getSoulLinkGroup(challenge, encounter);
  const groupClass = group.status === "Tot" ? "border-red-300 bg-red-50/80 dark:border-red-800 dark:bg-red-950/30" : group.status === "Unvollständig" ? "border-amber-300 bg-amber-50/80 dark:border-amber-800 dark:bg-amber-950/30" : "";
  return <Card className={groupClass}><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-xl font-black">{location?.name}</h3><p className="text-sm text-slate-500">{location?.category}</p></div><span className={`rounded-full px-3 py-1 text-sm font-bold ${group.status === "Tot" ? "bg-red-200 text-red-900" : group.status === "Aktiv" ? "bg-emerald-200 text-emerald-900" : "bg-amber-200 text-amber-900"}`}>{group.status === "Tot" ? "☠ Toter SoulLink" : group.status}</span></div>
    <div className="mt-4 grid gap-4 lg:grid-cols-3">{challenge.participants.map((participant) => {
      const entry = encounter.entries.find((e) => e.participantId === participant.id) ?? createEntry(participant.id, encounter.locationId);
      const selected = pokemon.find((p) => p.id === entry.pokemonId);
      return <div key={participant.id} className={`rounded-2xl border border-slate-200 p-4 dark:border-slate-700 ${entry.status === "Gestorben" ? "opacity-60 grayscale" : ""}`}><div className="mb-3 flex items-center justify-between"><b style={{ color: participant.color }}>{participant.name}</b><span className={`rounded-full px-2 py-1 text-xs font-bold ${statusStyles[entry.status]}`}>{entry.status}</span></div>
        <label className="text-xs font-semibold" htmlFor={`${entry.id}-pokemon`}>Pokémon</label><input id={`${entry.id}-pokemon`} list="pokemon-list" value={selected?.name ?? ""} onChange={(e) => { const found = availablePokemon.find((p) => p.name.toLowerCase() === e.target.value.toLowerCase()); patchEntry(encounter.id, participant.id, { pokemonId: found?.id, status: found ? "Aktiv" : "Nicht gefangen" }); }} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950" placeholder="Pokémon suchen…"/>
        <datalist id="pokemon-list">{availablePokemon.map((p) => <option key={p.id} value={p.name}/>)}</datalist>
        {selected && <div className="mt-3 flex items-center gap-3"><img src={selected.sprite} alt="" width={56} height={56} className="rounded-xl bg-slate-100 dark:bg-slate-800"/><div><p className="font-bold">{entry.nickname || selected.name}</p><p className="text-sm text-slate-500">{selected.types.join(" / ")}</p></div></div>}
        <div className="mt-3 grid grid-cols-2 gap-2"><input aria-label="Spitzname" value={entry.nickname ?? ""} onChange={(e) => patchEntry(encounter.id, participant.id, { nickname: e.target.value })} placeholder="Spitzname" className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950"/><input aria-label="Level" type="number" min={1} max={100} value={entry.level ?? ""} onChange={(e) => patchEntry(encounter.id, participant.id, { level: Number(e.target.value) || undefined })} placeholder="Level" className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950"/></div>
        <select aria-label="Pokémon-Status" value={entry.status} onChange={(e) => patchEntry(encounter.id, participant.id, { status: e.target.value as PokemonStatus })} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950">{statuses.map((s) => <option key={s}>{s}</option>)}</select>
        <textarea aria-label="Notizen" value={entry.notes ?? ""} onChange={(e) => patchEntry(encounter.id, participant.id, { notes: e.target.value })} placeholder="Notizen, Fähigkeit, Attacken…" className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950"/>
      </div>;
    })}</div></Card>;
}

function PokemonPill({ entry }: { entry: PokemonEntry }) {
  const p = pokemon.find((item) => item.id === entry.pokemonId);
  if (!p) return null;
  return <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-sm dark:bg-slate-800"><img src={p.sprite} alt="" width={24} height={24}/>{entry.nickname || p.name}</span>;
}

function TeamsView({ challenge }: { challenge: Challenge }) {
  return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{challenge.participants.map((participant) => <Card key={participant.id}><h2 className="text-2xl font-black" style={{ color: participant.color }}>{participant.name}</h2><div className="mt-4 space-y-3">{challenge.encounters.flatMap((encounter) => encounter.entries.map((entry) => ({ encounter, entry }))).filter(({ entry }) => entry.participantId === participant.id && entry.pokemonId).map(({ encounter, entry }) => <div key={entry.id} className="flex items-center justify-between rounded-2xl bg-slate-100 p-3 dark:bg-slate-800"><PokemonPill entry={entry}/><span className={`rounded-full px-2 py-1 text-xs font-bold ${statusStyles[entry.status]}`}>{entry.status}</span></div>)}</div></Card>)}</div>;
}

function TypeView({ generation, availableTypes }: { generation: number; availableTypes: PokemonType[] }) {
  const [type1, setType1] = useState<PokemonType>("Feuer");
  const [type2, setType2] = useState<PokemonType | "">("");
  const defense = calculateDefense(type2 ? [type1, type2] : [type1]).filter((row) => availableTypes.includes(row.attackType));

  const categories = [
    ["Schwächen", defense.filter((d) => d.multiplier > 1)],
    ["Resistenzen", defense.filter((d) => d.multiplier > 0 && d.multiplier < 1)],
    ["Immunitäten", defense.filter((d) => d.multiplier === 0)],
    ["Normal", defense.filter((d) => d.multiplier === 1)]
  ] as const;

  return (
    <div className="space-y-5">
      <Card>
        <h2 className="text-3xl font-black">Schwächentabelle</h2>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          Generation {generation}: Grün bedeutet sehr effektiv, Rot nicht sehr effektiv, Grau keine Wirkung.
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <select aria-label="Erster Typ" value={type1} onChange={(e) => setType1(e.target.value as PokemonType)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-950">
            {availableTypes.map((type) => <option key={type}>{type}</option>)}
          </select>
          <select aria-label="Zweiter Typ" value={type2} onChange={(e) => setType2(e.target.value as PokemonType | "")} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-950">
            <option value="">Kein Zweittyp</option>
            {availableTypes.filter((type) => type !== type1).map((type) => <option key={type}>{type}</option>)}
          </select>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map(([label, rows]) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
              <b>{label}</b>
              <div className="mt-2 flex flex-wrap gap-2">
                {rows.length ? rows.map((row) => (
                  <span key={row.attackType} className="rounded-full px-3 py-1 text-xs font-black shadow-sm" style={typeColors[row.attackType]}>
                    {row.attackType} {row.multiplier}×
                  </span>
                )) : <span className="text-sm text-slate-500">—</span>}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="overflow-x-auto">
        <div className="mb-3 flex flex-wrap gap-3 text-xs font-bold">
          <span className="rounded-lg px-3 py-1" style={effectivenessStyle(2)}>2× sehr effektiv</span>
          <span className="rounded-lg px-3 py-1" style={effectivenessStyle(1)}>1× normal</span>
          <span className="rounded-lg px-3 py-1" style={effectivenessStyle(0.5)}>0,5× nicht sehr effektiv</span>
          <span className="rounded-lg px-3 py-1" style={effectivenessStyle(0)}>0× keine Wirkung</span>
        </div>

        <table className="w-full min-w-[1050px] border-separate border-spacing-1 text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 min-w-44 rounded-xl bg-white p-3 text-left shadow-sm dark:bg-slate-900">Angriff ↓ / Verteidigung →</th>
              {availableTypes.map((type) => (
                <th key={type} className="min-w-20 rounded-xl p-2 font-black shadow-sm" style={typeColors[type]}>
                  {type}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {availableTypes.map((attack) => (
              <tr key={attack}>
                <th className="sticky left-0 z-10 rounded-xl p-2 text-left font-black shadow-sm" style={typeColors[attack]}>
                  {attack}
                </th>
                {availableTypes.map((defenseType) => {
                  const multiplier = getEffectiveness(attack, defenseType);
                  return (
                    <td
                      key={defenseType}
                      aria-label={`${attack} gegen ${defenseType}: ${multiplier} mal`}
                      className="rounded-lg p-2 text-center font-black shadow-sm"
                      style={effectivenessStyle(multiplier)}
                    >
                      {multiplier}×
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}


function BossesView({ gameId }: { gameId: string }) {
  const [category, setCategory] = useState<"Alle" | "Arena" | "Rivale">("Alle");
  const [phase, setPhase] = useState<string>("Alle");
  const [completed, setCompleted] = useState<string[]>([]);
  const battles = bossBattles
    .filter((battle) => battle.gameId === gameId)
    .sort((a, b) => {
      const phaseOrder = ["Johto", "Hauptgeschichte", "Pokémon-Liga", "Kanto", "Postgame"];
      const phaseDiff = phaseOrder.indexOf(a.phase ?? "Hauptgeschichte") - phaseOrder.indexOf(b.phase ?? "Hauptgeschichte");
      return phaseDiff || a.order - b.order || a.category.localeCompare(b.category);
    });
  const phases = Array.from(new Set(battles.map((battle) => battle.phase ?? "Hauptgeschichte")));

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`soullink-boss-progress-${gameId}`);
      setCompleted(stored ? JSON.parse(stored) : []);
    } catch {
      setCompleted([]);
    }
  }, [gameId]);

  function toggleBattle(id: string) {
    setCompleted((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      localStorage.setItem(`soullink-boss-progress-${gameId}`, JSON.stringify(next));
      return next;
    });
  }

  const visible = battles.filter((battle) =>
    (category === "Alle" || battle.category === category) &&
    (phase === "Alle" || (battle.phase ?? "Hauptgeschichte") === phase)
  );
  const doneCount = battles.filter((battle) => completed.includes(battle.id)).length;

  return <div className="space-y-5">
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div><h2 className="text-3xl font-black">Arenen & Rivalen</h2><p className="mt-1 text-slate-600 dark:text-slate-300">Editionsabhängige Level-Caps und wichtige Kämpfe. Spiele mit mehreren Regionen zeigen alle dort verfügbaren Arenen.</p></div>
      <div className="rounded-2xl bg-slate-950 px-4 py-3 font-bold text-white dark:bg-white dark:text-slate-950">{doneCount} / {battles.length} erledigt</div>
    </div>
    <Card>
      <div className="flex flex-wrap gap-2">{(["Alle", "Arena", "Rivale"] as const).map((item) => <button key={item} onClick={() => setCategory(item)} className={`rounded-full px-4 py-2 text-sm font-bold ${category === item ? "bg-red-500 text-white" : "bg-slate-100 dark:bg-slate-800"}`}>{item}</button>)}</div>
      {phases.length > 1 && <div className="mt-3 flex flex-wrap gap-2">{["Alle", ...phases].map((item) => <button key={item} onClick={() => setPhase(item)} className={`rounded-full border px-4 py-2 text-sm font-bold ${phase === item ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"}`}>{item}</button>)}</div>}
      <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"><div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: battles.length ? `${(doneCount / battles.length) * 100}%` : "0%" }}/></div>
    </Card>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{visible.map((battle) => {
      const done = completed.includes(battle.id);
      return <Card key={battle.id} className={done ? "opacity-65" : ""}>
        <div className="flex items-start justify-between gap-3"><div><div className="flex flex-wrap gap-2"><span className={`rounded-full px-3 py-1 text-xs font-black ${battle.category === "Arena" ? "bg-amber-100 text-amber-900" : "bg-violet-100 text-violet-900"}`}>{battle.category}</span>{battle.phase && <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-900">{battle.phase}</span>}</div><h3 className="mt-3 text-xl font-black">{battle.category === "Arena" ? `${battle.order}. ${battle.name}` : battle.name}</h3><p className="text-sm text-slate-500">{battle.location}</p></div><input aria-label={`${battle.name} als erledigt markieren`} type="checkbox" checked={done} onChange={() => toggleBattle(battle.id)} className="h-6 w-6 accent-emerald-600"/></div>
        <div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-slate-100 p-3 dark:bg-slate-800"><p className="text-xs font-bold uppercase text-slate-500">Team-Level</p><p className="text-2xl font-black">{battle.levels}</p></div><div className="rounded-2xl bg-red-50 p-3 dark:bg-red-950/40"><p className="text-xs font-bold uppercase text-red-500">Level-Cap</p><p className="text-2xl font-black text-red-600 dark:text-red-300">Lv. {battle.aceLevel}</p></div></div>
        {battle.specialty && <span className="mt-3 inline-flex rounded-full px-3 py-1 text-xs font-black shadow-sm" style={typeColors[battle.specialty]}>{battle.specialty}</span>}
        {battle.note && <p className="mt-3 text-sm text-slate-500">{battle.note}</p>}
      </Card>;
    })}</div>
    {!visible.length && <Card><p>Für dieses Spiel sind noch keine Kampfdaten hinterlegt.</p></Card>}
  </div>;
}


interface ApiPokemonResult {
  id: number;
  name: string;
  germanName: string;
  captureRate: number;
  types: PokemonType[];
  sprite?: string;
  weightKg?: number;
  baseSpeed?: number;
}

const apiTypeToGerman: Record<string, PokemonType> = {
  normal: "Normal", fire: "Feuer", water: "Wasser", electric: "Elektro", grass: "Pflanze", ice: "Eis",
  fighting: "Kampf", poison: "Gift", ground: "Boden", flying: "Flug", psychic: "Psycho", bug: "Käfer",
  rock: "Gestein", ghost: "Geist", dragon: "Drache", dark: "Unlicht", steel: "Stahl", fairy: "Fee"
};

type HpBand = "Voll" | "Grün" | "Gelb" | "Rot" | "1 KP";

const hpBands: Record<HpBand, { min: number; max: number; label: string; className: string }> = {
  "Voll": { min: 100, max: 100, label: "Volle KP (100 %)", className: "border-emerald-600 bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200" },
  "Grün": { min: 51, max: 99, label: "Grüner Bereich (51–99 %)", className: "border-green-600 bg-green-100 text-green-900 dark:bg-green-950/50 dark:text-green-200" },
  "Gelb": { min: 21, max: 50, label: "Gelber Bereich (21–50 %)", className: "border-amber-500 bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200" },
  "Rot": { min: 2, max: 20, label: "Roter Bereich (2–20 %)", className: "border-red-600 bg-red-100 text-red-900 dark:bg-red-950/50 dark:text-red-200" },
  "1 KP": { min: 1, max: 1, label: "Genau 1 KP", className: "border-rose-800 bg-rose-200 text-rose-950 dark:bg-rose-950 dark:text-rose-100" }
};

function CatchRateView({ gameId, generation }: { gameId: string; generation: number }) {
  const [search, setSearch] = useState("pikachu");
  const [selected, setSelected] = useState<ApiPokemonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [speciesNames, setSpeciesNames] = useState<Array<{ name: string; dex: number }>>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const [ball, setBall] = useState<CatchBall>("Hyperball");
  const [status, setStatus] = useState<CatchStatus>("Kein Status");
  const [hpBand, setHpBand] = useState<HpBand>("Rot");
  const [targetLevel, setTargetLevel] = useState(20);
  const [playerLevel, setPlayerLevel] = useState(30);
  const [turn, setTurn] = useState(1);
  const [atNightOrCave, setAtNightOrCave] = useState(false);
  const [fishingEncounter, setFishingEncounter] = useState(false);
  const [surfingOrUnderwater, setSurfingOrUnderwater] = useState(false);
  const [caughtBefore, setCaughtBefore] = useState(false);
  const [sameSpeciesOppositeGender, setSameSpeciesOppositeGender] = useState(false);
  const [moonStoneEvolution, setMoonStoneEvolution] = useState(false);


  const maxDexByGeneration: Record<number, number> = { 1: 151, 2: 251, 3: 386, 4: 493, 5: 649, 6: 721, 7: 809, 8: 905, 9: 1025 };
  const availableGeneration = mechanicsGeneration(gameId);

  useEffect(() => {
    let cancelled = false;
    async function loadSpeciesNames() {
      try {
        const limit = maxDexByGeneration[availableGeneration] ?? 1025;
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon-species?limit=${limit}`);
        if (!response.ok) return;
        const data = await response.json();
        if (cancelled) return;
        setSpeciesNames((data.results as Array<{ name: string; url: string }>).map((entry) => {
          const match = entry.url.match(/\/(\d+)\/?$/);
          return { name: entry.name, dex: match ? Number(match[1]) : 0 };
        }).filter((entry) => entry.dex > 0));
      } catch {
        // Autovervollständigung ist optional; die normale Suche bleibt funktionsfähig.
      }
    }
    void loadSpeciesNames();
    return () => { cancelled = true; };
  }, [availableGeneration]);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (searchWrapRef.current && !searchWrapRef.current.contains(event.target as Node)) {
        setSuggestionsOpen(false);
      }
    }
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  function normalizePokemonTerm(value: string) {
    return value.toLocaleLowerCase("de-DE").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9♀♂-]/g, "");
  }

  function editDistance(a: string, b: string) {
    const rows = Array.from({ length: a.length + 1 }, (_, index) => [index]);
    rows[0] = Array.from({ length: b.length + 1 }, (_, index) => index);
    for (let i = 1; i <= a.length; i += 1) {
      for (let j = 1; j <= b.length; j += 1) {
        rows[i][j] = Math.min(
          rows[i - 1][j] + 1,
          rows[i][j - 1] + 1,
          rows[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
        );
      }
    }
    return rows[a.length][b.length];
  }

  const pokemonSuggestions = useMemo(() => {
    const term = normalizePokemonTerm(search.trim());
    if (term.length < 2 || /^\d+$/.test(term)) return [];

    const localItems = pokemon
      .filter((item) => item.generationIntroduced <= availableGeneration)
      .map((item) => ({ dex: item.nationalDex, apiName: item.id, label: item.name, secondary: item.id }));
    const remoteItems = speciesNames.map((item) => {
      const local = pokemon.find((entry) => entry.nationalDex === item.dex);
      return { dex: item.dex, apiName: item.name, label: local?.name ?? item.name.replace(/(^|-)([a-z])/g, (_, prefix, letter) => `${prefix}${letter.toUpperCase()}`), secondary: local ? item.name : `#${item.dex}` };
    });

    const unique = new Map<number, { dex: number; apiName: string; label: string; secondary: string }>();
    [...localItems, ...remoteItems].forEach((item) => unique.set(item.dex, item));

    return [...unique.values()]
      .map((item) => {
        const label = normalizePokemonTerm(item.label);
        const apiName = normalizePokemonTerm(item.apiName);
        let score = 100;
        if (label === term || apiName === term) score = 0;
        else if (label.startsWith(term) || apiName.startsWith(term)) score = 1;
        else if (label.includes(term) || apiName.includes(term)) score = 2;
        else {
          const distance = Math.min(editDistance(term, label.slice(0, Math.max(term.length, 3))), editDistance(term, apiName.slice(0, Math.max(term.length, 3))));
          score = distance <= 2 ? 3 + distance : 100;
        }
        return { ...item, score };
      })
      .filter((item) => item.score < 100)
      .sort((a, b) => a.score - b.score || a.dex - b.dex)
      .slice(0, 7);
  }, [search, speciesNames, availableGeneration]);

  function chooseSuggestion(suggestion: { apiName: string; label: string }) {
    setSearch(suggestion.apiName);
    setSuggestionsOpen(false);
    setActiveSuggestion(-1);
    window.setTimeout(() => { void findPokemon(suggestion.apiName); }, 0);
  }

  async function findPokemon(forcedTerm?: string) {
    const term = (forcedTerm ?? search).trim().toLowerCase();
    if (!term) return;
    setLoading(true);
    setError("");
    try {
      let apiName = term;
      const localMatch = pokemon.find((item) => item.name.toLowerCase() === term || item.id === term || String(item.nationalDex) === term);
      if (localMatch) apiName = String(localMatch.nationalDex);
      const pokemonResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(apiName)}`);
      if (!pokemonResponse.ok) throw new Error("Pokémon nicht gefunden");
      const pokemonData = await pokemonResponse.json();
      const speciesResponse = await fetch(pokemonData.species.url);
      if (!speciesResponse.ok) throw new Error("Art-Daten konnten nicht geladen werden");
      const speciesData = await speciesResponse.json();
      const introduced = Number(String(speciesData.generation.name).replace("generation-", "").replace("i", "1").replace("v", "5"));
      const roman: Record<string, number> = { "generation-i": 1, "generation-ii": 2, "generation-iii": 3, "generation-iv": 4, "generation-v": 5, "generation-vi": 6, "generation-vii": 7, "generation-viii": 8, "generation-ix": 9 };
      if ((roman[speciesData.generation.name] ?? introduced) > mechanicsGeneration(gameId)) throw new Error("Dieses Pokémon wurde erst nach der Mechanik-Generation des ausgewählten Spiels eingeführt.");
      const germanName = speciesData.names.find((entry: { language: { name: string }; name: string }) => entry.language.name === "de")?.name ?? pokemonData.name;
      const speed = pokemonData.stats.find((entry: { stat: { name: string }; base_stat: number }) => entry.stat.name === "speed")?.base_stat;
      setSelected({
        id: pokemonData.id,
        name: pokemonData.name,
        germanName,
        captureRate: speciesData.capture_rate,
        types: pokemonData.types.map((entry: { type: { name: string } }) => apiTypeToGerman[entry.type.name]).filter(Boolean),
        sprite: pokemonData.sprites.front_default,
        weightKg: pokemonData.weight / 10,
        baseSpeed: speed
      });
    } catch (err) {
      setSelected(null);
      setError(err instanceof Error ? err.message : "Pokémon konnte nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }

  // Beim Spielwechsel wird die Beispielsuche neu mit den passenden Fangmechaniken ausgewertet.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void findPokemon(); }, [gameId]);

  const hpRange = hpBands[hpBand];
  const contextForHp = (currentHp: number, selectedBall: CatchBall = ball) => ({
    gameId, ball: selectedBall, status, currentHp, maxHp: 100, targetLevel, playerLevel, turn, targetTypes: selected?.types ?? [], atNightOrCave,
    fishingEncounter, surfingOrUnderwater, caughtBefore, sameSpeciesOppositeGender, moonStoneEvolution,
    baseSpeedAtLeast100: (selected?.baseSpeed ?? 0) >= 100, targetWeightKg: selected?.weightKg
  });
  const resultLow = selected ? calculateCatchChance(selected.captureRate, contextForHp(hpRange.max)) : null;
  const resultHigh = selected ? calculateCatchChance(selected.captureRate, contextForHp(hpRange.min)) : null;
  const result = resultLow;

  const likelyBalls = selected ? catchBalls.map((candidate) => {
    const low = calculateCatchChance(selected.captureRate, contextForHp(hpRange.max, candidate)).chance;
    const high = calculateCatchChance(selected.captureRate, contextForHp(hpRange.min, candidate)).chance;
    return { ball: candidate, low, high, value: (low + high) / 2 };
  }).filter((entry) => entry.ball !== "Meisterball").sort((a, b) => b.value - a.value).slice(0, 3) : [];

  return <div className="space-y-5">
    <div><h2 className="text-3xl font-black">Fangraten-Rechner</h2><p className="mt-1 text-slate-600 dark:text-slate-300">Berechnet die geschätzte Fangchance passend zur Edition, zum Ball, Status und sichtbaren KP-Farbbereich.</p></div>
    <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
      <Card>
        <h3 className="text-xl font-black">Pokémon auswählen</h3>
        <div className="mt-3 flex gap-2">
          <div ref={searchWrapRef} className="relative min-w-0 flex-1">
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setSuggestionsOpen(true); setActiveSuggestion(-1); }}
              onFocus={() => setSuggestionsOpen(true)}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown" && pokemonSuggestions.length) { e.preventDefault(); setSuggestionsOpen(true); setActiveSuggestion((current) => Math.min(current + 1, pokemonSuggestions.length - 1)); }
                else if (e.key === "ArrowUp" && pokemonSuggestions.length) { e.preventDefault(); setActiveSuggestion((current) => Math.max(current - 1, 0)); }
                else if (e.key === "Escape") { setSuggestionsOpen(false); setActiveSuggestion(-1); }
                else if (e.key === "Enter") {
                  e.preventDefault();
                  if (suggestionsOpen && activeSuggestion >= 0 && pokemonSuggestions[activeSuggestion]) chooseSuggestion(pokemonSuggestions[activeSuggestion]);
                  else if (suggestionsOpen && pokemonSuggestions[0]) chooseSuggestion(pokemonSuggestions[0]);
                  else void findPokemon();
                }
              }}
              role="combobox"
              aria-expanded={suggestionsOpen && pokemonSuggestions.length > 0}
              aria-controls="catchrate-pokemon-suggestions"
              aria-autocomplete="list"
              placeholder="z. B. geo, Kleinstein oder 74"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
            />
            {suggestionsOpen && pokemonSuggestions.length > 0 && <div id="catchrate-pokemon-suggestions" role="listbox" className="absolute z-30 mt-2 max-h-80 w-full overflow-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
              <p className="px-3 pb-2 pt-1 text-xs font-bold uppercase tracking-wide text-slate-500">Meintest du vielleicht …</p>
              {pokemonSuggestions.map((suggestion, index) => <button
                key={suggestion.dex}
                type="button"
                role="option"
                aria-selected={activeSuggestion === index}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => chooseSuggestion(suggestion)}
                onMouseEnter={() => setActiveSuggestion(index)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition ${activeSuggestion === index ? "bg-red-50 dark:bg-red-950/40" : "hover:bg-slate-100 dark:hover:bg-slate-800"}`}
              >
                <img src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${suggestion.dex}.png`} alt="" width={44} height={44} className="shrink-0"/>
                <span className="min-w-0 flex-1"><span className="block truncate font-black">{suggestion.label}</span><span className="block truncate text-xs text-slate-500">{suggestion.secondary} · #{suggestion.dex}</span></span>
              </button>)}
            </div>}
          </div>
          <button onClick={() => void findPokemon()} disabled={loading} className="rounded-2xl bg-red-500 px-5 py-3 font-bold text-white disabled:opacity-50">{loading ? "Lädt…" : "Suchen"}</button>
        </div>
        {error && <p className="mt-3 rounded-xl bg-red-100 p-3 text-sm font-bold text-red-800">{error}</p>}
        {selected && <div className="mt-4 flex items-center gap-4 rounded-2xl bg-slate-100 p-4 dark:bg-slate-800">{selected.sprite && <img src={selected.sprite} alt={selected.germanName} width={96} height={96}/>}<div><p className="text-2xl font-black">#{selected.id} {selected.germanName}</p><div className="mt-2 flex flex-wrap gap-2">{selected.types.map((type) => <span key={type} className="rounded-full px-3 py-1 text-xs font-black" style={typeColors[type]}>{type}</span>)}</div><p className="mt-2 text-sm text-slate-500">Basis-Fangrate: <b>{selected.captureRate} / 255</b> · Gewicht: {selected.weightKg?.toLocaleString("de-DE")} kg</p></div></div>}
        <p className="mt-4 text-xs text-slate-500">Die Pokémon-Daten werden bei der Suche von PokéAPI geladen. Jeder Eintrag ist über Pokédex-Nummer oder englischen Namen auffindbar; die bereits hinterlegten Pokémon zusätzlich über den deutschen Namen. Dafür wird eine Internetverbindung benötigt.</p>
      </Card>
      <Card>
        <h3 className="text-xl font-black">Fangsituation</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-bold">Ball<select value={ball} onChange={(e) => setBall(e.target.value as CatchBall)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950">{catchBalls.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="text-sm font-bold">Status<select value={status} onChange={(e) => setStatus(e.target.value as CatchStatus)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950">{(["Kein Status", "Paralyse", "Vergiftung", "Verbrennung", "Schlaf", "Gefroren"] as CatchStatus[]).map((item) => <option key={item}>{item}</option>)}</select></label>
          <div className="sm:col-span-2"><p className="text-sm font-bold">Sichtbarer KP-Bereich</p><div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">{(Object.keys(hpBands) as HpBand[]).map((item) => <button type="button" key={item} onClick={() => setHpBand(item)} aria-pressed={hpBand === item} className={`rounded-xl border-2 px-3 py-3 text-sm font-black transition ${hpBand === item ? hpBands[item].className : "border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"}`}>{item}</button>)}</div><p className="mt-2 text-xs text-slate-500">{hpRange.label}. Weil die genauen KP unbekannt sind, zeigt der Rechner bei Farbbereichen eine Chance von–bis.</p></div><NumberField label="Pokémon-Level" value={targetLevel} min={1} max={100} onChange={setTargetLevel}/><NumberField label="Level deines Pokémon" value={playerLevel} min={1} max={100} onChange={setPlayerLevel}/><NumberField label="Kampfrunde" value={turn} min={1} max={99} onChange={setTurn}/>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <Check label="Nacht oder Höhle" checked={atNightOrCave} setChecked={setAtNightOrCave}/><Check label="Angel-Begegnung" checked={fishingEncounter} setChecked={setFishingEncounter}/><Check label="Surfen / Unterwasser" checked={surfingOrUnderwater} setChecked={setSurfingOrUnderwater}/><Check label="Schon einmal gefangen" checked={caughtBefore} setChecked={setCaughtBefore}/><Check label="Gleiche Art, anderes Geschlecht" checked={sameSpeciesOppositeGender} setChecked={setSameSpeciesOppositeGender}/><Check label="Entwicklung mit Mondstein" checked={moonStoneEvolution} setChecked={setMoonStoneEvolution}/>
        </div>
      </Card>
    </div>
    {selected && result && <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
      <Card className="overflow-hidden">
        <p className="text-sm font-bold uppercase tracking-wider text-slate-500">Geschätzte Chance pro Ball</p><p className="mt-2 text-5xl font-black">{resultLow && resultHigh && Math.abs(resultHigh.chance - resultLow.chance) > 0.01 ? <>{resultLow.chance.toLocaleString("de-DE", { maximumFractionDigits: 2 })}%–{resultHigh.chance.toLocaleString("de-DE", { maximumFractionDigits: 2 })}%</> : <>{result.chance.toLocaleString("de-DE", { maximumFractionDigits: 2 })}%</>}</p><p className="mt-2 text-sm font-semibold text-slate-500">KP-Anzeige: {hpRange.label}</p>
        <div className="mt-4 h-4 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"><div className="h-full bg-emerald-500 transition-all" style={{ width: `${Math.min(100, resultHigh?.chance ?? result.chance)}%` }}/></div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm"><div className="rounded-xl bg-slate-100 p-3 dark:bg-slate-800"><b>Gen. {result.mechanicsGeneration}</b><br/>Fangmechanik</div><div className="rounded-xl bg-slate-100 p-3 dark:bg-slate-800"><b>{result.ballModifier.toFixed(2)}×</b><br/>Ballbonus</div><div className="rounded-xl bg-slate-100 p-3 dark:bg-slate-800"><b>{result.statusModifier.toFixed(1)}×</b><br/>Statusbonus</div></div>
        {result.note && <p className="mt-4 rounded-xl bg-amber-100 p-3 text-sm text-amber-900 dark:bg-amber-950/50 dark:text-amber-200">{result.note}</p>}
      </Card>
      <Card><h3 className="text-xl font-black">Beste Bälle in dieser Situation</h3><div className="mt-4 space-y-3">{likelyBalls.map((entry, index) => <div key={entry.ball} className="flex items-center justify-between rounded-2xl bg-slate-100 p-4 dark:bg-slate-800"><span className="font-black">{index + 1}. {entry.ball}</span><span className="text-xl font-black">{Math.abs(entry.high - entry.low) > 0.01 ? `${entry.low.toLocaleString("de-DE", { maximumFractionDigits: 2 })}%–${entry.high.toLocaleString("de-DE", { maximumFractionDigits: 2 })}%` : `${entry.low.toLocaleString("de-DE", { maximumFractionDigits: 2 })}%`}</span></div>)}</div><p className="mt-4 text-xs text-slate-500">Die Rangliste nutzt deine gesetzten Bedingungen. Nicht verfügbare oder unpassende Bälle können als normaler Pokéball gewertet werden.</p></Card>
    </div>}
  </div>;
}

function NumberField({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (value: number) => void }) {
  return <label className="text-sm font-bold">{label}<input aria-label={label} type="number" min={min} max={max} value={value} onChange={(e) => onChange(Math.max(min, Math.min(max, Number(e.target.value) || min)))} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950"/></label>;
}

function Check({ label, checked, setChecked }: { label: string; checked: boolean; setChecked: (value: boolean) => void }) {
  return <label className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold dark:bg-slate-800"><input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} className="h-4 w-4 accent-red-500"/>{label}</label>;
}

function RulesView({ challenge, updateChallenge }: { challenge: Challenge; updateChallenge: (updater: (draft: Challenge) => Challenge) => void }) {
  function patchRule(id: string, patch: Partial<ChallengeRule>) { updateChallenge((current) => ({ ...current, rules: current.rules.map((rule) => rule.id === id ? { ...rule, ...patch } : rule) })); }
  function addRule() { updateChallenge((current) => ({ ...current, rules: [...current.rules, { id: uid("rule"), title: "Neue Regel", description: "Beschreibung der Regel", enabled: true, order: current.rules.length + 1 }] })); }
  function deleteRule(id: string) { updateChallenge((current) => ({ ...current, rules: current.rules.filter((rule) => rule.id !== id) })); }
  function moveRule(id: string, direction: -1 | 1) { updateChallenge((current) => { const rules = [...current.rules].sort((a, b) => a.order - b.order); const index = rules.findIndex((r) => r.id === id); const target = index + direction; if (target < 0 || target >= rules.length) return current; [rules[index], rules[target]] = [rules[target], rules[index]]; return { ...current, rules: rules.map((rule, idx) => ({ ...rule, order: idx + 1 })) }; }); }
  return <div className="space-y-4"><div className="flex justify-between gap-3"><h2 className="text-3xl font-black">Regeln</h2><button onClick={addRule} className="rounded-2xl bg-red-500 px-4 py-2 font-bold text-white">Regel hinzufügen</button></div>{challenge.rules.sort((a, b) => a.order - b.order).map((rule) => <Card key={rule.id}><div className="grid gap-3 md:grid-cols-[auto_1fr_auto]"><input aria-label="Regel aktiv" type="checkbox" checked={rule.enabled} onChange={(e) => patchRule(rule.id, { enabled: e.target.checked })} className="mt-3 h-5 w-5"/><div className={rule.enabled ? "" : "opacity-50"}><input aria-label="Regeltitel" value={rule.title} onChange={(e) => patchRule(rule.id, { title: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-bold dark:border-slate-700 dark:bg-slate-950"/><textarea aria-label="Regelbeschreibung" value={rule.description} onChange={(e) => patchRule(rule.id, { description: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950"/></div><div className="flex gap-2"><button onClick={() => moveRule(rule.id, -1)} className="rounded-xl bg-slate-100 px-3 dark:bg-slate-800">↑</button><button onClick={() => moveRule(rule.id, 1)} className="rounded-xl bg-slate-100 px-3 dark:bg-slate-800">↓</button><button onClick={() => deleteRule(rule.id)} aria-label="Regel löschen" className="rounded-xl bg-red-100 px-3 text-red-700"><Trash2 size={16}/></button></div></div></Card>)}<Card><label className="font-bold">Zusätzliche Regeln und Notizen</label><textarea value={challenge.extraRules} onChange={(e) => updateChallenge((current) => ({ ...current, extraRules: e.target.value }))} className="mt-2 min-h-32 w-full rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-950"/></Card></div>;
}

function SettingsView({ challenge, createNewChallenge, addParticipant, removeParticipant, updateChallenge, exportJson, importJson, fileInput, user, deleteCurrentCloudChallenge, darkMode, onDarkModeChange }: { challenge: Challenge; createNewChallenge: (data: FormData) => void; addParticipant: () => void; removeParticipant: (id: string) => void; updateChallenge: (updater: (draft: Challenge) => Challenge) => void; exportJson: () => void; importJson: (event: ChangeEvent<HTMLInputElement>) => void; fileInput: React.MutableRefObject<HTMLInputElement | null>; user: AccountUser | null; deleteCurrentCloudChallenge: () => Promise<void>; darkMode: boolean; onDarkModeChange: (next: boolean) => Promise<void> }) {
  const gameOptions = games;
  return <div className="grid gap-5 lg:grid-cols-2"><Card><h2 className="text-2xl font-black">Neue Challenge erstellen</h2><p className="mt-2 text-sm text-slate-600 dark:text-slate-300"></p><form action={createNewChallenge} className="mt-4 space-y-3"><input name="challengeName" required placeholder="Name der Challenge" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-950"/><select name="gameId" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-950">{gameOptions.map((g) => <option value={g.id} key={g.id}>{g.name}</option>)}</select>{Array.from({ length: 5 }, (_, i) => <input key={i} name={`participant-${i}`} placeholder={`Teilnehmer ${i + 1}${i === 0 ? " *" : ""}`} required={i === 0} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-950"/>)}<button className="rounded-2xl bg-red-500 px-5 py-3 font-bold text-white">Challenge anlegen</button></form></Card>
    <Card><h2 className="text-2xl font-black">Einstellungen</h2><div className="mt-4 space-y-5"><label className="flex items-center gap-3"><input type="checkbox" checked={challenge.settings.autoKillLinkedPokemon} onChange={(e) => updateChallenge((c) => ({ ...c, settings: { ...c.settings, autoKillLinkedPokemon: e.target.checked } }))}/> Verbundene Pokémon automatisch als gestorben markieren</label><div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60"><div className="flex items-center justify-between gap-4"><div><p className="font-bold">Dark Mode</p><p className="text-sm text-slate-600 dark:text-slate-300"></p></div><label className="inline-flex items-center gap-3 text-sm font-bold"><span>{darkMode ? "Aktiv" : "Inaktiv"}</span><input type="checkbox" checked={darkMode} onChange={(e) => void onDarkModeChange(e.target.checked)} className="h-5 w-5 accent-red-500"/></label></div></div><div><h3 className="font-bold">Teilnehmer</h3><div className="mt-2 space-y-2">{challenge.participants.map((p) => <div key={p.id} className="flex items-center gap-2"><input value={p.name} onChange={(e) => updateChallenge((c) => ({ ...c, participants: c.participants.map((item) => item.id === p.id ? { ...item, name: e.target.value } : item) }))} className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950"/><input aria-label="Teilnehmerfarbe" type="color" value={p.color} onChange={(e) => updateChallenge((c) => ({ ...c, participants: c.participants.map((item) => item.id === p.id ? { ...item, color: e.target.value } : item) }))}/><button onClick={() => removeParticipant(p.id)} className="rounded-xl bg-red-100 p-2 text-red-700"><Trash2 size={16}/></button></div>)}</div><button onClick={addParticipant} disabled={challenge.participants.length >= 5} className="mt-3 rounded-2xl bg-slate-950 px-4 py-2 font-bold text-white disabled:opacity-50 dark:bg-white dark:text-slate-950">Teilnehmer hinzufügen</button></div><div className="flex flex-wrap gap-2"><button onClick={exportJson} className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 font-bold text-white"><Download size={16}/> JSON exportieren</button><button onClick={() => fileInput.current?.click()} className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2 font-bold text-white"><Upload size={16}/> JSON importieren</button><input ref={fileInput} onChange={importJson} type="file" accept="application/json" className="hidden"/><button onClick={() => { if (window.confirm("Lokale Challenge löschen und Beispieldaten neu laden?")) { clearChallenge(); window.location.reload(); } }} className="inline-flex items-center gap-2 rounded-2xl bg-slate-200 px-4 py-2 font-bold text-slate-900"><RefreshCcw size={16}/> Zurücksetzen</button><button onClick={() => window.print()} className="rounded-2xl bg-slate-200 px-4 py-2 font-bold text-slate-900">Drucken / PDF</button>{user && <button onClick={() => void deleteCurrentCloudChallenge()} className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-4 py-2 font-bold text-white"><Trash2 size={16}/> Challenge vom Server löschen</button>}</div></div></Card></div>;
}
