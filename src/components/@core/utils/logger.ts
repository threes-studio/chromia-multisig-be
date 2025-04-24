import winston from 'winston';

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const currentLogLevel = (process.env.LOG_LEVEL || 'error').toLowerCase();

const logger = winston.createLogger({
  level: currentLogLevel,
  levels: LOG_LEVELS,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ level, message, timestamp }) => {
      return `${level.toUpperCase()}:${timestamp} ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

export default {
  log: (...args: any[]) => logger.debug(args.join(' ')),
  info: (...args: any[]) => logger.info(args.join(' ')),
  warn: (...args: any[]) => logger.warn(args.join(' ')),
  error: (...args: any[]) => logger.error(args.join(' ')),
};
