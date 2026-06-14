import { en, type Dictionary } from "./en";

/** Hindi. Spreads English so any untranslated key falls back automatically. */
export const hi: Dictionary = {
  ...en,
  common: {
    ...en.common,
    login: "लॉग इन करें",
    logout: "साइन आउट",
    startTrial: "मुफ़्त ट्रायल शुरू करें",
    language: "भाषा",
  },
  landing: {
    ...en.landing,
    badge: "14-दिन का मुफ़्त ट्रायल · कार्ड की ज़रूरत नहीं",
    headline: "अपनी रोज़ की चाय व कॉफ़ी डिलीवरी को डिजिटल बनाएं",
    subhead:
      "Cup Sync आपके डिलीवरी रजिस्टर को डिजिटल लॉग, स्वचालित बिलिंग और हर ऑफिस की ट्रैकिंग में बदल देता है — चाय की दुकान वालों के लिए।",
    ctaPrimary: "अपना मुफ़्त ट्रायल शुरू करें",
    ctaSecondary: "लॉग इन करें",
    features: [
      {
        title: "डिजिटल डिलीवरी लॉग",
        body: "कागज़ी रजिस्टर को हटाएं — कर्मचारी फ़ोन से सेकंडों में हर ऑफिस के कप दर्ज करें।",
      },
      {
        title: "तारीख़-आधारित मूल्य",
        body: "हर ऑफिस के लिए शुरू होने की तारीख़ के साथ क़ीमत तय करें। पुराने बिल कभी नहीं बदलते।",
      },
      {
        title: "स्वचालित मासिक बिल",
        body: "बिल हर दिन की दर्ज क़ीमत जोड़ते हैं — बीच महीने दर बदलने पर भी सटीक।",
      },
    ],
  },
  auth: {
    ...en.auth,
    loginTitle: "वापसी पर स्वागत है",
    loginDesc: "अपने Cup Sync खाते में लॉग इन करें।",
    signupTitle: "अपना मुफ़्त ट्रायल शुरू करें",
    signupDesc: "14 दिन मुफ़्त, कार्ड की ज़रूरत नहीं। एक मिनट में अपना व्यवसाय सेट करें।",
    haveAccount: "पहले से खाता है?",
    newVendor: "नए विक्रेता?",
    startTrialLink: "मुफ़्त ट्रायल शुरू करें",
  },
};
