// Automated self-test: runs the frontend in Chromium via Playwright,
// selects an input video, runs the "自检" workflow, and saves downloads to the output dir.

const path = require('path');
const { spawn } = require('child_process');

async function run() {
  const INPUT = process.env.INPUT || path.resolve('/mnt/e/All In One/Downloads/格式转化.mp4');
  const OUTDIR = process.env.OUTDIR || path.resolve('/mnt/e/All In One/Downloads/输出');
  const PORT = Number(process.env.PORT || 3210);

  // Start static server
  const server = spawn(process.execPath, [path.resolve(__dirname, 'static-server.js')], {
    env: { ...process.env, PORT: String(PORT) },
    stdio: 'inherit',
  });

  // Lazy import playwright to avoid requiring it for normal use
  const { chromium } = require('playwright');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage();
  page.setDefaultTimeout(0);

  const downloads = [];
  page.on('download', async (download) => {
    const fname = await download.suggestedFilename();
    const target = path.join(OUTDIR, fname);
    try { await download.saveAs(target); } catch {}
    downloads.push({ name: fname, path: target });
  });

  await page.goto(`http://localhost:${PORT}/index.html`);

  // Open 自检 tab
  await page.getByRole('button', { name: '自检' }).click();

  // Provide input file to #selftest-input
  const input = page.locator('#selftest-input');
  await input.setInputFiles(INPUT);

  // Ensure default formats (mp4/m4v/webm) are checked; leave others optional
  for (const fmt of ['mp4','m4v','webm']) {
    const cb = page.locator(`.selftest-format[value="${fmt}"]`);
    const checked = await cb.isChecked();
    if (!checked) await cb.check();
  }

  // Run self-test
  await page.locator('#selftest-run').click();

  // Wait until at least 4 downloads: 3 formats + 1 report (if directory save fails)
  const expected = 4;
  const start = Date.now();
  while (downloads.length < expected && Date.now() - start < 1000 * 60 * 20) {
    await page.waitForTimeout(1000);
  }

  // Take a final screenshot for record
  await page.screenshot({ path: path.join(OUTDIR, 'selftest_final.png'), fullPage: true }).catch(()=>{});

  await browser.close();
  server.kill('SIGINT');

  // Simple summary
  console.log(JSON.stringify({ ok: downloads.length >= expected, downloads }, null, 2));
}

run().catch((e) => { console.error(e); process.exit(1); });

