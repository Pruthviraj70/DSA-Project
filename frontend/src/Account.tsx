import { useState } from "react";
import { registrationErrors } from "./registration";
import { api, type User } from "./api";
export function Account({
  user,
  onUser,
  onSync,
}: {
  user: User;
  onUser: (user: User) => Promise<void>;
  onSync: () => Promise<void>;
}) {
  const [register, setRegister] = useState(false),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [confirmation, setConfirmation] = useState(""),
    [touched, setTouched] = useState({ password: false, confirmation: false }),
    [name, setName] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const errors = registrationErrors(password, confirmation);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (register) {
      setTouched({ password: true, confirmation: true });
      if (errors.password || errors.confirmation) return;
    }
    setBusy(true);
    setMessage("");
    try {
      const u = await api<User>(
        register ? "/auth/register" : "/auth/login",
        "POST",
        { email, password, ...(register ? { displayName: name } : {}) },
      );
      setPassword("");
      setConfirmation("");
      setTouched({ password: false, confirmation: false });
      await onUser(u);
      setMessage("Signed in. Your saved place will synchronize automatically.");
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel account">
      <h2>
        {user.authenticated
          ? `Welcome, ${user.displayName}`
          : "Keep your learning in sync"}
      </h2>
      <p>
        Guest exploration works without an account. Sign in to synchronize
        checkpoints, save experiments, and take official assessments.
      </p>
      {user.authenticated ? (
        <div className="inline">
          <button
            onClick={async () => {
              try {
                await onSync();
                setMessage("Checkpoints synchronized.");
              } catch (e) {
                setMessage((e as Error).message);
              }
            }}
          >
            Sync checkpoints
          </button>
          <button
            onClick={async () => {
              try {
                await api("/auth/logout", "POST");
                await onUser({ authenticated: false });
                setMessage("Signed out.");
              } catch (e) {
                setMessage((e as Error).message);
              }
            }}
          >
            Sign out
          </button>
        </div>
      ) : (
        <form onSubmit={(e) => void submit(e)}>
          <div className="inline">
            <button
              type="button"
              aria-pressed={!register}
              onClick={() => {
                setRegister(false);
                setConfirmation("");
                setTouched({ password: false, confirmation: false });
              }}
            >
              Sign in
            </button>
            <button
              type="button"
              aria-pressed={register}
              onClick={() => {
                setRegister(true);
                setTouched({ password: false, confirmation: false });
              }}
            >
              Create account
            </button>
          </div>
          {register && (
            <label>
              Display name
              <input
                value={name}
                required
                maxLength={80}
                autoComplete="nickname"
                onChange={(e) => setName(e.target.value)}
              />
            </label>
          )}
          <label>
            Email
            <input
              type="email"
              value={email}
              required
              maxLength={254}
              autoComplete="username"
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              required
              minLength={register ? 5 : 1}
              onInvalid={() => {
                if (register) setTouched((t) => ({ ...t, password: true }));
              }}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              aria-invalid={register && touched.password && !!errors.password}
              aria-describedby={
                register && touched.password && errors.password
                  ? "password-error"
                  : undefined
              }
              maxLength={72}
              autoComplete={register ? "new-password" : "current-password"}
              onChange={(e) => {
                e.currentTarget.setCustomValidity("");
                setPassword(e.target.value);
              }}
            />
          </label>
          {register && touched.password && errors.password && (
            <p id="password-error" className="error" role="alert">
              {errors.password}
            </p>
          )}
          {register && (
            <>
              <label>
                Confirm password
                <input
                  type="password"
                  name="password-confirmation"
                  required
                  maxLength={72}
                  autoComplete="new-password"
                  value={confirmation}
                  aria-invalid={touched.confirmation && !!errors.confirmation}
                  aria-describedby={
                    touched.confirmation && errors.confirmation
                      ? "confirmation-error"
                      : undefined
                  }
                  onInvalid={() =>
                    setTouched((t) => ({ ...t, confirmation: true }))
                  }
                  onBlur={() =>
                    setTouched((t) => ({ ...t, confirmation: true }))
                  }
                  onChange={(e) => setConfirmation(e.target.value)}
                />
              </label>
              {touched.confirmation && errors.confirmation && (
                <p id="confirmation-error" className="error" role="alert">
                  {errors.confirmation}
                </p>
              )}
            </>
          )}
          <button className="primary" disabled={busy}>
            {busy
              ? "Connecting…"
              : register
                ? "Register and sign in"
                : "Sign in to your account"}
          </button>
        </form>
      )}
      <p role="status">{message}</p>
    </section>
  );
}
