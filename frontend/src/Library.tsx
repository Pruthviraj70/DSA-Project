import { useState, useEffect } from "react";
import { storage, type LocalExperiment } from "./storage";
import { api, type User } from "./api";
export interface SavedExperiment {
  id: string | number;
  moduleId: string;
  title: string;
  input: LocalExperiment["input"];
  configuration: { speed: number };
  engineVersion: string;
  createdAt: string;
}
export function Library({
  user,
  onLoad,
}: {
  user: User;
  onLoad: (x: SavedExperiment) => void;
}) {
  const [local, setLocal] = useState<LocalExperiment[]>([]),
    [remote, setRemote] = useState<SavedExperiment[]>([]),
    [message, setMessage] = useState(""),
    [page, setPage] = useState(0),
    [total, setTotal] = useState(0);
  const owner = user.authenticated ? String(user.id) : "guest";
  async function refresh() {
    try {
      setLocal(
        (await storage.experiments()).filter(
          (x) => x.owner === owner || x.owner === "guest",
        ),
      );
      if (user.authenticated) {
        const result = await api<{ items: SavedExperiment[]; total: number }>(
          `/experiments?page=${page}&size=10`,
        );
        setRemote(result.items);
        setTotal(result.total);
      } else setRemote([]);
    } catch (e) {
      setMessage((e as Error).message);
    }
  }
  useEffect(() => {
    void refresh();
  }, [user.id, page]);
  return (
    <section>
      <span className="eyebrow">PICK UP WHERE YOU LEFT OFF</span>
      <h2>Saved experiments</h2>
      <p>
        Experiments store inputs, playback configuration, and engine version.
        They do not store animation frames.
      </p>
      <h3>On this device</h3>
      {!local.length && (
        <p className="empty">
          No local experiments yet. Save one from the lab.
        </p>
      )}
      {local.map((x) => (
        <article className="panel saved-row" key={x.id}>
          <div>
            <h3>{x.title}</h3>
            <p>
              {x.moduleId} · {x.engineVersion} ·{" "}
              {new Date(x.createdAt).toLocaleDateString()}
            </p>
          </div>
          <button onClick={() => onLoad(x)}>Load</button>
          {user.authenticated && (
            <button
              onClick={async () => {
                try {
                  await api("/experiments", "POST", {
                    moduleId: x.moduleId,
                    title: x.title,
                    input: x.input,
                    configuration: x.configuration,
                    engineVersion: x.engineVersion,
                  });
                  setMessage("Uploaded to your account.");
                  await refresh();
                } catch (e) {
                  setMessage((e as Error).message);
                }
              }}
            >
              Upload copy
            </button>
          )}
          <button
            onClick={async () => {
              await storage.removeExperiment(x.id);
              await refresh();
            }}
          >
            Delete local
          </button>
        </article>
      ))}
      {user.authenticated && (
        <>
          <h3>In your account</h3>
          {!remote.length && (
            <p className="empty">No saved account experiments.</p>
          )}
          {remote.map((x) => (
            <article className="panel saved-row" key={x.id}>
              <div>
                <h3>{x.title}</h3>
                <p>
                  {x.moduleId} · {x.engineVersion}
                </p>
              </div>
              <button onClick={() => onLoad(x)}>Load</button>
              <button
                onClick={async () => {
                  try {
                    await api(`/experiments/${x.id}`, "DELETE");
                    await refresh();
                  } catch (e) {
                    setMessage((e as Error).message);
                  }
                }}
              >
                Delete
              </button>
            </article>
          ))}
          <div className="inline">
            <button disabled={page === 0} onClick={() => setPage(page - 1)}>
              Previous experiments
            </button>
            <span>Page {page + 1}</span>
            <button
              disabled={(page + 1) * 10 >= total}
              onClick={() => setPage(page + 1)}
            >
              Next experiments
            </button>
          </div>
        </>
      )}
      <p role="status">{message}</p>
    </section>
  );
}
