import { expect, test } from '@playwright/test';

function collectPageErrors(page) {
  const pageErrors = [];
  const consoleErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  return { pageErrors, consoleErrors };
}

test('app boots and primary interactions work', async ({ page }) => {
  test.setTimeout(60_000);
  const { pageErrors, consoleErrors } = collectPageErrors(page);

  await page.goto('/');

  await expect(page.locator('#stage')).toBeVisible();
  await expect(page.locator('#loader')).toHaveClass(/gone/, { timeout: 15_000 });
  await expect(page.locator('#play-btn')).toBeVisible();
  await expect(page.locator('#speed-seg')).toBeVisible();
  await expect(page.locator('#scale-seg')).toBeVisible();
  await expect(page.locator('#quality-seg')).toBeVisible();
  await expect(page.locator('#quality-seg button[data-quality="quality"]')).toHaveClass(/active/);
  await expect(page.locator('#planet-list')).toBeHidden(); // planet-list removed; layers menu took its place
  await expect(page.locator('#timeline')).toBeVisible();
  // Scrubber still updates the sim date even at extremes; the old out-of-range warning was removed.
  await page.locator('#scrubber').evaluate((el) => {
    el.value = el.max;
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.locator('#scrubber').evaluate((el) => {
    el.value = '0';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });

  await page.locator('#scale-seg button[data-scale="true"]').click();
  await expect(page.locator('#scale-seg button[data-scale="true"]')).toHaveClass(/active/);
  await page.locator('#scale-seg button[data-scale="schematic"]').click();
  await expect(page.locator('#scale-seg button[data-scale="schematic"]')).toHaveClass(/active/);

  const playButton = page.locator('#play-btn');
  await playButton.click();
  await expect(playButton).toHaveText('▶');
  await playButton.click();
  await expect(playButton).toHaveText('⏸');

  await page.locator('#layers-btn').click();
  await expect(page.locator('#layers-menu')).not.toHaveClass(/hidden/);
  await page.locator('#layer-labels').click();
  await expect(page.locator('#layer-labels')).not.toBeChecked();
  await page.locator('#layer-labels').click();
  await expect(page.locator('#layer-labels')).toBeChecked();

  // New content layers: dwarf planets + motion trails toggle without errors.
  await expect(page.locator('#layer-trails')).toBeChecked();
  await page.locator('#layer-dwarfs').click();
  await expect(page.locator('#layer-dwarfs')).toBeChecked();
  await page.locator('#layer-dwarfs').click();
  await expect(page.locator('#layer-dwarfs')).not.toBeChecked();
  // Scale bar is visible and shows a length label.
  await expect(page.locator('#scale-bar')).toBeVisible();
  await expect(page.locator('#scale-label')).not.toHaveText('');

  await page.locator('#quality-seg button[data-quality="performance"]').click();
  await expect(page.locator('#quality-seg button[data-quality="performance"]')).toHaveClass(/active/);
  await expect(page.locator('#layer-bloom')).not.toBeChecked();
  await expect(page.locator('#layer-bloom')).toBeDisabled();

  await page.locator('#quality-seg button[data-quality="quality"]').click();
  await expect(page.locator('#quality-seg button[data-quality="quality"]')).toHaveClass(/active/);
  await expect(page.locator('#layer-bloom')).toBeEnabled();
  await expect(page.locator('#layer-bloom')).toBeChecked();

  await page.locator('#layers-btn').click();
  await expect(page.locator('#layers-menu')).toHaveClass(/hidden/);

  await page.locator('#help-btn').click();
  await expect(page.locator('#help-panel')).not.toHaveClass(/hidden/);
  await expect(page.locator('#help-panel')).toContainText('科学精度说明');
  await expect(page.locator('#help-panel')).toContainText('教育可视化');
  await expect(page.locator('#help-panel')).toContainText('1800–2050');
  await page.locator('#help-close').click();
  await expect(page.locator('#help-panel')).toHaveClass(/hidden/);

  // The planet-list panel is hidden now (layers menu took its place), so select a planet via
  // the '1' keyboard shortcut (Mercury) and verify the info card + fact + comparison bar.
  await page.keyboard.press('1');
  await expect(page.locator('#info')).not.toHaveClass(/hidden/);
  await expect(page.locator('#solo-status')).toContainText('独显');
  await expect(page.locator('#info-fact')).toBeVisible();
  await expect(page.locator('#info-compare .cmp')).toHaveCount(1);
  await page.locator('#info-close').click();
  await expect(page.locator('#info')).toHaveClass(/hidden/);

  // Dwarf-planet layer: enable it via the checkbox (planet-list removed) so dwarfs render
  // through the remaining interactions without errors.
  await page.locator('#layer-dwarfs').evaluate(el => { el.checked = true; el.dispatchEvent(new Event('change', { bubbles: true })); });
  await expect(page.locator('#layer-dwarfs')).toBeChecked();

  await page.keyboard.press('Escape');
  await expect(page.locator('#solo-status')).toHaveText('全景');
  await page.keyboard.press('1');
  await expect(page.locator('#solo-status')).toContainText('水星');
  await page.keyboard.press('Escape');
  await expect(page.locator('#solo-status')).toHaveText('全景');

  // Rotate-around-cursor option: on by default; V toggles the layer checkbox.
  await expect(page.locator('#layer-rotate-cursor')).toBeChecked();
  await page.keyboard.press('v');
  await expect(page.locator('#layer-rotate-cursor')).not.toBeChecked();
  await page.keyboard.press('v');
  await expect(page.locator('#layer-rotate-cursor')).toBeChecked();

  // Sound engine: enabling it and triggering sonified interactions must not error.
  // (#sound-btn lives in a display:none legacy container; the real control is the
  // #layer-sound checkbox inside the layers menu, toggled here via a synthetic
  // change event like the scrubber above.)
  // Default bed theme is the bundled 太空音效1 (space1).
  await expect(page.locator('#audio-theme')).toHaveValue('space1');
  // Switch to a procedural theme before enabling sound so the test does not
  // fetch the 33 MB bundled track.
  await page.locator('#audio-theme').evaluate(el => {
    el.value = 'deep';
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.locator('#layer-sound').evaluate(el => {
    el.checked = true;
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await expect(page.locator('#layer-sound')).toBeChecked();
  // Cycle ambient bed themes via the selector (synthetic change events).
  for (const theme of ['nebula', 'orbit', 'solar', 'deep']) {
    await page.locator('#audio-theme').evaluate((el, v) => {
      el.value = v;
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, theme);
  }
  await page.keyboard.press('1');          // planet select + fly-in whoosh
  await page.keyboard.press('Escape');     // clear solo
  await page.locator('#speed-seg button[data-speed="year"]').click(); // time-speed glide
  await page.locator('#speed-seg button[data-speed="day"]').click();
  await page.locator('#layer-sound').evaluate(el => {
    el.checked = false;
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await expect(page.locator('#layer-sound')).not.toBeChecked();

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test('mobile viewport defaults to performance quality mode', async ({ page }) => {
  const { pageErrors, consoleErrors } = collectPageErrors(page);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  await expect(page.locator('#stage')).toBeVisible();
  await expect(page.locator('#loader')).toHaveClass(/gone/, { timeout: 15_000 });
  await expect(page.locator('#quality-seg button[data-quality="performance"]')).toHaveClass(/active/);

  await page.locator('#layers-btn').dispatchEvent('click');
  await expect(page.locator('#layers-menu')).not.toHaveClass(/hidden/);
  await expect(page.locator('#layer-bloom')).not.toBeChecked();
  await expect(page.locator('#layer-bloom')).toBeDisabled();

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
