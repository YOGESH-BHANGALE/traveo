const Sentry = require('@sentry/node');

const initSentry = (app) => {
  // Only initialize in production or if SENTRY_DSN is provided
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      integrations: [
        new Sentry.Integrations.Http({ tracing: true }),
        new Sentry.Integrations.Express({ app }),
      ],
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      environment: process.env.NODE_ENV || 'development',
    });

    console.log('✓ Sentry monitoring initialized');
  } else {
    console.log('ℹ Sentry DSN not configured - monitoring disabled');
  }
};

const sentryErrorHandler = () => {
  return Sentry.Handlers.errorHandler();
};

const sentryRequestHandler = () => {
  return Sentry.Handlers.requestHandler();
};

const sentryTracingHandler = () => {
  return Sentry.Handlers.tracingHandler();
};

module.exports = { 
  initSentry, 
  sentryErrorHandler, 
  sentryRequestHandler,
  sentryTracingHandler 
};
