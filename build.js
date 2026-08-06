#!/usr/bin/env node
// Static site generator for the annabelruddle.com replica.
// Reads scraped content from ./scrape/*.json and the image url->local map,
// and emits static HTML pages into the repo root (clean-url folders).

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SCRAPE = path.join(ROOT, 'scrape');

function readJSON(name) {
  return JSON.parse(fs.readFileSync(path.join(SCRAPE, name), 'utf8'));
}

const urlMap = readJSON('url-to-local.json');
const site = readJSON('site.json');

function img(url, prefix) {
  if (!url) return '';
  return (prefix || '') + (urlMap[url] || url);
}

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ----------------------------------------------------------------
// Layout partials
// ----------------------------------------------------------------
function renderNav(prefix, currentHref) {
  const isCurrent = (href) => (href === currentHref ? ' aria-current="page"' : '');
  const workItems = site.nav.work
    .map((w) => `<li><a href="${prefix}${w.href}/">${esc(w.text)}</a></li>`)
    .join('');
  const artItems = site.nav.art
    .map((a) => `<li><a href="${prefix}${a.href}/">${esc(a.text)}</a></li>`)
    .join('');
  return `
  <nav class="site-nav" aria-label="Primary">
    <a href="${prefix}/"${isCurrent('/')}>Home</a>
    <div class="site-nav__item">
      <button type="button" aria-haspopup="true" aria-expanded="false">Work</button>
      <ul class="site-nav__dropdown">${workItems}</ul>
    </div>
    <div class="site-nav__item">
      <button type="button" aria-haspopup="true" aria-expanded="false">Art</button>
      <ul class="site-nav__dropdown">${artItems}</ul>
    </div>
    <a href="${prefix}/about/"${isCurrent('/about')}>About</a>
  </nav>`;
}

function renderHeader(prefix, currentHref) {
  return `
<header class="site-header">
  <a class="site-header__logo" href="${prefix}/" aria-label="Annabel Ruddle — Home">
    <img src="${prefix}${img(site.logo)}" alt="Annabel Ruddle" width="150" height="26" />
  </a>
  ${renderNav(prefix, currentHref)}
  <button class="nav-toggle" type="button" aria-label="Toggle menu" aria-expanded="false">
    <svg width="22" height="16" viewBox="0 0 22 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 1H22" stroke="black" stroke-width="1.6"/>
      <path d="M0 8H22" stroke="black" stroke-width="1.6"/>
      <path d="M0 15H22" stroke="black" stroke-width="1.6"/>
    </svg>
  </button>
</header>`;
}

function renderFooter(prefix) {
  const links = site.footer.workLinks
    .map((l) => `<li><a href="${prefix}${l.href}/">${esc(l.text)}</a></li>`)
    .join('');
  return `
<footer class="site-footer">
  <div class="site-footer__grid">
    <div>
      <h5>Work</h5>
      <ul>${links}</ul>
    </div>
    <div>
      <h5>Contact</h5>
      <ul><li><a href="mailto:${site.footer.email}">${site.footer.email}</a></li></ul>
    </div>
  </div>
  <div class="site-footer__base">
    <span>${esc(site.footer.copyright)}</span>
    <a href="mailto:${site.footer.email}">${site.footer.email}</a>
  </div>
</footer>`;
}

