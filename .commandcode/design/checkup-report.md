# Checkup Report — pixelog-net

**Mode:** checkup
**Date:** 2026-09-12
**Target:** `C:\Users\onishiyuta\Files\dev\workspace\pixelog-net`
**Stack:** Astro 6 static site, 91 built pages, no client framework
**Score:** 20 / 60
**Verdict:** Block

---

## TL;DR

The site is functionally healthy but visually anonymous. The layout is one repeated
formula — italic serif title, tiny mono uppercase meta line, hairline rows — applied
identically to home, posts, categories, and tags. There is no imagery, no excerpt, no
rhythm variation, so the reader never sees the thing the blog is made of (the writing).

Two findings are hard blockers, not taste: the only form on the site is an unlabeled,
focus-stripped search input, and there is not a single `@media` rule in the project, so
the header cannot survive a 320px viewport.

Six dead style blocks from removed features (Notes, category filters, tag weighting)
and an ignored `--w` weight variable reveal the real problem underneath the aesthetics:
this was assembled, then patched, and the decisions were never made on purpose.

**Primary recommendation:** run `/design smell` then `/design redesign`, and fix the four
HIGH accessibility/responsive items in the same pass.

---

## Heuristic scores

| # | Vital | Score | Key finding |
|---|---|---|---|
| 1 | Intentionality | 0 / 10 | 9 dead selectors and a computed-then-discarded tag weight. Reads as template-then-patch, not chosen. |
| 2 | Readability | 5 / 10 | Body text is comfortable, but `--ink-mute` fails AA (4.35:1) and `--ink-faint` does not exist, collapsing hierarchy on 2 pages. |
| 3 | Usability | 5 / 10 | Browsing works; home feed shows year only, no active nav state, search is unlabeled. |
| 4 | Responsiveness | 0 / 10 | Zero `@media` queries. Header overflows at 320px. Search input triggers iOS zoom. |
| 5 | Speed | 10 / 10 | Static, no hydration, minimal JS. Only external render dependency is Google Fonts. |
| 6 | Accessibility | 0 / 10 | Four escalation triggers: unlabeled field, no visible focus, contrast failure, no reduced-motion guard. |

---

## Vital signs

**Intentionality — Critical.** Every visual choice is the current default reflex: cream
`#f7f5f2`, Instrument Serif italic, Geist Mono uppercase micro-labels, muted forest green
`#3d6b40`, and a 100px pill on every chip. Italic serif carries five unrelated jobs
(hero, page titles, name, avatar letter, blockquote). Nothing here is wrong in isolation;
nothing here was decided either.

**Readability — Watch.** The article column is genuinely good: `0.95rem` at `2.05`
line-height with a warm ink. But `--ink-mute` (`#7a726a` on `#f7f5f2`) measures ~4.35:1
and is used for everything small — dates, counts, section labels — at `0.6rem`. It misses
AA. Meanwhile `color: var(--ink-faint)` is declared 11 times against a variable that does
not exist, so that text silently falls back to inherited near-black, which is *darker*
than the "mute" text. Faint and mute are inverted on the Tags and Categories pages.

**Usability — Watch.** The core task (find and read a post) is completable. What is
missing is orientation: the nav styles `a.active` but no page ever applies the class, so
a reader never knows where they are. The home feed reduces each post to title + category
+ year, with no month or day, so "Recent" is unreadable as a timeline.

**Responsiveness — Critical.** There are no media queries anywhere in `src/`. Layout
adaptation is delegated entirely to `clamp()` and `flex-wrap`, and the header does not
wrap. At 320px the content column is 280px wide; the logo SVG renders ~85px and the four
uppercase mono nav items plus `1.5rem` gaps need roughly 265px, so the header needs
~350px and overflows. The nav also has no mobile treatment and there is no `env(safe-area-inset)`.

**Speed — Healthy.** 91 static pages, no hydration, no layout-shifting media above the
fold. The single external dependency is the Google Fonts stylesheet.

