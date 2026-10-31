// The app link is used only when it is a valid https address. Run: npm test
import assert from 'node:assert/strict';
import { appLink } from '../src/lib/app-link.js';

assert.equal(appLink('https://miras.example/app'), 'https://miras.example/app');
assert.equal(appLink('  https://miras.example  '), 'https://miras.example/');
for (const bad of [undefined, null, '', '   ', 'miras.example', 'http://miras.example', 'javascript:alert(1)', 'ftp://miras.example', 42]) {
  assert.equal(appLink(bad), null, `should reject ${String(bad)}`);
}
console.log('app link: ok');
