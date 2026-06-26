import { Challenge } from "@/types";
import { createSampleChallenge } from "@/data/sample";

const KEY = "pokemon-soullink-challenge-v1";

export function loadChallenge(): Challenge {
  if (typeof window === "undefined") return createSampleChallenge();
  const raw = window.localStorage.getItem(KEY);
  if (!raw) {
    const sample = createSampleChallenge();
    window.localStorage.setItem(KEY, JSON.stringify(sample));
    return sample;
  }
  try {
    return JSON.parse(raw) as Challenge;
  } catch {
    const sample = createSampleChallenge();
    window.localStorage.setItem(KEY, JSON.stringify(sample));
    return sample;
  }
}

export function saveChallenge(challenge: Challenge) {
  if (typeof window !== "undefined") window.localStorage.setItem(KEY, JSON.stringify({ ...challenge, updatedAt: new Date().toISOString() }));
}

export function clearChallenge() {
  if (typeof window !== "undefined") window.localStorage.removeItem(KEY);
}
