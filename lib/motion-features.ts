// The animation features every `m.*` component in the app runs on, split into
// their own chunk. AppearanceProvider loads this with a dynamic import inside
// <LazyMotion>, so the first paint ships only the small `m` components and the
// animation engine arrives right after hydration instead of in every page's
// initial bundle.
//
// domAnimation covers animate/exit, variants, whileHover/Tap/Focus/InView and
// the scroll hooks. Switch to domMax only if something starts using `layout`,
// `layoutId` or `drag` — with the `strict` flag on LazyMotion, those simply
// will not animate under domAnimation.
export { domAnimation as default } from "framer-motion";
