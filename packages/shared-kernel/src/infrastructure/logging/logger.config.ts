export const loggerConfig = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
    verbose: 4,
  },
  format: 'json',
  colorize: process.env.NODE_ENV !== 'production',
  timestamp: true,
};
