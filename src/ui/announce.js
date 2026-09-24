// Mirrors key canvas UI changes into the page's aria-live region so screen
// readers hear menu focus, modals and outcomes the canvas cannot expose.
export function announce(message, doc = globalThis.document) {
  const region = doc?.getElementById?.('sr-status');
  if (region) region.textContent = message;
}
