---
version: alpha
name: Hamddu-community-ui
description: Design direction for Hamddu screens outside the home technique map. Use this for Community, post detail, post creation, Profile, and related modals. Keep the home map art direction as-is.
references:
  - docs/design/awesome-design-md/design-md/pinterest/DESIGN.md
  - docs/design/awesome-design-md/design-md/notion/DESIGN.md
---

# Hamddu UI Design

## Scope

Applies to non-home-map surfaces:

- Community feed
- Post detail
- Post creation
- My page
- Profile certification lists and modals

Do not redesign the home technique map from this file.

## Visual Theme

Warm, tidy, craft-community UI. The app should feel handmade and soft, but still clear and native. Use image-first community cards, calm white information surfaces, and restrained orange accents.

Avoid fake data, heavy marketing sections, gradients, dark dashboard styling, and decorative blobs.

## Colors

- `primary`: `#FF7325` for primary actions, active states, and key icons.
- `primaryDeep`: `#C7521A` for pressed shadows or emphasis only.
- `cream`: `#FFF8F2` for home/map-adjacent surfaces only.
- `canvas`: `#FFFFFF` for community, detail, editor, and my page base.
- `surfaceSoft`: `#F7F5F2` for quiet grouped areas and empty states.
- `surfaceCard`: `#FFFFFF` for cards and sheets.
- `ink`: `#1A1A1A` for primary text.
- `body`: `#404040` for readable body copy.
- `muted`: `#8A8A8A` for metadata.
- `line`: `#ECECEC` for separators.
- `lineWarm`: `#EFE6DF` for warm home/map borders.

## Typography

Use the system font. No custom font dependency.

- Screen title: 22-24, weight 800, line height 30.
- Section title: 16-18, weight 800.
- Card title: 15-17, weight 800, line height 22.
- Body: 13-15, weight 400-600, line height 19-22.
- Metadata: 11-13, weight 600, muted color.
- Button: 14-16, weight 800.

Do not use viewport-scaled font sizes. Letter spacing should be `0` or only a small existing negative value where already used.

## Layout

- Base horizontal padding: 20.
- Dense list gap: 10-12.
- Section gap: 20-24.
- Touch targets: at least 44 high.
- Cards: radius 14-16, white background, 1px border. No nested cards.
- Modals/sheets: top radius 20-24, white background, handle at top.
- Bottom safe area must match the current screen background: home map uses cream, other pages use white.

## Community Feed

Use Pinterest-inspired image-first scanning, adapted to native lists:

- Posts with images should show a thumbnail immediately.
- Text-only posts stay compact.
- Metadata should not invent values. Hide missing fields.
- Category chips are small, quiet, and useful for scanning.
- Reactions and comment counts are secondary, not dominant.
- Avoid heavy shadows; use borders and spacing.

## Post Detail

- Keep the header native-feeling with icon-only back.
- Show only real author metadata.
- Do not show fake levels, fake view counts, or placeholder engagement.
- Body should be readable, with images full width where possible.
- Comment input must avoid the keyboard and keep enough scroll padding.

## My Page

Use Notion-like calm information grouping:

- White canvas.
- Clear profile summary at top.
- Show level, XP, and points only from API data.
- Certification cards should prioritize image and tutorial title.
- Empty states should be soft and factual.

## Forms And Keyboard

- All text entry screens need keyboard avoidance.
- Scroll content must have enough bottom padding for fixed footers.
- Modals with inputs must either move above the keyboard or scroll internally.
- Bottom tab bar should hide while typing.

## Do

- Use existing React Native primitives and existing dependencies.
- Keep screen-specific styles local unless duplication is painful.
- Prefer deletion or hiding over placeholder data.
- Verify with real iPhone screenshots when layout is visual.

## Do Not

- Do not add a new UI library for this redesign.
- Do not make landing-page style hero sections inside app tools.
- Do not show fake metrics.
- Do not use one-off decorative gradients or background blobs.
- Do not change the home technique map unless explicitly asked.
