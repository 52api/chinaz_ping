/**
 * Chinaz Ping 检测 — Playwright 方案
 *
 * 用法: node chinaz_ping.js <域名>
 *       node chinaz_ping.js www.x6d.net
 * 输出: JSON 到 stdout
 *
 * 依赖: npm install playwright
 */
const { chromium } = require('playwright');

const domain = process.argv[2] || 'www.x6d.net';

(async () => {
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--disable-blink-features=AutomationControlled'],
  });
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1400, height: 900 },
  });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });

  // 点击"立即检测"
  let freshData = null;
  page.on('response', async resp => {
    const url = resp.url();
    if (!url.includes('chinaz.com/ping/') || resp.request().method() !== 'POST') return;
    if (freshData) return;
    try {
      const body = await resp.text();
      if (body.length > 50000) {
        // POST 返回了完整页面, 从中提取数据
        freshData = { type: 'post_response', html_size: body.length };
      }
    } catch (_) {}
  });

  const url = 'https://ping.chinaz.com/' + domain;
  process.stderr.write('Loading ' + url + '\n');
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 2000));

  // 点击"立即检测"
  const btn = page.locator('button, input[type="submit"], a, span').filter({ hasText: /立即检测|开始检测|检测/ }).first();
  if (await btn.isVisible()) {
    process.stderr.write('Clicking detect button...\n');
    await btn.click();
    await new Promise(r => setTimeout(r, 5000));
  }

  // 从 DOM 提取结果
  const result = await page.evaluate((dom) => {
    const r = { domain: dom, nodes: [], summary: {} };

    // 找到结果表格 - 找包含 "检测点" 表头的表格
    const tables = document.querySelectorAll('table');
    let targetTable = null;
    for (const table of tables) {
      const headerText = table.querySelector('tr')?.textContent || '';
      if ((headerText.includes('检测点') || headerText.includes('运营商')) && 
          (headerText.includes('IP') || headerText.includes('响应'))) {
        targetTable = table;
        break;
      }
    }
    if (!targetTable) {
      // 找第一个真正有数据的表格（行数最多且包含 IP 的行）
      let maxRows = 0;
      for (const table of tables) {
        const rows = table.querySelectorAll('tr');
        let dataRows = 0;
        for (const row of rows) {
          if (row.textContent.match(/\d+\.\d+\.\d+\.\d+/) || row.textContent.includes('ms')) {
            dataRows++;
          }
        }
        if (dataRows > maxRows) { maxRows = dataRows; targetTable = table; }
      }
    }

    if (targetTable) {
      const rows = targetTable.querySelectorAll('tr');
      for (let i = 0; i < rows.length; i++) {
        const cells = rows[i].querySelectorAll('td');
        if (cells.length < 4) continue;
        const vals = Array.from(cells).map(c => c.textContent.replace(/\s+/g, ' ').trim());
        if (!vals[0] || vals[0] === '检测点' || vals[0].includes('最快') || vals[0] === '区域/运营商') continue;

        let ip = '', time = '', ttl = '', loss = '';
        for (let j = 0; j < vals.length; j++) {
          const v = vals[j] || '';
          const ipM = v.match(/(\d+\.\d+\.\d+\.\d+)/);
          if (ipM) { ip = ipM[1]; continue; }
          const timeM = v.match(/([\d.]+)\s*ms/);
          if (timeM) { time = timeM[1] + 'ms'; continue; }
          if (/^\d{1,3}$/.test(v.trim()) && !isNaN(parseInt(v)) && parseInt(v) > 0 && parseInt(v) < 256) ttl = v.trim();
          if (v.includes('%') || v === '--') loss = v;
        }
        if (!ip && vals[2] && vals[2].includes('时')) ip = '超时';
        if (!time && vals[3]) time = vals[3];
        if (!ttl && vals.length > 4 && /^\d{1,3}$/.test(vals[4].trim())) ttl = vals[4].trim();

        r.nodes.push({ location: vals[0], ip, time, ttl, loss });
      }
    }

    r.node_count = r.nodes.length;
    return r;
  }, domain);

  await browser.close();
  console.log(JSON.stringify(result, null, 2));

})().catch(e => {
  process.stderr.write('错误: ' + e.message + '\n');
  process.exit(1);
});