function page({ prefix, currentHref, title, description, bodyClass, bodyHTML }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}" />
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter+Tight:ital,wght@0,400;0,500;0,600;0,700;1,500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${prefix}/styles.css" />
</head>
<body class="${bodyClass || ''}">
${renderHeader(prefix, currentHref)}
<main id="page">
${bodyHTML}
</main>
${renderFooter(prefix)}
<script src="${prefix}/script.js"></script>
</body>
</html>
`;
}

function write(relPath, html) {
  const full = path.join(ROOT, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, html);
  console.log('wrote', relPath);
}

// ----------------------------------------------------------------
// Home page
// ----------------------------------------------------------------
function buildHome() {
  const data = readJSON('home.json');
  const blocks = data.blocks;
  let i = 0;
  const heroBg = blocks[i].type === 'img' ? blocks[i++].src : null;
  const heroTitle = blocks[i++].text; // heading H2
  const heroEmail = blocks[i++].text; // heading H4

  const bands = [];
  let band = { bg: null, items: [] };
  let pendingClient = null;
  let pendingTitle = null;
  let pendingMeta = [];

  for (; i < blocks.length; i++) {
    const b = blocks[i];
    if (b.type === 'img' && !b.href) {
      if (band.items.length) bands.push(band);
      band = { bg: b.src, items: [] };
    } else if (b.type === 'heading') {
      if (pendingClient === null) pendingClient = b.text;
      else if (pendingTitle === null) pendingTitle = b.text;
    } else if (b.type === 'p') {
      pendingMeta.push(b.text);
    } else if (b.type === 'img' && b.href) {
      band.items.push({ client: pendingClient, title: pendingTitle, meta: pendingMeta.join(' '), img: b.src, href: b.href });
      pendingClient = null; pendingTitle = null; pendingMeta = [];
    }
  }
  if (band.items.length) bands.push(band);

  const heroTitleHTML = esc(heroTitle).replace(
    /(Senior Product Designer)/,
    '<strong>$1</strong>'
  );

  const bandsHTML = bands
    .map((bandItem) => {
      const itemsHTML = bandItem.items
        .map(
          (it) => `
      <article class="work-item" data-reveal>
        <div class="work-item__text">
          <p class="work-item__client">${esc(it.client)}</p>
          <a href="${it.href}/"><h3 class="work-item__title">${esc(it.title)}</h3></a>
          <p class="work-item__meta">${esc(it.meta)}</p>
        </div>
        <a class="work-item__figure" href="${it.href}/" aria-label="${esc(it.title)}">
          <img src="${img(it.img, '')}" alt="${esc(it.title)}" loading="lazy" />
        </a>
      </article>`
        )
        .join('');
      return `<div class="work-band" style="background-image:url('${img(bandItem.bg, '')}')">${itemsHTML}</div>`;
    })
    .join('');

  const body = `
<section class="hero" style="background-image:url('${img(heroBg, '')}')">
  <div class="hero__inner">
    <h1>${heroTitleHTML}</h1>
    <p class="hero__email"><a href="mailto:${heroEmail}">${esc(heroEmail)}</a></p>
  </div>
</section>
${bandsHTML}`;

  write(
    'index.html',
    page({
      prefix: '',
      currentHref: '/',
      title: 'Annabel Ruddle',
      description: 'Annabel Ruddle is a Senior Product Designer based in Brooklyn, NY.',
      bodyHTML: body,
    })
  );
}

// ----------------------------------------------------------------
// About page
// ----------------------------------------------------------------
function buildAbout() {
  const d = readJSON('about.json');
  const skillsHTML = d.skills
    .map(
      (s) => `<div class="skill" data-reveal><h4>${esc(s.title)}</h4><p>${esc(s.text)}</p></div>`
    )
    .join('');
  const factsHTML = d.funFacts
    .map((f, idx) => {
      const imgs = [d.images.top1, d.images.top2, d.images.dog, d.images.dog];
      return `<div class="fact" data-reveal><img src="${img(imgs[idx] || d.images.top1, '..')}" alt="" loading="lazy" /><h4>${esc(
        f.title
      )}</h4><p>${esc(f.text)}</p></div>`;
    })
    .join('');

  const body = `
<section class="about-hero" style="background-image:url('${img(d.images.top1, '..')}')">
  <div>
    <p class="eyebrow">About</p>
    <h1>${esc(d.heading)}</h1>
    <p>${esc(d.intro)}</p>
    <p class="flags">${d.flags}</p>
    <a class="resume-btn" href="https://www.annabelruddle.com${d.resumeHref}">Download Resume →</a>
  </div>
  <div class="about-hero__photo">
    <img src="${img(d.images.headshot, '..')}" alt="Annabel Ruddle" loading="lazy" />
  </div>
</section>
<section class="section">
  <p class="eyebrow">${esc(d.skillsHeading)}</p>
  <div class="skills-grid">${skillsHTML}</div>
</section>
<section class="section">
  <p class="eyebrow">A few more things</p>
  <div class="facts-grid">${factsHTML}</div>
