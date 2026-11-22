/** One benefit per line/bullet/semicolon. Normalize the legacy combined locker/access phrase. */
export function planBenefits(value) {
  return String(value || '')
    .replace(/(free lockers?)\s+(?:and\s+)?(?=unlimited gym access\b)/gi, '$1\n')
    .split(/[\n\r•;]+/)
    .map((b) => b.trim())
    .filter(Boolean);
}
