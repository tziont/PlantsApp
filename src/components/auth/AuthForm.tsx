"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import Button from "@/components/ui/Button";
import { signIn, signUp } from "@/lib/auth-client";

import styles from "./AuthForm.module.scss";

type Mode = "login" | "signup";

/** Friendly text for the Better Auth codes a user can actually trigger here. */
const ERROR_MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "Incorrect email or password.",
  INVALID_EMAIL: "Enter a valid email address.",
  INVALID_PASSWORD: "Incorrect email or password.",
  PASSWORD_TOO_SHORT: "That password is too short.",
  PASSWORD_TOO_LONG: "That password is too long.",
  USER_ALREADY_EXISTS: "An account with that email already exists. Try logging in.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL:
    "An account with that email already exists. Try logging in.",
};

function messageFor(error: { code?: string; message?: string }) {
  return (
    (error.code && ERROR_MESSAGES[error.code]) ??
    error.message ??
    "Something went wrong. Please try again."
  );
}

export default function AuthForm({ initialMode }: { initialMode: Mode }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSignup = mode === "signup";

  function switchTo(next: Mode) {
    if (next === mode) return;
    setMode(next);
    // Keep the email they already typed; drop the rest.
    setError(null);
    setPassword("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const result = isSignup
      ? await signUp.email({ name, email, password })
      : await signIn.email({ email, password });

    if (result.error) {
      setError(messageFor(result.error));
      setPending(false);
      return;
    }

    // Sign-up auto-signs-in (Better Auth default), so both paths land here with
    // a session cookie set. `refresh()` makes the server tree re-read it.
    router.push("/controllers");
    router.refresh();
  }

  return (
    <div className={styles.card}>
      <div className={styles.intro}>
        <h1 className={styles.title}>
          {isSignup ? "Create your account" : "Welcome back"}
        </h1>
        <p className={styles.subtitle}>
          {isSignup
            ? "Set up controllers and start tracking your plants."
            : "Sign in to check on your plants."}
        </p>
      </div>

      <div role="tablist" aria-label="Authentication" className={styles.tabs}>
        <button
          type="button"
          role="tab"
          aria-selected={!isSignup}
          onClick={() => switchTo("login")}
          className={styles.tab}
        >
          Log in
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={isSignup}
          onClick={() => switchTo("signup")}
          className={styles.tab}
        >
          Sign up
        </button>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {isSignup && (
          <label className={styles.field}>
            <span className={styles.label}>Name</span>
            <input
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              disabled={pending}
              placeholder="Alex Green"
              className={styles.input}
            />
          </label>
        )}

        <label className={styles.field}>
          <span className={styles.label}>Email</span>
          <input
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            disabled={pending}
            placeholder="you@example.com"
            className={styles.input}
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Password</span>
          {/* No minLength: Better Auth owns the credential rules (SPEC 20). */}
          <input
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete={isSignup ? "new-password" : "current-password"}
            disabled={pending}
            placeholder="••••••••"
            className={styles.input}
          />
        </label>

        {error && (
          <p role="alert" className={styles.error}>
            <span aria-hidden="true">⚠</span>
            {error}
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          disabled={pending}
          className={styles.submit}
        >
          {pending
            ? isSignup
              ? "Creating account..."
              : "Signing in..."
            : isSignup
              ? "Sign up"
              : "Log in"}
        </Button>
      </form>

      <p className={styles.switch}>
        {isSignup ? "Already have an account?" : "No account yet?"}{" "}
        <button
          type="button"
          onClick={() => switchTo(isSignup ? "login" : "signup")}
          className={styles.switchButton}
        >
          {isSignup ? "Log in" : "Sign up"}
        </button>
      </p>
    </div>
  );
}
