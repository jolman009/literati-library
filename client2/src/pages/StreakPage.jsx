// src/pages/StreakPage.jsx
//
// Streak & Goals — the dedicated home for the streak mechanic. Recreated from
// the engagement-surfaces StreakScreen design, but wired to REAL data instead
// of the mock's seeded numbers:
//   • current streak  -> useGamification().stats.readingStreak
//   • today's minutes -> stats.todayReadingTime
//   • best streak     -> computed from readingSessionHistory (longest run)
//   • heatmap + week  -> per-day minutes aggregated from readingSessionHistory
//   • freezes         -> GET /api/gamification/streak-shields
//   • active goals    -> useGamification().goals
//   • "Log reading"   -> trackAction('daily_login') + xp/streak toasts (Step 2)
//
// Brand rule: violet (quest) is reserved for the hero + milestones; the heatmap
// uses the green activity scale (data-viz).
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Flame, Trophy, Snowflake, BookOpen, Check, TrendingUp, CalendarDays,
  Target, Milestone, CalendarCheck, CalendarHeart, Zap, Lock, CheckCircle2,
  BookMarked, Plus,
} from 'lucide-react';
import { useGamification } from '../contexts/GamificationContext';
import { useSnackbar } from '../components/Material3';
import { Skeleton, EmptyState } from '../components/ui/StateKit';
import ReadingHeatmap from '../components/analytics/ReadingHeatmap';
import API from '../config/api';

const DAILY = 30;     // daily reading-habit target (minutes)
const WEEKS = 18;     // heatmap span (weeks ending today)
const DAY_MS = 86400000;

const midnight = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime(); };

// Longest run of consecutive active days in the real session history.
function computeBestStreak(sessions) {
  const days = [...new Set(
    sessions.filter((s) => s.startTime && (s.duration || 0) > 0).map((s) => midnight(s.startTime))
  )].sort((a, b) => a - b);
  if (!days.length) return 0;
  let best = 1, cur = 1;
  for (let i = 1; i < days.length; i++) {
    if (days[i] - days[i - 1] === DAY_MS) { cur += 1; best = Math.max(best, cur); }
    else { cur = 1; }
  }
  return best;
}

const GOAL_META = {
  time:   { icon: CalendarCheck, tone: 'var(--sq-success)',                unit: 'min' },
  books:  { icon: BookMarked,    tone: 'var(--md-sys-color-primary)',      unit: 'books' },
  streak: { icon: Flame,         tone: 'var(--sq-warning)',                unit: 'days' },
  pages:  { icon: BookOpen,      tone: 'var(--md-sys-color-tertiary)',     unit: 'pages' },
};

