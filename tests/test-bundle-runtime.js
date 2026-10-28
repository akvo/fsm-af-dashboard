#!/usr/bin/env node
/**
 * Automated Responsive & Content Integrity Verification Test for FSM AF Dashboard.
 * Verifies:
 * 1. Bundle unpackability (valid JSON manifest and template)
 * 2. Zero loss of content, context, metrics, and text (in template and VIEWER_DATA)
 * 3. Mobile responsiveness safeguards (no fixed widths > 320px, presence of media queries, responsive classes)
 */

const fs = require('fs');
const zlib = require('zlib');
const assert = require('assert');

const html = fs.readFileSync('index.html', 'utf8');

// 1. Verify viewport tag and title in root document
assert(html.includes('<meta name="viewport" content="width=device-width, initial-scale=1">'), 'Root viewport meta tag missing');
assert(html.includes('<title>Adaptation Fund — Federated States of Micronesia</title>'), 'Root page title missing');

// 2. Extract manifest and template
const manifestMatch = html.match(/<script type="__bundler\/manifest">([\s\S]*?)<\/script>/);
assert(manifestMatch, 'Manifest missing');
const manifest = JSON.parse(manifestMatch[1].trim());
assert(Object.keys(manifest).length >= 4, 'Manifest should have at least 4 assets');

const templateStart = html.indexOf('<script type="__bundler/template">');
const bodyPos = html.lastIndexOf('</body>');
const templateEnd = html.lastIndexOf('</script>', bodyPos);
const templateJson = html.substring(templateStart + '<script type="__bundler/template">'.length, templateEnd).trim();
let template = JSON.parse(templateJson);

// 3. Verify VIEWER_DATA asset and unpack
const dataAssetKey = 'b954772d-d6b7-4836-bf75-fffe2b096441';
assert(manifest[dataAssetKey], 'VIEWER_DATA asset missing from manifest');
const rawData = Buffer.from(manifest[dataAssetKey].data, 'base64');
const viewerDataText = manifest[dataAssetKey].compressed ? zlib.gunzipSync(rawData).toString('utf8') : rawData.toString('utf8');

for (const comp of ['Component 1', 'Component 2', 'Component 3', 'Legislation and policy paper']) {
  assert(viewerDataText.includes(comp), `Missing data in VIEWER_DATA: ${comp}`);
}

// 4. Verify Content Preservation (Without Losing Context)
const requiredTexts = [
  'Adaptation Fund',
  'Federated States of Micronesia',
  'USD 9m',
  'Project period',
  '2018–2027',
  'Water units repaired or installed',
  '281',
  'Community members reached',
  '500',
  'About the project',
  'Four areas of work',
  'Reviewing national and state laws',
  'Improving water security on six outer atolls',
  'Component Reporting',
  'Baseline',
  'Endline target',
  'View details',
  'Hide details'
];
for (const text of requiredTexts) {
  assert(template.includes(text), `Context loss detected! Missing required text: '${text}'`);
}

// 5. Decompress assets and test replacement
for (const [uuid, entry] of Object.entries(manifest)) {
  const binaryBuffer = Buffer.from(entry.data, 'base64');
  if (entry.compressed) {
    zlib.gunzipSync(binaryBuffer);
  }
  template = template.split(uuid).join('blob:' + uuid);
}

// 6. Verify responsive classes
const requiredClasses = [
  'class="dashboard-viewer"',
  'class="dashboard-container"',
  'class="hero-card"',
  'class="hero-title"',
  'class="hero-subtitle"',
  'class="kpi-grid"',
  'class="kpi-card"',
  'class="section-title"',
  'class="about-grid"',
  'class="cards-grid"',
  'class="activity-card"',
  'class="target-grid"',
  'class="indicator-table"',
  'class="indicator-row"',
  'class="modal-overlay"',
  'class="modal-box"',
  'class="card-inline-details"',
  'class="panel-below-cards"'
];
for (const cls of requiredClasses) {
  assert(template.includes(cls), `Missing responsive class: ${cls}`);
}

// 7. Verify equal height cards and stretch alignment
assert(template.includes('align-items: stretch'), 'Equal height alignment missing on cards-grid');
assert(template.includes('height: 100%'), 'height: 100% missing on activity-card');

// 8. Verify no fixed widths > 320px (excluding max-width / min-width)
const fixedWidthMatches = template.matchAll(/(?<!max-)(?<!min-)width\s*:\s*(\d+)px/g);
for (const match of fixedWidthMatches) {
  const widthVal = parseInt(match[1], 10);
  assert(widthVal <= 320, `Found fixed width ${widthVal}px > 320px causing horizontal overflow`);
}

// 8. Verify media query breakpoints
assert(template.includes('@media (max-width: 960px)'), '960px media query missing');
assert(template.includes('@media (max-width: 680px)'), '680px media query missing');
assert(template.includes('@media (max-width: 420px)'), '420px media query missing');

// 9. Verify interactive logic preserved
assert(template.includes('class Component extends DCLogic'), 'DCLogic component missing');
assert(template.includes('window.VIEWER_DATA'), 'VIEWER_DATA check missing');

console.log('✅ All responsive & content integrity verification tests passed successfully!');
