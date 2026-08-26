import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Lock, Unlock, ShieldCheck, Calendar, Download, RotateCcw,
  Trophy, LogOut, Check, X, Save, PlusCircle, ArrowLeft,
  RefreshCw, AlertTriangle, Printer
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Config                                                              */
/* ------------------------------------------------------------------ */

const TITLE = "Datchworth Short Mat Bowls League";
const TEAM_COUNT_OPTIONS = [4, 8];
const DEFAULT_TEAM_COUNT = 8;
const DEFAULT_WEEKS = 14; // with 8 teams (4 rinks) or 4 teams (2 rinks), every team plays every week, so weeks = games per team
const WEEKDAY = 4; // Thursday (0=Sun..6=Sat)
const ADMIN_PASSWORD = "skip";
const STORAGE_KEY = "datchworth-short-mat-data";

// 8 teams need 4 concurrent games (two sessions on each of the club's 2 rinks);
// 4 teams only need 2 concurrent games, so just the 2 rinks, no Early/Late split.
function rinksForTeamCount(n) {
  return n === 4 ? ["1", "2"] : ["1E", "1L", "2E", "2L"];
}

// Display order for listing matches within the same week/date: 1E, 2E, 1L, 2L
// (early sessions on both rinks, then late sessions), rather than alphabetical.
const RINK_DISPLAY_ORDER = { "1E": 0, "2E": 1, "1L": 2, "2L": 3, "1": 0, "2": 1 };
function rinkSortValue(rink) {
  return RINK_DISPLAY_ORDER[rink] ?? 99;
}
function byRinkOrder(a, b) {
  return rinkSortValue(a.rink) - rinkSortValue(b.rink);
}
const CLUB_LOGO = "data:image/png;base64,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";

function defaultSeasonYear() {
  const now = new Date();
  // Season runs Oct-Mar and finishes at the end of March, so from April
  // onward we're already into the lead-up to the next season.
  return now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
}

function defaultTeams(count) {
  return Array.from({ length: count }, (_, i) => `Team ${i + 1}`);
}

function emptyData() {
  return {
    teamCount: DEFAULT_TEAM_COUNT,
    weeksSetting: DEFAULT_WEEKS,
    teams: defaultTeams(DEFAULT_TEAM_COUNT),
    matches: [],
    locked: false,
    calendar: { startYear: defaultSeasonYear(), excluded: [] },
    seasonYear: defaultSeasonYear(),
    autoBackup: false,
  };
}

