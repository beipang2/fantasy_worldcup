// Maps FIFA 3-letter nationality codes to ISO 3166-1 alpha-2 codes for flag emojis.
const FIFA_TO_ALPHA2: Record<string, string> = {
  ALG: "DZ", ARG: "AR", AUS: "AU", AUT: "AT", BEL: "BE",
  BIH: "BA", BRA: "BR", CAN: "CA", CIV: "CI", COD: "CD",
  COL: "CO", CPV: "CV", CRO: "HR", CUW: "CW", CZE: "CZ",
  ECU: "EC", EGY: "EG", ENG: "GB", ESP: "ES", FRA: "FR",
  GER: "DE", GHA: "GH", HAI: "HT", IRN: "IR", IRQ: "IQ",
  JOR: "JO", JPN: "JP", KOR: "KR", KSA: "SA", MAR: "MA",
  MEX: "MX", NED: "NL", NOR: "NO", NZL: "NZ", PAN: "PA",
  PAR: "PY", POR: "PT", QAT: "QA", RSA: "ZA", SCO: "GB",
  SEN: "SN", SUI: "CH", SWE: "SE", TUN: "TN", TUR: "TR",
  URU: "UY", USA: "US", UZB: "UZ",
};

export function flagEmoji(fifaCode: string): string {
  const alpha2 = FIFA_TO_ALPHA2[fifaCode];
  if (!alpha2) return "";
  const base = 0x1f1e6 - 65;
  return String.fromCodePoint(base + alpha2.charCodeAt(0), base + alpha2.charCodeAt(1));
}

const POSITION_ABBR: Record<string, string> = {
  Goalkeeper: "GK",
  Defender: "DEF",
  Midfielder: "MID",
  Forward: "FWD",
};

export function positionAbbr(position: string): string {
  return POSITION_ABBR[position] ?? position.slice(0, 3).toUpperCase();
}
