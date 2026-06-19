// src/components/onboarding/SetupWizard.jsx
//
// First-run setup wizard — a focused 5-step flow that turns a fresh account
// into a personalized quest: name -> reading goal -> interests -> first book
// -> celebration. Recreated from the engagement-surfaces OnboardingScreen
// design using the app's MD3 tokens + lucide-react (no window.SQ kit).
//
// Pure UI: it collects state and calls onComplete(data) / onSkip(data).
// Persistence + first-run gating live in SetupWizardWrapper.
import React, { useState, useEffect } from 'react';
import {
  Sparkles, UserRound, Target, Heart, BookPlus, PartyPopper,
  ArrowLeft, ArrowRight, Rocket, Flame, Minus, Plus, CheckCircle2,
  BookOpen, Cross, Scroll, Sunrise, Feather, Quote, Compass, Atom,
  Brain, Sprout, Briefcase, Castle,
} from 'lucide-react';
import { MD3Button } from '../Material3';
import './SetupWizard.css';

const STEPS = ['welcome', 'goal', 'interests', 'firstbook', 'done'];

const GENRES = [
  ['Theology', Cross], ['Biography', UserRound], ['History', Scroll],
  ['Devotional', Sunrise], ['Fiction', Feather], ['Poetry', Quote],
  ['Leadership', Compass], ['Science', Atom], ['Philosophy', Brain],
  ['Self-Help', Sprout], ['Business', Briefcase], ['Fantasy', Castle],
];

const SUGGESTED = [
  ['Crowned With Glory and Honor', 'Michael A. Wilkinson', 'var(--sq-gradient-welcome)'],
  ["God's Prophetic Voice Today", 'Bill Hamon', 'linear-gradient(150deg,#0077b6,#00b4d8)'],
  ['The Four Pages of the Sermon', 'Paul Scott Wilson', 'linear-gradient(150deg,#1a8a5a,#7bd88f)'],
  ['Mere Christianity', 'C. S. Lewis', 'linear-gradient(150deg,#b4690e,#e8a33d)'],
];

