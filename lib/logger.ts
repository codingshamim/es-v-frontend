/**
 * Structured logger. Replace with Sentry or similar in production for alerting.
 */

type LogLevel = "info" | "warn" | "error" | "debug";

function formatMessage(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  const payload = {
    time: new Date().toISOString(),
    level,
    message,
    ...(meta && Object.keys(meta).length > 0 ? { meta } : {}),
  };
  return process.env.NODE_ENV === "production"
    ? JSON.stringify(payload)
    : `${payload.time} [${level}] ${message}${meta ? ` ${JSON.stringify(meta)}` : ""}`;
}

export const logger = {
  info(message: string, meta?: Record<string, unknown>) {
    console.log(formatMessage("info", message, meta));
  },
  warn(message: string, meta?: Record<string, unknown>) {
    console.warn(formatMessage("warn", message, meta));
  },
  error(message: string, meta?: Record<string, unknown>) {
    console.error(formatMessage("error", message, meta));
  },
  debug(message: string, meta?: Record<string, unknown>) {
    if (process.env.NODE_ENV === "development") {
      console.debug(formatMessage("debug", message, meta));
    }
  },
};