function uid() {
  return "m" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function toIso(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDateLong(iso) {
  return new Date(iso + "T00:00:00").toLocaleDateString(undefined, {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });
}

// Every Thursday from 1 Oct startYear to the last day of March the following year.
function seasonCandidateDates(startYear) {
  const start = new Date(startYear, 9, 1);
  const end = new Date(startYear + 1, 3, 0); // day 0 of April = last day of March (handles leap years)
  const dates = [];
  const d = new Date(start);
  d.setDate(d.getDate() + ((WEEKDAY - d.getDay() + 7) % 7));
  while (d <= end) {
    dates.push(toIso(d));
    d.setDate(d.getDate() + 7);
  }
  return dates;
}

/* Standard circle-method round robin for 8 teams: 7 rounds of 4 pairs each.
   14 weeks = 2 full laps, so every team meets every other team home and away. */
function circleRounds(n) {
  const arr = [...Array(n).keys()];
  const m = arr.length;
  const fixed = arr[0];
  let rotating = arr.slice(1);
  const rounds = [];
  for (let r = 0; r < m - 1; r++) {
    const roundArr = [fixed, ...rotating];
    const pairs = [];
    for (let i = 0; i < m / 2; i++) pairs.push([roundArr[i], roundArr[m - 1 - i]]);
    rounds.push(pairs);
    rotating = [rotating[rotating.length - 1], ...rotating.slice(0, -1)];
  }
  return rounds;
}

function generateFixtures(teamCount, weeks) {
  const rinks = rinksForTeamCount(teamCount);
  const rounds = circleRounds(teamCount);
  const schedule = [];
  let lap = 0;
  while (schedule.length < weeks) {
    const lapRounds = rounds.map((r) => (lap % 2 === 1 ? r.map(([a, b]) => [b, a]) : r));
    const shuffledLap = shuffle(lapRounds);
    for (const roundPairs of shuffledLap) {
      if (schedule.length >= weeks) break;
      schedule.push(roundPairs);
    }
    lap++;
    if (lap > 20) break;
  }

  const matches = [];
  schedule.forEach((weekPairs, weekIdx) => {
    const rinkDraw = shuffle(rinks);
    weekPairs.forEach((pair, i) => {
      matches.push({
        id: uid(),
        week: weekIdx,
        home: pair[0],
        away: pair[1],
        rink: rinkDraw[i],
        date: "",
        homeScore: null,
        awayScore: null,
        played: false,
      });
    });
  });
  return matches;
}

function computeStandings(teams, matches) {
  const rows = teams.map((name, idx) => ({ idx, name, p: 0, w: 0, d: 0, l: 0, f: 0, a: 0, pts: 0 }));
  matches.forEach((m) => {
    if (!m.played) return;
    const h = rows[m.home], aw = rows[m.away];
    if (!h || !aw) return;
    h.p++; aw.p++;
    h.f += m.homeScore; h.a += m.awayScore;
    aw.f += m.awayScore; aw.a += m.homeScore;
    if (m.homeScore > m.awayScore) { h.w++; aw.l++; h.pts += 2; }
    else if (m.homeScore < m.awayScore) { aw.w++; h.l++; aw.pts += 2; }
    else { h.d++; aw.d++; h.pts += 1; aw.pts += 1; }
  });
  rows.forEach((r) => (r.diff = r.f - r.a));
  rows.sort((a, b) => b.pts - a.pts || b.diff - a.diff || b.f - a.f || a.name.localeCompare(b.name));
  return rows;
}

/* ------------------------------------------------------------------ */
/* Storage helpers                                                     */
/* ------------------------------------------------------------------ */

async function loadRemote() {
  try {
    const res = await window.storage.get(STORAGE_KEY, true);
    if (res && res.value) return JSON.parse(res.value);
  } catch (e) { /* not found or unavailable */ }
  return null;
}

async function saveRemote(data) {
  try {
    await window.storage.set(STORAGE_KEY, JSON.stringify(data), true);
    return true;
  } catch (e) { return false; }
}

async function saveBackup(data, label) {
  const ts = new Date().toISOString();
  await window.storage.set(`datchworth-backup-${ts}`, JSON.stringify(data), true);
  let index = [];
  try {
    const res = await window.storage.get("datchworth-backups-index", true);
    index = res ? JSON.parse(res.value) : [];
  } catch (e) { /* no index yet */ }
  const nextIndex = [{ ts, label: label || "" }, ...index].slice(0, 30);
  await window.storage.set("datchworth-backups-index", JSON.stringify(nextIndex), true);
  return ts;
}

/* ------------------------------------------------------------------ */
/* Small UI atoms                                                      */
/* ------------------------------------------------------------------ */

function RinkBadge({ r }) {
  return (
    <span className="inline-flex items-center justify-center gap-1 px-2 py-1 rounded-full bg-amber-600 text-white text-xs font-bold shrink-0">
      Rink {r ?? "-"}
    </span>
  );
}

function Toast({ message, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2600);
    return () => clearTimeout(t);
  }, [onDone]);
  if (!message) return null;
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-stone-900 text-amber-50 px-4 py-2 rounded-full shadow-lg text-sm z-50 flex items-center gap-2">
      <Check size={14} className="text-emerald-400" /> {message}
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="bg-white border border-dashed border-stone-300 rounded-lg p-10 text-center text-stone-500">
      {text}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Print view                                                          */
/* ------------------------------------------------------------------ */

function PrintableFixtures({ data }) {
  const startYear = data.calendar?.startYear ?? defaultSeasonYear();
  const seasonLabel = `${startYear}/${String(startYear + 1).slice(-2)}`;
  const weeks = {};
  data.matches.forEach((m) => {
    weeks[m.week] = weeks[m.week] || [];
    weeks[m.week].push(m);
  });
  const weekNums = Object.keys(weeks).map(Number).sort((a, b) => a - b);
  const fullDate = (iso) => (iso ? formatDateLong(iso) : "TBC");

  return (
    <div className="print-sheet fixtures-spacious">
      <style>{`
        @media print { @page { margin: 1.4cm; } tr { break-inside: avoid; } thead { display: table-header-group; } }
        .fixtures-spacious { padding: 10pt 6pt; }
        .fixtures-full-table { width: 100%; border-collapse: collapse; font-size: 11pt; line-height: 1.35; }
        .fixtures-full-table th { text-align: left; border-bottom: 1.5pt solid #222; padding: 4pt 8pt; font-size: 11pt; }
        .fixtures-full-table td { padding: 3pt 8pt; border-bottom: 0.5pt solid #ddd; white-space: nowrap; }
      `}</style>
      <div style={{ display: "flex", alignItems: "center", gap: "12pt", marginBottom: "10pt" }}>
        <img src={CLUB_LOGO} alt="Club crest" style={{ height: "34pt", width: "auto" }} />
        <div>
          <div style={{ fontFamily: "serif", fontWeight: "bold", fontSize: "20pt" }}>{TITLE}</div>
          <div style={{ fontFamily: "serif", fontSize: "14pt" }}>{seasonLabel} season</div>
          <div style={{ fontSize: "9pt", color: "#555", marginTop: "2pt" }}>Teams: {data.teams.join(", ")}</div>
        </div>
      </div>
      <table className="fixtures-full-table">
        <thead>
          <tr><th>Wk</th><th>Date</th><th>Rink</th><th>Home</th><th>Away</th><th>Score</th></tr>
        </thead>
        <tbody>
          {weekNums.map((w) =>
            [...weeks[w]].sort(byRinkOrder).map((m, i) => (
              <tr key={m.id}>
                <td>{i === 0 ? w + 1 : ""}</td>
                <td>{fullDate(m.date)}</td>
                <td>{m.rink}</td>
                <td>{data.teams[m.home]}</td>
                <td>{data.teams[m.away]}</td>
                <td>{m.played ? `${m.homeScore} - ${m.awayScore}` : ""}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

/* One page per team — just their own fixtures, with a blank score line so it
   can be handed out before the season starts and filled in as games are played. */
/* Current league table on a single A4 sheet. */
function PrintableStandings({ data }) {
  const startYear = data.calendar?.startYear ?? defaultSeasonYear();
  const seasonLabel = `${startYear}/${String(startYear + 1).slice(-2)}`;
  const rows = computeStandings(data.teams, data.matches);

  return (
    <div className="print-sheet fixtures-standings-page">
      <style>{`
        @media print { @page { margin: 1.6cm; } }
        .fixtures-standings-page { padding: 10pt 6pt; }
        .fixtures-standings-page table { width: 100%; border-collapse: collapse; font-size: 14pt; margin-top: 16pt; }
        .fixtures-standings-page th { text-align: left; border-bottom: 2pt solid #222; padding: 6pt 8pt; font-size: 13pt; }
        .fixtures-standings-page td { padding: 7pt 8pt; border-bottom: 0.75pt solid #ddd; }
        .fixtures-standings-page th.num, .fixtures-standings-page td.num { text-align: center; }
      `}</style>
      <div style={{ display: "flex", alignItems: "center", gap: "12pt" }}>
        <img src={CLUB_LOGO} alt="Club crest" style={{ height: "34pt", width: "auto" }} />
        <div>
          <div style={{ fontFamily: "serif", fontWeight: "bold", fontSize: "20pt" }}>{TITLE}</div>
          <div style={{ fontFamily: "serif", fontSize: "13pt" }}>{seasonLabel} season &mdash; current league positions</div>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th className="num">#</th>
            <th>Team</th>
            <th className="num">P</th><th className="num">W</th><th className="num">D</th><th className="num">L</th>
            <th className="num">F</th><th className="num">A</th><th className="num">Diff</th><th className="num">Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.idx}>
              <td className="num">{i + 1}</td>
              <td>{r.name}</td>
              <td className="num">{r.p}</td><td className="num">{r.w}</td><td className="num">{r.d}</td><td className="num">{r.l}</td>
              <td className="num">{r.f}</td><td className="num">{r.a}</td>
              <td className="num">{r.diff > 0 ? `+${r.diff}` : r.diff}</td>
              <td className="num" style={{ fontWeight: "bold" }}>{r.pts}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ fontSize: "9pt", color: "#777", marginTop: "16pt" }}>
        Printed {new Date().toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
      </p>
    </div>
  );
}

function PrintablePlayerCards({ data }) {
  const shortDate = (iso) =>
    iso ? new Date(iso + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" }) : "TBC";

  const CARDS_PER_PAGE = 2;
  const pages = [];
  const teamOffset = [];
  for (let i = 0; i < data.teams.length; i += CARDS_PER_PAGE) {
    pages.push(data.teams.slice(i, i + CARDS_PER_PAGE));
    teamOffset.push(i);
  }

  return (
    <div>
      <style>{`
        @media print { @page { margin: 1cm; } }
        .fixtures-cards-page { padding: 12pt; }
        .cards-header { display: flex; align-items: center; gap: 18pt; margin-bottom: 18pt; }
        .cards-grid { display: grid; grid-template-columns: repeat(2, 1fr); grid-template-rows: repeat(1, 1fr); gap: 22pt; }
        .player-card { border: 1pt solid #999; border-radius: 8pt; padding: 19pt 22pt; display: flex; flex-direction: column; min-width: 0; }
        .player-card .team-name { font-weight: bold; font-size: 34pt; margin-bottom: 11pt; border-bottom: 2.5pt solid #222; padding-bottom: 6pt; }
        .player-card table { width: 100%; border-collapse: collapse; font-size: 20pt; line-height: 1.38; }
        .player-card th { text-align: left; border-bottom: 2pt solid #222; padding: 4pt 8pt; font-size: 20pt; }
        .player-card td { padding: 4pt 8pt; border-bottom: 0.75pt solid #ddd; white-space: nowrap; }
      `}</style>
      {pages.map((pageTeams, pageIdx) => (
        <div
          key={pageIdx}
          className="print-sheet fixtures-cards-page"
          style={pageIdx > 0 ? { pageBreakBefore: "always" } : undefined}
        >
          <div className="cards-header">
            <img src={CLUB_LOGO} alt="Club crest" style={{ height: "43pt", width: "auto" }} />
            <div>
              <div style={{ fontFamily: "serif", fontWeight: "bold", fontSize: "26pt" }}>{TITLE}</div>
              <div style={{ fontSize: "16pt", color: "#555" }}>Season fixtures &mdash; one card per team</div>
            </div>
          </div>
          <div className="cards-grid">
            {pageTeams.map((teamName, i) => {
              const teamIdx = teamOffset[pageIdx] + i;
              const ownMatches = data.matches
                .filter((m) => m.home === teamIdx || m.away === teamIdx)
                .sort((a, b) => a.week - b.week);
              return (
                <div key={teamIdx} className="player-card">
                  <div className="team-name">{teamName}</div>
                  <table>
                    <thead>
                      <tr><th>Date</th><th>Rk</th><th>Opponent</th></tr>
                    </thead>
                    <tbody>
                      {ownMatches.map((m) => {
                        const isHome = m.home === teamIdx;
                        const opponent = data.teams[isHome ? m.away : m.home];
                        return (
                          <tr key={m.id}>
                            <td>{shortDate(m.date)}</td>
                            <td>{m.rink}</td>
                            <td>v {opponent}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main App                                                             */
/* ------------------------------------------------------------------ */

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("public");
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState("");
  const [toast, setToast] = useState("");
  const [printMode, setPrintMode] = useState(null); // null | "season" | "cards"
  const dataRef = useRef(null);
  const editingRef = useRef(false);

  const flash = (msg) => setToast(msg);

  useEffect(() => {
    (async () => {
      let remote = await loadRemote();
      if (!remote) {
        remote = emptyData();
        await saveRemote(remote);
      }
      dataRef.current = remote;
      setData(remote);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (editingRef.current) return;
      const remote = await loadRemote();
      if (remote && JSON.stringify(remote) !== JSON.stringify(dataRef.current)) {
        dataRef.current = remote;
        setData(remote);
      }
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  const persist = useCallback(async (next) => {
    dataRef.current = next;
    setData(next);
    await saveRemote(next);
  }, []);

  useEffect(() => {
    if (!printMode) return;
    const t = setTimeout(() => window.print(), 80);
    const handleAfterPrint = () => setPrintMode(null);
    window.addEventListener("afterprint", handleAfterPrint);
    return () => { clearTimeout(t); window.removeEventListener("afterprint", handleAfterPrint); };
  }, [printMode]);

  if (loading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-900 text-amber-50 font-serif">
        <div className="flex items-center gap-3">
          <RefreshCw className="animate-spin" size={20} /> Loading the club board…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans">
      <style>{`
        @media print { #app-screen-ui { display: none !important; } .print-sheet { display: block !important; } }
        .print-sheet { display: none; }
      `}</style>
      <div id="app-screen-ui">
        <Masthead
          view={view}
          setView={setView}
          data={data}
          onLogout={() => { setView("public"); setPwInput(""); setPwError(""); }}
        />

        {view === "public" && <PublicView data={data} onPrint={() => setPrintMode("season")} />}

        {view === "admin-login" && (
          <LoginScreen
            pwInput={pwInput}
            setPwInput={setPwInput}
            pwError={pwError}
            onBack={() => { setView("public"); setPwInput(""); setPwError(""); }}
            onSubmit={() => {
              if (pwInput === ADMIN_PASSWORD) {
                setView("admin");
                setPwInput(""); setPwError("");
              } else {
                setPwError("That password doesn't match. Try again.");
              }
            }}
          />
        )}

        {view === "admin" && (
          <AdminPanel
            data={data}
            persist={persist}
            flash={flash}
            editingRef={editingRef}
            onPrint={() => setPrintMode("season")}
            onPrintCards={() => setPrintMode("cards")}
            onPrintStandings={() => setPrintMode("standings")}
          />
        )}

        {view === "leader" && (
          <ResultsEntry data={data} persist={persist} flash={flash} canUnlock={false} editingRef={editingRef} />
        )}

        <Toast message={toast} onDone={() => setToast("")} />
        <footer className="text-center text-xs text-stone-400 py-8">{TITLE}</footer>
      </div>

      {printMode === "season" && <PrintableFixtures data={data} />}
      {printMode === "cards" && <PrintablePlayerCards data={data} />}
      {printMode === "standings" && <PrintableStandings data={data} />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Masthead                                                             */
/* ------------------------------------------------------------------ */

function Masthead({ view, setView, onLogout, data }) {
  const loggedIn = view === "admin" || view === "leader";
  const startYear = data?.seasonYear ?? defaultSeasonYear();
  const seasonLabel = `${startYear}/${String(startYear + 1).slice(-2)}`;
  return (
    <header className="bg-emerald-900 text-amber-50 border-b-4 border-amber-600">
      <div className="max-w-4xl mx-auto px-4 py-5 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <img src={CLUB_LOGO} alt="Club crest" className="h-12 w-auto drop-shadow" />
          <div>
            <h1 className="font-serif text-2xl tracking-wide leading-none">{TITLE}</h1>
            <p className="text-amber-200 text-xs mt-1 tracking-widest uppercase">{seasonLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          {!loggedIn && (
            <>
              <button onClick={() => setView("leader")} className="px-3 py-1.5 rounded border border-amber-400 text-amber-100 hover:bg-emerald-800 transition">
                Team leader
              </button>
              <button onClick={() => setView("admin-login")} className="px-3 py-1.5 rounded bg-amber-600 text-emerald-950 font-medium hover:bg-amber-500 transition flex items-center gap-1">
                <ShieldCheck size={15} /> Admin
              </button>
            </>
          )}
          {loggedIn && (
            <button onClick={onLogout} className="px-3 py-1.5 rounded border border-amber-400 text-amber-100 hover:bg-emerald-800 transition flex items-center gap-1">
              <LogOut size={15} /> Sign out
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Public view                                                         */
/* ------------------------------------------------------------------ */

function PublicView({ data, onPrint }) {
  const standings = computeStandings(data.teams, data.matches);
  return (
    <main className="max-w-4xl mx-auto px-4 pt-8 pb-16">
      {data.matches.length === 0 ? (
        <EmptyState text="Fixtures haven't been published yet. Check back once the admin sets things up." />
      ) : (
        <div className="grid md:grid-cols-2 gap-8">
          <section>
            <h2 className="font-serif text-lg text-emerald-900 mb-3 flex items-center gap-2">
              <Trophy size={16} className="text-amber-600" /> League table
            </h2>
            <StandingsTable rows={standings} />
          </section>
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-serif text-lg text-emerald-900 flex items-center gap-2">
                <Calendar size={16} className="text-amber-600" /> Fixtures &amp; results
              </h2>
              <button onClick={onPrint} className="text-xs px-2.5 py-1.5 rounded border border-stone-300 text-stone-600 hover:bg-stone-100 flex items-center gap-1">
                <Printer size={13} /> Print
              </button>
            </div>
            <FixturesList data={data} />
          </section>
        </div>
      )}
    </main>
  );
}

function StandingsTable({ rows }) {
  if (rows.length === 0) return <EmptyState text="No teams entered yet." />;
  return (
    <div className="overflow-x-auto bg-white rounded-lg border border-stone-200 shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-emerald-900 text-amber-50 font-serif">
            <th className="text-left py-2 px-2">#</th>
            <th className="text-left py-2 px-2">Team</th>
            <th className="px-2">P</th><th className="px-2">W</th><th className="px-2">D</th><th className="px-2">L</th>
            <th className="px-2">F</th><th className="px-2">A</th><th className="px-2">Diff</th><th className="px-2 font-bold">Pts</th>
          </tr>
        </thead>
        <tbody className="font-mono">
          {rows.map((r, i) => (
            <tr key={r.idx} className={i % 2 === 0 ? "bg-stone-50" : "bg-white"}>
              <td className="py-1.5 px-2 text-stone-500">{i + 1}</td>
              <td className="py-1.5 px-2 font-sans font-medium text-stone-800">{r.name}</td>
              <td className="px-2 text-center">{r.p}</td><td className="px-2 text-center">{r.w}</td>
              <td className="px-2 text-center">{r.d}</td><td className="px-2 text-center">{r.l}</td>
              <td className="px-2 text-center">{r.f}</td><td className="px-2 text-center">{r.a}</td>
              <td className="px-2 text-center">{r.diff > 0 ? `+${r.diff}` : r.diff}</td>
              <td className="px-2 text-center font-bold text-emerald-800">{r.pts}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FixturesList({ data, onScoreClick }) {
  if (data.matches.length === 0) return <EmptyState text="Fixtures haven't been generated yet." />;
  const weeks = {};
  data.matches.forEach((m) => { weeks[m.week] = weeks[m.week] || []; weeks[m.week].push(m); });
  const weekNums = Object.keys(weeks).map(Number).sort((a, b) => a - b);
  return (
    <div className="space-y-4 max-h-[32rem] overflow-y-auto pr-1">
      {weekNums.map((w) => (
        <div key={w} className="bg-white rounded-lg border border-stone-200 shadow-sm">
          <div className="bg-stone-100 px-3 py-1.5 rounded-t-lg text-xs font-serif text-stone-600 flex justify-between">
            <span>Week {w + 1}</span>
            <span>{weeks[w][0].date ? new Date(weeks[w][0].date).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "Date TBC"}</span>
          </div>
          <ul className="divide-y divide-stone-100">
            {[...weeks[w]].sort(byRinkOrder).map((m) => (
              <li key={m.id} className={`px-3 py-2 flex items-center justify-between text-sm ${onScoreClick ? "cursor-pointer hover:bg-amber-50" : ""}`} onClick={() => onScoreClick && onScoreClick(m)}>
                <div className="flex items-center gap-2 min-w-0">
                  <RinkBadge r={m.rink} />
                  <span className="truncate">
                    <span className={m.played && m.homeScore > m.awayScore ? "font-semibold text-emerald-800" : ""}>{data.teams[m.home]}</span>
                    {" "}v{" "}
                    <span className={m.played && m.awayScore > m.homeScore ? "font-semibold text-emerald-800" : ""}>{data.teams[m.away]}</span>
                  </span>
                </div>
                <span className="font-mono text-stone-600 shrink-0 ml-2">{m.played ? `${m.homeScore} - ${m.awayScore}` : "vs"}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Login                                                               */
/* ------------------------------------------------------------------ */

function LoginScreen({ pwInput, setPwInput, pwError, onSubmit, onBack }) {
  return (
    <main className="max-w-sm mx-auto px-4 pt-16">
      <button onClick={onBack} className="text-sm text-emerald-800 flex items-center gap-1 mb-6 hover:underline">
        <ArrowLeft size={14} /> Back
      </button>
      <div className="bg-white border border-stone-200 rounded-lg p-6 shadow-sm">
        <h2 className="font-serif text-xl text-emerald-900 mb-1 flex items-center gap-2">
          <ShieldCheck size={18} className="text-amber-600" />
          Admin sign in
        </h2>
        <p className="text-sm text-stone-500 mb-4">Set up teams and fixtures.</p>
        <div>
          <label className="text-xs uppercase tracking-wide text-stone-400">Password</label>
          <input
            type="password"
            autoFocus
            value={pwInput}
            onChange={(e) => setPwInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onSubmit(); } }}
            className="w-full mt-1 mb-3 border border-stone-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          {pwError && <p className="text-red-600 text-xs mb-3">{pwError}</p>}
          <button type="button" onClick={onSubmit} className="w-full bg-emerald-800 text-white rounded py-2 font-medium hover:bg-emerald-900 transition">
            Sign in
          </button>
        </div>
      </div>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/* Results entry (shared by admin + team leaders)                      */
/* ------------------------------------------------------------------ */

function ResultsEntry({ data, persist, flash, canUnlock, editingRef }) {
  const [dateFilter, setDateFilter] = useState("");
  const [drafts, setDrafts] = useState({});

  if (data.matches.length === 0) {
    return (
      <main className="max-w-4xl mx-auto px-4 pt-8 pb-16">
        <EmptyState text="Fixtures haven't been generated yet — ask the admin to add teams and generate them first." />
      </main>
    );
  }

  const relevantMatches = dateFilter ? data.matches.filter((m) => m.date === dateFilter) : data.matches;

  const saveScore = async (match, homeScore, awayScore) => {
    if (data.locked) { flash("Results are locked — ask the admin to unlock."); return; }
    if (homeScore === "" || awayScore === "" || isNaN(homeScore) || isNaN(awayScore)) {
      flash("Enter a score for both teams."); return;
    }
    editingRef.current = true;
    const next = structuredClone(data);
    const m = next.matches.find((x) => x.id === match.id);
    m.homeScore = Number(homeScore); m.awayScore = Number(awayScore); m.played = true;
    await persist(next);
    editingRef.current = false;
    flash("Score saved");
  };

  const setDate = async (match, dateStr) => {
    editingRef.current = true;
    const next = structuredClone(data);
    next.matches.find((x) => x.id === match.id).date = dateStr;
    await persist(next);
    editingRef.current = false;
  };

  const toggleLock = async () => {
    const next = structuredClone(data);
    next.locked = !next.locked;
    await persist(next);
    flash(next.locked ? "Results locked" : "Results unlocked");
  };

  return (
    <main className="max-w-4xl mx-auto px-4 pt-8 pb-16">
      {data.locked && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded px-3 py-2 flex items-center gap-2">
          <Lock size={14} /> Results are locked.
          {canUnlock && <button onClick={toggleLock} className="ml-auto underline">Unlock</button>}
        </div>
      )}

      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => setDateFilter(toIso(new Date()))} className="text-sm px-3 py-2 rounded border border-amber-500 text-amber-800 bg-amber-50 hover:bg-amber-100 font-medium shrink-0">
          Today
        </button>
        <div className="relative flex-1 max-w-xs">
          <Calendar size={15} className="absolute left-2.5 top-2.5 text-stone-400" />
          <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="w-full pl-8 pr-3 py-2 border border-stone-300 rounded focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm" />
        </div>
        {canUnlock && (
          <button onClick={toggleLock} className="ml-auto text-sm px-3 py-2 rounded border border-stone-300 hover:bg-stone-100 flex items-center gap-1">
            {data.locked ? <Unlock size={14} /> : <Lock size={14} />}
            {data.locked ? "Unlock" : "Lock"}
          </button>
        )}
      </div>

      {dateFilter && (
        <div className="mb-4 flex items-center gap-2 text-sm">
          <Calendar size={14} className="text-emerald-800" />
          <span className="font-medium">{formatDateLong(dateFilter)}</span>
          <button onClick={() => setDateFilter("")} className="text-stone-400 hover:text-stone-700 flex items-center gap-0.5">
            <X size={13} /> clear
          </button>
        </div>
      )}

      <div className="space-y-2">
        {relevantMatches.length === 0 && <EmptyState text="No fixtures to show." />}
        {[...relevantMatches].sort((a, b) => a.week - b.week || byRinkOrder(a, b)).map((m) => {
          const draft = drafts[m.id] || { homeScore: m.homeScore ?? "", awayScore: m.awayScore ?? "" };
          return (
            <div key={m.id} className="bg-white border border-stone-200 rounded-lg px-4 py-3 flex flex-wrap items-center gap-3 text-sm">
              <RinkBadge r={m.rink} />
              <span className="text-stone-400 font-mono text-xs w-16">Wk {m.week + 1}</span>
              <input type="date" value={m.date || ""} onChange={(e) => setDate(m, e.target.value)} disabled={data.locked} className="border border-stone-300 rounded px-2 py-1 text-xs disabled:bg-stone-100" />
              <span className="flex-1 min-w-[10rem] font-medium">{data.teams[m.home]}</span>
              <input type="number" disabled={data.locked} value={draft.homeScore} onChange={(e) => setDrafts({ ...drafts, [m.id]: { ...draft, homeScore: e.target.value } })} className="w-16 border border-stone-300 rounded px-2 py-1 text-center disabled:bg-stone-100" />
              <span className="text-stone-400">v</span>
              <input type="number" disabled={data.locked} value={draft.awayScore} onChange={(e) => setDrafts({ ...drafts, [m.id]: { ...draft, awayScore: e.target.value } })} className="w-16 border border-stone-300 rounded px-2 py-1 text-center disabled:bg-stone-100" />
              <span className="flex-1 min-w-[10rem] font-medium text-right">{data.teams[m.away]}</span>
              <button disabled={data.locked} onClick={() => saveScore(m, draft.homeScore, draft.awayScore)} className="bg-emerald-800 text-white rounded px-3 py-1.5 text-xs font-medium hover:bg-emerald-900 disabled:opacity-40 flex items-center gap-1">
                <Save size={13} /> Save
              </button>
              {m.played && <Check size={16} className="text-emerald-600" />}
            </div>
          );
        })}
      </div>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/* Admin panel                                                         */
/* ------------------------------------------------------------------ */

function AdminPanel({ data, persist, flash, editingRef, onPrint, onPrintCards, onPrintStandings }) {
  const [tab, setTab] = useState("setup");
  const seasonYear = data.seasonYear ?? defaultSeasonYear();
  const setSeasonYear = async (year) => { await persist({ ...data, seasonYear: year }); };

  return (
    <main className="max-w-4xl mx-auto px-4 pt-8 pb-16">
      <div className="flex items-center gap-1 mb-6 border-b border-stone-200 flex-wrap">
        {[["setup", "Team setup"], ["results", "Enter results"], ["backups", "Backups"], ["reset", "New season"]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${tab === key ? "border-amber-600 text-emerald-900" : "border-transparent text-stone-500 hover:text-emerald-800"}`}>
            {label}
          </button>
        ))}
        <div className="ml-auto mb-1.5 flex items-center gap-3">
          <label className="text-xs text-stone-500 flex items-center gap-1.5">
            Season year
            <input type="number" value={seasonYear} onChange={(e) => setSeasonYear(Number(e.target.value))} className="w-20 border border-stone-300 rounded px-2 py-1 text-xs" />
          </label>
          <button onClick={onPrintStandings} className="text-xs px-2.5 py-1.5 rounded border border-stone-300 text-stone-600 hover:bg-stone-100 flex items-center gap-1">
            <Printer size={13} /> Print positions
          </button>
          <button onClick={onPrintCards} className="text-xs px-2.5 py-1.5 rounded border border-stone-300 text-stone-600 hover:bg-stone-100 flex items-center gap-1">
            <Printer size={13} /> Print player cards
          </button>
          <button onClick={onPrint} className="text-xs px-2.5 py-1.5 rounded border border-stone-300 text-stone-600 hover:bg-stone-100 flex items-center gap-1">
            <Printer size={13} /> Print fixtures
          </button>
        </div>
      </div>

      {tab === "setup" && <TeamSetup data={data} persist={persist} flash={flash} />}
      {tab === "results" && <ResultsEntry data={data} persist={persist} flash={flash} canUnlock={true} editingRef={editingRef} />}
      {tab === "backups" && <BackupsPanel data={data} persist={persist} flash={flash} />}
      {tab === "reset" && <ResetPanel data={data} persist={persist} flash={flash} />}
    </main>
  );
}

function TeamSetup({ data, persist, flash }) {
  const [nameDraft, setNameDraft] = useState(data.teams);
  useEffect(() => { setNameDraft(data.teams); }, [data.teams]);

  const teamCount = data.teamCount ?? DEFAULT_TEAM_COUNT;
  const weeksSetting = data.weeksSetting ?? DEFAULT_WEEKS;
  const rinks = rinksForTeamCount(teamCount);
  const matchesPerWeek = teamCount / 2;
  const roundsPerLap = teamCount - 1; // circle-method cycle length (one full "lap" = everyone plays everyone once)
  const evenCycle = roundsPerLap * 2; // a full home-and-away cycle (fixtures alternate orientation every lap)
  const balanced = weeksSetting % evenCycle === 0;

  const chooseTeamCount = async (n) => {
    if (data.matches.length > 0) {
      if (!window.confirm("Changing the format will clear existing teams and fixtures. Continue?")) return;
    }
    const next = structuredClone(data);
    next.teamCount = n;
    next.teams = defaultTeams(n);
    next.matches = [];
    next.locked = false;
    await persist(next);
    flash(`Format set to ${n} teams`);
  };

  const setWeeksSetting = async (n) => {
    await persist({ ...data, weeksSetting: n });
  };

  const saveNames = async () => {
    const next = structuredClone(data);
    next.teams = nameDraft.map((n, i) => n.trim() || `Team ${i + 1}`);
    await persist(next);
    flash("Team names saved");
  };

  const generate = async () => {
    if (data.matches.some((m) => m.played)) {
      if (!window.confirm("Some results have already been entered. Regenerating fixtures will remove all existing matches and scores. Continue?")) return;
    }
    if (!balanced) {
      if (!window.confirm(`${weeksSetting} weeks isn't a multiple of ${evenCycle}, so some teams will get an extra home or away game compared to others. Generate anyway?`)) return;
    }
    const next = structuredClone(data);
    next.matches = generateFixtures(teamCount, weeksSetting);
    next.locked = false;
    await persist(next);
    flash(`Fixtures generated: ${weeksSetting} weeks, ${next.matches.length} matches`);
  };

  const weekDates = {};
  data.matches.forEach((m) => { weekDates[m.week] = m.date; });
  const weekNums = Object.keys(weekDates).map(Number).sort((a, b) => a - b);
  const setWeekDate = async (weekNum, dateStr) => {
    const next = structuredClone(data);
    next.matches.forEach((m) => { if (m.week === weekNum) m.date = dateStr; });
    await persist(next);
  };

  const calendar = data.calendar || { startYear: defaultSeasonYear(), excluded: [] };
  const candidateDates = seasonCandidateDates(calendar.startYear);
  const includedCount = candidateDates.filter((d) => !calendar.excluded.includes(d)).length;
  const enoughTicked = weekNums.length > 0 && includedCount >= weekNums.length;

  const setStartYear = async (year) => { await persist({ ...data, calendar: { startYear: year, excluded: [] } }); };
  const toggleExcluded = async (iso) => {
    const next = structuredClone(data);
    next.calendar.excluded = next.calendar.excluded.includes(iso)
      ? next.calendar.excluded.filter((x) => x !== iso)
      : [...next.calendar.excluded, iso];
    await persist(next);
  };
  const applyCalendarDates = async () => {
    if (weekNums.length === 0) { flash("Generate fixtures first."); return; }
    const included = candidateDates.filter((d) => !calendar.excluded.includes(d)).sort();
    if (included.length < weekNums.length) {
      if (!window.confirm(`Only ${included.length} dates are ticked but the season needs ${weekNums.length} weeks. Apply what's available and leave the rest blank?`)) return;
    }
    const next = structuredClone(data);
    weekNums.forEach((w, i) => {
      if (!included[i]) return;
      next.matches.forEach((m) => { if (m.week === w) m.date = included[i]; });
    });
    await persist(next);
    flash(`Dates applied to ${Math.min(included.length, weekNums.length)} weeks`);
  };

  return (
    <div>
      <section className="mb-8">
        <h3 className="font-serif text-lg text-emerald-900 mb-2">League format</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {TEAM_COUNT_OPTIONS.map((n) => (
            <button
              key={n}
              onClick={() => chooseTeamCount(n)}
              className={`px-4 py-2 rounded border text-sm font-medium ${teamCount === n ? "bg-emerald-800 text-white border-emerald-800" : "bg-white border-stone-300 hover:border-emerald-600"}`}
            >
              {n} teams &middot; {n === 4 ? "2 rinks (1, 2)" : "4 rinks (1E/1L/2E/2L)"}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-stone-600">
          Season length (weeks)
          <input
            type="number"
            min={1}
            value={weeksSetting}
            onChange={(e) => setWeeksSetting(Math.max(1, Number(e.target.value) || 1))}
            className="w-20 border border-stone-300 rounded px-2 py-1 text-sm"
          />
        </label>
        <p className="text-xs text-stone-400 mt-1">
          With {teamCount} teams, {matchesPerWeek} matches run each week, and the fixture list repeats every {evenCycle} weeks
          (each team meeting every other team once at home and once away).
        </p>
        {!balanced && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-300 rounded px-3 py-2 mt-2 flex items-start gap-1.5">
            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
            {weeksSetting} weeks won't divide evenly &mdash; some teams will get an extra home or away game compared to
            others. For an equal split, use a multiple of {evenCycle} (e.g. {evenCycle}, {evenCycle * 2}, {evenCycle * 3}).
          </p>
        )}
      </section>

      <div className="grid md:grid-cols-2 gap-8">
        <section>
          <h3 className="font-serif text-lg text-emerald-900 mb-2">Team names ({teamCount} teams)</h3>
          <div className="space-y-2 mb-3">
            {nameDraft.map((name, i) => (
              <input key={i} value={name} onChange={(e) => { const copy = [...nameDraft]; copy[i] = e.target.value; setNameDraft(copy); }} className="w-full border border-stone-300 rounded px-3 py-1.5 text-sm" />
            ))}
          </div>
          <button onClick={saveNames} className="bg-emerald-800 text-white rounded px-4 py-2 text-sm font-medium hover:bg-emerald-900 flex items-center gap-1.5">
            <Save size={14} /> Save team names
          </button>
        </section>

        <section>
          <h3 className="font-serif text-lg text-emerald-900 mb-2">Fixtures</h3>
          <p className="text-sm text-stone-500 mb-3">
            Generates a {weeksSetting}-week season, {matchesPerWeek} matches on {rinks.length === 2 ? "rinks 1/2" : "rinks 1E/1L/2E/2L"} each week, drawn at random —
            every team plays every other team as evenly as the season length allows.
          </p>
          <button onClick={generate} className="bg-amber-600 text-emerald-950 rounded px-4 py-2 text-sm font-medium hover:bg-amber-500 flex items-center gap-1.5 mb-5">
            <PlusCircle size={15} /> {data.matches.length ? "Regenerate fixtures" : "Generate fixtures"}
          </button>

          {weekNums.length > 0 && (
            <>
              <h4 className="font-serif text-sm text-stone-600 mb-2">Fine-tune individual weeks</h4>
              <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                {weekNums.map((w) => (
                  <div key={w} className="flex items-center gap-2 text-sm">
                    <span className="w-16 text-stone-500">Week {w + 1}</span>
                    <input type="date" value={weekDates[w] || ""} onChange={(e) => setWeekDate(w, e.target.value)} className="border border-stone-300 rounded px-2 py-1 text-sm" />
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      <section className="mt-8">
        <h3 className="font-serif text-lg text-emerald-900 mb-2">Season calendar</h3>
        <p className="text-sm text-stone-500 mb-3">
          Every Thursday from October to March is ticked by default. Untick any dates the league won't be
          playing, then apply the remaining dates straight onto the fixture weeks in order.
        </p>
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <label className="text-sm text-stone-600">Season starting October</label>
          <input type="number" value={calendar.startYear} onChange={(e) => setStartYear(Number(e.target.value))} className="w-24 border border-stone-300 rounded px-2 py-1 text-sm" />
          <button
            onClick={applyCalendarDates}
            disabled={weekNums.length === 0}
            className={`ml-auto rounded px-4 py-2 text-sm font-medium disabled:opacity-40 flex items-center gap-1.5 transition ${enoughTicked ? "bg-amber-600 text-emerald-950 hover:bg-amber-500 ring-2 ring-amber-300" : "bg-emerald-800 text-white hover:bg-emerald-900"}`}
          >
            <Calendar size={14} /> Apply ticked dates to fixture weeks
          </button>
        </div>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 bg-white border border-stone-200 rounded-lg p-4 max-h-80 overflow-y-auto">
          {candidateDates.map((iso) => {
            const checked = !calendar.excluded.includes(iso);
            return (
              <label key={iso} className={`flex items-center gap-2 text-sm py-0.5 ${checked ? "text-stone-800" : "text-stone-400 line-through"}`}>
                <input type="checkbox" checked={checked} onChange={() => toggleExcluded(iso)} />
                {formatDateLong(iso)}
              </label>
            );
          })}
        </div>
        <p className={`text-xs mt-2 ${enoughTicked ? "text-emerald-700 font-medium" : "text-stone-400"}`}>
          {includedCount} dates ticked{weekNums.length > 0 ? ` \u00b7 ${weekNums.length} weeks needed` : ""}{enoughTicked && " \u00b7 ready to apply"}
        </p>
      </section>
    </div>
  );
}

function BackupsPanel({ data, persist, flash }) {
  const [backups, setBackups] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [restoring, setRestoring] = useState(null);

  const refreshList = async () => {
    setLoadingList(true);
    try {
      const res = await window.storage.get("datchworth-backups-index", true);
      setBackups(res ? JSON.parse(res.value) : []);
    } catch (e) { setBackups([]); }
    setLoadingList(false);
  };
  useEffect(() => { refreshList(); }, []);

  const createBackup = async () => {
    try { await saveBackup(data, "Manual backup"); await refreshList(); flash("Backup created"); }
    catch (e) { flash("Backup failed — try again"); }
  };

  const downloadCurrent = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `datchworth-short-mat-${toIso(new Date())}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const toggleAuto = async () => { await persist({ ...data, autoBackup: !data.autoBackup }); flash(!data.autoBackup ? "Automatic daily backups on" : "Automatic daily backups off"); };

  const restoreBackup = async (ts) => {
    try {
      const res = await window.storage.get(`datchworth-backup-${ts}`, true);
      if (!res) { flash("That backup could not be found"); return; }
      const snapshot = JSON.parse(res.value);
      await saveBackup(data, "Auto-saved before restore");
      await persist(snapshot);
      setRestoring(null);
      flash("Backup restored");
    } catch (e) { flash("Restore failed — try again"); }
  };

  return (
    <div className="max-w-xl">
      <h3 className="font-serif text-lg text-emerald-900 mb-2">Backups</h3>
      <p className="text-sm text-stone-500 mb-4">Any backup below can be restored, which replaces all current data with that snapshot.</p>
      <div className="flex flex-wrap gap-2 mb-5">
        <button onClick={createBackup} className="bg-emerald-800 text-white rounded px-4 py-2 text-sm font-medium hover:bg-emerald-900 flex items-center gap-1.5">
          <Save size={14} /> Create backup now
        </button>
        <button onClick={downloadCurrent} className="border border-stone-300 rounded px-4 py-2 text-sm font-medium hover:bg-stone-100 flex items-center gap-1.5">
          <Download size={14} /> Download current data
        </button>
        <label className="flex items-center gap-2 text-sm ml-auto">
          <input type="checkbox" checked={!!data.autoBackup} onChange={toggleAuto} /> Automatic daily backup
        </label>
      </div>
      <h4 className="font-serif text-sm text-stone-600 mb-2">Recent backups</h4>
      {loadingList ? <p className="text-sm text-stone-400">Loading…</p> : backups.length === 0 ? <p className="text-sm text-stone-400">No backups yet.</p> : (
        <ul className="text-sm divide-y divide-stone-200 bg-white border border-stone-200 rounded-lg">
          {backups.map((b) => (
            <li key={b.ts} className="px-3 py-2 flex items-center justify-between gap-3">
              <span className="text-stone-600">{new Date(b.ts).toLocaleString()}{b.label && <span className="text-stone-400"> &middot; {b.label}</span>}</span>
              {restoring === b.ts ? (
                <span className="flex items-center gap-2 shrink-0">
                  <span className="text-red-600 text-xs">Replace everything with this?</span>
                  <button onClick={() => restoreBackup(b.ts)} className="text-red-600 font-medium underline">Yes, restore</button>
                  <button onClick={() => setRestoring(null)} className="text-stone-400 underline">Cancel</button>
                </span>
              ) : (
                <button onClick={() => setRestoring(b.ts)} className="text-emerald-800 text-xs font-medium underline shrink-0">Restore this backup</button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ResetPanel({ data, persist, flash }) {
  const [confirming, setConfirming] = useState(false);
  const [understood, setUnderstood] = useState(false);
  const [phrase, setPhrase] = useState("");
  const [busy, setBusy] = useState(false);
  const [lastSnapshot, setLastSnapshot] = useState(null);
  const REQUIRED_PHRASE = "RESET SEASON";

  const openConfirm = () => { setConfirming(true); setUnderstood(false); setPhrase(""); };

  const doReset = async () => {
    setBusy(true);
    try {
      const backupTs = await saveBackup(data, "Automatic pre-reset safety backup");
      const next = {
        teamCount: DEFAULT_TEAM_COUNT,
        weeksSetting: DEFAULT_WEEKS,
        teams: defaultTeams(DEFAULT_TEAM_COUNT),
        matches: [],
        locked: false,
        calendar: { startYear: defaultSeasonYear(), excluded: [] },
        seasonYear: defaultSeasonYear(),
        autoBackup: data.autoBackup,
      };
      await persist(next);
      setLastSnapshot({ data: structuredClone(data), ts: backupTs });
      setConfirming(false);
      flash("Reset for the new season");
    } finally { setBusy(false); }
  };

  const undoReset = async () => {
    if (!lastSnapshot) return;
    await persist(lastSnapshot.data);
    setLastSnapshot(null);
    flash("Reset undone — last season's data is back");
  };

  const canConfirm = understood && phrase.trim().toUpperCase() === REQUIRED_PHRASE;

  return (
    <div className="max-w-xl">
      <h3 className="font-serif text-lg text-emerald-900 mb-2">Start a new season</h3>
      <p className="text-sm text-stone-500 mb-4">
        This clears every fixture, score and team name, unlocks results, resets the format back to 8 teams,
        and clears the season calendar &mdash; ready to set the format, teams and dates fresh for the new season.
      </p>

      {lastSnapshot && (
        <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center justify-between gap-3 text-sm">
          <span className="text-emerald-800">Just reset. You can put last season's data straight back if that was a mistake.</span>
          <button onClick={undoReset} className="shrink-0 bg-emerald-800 text-white rounded px-3 py-1.5 font-medium hover:bg-emerald-900">Undo reset</button>
        </div>
      )}

      {!confirming ? (
        <button onClick={openConfirm} className="bg-red-600 text-white rounded px-4 py-2 text-sm font-medium hover:bg-red-700 flex items-center gap-1.5">
          <RotateCcw size={14} /> Reset for next year
        </button>
      ) : (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
          <p className="text-sm text-red-700 flex items-center gap-2">
            <AlertTriangle size={15} /> This permanently removes all fixtures and scores. A safety backup is saved
            automatically first, and you'll get a one-click undo straight after &mdash; but please only continue if
            you're sure.
          </p>
          <label className="flex items-start gap-2 text-sm text-red-800">
            <input type="checkbox" checked={understood} onChange={(e) => setUnderstood(e.target.checked)} className="mt-0.5" />
            I understand this clears all fixtures and scores.
          </label>
          <div>
            <label className="block text-xs text-red-700 mb-1">Type <span className="font-mono font-bold">{REQUIRED_PHRASE}</span> to confirm</label>
            <input value={phrase} onChange={(e) => setPhrase(e.target.value)} className="w-full border border-red-300 rounded px-3 py-1.5 text-sm" placeholder={REQUIRED_PHRASE} />
          </div>
          <div className="flex gap-2">
            <button onClick={doReset} disabled={!canConfirm || busy} className="bg-red-600 text-white rounded px-4 py-2 text-sm font-medium hover:bg-red-700 disabled:opacity-40">
              {busy ? "Resetting…" : "Yes, reset everything"}
            </button>
            <button onClick={() => setConfirming(false)} className="border border-stone-300 rounded px-4 py-2 text-sm hover:bg-white">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
