import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile, type User } from "firebase/auth";
import { onValue, ref, set, update } from "firebase/database";
import { create } from "zustand";
import { firebaseAuth, firebaseDb } from "@/lib/firebase";

export type UserProfile = {
  uid: string;
  email: string;
  displayName: string;
  onboardingComplete: boolean;
  createdAt: string;
};

type AuthState = {
  ready: boolean;
  user: User | null;
  profile: UserProfile | null;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  logOut: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
};

function profilePath(uid: string) {
  return `users/${uid}`;
}

async function writeProfile(uid: string, data: UserProfile) {
  await set(ref(firebaseDb, profilePath(uid)), data);
}

export const useAuthStore = create<AuthState>((set, get) => ({
  ready: false,
  user: null,
  profile: null,
  error: null,

  signIn: async (email, password) => {
    set({ error: null });
    await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
  },

  signUp: async (name, email, password) => {
    set({ error: null });
    const cred = await createUserWithEmailAndPassword(firebaseAuth, email.trim(), password);
    const displayName = name.trim() || email.split("@")[0];
    await updateProfile(cred.user, { displayName });
    const profile: UserProfile = {
      uid: cred.user.uid,
      email: cred.user.email ?? email.trim(),
      displayName,
      onboardingComplete: false,
      createdAt: new Date().toISOString(),
    };
    await writeProfile(cred.user.uid, profile).catch(() => undefined);
    set({ profile });
  },

  logOut: async () => {
    await signOut(firebaseAuth);
    set({ user: null, profile: null });
  },

  completeOnboarding: async () => {
    const user = get().user;
    const profile = get().profile;
    if (!user || !profile) return;
    const next = { ...profile, onboardingComplete: true };
    await update(ref(firebaseDb, profilePath(user.uid)), {
      onboardingComplete: true,
      onboardingCompletedAt: new Date().toISOString(),
    }).catch(() => undefined);
    set({ profile: next });
  },
}));

let started = false;
let stopDb: (() => void) | null = null;

export function startAuthListener() {
  if (started) return;
  started = true;
  onAuthStateChanged(firebaseAuth, (user) => {
    stopDb?.();
    stopDb = null;
    useAuthStore.setState({ user, ready: true, error: null });
    if (!user) {
      useAuthStore.setState({ profile: null });
      return;
    }
    const r = ref(firebaseDb, profilePath(user.uid));
    stopDb = onValue(
      r,
      async (snap) => {
        const val = snap.val() as UserProfile | null;
        if (val) {
          useAuthStore.setState({ profile: val });
          return;
        }
        const profile: UserProfile = {
          uid: user.uid,
          email: user.email ?? "",
          displayName: user.displayName ?? user.email?.split("@")[0] ?? "Студент",
          onboardingComplete: false,
          createdAt: new Date().toISOString(),
        };
        await writeProfile(user.uid, profile).catch(() => undefined);
        useAuthStore.setState({ profile });
      },
      () => {
        useAuthStore.setState({
          profile: {
            uid: user.uid,
            email: user.email ?? "",
            displayName: user.displayName ?? user.email?.split("@")[0] ?? "Студент",
            onboardingComplete: false,
            createdAt: new Date().toISOString(),
          },
        });
      },
    );
  });
}
