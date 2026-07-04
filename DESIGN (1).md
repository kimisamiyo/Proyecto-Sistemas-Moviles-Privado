# Design System Strategy: The Scholarly Monolith

## 1. Overview & Creative North Star
This design system is built for the high-end academic and professional landscape. Our Creative North Star is **"The Digital Atelier of Knowledge."** We are moving away from the "standard SaaS" aesthetic to create a space that feels as prestigious and permanent as a marble-clad university hall, yet as fluid as a modern digital gallery.

To achieve this, the system breaks from traditional "boxed" layouts. We utilize **intentional asymmetry**, high-ratio whitespace, and a sophisticated monochromatic palette to guide the user's eye. The goal is to feel "Luma-like"—effortless and premium—but with an added layer of institutional gravity. We replace "playful" interactions with "intentional" ones, focusing on crispness, metallic luster, and tonal depth.

---

## 2. Colors: The Metallic Spectrum
The palette is a curated range of deep charcoals, slate grays, and silver accents. It rejects the use of vibrant hues in favor of a "Silver & Stone" aesthetic.

### Surface Hierarchy & Nesting
Instead of a flat dark UI, we use "Tonal Layering." The UI is treated as a series of physical layers where importance is signaled by a shift in depth.
- **`surface` (#0e0e0e):** The canvas. Used for the primary background of the application.
- **`surface_container_low` (#131313):** Secondary sectioning, used for sidebars or subtle background shifts in long-scroll layouts.
- **`surface_container_high` (#1f2020):** Primary interactive containers, such as event cards or academic papers.
- **`surface_container_highest` (#252626):** Active states, hover effects, or "elevated" overlays.

### The "No-Line" Rule
Standard 1px solid borders for sectioning are prohibited. Layout boundaries must be defined through background color shifts. For example, a card using `surface_container_high` should sit directly on a `surface` background without a stroke. The contrast alone provides the definition, resulting in a cleaner, more editorial appearance.

### Glass & Gradient Rule
For floating elements (modals, dropdowns, navigation bars), use **Glassmorphism**. Combine `surface_container_highest` with a 40% opacity and a `backdrop-blur(20px)`. This creates a "frosted silver" effect that feels high-end and breathable. Use a subtle linear gradient on primary CTAs (from `primary` #c1c7cf to `primary_container` #41474e) to simulate a metallic, brushed-aluminum finish.

---

## 3. Typography: Editorial Rhythm
We use **Manrope** exclusively. Its geometric yet scholarly construction allows it to bridge the gap between modern tech and academic tradition.

*   **Display Scale (`display-lg` to `display-sm`):** These are the "Statement" levels. Use these for event titles or keynote speakers. They should be set with tight letter-spacing (-0.02em) to feel authoritative and monolithic.
*   **Headline & Title Scale:** These provide structure. Use `headline-md` (1.75rem) for section headers. They should always have generous top-marge padding to respect the content below.
*   **Body & Label Scale:** `body-md` (0.875rem) is our workhorse. For technical metadata (dates, locations, academic credentials), use `label-sm` (0.6875rem) in all-caps with a slight letter-spacing (+0.05em) to mimic the "cataloging" look of a museum.

---

## 4. Elevation & Depth: Tonal Layering
In this system, "Elevation" is a measure of light, not just shadows.

*   **The Layering Principle:** Depth is achieved by stacking. Place a `surface_container_lowest` (#000000) card on a `surface_container_low` (#131313) section to create a soft "recessed" look.
*   **Ambient Shadows:** Floating elements (like an RSVP modal) require a shadow that feels like ambient light. Use a 48px blur with only 6% opacity, using the `on_surface` color as the shadow tint. This avoids the "dirty" look of standard black shadows.
*   **The "Ghost Border" Fallback:** If a container requires extra definition (e.g., in high-density data views), use a **Ghost Border**. Use the `outline_variant` (#484848) token at 15% opacity. This creates a "crisp" edge that is felt rather than seen.

---

## 5. Components: Refined Primitives

### Buttons
*   **Primary:** Filled with `primary` (#c1c7cf), text in `on_primary` (#3a4147). This creates a high-contrast, silver-on-charcoal look. Use a `md` (0.375rem) corner radius for a sharp, professional finish.
*   **Secondary:** Ghost style. No background, `outline` (#767575) border at 20% opacity.
*   **Tertiary:** Text-only using `primary` color, used for low-priority actions like "Cancel."

### Cards & Lists
*   **Forbidden:** Divider lines between list items.
*   **Alternative:** Use 16px of vertical white space from the spacing scale. For list items, use a subtle hover state change to `surface_bright` (#2b2c2c).
*   **Academic Cards:** Use `surface_container_high` with a 2px "Silver Accent" (the `primary` token) on the top edge only to denote featured sessions.

### Input Fields
Text inputs should feel like a physical form. Use `surface_container_low` for the field background with a `none` border. On focus, transition the background to `surface_container_highest` and add a 1px "Ghost Border" using the `primary` token at 40% opacity.

---

## 6. Do's and Don'ts

### Do
*   **Do** use asymmetrical layouts. For example, a hero section with text aligned left and a large, high-quality image offset to the right, breaking the container edge.
*   **Do** prioritize "Breathing Room." If you think there is enough padding, add 8px more.
*   **Do** use `secondary` (#909fb4) for "de-emphasized" text like timestamps or secondary labels to maintain the cool, metallic tone.

### Don't
*   **Don't** use pure white (#FFFFFF) for text. Always use `on_surface` (#e7e5e5) to reduce eye strain in dark mode and maintain a premium, slightly muted look.
*   **Don't** use "Card Shadows" for everything. Reserve shadows for elements that physically move over others (dropdowns, modals).
*   **Don't** use vibrant colors for errors. Use the sophisticated `error` (#ee7d77) and `error_container` (#7f2927) to signal issues without breaking the "monolith" aesthetic.
##