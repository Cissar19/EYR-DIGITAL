# Design System Specification

## 1. Overview & Creative North Star: "The Digital Curator"

This design system moves away from the rigid, utilitarian aesthetic common in legacy educational software. Our Creative North Star is **"The Digital Curator"**—a philosophy that treats information not as a list to be managed, but as a space to be inhabited. 

To achieve this, we prioritize **intentional asymmetry** and **tonal depth**. Educators navigate complex data; our job is to use "soft minimalism" to reduce cognitive load. We break the "template" look by overlapping card elements, utilizing high-contrast typography scales (pairing the approachable *Plus Jakarta Sans* with the functional *Inter*), and replacing harsh borders with subtle color-field transitions. The interface should feel as fluid and natural as a well-organized physical classroom.

---

## 2. Colors

The palette is rooted in sophisticated purples and vibrant secondary tones to feel both authoritative and energetic.

*   **Primary & Secondary:** Use `primary` (#4e45e4) and `secondary` (#742fe5) to drive the main action hierarchy. These are deep, "ink-like" colors that ground the experience.
*   **Surface & Background:** The foundation is `background` (#fdf7ff). It is not pure white; it has a hint of warmth to reduce eye strain during long grading sessions.
*   **The "No-Line" Rule:** 1px solid borders are strictly prohibited for sectioning. To separate the sidebar from the main content or a header from a body, use background shifts. For example, a sidebar should use `surface_container_low` against the main `background`.
*   **Surface Hierarchy & Nesting:** Use the `surface_container` tiers to create organic depth.
    *   *Level 0:* `background` (The base).
    *   *Level 1:* `surface_container_low` (Large structural sections).
    *   *Level 2:* `surface_container_highest` (Interactive cards or focused widgets).
*   **The "Glass & Gradient" Rule:** For floating modals or navigation overlays, use `surface_container_lowest` with a 80% opacity and a 20px backdrop-blur. Main CTAs should utilize a subtle linear gradient from `primary` to `primary_dim` to provide a tactile, premium feel.

---

## 3. Typography

Our typography establishes a clear editorial rhythm, ensuring educators can scan student data quickly.

*   **Display & Headlines (Plus Jakarta Sans):** These are our "Personality" fonts. Use `display-lg` (3.5rem) and `headline-md` (1.75rem) to introduce major sections. The generous x-height of Plus Jakarta Sans provides a modern, friendly character.
*   **Titles & Body (Inter):** These are our "Functional" fonts. `title-md` (1.125rem) should be used for card headings, while `body-md` (0.875rem) handles the bulk of the data. 
*   **The Contrast Principle:** Always pair a `headline-sm` with a `body-sm` in `on_surface_variant` (#635984) to create a clear "Title/Caption" relationship without needing lines to group them.

---

## 4. Elevation & Depth

We achieve hierarchy through **Tonal Layering** rather than structural shadows.

*   **The Layering Principle:** A "Summary Card" (e.g., student attendance) should be `surface_container_highest` (#e8deff) sitting on a `surface_container_low` (#f8f1ff) background. This creates a soft, natural lift.
*   **Ambient Shadows:** If an element must "float" (like a dropdown or a primary Action Button), use a shadow with a blur of 24px and an opacity of 6%, tinted with `on_surface` (#362c55). 
*   **The "Ghost Border" Fallback:** In high-density data tables where boundaries are essential for accessibility, use the `outline_variant` token at 15% opacity. Never use 100% opaque lines.
*   **Glassmorphism:** Use `surface_bright` with a backdrop filter of `blur(12px)` for headers that stay pinned as the user scrolls, allowing the "soul" of the content colors to peek through.

---

## 5. Components

### Buttons
*   **Primary:** Solid `primary` background with `on_primary` text. Use `rounded-lg` (1rem).
*   **Secondary:** `secondary_container` background with `on_secondary_container` text. These should feel softer and less urgent.
*   **Tertiary:** No background. Use `primary` text. Reserved for low-emphasis actions like "Cancel" or "View All."

### Cards
*   **Style:** Forbid divider lines. Use `spacing-6` (1.5rem) padding to let content breathe. 
*   **Nesting:** Place "Metric Chips" (e.g., "5 Exams") inside cards using `surface_container_lowest` to create a "punched-out" effect.

### Input Fields
*   **Standard:** Use `surface_container_lowest` with a `ghost border` (10% `outline`). When focused, the border transitions to a 2px `primary` stroke.
*   **Labels:** Always use `label-md` in `on_surface_variant`.

### Progressive Chips
*   **Status Chips:** Use `tertiary_container` for positive states (Approved) and `error_container` for alerts (Pending). Use `rounded-full` to distinguish them from rectangular buttons.

### Sidebar (The Navigation Anchor)
*   The sidebar should be a contiguous block of `surface_container_low`. Active items should not use a background color but rather a thick 4px vertical "pill" indicator in `primary` and a weight shift in typography.

---

## 6. Do's and Don'ts

### Do:
*   **Do** use vertical white space (from the `Spacing Scale`) to define groups of information.
*   **Do** use `rounded-xl` (1.5rem) for main dashboard containers to reinforce the "friendly" brand pillar.
*   **Do** use `on_surface_variant` for metadata to create a clear visual hierarchy against main titles.

### Don't:
*   **Don't** use pure black (#000000) for text. Always use `on_surface` (#362c55) to maintain the sophisticated purple-tinted depth.
*   **Don't** use standard 1px borders to separate list items. Use a `0.5px` shift in background color or `spacing-2` (0.5rem) of clear air.
*   **Don't** use "drop shadows" that are grey. Shadows must always be a transparent tint of the brand's dark purple `on_surface` color.