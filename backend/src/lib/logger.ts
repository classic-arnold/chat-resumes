type LogLevel = 'info' | 'warn' | 'error';

type LogContext = Record<string, unknown>;

const writeLog = (level: LogLevel, event: string, context?: LogContext) => {
  const prefix = `[${new Date().toISOString()}] ${level.toUpperCase()} ${event}`;

  if (context && Object.keys(context).length > 0) {
    const line = `${prefix} ${JSON.stringify(context)}`;

    if (level === 'error') {
      console.error(line);
      return;
    }

    console.log(line);
    return;
  }

  if (level === 'error') {
    console.error(prefix);
    return;
  }

  console.log(prefix);
};

export const logger = {
  error: (event: string, context?: LogContext) => writeLog('error', event, context),
  info: (event: string, context?: LogContext) => writeLog('info', event, context),
  warn: (event: string, context?: LogContext) => writeLog('warn', event, context),
};