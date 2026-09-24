---
name: Academic Enterprise Sarpras
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#444653'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#757684'
  outline-variant: '#c5c5d5'
  surface-tint: '#3a55c1'
  primary: '#001a67'
  on-primary: '#ffffff'
  primary-container: '#002b9a'
  on-primary-container: '#869dff'
  inverse-primary: '#b8c4ff'
  secondary: '#6e5e00'
  on-secondary: '#ffffff'
  secondary-container: '#fcd801'
  on-secondary-container: '#6f5e00'
  tertiary: '#500003'
  on-tertiary: '#ffffff'
  tertiary-container: '#790008'
  on-tertiary-container: '#ff7a6f'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dde1ff'
  primary-fixed-dim: '#b8c4ff'
  on-primary-fixed: '#001354'
  on-primary-fixed-variant: '#1c3ba8'
  secondary-fixed: '#ffe25e'
  secondary-fixed-dim: '#e6c500'
  on-secondary-fixed: '#221b00'
  on-secondary-fixed-variant: '#534600'
  tertiary-fixed: '#ffdad6'
  tertiary-fixed-dim: '#ffb4ab'
  on-tertiary-fixed: '#410002'
  on-tertiary-fixed-variant: '#93000d'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 30px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 30px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.04em
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.25rem
  gutter-mobile: 0.75rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system establishes a high-efficiency enterprise governance platform for university asset, facilities, and logistics infrastructure management (Sistem Informasi Manajemen Sarana dan Prasarana). Built directly around the institutional heritage of Universitas Pamulang, the visual language balances solemn academic authority with modern civic administrative clarity.

### Target Audience & User Context
The primary users include campus asset managers, procurement teams, department heads, maintenance technicians, university executives, and administrative staff across multiple campuses (Pamulang, Viktor, Witana Harja, Serang). The interface must accommodate rapid daily operations: QR asset audits, procurement ticketing, space allocation, maintenance dispatching, and high-level inventory auditing.

### Design Movement & Aesthetic
- **Modern Corporate / Institutional SaaS**: Clean white and cool slate surfaces paired with authoritative deep navy and vibrant institutional gold accents extracted faithfully from the official emblem.
- **High Utility & Density**: Dense information architecture with strict visual hierarchy, zero ornamental bloat, and scannable administrative data grids.
- **Accessible & Trustworthy**: Strong contrast ratios (exceeding WCAG 2.1 AA/AAA), unambiguous status signaling, and structured layout integrity that projects stability and operational excellence.

## Colors

The color system derives its core chromatic hierarchy directly from the official Universitas Pamulang emblem: vibrant institutional yellow/gold (`#FCD800`), deep royal blue (`#002B9A`), clean white (`#FFFFFF`), with vital accents of cardinal red (`#E01B22`) and leaf emerald (`#009A44`) taken from the emblem's core petals.

### Functional Palette Structure
- **Primary (`#002B9A`)**: The commanding institutional royal blue. Applied to active navigation items, primary actionable triggers, interactive links, selection states, and prominent key metrics.
- **Secondary / Institutional Brand Yellow (`#FCD800`)**: The iconic UNPAM gold. Utilized selectively for high-visibility highlights, pending approval statuses, badge accents, and attention callouts. Due to its brightness, it is never used for light text over white; instead, it provides solid fills with dark slate navy text (`#0F172A`).
- **Tertiary / Critical Crimson (`#E01B22`)**: Extracted from the emblem’s outer ring. Serves as the system-wide danger and critical alert state: decommissioned assets, urgent maintenance requests, budget overruns, and destructive actions.
- **Success / Botanical Green (`#009A44`)**: Extracted from the center emblem leaves. Governs operational readiness, active assets, approved purchase orders, and completed maintenance tasks.
- **Neutrals & Surfaces**:
  - `Surface Base`: `#F8FAFC` (Slate-50) for the application backdrop to reduce eye strain during extended work shifts.
  - `Surface Card`: `#FFFFFF` with razor-sharp `#E2E8F0` (Slate-200) borders.
  - `Sidebar / Header Scaffolding`: `#0A192F` or `#0F172A` deep administrative navy, creating an anchor frame for top-level navigation.
  - `Text Primary`: `#0F172A` (Deep Slate-900) ensuring maximum legibility.
  - `Text Muted`: `#64748B` (Slate-500) for metadata, table subheaders, and helper labels.

## Typography

**Plus Jakarta Sans** is selected as the unified typographic engine across headlines, body copy, and UI controls. Created with crisp geometric proportions and open apertures, it delivers exceptional legibility on dense data screens, audit tables, and complex multi-column forms common in Indonesian higher education systems.

### Scale Rules
- Numerical tracking codes, BMN / Sarpras item serials, and room asset barcodes leverage a complementary monospaced font (`JetBrains Mono`) for unambiguous digit differentiation.
- Section headers utilize negative tracking (`-0.015em` to `-0.02em`) at scale to maintain tight horizontal momentum.
- Data table cells and micro tags employ uppercase or semi-bold variants (`label-md` and `label-sm`) with positive letter-spacing (`0.02em` to `0.04em`) to ensure instant scanning under high-density loads.

## Layout & Spacing

The layout model is anchored by a 12-column fluid grid system designed for data-intensive enterprise workflows.

