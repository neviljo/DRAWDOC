const GUEST_NAMES = [
  "Teal Sparrow", "Amber Fox", "Crimson Wolf", "Sage Owl",
  "Azure Jay", "Coral Lynx", "Jade Bear", "Ruby Hawk",
  "Slate Deer", "Plum Vixen", "Mint Seal", "Cobalt Wren",
];

const GUEST_COLORS = [
  "#14b8a6", "#f59e0b", "#ef4444", "#84cc16",
  "#3b82f6", "#ec4899", "#10b981", "#dc2626",
  "#64748b", "#d946ef", "#22d3ee", "#6366f1",
];

export interface GuestIdentity {
  id: string;
  name: string;
  color: string;
}

export function getGuestIdentity(): GuestIdentity {
  const stored = sessionStorage.getItem("guest_identity");
  if (stored) return JSON.parse(stored);

  const id = crypto.randomUUID();
  const idx = Math.abs(hashCode(id)) % GUEST_NAMES.length;
  const identity: GuestIdentity = {
    id,
    name: GUEST_NAMES[idx],
    color: GUEST_COLORS[idx],
  };
  sessionStorage.setItem("guest_identity", JSON.stringify(identity));
  return identity;
}

function hashCode(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash + s.charCodeAt(i)) | 0;
  }
  return hash;
}
