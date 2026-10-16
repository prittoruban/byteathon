---
name: deck-dna
description: Build a brand-accurate PPTX deck from your own reference decks - extracted design DNA, a calibrated word budget, real backgrounds/fonts embedded so it renders identically anywhere, and a render-QA loop. Use whenever a deliverable is a slide deck that needs to look like your real client/brand decks, not a generic template.
---

# deck-dna - decks that sit next to your real reference decks without looking out of place

This is a **method**, not a fixed brand. It was proven on one specific brand's decks, then generalized so it works with whatever brand you're building for. There is nothing to install beyond Python itself - every helper script this skill needs is written inline below and created on the fly when it's needed. You (or whoever is running this skill for you) don't need to manage separate script files.

**Brand-compliant is not the same as designed.** A deck in the right colors with plain text boxes passes any style guide and still looks like a template. The thing that separates a designed deck from a flat one is composition: full-bleed imagery, a deliberate content zone, hero-weight stats, chaptering. Extract that from decks that already look right, don't invent it.

## Restrictions and hard rules (read first)

- **Don't invent or embellish data on a slide.** This skill styles numbers, it never upgrades them. If the numbers came from someone else's analysis, keep their sourcing and caveats intact on the slide or in the source line.
- **Name every data source on a slide.** If a slide mixes data from two different sources or methodologies, name both in its source line - don't let one attribution imply the other applies to all the numbers.
- **Never invent brand assets.** Don't redraw or re-rasterize a logo from memory, don't invent a color or font because it "seems right," and don't use AI-generated or stock-web imagery if the reference decks use real brand photography - it will look like a mismatch. If a required asset (logo, font, background) isn't supplied, stop and ask for it rather than substituting something.
- **Client-facing vs. internal changes what content is safe to show, not how much design effort goes in.** Build the internal version to the same visual standard as anything going to a client.
- **Never ship denser than the measured word budget** (see Step 2). Cut content or split the slide - don't shrink the font to cram more text in; that's the flat-template tell.
- **Never build on top of an existing reference deck** (see Step 3) - it drags in every unused layout/master slide that file ever had.
- **Font licensing is not automatic.** If you extract and embed a font from someone else's deck, check you're actually covered to redistribute it before shipping the new deck to a client.

## Step 0: Check your tools before you build

This method needs `python-pptx` and `Pillow` to build at all. LibreOffice + Poppler are needed only for the automated QA-render step in Step 5 - if they're not available, there's a manual fallback (open the deck directly in PowerPoint/Keynote/Google Slides and review slide by slide).

Before the first build, create and run this check:

```python
# preflight_check.py
import importlib.util, shutil, sys

required = [("pptx", "python-pptx", "pip install python-pptx"),
            ("PIL", "Pillow", "pip install Pillow")]
qa_tools = [("soffice", "LibreOffice", "https://www.libreoffice.org/download/download/"),
            ("pdftoppm", "Poppler", "brew install poppler / apt install poppler-utils / https://poppler.freedesktop.org/")]

def find_tool(exe):
    import os
    hit = shutil.which(exe)
    if hit: return hit
    # common Windows install locations that aren't on PATH by default
    for p in (rf"C:\Program Files\LibreOffice\program\{exe}.exe",
              rf"C:\Program Files (x86)\LibreOffice\program\{exe}.exe"):
        if os.path.exists(p): return p
    return None

missing_required = [(l, h) for m, l, h in required if importlib.util.find_spec(m) is None]
missing_qa = [(l, h) for e, l, h in qa_tools if find_tool(e) is None]

for m, l, h in required:
    print(f"[{'OK' if importlib.util.find_spec(m) else 'MISSING'}] {l}")
for e, l, h in qa_tools:
    hit = find_tool(e)
    print(f"[{'OK: ' + hit if hit else 'MISSING'}] {l}")

if missing_required:
    print("\nCannot build without these:")
    for l, h in missing_required: print(f"  - {l}: {h}")
    sys.exit(1)
if missing_qa:
    print("\nCan build, but no automated QA render. Fallback: review the .pptx by hand, slide by slide.")
    for l, h in missing_qa: print(f"  - missing {l}: {h}")
```

