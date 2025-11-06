/**
 * Reusable loading indicator component
 * Displays an animated spinner with optional message and configurable size
 */
interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function LoadingSpinner({
  message,
  size = 'md',
}: LoadingSpinnerProps) {
  const sizeClasses = { sm: 'w-6 h-6', md: 'w-12 h-12', lg: 'w-16 h-16' };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div
        className={`${sizeClasses[size]} border-primary/20 border-t-primary animate-spin rounded-full border-4`}
      ></div>
      {message && <p className="text-muted-foreground mt-4">{message}</p>}
    </div>
  );
}
