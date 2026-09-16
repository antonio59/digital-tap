// Pure, deterministic render of the touchless-tap concept driven entirely by
// `timeMs`. Used live in the hero (rAF clock) and by scripts/capture-sim.mjs,
// which steps time frame-by-frame to render video clips.

const LOOP_MS = 13000
const STATIONS = ["Poplar", "Westferry", "Limehouse", "Shadwell", "Bank"]

type Phase = "approach" | "tapin" | "journey" | "tapout" | "receipt"

function phaseAt(t: number): Phase {
  if (t < 2500) return "approach"
  if (t < 4000) return "tapin"
  if (t < 9500) return "journey"
  if (t < 11000) return "tapout"
  return "receipt"
}

const STATUS: Record<Phase, { title: string; sub: string; tone: string }> = {
  approach: {
    title: "Arriving at Poplar",
    sub: "Beacon detected · no queue, no tap point",
    tone: "text-cyan-100",
  },
  tapin: {
    title: "Tapped in · Poplar",
    sub: "Confirmed instantly on your phone",
    tone: "text-green-300",
  },
  journey: {
    title: "Travelling to Bank",
    sub: "Sit back. Your journey is being tracked.",
    tone: "text-cyan-100",
  },
  tapout: {
    title: "Tapped out · Bank",
    sub: "Automatic. No reader needed.",
    tone: "text-green-300",
  },
  receipt: {
    title: "£2.80 charged",
    sub: "Correct fare every time. No forgotten tap-outs.",
    tone: "text-amber-200",
  },
}

function BeaconRings({ active }: { active: boolean }) {
  return (
    <span className="absolute -inset-2 flex items-center justify-center">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="absolute rounded-full border-2 border-cyan-300"
          style={{
            width: 18 + i * 14,
            height: 18 + i * 14,
            opacity: active ? 0.7 - i * 0.2 : 0.12,
            transition: "opacity 300ms",
          }}
        />
      ))}
    </span>
  )
}

export default function TapSimulation({ timeMs }: { timeMs: number }) {
  const t = ((timeMs % LOOP_MS) + LOOP_MS) % LOOP_MS
  const phase = phaseAt(t)
  const status = STATUS[phase]
  // Marker travels the rail during the journey phase; pinned at the ends.
  const journey = Math.min(Math.max((t - 4000) / 5500, 0), 1)
  const beaconAt = phase === "approach" || phase === "tapin" ? 0 : phase === "tapout" || phase === "receipt" ? STATIONS.length - 1 : -1

  return (
    <div
      id="tap-sim"
      className="relative w-[360px] rounded-2xl bg-slate-900/90 p-5 shadow-2xl ring-1 ring-white/15 backdrop-blur"
    >
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[10px] font-semibold tracking-widest text-cyan-300 uppercase">
          Digital Tap · simulation
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-slate-400">
          <span className="h-1.5 w-1.5 rounded-full bg-red-400" /> REC
        </span>
      </div>

      {/* Station rail */}
      <div className="relative mb-6 px-1 pt-1">
        <div className="h-1 rounded-full bg-slate-700" />
        <div
          className="absolute top-1 h-1 rounded-full bg-cyan-400 transition-none"
          style={{ width: `${journey * 100}%` }}
        />
        <div className="absolute -top-1 flex w-full justify-between">
          {STATIONS.map((name, i) => {
            const reached = i / (STATIONS.length - 1) <= journey
            const active = i === beaconAt
            return (
              <div key={name} className="relative flex flex-col items-center">
                <span
                  className={`h-3 w-3 rounded-full border-2 ${
                    active
                      ? "border-cyan-300 bg-cyan-400"
                      : reached
                        ? "border-cyan-400 bg-cyan-500"
                        : "border-slate-500 bg-slate-700"
                  }`}
                />
                {active && <BeaconRings active />}
                <span className="mt-2 text-[9px] text-slate-400">{name}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Status card */}
      <div className="rounded-xl bg-slate-800/80 p-4 ring-1 ring-white/10">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-10 w-10 items-center justify-center rounded-full text-lg ${
              phase === "tapin" || phase === "tapout"
                ? "bg-green-500/20"
                : phase === "receipt"
                  ? "bg-amber-500/20"
                  : "bg-cyan-500/20"
            }`}
          >
            {phase === "tapin" || phase === "tapout"
              ? "✓"
              : phase === "receipt"
                ? "£"
                : phase === "journey"
                  ? "→"
                  : "◉"}
          </span>
          <div>
            <p className={`text-sm font-bold ${status.tone}`}>{status.title}</p>
            <p className="text-[11px] text-slate-400">{status.sub}</p>
          </div>
        </div>
        {phase === "journey" && (
          <div className="mt-3 h-1 rounded-full bg-slate-700">
            <div
              className="h-1 rounded-full bg-cyan-400"
              style={{ width: `${journey * 100}%` }}
            />
          </div>
        )}
        {phase === "receipt" && (
          <div className="mt-3 rounded-lg bg-slate-900/70 p-2 text-center text-[10px] text-slate-400">
            Poplar → Bank · correct fare applied automatically
          </div>
        )}
      </div>
    </div>
  )
}
