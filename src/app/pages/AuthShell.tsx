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
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
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
  );
}
