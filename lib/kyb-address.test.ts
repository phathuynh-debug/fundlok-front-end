import { describe, expect, it } from "vitest";

import { splitKybAddress } from "./kyb-address";

describe("splitKybAddress", () => {
  it("splits a real certificate line at the province", () => {
    // Verbatim from a FUNDLOK business registration certificate.
    expect(
      splitKybAddress(
        "Thửa đất số 7, Khóm Thuận Tiến B, Phường Bình Minh, Tỉnh Vĩnh Long, Việt Nam",
      ),
    ).toEqual({
      street: "Thửa đất số 7, Khóm Thuận Tiến B, Phường Bình Minh",
      city: "Vĩnh Long",
    });
  });

  it("recognises a centrally-governed city behind its 'Thành phố' prefix", () => {
    expect(
      splitKybAddress(
        "12 Thảo Điền, Phường An Khánh, Thành phố Hồ Chí Minh, Việt Nam",
      ),
    ).toEqual({ street: "12 Thảo Điền, Phường An Khánh", city: "Hồ Chí Minh" });
  });

  it("accepts the abbreviated TP. prefix", () => {
    expect(splitKybAddress("1 Lê Lợi, TP. Đà Nẵng")).toEqual({
      street: "1 Lê Lợi",
      city: "Đà Nẵng",
    });
  });

  it("matches even when OCR has dropped the diacritics", () => {
    expect(splitKybAddress("1 Le Loi, Tinh Vinh Long, Viet Nam")).toEqual({
      street: "1 Le Loi",
      city: "Vĩnh Long",
    });
  });

  it("takes the LAST province when an earlier segment collides", () => {
    // "Long An" as a street name must not win over the real province.
    expect(splitKybAddress("5 Long An, Phường 2, Tỉnh Bến Tre")).toEqual({
      street: "5 Long An, Phường 2",
      city: "Bến Tre",
    });
  });

  it("keeps the whole line as street when no province is recognised", () => {
    expect(splitKybAddress("Somewhere unrecognisable, Block B")).toEqual({
      street: "Somewhere unrecognisable, Block B",
      city: "",
    });
  });

  it("returns an empty street when the address is only a province", () => {
    expect(splitKybAddress("Tỉnh Vĩnh Long, Việt Nam")).toEqual({
      street: "",
      city: "Vĩnh Long",
    });
  });

  it("is empty for null, undefined and blank input", () => {
    const empty = { street: "", city: "" };
    expect(splitKybAddress(null)).toEqual(empty);
    expect(splitKybAddress(undefined)).toEqual(empty);
    expect(splitKybAddress("   ")).toEqual(empty);
  });
});
