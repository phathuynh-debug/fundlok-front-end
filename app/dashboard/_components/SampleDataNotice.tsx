import { FlaskConical } from "lucide-react";

/**
 * The amber "this is sample data" banner.
 *
 * The analytics, transactions and security screens each carry a hand-rolled
 * copy of this markup. Rather than paste a fifth and sixth one into the two
 * dashboards, the shape lives here once; those three can adopt it whenever
 * they are next touched.
 *
 * @param message already-translated text — the caller owns the i18n key, since
 *   each screen explains its own gap.
 */
export function SampleDataNotice({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3">
      <FlaskConical
        className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"
        aria-hidden="true"
      />
      <p className="text-xs text-amber-700 dark:text-amber-300">{message}</p>
    </div>
  );
}