</section>`;

  write(
    'about/index.html',
    page({
      prefix: '..',
      currentHref: '/about',
      title: 'About — Annabel Ruddle',
      description: d.heading,
      bodyHTML: body,
    })
  );
}

// ----------------------------------------------------------------
// Case study pages (generic block renderer)
// ----------------------------------------------------------------
function parseCaseStudy(blocks) {
  let i = 0;
  const heroImgs = [];
  while (blocks[i] && blocks[i].type === 'img') heroImgs.push(blocks[i++].src);

  // Some pages lead with a small client-name tag (H4/H5) before the real
  // title heading (H1-H3). Capture it separately rather than mistaking it
  // for the title.
  let client = null;
  while (blocks[i] && blocks[i].type === 'heading' && !['H1', 'H2', 'H3'].includes(blocks[i].level)) {
    client = blocks[i++].text;
  }

  let title = null;
  if (blocks[i] && blocks[i].type === 'heading') title = blocks[i++].text;

  while (blocks[i] && blocks[i].type === 'img') heroImgs.push(blocks[i++].src);

  let subtitle = null;
  if (blocks[i] && blocks[i].type === 'p' && blocks[i].text.length < 140) subtitle = blocks[i++].text;

  while (blocks[i] && blocks[i].type === 'img') heroImgs.push(blocks[i++].src);

  const meta = [];
  while (blocks[i] && blocks[i].type === 'heading' && blocks[i].level === 'H4') {
    const label = blocks[i++].text;
    const items = [];
    while (blocks[i] && (blocks[i].type === 'p' || blocks[i].type === 'li')) items.push(blocks[i++].text);
    meta.push({ label, items });
  }

  const content = blocks.slice(i);
  return { heroImgs, client, title, subtitle, meta, content };
}

function renderContent(content, prefix) {
  let html = '';
  let listBuffer = [];
  const flushList = () => {
    if (listBuffer.length) {
      html += `<ul class="cs-list">${listBuffer.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`;
      listBuffer = [];
    }
  };
  content.forEach((b) => {
    if (b.type === 'li') {
      listBuffer.push(b.text);
      return;
    }
    flushList();
    if (b.type === 'heading') {
      const level = { H1: 'h2', H2: 'h2', H3: 'h3', H4: 'h4', H5: 'h4' }[b.level] || 'h3';
      html += `<${level} class="cs-block" data-reveal>${esc(b.text)}</${level}>`;
    } else if (b.type === 'p') {
      html += `<p class="cs-block" data-reveal>${esc(b.text)}</p>`;
    } else if (b.type === 'quote') {
      html += `<p class="cs-block cs-block--quote" data-reveal>${esc(b.text)}</p>`;
    } else if (b.type === 'img') {
      html += `<figure class="cs-figure" data-reveal><img src="${img(b.src, prefix)}" alt="" loading="lazy" /></figure>`;
    }
  });
  flushList();
  return html;
}

function buildCaseStudy(slug, jsonName, opts) {
  opts = opts || {};
  const d = readJSON(jsonName);
  const parsed = parseCaseStudy(d.blocks);
  const title = opts.title || parsed.title || d.title;
  const cover = parsed.heroImgs[0];

  const metaHTML = parsed.meta.length
    ? parsed.meta
        .map((g) => {
          if (!g.items.length) {
            return `<div class="cs-meta__group"><p>${esc(g.label)}</p></div>`;
          }
          return `
    <div class="cs-meta__group">
      <h5>${esc(g.label)}</h5>
      ${g.items.length > 1
        ? `<ul>${g.items.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`
        : `<p>${esc(g.items[0] || '')}</p>`}
    </div>`;
        })
        .join('')
    : '';

  const subtitle = parsed.client
    ? parsed.subtitle
      ? `${parsed.client} — ${parsed.subtitle}`
      : parsed.client
    : parsed.subtitle;

  const contentHTML = renderContent(parsed.content, '..');
  const extraImgsHTML = parsed.heroImgs
    .slice(1)
    .map((src) => `<figure class="cs-figure" data-reveal><img src="${img(src, '..')}" alt="" loading="lazy" /></figure>`)
    .join('');

  const body = `
<section class="cs-hero">
  <p class="eyebrow">Case Study</p>
  <h1>${esc(title)}</h1>
  ${subtitle ? `<p class="cs-hero__subtitle">${esc(subtitle)}</p>` : ''}
  ${cover ? `<img class="cs-hero__cover" src="${img(cover, '..')}" alt="" loading="lazy" />` : ''}
</section>
<div class="cs-layout">
  ${metaHTML ? `<aside class="cs-meta">${metaHTML}</aside>` : ''}
  <div class="cs-content" ${metaHTML ? '' : 'style="grid-column: 1 / -1; max-width: 880px; margin: 0 auto;"'}>
    ${extraImgsHTML}
    ${contentHTML}
  </div>
</div>`;

  write(
    `${slug}/index.html`,
    page({
      prefix: '..',
      currentHref: `/${slug}`,
      title: `${title} — Annabel Ruddle`,
      description: subtitle || title,
      bodyHTML: body,
    })
  );
}

// A minimal case-study page for /touchandgo, whose live source 404s —
// built only from the summary shown on the homepage work grid.
function buildTouchAndGo() {
  const home = readJSON('home.json');
  const b = home.blocks;
  const idx = b.findIndex((x) => x.type === 'img' && x.href === '/touchandgo');
  const card = {
    client: b[idx - 3] && b[idx - 3].text,
    title: b[idx - 2] && b[idx - 2].text,
    meta: b[idx - 1] && b[idx - 1].text,
    img: b[idx].src,
  };
  const body = `
<section class="cs-hero">
  <p class="eyebrow">Case Study</p>
  <h1>${esc(card.title)}</h1>
  <p class="cs-hero__subtitle">${esc(card.client)} — ${esc(card.meta)}</p>
  <img class="cs-hero__cover" src="${img(card.img, '..')}" alt="" loading="lazy" />
</section>
<div class="cs-layout">
  <div class="cs-content" style="grid-column: 1 / -1; max-width: 880px; margin: 0 auto;">
    <p class="cs-block" data-reveal>${esc(card.title)}</p>
    <p class="cs-block" data-reveal>Redefining how Bostonians and New Yorkers pay for transportation, designed for the MBTA & MTA transit systems.</p>
    <div class="cs-notfound" data-reveal>This case study's detail page is unpublished on the live site (annabelruddle.com/touchandgo currently returns a 404), so this replica includes only the summary shown on the homepage.</div>
  </div>
</div>`;
  write(
    'touchandgo/index.html',
    page({
      prefix: '..',
      currentHref: '/touchandgo',
      title: `${card.title} — Annabel Ruddle`,
      description: card.title,
      bodyHTML: body,
    })
  );
}

// ----------------------------------------------------------------
// Art pages
// ----------------------------------------------------------------
function buildMedia() {
  const d = readJSON('media.json');
  const galleryHTML = d.imgs
    .map((src) => `<img src="${img(src, '..')}" alt="" loading="lazy" />`)
    .join('');
  const body = `
<section class="section">
  <p class="eyebrow">Art</p>
  <h1 class="cs-block">${esc(d.heading)}</h1>
  <p class="cs-block" data-reveal>Short films, generative art, and photography.</p>
  <a class="resume-btn" href="https://www.annabelruddle.com${d.cvHref}">Artist & Exhibition CV →</a>
  <div class="gallery-grid" data-reveal>${galleryHTML}</div>
  <p class="cs-block" style="margin-top:24px" data-reveal>View more art at <a href="${d.artSiteHref}" style="text-decoration:underline">annabelruddle.art</a></p>
</section>`;
  write(
    'media/index.html',
    page({
      prefix: '..',
      currentHref: '/media',
      title: d.title,
      description: d.heading,
      bodyHTML: body,
    })
  );
}

function buildAestheticPlay() {
  const d = readJSON('aestheticplay.json');
  const galleryHTML = d.imgs.map((src) => `<img src="${img(src, '..')}" alt="" loading="lazy" />`).join('');
  const body = `
<section class="section">
  <p class="eyebrow">Art — ${esc(d.year)}</p>
  <h1 class="cs-block">${esc(d.heading)}</h1>
  <p class="cs-block" data-reveal>${esc(d.subtext)}</p>
  <p class="cs-block" data-reveal style="font-size:14px">${esc(d.note)}</p>
  <div class="gallery-grid" data-reveal>${galleryHTML}</div>
</section>`;
  write(
    'aestheticplay/index.html',
    page({
      prefix: '..',
      currentHref: '/aestheticplay',
      title: d.title,
      description: d.heading,
      bodyHTML: body,
    })
  );
}

// ----------------------------------------------------------------
// 404
// ----------------------------------------------------------------
function build404() {
  const body = `
<section class="section section--narrow" style="min-height:50vh">
  <p class="eyebrow">404</p>
  <h1 class="cs-block">We couldn't find the page you were looking for.</h1>
  <p class="cs-block" data-reveal>Please check the URL, or head back to the <a href="/" style="text-decoration:underline">homepage</a>.</p>
</section>`;
  write(
    '404.html',
    page({ prefix: '', currentHref: '', title: 'Not Found — Annabel Ruddle', description: 'Page not found', bodyHTML: body })
  );
}

// ----------------------------------------------------------------
// Run
// ----------------------------------------------------------------
buildHome();
buildAbout();
buildCaseStudy('education', 'education.json');
buildCaseStudy('portfolio', 'portfolio.json');
buildCaseStudy('enterprise', 'enterprise.json');
buildCaseStudy('aieditor', 'aieditor.json');
buildCaseStudy('bbb', 'bbb.json');
buildCaseStudy('mapp', 'mapp.json');
buildCaseStudy('intranet', 'intranet.json');
buildCaseStudy('accountdashboard', 'accountdashboard.json');
buildCaseStudy('mstore', 'mstore.json');
buildCaseStudy('mstorex2', 'mstorex2.json');
buildTouchAndGo();
buildMedia();
buildAestheticPlay();
build404();

console.log('\nBuild complete.');
