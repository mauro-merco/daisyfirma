const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

async function testCopy(reduced) {
  const html = fs.readFileSync('firma.html', 'utf8');
  const sources = [...html.matchAll(/<img[^>]+src="([^"]+)"/g)].map(match => match[1]);
  sources.forEach(source => assert.ok(fs.existsSync(source), source));
  function image(source) {
    return { src: source, getAttribute() { return this.src; },
      setAttribute(key, value) { this[key] = value; }, removeAttribute() {} };
  }
  const images = sources.map(image);
  const orbitIndex = sources.indexOf('linea-daisy.gif');
  assert.ok(orbitIndex >= 0);
  const handlers = {};
  let clipboard;
  const signature = {
    querySelectorAll() { return images; },
    cloneNode() {
      const copied = images.map(item => image(item.src));
      return {
        querySelector() { return copied[orbitIndex]; },
        get innerHTML() { return copied.map(item => `<img src="${item.src}">`).join(''); }
      };
    }
  };
  const elements = { signature, orbit: images[orbitIndex], status: {},
    restart: { addEventListener() {} },
    copy: { addEventListener(event, handler) { handlers[event] = handler; } } };
  const context = {
    URL, Blob, Date,
    document: { getElementById(id) { return elements[id]; } },
    window: { matchMedia() { return { matches: reduced, addEventListener() {} }; } },
    navigator: { clipboard: { async write(items) { clipboard = items[0]; } } },
    ClipboardItem: class { constructor(data) { this.data = data; } }
  };
  vm.runInNewContext(html.match(/<script>([\s\S]*?)<\/script>/)[1], context);
  await handlers.click();
  const copied = await clipboard.data['text/html'].text();
  const copiedSources = [...copied.matchAll(/src="([^"]+)"/g)].map(match => match[1]);
  assert.equal(copiedSources.length, sources.length);
  copiedSources.forEach(source => {
    assert.ok(source.startsWith('https://daisyfirma.vercel.app/'));
    assert.ok(!source.includes('?replay='));
  });
  assert.ok(copied.includes(reduced ? 'linea-daisy-estatica.png' : 'linea-daisy.gif'));
  assert.ok(fs.existsSync('linea-daisy-estatica.png'));
}

(async () => {
  await testCopy(false);
  await testCopy(true);
  const config = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
  assert.ok(config.rewrites.some(rule => rule.source === '/' && rule.destination === '/firma.html'));
  console.log('OK: clipboard HTML uses public HTTPS assets, respects reduced motion, and root rewrite exists.');
})().catch(error => { console.error(error); process.exitCode = 1; });
