// Contract 4: "Hợp đồng dịch vụ dành cho Nhà đầu tư / Investor Service
// Agreement". The agreement itself is a PDF the backend fills in with the
// investor's details (app/market/investor_agreement/text.py holds the text);
// the investor signs it digitally and uploads it before their first
// commitment. Every commitment then signs an Investment Confirmation, the
// Annex, which the invest flow shows filled in for that commitment with the
// contract's own row labels below.
//
// Source: Contract set v0.3 (5 Nov 2026), DRAFT pending IBL review. Copied
// verbatim; if the Vietnamese and English differ, the Vietnamese prevails.

export const ANNEX_HEADING =
  "Phụ lục – Xác nhận đầu tư / Annex – Investment Confirmation";

export const ANNEX_COLUMNS = {
  item: "Mục / Item",
  value: "Giá trị / Value",
};

export const ANNEX_ROWS = {
  listing: "Mã khoản gọi vốn / Listing ID",
  sme: "Doanh nghiệp / SME",
  amount: "Số tiền cam kết / Committed amount (P)",
  rateTerm: "Lãi suất, thời hạn / Rate, term",
  fee: "Phí dịch vụ dự kiến / Expected service fee",
  disbursement: "Ngày giải ngân dự kiến / Expected Disbursement Date",
} as const;

/** 20000000 -> "20.000.000", the contract's own way of writing amounts. */
export function contractNumber(value: number | string): string {
  return Number(value).toLocaleString("vi-VN", { maximumFractionDigits: 3 });
}
