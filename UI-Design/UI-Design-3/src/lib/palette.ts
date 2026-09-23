export const CLASS_COLORS: Record<string, string> = {
  Equity: "#63e6d2",
  ETF: "#63a7ff",
  "Fixed Income": "#a894fa",
  "Digital Assets": "#f2c572",
  Cash: "#5b6575",
};

export const SECTOR_COLORS: Record<string, string> = {
  "Information Technology": "#63e6d2",
  "Broad Market": "#63a7ff",
  Financials: "#a894fa",
  "Health Care": "#7dd3a0",
  "Consumer Discretionary": "#f2a0c0",
  "Consumer Staples": "#f2c572",
  Energy: "#ff9f6b",
  Materials: "#9fb3c8",
  "Government Bonds": "#8b7ce0",
  "Digital Assets": "#e8b04b",
  Cash: "#5b6575",
};

export const REGION_COLORS: Record<string, string> = {
  "United States": "#63e6d2",
  Europe: "#a894fa",
  "Asia Pacific": "#f2c572",
  "Global ex-US": "#63a7ff",
  Global: "#7dd3a0",
  "North America": "#5eb0c8",
};

export const ACCOUNT_COLORS: Record<string, string> = {
  Taxable: "#63e6d2",
  "Roth IRA": "#a894fa",
  "401(k)": "#63a7ff",
};

export const pickColor = (map: Record<string, string>, key: string) => map[key] ?? "#626c7c";
