export const CALLOUT_VARIANTS = ['info', 'tip', 'warn', 'danger'] as const;

export type CalloutVariant = (typeof CALLOUT_VARIANTS)[number];

export function isCalloutVariant(value: unknown): value is CalloutVariant {
  return CALLOUT_VARIANTS.some((variant) => variant === value);
}
