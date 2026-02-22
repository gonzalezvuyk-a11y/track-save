import type { CSSProperties, PropsWithChildren } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

const PIXELS = Array.from({ length: 36 }, (_, index) => {
  const left = (index * 17) % 100;
  const top = (index * 29) % 100;
  const size = 6 + (index % 5);
  const delay = (index % 12) * 0.28;
  const duration = 2.2 + (index % 5) * 0.4;
  const opacity = 0.44 + (index % 4) * 0.08;

  return {
    left,
    top,
    size,
    delay,
    duration,
    opacity,
  };
});

type AuthShellProps = PropsWithChildren<{
  title: string;
  description: string;
  introTitle?: string;
  introText?: string;
  introChips?: string[];
  showPixelBackground?: boolean;
  footerText?: string;
  footerLinkText?: string;
  footerLinkTo?: string;
}>;

export function AuthShell({
  title,
  description,
  introTitle,
  introText,
  introChips,
  showPixelBackground = true,
  footerText,
  footerLinkText,
  footerLinkTo,
  children,
}: AuthShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground flex items-center justify-center p-4">
      {showPixelBackground ? (
        <div className="auth-pixel-bg" aria-hidden="true">
          {PIXELS.map((pixel, index) => (
            <span
              key={`auth-pixel-${index}`}
              className="auth-pixel"
              style={
                {
                  '--pixel-left': `${pixel.left}%`,
                  '--pixel-top': `${pixel.top}%`,
                  '--pixel-size': `${pixel.size}px`,
                  '--pixel-delay': `${pixel.delay}s`,
                  '--pixel-duration': `${pixel.duration}s`,
                  '--pixel-opacity': pixel.opacity,
                } as CSSProperties
              }
            />
          ))}
        </div>
      ) : null}
      <div className="relative z-10 w-full max-w-md space-y-4">
        <div className="text-center py-2">
          <img src="/track-save-logo.svg" alt="track&save" className="mx-auto h-10 w-auto dark:hidden" />
          <img src="/track-save-logo-negative.svg" alt="track&save" className="mx-auto hidden h-10 w-auto dark:block" />
        </div>
        {introTitle && introText ? (
          <div className="text-center animate-fade-up">
            <p className="text-lg font-semibold tracking-tight">{introTitle}</p>
            <p className="mt-1 text-sm text-muted-foreground">{introText}</p>
          </div>
        ) : null}
        {introChips?.length ? (
          <div className="auth-intro-chips animate-fade-in animate-delay-1" aria-hidden="true">
            {introChips.map((chip) => (
              <span key={chip} className="auth-intro-chip">
                {chip}
              </span>
            ))}
          </div>
        ) : null}
        <Card className="w-full border-border/70 shadow-none">
        <CardHeader>
          <CardTitle className="text-2xl font-extrabold tracking-tight">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {children}
          {footerText && footerLinkText && footerLinkTo ? (
            <p className="text-sm text-muted-foreground">
              {footerText}{' '}
              <Link to={footerLinkTo} className="text-primary hover:underline">
                {footerLinkText}
              </Link>
            </p>
          ) : null}
        </CardContent>
        </Card>
      </div>
    </div>
  );
}
