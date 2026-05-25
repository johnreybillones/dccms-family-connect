# Design System

## Visual Direction

The public site should feel friendly, child-centered, and trustworthy while still being clear
enough for barangay and daycare staff. Use bright imagery, large readable headings, soft cards,
and simple navigation. Avoid corporate dashboard styling on public pages.

## Fonts

Fonts are imported in `src/styles.css`:

- Display: `Fredoka`
- Body: `Nunito`

Use `font-display` for headings, navigation labels, and prominent calls to action. Body copy
should use the default body font.

## Color Tokens

Theme tokens live in `src/styles.css` and are registered through Tailwind v4 `@theme inline`.
Use semantic utilities instead of hard-coded colors where possible:

- `brand` / `primary`: main blue identity color
- `accent-red`: primary action and alert accent
- `sky`: daycare-themed section background
- `background`, `foreground`, `card`, `muted`, `border`: shared UI surfaces

All design token colors in `src/styles.css` use `oklch`. Keep new token values in the same
format.

## Layout Patterns

Public pages should generally use `PublicLayout`, which provides the sticky navbar, main
content area, and footer. Keep content constrained with `max-w-7xl` or narrower text containers.
Use responsive grids for repeated page content and preserve comfortable mobile spacing.

The current visual style uses rounded cards, image-forward sections, and strong call-to-action
buttons. Match existing radius and shadow usage unless a specific change requires otherwise.

## Assets

Use imported images from `src/assets/`. Current assets include the barangay seal, hero daycare
image, feature images, announcement image, and about-class image. Add descriptive `alt` text for
meaningful images. Decorative images may use empty `alt=""`.

Do not replace official or context-specific imagery with generic stock-like images unless the
task explicitly asks for it.

## Components

Use existing shared components before adding new ones. Route-level one-off sections may stay in
the route file when they are not reused. Promote repeated UI to `src/components/`; use
`src/components/ui/` for reusable primitives that are not page-specific.

Use `lucide-react` icons for standard UI actions and contact affordances.

## Accessibility

Keep navigation keyboard-accessible. Buttons must have labels or accessible names. Use sufficient
contrast on text placed over images. Form fields need associated labels, and placeholders should
not be the only source of meaning.
