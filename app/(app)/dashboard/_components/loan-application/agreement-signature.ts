// Whether a picked PDF carries a digital signature at all, so the unsigned
// agreement sent straight back is caught the moment it is picked rather than
// at Send. Advisory only: the backend runs the same check on the STORED file
// at confirm (app/loans/agreement/signature.py), and that is the gate.
//
// Every PDF digital signature is a signature dictionary with a /ByteRange (the
// bytes it covers). It cannot sit in a compressed object stream, because the
// signature's hole has to be at a fixed byte offset, so the raw bytes of a
// signed PDF always contain it. FundLok's own unsigned download never does.
// Like the backend, this checks presence, not validity: staff check the
// certificate and the signer in review.

const BYTE_RANGE = /\/ByteRange\s*\[/;

export function bytesHaveDigitalSignature(bytes: Uint8Array): boolean {
  // latin1 keeps every byte as one character, so offsets and ASCII match.
  const text = new TextDecoder("latin1").decode(bytes);
  // The header may follow up to 1 KB of junk; readers allow it.
  if (!text.slice(0, 1024).includes("%PDF-")) return false;
  return BYTE_RANGE.test(text);
}

export async function fileHasDigitalSignature(file: File): Promise<boolean> {
  return bytesHaveDigitalSignature(new Uint8Array(await file.arrayBuffer()));
}
