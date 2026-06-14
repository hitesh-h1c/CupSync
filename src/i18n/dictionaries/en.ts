/**
 * English is the source dictionary and the single source of truth for the
 * string shape. Other locales (hi, gu) spread this and override what they
 * translate, so any missing key automatically falls back to English.
 */
export const en = {
  common: {
    appName: "Cup Sync",
    login: "Log in",
    logout: "Sign out",
    startTrial: "Start free trial",
    language: "Language",
  },
  landing: {
    badge: "14-day free trial · no card required",
    headline: "Digitize your daily tea & coffee deliveries",
    subhead:
      "Cup Sync turns your delivery register into digital logs, automatic billing, and per-office tracking — built for tea-stall vendors.",
    ctaPrimary: "Start your free trial",
    ctaSecondary: "Log in",
    features: [
      {
        title: "Digital delivery log",
        body: "Replace the paper register — employees log each office's cups in seconds from their phone.",
      },
      {
        title: "Effective-dated pricing",
        body: "Set a price per office with a start date. Past bills never change when tomorrow's price does.",
      },
      {
        title: "Automatic monthly bills",
        body: "Bills add up each day's snapshotted price — accurate even when rates change mid-month.",
      },
    ],
  },
  auth: {
    loginTitle: "Welcome back",
    loginDesc: "Log in to your Cup Sync account.",
    signupTitle: "Start your free trial",
    signupDesc: "14 days free, no card required. Set up your tea-stall business in a minute.",
    haveAccount: "Already have an account?",
    newVendor: "New vendor?",
    startTrialLink: "Start a free trial",
  },
};

export type Dictionary = typeof en;
