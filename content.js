// Hides Reddit's "For You" tab. Reddit changes its markup often, so instead of
// relying on one class name, this looks for tab-like elements whose label is
// "For You" (including inside Reddit's web-component shadow DOM) and hides the
// whole tab slot, so no empty gap is left behind.

const LABEL = /^for\s*you$/i;
// Only real tab controls. Plain links/buttons count only inside a tab bar or
// nav, so posts, comments and links that merely say "for you" are never touched.
const TAB_SELECTOR = '[role="tab"], faceplate-tab, shreddit-tab';
const NAV_ITEM_SELECTOR =
  ':is([role="tablist"], nav, header) :is(a, button, li, faceplate-tracker)';
const STOP = new Set(["BODY", "HTML", "MAIN", "HEADER", "NAV", "UL", "OL"]);

let switchedAway = false;

// If the home page opens directly on the For You feed (e.g. /?feed=foryou),
// send us to the normal home feed. Only the home page is checked, so posts
// whose titles contain "for you" are never redirected.
if (
  (location.pathname === "/" || location.pathname === "") &&
  /for[-_]?you/i.test(location.search)
) {
  location.replace("https://www.reddit.com/");
}

const observedRoots = new WeakSet();

function* allRoots(root = document) {
  // Also watch shadow roots, since Reddit renders the tabs inside them.
  if (root instanceof ShadowRoot && !observedRoots.has(root)) {
    observedRoots.add(root);
    observer.observe(root, { childList: true, subtree: true });
  }
  yield root;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
  let node = walker.currentNode;
  while (node) {
    if (node.shadowRoot) yield* allRoots(node.shadowRoot);
    node = walker.nextNode();
  }
}

// Text of an element, including content placed into it through <slot>s
// (e.g. <span role="tab"><slot name="page-1"></slot></span>).
function labelOf(el) {
  const aria = el.getAttribute("aria-label");
  if (aria) return aria.trim();
  const text = (el.innerText || el.textContent || "").trim();
  if (text) return text;
  const slots = el.tagName === "SLOT" ? [el] : [...el.querySelectorAll("slot")];
  return slots
    .flatMap((s) => s.assignedNodes({ flatten: true }))
    .map((n) => n.textContent || "")
    .join(" ")
    .trim();
}

// Parent element, stepping out of a shadow root to its host if needed.
function parentOf(el) {
  if (el.parentElement) return el.parentElement;
  const root = el.getRootNode();
  return root instanceof ShadowRoot ? root.host : null;
}

// Children that actually take up space (ignores <style>, <template>, hidden bits).
function visibleChildren(el) {
  const kids = el.shadowRoot ? [...el.shadowRoot.children, ...el.children] : [...el.children];
  return kids.filter((k) => {
    if (/^(STYLE|SCRIPT|TEMPLATE|SLOT)$/.test(k.tagName)) return false;
    const cs = getComputedStyle(k);
    return cs.display !== "none" && cs.position !== "absolute" && cs.position !== "fixed";
  });
}

// Walk up from the matched element to the outermost wrapper that belongs only
// to the "For You" tab. Hiding that wrapper removes its padding/margins too.
function tabSlot(el) {
  let target = el;
  for (let i = 0; i < 8; i++) {
    const p = parentOf(target);
    if (!p || STOP.has(p.tagName) || p.getAttribute("role") === "tablist") break;
    const onlyThisTab = LABEL.test(labelOf(p)) || visibleChildren(p).length <= 1;
    if (!onlyThisTab) break;
    target = p;
  }
  return target;
}

// Hide empty divider elements (e.g. a thin line) sitting right next to the tab.
function hideAdjacentDividers(target) {
  for (const sib of [target.previousElementSibling, target.nextElementSibling]) {
    if (
      sib &&
      !sib.children.length &&
      !sib.textContent.trim() &&
      !/^(STYLE|SCRIPT|TEMPLATE|SLOT|IMG|SVG|INPUT)$/i.test(sib.tagName)
    ) {
      sib.style.setProperty("display", "none", "important");
    }
  }
}

// If the tab bar is a CSS grid with fixed columns, re-split it among the
// remaining tabs so the hidden tab's column doesn't leave an empty space.
function fixTablist(tab) {
  const list = tab.closest('[role="tablist"]');
  if (!list || getComputedStyle(list).display !== "grid") return;
  const visible = [...list.querySelectorAll('[role="tab"]')].filter(
    (t) => getComputedStyle(t).display !== "none"
  ).length;
  list.style.setProperty(
    "grid-template-columns",
    `repeat(${Math.max(visible, 1)}, minmax(0, 1fr))`,
    "important"
  );
}

function hideForYou() {
  let changed = false;
  for (const root of allRoots()) {
    for (const el of root.querySelectorAll(`${TAB_SELECTOR}, ${NAV_ITEM_SELECTOR}`)) {
      if (el.dataset.hfyHidden || !LABEL.test(labelOf(el))) continue;

      const target = tabSlot(el);
      const wasSelected =
        el.getAttribute("aria-selected") === "true" ||
        el.getAttribute("aria-current") === "page" ||
        el.hasAttribute("selected");

      target.style.setProperty("display", "none", "important");
      hideAdjacentDividers(target);
      if (el.getAttribute("role") === "tab") fixTablist(el);
      el.dataset.hfyHidden = "1";
      changed = true;

      // If "For You" was the active tab, click the first other visible tab once.
      if (wasSelected && !switchedAway) {
        const container = parentOf(target);
        const other =
          container &&
          [...container.querySelectorAll(`${TAB_SELECTOR}, ${NAV_ITEM_SELECTOR}`)].find(
            (t) => t !== el && !target.contains(t) && t.offsetParent !== null
          );
        if (other) {
          switchedAway = true;
          other.click();
        }
      }
    }
  }
  // Nudge Reddit to re-measure the tab bar so the underline lines up again.
  if (changed) window.dispatchEvent(new Event("resize"));
}

// Reddit is a single-page app, so keep watching for re-rendered tabs.
let scheduled = false;
const observer = new MutationObserver(() => {
  if (scheduled) return;
  scheduled = true;
  setTimeout(() => {
    scheduled = false;
    hideForYou();
  }, 150);
});

function start() {
  hideForYou();
  observer.observe(document.documentElement, { childList: true, subtree: true });
  // Catch tab bars that finish rendering late.
  [500, 1500, 3000].forEach((ms) => setTimeout(hideForYou, ms));
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start);
} else {
  start();
}
