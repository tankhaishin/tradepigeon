// console.assert only logs; make every failed assertion fail the run (exit code 1).
let failures = 0;
const original = console.assert.bind(console);
console.assert = (cond, ...msg) => { if (!cond) { failures++; original(cond, ...msg); } };
process.on('exit', () => {
  if (failures) { console.error(`\n✗ ${failures} assertion(s) FAILED`); process.exitCode = 1; }
});
