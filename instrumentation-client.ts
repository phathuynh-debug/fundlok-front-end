import { z } from "zod";

// Runs before any page code (Next's instrumentation-client hook), so it lands
// before the first schema is parsed.
//
// Zod compiles object schemas with `new Function` when it can, and finds out
// whether it can by trying once. Under our CSP (lib/csp.ts — no 'unsafe-eval')
// that probe fails and Zod quietly falls back to the interpreter, but the
// browser still reports a CSP violation on every page that validates a form.
// jitless skips the probe; the interpreter is what ran anyway.
z.config({ jitless: true });