export default function StreakPage() {
  const navigate = useNavigate();
  const { stats, goals, trackAction, refreshStats, loading } = useGamification();
  const toast = useSnackbar();

  const sessions = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('readingSessionHistory') || '[]'); }
    catch { return []; }
  }, []);

  const STREAK = stats?.readingStreak || 0;
  const bestStreak = useMemo(() => Math.max(computeBestStreak(sessions), STREAK), [sessions, STREAK]);
  const baseTodayMin = stats?.todayReadingTime || 0;

  const [logged, setLogged] = useState(false);
  const [freezes, setFreezes] = useState(0);
  const [maxFreezes, setMaxFreezes] = useState(3);

  useEffect(() => { setLogged(baseTodayMin >= DAILY); }, [baseTodayMin]);

  useEffect(() => {
    let alive = true;
    API.get('/api/gamification/streak-shields')
      .then((r) => { if (alive) { setFreezes(r.data?.shields ?? 0); setMaxFreezes(r.data?.max_shields ?? 3); } })
      .catch(() => { /* shields are optional chrome; ignore failures */ });
    return () => { alive = false; };
  }, []);

  const todayMin = logged ? Math.max(baseTodayMin, DAILY) : baseTodayMin;

  // Per-day minutes aggregated from the real session history.
  const dayMinutes = useMemo(() => {
    const map = new Map();
    sessions.forEach((s) => {
      if (!s.startTime) return;
      const key = midnight(s.startTime);
      map.set(key, (map.get(key) || 0) + (s.duration || 0));
    });
    return map;
  }, [sessions]);

  // Heatmap day cells (oldest -> today); today's value comes from live stats.
  const days = useMemo(() => {
    const out = [];
    const todayKey = midnight(new Date());
    for (let i = WEEKS * 7 - 1; i >= 0; i--) {
      const key = todayKey - i * DAY_MS;
      const isToday = i === 0;
      out.push({ key, date: new Date(key), min: isToday ? todayMin : (dayMinutes.get(key) || 0), isToday });
    }
    return out;
  }, [dayMinutes, todayMin]);

  const weekDays = days.slice(-7);
  const daysMet = weekDays.filter((d) => d.min >= DAILY).length;
  const weekTotal = weekDays.reduce((s, d) => s + d.min, 0);
  const weekGoal = DAILY * 7;

  const logToday = async () => {
    if (logged) return;
    setLogged(true); // optimistic
    try { await trackAction?.('daily_login'); } catch { /* non-fatal */ }
    toast.streak?.('Streak alive!', { detail: 'Daily reading logged' });
    setTimeout(() => toast.xp?.(10, 'Daily goal met'), 450);
    refreshStats?.();
  };

  if (loading) {
    return (
      <div style={pageWrap}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Skeleton h={150} r={22} />
          <Skeleton h={240} r={18} />
          <Skeleton h={180} r={18} />
        </div>
      </div>
    );
  }

  return (
    <div style={pageWrap}>
      <header style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: '-.02em', color: 'var(--md-sys-color-on-surface)' }}>Streak &amp; Goals</h1>
        <p style={{ margin: '6px 0 0', fontSize: 15, color: 'var(--md-sys-color-on-surface-variant)' }}>
          Your reading streak, activity, milestones, and active goals.
        </p>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* ===== Hero ===== */}
        <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 22, padding: '26px 28px', background: 'var(--sq-gradient-quest)', color: '#fff', boxShadow: 'var(--md-sys-elevation-level3)' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(540px 280px at 88% -30%, rgba(255,255,255,.22), transparent 60%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 26, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <div style={{ display: 'grid', placeItems: 'center', width: 84, height: 84, borderRadius: '50%', background: 'rgba(255,255,255,.16)', border: '1px solid rgba(255,255,255,.3)' }}>
                <Flame size={44} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontSize: 54, fontWeight: 800, lineHeight: 1, letterSpacing: '-.03em' }}>{STREAK}</span>
                  <span style={{ fontSize: 18, fontWeight: 700, opacity: .9 }}>day streak</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8, fontSize: 13.5, fontWeight: 600, opacity: .9 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Trophy size={15} /> Best {bestStreak} days</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Snowflake size={15} /> {freezes} freezes</span>
                </div>
              </div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16, minWidth: 280, padding: '14px 18px', borderRadius: 16, background: 'rgba(255,255,255,.14)', border: '1px solid rgba(255,255,255,.26)', backdropFilter: 'blur(8px)' }}>
              <Ring pct={Math.min(100, (todayMin / DAILY) * 100)} done={logged} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15.5, fontWeight: 800, lineHeight: 1.25 }}>{logged ? 'Goal met today' : 'Read today'}</div>
                <div style={{ fontSize: 12.5, opacity: .9, marginTop: 4 }}>{logged ? `${todayMin} of ${DAILY} min done` : `${todayMin} of ${DAILY} min · keep the streak`}</div>
                {!logged && (
                  <button type="button" onClick={logToday}
                    style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 9999, border: '1px solid rgba(255,255,255,.28)', background: 'rgba(255,255,255,.16)', color: '#fff', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', backdropFilter: 'blur(8px)' }}>
                    <BookOpen size={16} /> Log reading
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ===== Heatmap — the app's shared ReadingHeatmap, fed real sessions ===== */}
        <Section title="Reading activity" icon={CalendarDays}>
          <ReadingHeatmap readingSessions={sessions} />
        </Section>

        {/* ===== This week + milestones ===== */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, alignItems: 'stretch' }}>
          <Section title="This week" icon={TrendingUp} compact>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8, height: 132, marginTop: 4 }}>
              {weekDays.map((d) => {
                const met = d.min >= DAILY;
                const h = Math.max(6, Math.min(100, (d.min / (DAILY * 1.6)) * 100));
                return (
                  <div key={d.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, height: '100%', justifyContent: 'flex-end' }}>
                    <div title={`${d.min} min`} style={{ width: '70%', maxWidth: 26, height: `${h}%`, minHeight: 6, borderRadius: '7px 7px 3px 3px', background: d.min === 0 ? 'var(--md-sys-color-surface-container-highest)' : met ? 'var(--sq-success)' : 'color-mix(in srgb, var(--sq-success) 45%, var(--md-sys-color-surface-container-highest))' }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: d.isToday ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-on-surface-variant)' }}>{'SMTWTFS'[d.date.getDay()]}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--md-sys-color-outline-variant)' }}>
              <span style={{ fontSize: 13, color: 'var(--md-sys-color-on-surface-variant)' }}><b style={{ color: 'var(--md-sys-color-on-surface)' }}>{daysMet}/7</b> days met</span>
              <span style={{ fontSize: 13, color: 'var(--md-sys-color-on-surface-variant)' }}><b style={{ color: 'var(--md-sys-color-on-surface)' }}>{weekTotal}</b> / {weekGoal} min</span>
            </div>
          </Section>

          <Section title="Streak milestones" icon={Milestone} compact>
            <Milestones streak={STREAK} />
          </Section>
        </div>

        {/* ===== Active goals ===== */}
        <Section title="Active goals" icon={Target}>
          {goals && goals.length ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
              {goals.map((g) => {
                const meta = GOAL_META[g.type] || GOAL_META.time;
                const Icon = meta.icon;
                const pct = typeof g.progress === 'number'
                  ? Math.min(100, Math.max(0, g.progress))
                  : (g.target ? Math.min(100, (g.current / g.target) * 100) : 0);
                return (
                  <div key={g.id || g.title} style={{ padding: 18, borderRadius: 16, background: 'var(--md-sys-color-surface-container-low)', border: '1px solid var(--md-sys-color-outline-variant)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 13 }}>
                      <span style={{ display: 'grid', placeItems: 'center', width: 38, height: 38, borderRadius: 11, color: meta.tone, background: 'color-mix(in srgb, currentColor 16%, transparent)', flex: '0 0 auto' }}><Icon size={19} /></span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--md-sys-color-on-surface)' }}>{g.title}</div>
                        <div style={{ fontSize: 12.5, color: 'var(--md-sys-color-on-surface-variant)', marginTop: 1 }}>{g.current} / {g.target} {meta.unit}</div>
                      </div>
                    </div>
                    <div style={{ height: 9, borderRadius: 9999, background: 'var(--md-sys-color-surface-container-highest)', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', borderRadius: 9999, background: meta.tone, transition: 'width .8s ease' }} />
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: meta.tone, marginTop: 8 }}>{g.is_completed ? 'Completed' : `${Math.round(pct)}%`}</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              compact
              tone="neutral"
              icon={<Target />}
              title="No active goals"
              body="Set a reading goal to track progress here."
              primary={{ label: 'Set a goal', icon: <Plus size={18} />, onClick: () => navigate('/goals') }}
            />
          )}
        </Section>

        {/* ===== Freeze explainer ===== */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 22px', borderRadius: 16, background: 'color-mix(in srgb, var(--md-sys-color-primary) 9%, var(--md-sys-color-surface-container-low))', border: '1px solid var(--md-sys-color-outline-variant)' }}>
          <span style={{ display: 'grid', placeItems: 'center', width: 46, height: 46, borderRadius: 13, background: 'color-mix(in srgb, var(--sq-pacific-cyan) 20%, transparent)', color: 'var(--sq-pacific-cyan)', flex: '0 0 auto' }}><Snowflake size={24} /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--md-sys-color-on-surface)' }}>Streak freezes protect your progress</div>
            <div style={{ fontSize: 13.5, lineHeight: 1.5, color: 'var(--md-sys-color-on-surface-variant)', marginTop: 2 }}>
              Miss a day and a freeze is spent automatically — your streak survives. You have <b style={{ color: 'var(--md-sys-color-on-surface)' }}>{freezes} freezes</b>; earn one more every 7-day streak.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, flex: '0 0 auto' }}>
            {Array.from({ length: Math.max(0, freezes) }).map((_, i) => (
              <span key={i} style={{ display: 'grid', placeItems: 'center', width: 34, height: 34, borderRadius: 10, background: 'var(--md-sys-color-surface-container-high)', color: 'var(--sq-pacific-cyan)' }}><Snowflake size={17} /></span>
            ))}
            {freezes < maxFreezes && (
              <span style={{ display: 'grid', placeItems: 'center', width: 34, height: 34, borderRadius: 10, background: 'var(--md-sys-color-surface-container)', color: 'var(--md-sys-color-outline)', border: '1px dashed var(--md-sys-color-outline-variant)' }}><Plus size={16} /></span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const pageWrap = { maxWidth: 1040, margin: '0 auto', padding: '24px 16px', fontFamily: 'var(--sq-font-sans)' };

/* ---------- section wrapper ---------- */
function Section({ title, icon: Icon, right, children, compact }) {
  return (
    <section style={{ padding: compact ? 20 : 22, borderRadius: 18, background: 'var(--md-sys-color-surface-container-low)', border: '1px solid var(--md-sys-color-outline-variant)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 16 }}>
        <Icon size={18} color="var(--md-sys-color-primary)" />
        <h2 style={{ margin: 0, fontSize: 15.5, fontWeight: 800, color: 'var(--md-sys-color-on-surface)' }}>{title}</h2>
        {right && <div style={{ marginLeft: 'auto' }}>{right}</div>}
      </div>
      <div style={{ flex: 1 }}>{children}</div>
    </section>
  );
}

/* ---------- today ring ---------- */
function Ring({ pct, done }) {
  const r = 22, c = 2 * Math.PI * r;
  return (
    <div style={{ position: 'relative', width: 56, height: 56, flex: '0 0 auto' }}>
      <svg width="56" height="56" viewBox="0 0 56 56" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(255,255,255,.25)" strokeWidth="5" />
        <circle cx="28" cy="28" r={r} fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (c * Math.max(0, Math.min(100, pct))) / 100} style={{ transition: 'stroke-dashoffset .6s ease' }} />
      </svg>
      <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: '#fff' }}>
        {done ? <Check size={22} strokeWidth={2.4} /> : <BookOpen size={18} strokeWidth={2.4} />}
      </span>
    </div>
  );
}

/* ---------- milestone track (derived from real streak) ---------- */
function Milestones({ streak }) {
  const M = [
    { d: 3, label: 'Daily Reader', icon: CalendarCheck, tier: '#cd7f32' },
    { d: 7, label: 'Week Warrior', icon: CalendarDays, tier: '#9ca3af' },
    { d: 30, label: 'Monthly Master', icon: CalendarHeart, tier: '#eab308' },
    { d: 100, label: 'Century', icon: Zap, tier: '#7d8a99' },
    { d: 365, label: 'Unstoppable', icon: Flame, tier: '#22b8d8' },
  ];
  const next = M.find((m) => m.d > streak);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {next && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 12, background: 'color-mix(in srgb, var(--sq-violet) 12%, transparent)', border: '1px solid color-mix(in srgb, var(--sq-violet) 28%, transparent)' }}>
          <Target size={18} color="var(--sq-violet)" />
          <div style={{ fontSize: 13, color: 'var(--md-sys-color-on-surface)' }}><b>{next.d - streak} days</b> to <b>{next.label}</b></div>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {M.map((m) => {
          const done = streak >= m.d;
          const isNext = next && m.d === next.d;
          const Ic = done ? m.icon : Lock;
          return (
            <div key={m.d} style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: done || isNext ? 1 : .55 }}>
              <span style={{ display: 'grid', placeItems: 'center', width: 34, height: 34, borderRadius: 10, flex: '0 0 auto', background: done ? m.tier : 'var(--md-sys-color-surface-container-high)', color: done ? '#fff' : 'var(--md-sys-color-on-surface-variant)', outline: isNext ? '2px solid var(--sq-violet)' : 'none', outlineOffset: 1 }}>
                <Ic size={17} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--md-sys-color-on-surface)' }}>{m.label}</div>
                <div style={{ fontSize: 11.5, color: 'var(--md-sys-color-on-surface-variant)' }}>{m.d}-day streak</div>
              </div>
              {done
                ? <CheckCircle2 size={18} color="var(--sq-success)" />
                : <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--md-sys-color-on-surface-variant)' }}>{m.d}d</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
