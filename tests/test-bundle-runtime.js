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
assert(html.includes('<title>Enhancing the Climate Resilience of Vulnerable Island Communities in Federated States of Micronesia | Adaptation Fund</title>'), 'Root page title missing');

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
const dataAssetKey = 'df0aa483-11a8-4cb9-a9d0-a2ee764c11fe';
assert(manifest[dataAssetKey], 'VIEWER_DATA asset missing from manifest');
const rawData = Buffer.from(manifest[dataAssetKey].data, 'base64');
const viewerDataText = manifest[dataAssetKey].compressed ? zlib.gunzipSync(rawData).toString('utf8') : rawData.toString('utf8');

for (const comp of ['Component 1', 'Component 2', 'Component 3', 'Legislation and policy paper']) {
  assert(viewerDataText.includes(comp), `Missing data in VIEWER_DATA: ${comp}`);
}

// Data validation edits (Richard Moufa's comments, Oct 2026)
for (const text of ["'National departments engaged','8, plus 4 development partners'", "'7 (4 state, 3 national)'",
  "'Rain water catchment completed','281'", '2 compost toilets completed, 1 ongoing']) {
  assert(viewerDataText.includes(text), `Validated value missing from VIEWER_DATA: ${text}`);
}
for (const text of ['Tanks completed', 'Houses with new roof gutters', 'New tanks installed']) {
  assert(!viewerDataText.includes(text), `Deleted indicator still present: ${text}`);
}

// Output photos: every referenced file exists and stays small
const photosMatch = viewerDataText.match(/window\.VIEWER_PHOTOS = (\{[\s\S]*?\});/);
assert(photosMatch, 'VIEWER_PHOTOS missing from data asset');
const photos = JSON.parse(photosMatch[1]);
let photoCount = 0;
for (const [code, list] of Object.entries(photos)) {
  for (const [thumb, full, cap] of list) {
    photoCount++;
    assert(cap && cap.trim(), `Photo for ${code} has no caption`);
    assert(fs.existsSync(thumb) && fs.existsSync(full), `Photo file missing: ${thumb} / ${full}`);
    assert(fs.statSync(thumb).size < 120 * 1024, `Thumbnail too large (>120KB): ${thumb}`);
    assert(fs.statSync(full).size < 400 * 1024, `Full photo too large (>400KB): ${full}`);
  }
}
assert(photoCount >= 20, `Expected at least 20 photos, found ${photoCount}`);

// 4. Verify Content Preservation (Without Losing Context)
const requiredTexts = [
  'Adaptation Fund',
  'Federated States of Micronesia',
  'Enhancing the Climate Resilience of Vulnerable Island Communities in Federated States of Micronesia',
  'alt="Government of the Federated States of Micronesia"',
  'alt="Secretariat of the Pacific Regional Environment Programme (SPREP)"',
  'alt="Adaptation Fund"',
  'USD 9m',
  'Project period',
  '2018–2027',
  'Water units repaired or installed',
  '281',
  'People impacted',
  '3,253',
  '500',
  'Who the project reaches',
  'component-from-global-scope="beneficiary-map"',
  'Project status',
  'Coverage by state',
  'About the project',
  'Four areas of work',
  'Reviewing national and state laws',
  'Improving water security on six outer atolls',
  'Components',
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
// Leaflet's vendored stylesheet (starts "/* required styles */") has internal tile sizes like 1600px; skip it
const ownCss = template.replace(/<style>\/\* required styles \*\/[\s\S]*?<\/style>/, '');
const fixedWidthMatches = ownCss.matchAll(/(?<!max-)(?<!min-)width\s*:\s*(\d+)px/g);
for (const match of fixedWidthMatches) {
  const widthVal = parseInt(match[1], 10);
  assert(widthVal <= 320, `Found fixed width ${widthVal}px > 320px causing horizontal overflow`);
}

// 8. Verify media query breakpoints
assert(template.includes('@media (max-width: 960px)'), '960px media query missing');
assert(template.includes('@media (max-width: 680px)'), '680px media query missing');
assert(template.includes('@media (max-width: 420px)'), '420px media query missing');

// A literal src="{{ ... }}" makes the browser request the placeholder before render; use sc-camel-src
assert(!/<img[^>]*\ssrc="\{\{/.test(template), 'Templated <img src="{{...}}"> found; use sc-camel-src');
assert(template.includes('sc-camel-src="{{ p.thumb }}"') && template.includes('loading="lazy"'), 'Lazy photo thumbnails missing');

// 9. Verify interactive logic preserved
assert(template.includes('class Component extends DCLogic'), 'DCLogic component missing');
assert(template.includes('window.VIEWER_DATA'), 'VIEWER_DATA check missing');

console.log('✅ All responsive & content integrity verification tests passed successfully!');