**Accessibility — Critical.** Four escalation triggers stand, and they are not averaged
away by the other vitals: the search field's placeholder is doing the label's job, the
same field sets `outline: none` with an ineffective replacement, `--ink-mute` fails
contrast, and nothing anywhere honors `prefers-reduced-motion`.

---

## Findings

| # | Severity | Discipline | Location | Before | After | Why |
|---|---|---|---|---|---|---|
| 1 | HIGH | Accessibility | `src/pages/posts.astro:80-84` | `<input class="search-input" ... placeholder="記事を検索…">` with no `<label>` | Add `<label for="search-input">記事を検索</label>` (visually hidden if needed); keep the placeholder as an example only | The placeholder is doing the label's job; it disappears on focus and screen readers get no field name |
| 2 | HIGH | Accessibility | `src/pages/posts.astro:83,87` | `.search-input { outline: none }`; the only `:focus` rule sets `border-color: var(--ink-light)` | Remove `outline: none`; add `.search-input:focus-visible { outline: 2px solid var(--accent-alt); outline-offset: 2px }` and define or drop `--ink-light` | Tab reaches the field with nothing visible to show it landed — the replacement references an undefined variable, so focus is invisible |
| 3 | HIGH | Color | `src/styles/global.css:1-11` vs `src/pages/tags.astro:79,125,157,184,191` and `src/pages/categories.astro:67,101,125,147` | `color: var(--ink-faint)` (11 uses) — `--ink-faint` is never defined; `--ink-light` (posts.astro) also undefined | Define `--ink-faint: #8a8178` (or similar) in `:root`, or replace all uses with the existing `--ink-mute` | Undefined custom properties make `color` fall back to inherited near-black, so "faint" meta text renders heavier than "mute" text and hierarchy inverts |
| 4 | HIGH | Responsiveness | `src/components/Header.astro:32-54` + all of `src/` | `.header-inner { height: 54px; display: flex; }` with no wrap, no media queries anywhere | Add a breakpoint that shrinks the nav (smaller logo, reduced gap) or collapses it into a menu below ~640px | At 320px the row needs ~350px and the viewport offers 280px, so nav items are cut off |
| 5 | HIGH | Responsiveness | `src/pages/posts.astro:81` | `.search-input { font-size: 0.85rem }` (~13.9px) | Set `font-size: 1rem` (or `16px`) on the input below 640px | Sub-16px inputs trigger iOS Safari auto-zoom on focus and break the layout |
| 6 | HIGH | Accessibility | `src/styles/global.css:9` | `--ink-mute: #7a726a` on `--bg: #f7f5f2` ≈ 4.35:1 | Darken to ≈`#6b635b` (≈5.0:1) | Used for all dates, counts, and section labels at ~9.6px; misses AA 4.5:1 for normal text |
| 7 | MEDIUM | Motion | `src/layouts/BaseLayout.astro:47-49`, `src/styles/global.css:25` | Page-load `@keyframes up` (translateY 10px) plus `scroll-behavior: smooth`, no motion guard | Wrap in `@media (prefers-reduced-motion: no-preference)`; set `scroll-behavior: auto` under `prefers-reduced-motion: reduce` | Vestibular users get unrequested motion on every navigation with no way out |
| 8 | MEDIUM | Type | `src/layouts/MarkdownPostLayout.astro:63,73,83` | h1 `clamp(1.2rem, 3.5vw, 1.65rem)` vs h2 `1.18rem` vs h3 `1.03rem` | Make h1 ≥ 1.54rem so the h1:h2 ratio clears 1.3 | At the clamp floor the post title is only ~1.7% larger than a section heading; the most important text on the page does not read as a title |
| 9 | MEDIUM | Surface | `src/pages/index.astro:118-186`, `src/pages/posts.astro:91-118` | 9 dead selectors: `.hero-eyebrow`, `.notes-grid`, `.note-card`, `.note-body`, `.note-date`, `.cat-filters`, `.cat-btn`, `.site-name-dot`, `nav-notes` | Delete them | They style features that were removed (Notes, category filter); they are the clearest "assembled from a template" tell |
| 10 | MEDIUM | Surface | `src/pages/tags.astro:24,31,33` | `const weight = ...` is computed, then the markup hardcodes `style="--w:0.40"` on every chip | Bind `style={`--w:${...}`}` to the computed weight, or delete the variable | The "weighted" tag cloud never varies — the feature is decorative fiction |
| 11 | MEDIUM | Interaction | `src/components/Header.astro:73-74` | `nav a.active { color: var(--ink) }` is defined but `active` is never applied | Pass the current path into `Header` and set `aria-current="page"` + `active` | No current-page indication anywhere in the nav |
| 12 | MEDIUM | Accessibility | `src/components/Header.astro:29,31` | Both the Tags link and the About link carry `id="nav-about"` | Give each a unique id, or drop the ids | Duplicate ids are invalid and break anchor/label references |
| 13 | MEDIUM | Layout | `src/pages/posts.astro:66` | A stray `</div>` with no matching opening tag | Remove it | Produces invalid HTML and can mis-nest siblings |
| 14 | MEDIUM | Layout | `src/pages/categories.astro`, `src/pages/tags.astro`, `src/pages/posts.astro` | Three list pages share the same chip-cloud + grouped hairline-row composition; categories and tags are near-duplicates | Give each page a distinct shape tied to its job, or merge categories and tags | Identical composition across three surfaces is a large part of why the site feels flat |
| 15 | MEDIUM | Writing | `src/layouts/BaseLayout.astro:15-24` | No `<meta name="description">`, no Open Graph or Twitter card tags | Add a per-page description and `og:title`/`og:description`/`og:type` | Every page shares without a description; the head only has `title` and the RSS alternate |
| 16 | MEDIUM | Voice | `src/pages/index.astro:20-38` | Recent list shows `title`, `category`, `formatDateYear` (year only) | Show month/day, add a one-line excerpt, and let the newest post lead | The artifact is the writing; a year-only title row reads as a changelog, not a blog |
| 17 | LOW | Interaction | `src/pages/posts.astro:71` | `<span class="search-icon">🔍</span>` | Use an inline SVG matching the footer icon set, `aria-hidden="true"` | Emoji render differently per platform and are announced verbatim |
| 18 | LOW | Color | `src/components/Header.astro:36`, `src/pages/posts.astro:66` | `rgba(247,245,242,0.88)` / `0.95` hardcoded | Derive from a `--bg-rgb` token | The background token can drift from these values |
| 19 | LOW | Interaction | `src/layouts/MarkdownPostLayout.astro:29-31` | `href={`/tags#${tag}`}` | `/tags/#${tag}` to match the site's trailing-slash URLs | One redirect hop; inconsistent with canonical URLs |