### Grid & Canvas Structure
- **Desktop (1280px and above)**: Fixed collapsible administrative sidebar (260px expanded, 72px condensed icon mode) paired with an elastic fluid canvas. Outer content margins default to `2rem` (`32px`) with `1.25rem` (`20px`) gutters between grid columns.
- **Tablet (768px – 1024px)**: Sidebar shifts to an off-canvas drawer. Outer content margins reduce to `1.5rem` (`24px`) with `1rem` (`16px`) gutters.
- **Mobile (< 768px)**: Single-column reflow for cards and asset lists, sticky action footers for approvals, with `1rem` (`16px`) outer margins and `0.75rem` (`12px`) gutters.

### Spacing Density
Spacing strictly honors an 8-point structural system, with a 4-point sub-increment for micro-alignments:
- Compact data tables utilize `space-sm` (`8px`) vertical cell padding for rapid multi-row scanning.
- Dashboard KPI widgets and container panels employ `space-lg` (`24px`) interior padding.
- Input groups and form fields maintain a `space-md` (`16px`) relational separation.

## Elevation & Depth

To preserve an orderly academic administrative feel, the design system avoids heavy drop shadows and dramatic skeuomorphism, relying instead on clean tonal layers, crisp 1px structural borders, and subtle ambient shadows.

### Elevation Hierarchy
- **Level 0 (Canvas Surface)**: Neutral tint (`#F8FAFC`). Flat baseline.
- **Level 1 (Cards, Metric Containers, Table Wrappers)**: Solid white (`#FFFFFF`) with a 1px border (`#E2E8F0`) and an ambient shadow: `0 1px 3px rgba(15, 23, 42, 0.05), 0 1px 2px rgba(15, 23, 42, 0.03)`.
- **Level 2 (Active Dropdowns, Filter Flyouts, Asset Detail Drawers)**: Pure white background with border `#CBD5E1` and ambient shadow: `0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -2px rgba(15, 23, 42, 0.04)`.
- **Level 3 (Modal Dialogs, QR Code Verification Overlays)**: Surface white centered over a 60% opacity dark slate backdrop (`rgba(15, 23, 42, 0.60)` with a 4px blur filter), utilizing deep ambient diffusion: `0 20px 25px -5px rgba(15, 23, 42, 0.12), 0 10px 10px -5px rgba(15, 23, 42, 0.06)`.

## Shapes

The design system adopts a **Soft (`1`)** roundedness profile. This restrained corner radius communicates institutional stability, discipline, and architectural precision fitting for campus infrastructure and asset oversight.

### Radius Scale
- `rounded-none`: 0px — Used for split table cells, segmented controls in joined mode.
- `rounded-default`: `0.25rem` (`4px`) — Badges, inline status tags, data table selection indicators, tooltips.
- `rounded-md`: `0.375rem` (`6px`) — Form controls, text fields, dropdown triggers, standard action buttons.
- `rounded-lg`: `0.5rem` (`8px`) — Stat cards, panels, popovers, asset inventory summary blocks.
- `rounded-xl`: `0.75rem` (`12px`) — Modal windows, media asset preview boxes, full dashboard card groupings.
- `rounded-full`: `9999px` — User avatars, icon-only pill indicators, quick status dots.

## Components

### Buttons
- **Primary Action**: Solid UNPAM Royal Blue (`#002B9A`) fill with crisp white text, `6px` border-radius, font weight 600. Hover: `#002175`. Focus: 3px ring of `#002B9A` at 30% opacity.
- **Secondary / Highlight**: UNPAM Yellow (`#FCD800`) fill with Slate Navy (`#0F172A`) bold text. Hover: `#E5C400`. Used for "Ajukan Pengadaan", "Verifikasi Sarpras", or primary CTA within contextual headers.
- **Outline / Ghost**: Transparent surface with 1px border (`#CBD5E1`), text `#0F172A`. Hover: `#F1F5F9`.
- **Destructive**: Cardinal Crimson (`#E01B22`) solid with white text for asset scrap/delete actions.

### Badges & Status Chips
- **Pending / In Review**: Background `#FEF9C3` (soft gold/yellow tint), text `#854D0E`, border `#FDE047`.
- **Active / Operational**: Background `#DCFCE7` (soft emerald tint), text `#166534`, border `#86EFAC`.
- **Maintenance / Repair**: Background `#EFF6FF` (soft royal blue tint), text `#1E40AF`, border `#BFDBFE`.
- **Damaged / Scrapped**: Background `#FEE2E2` (soft red tint), text `#991B1B`, border `#FCA5A5`.

### Form Fields & Inputs
- Height: Standardized to 40px for standard density and 34px for compact data-entry modes.
- Visual state: 1px border `#CBD5E1` on white background, transitioning to a focused `#002B9A` border with a 3px matching glow (`rgba(0, 43, 154, 0.15)`).
- Error state: 1px border `#E01B22`, accompanied by 12px error copy and exclamation alert icons.

### Checkboxes & Radios
- Square checkbox (`4px` radius) and circular radio.
- Inactive: `#FFFFFF` fill with `#94A3B8` border.
- Checked: Institutional Blue (`#002B9A`) fill with crisp white checkmark or center dot.

### Data Tables & Asset Logs
- Header row: `#F8FAFC` background with subtle uppercase typography (`label-sm`), `#475569` text, bottom border `#E2E8F0`.
- Data rows: Zebra striping optional (alternating `#FFFFFF` and `#FAFAFA`). Hover state triggers `#F1F5F9`.
- Action column: Sticky right alignment with quick-action icon buttons (Edit, Print QR, Detail).

### Administrative Header & Sidebar
- Header contains the authentic Universitas Pamulang emblem in unskewed circular lockup alongside the system designation: **SIMSARPRAS UNPAM**.
- Sidebar navigation features distinct visual separation: active modules display an authoritative vertical indicator bar in UNPAM Gold (`#FCD800`) against the dark royal slate background.