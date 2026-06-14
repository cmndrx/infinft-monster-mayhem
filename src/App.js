import "./App.css";
import { useEffect, useMemo, useState } from "react";
import firebase, { auth, db, firebaseConfig } from "./config/firbaseConfig";
import landingBg from "./assets/landing-page-bg.png";

const GAME_TITLE = "infiNFT Monster Mayhem";
const GAME_PROFILE_DOC = "profile";
const LEGACY_FIREBASE_CONFIG_KEY = "infinft:mm:firebase-config";
const DEFAULT_GAME_UPGRADES = {
  dmg: 0,
  hp: 0,
  speed: 0,
  regen: 0,
  stamina: 0,
  gold: 0,
  magnet: 0,
  xp: 0,
};

const EMPTY_FORM = {
  email: "",
  password: "",
  username: "",
};

function normalizeUsername(value, fallbackEmail = "") {
  const base = (value || fallbackEmail.split("@")[0] || "monster_hunter")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  return base || "monster_hunter";
}

async function ensureUserGameProfile(user, overrides = {}) {
  const userRef = db.collection("users").doc(user.uid);
  const gameProfileRef = userRef.collection(GAME_TITLE).doc(GAME_PROFILE_DOC);
  const now = firebase.firestore.FieldValue.serverTimestamp();
  const deleteField = firebase.firestore.FieldValue.delete();
  const userSnap = await userRef.get();
  const existingUserData = userSnap.exists ? userSnap.data() || {} : {};

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

  await gameProfileRef.set(
    {
      gameTitle: GAME_TITLE,
      username: deleteField,
      displayName: deleteField,
      email: deleteField,
      coins: 0,
      upgrades: DEFAULT_GAME_UPGRADES,
      selectedAvatar: "zippy",
      bestRunSeconds: 0,
      bestKills: 0,
      totalRuns: 0,
      totalKills: 0,
      totalWins: 0,
      totalCoinsBanked: 0,
      settings: {
        sfxEnabled: true,
        musicEnabled: true,
      },
      profileVersion: 2,
      createdAt: deleteField,
      updatedAt: deleteField,
      lastLoginAt: deleteField,
    },
    { merge: true }
  );

  const gameProfileSnap = await gameProfileRef.get();
  return gameProfileSnap.exists ? gameProfileSnap.data() : null;
}

