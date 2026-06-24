import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LibraryBig, Sparkles, Play, Flame, Zap, LayoutGrid, Palette, Lock,
  Check, ArrowRight, Upload, BookOpen, Brain, NotebookPen, Trophy, ChartColumn,
} from 'lucide-react';
import { useIntersectionObserver } from '../components/performance/hooks';
import './NewLandingPage.css';

/*
 * Public marketing landing page (rendered at "/" for logged-out visitors).
 *
 * Recreated from the ShelfQuest "Marketing Landing Page" design handoff. The
 * mock's window.SQ / MK.* primitives are mapped to small local components here +
 * lucide-react, driven by the already-bridged --sq-* tokens (sq-design-tokens.css)
 * and the app's --md-sys-* system. The README's "use MUI" note is intentionally
 * not followed (wrong for this repo).
 *
 * COPY POLICY: the design's content model (MKDATA) ships inflated marketing
 * numbers and fictional testimonials. The app is LIVE, so we keep the *visual*
 * design but use truthful copy — factual stats and our real testimonials. Do not
 * reintroduce fabricated counts/ratings.
 *
 * CONTRACT: auth-testid-contract.test.js (BLOCKING) requires these literal
 * fragments to stay in this file: data-testid="landing-hero",
 * data-testid="get-started-button", data-testid="login-link",
 * data-testid="register-link", and the call navigate('/register').
 */

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- local marketing primitives (mock SQ / MK kit → MD3 tokens) ---------- */

function Reveal({ children, delay = 0, className = '', style = {} }) {
  const ref = useRef(null);
  const { hasIntersected } = useIntersectionObserver(ref, {
    threshold: 0.12,
    rootMargin: '0px 0px -8% 0px',
  });
  const show = hasIntersected || prefersReducedMotion();
  return (
    <div
      ref={ref}
      className={`mk-reveal ${show ? 'is-visible' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms`, ...style }}
    >
      {children}
    </div>
  );
}

function Button({ variant = 'filled', size = 'medium', icon, children, className = '', type = 'button', ...rest }) {
  return (
    <button type={type} className={`mk-btn mk-btn--${variant} mk-btn--${size} ${className}`} {...rest}>
      {icon && <span className="mk-btn__icon">{icon}</span>}
      {children && <span>{children}</span>}
    </button>
  );
}