Run it, fix anything flagged as missing under "Cannot build without these," and note whether the QA tools are present (that decides whether Step 5 runs automated or manual).

## Step 1: Extract your design DNA from your own reference decks

Pick 2-3 decks that already look right for your brand or client (decks someone has approved, not a generic template). Note down, before writing any build code:

- **Composition:** where does imagery sit relative to text? (full-bleed bleeding from one side, split-panel, imagery as background texture, etc.) This is usually the single biggest gap between "looks designed" and "looks like a template."
- **Colors:** exact hex values pulled from the actual slides with an eyedropper, not the theme's stated accent color - deck themes frequently have a stated accent that doesn't match what's actually on the slides because of master-slide overrides.
- **Fonts:** what's actually embedded in the file (unzip the `.pptx`, check the `ppt/fonts/` folder) vs. what's just referenced by name. An unembedded font can render as a bad substitution on someone else's machine.
- **Recurring elements:** footer treatment, section-badge style, how a "big stat" is presented vs. a small one, bullet style, source-line format and placement.
- **Chaptering:** full-bleed divider slides between sections, or just headers? Reference decks usually alternate: a low-density divider, then 2-3 data slides, repeat. A wall of data slides in a row reads as a spreadsheet.

Write this down as a short DNA sheet before building anything.

## Step 2: Calibrate your word budget from the same references

Don't guess a words-per-slide target - measure it. Create and run this against your reference files:

```python
# calibrate_word_budget.py
import statistics, sys
from pptx import Presentation

def words_per_slide(path):
    prs = Presentation(path)
    return [(path, i, sum(len(sh.text_frame.text.split()) for sh in slide.shapes if sh.has_text_frame))
            for i, slide in enumerate(prs.slides, start=1)]

all_counts = []
for path in sys.argv[1:]:
    counts = words_per_slide(path)
    all_counts.extend(counts)
    values = [c for _, _, c in counts]
    print(f"{path}: {len(values)} slides, mean {statistics.mean(values):.1f}, median {statistics.median(values):.0f}, max {max(values)}")

values = [c for _, _, c in all_counts]
print(f"\nCombined: mean {statistics.mean(values):.1f}, median {statistics.median(values):.0f} words/slide")
top3 = sorted(all_counts, key=lambda x: -x[2])[:3]
print("Densest 3 slides (check whether these are outliers to exclude):")
for path, idx, count in top3:
    print(f"  {path} slide {idx}: {count} words")
```

Usage: `python calibrate_word_budget.py ref1.pptx ref2.pptx`. One limit: the script counts text boxes only, not text inside tables, so if your reference decks are table-heavy treat the measured number as a floor. Use the resulting **median**, rounded up slightly, as your ceiling for the new build - not the mean, since a couple of dense outlier slides shouldn't set the target. Restate it as a single rule before building: "â‰¤N words per slide, everything included, source line counts." After building, rerun the same word-count logic on the new deck and cut anything over budget.

## Step 3: Build fresh, don't build on top of a reference deck

Build on a **blank** `python-pptx` presentation. Write small reusable components matching what you found in Step 1: a base canvas (background treatment + footer + source line), a content-zone text block, a hero-stat block, a small-stat block, a badge, a bullet style. Reuse these across slides, but vary the *layout* (grid vs. single hero vs. ranked list vs. stacked rows) slide to slide so the deck doesn't read as one template stamped repeatedly.

**Craft rules for display type and stats** (every one of these was a real reviewer catch, not theory):

- **Control every line break in display type** (anything above ~28pt). Never let autowrap decide: split long headlines into explicit lines, and set no-wrap on stat boxes so a digit can't spill. In QA, hunt for widows (a one-word last line), and a dangling article at a line end ("open a / dashboard") - classic tells a typesetter would never allow.
- **Subordinate the unit glyph on hero stats.** Render %, x, $ at 50-60% of the numeral size on the same baseline, tight to the last digit. A full-size unit next to a huge numeral reads pasted-on.
- **Charts win or lose the credibility argument.** Flat fills, direct labels on the bars (no legend), no gridline noise, zero baseline with visually accurate proportions, accent color only on the focal series or current period. Skeptics ask for a chart before anything else.

## Step 4: Treat and embed your own assets

