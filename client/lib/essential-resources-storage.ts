export type EssentialResource = {
  id: string;
  name: string;
  url: string;
};

const STORAGE_KEY = "brisk-essential-resources";

type ResourceStore = Record<string, EssentialResource[]>;

function readStore(): ResourceStore {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as ResourceStore;
  } catch {
    return {};
  }
}

function writeStore(store: ResourceStore) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function readEssentialResources(projectId: string): EssentialResource[] {
  if (!projectId.trim()) return [];
  return readStore()[projectId] ?? [];
}

export function saveEssentialResources(
  projectId: string,
  resources: EssentialResource[],
) {
  if (!projectId.trim()) return;

  const store = readStore();
  store[projectId] = resources;
  writeStore(store);
}