function AuthCard({
  mode,
  form,
  loading,
  error,
  info,
  forgotPasswordOpen,
  resetEmail,
  onModeChange,
  onChange,
  onSubmit,
  onOpenReset,
  onCloseReset,
  onResetChange,
  onResetSubmit,
  onClose,
}) {
  return (
    <section className="auth-card">
      <div className="auth-card-glow" />
      <div className="auth-card-top">
      <p className="auth-kicker">Survival Access</p>
        {onClose ? (
          <button className="modal-close" onClick={onClose} type="button" aria-label="Close auth modal">
            ×
          </button>
        ) : null}
      </div>
      <h1>{GAME_TITLE}</h1>
      <p className="auth-subtitle">
        Jump into the run, hold off the monster swarm, and keep your best scores,
        kills, and long-term progression saved between sessions.
      </p>

      <div className="auth-toggle">
        <button
          className={mode === "login" ? "active" : ""}
          onClick={() => onModeChange("login")}
          type="button"
        >
          Login
        </button>
        <button
          className={mode === "signup" ? "active" : ""}
          onClick={() => onModeChange("signup")}
          type="button"
        >
          Sign Up
        </button>
      </div>

      <form
        className="auth-form"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        {mode === "signup" && (
          <>
            <label className="auth-field">
              <span>Username</span>
              <input
                name="username"
                value={form.username}
                onChange={onChange}
                placeholder="infinft_handle"
                autoComplete="username"
              />
            </label>
          </>
        )}

        <label className="auth-field">
          <span>Email</span>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={onChange}
            placeholder="you@example.com"
            autoComplete={mode === "signup" ? "email" : "username"}
          />
        </label>

        <label className="auth-field">
          <span>Password</span>
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={onChange}
            placeholder="Enter your password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
          />
        </label>

        <button className="auth-primary" disabled={loading} type="submit">
          {loading ? "Working..." : mode === "signup" ? "Create Account" : "Login"}
        </button>
      </form>

      <div className="auth-meta">
        <button className="auth-link" onClick={onOpenReset} type="button">
          Forgot password?
        </button>
      </div>

      {error ? <div className="auth-message error">{error}</div> : null}
      {info ? <div className="auth-message info">{info}</div> : null}

      {forgotPasswordOpen ? (
        <div className="auth-modal-backdrop" onClick={onCloseReset} role="presentation">
          <div
            className="auth-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <h2>Reset Password</h2>
            <p>
              Enter your email and we will send a reset link so you can get back into the next run.
            </p>
            <label className="auth-field">
              <span>Email</span>
              <input
                type="email"
                value={resetEmail}
                onChange={onResetChange}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </label>
            <div className="auth-modal-actions">
              <button className="auth-secondary" onClick={onCloseReset} type="button">
                Cancel
              </button>
              <button className="auth-primary" onClick={onResetSubmit} disabled={loading} type="button">
                Send Reset Link
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function LandingHero({ onOpenLogin, onOpenSignup }) {
  return (
    <section className="landing-hero">
      <div className="brand-scene">
        <img src={landingBg} alt="Monster Mayhem landscape" />
      </div>
      <p className="auth-kicker">infiNFT Studios</p>
      <h1 className="brand-title">{GAME_TITLE}</h1>
      <p className="brand-copy">
        Survive wave after wave of charging monsters, scoop up XP, bank your best
        runs, and push deeper into a bright low-poly battlefield built for arcade chaos.
      </p>
      <div className="landing-actions">
        <button className="auth-primary launch" onClick={onOpenSignup} type="button">
          Create Account
        </button>
        <button className="auth-secondary launch-alt" onClick={onOpenLogin} type="button">
          Login
        </button>
      </div>
    </section>
  );
}

function App() {
  const [authReady, setAuthReady] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [, setGameProfile] = useState(null);
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const firebaseMissing = useMemo(() => {
    return !process.env.REACT_APP_API_KEY || !process.env.REACT_APP_PROJECT_ID;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || firebaseMissing) {
      return;
    }

    window.localStorage.setItem(
      LEGACY_FIREBASE_CONFIG_KEY,
      JSON.stringify(firebaseConfig)
    );
  }, [firebaseMissing]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setCurrentUser(user || null);
      setError("");

      if (!user) {
        setGameProfile(null);
        setAuthModalOpen(false);
        setAuthReady(true);
        return;
      }

      try {
        const profile = await ensureUserGameProfile(user);
        setGameProfile(profile);
      } catch (profileError) {
        console.error("Failed to load game profile:", profileError);
        setError("Signed in, but we could not load your Monster Mayhem profile.");
      } finally {
        setAuthReady(true);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!authReady || !currentUser) {
      return;
    }

    window.location.href = "/legacy/index.html";
  }, [authReady, currentUser]);

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    setInfo("");

    try {
      const email = form.email.trim().toLowerCase();
      const password = form.password;

      if (!email || !password) {
        throw new Error("Enter your email and password.");
      }

      await auth.signInWithEmailAndPassword(email, password);
      setInfo("Login successful.");
      setForm((current) => ({ ...current, password: "" }));
    } catch (loginError) {
      setError(loginError?.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    setLoading(true);
    setError("");
    setInfo("");

    try {
      const email = form.email.trim().toLowerCase();
      const password = form.password.trim();
      const username = normalizeUsername(form.username, email);

      if (!form.username.trim()) {
        throw new Error("Add a username to create your account.");
      }

      if (!email || !password) {
        throw new Error("Enter a valid email and password.");
      }

      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters long.");
      }

      const credential = await auth.createUserWithEmailAndPassword(email, password);
      if (credential.user) {
        await ensureUserGameProfile(credential.user, {
          username,
          email,
        });
      }

      setInfo("Account created successfully.");
      setForm(EMPTY_FORM);
    } catch (signupError) {
      setError(signupError?.message || "We could not create your account.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setLoading(true);
    setError("");
    setInfo("");

    try {
      const email = resetEmail.trim().toLowerCase();
      if (!email) {
        throw new Error("Enter the email for your account.");
      }

      await auth.sendPasswordResetEmail(email);
      setInfo("Password reset email sent. Check your inbox.");
      setForgotPasswordOpen(false);
      setResetEmail("");
    } catch (resetError) {
      setError(resetError?.message || "Unable to send password reset email.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (mode === "signup") {
      handleSignup();
      return;
    }

    handleLogin();
  };

  const openAuthModal = (nextMode) => {
    setMode(nextMode);
    setError("");
    setInfo("");
    setAuthModalOpen(true);
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
        ) : currentUser ? (
          <div className="status-card">
            <h2>Entering Monster Mayhem...</h2>
            <p>
              Loading your player profile and sending you straight into the next run.
            </p>
          </div>
        ) : (
          <LandingHero
            onOpenLogin={() => openAuthModal("login")}
            onOpenSignup={() => openAuthModal("signup")}
          />
        )}
      </section>

      {!currentUser && authModalOpen && !firebaseMissing && authReady ? (
        <div className="auth-entry-backdrop" onClick={() => setAuthModalOpen(false)} role="presentation">
          <div className="auth-entry-modal" onClick={(event) => event.stopPropagation()}>
            <AuthCard
              mode={mode}
              form={form}
              loading={loading}
              error={error}
              info={info}
              forgotPasswordOpen={forgotPasswordOpen}
              resetEmail={resetEmail}
              onModeChange={(nextMode) => {
                setMode(nextMode);
                setError("");
                setInfo("");
              }}
              onChange={handleFieldChange}
              onSubmit={handleSubmit}
              onOpenReset={() => {
                setResetEmail(form.email);
                setForgotPasswordOpen(true);
              }}
              onCloseReset={() => setForgotPasswordOpen(false)}
              onResetChange={(event) => setResetEmail(event.target.value)}
              onResetSubmit={handleResetPassword}
              onClose={() => setAuthModalOpen(false)}
            />
          </div>
        </div>
      ) : null}
    </main>
  );
}

export default App;
