import { en, type Dictionary } from "./en";

/** Gujarati. Spreads English so any untranslated key falls back automatically. */
export const gu: Dictionary = {
  ...en,
  common: {
    ...en.common,
    login: "લૉગ ઇન કરો",
    logout: "સાઇન આઉટ",
    startTrial: "મફત ટ્રાયલ શરૂ કરો",
    language: "ભાષા",
  },
  landing: {
    ...en.landing,
    badge: "14-દિવસનું મફત ટ્રાયલ · કાર્ડની જરૂર નથી",
    headline: "તમારી રોજિંદી ચા અને કૉફી ડિલિવરી ડિજિટલ બનાવો",
    subhead:
      "Cup Sync તમારા ડિલિવરી રજિસ્ટરને ડિજિટલ લૉગ, ઑટોમેટિક બિલિંગ અને દરેક ઑફિસના ટ્રેકિંગમાં ફેરવે છે — ચાની દુકાનના વેપારીઓ માટે.",
    ctaPrimary: "તમારું મફત ટ્રાયલ શરૂ કરો",
    ctaSecondary: "લૉગ ઇન કરો",
    features: [
      {
        title: "ડિજિટલ ડિલિવરી લૉગ",
        body: "કાગળનું રજિસ્ટર છોડો — કર્મચારીઓ ફોનથી સેકન્ડોમાં દરેક ઑફિસના કપ નોંધે.",
      },
      {
        title: "તારીખ-આધારિત ભાવ",
        body: "દરેક ઑફિસ માટે શરૂ થવાની તારીખ સાથે ભાવ સેટ કરો. જૂના બિલ ક્યારેય બદલાતા નથી.",
      },
      {
        title: "ઑટોમેટિક માસિક બિલ",
        body: "બિલ દરેક દિવસનો નોંધાયેલ ભાવ ઉમેરે છે — મહિના વચ્ચે ભાવ બદલાય તોપણ સચોટ.",
      },
    ],
  },
  auth: {
    ...en.auth,
    loginTitle: "ફરી સ્વાગત છે",
    loginDesc: "તમારા Cup Sync ખાતામાં લૉગ ઇન કરો.",
    signupTitle: "તમારું મફત ટ્રાયલ શરૂ કરો",
    signupDesc: "14 દિવસ મફત, કાર્ડની જરૂર નથી. એક મિનિટમાં તમારો વ્યવસાય સેટ કરો.",
    haveAccount: "પહેલેથી ખાતું છે?",
    newVendor: "નવા વેપારી?",
    startTrialLink: "મફત ટ્રાયલ શરૂ કરો",
  },
};
