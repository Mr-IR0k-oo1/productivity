/**
 * Company details used by the Privacy Policy, Terms of Service and Cookie Policy.
 *
 * Fill in every value marked TODO, have the three documents reviewed by a lawyer for the
 * places you operate, then set `reviewed: true`. Until then each page shows a draft notice.
 */
export const legal = {
  product: "Orbit",
  company: "Quantrix Studio",
  website: "https://quantrix.studio",
  /** Registered legal name, e.g. "Quantrix Studio Pvt. Ltd." TODO */
  legalEntity: "Quantrix Studio",
  /** Registered postal address. TODO */
  address: "[registered address]",
  /** Inbox for privacy and data requests. TODO */
  privacyEmail: "[privacy contact email]",
  /** Inbox for legal notices and general support. TODO */
  contactEmail: "[contact email]",
  /** Country or state whose law governs the Terms, e.g. "India". TODO */
  governingLaw: "[governing law]",
  /** Courts with jurisdiction over disputes, e.g. "the courts of Chennai". TODO */
  venue: "[courts with jurisdiction]",
  /** Who hosts the servers and database, and in which region, e.g. "AWS (Mumbai, India)". TODO */
  hostingProvider: "[hosting provider and region]",
  /** Date the current versions take effect, written out, e.g. "1 November 2026". TODO */
  effectiveDate: "[effective date]",
  /** Set to true once a lawyer has reviewed the documents and the TODOs are filled in. */
  reviewed: false,
} as const;

/** Browser storage Orbit uses, listed in the Cookie Policy. Keep in sync with the code. */
export const storageInventory = [
  {
    name: "orbit-ui",
    kind: "Local storage",
    purpose: "Remembers interface preferences such as light or dark theme.",
    duration: "Until you clear your browser data",
  },
  {
    name: "pf-workspace-id",
    kind: "Local storage",
    purpose: "Remembers which workspace you last opened.",
    duration: "Until you clear your browser data",
  },
  {
    name: "orbit-flowchart-clipboard",
    kind: "Local storage",
    purpose: "Lets you copy and paste shapes between flowcharts.",
    duration: "Until you copy something else or clear your browser data",
  },
] as const;
