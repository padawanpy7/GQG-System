---
name: GQG System
colors:
  surface: '#fbf8fa'
  surface-dim: '#dcd9db'
  surface-bright: '#fbf8fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f4'
  surface-container: '#f0edef'
  surface-container-high: '#eae7e9'
  surface-container-highest: '#e4e2e3'
  on-surface: '#1b1b1d'
  on-surface-variant: '#45474c'
  inverse-surface: '#303032'
  inverse-on-surface: '#f3f0f1'
  outline: '#75777d'
  outline-variant: '#c5c6cd'
  surface-tint: '#555f71'
  primary: '#182232'
  on-primary: '#ffffff'
  primary-container: '#2d3748'
  on-primary-container: '#96a0b5'
  inverse-primary: '#bdc7dc'
  secondary: '#505f76'
  on-secondary: '#ffffff'
  secondary-container: '#d0e1fb'
  on-secondary-container: '#54647a'
  tertiary: '#2c1f07'
  on-tertiary: '#ffffff'
  tertiary-container: '#43341a'
  on-tertiary-container: '#b29c7b'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d9e3f9'
  primary-fixed-dim: '#bdc7dc'
  on-primary-fixed: '#121c2c'
  on-primary-fixed-variant: '#3d4759'
  secondary-fixed: '#d3e4fe'
  secondary-fixed-dim: '#b7c8e1'
  on-secondary-fixed: '#0b1c30'
  on-secondary-fixed-variant: '#38485d'
  tertiary-fixed: '#f8dfba'
  tertiary-fixed-dim: '#dbc39f'
  on-tertiary-fixed: '#261903'
  on-tertiary-fixed-variant: '#554429'
  background: '#fbf8fa'
  on-background: '#1b1b1d'
  surface-variant: '#e4e2e3'
typography:
  display:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-caps:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  tabular-num:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  margin: 24px
---

## Brand & Style

The design system is engineered for high-precision financial data entry and long-duration internal usage. The brand personality is **utilitarian, disciplined, and calm**, prioritizing cognitive ease over visual flair. 

The aesthetic is a blend of **Modern Minimalism and Editorial Design**, characterized by a rigorous grid, generous whitespace despite high information density, and a restricted color palette. By removing all non-functional decorative elements—such as gradients, glows, and drop shadows—the UI directs the user’s focus entirely toward the data. The emotional response is one of reliability and quiet authority, essential for a B2B accounting environment where accuracy is paramount.

## Colors

The palette is strictly neutral to reduce eye strain.
- **Background & Surface:** An off-white base (#F9FAFB) provides a soft canvas, while white (#FFFFFF) is used for active surface cards to create subtle, shadowless depth.
- **Accent:** Muted Ink Blue (#2D3748) is used only for primary actions and state indicators, ensuring it retains its communicative power without overwhelming the interface.
- **Borders:** A universal hairline gray (#E5E7EB) defines the structure.
- **Feedback:** Success, error, and warning states should use desaturated, "ink-like" versions of green, red, and amber to maintain the editorial tone.

## Typography

The system utilizes **Inter** for all UI copy due to its exceptional legibility at small sizes. 
- **Tabular Figures:** All financial figures, quantities, and dates must use **JetBrains Mono** or Inter with `tnum` (tabular numbers) OpenType features enabled. This ensures vertical alignment of decimal points in columns.
- **Hierarchy:** We use a tight scale to maintain information density. Headings are never oversized; instead, weight and capitalization provide contrast.
- **Readability:** High contrast (Ink Blue on White) is maintained for all body text, with a secondary gray reserved only for non-essential metadata.

## Layout & Spacing

This design system employs a **Fixed Grid** philosophy for desktop layouts to ensure data columns remain predictable and scannable. 
- **The 4px Rule:** All spacing increments are multiples of 4px.
- **Density:** Padding inside data tables and input rows is kept tight (8px vertical) to maximize the amount of information visible on one screen.
- **Alignment:** Content should be strictly left-aligned for text and right-aligned for currency values. 
- **Breakpoints:** The system is optimized for 1440px displays. On smaller screens (Tablets), the side navigation collapses into an icon-only bar, preserving horizontal space for data tables.

## Elevation & Depth

This design system avoids physical metaphors like shadows and blurs. Depth is conveyed through **Tonal Layering and Borders**:
- **Level 0 (Background):** #F9FAFB.
- **Level 1 (Cards/Work Areas):** #FFFFFF with a 1px solid #E5E7EB border.
- **Level 2 (Modals/Popovers):** #FFFFFF with a slightly darker 1px solid #D1D5DB border to differentiate from the base surface.
- **Focus State:** Active inputs or selected rows use a subtle 1px inset or 2px solid border in the primary Ink Blue, rather than an outer glow.

## Shapes

To reinforce the architectural and professional feel of the system, shapes are kept nearly square. A consistent **6px radius** (defined as `roundedness: 1` / `0.375rem`) is applied to buttons, input fields, and cards. This slight rounding prevents the UI from feeling aggressive while maintaining the rigid, editorial structure of the grid.

## Components

- **Buttons:** Primary buttons are solid #2D3748 with white text. Secondary buttons are white with a 1px gray border and dark text. Text is centered and bold.
- **Input Fields:** Rectangular with 1px gray borders. Labels are placed above the field in `label-caps` style. Placeholder text is light gray (#9CA3AF).
- **Data Tables:** The core of the system. Rows have a 1px bottom border only. Header cells use a light gray background (#F3F4F6) and `label-caps` typography. Hover states on rows use a very pale blue tint (#F1F5F9).
- **Chips:** Small, square-ish badges with light gray backgrounds and no borders. Used for status indicators (e.g., "Pending", "Paid").
- **Checkboxes:** Simple 16px squares with a 1px border. When checked, they fill with the primary Ink Blue and a white checkmark.
- **Invoicing Specifics:** Line-item editors must feature a "drag-to-reorder" handle and a clear "Delete" icon that only appears on row-hover to reduce visual noise.