export default function SetupWizard({ onComplete, onSkip, name = '', onStepView }) {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const go = (d) => { setDir(d); setStep((s) => Math.max(0, Math.min(STEPS.length - 1, s + d))); };

  // collected setup
  const [who, setWho] = useState(name);
  const [goal, setGoal] = useState(24);       // books / year
  const [minutes, setMinutes] = useState(20);  // daily streak target
  const [genres, setGenres] = useState([]);
  const [picked, setPicked] = useState(null);  // first-book title

  useEffect(() => { onStepView?.(step); }, [step, onStepView]);

  const toggleGenre = (g) => setGenres((gs) => (gs.includes(g) ? gs.filter((x) => x !== g) : [...gs, g]));
  const pct = (step / (STEPS.length - 1)) * 100;
  const canContinue = step === 0 ? who.trim().length > 0 : step === 2 ? genres.length > 0 : true;
  const collected = { name: who.trim(), goal, minutes, genres, firstBook: picked };

  /* ---- step bodies ---- */
  const Welcome = (
    <Step key="welcome" dir={dir} icon={Sparkles} tone="quest" eyebrow="Welcome to ShelfQuest"
      title="Let's set up your quest" body="A minute now tailors your library, goals, and recommendations. You can change any of it later.">
      <div style={{ maxWidth: 360, margin: '0 auto', width: '100%', textAlign: 'left' }}>
        <label htmlFor="setup-name" style={{ fontSize: 13, fontWeight: 600, color: 'var(--md-sys-color-on-surface-variant)', display: 'block', marginBottom: 5 }}>
          What should we call you?
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid var(--md-sys-color-outline)', borderRadius: 12, padding: '0 14px', height: 48, background: 'var(--md-sys-color-surface-container-lowest)' }}>
          <UserRound size={18} color="var(--md-sys-color-on-surface-variant)" />
          <input id="setup-name" value={who} onChange={(e) => setWho(e.target.value)} placeholder="Your name"
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: 15, color: 'var(--md-sys-color-on-surface)', minWidth: 0 }} />
        </div>
      </div>
    </Step>
  );

  const Goal = (
    <Step key="goal" dir={dir} icon={Target} tone="quest" eyebrow="Your reading goal"
      title="How far do you want to go?" body="Set a yearly target and a daily habit. We'll track your streak and cheer you on.">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 420, margin: '0 auto', width: '100%' }}>
        <Stepper label="Books this year" value={goal} setValue={setGoal} min={4} max={120} step={4} suffix="books" icon={BookOpen} />
        <Stepper label="Daily reading habit" value={minutes} setValue={setMinutes} min={5} max={120} step={5} suffix="min / day" icon={Flame} accent="var(--md-sys-color-error)" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderRadius: 14, background: 'color-mix(in srgb, var(--sq-violet) 14%, transparent)', border: '1px solid color-mix(in srgb, var(--sq-violet) 30%, transparent)' }}>
          <Flame size={20} color="var(--sq-violet)" />
          <div style={{ fontSize: 13.5, lineHeight: 1.45, color: 'var(--md-sys-color-on-surface)' }}>
            That's about <b>{Math.round(goal / 12)} books a month</b> — read <b>{minutes} min/day</b> to keep your streak alive.
          </div>
        </div>
      </div>
    </Step>
  );

  const Interests = (
    <Step key="interests" dir={dir} icon={Heart} tone="brand" eyebrow="Your interests"
      title="What do you love to read?" body="Pick a few — your dashboard and mentor recommendations adapt to these.">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', maxWidth: 520, margin: '0 auto' }}>
        {GENRES.map(([g, Ic]) => {
          const on = genres.includes(g);
          return (
            <button key={g} type="button" onClick={() => toggleGenre(g)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 14px', borderRadius: 9999, cursor: 'pointer',
                border: on ? 'none' : '1px solid var(--md-sys-color-outline-variant)',
                background: on ? 'var(--md-sys-color-secondary-container)' : 'var(--md-sys-color-surface-container-low)',
                color: on ? 'var(--md-sys-color-on-secondary-container)' : 'var(--md-sys-color-on-surface)',
                fontFamily: 'inherit', fontSize: 14, fontWeight: 600 }}>
              <Ic size={15} />{g}
            </button>
          );
        })}
      </div>
      <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--md-sys-color-on-surface-variant)' }}>
        {genres.length} selected
      </div>
    </Step>
  );

  const FirstBook = (
    <Step key="firstbook" dir={dir} icon={BookPlus} tone="brand" eyebrow="Your first quest"
      title="Add your first book" body="Start your shelf with a title — or skip and add one later.">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, maxWidth: 460, margin: '0 auto' }}>
        {SUGGESTED.map(([t, a, grad]) => {
          const on = picked === t;
          return (
            <button key={t} type="button" onClick={() => setPicked(on ? null : t)}
              style={{ display: 'flex', gap: 12, alignItems: 'center', textAlign: 'left', padding: 10, borderRadius: 14, cursor: 'pointer',
                background: on ? 'var(--md-sys-color-secondary-container)' : 'var(--md-sys-color-surface-container-low)',
                border: `1.5px solid ${on ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline-variant)'}` }}>
              <div style={{ width: 40, height: 54, borderRadius: 7, background: grad, display: 'grid', placeItems: 'center', flex: '0 0 auto' }}>
                <BookOpen size={17} color="rgba(255,255,255,.9)" />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: on ? 'var(--md-sys-color-on-secondary-container)' : 'var(--md-sys-color-on-surface)', lineHeight: 1.25, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{t}</div>
                <div style={{ fontSize: 11.5, color: 'var(--md-sys-color-on-surface-variant)', marginTop: 2 }}>{a}</div>
              </div>
              {on
                ? <CheckCircle2 size={18} color="var(--md-sys-color-primary)" style={{ flex: '0 0 auto' }} />
                : <Plus size={18} color="var(--md-sys-color-on-surface-variant)" style={{ flex: '0 0 auto' }} />}
            </button>
          );
        })}
      </div>
    </Step>
  );

  const Done = (
    <Step key="done" dir={dir} icon={PartyPopper} tone="quest" celebrate
      eyebrow={`You're all set, ${who.split(' ')[0] || 'reader'}!`}
      title="Your quest begins" body="Here's your setup — jump in and start your streak today.">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 400, margin: '0 auto', width: '100%' }}>
        <SummaryRow icon={Target} label="Yearly goal" value={`${goal} books`} />
        <SummaryRow icon={Flame} label="Daily habit" value={`${minutes} min/day`} accent="var(--md-sys-color-error)" />
        <SummaryRow icon={Heart} label="Interests" value={genres.slice(0, 3).join(', ') + (genres.length > 3 ? ` +${genres.length - 3}` : '') || 'None yet'} />
        <SummaryRow icon={BookOpen} label="First book" value={picked || 'Add later'} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, marginTop: 4, padding: '11px 16px', borderRadius: 9999, background: 'var(--sq-gradient-quest)', color: '#fff', fontWeight: 700, fontSize: 14 }}>
          <Sparkles size={17} /> +50 XP · setup complete
        </div>
      </div>
    </Step>
  );

  const bodies = [Welcome, Goal, Interests, FirstBook, Done];
  const isLast = step === STEPS.length - 1;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 4000, background: 'var(--md-sys-color-background)', overflowY: 'auto', fontFamily: 'var(--sq-font-sans)' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'var(--sq-aurora)', pointerEvents: 'none' }} />
      <div style={{ position: 'relative', minHeight: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '88px 24px', boxSizing: 'border-box' }}>

        {/* top bar: brand + progress + skip */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', alignItems: 'center', gap: 16, padding: '22px 28px' }}>
          <span style={{ fontSize: 17, fontWeight: 800, color: 'var(--md-sys-color-on-surface)' }}>ShelfQuest</span>
          <div style={{ flex: 1, maxWidth: 360, margin: '0 auto', height: 6, borderRadius: 9999, background: 'var(--md-sys-color-surface-container-highest)', overflow: 'hidden' }}>
            <div style={{ width: pct + '%', height: '100%', borderRadius: 9999, background: 'var(--sq-gradient-brand)', transition: 'width .4s cubic-bezier(.32,.72,0,1)' }} />
          </div>
          {!isLast
            ? <button type="button" onClick={() => onSkip?.(collected)} style={{ border: 'none', background: 'transparent', color: 'var(--md-sys-color-on-surface-variant)', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>Skip for now</button>
            : <span style={{ width: 76 }} />}
        </div>

        {/* step card */}
        <div style={{ width: '100%', maxWidth: 600, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {bodies[step]}
        </div>

        {/* footer nav */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '22px 28px' }}>
          {step > 0
            ? <MD3Button variant="text" icon={<ArrowLeft size={18} />} onClick={() => go(-1)}>Back</MD3Button>
            : <span />}
          <div style={{ display: 'flex', gap: 7 }}>
            {STEPS.map((_, i) => (
              <span key={i} style={{ width: i === step ? 22 : 8, height: 8, borderRadius: 9999, background: i === step ? 'var(--md-sys-color-primary)' : i < step ? 'color-mix(in srgb, var(--md-sys-color-primary) 45%, transparent)' : 'var(--md-sys-color-surface-container-highest)', transition: 'all .3s ease' }} />
            ))}
          </div>
          {!isLast
            ? <MD3Button variant="filled" trailingIcon={<ArrowRight size={18} />} disabled={!canContinue} onClick={() => canContinue && go(1)}>Continue</MD3Button>
            : <MD3Button variant="filled" trailingIcon={<Rocket size={18} />} onClick={() => onComplete?.(collected)}>Start reading</MD3Button>}
        </div>
      </div>
    </div>
  );
}

/* ---- step scaffold: medallion + eyebrow + title + body + slot ---- */
function Step({ icon: Icon, tone = 'brand', eyebrow, title, body, children, dir = 1, celebrate }) {
  const ring = tone === 'quest' ? 'var(--sq-gradient-quest)' : 'var(--sq-gradient-brand)';
  const glow = tone === 'quest' ? 'rgba(124,92,255,.18)' : 'rgba(0,119,182,.18)';
  return (
    <div className="sq-setup-step" style={{ textAlign: 'center', width: '100%', animation: `sqSetupStep${dir < 0 ? 'L' : 'R'} .4s cubic-bezier(.32,.72,0,1)` }}>
      <div style={{ position: 'relative', width: 76, height: 76, margin: '0 auto', borderRadius: '50%', display: 'grid', placeItems: 'center', background: ring, color: '#fff', boxShadow: `0 0 0 10px ${glow}` }}>
        <Icon size={34} strokeWidth={1.9} />
        {celebrate && <Sparkle />}
      </div>
      {eyebrow && <div style={{ fontSize: 12.5, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: tone === 'quest' ? 'var(--sq-violet)' : 'var(--md-sys-color-primary)', marginTop: 22 }}>{eyebrow}</div>}
      <h1 style={{ margin: '8px 0 0', fontSize: 28, fontWeight: 800, letterSpacing: '-.02em', color: 'var(--md-sys-color-on-surface)' }}>{title}</h1>
      {body && <p style={{ margin: '10px auto 0', maxWidth: 440, fontSize: 15.5, lineHeight: 1.55, color: 'var(--md-sys-color-on-surface-variant)', textWrap: 'pretty' }}>{body}</p>}
      <div style={{ marginTop: 30 }}>{children}</div>
    </div>
  );
}

/* numeric stepper with -/+ */
function Stepper({ label, value, setValue, min, max, step, suffix, icon: Icon, accent = 'var(--md-sys-color-primary)' }) {
  const dec = () => setValue((v) => Math.max(min, v - step));
  const inc = () => setValue((v) => Math.min(max, v + step));
  const Btn = ({ on, children, aria }) => (
    <button type="button" onClick={on} aria-label={aria} style={{ width: 40, height: 40, borderRadius: 12, border: '1px solid var(--md-sys-color-outline-variant)', background: 'var(--md-sys-color-surface-container)', color: 'var(--md-sys-color-on-surface)', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
      {children}
    </button>
  );
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 16, background: 'var(--md-sys-color-surface-container-low)', border: '1px solid var(--md-sys-color-outline-variant)' }}>
      <span style={{ display: 'grid', placeItems: 'center', width: 38, height: 38, borderRadius: 11, color: accent, background: 'color-mix(in srgb, currentColor 16%, transparent)', flex: '0 0 auto' }}><Icon size={20} /></span>
      <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--md-sys-color-on-surface-variant)' }}>{label}</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--md-sys-color-on-surface)', lineHeight: 1.2 }}>{value} <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--md-sys-color-on-surface-variant)' }}>{suffix}</span></div>
      </div>
      <div style={{ display: 'flex', gap: 8, flex: '0 0 auto' }}>
        <Btn on={dec} aria="decrease"><Minus size={18} /></Btn>
        <Btn on={inc} aria="increase"><Plus size={18} /></Btn>
      </div>
    </div>
  );
}

