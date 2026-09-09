import { useEffect, useMemo, useRef, useState } from "react";
import { animate } from "animejs";
import { ShimmerButton } from "./components/ShimmerButton";
import { SplitHeadline } from "./components/SplitHeadline";

type CallSheet = {
  production: string;
  shoot_date: string;
  unit: string;
  location: string;
  scenes: string;
  cast: string;
  music_cues: string;
  notes: string;
};

type Source = { title: string; url: string };
type Flag = { severity: string; title: string; detail: string; sources?: Source[] };
type Brief = {
  headline: string;
  verdict: string;
  summary: string;
  flags: Flag[];
  sources: Source[];
};
type Step = { tool: string; args: Record<string, unknown> };

const FIELDS: { key: keyof CallSheet; label: string; textarea?: boolean }[] = [
  { key: "production", label: "Production" },
  { key: "shoot_date", label: "Shoot date" },
  { key: "unit", label: "Unit" },
  { key: "location", label: "Location" },
  { key: "scenes", label: "Scenes", textarea: true },
  { key: "cast", label: "Cast" },
  { key: "music_cues", label: "Music cues", textarea: true },
  { key: "notes", label: "Notes", textarea: true },
];

const emptySheet: CallSheet = {
  production: "",
  shoot_date: "",
  unit: "Main unit",
  location: "",
  scenes: "",
  cast: "",
  music_cues: "",
  notes: "",
};

function verdictLabel(v: string) {
  if (v === "proceed") return "Proceed";
  if (v === "ask_legal") return "Ask legal";
  return "Watch";
}