function Eyebrow({ icon, color, children }) {
  return (
    <span className="mk-eyebrow" style={color ? { color } : undefined}>
      {icon && <span className="mk-eyebrow__icon">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}

// Gradient-clipped text. Defaults to the brand gradient when none is given.
function Grad({ gradient, children }) {
  return <span className="mk-grad" style={gradient ? { backgroundImage: gradient } : undefined}>{children}</span>;
}

function SectionHead({ eyebrow, eyebrowIcon, title, sub }) {
  return (
    <div className="mk-sectionhead">
      {eyebrow && <Eyebrow icon={eyebrowIcon}>{eyebrow}</Eyebrow>}
      <h2 className="mk-sectionhead__title">{title}</h2>
      {sub && <p className="mk-sectionhead__sub">{sub}</p>}
    </div>
  );
}

// Browser-chrome screenshot frame.
function Browser({ src, alt, glow = true }) {
  return (
    <div className={`mk-browser ${glow ? 'mk-browser--glow' : ''}`}>
      <div className="mk-browser__bar">
        <span className="mk-browser__dot" />
        <span className="mk-browser__dot" />
        <span className="mk-browser__dot" />
      </div>
      <img className="mk-browser__shot" src={src} alt={alt} loading="lazy" />
    </div>
  );
}

function FeatureCard({ icon, accent, title, body }) {
  return (
    <div className="mk-feature">
      <span className="mk-feature__icon" style={{ color: accent }}>{icon}</span>
      <h3 className="mk-feature__title">{title}</h3>
      <p className="mk-feature__body">{body}</p>
    </div>
  );
}

/* ---------- content (truthful — real features, stats & testimonials) ---------- */

const FEATURES = [
  { icon: <Upload size={22} />, accent: 'var(--md-sys-color-primary)', title: 'Upload Your Books', body: 'Bring your whole library — EPUB and PDF — into one calm, searchable place. Your shelf, finally in your pocket.' },
  { icon: <BookOpen size={22} />, accent: 'var(--md-sys-color-secondary)', title: 'Track Every Session', body: 'Pick up where you left off. ShelfQuest follows your progress, pages and reading time as you go.' },
  { icon: <Brain size={22} />, accent: 'var(--sq-violet)', title: 'AI Reading Companion', body: 'A literary mentor that summarizes chapters, answers questions and nudges your next great read.' },
  { icon: <NotebookPen size={22} />, accent: 'var(--sq-teal)', title: 'Notes, Summarized', body: 'Highlight a passage and let AI distill it. Every note lands back in your library, beautifully organized.' },
  { icon: <Trophy size={22} />, accent: 'var(--sq-gold)', title: 'Quests & Rewards', body: 'Earn points, build streaks, unlock achievements and level up. Reading has never felt this rewarding.' },
  { icon: <ChartColumn size={22} />, accent: 'var(--sq-green)', title: 'See Your Reading', body: 'Clear statistics on pace, streaks and time read — so you always know your momentum at a glance.' },
];

const SPOTLIGHTS = [
  {
    eyebrow: 'Mentor AI', icon: <Sparkles size={15} />, accent: 'var(--sq-violet)',
    title: 'Your personal literary mentor',
    body: "Ask anything about what you're reading. Get chapter recaps, themes and gentle recommendations for what to pick up next — a companion that knows your shelf and cheers you on.",
    bullets: ['Chapter & book summaries on demand', 'Recommendations tuned to your taste', 'Answers grounded in your own library'],
    shot: '/screenshot-mentor.png', cta: 'Meet Your Mentor', flip: false,
  },
  {
    eyebrow: 'Gamified Reading', icon: <Trophy size={15} />, accent: 'var(--sq-gold)',
    title: 'Turn reading into a quest',
    body: 'Every page moves you forward. Collect points, keep your streak alive, complete goals and unlock new themes — small wins that keep you coming back to the page.',
    bullets: ['Daily & reading streaks', 'Points, levels and achievements', 'Six unlockable themes to earn'],
    shot: '/screenshot-statistics.png', cta: 'See the Rewards', flip: true,
  },
  {
    eyebrow: 'Smart Notes', icon: <NotebookPen size={15} />, accent: 'var(--sq-teal)',
    title: 'Notes that write themselves',
    body: 'Capture a quote, jot a thought, or let the AI summarize an entire chapter. Your notes stay tied to the book and searchable across your whole library.',
    bullets: ['AI-summarized highlights', 'Linked to book & page', 'Searchable across your shelf'],
    shot: '/screenshot-notes.png', cta: 'Start Taking Notes', flip: false,
  },
];

// Factual — no inflated counts. Mirrors the deliberate "just getting started" stance.
const STATS = [
  { value: 'PDF', label: '& EPUB Support' },
  { value: '6', label: 'Unlockable Themes' },
  { value: '∞', label: 'Reading Goals' },
  { value: 'Free', label: 'To Get Started' },
];

const THEMES = [
  { name: 'Classic', g: 'linear-gradient(135deg,#023e8a,#0077b6)' },
  { name: 'Warm Sepia', g: 'linear-gradient(135deg,#9a6a3a,#d9a066)' },
  { name: 'Ocean Blue', g: 'linear-gradient(135deg,#0077b6,#00b4d8)' },
  { name: 'Forest Green', g: 'linear-gradient(135deg,#1f8a5b,#4ade80)' },
  { name: 'Royal Purple', g: 'linear-gradient(135deg,#5b3fc4,#9a82ff)' },
  { name: 'Legendary Gold', g: 'linear-gradient(135deg,#b8860b,#facc15)' },
];

// Real testimonials carried over from the previous landing page.
const TESTIMONIALS = [
  { name: 'Mrs. Sarah Chen', role: '5th Grade Teacher', accent: 'var(--sq-gold)', highlight: 'Classroom Integration',
    quote: 'ShelfQuest transformed my classroom reading program. The gamification levels reward students individually — when they level up, they earn classroom privileges. My reluctant readers are now racing to finish books!' },
  { name: 'Marcus T.', role: 'Student, Age 14', accent: 'var(--sq-violet)', highlight: 'Student Motivation',
    quote: "I never thought I'd say this, but tracking my reading is actually fun. Watching my stats grow and collecting points feels like a game. I've read more books this semester than all of last year!" },
  { name: 'Jennifer M.', role: 'Parent & Reader', accent: 'var(--sq-teal)', highlight: 'Family Reading',
    quote: "I started using ShelfQuest for myself and loved it so much I set up my daughter's account. Now we compare reading streaks at dinner! It's become a bonding activity." },
];

/* --------------------------------- page --------------------------------- */

const NewLandingPage = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToFeatures = useCallback(() => {
    const el = document.getElementById('features');
    if (el) el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }, []);

  return (
    <div className="mk-page">
      {/* ============ NAV ============ */}
      <nav className={`mk-nav ${scrolled ? 'is-scrolled' : ''}`}>
        <div className="mk-nav__inner">
          <a href="#top" className="mk-nav__logo">
            <img src="/ShelfQuest_logo_v3.png" alt="" className="mk-nav__logo-img" />
            <span className="mk-nav__logo-text">ShelfQuest</span>
          </a>
          <div className="mk-nav__links">
            <a href="#features" className="mk-nav__link">Features</a>
            <a href="#testimonials" className="mk-nav__link">Stories</a>
            <a href="#cta" className="mk-nav__link">Get Started</a>
          </div>
          <div className="mk-nav__actions">
            <Button variant="text" size="small" onClick={() => navigate('/login')} data-testid="login-link">
              Sign In
            </Button>
            <Button
              variant="filled"
              size="small"
              icon={<ArrowRight size={16} />}
              className="mk-btn--icon-end"
              onClick={() => navigate('/register')}
              data-testid="register-link"
            >
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      <main id="top">
        {/* ============ HERO ============ */}
        <section className="mk-section mk-section--hero">
          <header className="mk-hero" data-testid="landing-hero">
            <div className="mk-hero__copy">
              <Eyebrow icon={<LibraryBig size={15} />}>Your Digital Library</Eyebrow>
              <h1 className="mk-hero__title">
                Every book is a<br /><Grad gradient="var(--sq-gradient-quest)">quest</Grad> waiting to begin.
              </h1>
              <p className="mk-hero__lead">
                Upload your books, track every reading session, take AI-summarized notes, and level up as you go.
                ShelfQuest is the warm, gamified reading companion that keeps you turning pages.
              </p>
              <div className="mk-hero__ctas">
                <Button
                  variant="filled"
                  size="large"
                  icon={<Sparkles size={18} />}
                  onClick={() => navigate('/signup')}
                  data-testid="get-started-button"
                >
                  Start Your Quest
                </Button>
                <Button variant="outlined" size="large" icon={<Play size={17} />} onClick={scrollToFeatures}>
                  See How It Works
                </Button>
              </div>
              {/* Honest social proof — no fabricated counts (app is newly launched). */}
              <div className="mk-hero__proof">
                <span className="mk-hero__proof-badge"><Sparkles size={18} /></span>
                <p>New app, big dreams — start your quest free. No card required.</p>
              </div>
            </div>

            <div className="mk-hero__visual">
              <Browser src="/screenshot-dashboard.png" alt="ShelfQuest dashboard" />
              <div className="mk-floatchip mk-floatchip--streak">
                <span className="mk-floatchip__icon" style={{ color: 'var(--sq-gold)' }}><Flame size={20} /></span>
                <div>
                  <div className="mk-floatchip__value">14 days</div>
                  <div className="mk-floatchip__label">Reading streak</div>
                </div>
              </div>
              <div className="mk-floatchip mk-floatchip--level">
                <span className="mk-floatchip__icon" style={{ color: 'var(--sq-violet)' }}><Zap size={20} /></span>
                <div>
                  <div className="mk-floatchip__value">Level 7</div>
                  <div className="mk-floatchip__label">+120 XP today</div>
                </div>
              </div>
            </div>
          </header>

          {/* stats strip */}
          <Reveal className="mk-statstrip">
            {STATS.map((s) => (
              <div key={s.label} className="mk-stat">
                <div className="mk-stat__value"><Grad>{s.value}</Grad></div>
                <div className="mk-stat__label">{s.label}</div>
              </div>
            ))}
          </Reveal>
        </section>

        {/* ============ FEATURES ============ */}
        <section id="features" className="mk-section mk-section--features">
          <Reveal>
            <SectionHead
              eyebrow="Everything in one place"
              eyebrowIcon={<LayoutGrid size={15} />}
              title="Your whole reading life, beautifully organized"
              sub="From the first upload to your hundredth finished book, ShelfQuest holds it all — and makes the journey feel like an adventure."
            />
          </Reveal>
          <div className="mk-featgrid">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={(i % 3) * 80}><FeatureCard {...f} /></Reveal>
            ))}
          </div>
        </section>

        {/* ============ SPOTLIGHTS ============ */}
        {SPOTLIGHTS.map((s) => (
          <section key={s.title} className="mk-section mk-section--spotlight">
            <div className={`mk-spot ${s.flip ? 'mk-spot--flip' : ''}`}>
              <Reveal className="mk-spot__copy">
                <Eyebrow icon={s.icon} color={s.accent}>{s.eyebrow}</Eyebrow>
                <h2 className="mk-spot__title">{s.title}</h2>
                <p className="mk-spot__body">{s.body}</p>
                <ul className="mk-spot__list">
                  {s.bullets.map((b) => (
                    <li key={b}>
                      <span className="mk-spot__check" style={{ color: s.accent, background: `color-mix(in srgb, ${s.accent} 16%, transparent)` }}>
                        <Check size={15} strokeWidth={2.6} />
                      </span>
                      {b}
                    </li>
                  ))}
                </ul>
                <div className="mk-spot__cta">
                  <Button variant="tonal" size="medium" icon={<ArrowRight size={16} />} className="mk-btn--icon-end" onClick={() => navigate('/signup')}>
                    {s.cta}
                  </Button>
                </div>
              </Reveal>
              <Reveal delay={120} className="mk-spot__visual">
                <div className="mk-spot__glow" style={{ background: `radial-gradient(closest-side, color-mix(in srgb, ${s.accent} 22%, transparent), transparent 75%)` }} />
                <Browser src={s.shot} alt={s.title} glow={false} />
              </Reveal>
            </div>
          </section>
        ))}

        {/* ============ THEMES ============ */}
        <section className="mk-section mk-section--themes">
          <Reveal>
            <SectionHead
              eyebrow="Unlockable Rewards"
              eyebrowIcon={<Palette size={15} />}
              title="Read more. Unlock more."
              sub="Earn points as you read and unlock six handcrafted themes — small rewards that make your library feel like yours."
            />
          </Reveal>
          <Reveal delay={100}>
            <div className="mk-themegrid">
              {THEMES.map((t, i) => (
                <div key={t.name} className="mk-theme">
                  <div className="mk-theme__swatch" style={{ background: t.g }}>
                    {i >= 4 && <span className="mk-theme__lock"><Lock size={12} /></span>}
                  </div>
                  <div className="mk-theme__name">{t.name}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        {/* ============ TESTIMONIALS ============ */}
        <section id="testimonials" className="mk-section mk-section--testimonials">
          <Reveal>
            <SectionHead eyebrow="Loved by readers" eyebrowIcon={<Sparkles size={15} />} title="Readers are on the quest" />
          </Reveal>
          <div className="mk-testgrid">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={t.name} delay={(i % 3) * 80}>
                <figure className="mk-testimonial">
                  <span className="mk-testimonial__tag">{t.highlight}</span>
                  <blockquote className="mk-testimonial__quote">“{t.quote}”</blockquote>
                  <figcaption className="mk-testimonial__author">
                    <span className="mk-testimonial__avatar" style={{ background: t.accent }}>{t.name[0]}</span>
                    <span>
                      <span className="mk-testimonial__name">{t.name}</span>
                      <span className="mk-testimonial__role">{t.role}</span>
                    </span>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ============ CTA BAND ============ */}
        <section id="cta" className="mk-section mk-section--cta">
          <Reveal>
            <div className="mk-ctaband">
              <div className="mk-ctaband__glow" />
              <div className="mk-ctaband__inner">
                <img src="/ShelfQuest_logo_v3.png" alt="" className="mk-ctaband__mark" />
                <h2 className="mk-ctaband__title">Ready to begin your quest?</h2>
                <p className="mk-ctaband__lead">
                  Turn your shelf into an adventure. Free to start — no card required.
                </p>
                <div className="mk-ctaband__ctas">
                  <Button variant="glass" size="large" icon={<Sparkles size={18} />} onClick={() => navigate('/signup')}>
                    Start Your Quest
                  </Button>
                  <Button variant="ghost" size="large" onClick={() => navigate('/contact')}>
                    Talk to Us
                  </Button>
                </div>

                {/* Real store links retained from the previous landing page. */}
                <div className="mk-ctaband__stores">
                  <a
                    href="https://apps.microsoft.com/detail/9P23Z6MBNGSH"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mk-store"
                    aria-label="Download from Microsoft Store"
                  >
                    <svg className="mk-store__icon" viewBox="0 0 23 23" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path d="M0 0h11v11H0z" fill="#F25022" />
                      <path d="M12 0h11v11H12z" fill="#7FBA00" />
                      <path d="M0 12h11v11H0z" fill="#00A4EF" />
                      <path d="M12 12h11v11H12z" fill="#FFB900" />
                    </svg>
                    <span className="mk-store__text">
                      <span className="mk-store__small">Download on the</span>
                      <span className="mk-store__name">Microsoft Store</span>
                    </span>
                  </a>
                  <a
                    href="https://play.google.com/store/apps/details?id=org.shelfquest.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mk-store"
                    aria-label="Get it on Google Play"
                  >
                    <svg className="mk-store__icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" fill="#3DDC84" />
                    </svg>
                    <span className="mk-store__text">
                      <span className="mk-store__small">Get it on</span>
                      <span className="mk-store__name">Google Play</span>
                    </span>
                  </a>
                </div>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      {/* ============ FOOTER ============ */}
      <footer className="mk-footer">
        <div className="mk-footer__inner">
          <div className="mk-footer__grid">
            <div className="mk-footer__brand">
              <a href="#top" className="mk-footer__logo">
                <img src="/ShelfQuest_logo_v3.png" alt="" className="mk-footer__logo-img" />
                <span className="mk-footer__logo-text">ShelfQuest</span>
              </a>
              <p className="mk-footer__tagline">
                Designed for the modern reader. Built to last as long as your books.
              </p>
            </div>

            <div className="mk-footer__group">
              <h4>Product</h4>
              <ul>
                <li><a href="#features">Features</a></li>
                <li><a href="/premium">Premium</a></li>
                <li><a href="/pricing">Pricing</a></li>
              </ul>
            </div>

            <div className="mk-footer__group">
              <h4>Resources</h4>
              <ul>
                <li><a href="/help/viewer">Help Center</a></li>
                <li><a href="/contact">Contact Us</a></li>
                <li><a href="/jolman-press">About Jolman Press</a></li>
              </ul>
            </div>

            <div className="mk-footer__group">
              <h4>Legal</h4>
              <ul>
                <li><a href="/legal/privacy-policy">Privacy Policy</a></li>
                <li><a href="/legal/terms-of-service">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="mk-footer__bottom">
            <p>© 2026 ShelfQuest by Jolman Press. All rights reserved.</p>
            <p className="mk-footer__meta">shelfquest.org · Your digital library companion</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default NewLandingPage;
