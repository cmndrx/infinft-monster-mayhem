import "./App.css";
import { useEffect, useMemo, useState } from "react";
import firebase, { auth, db, firebaseConfig } from "./config/firbaseConfig";
import AuthFlow from "./components/AuthFlow";
import {
  getLeaderboardRecoveryPatch,
  hasRecoveryValues,
} from "./services/gameProfileRecovery";

const GAME_TITLE = "infiNFT Monster Mayhem";
const GAME_PROFILE_DOC = "profile";
const GAME_LEADERBOARD_COLLECTION = "infinft_monster_mayhem_leaderboard";
const LEGACY_FIREBASE_CONFIG_KEY = "infinft:mm:firebase-config";
const LEGACY_COMMERCE_CONFIG_KEY = "infinft:mm:commerce-config";
const DEV_HOST_MARKERS = ["infinft-monster-mayhem-dev"];
const DEV_ACCESS_ROLES = ["admin", "play_tester"];
function normalizeUsername(value, fallbackEmail = "") {
  const base = (value || fallbackEmail.split("@")[0] || "monster_hunter")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  return base || "monster_hunter";
}

function isDevAccessRestrictedHost() {
  if (typeof window === "undefined") return false;
  const hostname = window.location?.hostname?.toLowerCase() || "";
  return DEV_HOST_MARKERS.some((marker) => hostname.includes(marker));
}

