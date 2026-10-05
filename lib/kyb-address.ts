import { VN_PROVINCES } from "@/lib/vn-provinces";

// Split the verbatim head-office address from a business registration
// certificate into the two address fields the project application can fill.
//
// GVerify returns the address as ONE free-text line, not structured parts —
// the provider's Decode Address API (63->34 province conversion) is explicitly
// out of scope in the eKYB spec (§2), so there is nothing structured to read.
// A real certificate line looks like:
//
//   Thửa đất số 7, Khóm Thuận Tiến B, Phường Bình Minh, Tỉnh Vĩnh Long, Việt Nam
//
// Only the provincial unit can be recovered reliably, because it is a closed
// set (VN_PROVINCES). Ward and district are not, so everything ahead of the
// province is handed over as the street line for the SME to adjust. Postal code
// never appears on the certificate at all.
//
// This is best-effort by design: it fills what it is sure about and leaves the
// rest blank rather than guessing into a field the SME then has to notice and
// undo.

// Administrative prefixes a certificate puts before the provincial unit.
// Written accent-free because it is applied to the normalised key, not the raw
// segment — otherwise an OCR pass that dropped the accents off "Tỉnh" would
// leave the prefix attached and the province would never match.
const PROVINCE_PREFIX = /^(tinh|thanh pho|tp\.?)\s+/;

const COUNTRY_KEYS = new Set(["viet nam", "vietnam"]);

// Diacritic- and case-insensitive key, so an OCR pass that drops accents still
// matches. NFD splits the combining marks off; "đ" has no decomposed form, so
function toKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

const PROVINCE_BY_KEY = new Map(
  VN_PROVINCES.map((province) => [toKey(province), province]),
);

export interface KybAddressParts {
  /** Everything ahead of the provincial unit. `""` when nothing is left. */
  street: string;
  /** A value from VN_PROVINCES, or `""` when no province was recognised. */
  city: string;
}

export function splitKybAddress(
  address: string | null | undefined,
): KybAddressParts {
  const segments = (address ?? "")
    .split(",")
    .map((segment) => segment.trim())
    .filter(Boolean);

  // A trailing "Việt Nam" is noise — country is its own field and is fixed.
  while (
    segments.length > 0 &&
    COUNTRY_KEYS.has(toKey(segments[segments.length - 1]))
  ) {
    segments.pop();
  }

  // Search from the end: the province sits last, and an earlier segment could
  // otherwise collide (a street named after a province, say).
  for (let i = segments.length - 1; i >= 0; i -= 1) {
    const city = PROVINCE_BY_KEY.get(
      toKey(segments[i]).replace(PROVINCE_PREFIX, ""),
    );
    if (city) {
      return { street: segments.slice(0, i).join(", "), city };
    }
  }

  // No province recognised — keep the whole line as the street rather than
  // dropping information the SME would have to retype.
  return { street: segments.join(", "), city: "" };
}