**Backgrounds** - if the DNA sheet calls for full-bleed photography, treat raw images so text sits on a legible zone rather than directly on a busy photo:

```python
# treat_bg.py - directional darken + fade-to-black, so text sits on a clean zone
import sys
from PIL import Image, ImageDraw, ImageEnhance

W, H = 1920, 1080

def treat(src, dst, darken=0.52, fade_end=0.58, solid=0.08):
    im = Image.open(src).convert("RGB").resize((W, H))
    im = ImageEnhance.Brightness(im).enhance(darken)
    if fade_end > 0:
        grad = Image.new("L", (W, H), 0); gd = ImageDraw.Draw(grad)
        for x in range(W):
            t = x / W
            a = 255 if t < solid else 0 if t > fade_end else int(255 * (1 - (t - solid) / (fade_end - solid)))
            gd.line([(x, 0), (x, H)], fill=a)
        im = Image.composite(Image.new("RGB", (W, H), (0, 0, 0)), im, grad)
    im.save(dst, quality=86)

if __name__ == "__main__":
    a = sys.argv
    treat(a[1], a[2], float(a[3]) if len(a) > 3 else 0.52, float(a[4]) if len(a) > 4 else 0.58)
```

Prefer flat, hard-edged shapes over soft radial glows: gradient smears and faint diagonal hatching have become a recognized signature of AI-generated decks. If you use a glow, blend it at low opacity so it reads as ambient texture, not effect. The script assumes 16:9 source images (it resizes to 1920x1080 without cropping), so crop non-16:9 images to 16:9 first or they'll look squashed. And never repeat the same background across slides in one deck if more than one option exists - repetition reads as template laziness.

**Fonts** - if your reference decks embed fonts (checked in Step 1), do the same so the deck renders true on any machine. This requires a one-time setup per brand: extract the font parts (`.fntdata` files) plus the `embeddedFontLst.xml` and font-relationship XML from an already-embedded, licensed reference deck (unzip its `.pptx` and look in `ppt/fonts/` and `ppt/presentation.xml`). That extracted package then gets injected into new builds as a post-build step. This is fiddly XML surgery - if you're not comfortable with it, skip embedding and instead confirm the fonts are installed on every machine that will open the deck, and flag that as a known limitation.

## Step 5: QA render loop (mandatory - decks always look different rendered than in the editor)

If Step 0 found LibreOffice + Poppler:
1. `soffice --headless --convert-to pdf deck.pptx` (on Windows, `soffice` is usually not on PATH; use the full path Step 0 printed, e.g. `"C:\Program Files\LibreOffice\program\soffice.exe"`)
2. `pdftoppm -jpeg -r 150 deck.pdf slide`
3. Look at every resulting slide image for text collisions, unexpected wrapping, overlapping elements, footer/margin spacing.

If either tool is missing: open the deck directly in PowerPoint/Keynote/Google Slides and step through every slide by hand for the same checks. Either way, do one final visual pass in the actual presentation app before sending - if a font isn't installed on the QA machine, LibreOffice substitutes something else, so its render is approximate on spacing/wrapping even when the file itself is correct.

## Step 6: Adversarial design review (optional but the single biggest quality jump)

After the render QA passes, hand the slide images to a second agent with a one-line brief: "You are a harsh senior presentation designer reviewing a portfolio. Approve only what a working designer would ship, name every amateur tell, and do not soften." Fix what it flags, re-render, send it back. Expect two or three rounds; that is the process working, not failing.

This step exists because the builder cannot see its own tells. In the build this method comes from, the reviewer rejected the first demo set outright (a system font posing as a brand look, gradient smears, a floating unaligned shape) and approved it two rounds later - none of those catches were visible from inside the build.

## Worked example

This method was extracted from a real build for a media-sales brand (full-bleed lifestyle photography fading to black on one side, a single accent color, two embedded font families, a badge-based section system, a fixed footer). That brand's specific colors, fonts, and word-count numbers aren't included here - they belong to that brand, not to this method. What transferred into this file is the process: preflight check, extract-your-own-DNA, calibrate-then-build, treat-then-embed, render-then-QA. Running Steps 1 and 2 on your own reference decks will produce different numbers, and that's the point.