---

## AI-tell catalog (the "面白みがない" root cause)

The user's instinct is correct and the cause is specific. The tells, in order of force:

- **The palette is a genre, not a choice.** Cream `#f7f5f2` + forest green `#3d6b40` +
  Instrument Serif italic + Geist Mono uppercase. Reassignable to any 2024-25 portfolio,
  journal, or SaaS doc site by swapping the logo.
- **One composition, four pages.** Italic-serif title → mono meta line → chip cloud →
  hairline rows. Home, Posts, Categories, and Tags are the same page with different labels.
- **Micro-label reflex.** Mono, 0.63rem, 0.18em tracking, uppercase — reused on nav, section
  labels, meta rows, badges, dates, tags, and chips. Everything small is dressed identically.
- **Pill reflex.** `border-radius: 100px` on `.tag`, `.link-pill`, `.article-cat-badge`,
  `.cat-btn`, `.category-cloud-item`, `.tag-cloud-item`.
- **Single-letter avatar circle.** `intro-avatar` and `about-avatar` are the same italic
  serif letter in a bordered circle — pure template furniture.
- **Hairline under everything.** A `1px solid var(--line)` rule under every row turns a
  blog index into a spreadsheet.
- **Dead evidence of assembly.** `.hero-eyebrow`, `.notes-*`, `.cat-filters`, `.cat-btn`,
  and the ignored `--w` weight are the fingerprints of a generated file that was then
  edited by deleting markup but not styles.

