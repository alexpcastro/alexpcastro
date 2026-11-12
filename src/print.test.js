import fs from 'fs';
import path from 'path';

const css = fs.readFileSync(path.join(__dirname, 'print.css'), 'utf8');

test('paper edition loads after component styles and is print-scoped', () => {
  const app = fs.readFileSync(path.join(__dirname, 'App.js'), 'utf8');
  expect(app.indexOf('import "./print.css"')).toBeGreaterThan(app.indexOf('import ContactFinale'));
  expect(css).toContain('@page { size: auto; margin: 11mm 13mm; }');
  expect(css).toContain('@media print');
});

test('print exposes every experience and the full skills catalog without animation state', () => {
  expect(css).toContain('.experience-gallery .experience-story[hidden]');
  expect(css).toContain('visibility: visible; opacity: 1; position: static');
  expect(css).toContain('.skills-catalog.visually-hidden');
  expect(css).toContain('animation: none !important');
  expect(css).toContain('break-inside: avoid');
});

test('Deloitte prints in solid ink without depending on background graphics', () => {
  expect(css).toContain('-webkit-text-fill-color: #18202a !important; background: none !important');
  expect(css).toContain('border: .08em solid #638e1c');
});

 test('print contact links expose their readable destination instead of platform labels', () => {
  expect(css).toContain('content: attr(data-print-url)');
  expect(css).toContain('.portfolio-contact-links a[data-print-url] > span { display: none; }');
});
