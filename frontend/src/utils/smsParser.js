// Best-effort parser for bank purchase-notification text (the kind
// pasted from an SMS or push notification). Heuristic, not a universal
// parser — different banks format these differently, so this only
// pre-fills amount/description; the person always still picks the
// category themselves. The raw pasted text is never sent to the
// backend or stored anywhere — it's read once here, in the browser,
// purely to extract these two fields, then discarded.
export function parseTransactionSms(text) {
  if (!text) return { amount: "", description: "" };

  // "AED 39.14" — first amount-with-decimals found (a later "Avl Cr.
  // Limit is AED 00000" has no decimal point, so it won't match here).
  const amountMatch = text.match(/(?:AED|USD|INR)\s*([\d,]+\.\d{2})/i);
  const amount = amountMatch ? amountMatch[1].replace(/,/g, "") : "";

  // "...at NEW AL MADINA HYPERMAR, DUBAI." — merchant name between
  // "at " and the next comma.
  const merchantMatch = text.match(/\bat\s+([A-Za-z0-9&'.\- ]+?)\s*,/i);
  const description = merchantMatch ? merchantMatch[1].trim() : "";

  return { amount, description };
}
