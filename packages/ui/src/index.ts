export { cn } from './lib/cn';
export * from './types';

/* ── Primitives ─────────────────────────────────────────── */
export { Button } from './components/button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './components/button';

export { Badge, RiverStatusBadge } from './components/badge';
export type { BadgeProps, BadgeTone, RiverStatusBadgeProps } from './components/badge';

export {
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  CardFooter,
} from './components/card';
export type {
  CardProps,
  CardHeaderProps,
  CardTitleProps,
  CardBodyProps,
} from './components/card';

export { Section } from './components/section';
export type {
  SectionProps,
  SectionAlign,
  SectionTone,
  SectionDensity,
} from './components/section';

export { Reveal, RevealGroup } from './components/reveal';
export type { RevealProps, RevealGroupProps, RevealDirection } from './components/reveal';

export { StatCounter } from './components/stat-counter';
export type { StatCounterProps } from './components/stat-counter';

export { StatusPill, STATUS_LABELS } from './components/status-pill';
export type { StatusPillProps } from './components/status-pill';

export { Prose } from './components/prose';
export type { ProseProps, ProseSize, ProseWidth, ProseElement } from './components/prose';

export { EmptyState } from './components/empty-state';
export type { EmptyStateProps } from './components/empty-state';

/* ── Media ──────────────────────────────────────────────── */
export { VideoEmbed } from './components/video-embed';
export type { VideoEmbedProps } from './components/video-embed';

export { Gallery } from './components/gallery';
export type { GalleryProps, GalleryImage } from './components/gallery';

export { Figure } from './components/figure';
export type { FigureProps } from './components/figure';

/* ── Data visualisation ─────────────────────────────────── */
export { MetricBar } from './components/metric-bar';
export type { MetricBarProps } from './components/metric-bar';

export { ProgressBar } from './components/progress-bar';
export type {
  ProgressBarProps,
  ProgressTone,
  ProgressStatusTone,
  ProgressSize,
} from './components/progress-bar';

export { CampaignCard } from './components/campaign-card';
export type { CampaignCardProps } from './components/campaign-card';

export { ViewCounter } from './components/view-counter';
export type { ViewCounterProps } from './components/view-counter';

export { LiveIndicator } from './components/live-indicator';
export type { LiveIndicatorProps } from './components/live-indicator';

/* ── Engagement ─────────────────────────────────────────── */
export { ShareButtons } from './components/share-buttons';
export type { ShareButtonsProps, ShareLayout } from './components/share-buttons';

/* ── Navigation & theming ───────────────────────────────── */
export { ThemeProvider, ThemeSwitcher, useTheme, THEMES, THEME_LABELS } from './components/theme-provider';
export type {
  ThemeName,
  ThemeSource,
  ThemeContextValue,
  ThemeProviderProps,
  ThemeSwitcherProps,
} from './components/theme-provider';

export { Header } from './components/header';
export type { HeaderProps, NavItem } from './components/header';

export { Footer } from './components/footer';
export type {
  FooterProps,
  FooterColumn,
  FooterLink,
  FooterSocial,
  FooterContact,
} from './components/footer';

/* ── Forms ──────────────────────────────────────────────── */
export { Input } from './components/input';
export type { InputProps } from './components/input';

export { Textarea } from './components/textarea';
export type { TextareaProps } from './components/textarea';

export { Select } from './components/select';
export type { SelectProps, SelectOption } from './components/select';

export { CheckboxGroup } from './components/checkbox-group';
export type {
  CheckboxGroupProps,
  CheckboxGroupOption,
} from './components/checkbox-group';
