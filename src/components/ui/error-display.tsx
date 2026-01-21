import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorDisplayProps {
  title?: string;
  message?: string;
  error?: Error | unknown;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
  variant?: 'default' | 'destructive' | 'outline';
}

export function ErrorDisplay({
  title = 'Something went wrong',
  message,
  error,
  onRetry,
  retryLabel = 'Try Again',
  className = '',
  variant = 'destructive',
}: ErrorDisplayProps) {
  const errorMessage =
    message ||
    (error instanceof Error ? error.message : typeof error === 'string' ? error : 'An unexpected error occurred');

  return (
    <Alert variant={variant} className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="mt-2">
        {errorMessage}
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="mt-3"
            aria-label={retryLabel}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {retryLabel}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}















