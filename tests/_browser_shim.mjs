// Minimal localStorage + window event bus for running browser modules under node.
const mem = new Map();
globalThis.localStorage = {
  getItem: k => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: k => mem.delete(k),
  clear: () => mem.clear(),
  key: i => [...mem.keys()][i] ?? null,
  get length() { return mem.size; }
};
const target = new EventTarget();
globalThis.window = globalThis.window || {
  addEventListener: target.addEventListener.bind(target),
  removeEventListener: target.removeEventListener.bind(target),
  dispatchEvent: target.dispatchEvent.bind(target),
  localStorage: globalThis.localStorage
};
globalThis.CustomEvent = globalThis.CustomEvent || class extends Event { constructor(t, o) { super(t); this.detail = o?.detail; } };
