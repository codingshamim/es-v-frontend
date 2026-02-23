interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  variant?: "alert" | "full-width" | "inline";
  className?: string;
}

export function ErrorState({
  title = "Oops! Something went wrong",
  message,
  onRetry,
  variant = "full-width",
  className = "",
}: ErrorStateProps) {
  const handleRetry = onRetry || (() => window.location.reload());

  if (variant === "alert") {
    return (
      <div
        className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center ${className}`}
        role="alert"
      >
        <p className="text-red-700 dark:text-red-300 font-medium text-sm">
          {message}
        </p>
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div
        className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 ${className}`}
        role="alert"
      >
        <div className="flex items-start gap-3">
          <div className="shrink-0 mt-0.5">
            <svg
              className="w-5 h-5 text-red-600 dark:text-red-400"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
              {title}
            </h3>
            <div className="mt-2 text-sm text-red-700 dark:text-red-300">
              {message}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // full-width variant (default)
  return (
    <section
      className={`py-8 lg:py-16 bg-white dark:bg-black ${className}`}
      role="alert"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-8 text-center">
          {/* Error Icon */}
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-red-100 dark:bg-red-900/40 p-3">
              <svg
                className="w-8 h-8 text-red-600 dark:text-red-400"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>

          {/* Error Message */}
          <h2 className="text-lg font-semibold text-red-700 dark:text-red-300 mb-2">
            {title}
          </h2>
          <p className="text-red-600 dark:text-red-400 mb-6 text-sm">
            {message}
          </p>

          {/* Retry Button */}
          <button
            onClick={handleRetry}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors font-medium text-sm"
            aria-label="Retry loading"
          >
            Try Again
          </button>
        </div>
      </div>
    </section>
  );
}
