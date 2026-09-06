/** Month precision preserves résumé dates without inventing a day or timezone. */
export type YearMonth = `${number}-${
  | "01"
  | "02"
  | "03"
  | "04"
  | "05"
  | "06"
  | "07"
  | "08"
  | "09"
  | "10"
  | "11"
  | "12"}`;

export interface PublicLink {
  readonly label: string;
  readonly href: `https://${string}`;
}