function SummaryRow({ icon: Icon, label, value, accent = 'var(--md-sys-color-primary)' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '12px 16px', borderRadius: 13, background: 'var(--md-sys-color-surface-container-low)', border: '1px solid var(--md-sys-color-outline-variant)' }}>
      <span style={{ display: 'grid', placeItems: 'center', width: 34, height: 34, borderRadius: 10, color: accent, background: 'color-mix(in srgb, currentColor 16%, transparent)', flex: '0 0 auto' }}><Icon size={18} /></span>
      <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--md-sys-color-on-surface-variant)' }}>{label}</span>
      <span style={{ marginLeft: 'auto', fontSize: 14, fontWeight: 700, color: 'var(--md-sys-color-on-surface)', textAlign: 'right', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
    </div>
  );
}

/* tiny celebratory sparkles around the final medallion */
function Sparkle() {
  const dots = [[-6, '8%', 0], [10, '92%', .15], [-14, '50%', .3], [16, '20%', .45], [0, '70%', .6]];
  return (
    <>
      {dots.map(([y, left, delay], i) => (
        <span key={i} className="sq-setup-spark" style={{ position: 'absolute', top: y, left, width: 7, height: 7, borderRadius: '50%', background: i % 2 ? 'var(--sq-warning)' : '#fff', animation: `sqSetupSpark 1.4s ease ${delay}s infinite` }} />
      ))}
    </>
  );
}