function normalizeRoleValue(value) {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function collectRoleNames(source = {}) {
  const roles = new Set();
  const addRole = (value) => {
    const normalized = normalizeRoleValue(value);
    if (normalized) roles.add(normalized);
  };

  if (!source || typeof source !== "object") return roles;

  addRole(source.role);
  addRole(source.userRole);
  addRole(source.accessRole);

  if (Array.isArray(source.roles)) {
    source.roles.forEach(addRole);
  } else if (source.roles && typeof source.roles === "object") {
    Object.entries(source.roles).forEach(([roleName, enabled]) => {
      if (enabled) addRole(roleName);
    });
  }

  if (source.admin === true || source.isAdmin === true) addRole("admin");
  if (
    source.play_tester === true ||
    source.playTester === true ||
    source.isPlayTester === true
  ) {
    addRole("play_tester");
  }

  return roles;
}

function hasDevSiteAccess(account = {}, claims = {}) {
  if (!isDevAccessRestrictedHost()) return true;

  const roleNames = new Set([
    ...collectRoleNames(account),
    ...collectRoleNames(claims),
  ]);

  return DEV_ACCESS_ROLES.some((role) => roleNames.has(role));
}

async function ensureUserGameProfile(user, overrides = {}) {
  const userRef = db.collection("users").doc(user.uid);
  const gameProfileRef = userRef.collection(GAME_TITLE).doc(GAME_PROFILE_DOC);
  const leaderboardRef = db.collection(GAME_LEADERBOARD_COLLECTION).doc(user.uid);
  const now = firebase.firestore.FieldValue.serverTimestamp();
  const [userSnap, gameProfileSnap] = await Promise.all([
    userRef.get(),
    gameProfileRef.get(),
  ]);
  const existingUserData = userSnap.exists ? userSnap.data() || {} : {};
  const existingGameProfileData = gameProfileSnap.exists ? gameProfileSnap.data() || {} : {};

  const email = (user.email || overrides.email || "").toLowerCase().trim();
  const existingUsername = (existingUserData.username || "").trim();
  const nextUsername = (overrides.username || "").trim()
    ? normalizeUsername(overrides.username, email)
    : "";

  const userPayload = {
    email,
    updatedAt: now,
    lastLoginAt: now,
    createdAt: existingUserData.createdAt || now,
  };

  if (!existingUsername && nextUsername) {
    userPayload.username = nextUsername;
  }

  await userRef.set(userPayload, { merge: true });

  let leaderboardData = {};
  try {
    const leaderboardSnap = await leaderboardRef.get();
    leaderboardData = leaderboardSnap.exists ? leaderboardSnap.data() || {} : {};
  } catch (leaderboardError) {
    console.warn("Unable to check Monster Mayhem leaderboard recovery data:", leaderboardError);
  }

  const recoveryPatch = getLeaderboardRecoveryPatch(existingGameProfileData, leaderboardData);
  if (hasRecoveryValues(recoveryPatch)) {
    await gameProfileRef.set(
      {
        ...recoveryPatch,
        gameTitle: GAME_TITLE,
        profileVersion: 2,
        recoveredFromLeaderboardAt: now,
      },
      { merge: true }
    );
  }

  const account = { ...existingUserData, ...userPayload };
  const profile = gameProfileSnap.exists || hasRecoveryValues(recoveryPatch)
    ? { ...existingGameProfileData, ...recoveryPatch }
    : null;

  return { account, profile };
}

function App() {
  const [authReady, setAuthReady] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [, setGameProfile] = useState(null);
  const [devAccessGranted, setDevAccessGranted] = useState(null);
  const [error, setError] = useState("");

  const firebaseMissing = useMemo(() => {
    return !process.env.REACT_APP_API_KEY || !process.env.REACT_APP_PROJECT_ID;
  }, []);

  const devAccessRestrictedHost = useMemo(() => {
    return isDevAccessRestrictedHost();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || firebaseMissing) {
      return;
    }

    window.localStorage.setItem(
      LEGACY_FIREBASE_CONFIG_KEY,
      JSON.stringify(firebaseConfig)
    );

    const isLocalhost = window.location?.origin?.includes("localhost");
    const fallbackPublishableKey = isLocalhost
      ? (process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || process.env.REACT_APP_STRIPE_TEST_KEY2 || process.env.REACT_APP_STRIPE_LIVE_KEY || "")
      : (process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || process.env.REACT_APP_STRIPE_LIVE_KEY || process.env.REACT_APP_STRIPE_TEST_KEY2 || "");

    window.localStorage.setItem(
      LEGACY_COMMERCE_CONFIG_KEY,
      JSON.stringify({
        commerceApiBaseUrl:
          process.env.REACT_APP_COMMERCE_API_BASE_URL ||
          "https://us-central1-infinft-card-game.cloudfunctions.net/app",
        publishableKey: fallbackPublishableKey,
        stripeTestKey2: process.env.REACT_APP_STRIPE_TEST_KEY2 || "",
        stripeLiveKey: process.env.REACT_APP_STRIPE_LIVE_KEY || "",
      })
    );
  }, [firebaseMissing]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setCurrentUser(user || null);
      setError("");

      if (!user) {
        setGameProfile(null);
        setDevAccessGranted(null);
        setAuthReady(true);
        return;
      }

      setAuthReady(false);

      try {
        const tokenResult = await user.getIdTokenResult();
        const { account, profile } = await ensureUserGameProfile(user);
        const hasAccess = hasDevSiteAccess(account, tokenResult?.claims || {});

        setDevAccessGranted(hasAccess);

        if (hasAccess) {
          setGameProfile(profile);
        } else {
          setGameProfile(null);
        }
      } catch (profileError) {
        console.error("Failed to load game profile:", profileError);
        setDevAccessGranted(null);
        setError("Signed in, but we could not load your Monster Mayhem profile.");
      } finally {
        setAuthReady(true);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (
      !authReady ||
      !currentUser ||
      (devAccessRestrictedHost && devAccessGranted !== true)
    ) {
      return;
    }

    window.location.href = "/legacy/index.html";
  }, [authReady, currentUser, devAccessGranted, devAccessRestrictedHost]);

  const handleLogin = async (email, password) => {
    setError("");
    const credential = await auth.signInWithEmailAndPassword(
      String(email || "").trim().toLowerCase(),
      password
    );
    return credential.user;
  };

  const handleSignup = async ({ username, email, password }) => {
    setError("");
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedUsername = normalizeUsername(username, normalizedEmail);
    const usernameSnapshot = await db
      .collection("users")
      .where("username", "==", normalizedUsername)
      .limit(1)
      .get();

    if (!usernameSnapshot.empty) {
      throw Object.assign(
        new Error("That username is already taken. Please choose another one."),
        { code: "auth/username-already-in-use" }
      );
    }

    const credential = await auth.createUserWithEmailAndPassword(
      normalizedEmail,
      password
    );
    if (!credential.user) return null;

    await credential.user.updateProfile({ displayName: normalizedUsername });
    const { profile: gameProfile } = await ensureUserGameProfile(credential.user, {
      username: normalizedUsername,
      email: normalizedEmail,
    });

    return { user: credential.user, gameProfile };
  };

  const handleResetPassword = async (email) => {
    setError("");
    await auth.sendPasswordResetEmail(String(email || "").trim().toLowerCase());
  };

  const handleSignOut = async () => {
    setError("");

    try {
      await auth.signOut();
    } catch (signOutError) {
      setError(signOutError?.message || "Unable to sign out right now.");
    }
  };

  return (
    <main className="auth-shell">
      <div className="auth-backdrop" />
      <div className="auth-noise" />

      <section className="center-stage">
        {!authReady ? (
          <div className="status-card">
            <h2>Connecting...</h2>
            <p>Checking your infiNFT session and loading Monster Mayhem account state.</p>
          </div>
        ) : firebaseMissing ? (
          <div className="status-card error">
            <h2>Firebase Config Missing</h2>
            <p>
              This app needs the `REACT_APP_*` Firebase environment variables before auth can run.
            </p>
          </div>
        ) : currentUser && devAccessRestrictedHost && devAccessGranted === false ? (
          <div className="status-card error">
            <h2>Developer Access Required</h2>
            <p>
              This dev deployment is limited to accounts with the `admin` or `play_tester`
              role.
            </p>
            <div className="landing-actions">
              <button className="auth-secondary compact" onClick={handleSignOut} type="button">
                Sign Out
              </button>
            </div>
          </div>
        ) : currentUser ? (
          <div className="status-card">
            <h2>Entering Monster Mayhem...</h2>
            <p>
              Loading your player profile and sending you straight into the next run.
            </p>
          </div>
        ) : null}
      </section>

      {!currentUser && !firebaseMissing && authReady ? (
        <AuthFlow
          initialMode="login"
          authError={error || null}
          signIn={handleLogin}
          signUp={handleSignup}
          resetPassword={handleResetPassword}
        />
      ) : null}
    </main>
  );
}

export default App;
