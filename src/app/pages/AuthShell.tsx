import type { PropsWithChildren } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

type AuthShellProps = PropsWithChildren<{
  title: string;
  description: string;
  footerText?: string;
  footerLinkText?: string;
  footerLinkTo?: string;
}>;

export function AuthShell({
  title,
  description,
  footerText,
  footerLinkText,
  footerLinkTo,
  children,
}: AuthShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="rounded-[2rem] bg-primary text-primary-foreground px-6 py-7 text-center">
          <img src="/track-save-logo.svg" alt="track&save" className="mx-auto h-8 w-auto dark:hidden" />
          <img src="/track-save-logo-negative.svg" alt="track&save" className="mx-auto hidden h-8 w-auto dark:block" />
        </div>
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