export default function App() {
  const [sheet, setSheet] = useState<CallSheet>(emptySheet);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [health, setHealth] = useState<{ google: boolean; parallel: boolean } | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [brief, setBrief] = useState<Brief | null>(null);
  const stampRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let stop = false;
    const tick = () => {
      fetch("/api/health")
        .then((r) => r.json())
        .then((d) => {
          if (!stop) setHealth({ google: !!d.google, parallel: !!d.parallel });
        })
        .catch(() => {
          if (!stop) setHealth({ google: false, parallel: false });
        });
    };
    tick();
    const id = window.setInterval(tick, 2500);
    return () => {
      stop = true;
      window.clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (!brief || !stampRef.current) return;
    animate(stampRef.current, { scale: [0.9, 1], opacity: [0, 1], duration: 420, ease: "out(3)" });
  }, [brief]);

  const keysReady = Boolean(health?.google && health?.parallel);

  function goDesk() {
    document.getElementById("desk")?.scrollIntoView({ behavior: "smooth" });
  }

  async function loadSample() {
    setError("");
    const res = await fetch("/api/sample");
    if (!res.ok) {
      setError("API is down. Restart the Python window after the encoding fix.");
      return;
    }
    const data = await res.json();
    setSheet(data.call_sheet);
    setBrief(null);
    setSteps([]);
    goDesk();
  }

  async function runOvernight() {
    setError("");
    setLoading(true);
    setBrief(null);
    setSteps([]);
    try {
      const res = await fetch("/api/overnight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ call_sheet: sheet }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.detail === "string" ? data.detail : "Overnight failed");
      setSteps(data.steps || []);
      setBrief(data.brief);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Overnight failed");
    } finally {
      setLoading(false);
    }
  }

  const stampClass = useMemo(() => {
    if (brief?.verdict === "proceed") return "border-2 border-emerald-800 text-emerald-900";
    if (brief?.verdict === "ask_legal") return "border-2 border-red-800 text-red-900";
    return "border-2 border-amber-800 text-amber-900";
  }, [brief]);

  return (
    <div className="bg-[#1a120c] font-sans text-zinc-100">
      <section className="relative flex min-h-screen flex-col justify-between overflow-hidden bg-black px-6 py-8 md:px-12">
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 80% 60% at 50% -5%, rgba(255,196,110,0.38) 0%, rgba(255,160,60,0.12) 28%, rgba(0,0,0,0) 62%)",
            }}
          />
          <div className="absolute left-1/2 top-0 z-10 flex -translate-x-1/2 flex-col items-center">
            <div className="h-10 w-px bg-white/25" />
            <div
              className="h-7 w-24 rounded-b-[1.2rem] bg-zinc-800 shadow-[0_20px_50px_rgba(255,190,90,0.35)]"
              style={{ boxShadow: "0 18px 40px rgba(255,200,100,0.45)" }}
            />
          </div>
        </div>

        <nav className="relative z-10 flex items-center justify-between">
          <span className="text-[11px] font-medium uppercase tracking-[0.35em] text-amber-200/80">Night desk</span>
          <span
            className={`rounded-full px-3 py-1 text-[11px] ${
              keysReady ? "bg-emerald-400/10 text-emerald-200" : "bg-white/5 text-zinc-500"
            }`}
          >
            {health == null ? "Connecting" : keysReady ? "Live" : "API offline"}
          </span>
        </nav>

        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <p className="mb-5 text-xs uppercase tracking-[0.42em] text-zinc-500">Production research</p>
          <div className="[filter:drop-shadow(0_0_32px_rgba(255,200,110,0.55))]">
            <SplitHeadline
              text="Overnight"
              className="font-display text-7xl font-medium tracking-tight text-amber-50 md:text-[8rem]"
            />
          </div>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-zinc-400">
            The call sheet is done. The googling is not. Paste tomorrow's lineup. Get a one-page risk brief before crew
            call.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <ShimmerButton type="button" onClick={loadSample}>
              Load River Line
            </ShimmerButton>
            <button
              type="button"
              onClick={goDesk}
              className="rounded-full border border-white/15 px-6 py-3 text-sm text-zinc-300 hover:border-white/30 hover:text-white"
            >
              Open a blank sheet
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={goDesk}
          className="relative z-10 mx-auto mb-2 text-[11px] uppercase tracking-[0.3em] text-zinc-600 hover:text-zinc-300"
        >
          Scroll
        </button>
      </section>

      <section
        id="desk"
        className="relative px-4 py-16 md:px-8"
        style={{ backgroundImage: "url('/desk.png')", backgroundSize: "cover", backgroundPosition: "center" }}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="text-[11px] uppercase tracking-[0.3em] text-amber-200/80">The desk</p>
          <h2 className="mt-2 font-display text-4xl text-white">Call sheet to packet</h2>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-2">
          <section className="sheet -rotate-1 px-7 py-6 text-black">
            <div className="mb-1 flex items-start justify-between border-b-2 border-black pb-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-black/60">Call sheet</p>
                <h3 className="font-display text-4xl font-semibold tracking-tight">OVERNIGHT</h3>
              </div>
              <button type="button" onClick={loadSample} className="text-xs uppercase tracking-widest underline">
                Use sample
              </button>
            </div>
            <div className="grid grid-cols-2">
              {FIELDS.map((field) => (
                <label
                  key={field.key}
                  className={`border-b border-black/30 py-2 ${
                    field.textarea || field.key === "location" || field.key === "cast" ? "col-span-2" : ""
                  }`}
                >
                  <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-black/55">{field.label}</span>
                  {field.textarea ? (
                    <textarea
                      value={sheet[field.key]}
                      onChange={(e) => setSheet((s) => ({ ...s, [field.key]: e.target.value }))}
                      rows={2}
                      className="field"
                    />
                  ) : (
                    <input
                      value={sheet[field.key]}
                      onChange={(e) => setSheet((s) => ({ ...s, [field.key]: e.target.value }))}
                      className="field"
                    />
                  )}
                </label>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <ShimmerButton type="button" disabled={loading} onClick={runOvernight}>
                {loading ? "Running..." : "Run overnight"}
              </ShimmerButton>
              {loading ? <span className="font-serif text-sm text-black/50">About a minute.</span> : null}
            </div>
            {error ? <p className="mt-4 font-serif text-sm text-red-800">{error}</p> : null}
          </section>

          <section className="sheet rotate-1 min-h-[32rem] px-7 py-6 text-black">
            <h3 className="mb-4 border-b-2 border-black pb-3 font-display text-3xl">Packet</h3>
            {!brief && !loading ? (
              <p className="pt-16 text-center font-serif text-black/45">Nothing on the desk yet.</p>
            ) : null}
            {loading ? (
              <ol className="space-y-3 font-serif text-sm text-black/70">
                <li>Gemini is reading the sheet</li>
                <li>Parallel: location</li>
                <li>Parallel: talent and other productions</li>
                <li>Parallel: music</li>
                <li>Writing the brief</li>
              </ol>
            ) : null}
            {!loading && steps.length ? (
              <p className="mb-4 text-xs text-black/40">{steps.map((s) => s.tool.replaceAll("_", " ")).join(" / ")}</p>
            ) : null}
            {brief ? (
              <div>
                <div className="flex items-start justify-between gap-4">
                  <h4 className="font-display text-3xl text-black">{brief.headline}</h4>
                  <div ref={stampRef} className={`rounded-full px-3 py-1 text-xs ring-1 ${stampClass}`}>
                    {verdictLabel(brief.verdict)}
                  </div>
                </div>
                <p className="mt-4 font-serif text-[15px] leading-7 text-black/80">{brief.summary}</p>
                <ul className="mt-6 space-y-3">
                  {brief.flags?.map((flag) => (
                    <li key={flag.title} className="border-l-2 border-black/40 pl-3">
                      <div className="text-[11px] uppercase tracking-widest text-black/50">
                        {flag.severity} · {flag.title}
                      </div>
                      <p className="mt-2 font-serif text-sm leading-6 text-black/80">{flag.detail}</p>
                    </li>
                  ))}
                </ul>
                <ul className="mt-6 space-y-1 text-sm">
                  {(brief.sources || []).slice(0, 8).map((src) => (
                    <li key={src.url}>
                      <a className="text-black underline underline-offset-4" href={src.url} target="_blank" rel="noreferrer">
                        {src.title || src.url}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        </div>
        </div>
      </section>
    </div>
  );
}
