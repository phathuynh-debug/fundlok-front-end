// Whether a picked PDF carries a digital signature at all, and how many, so a
// listing document sent straight back unsigned (or the Standing Offer signed
// only once) is caught the moment it is picked rather than after upload.
// Advisory only: the backend checks the uploaded copy with NEAC
// (app/loans/signing.py), and that is the gate.
//
// Every PDF digital signature is a signature dictionary with a /ByteRange (the
// bytes it covers). It cannot sit in a compressed object stream, because the
// signature's hole has to be at a fixed byte offset, so the raw bytes of a
// signed PDF always contain one per signature. FundLok's own unsigned download
// never does. This counts presence, not validity: NEAC checks the
// certificates and the signers.

const BYTE_RANGE = /\/ByteRange\s*\[/g;

export function countDigitalSignatures(bytes: Uint8Array): number {
  // latin1 keeps every byte as one character, so offsets and ASCII match.
  const text = new TextDecoder("latin1").decode(bytes);
  // The header may follow up to 1 KB of junk; readers allow it.
  if (!text.slice(0, 1024).includes("%PDF-")) return 0;
  return text.match(BYTE_RANGE)?.length ?? 0;
}

export function bytesHaveDigitalSignature(bytes: Uint8Array): boolean {
  return countDigitalSignatures(bytes) > 0;
}

export async function fileSignatureCount(file: File): Promise<number> {
  return countDigitalSignatures(new Uint8Array(await file.arrayBuffer()));
}
