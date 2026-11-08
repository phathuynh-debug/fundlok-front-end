import { describe, expect, it } from "vitest";
import { bytesHaveDigitalSignature } from "./agreement-signature";

const bytes = (s: string) => new TextEncoder().encode(s);

const UNSIGNED = "%PDF-1.7\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF\n";
// What a signing tool appends: an incremental update with the signature.
const SIGNATURE =
  "9 0 obj\n<< /Type /Sig /Filter /Adobe.PPKLite /SubFilter /ETSI.CAdES.detached " +
  "/ByteRange [0 120 4216 380] /Contents <3082> >>\nendobj\n%%EOF\n";

describe("bytesHaveDigitalSignature", () => {
  it("accepts a PDF a signing tool has signed", () => {
    expect(bytesHaveDigitalSignature(bytes(UNSIGNED + SIGNATURE))).toBe(true);
  });

  it("refuses the PDF as downloaded, never signed", () => {
    expect(bytesHaveDigitalSignature(bytes(UNSIGNED))).toBe(false);
  });

  it("refuses something that is not a PDF, signature text or not", () => {
    expect(bytesHaveDigitalSignature(bytes("PK\u0003\u0004" + SIGNATURE))).toBe(
      false,
    );
  });
});
