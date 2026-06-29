// Vietnam's 63 provincial-level units (pre-2025 reform): the 5 centrally-
// governed cities first, then the 58 provinces alphabetically. Used to populate
// the City/Province dropdown on the project-application address step while the
// platform is Vietnam-only.
//
// NOTE: This is the traditional 63-unit list. Vietnam reorganized into 34
// provincial-level units in mid-2025 — swap this array if/when you adopt that.
export const VN_PROVINCES: string[] = [
  // Centrally-governed cities
  "Hà Nội",
  "Hồ Chí Minh",
  "Hải Phòng",
  "Đà Nẵng",
  "Cần Thơ",
  // Provinces (A–Z)
  "An Giang",
  "Bà Rịa - Vũng Tàu",
  "Bắc Giang",
  "Bắc Kạn",
  "Bạc Liêu",
  "Bắc Ninh",
  "Bến Tre",
  "Bình Định",
  "Bình Dương",
  "Bình Phước",
  "Bình Thuận",
  "Cà Mau",
  "Cao Bằng",
  "Đắk Lắk",
  "Đắk Nông",
  "Điện Biên",
  "Đồng Nai",
  "Đồng Tháp",
  "Gia Lai",
  "Hà Giang",
  "Hà Nam",
  "Hà Tĩnh",
  "Hải Dương",
  "Hậu Giang",
  "Hòa Bình",
  "Hưng Yên",
  "Khánh Hòa",
  "Kiên Giang",
  "Kon Tum",
  "Lai Châu",
  "Lâm Đồng",
  "Lạng Sơn",
  "Lào Cai",
  "Long An",
  "Nam Định",
  "Nghệ An",
  "Ninh Bình",
  "Ninh Thuận",
  "Phú Thọ",
  "Phú Yên",
  "Quảng Bình",
  "Quảng Nam",
  "Quảng Ngãi",
  "Quảng Ninh",
  "Quảng Trị",
  "Sóc Trăng",
  "Sơn La",
  "Tây Ninh",
  "Thái Bình",
  "Thái Nguyên",
  "Thanh Hóa",
  "Thừa Thiên Huế",
  "Tiền Giang",
  "Trà Vinh",
  "Tuyên Quang",
  "Vĩnh Long",
  "Vĩnh Phúc",
  "Yên Bái",
];

// Countries the platform supports. It's a dropdown driven entirely by this
// list: while there's only one entry the field is effectively locked (Vietnam),
// and as soon as you add more countries here the picker becomes selectable —
// no component changes needed.
export const SUPPORTED_COUNTRIES: string[] = ["Vietnam"];

// Pre-select the country when there's only one supported; otherwise leave it
// empty so the user must choose.
export const DEFAULT_COUNTRY =
  SUPPORTED_COUNTRIES.length === 1 ? SUPPORTED_COUNTRIES[0] : "";