---

## What's working

- **Article reading experience.** `0.95rem` / `2.05` line-height, warm ink, and a 780px
  column are genuinely comfortable for Japanese prose. Keep this.
- **Static performance.** No hydration, no framework JS, no above-fold media. Nothing to
  fix here.
- **Semantic basics done right.** `lang="ja"` is set, real `<a href>` navigation, `<time datetime>`
  on every date, and heading levels follow document order.
- **Restrained accent.** One accent color, used sparingly for links and category marks
  rather than flooding the surface.

---

## Considered but rejected

| Location | Candidate | Rejected because |
|---|---|---|
| `src/styles/global.css:24` | Condemn `html { font-size: clamp(1rem, 0.945rem + 0.388vw, 1.2rem) }` as unpredictable | The clamp is deliberate and stays within 16-19.2px; it is not the cause of the input zoom (the input's own `rem` is) |
| `src/layouts/BaseLayout.astro:19` | Flag Google Fonts as a speed defect | One stylesheet, no JS, no CLS observed; not enough evidence to call it a finding |
| `src/layouts/MarkdownPostLayout.astro:100-104` | Condemn the always-dark `pre` block on a light theme | A fixed dark code block is a legitimate, common choice and reads well; not a defect |
| `src/components/Header.astro:35-39` | Condemn `backdrop-filter` blur | Harmless here, and it is the one place the design shows a considered surface treatment |
| `src/pages/posts.astro:73-77` | Call the DDG `sites=pixelog.net` search a privacy or UX defect | It works, is clearly labeled by its placeholder context, and is a reasonable no-backend choice |

---

## Verification

Checks run:

- `npm run build` in the project root → succeeded, 91 pages built, no errors.
- Read every layout, page, and the global stylesheet in `src/`.
- `grep` for `@media` across `src/` → **0 matches** (responsiveness finding confirmed).
- `grep` for `:focus` / `:focus-visible` / `outline:` → only two matches, both in `posts.astro`,
  one of which is `outline: none` (confirmed).
- `grep` for `<label`, `aria-`, `role=`, `alt=` across `src/` → no `<label>`, no `aria-*`,
  no `role`, no `alt` in the entire source.
- `grep` for `--ink-faint` / `--ink-light` → used 12 times, defined 0 times.
- `grep` for `prefers-reduced-motion` → 0 matches.
- `grep` for the 9 suspected dead selectors → present only in style blocks, never in markup.

Not verified:

- **Pixel rendering / screenshots.** No browser tool was available in this session, so
  320px header overflow (#4) is derived from layout arithmetic (fixed non-wrapping flex
  row, no media queries) rather than an observed screenshot. Confirm by resizing to 320px.
- **Screen reader output.** The unlabeled-field finding is from markup, not an AT listening test.
- **Real contrast measurement.** #6 uses computed WCAG ratios, not a sampled eyedropper.

---

## Next modes

- `/design smell` — produce the full AI-tells catalog before changing anything.
- `/design redesign` — replace the single repeated composition with per-surface layout.
- `/design relayout` — break the "italic title + meta line + hairline rows" formula.
- `/design a11y` — the four HIGH accessibility and responsive triggers.
- `/design typeset` — fix the flat article heading scale.
- `/design deslop` — strip the pill, micro-label, and italic-serif reflexes.

Generated with CommandCode — 2026-09-12
