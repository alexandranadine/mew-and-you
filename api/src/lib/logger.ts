type LogLevel = "info" | "warn" | "error";

/**
 * Minimal structured (JSON-line) logger. Callers must only pass safe,
 * non-secret metadata — never headers, tokens, or API keys.
 */
function log(
  level: LogLevel,
  message: string,
  meta: Record<string, unknown> = {},
): void {
  const entry = { level, message, time: new Date().toISOString(), ...meta };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) =>
    log("info", message, meta),
  warn: (message: string, meta?: Record<string, unknown>) =>
    log("warn", message, meta),
  error: (message: string, meta?: Record<string, unknown>) =>
    log("error", message, meta),
};
