/** Props for the Card component */
export interface CardProps {
  /** Card title rendered in the header */
  title?: string;
  /** Subtitle rendered below the title */
  subtitle?: string;
  /** Card body content */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Action element rendered on the right side of the header */
  headerAction?: React.ReactNode;
  /** Footer content rendered below the body */
  footer?: React.ReactNode;
  /** Body padding size */
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingClasses: Record<NonNullable<CardProps['padding']>, string> = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-7',
};

/** Container card with optional header, footer, and configurable padding */
export function Card({
  title,
  subtitle,
  children,
  className = '',
  headerAction,
  footer,
  padding = 'md',
}: CardProps) {
  const hasHeader = title || subtitle || headerAction;

  return (
    <div
      data-testid="card"
      className={[
        'bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden',
        className,
      ].join(' ')}
    >
      {hasHeader && (
        <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-0">
          <div>
            {title && (
              <h3 className="text-lg font-semibold text-slate-900" data-testid="card-title">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-slate-500 mt-0.5" data-testid="card-subtitle">
                {subtitle}
              </p>
            )}
          </div>
          {headerAction && (
            <div className="shrink-0" data-testid="card-header-action">
              {headerAction}
            </div>
          )}
        </div>
      )}
      <div className={paddingClasses[padding]} data-testid="card-body">
        {children}
      </div>
      {footer && (
        <div
          className="border-t border-slate-200 px-5 py-3"
          data-testid="card-footer"
        >
          {footer}
        </div>
      )}
    </div>
  );
}
