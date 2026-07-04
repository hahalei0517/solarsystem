import { expect, test } from '@playwright/test';

test('true-scale mode encloses Eris orbit within starfield (no errors, renders)', async ({ page }) => {
  test.setTimeout(60_000);
  const pageErrors = [];
  const consoleErrors = [];
  page.on('pageerror', (e) => pageErrors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });

  await page.goto('/');
  await expect(page.locator('#loader')).toHaveClass(/gone/, { timeout: 20_000 });

  // Enable dwarf planets so Eris/Pluto render (Eris is near aphelion ~97.5 AU at default "now").
  await page.locator('#layer-dwarfs').evaluate(el => { el.checked = true; el.dispatchEvent(new Event('change', { bubbles: true })); });

  // Switch to true-scale mode and stay there.
  await page.locator('#scale-seg button[data-scale="true"]').click();
  await expect(page.locator('#scale-seg button[data-scale="true"]')).toHaveClass(/active/);
  await page.waitForTimeout(1200); // let applyScaleMode + a few frames settle

  // Zoom out toward maxDistance so Eris's full orbit is in view.
  const stage = page.locator('#stage');
  await stage.hover();
  for (let i = 0; i < 18; i++) {
    await page.mouse.wheel(0, 900);
    await page.waitForTimeout(30);
  }
  await page.waitForTimeout(800);

  await page.screenshot({ path: 'test-results/true-scale-dwarfs.png', fullPage: false });

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
