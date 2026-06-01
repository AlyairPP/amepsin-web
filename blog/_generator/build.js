/*
  Generador del blog de AMEPSIN
  --------------------------------
  Lee los archivos .md de blog/posts/ y genera automáticamente:
    - blog/index.html              (listado del blog)
    - blog/p/<slug>/index.html     (cada entrada, con vista previa para redes)
    - blog/feed.xml                (RSS para compartir automáticamente)

  El editor NO toca este archivo. Solo sube sus .md a blog/posts/.
  GitHub ejecuta este generador solo (ver .github/workflows/build-blog.yml).
*/

const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

/* ===================== CONFIGURACIÓN (verifica estos datos) ===================== */
const SITE = {
  domain: 'https://www.amepsin.com.mx',     // tu dominio (sin barra al final)
  name: 'AMEPSIN Salud Mental',
  wa: '522223496269',                        // WhatsApp en formato internacional
  defaultShare: '/blog/img/_default-share.jpg' // imagen por defecto para compartir (1200x630)
};
/* =============================================================================== */

const ROOT = path.join(__dirname, '..');           // carpeta blog/
const POSTS_DIR = path.join(ROOT, 'posts');
const OUT_P_DIR = path.join(ROOT, 'p');
const IMG_WEB = '/blog/img';

const MONTHS = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

function parseFrontMatter(text){
  const t = text.replace(/^\uFEFF/, '');
  const m = t.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if(!m) return { meta:{}, body:t };
  const meta = {};
  m[1].split('\n').forEach(line=>{
    const i = line.indexOf(':');
    if(i > -1){
      let v = line.slice(i+1).trim().replace(/^["']|["']$/g,'');
      meta[line.slice(0,i).trim().toLowerCase()] = v;
    }
  });
  return { meta, body:m[2] };
}
function parseName(file){
  const base = file.replace(/\.md$/i,'');
  const m = base.match(/^(\d{4})-(\d{2})-(\d{2})-(.+)$/);
  if(!m) return null;
  return { iso:`${m[1]}-${m[2]}-${m[3]}`, slug:m[4] };
}
function fmtDate(iso){ const [y,mo,d]=iso.split('-'); return `${parseInt(d,10)} de ${MONTHS[parseInt(mo,10)-1]} de ${y}`; }
function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function stripMd(md){
  return md.replace(/!\[[^\]]*\]\([^)]*\)/g,'')
           .replace(/\[([^\]]*)\]\([^)]*\)/g,'$1')
           .replace(/[#>*_`~]/g,' ').replace(/^[-*]\s/gm,' ')
           .replace(/\s+/g,' ').trim();
}
function prettify(slug){ const t = slug.replace(/-/g,' ').trim(); return t.charAt(0).toUpperCase()+t.slice(1); }
function waLink(text){ return `https://wa.me/${SITE.wa}?text=${encodeURIComponent(text)}`; }

/* Íconos de redes para los botones de compartir */
const IC_FB = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07c0 6.02 4.39 11.02 10.13 11.93v-8.44H7.08v-3.49h3.05V9.43c0-3.01 1.79-4.67 4.53-4.67 1.31 0 2.68.23 2.68.23v2.95h-1.51c-1.49 0-1.96.93-1.96 1.88v2.25h3.33l-.53 3.49h-2.8v8.44C19.61 23.09 24 18.1 24 12.07z"/></svg>';
const IC_WA = '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16.004 0h-.008C7.174 0 .002 7.174.002 16c0 3.5 1.128 6.744 3.046 9.376L1.054 31.32l6.149-1.966C9.732 31.018 12.748 32 16.004 32 24.83 32 32 24.826 32 16S24.83 0 16.004 0zm9.314 22.594c-.386 1.09-1.918 1.994-3.14 2.258-.836.178-1.928.32-5.604-1.204-4.7-1.948-7.728-6.724-7.964-7.034-.226-.31-1.9-2.53-1.9-4.826s1.166-3.412 1.636-3.892c.386-.394.024-.638 1.146-.638.362 0 .686.018.978.032.47.02.706.048.418 1.7.358 1.84 1.216 4.144 1.298 4.318.084.174.054.45-.054.694-.082.244-.394.45-.598.602-.204.152-.366.244-.516.488-.15.244-.366.45-.146.984.22.534 1.198 1.974 2.572 3.196 1.77 1.572 3.226 2.078 3.762 2.298.402.166.882.126 1.176-.184.374-.394.836-1.048 1.306-1.692.336-.464.762-.526 1.208-.354.456.166 2.882 1.358 3.376 1.604.494.246.822.366.942.572.118.21.118 1.202-.268 2.294z"/></svg>';
const IC_X  = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.451-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644z"/></svg>';
const IC_CP = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>';

/* ---------- Leer todas las entradas ---------- */
if(!fs.existsSync(POSTS_DIR)){ console.error('No existe la carpeta blog/posts/'); process.exit(1); }
const files = fs.readdirSync(POSTS_DIR).filter(f=>/^\d{4}-\d{2}-\d{2}-.+\.md$/i.test(f));

const posts = files.map(f=>{
  const info = parseName(f);
  const raw = fs.readFileSync(path.join(POSTS_DIR, f), 'utf8');
  const { meta, body } = parseFrontMatter(raw);
  const title = meta.titulo || prettify(info.slug);
  const excerpt = meta.extracto || (stripMd(body).slice(0,160) + '…');
  const cover = meta.portada ? `${IMG_WEB}/${meta.portada}` : null;
  const coverAbs = meta.portada ? `${SITE.domain}${IMG_WEB}/${meta.portada}` : `${SITE.domain}${SITE.defaultShare}`;
  const author = meta.autor || 'Equipo AMEPSIN';
  // render markdown -> html y corregir rutas de imágenes a ruta absoluta del sitio
  let html = marked.parse(body);
  html = html.replace(/(src=")img\//g, `$1${IMG_WEB}/`);
  return {
    slug: info.slug, iso: info.iso, dateNum: new Date(info.iso+'T12:00:00Z').getTime(),
    dateFmt: fmtDate(info.iso), rfc822: new Date(info.iso+'T12:00:00Z').toUTCString(),
    title, excerpt, cover, coverAbs, author, html,
    url: `${SITE.domain}/blog/p/${info.slug}/`, path: `/blog/p/${info.slug}/`
  };
}).sort((a,b)=>b.dateNum - a.dateNum);

console.log(`Generando ${posts.length} entrada(s)...`);

/* ---------- CSS compartido ---------- */
const CSS = `
:root{--navy:#1e3a5f;--navy-deep:#142a44;--blue:#3a6ea5;--blue-light:#eaf1f8;--bg:#f6f8fb;--white:#fff;--text:#27313d;--text-soft:#52606d;--text-muted:#8a97a5;--border:rgba(30,58,95,.1);--radius:16px;--shadow:0 4px 18px rgba(30,58,95,.08);--shadow-lg:0 16px 44px rgba(30,58,95,.14)}
*{box-sizing:border-box;margin:0;padding:0}html{scroll-behavior:smooth}
body{font-family:'Inter',system-ui,-apple-system,sans-serif;color:var(--text);background:var(--white);line-height:1.7;-webkit-font-smoothing:antialiased}
img{max-width:100%;display:block}a{color:var(--blue);text-decoration:none;transition:color .2s}a:hover{color:var(--navy)}
.container{max-width:1140px;margin:0 auto;padding:0 24px}
h1,h2,h3,h4{font-family:'Lora',Georgia,serif;color:var(--navy);line-height:1.25;font-weight:700}
header{position:sticky;top:0;z-index:100;background:rgba(255,255,255,.97);backdrop-filter:blur(14px);border-bottom:1px solid var(--border);padding:12px 0}
.nav-inner{display:flex;align-items:center;justify-content:space-between;gap:16px}
.logo{display:flex;align-items:center;gap:10px;color:var(--navy)}
.logo-badge{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,var(--navy),var(--blue));display:grid;place-items:center;color:#fff;font-size:.8rem;font-weight:700;flex-shrink:0}
.logo-text span{display:block;font-size:.97rem;font-weight:600;line-height:1.1}.logo-text small{font-size:.58rem;letter-spacing:2px;color:var(--text-soft);text-transform:uppercase}
.nav-links{display:flex;gap:24px;list-style:none;align-items:center}
.nav-links a{color:var(--text);font-weight:500;font-size:.92rem}.nav-links a.active{color:var(--navy);font-weight:600}
.nav-cta{display:inline-flex;align-items:center;gap:8px;background:#25d366;color:#fff!important;padding:9px 18px;border-radius:30px;font-weight:600;font-size:.85rem;white-space:nowrap;transition:all .2s}
.nav-cta:hover{background:#1ebe5b;transform:translateY(-1px)}
@media(max-width:820px){.nav-links li:not(.cta-li){display:none}}
footer{background:var(--navy-deep);color:rgba(255,255,255,.6);padding:30px 0;font-size:.84rem;text-align:center}
footer a{color:rgba(255,255,255,.85)}footer p{margin-bottom:5px}
.footer-links{margin-top:10px;display:flex;gap:18px;justify-content:center;flex-wrap:wrap}
.floating{position:fixed;bottom:24px;right:24px;z-index:9999}
.float-btn{width:56px;height:56px;border-radius:50%;display:grid;place-items:center;color:#fff;background:linear-gradient(135deg,#4ce28a,#25d366 60%,#1ba94a);box-shadow:0 8px 24px rgba(37,211,102,.45);transition:all .25s}
.float-btn:hover{transform:translateY(-3px) scale(1.06)}
@media(max-width:600px){.floating{bottom:14px;right:14px}.float-btn{width:50px;height:50px}}
`;

const HEADER = `
<header><div class="container nav-inner">
  <a href="/index.html" class="logo"><div class="logo-badge">A</div><div class="logo-text"><span>AMEPSIN</span><small>Salud Mental</small></div></a>
  <ul class="nav-links">
    <li><a href="/index.html">Inicio</a></li>
    <li><a href="/index.html#servicios">Servicios</a></li>
    <li><a href="/blog/" class="active">Blog</a></li>
    <li><a href="/index.html#contacto">Contacto</a></li>
    <li class="cta-li"><a href="${waLink('Hola, me gustaría agendar una cita en AMEPSIN')}" target="_blank" rel="noopener" class="nav-cta">Agendar</a></li>
  </ul>
</div></header>`;

const FOOTER = `
<footer><div class="container">
  <p>© ${new Date().getFullYear()} AMEPSIN — Asociación Mexicana de Psicología y Neurociencias. Todos los derechos reservados.</p>
  <p>3 Poniente 512, interior 10, Centro Histórico, Puebla · <a href="mailto:psicoterapia@amepsin.com.mx">psicoterapia@amepsin.com.mx</a></p>
  <div class="footer-links"><a href="/index.html">Inicio</a><a href="/aviso-de-privacidad.html">Aviso de Privacidad</a><a href="${waLink('Hola, me gustaría agendar una cita en AMEPSIN')}" target="_blank" rel="noopener">WhatsApp</a></div>
</div></footer>
<div class="floating"><a href="${waLink('Hola, me gustaría agendar una cita en AMEPSIN')}" target="_blank" rel="noopener" class="float-btn" aria-label="WhatsApp"><svg width="27" height="27" viewBox="0 0 32 32" fill="#fff"><path d="M16.004 0h-.008C7.174 0 .002 7.174.002 16c0 3.5 1.128 6.744 3.046 9.376L1.054 31.32l6.149-1.966C9.732 31.018 12.748 32 16.004 32 24.83 32 32 24.826 32 16S24.83 0 16.004 0zm9.314 22.594c-.386 1.09-1.918 1.994-3.14 2.258-.836.178-1.928.32-5.604-1.204-4.7-1.948-7.728-6.724-7.964-7.034-.226-.31-1.9-2.53-1.9-4.826s1.166-3.412 1.636-3.892c.386-.394.024-.638 1.146-.638.362 0 .686.018.978.032.47.02.706.048.418 1.7.358 1.84 1.216 4.144 1.298 4.318.084.174.054.45-.054.694-.082.244-.394.45-.598.602-.204.152-.366.244-.516.488-.15.244-.366.45-.146.984.22.534 1.198 1.974 2.572 3.196 1.77 1.572 3.226 2.078 3.762 2.298.402.166.882.126 1.176-.184.374-.394.836-1.048 1.306-1.692.336-.464.762-.526 1.208-.354.456.166 2.882 1.358 3.376 1.604.494.246.822.366.942.572.118.21.118 1.202-.268 2.294z"/></svg></a></div>`;

/* ---------- Página de cada entrada ---------- */
function postPage(p){
  const ld = {
    "@context":"https://schema.org","@type":"BlogPosting","headline":p.title,
    "datePublished":p.iso,"author":{"@type":"Organization","name":p.author},
    "image":p.coverAbs,"url":p.url,
    "publisher":{"@type":"Organization","name":"AMEPSIN Salud Mental"},
    "description":p.excerpt
  };
  const shareFB = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(p.url)}`;
  const shareWA = `https://wa.me/?text=${encodeURIComponent(p.title + ' ' + p.url)}`;
  const shareX  = `https://twitter.com/intent/tweet?url=${encodeURIComponent(p.url)}&text=${encodeURIComponent(p.title)}`;
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(p.title)} | Blog AMEPSIN</title>
<meta name="description" content="${esc(p.excerpt)}">
<link rel="canonical" href="${p.url}">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(p.title)}">
<meta property="og:description" content="${esc(p.excerpt)}">
<meta property="og:image" content="${p.coverAbs}">
<meta property="og:url" content="${p.url}">
<meta property="og:site_name" content="AMEPSIN Salud Mental">
<meta property="og:locale" content="es_MX">
<meta property="article:published_time" content="${p.iso}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(p.title)}">
<meta name="twitter:description" content="${esc(p.excerpt)}">
<meta name="twitter:image" content="${p.coverAbs}">
<meta name="theme-color" content="#1e3a5f">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Lora:ital,wght@0,500;0,600;0,700;1,400&display=swap" rel="stylesheet">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
<style>${CSS}
.article-wrap{padding:2.2rem 0 4rem;background:var(--bg)}
.article{max-width:760px;margin:0 auto;background:var(--white);border-radius:var(--radius);box-shadow:var(--shadow);border:1px solid var(--border);overflow:hidden}
.back-bar{max-width:760px;margin:0 auto 1.3rem;padding:0 4px}.back-link{font-size:.88rem;font-weight:500;color:var(--blue);display:inline-flex;align-items:center;gap:6px}
.cover{width:100%;aspect-ratio:16/8;object-fit:cover;background:var(--blue-light)}
.inner{padding:40px clamp(24px,5vw,56px) 44px}
.meta{display:flex;align-items:center;gap:12px;flex-wrap:wrap;font-size:.8rem;color:var(--blue);font-weight:600;letter-spacing:1px;text-transform:uppercase;margin-bottom:1rem}
.meta .dot{width:4px;height:4px;border-radius:50%;background:var(--text-muted)}.meta .muted{color:var(--text-muted);font-weight:500}
.title{font-size:clamp(1.8rem,4vw,2.6rem);color:var(--navy);line-height:1.2;margin-bottom:1.5rem}
.divider{height:3px;width:54px;background:linear-gradient(90deg,var(--blue),#c4a76f);border-radius:2px;margin-bottom:1.8rem}
.prose{font-size:1.07rem;color:var(--text);line-height:1.8}
.prose p{margin-bottom:1.3rem}.prose h2{font-size:1.55rem;margin:2.2rem 0 .9rem}.prose h3{font-size:1.25rem;margin:1.8rem 0 .7rem}
.prose ul,.prose ol{margin:0 0 1.4rem 1.5rem}.prose li{margin-bottom:.55rem}
.prose a{color:var(--blue);text-decoration:underline;text-underline-offset:2px}.prose strong{color:var(--navy);font-weight:600}
.prose img{border-radius:12px;margin:1.8rem 0;box-shadow:var(--shadow)}
.prose blockquote{border-left:4px solid var(--blue);background:var(--blue-light);padding:16px 22px;border-radius:0 10px 10px 0;margin:1.8rem 0;font-style:italic;color:var(--navy)}
.prose blockquote p{margin-bottom:0}.prose hr{border:0;border-top:1px solid var(--border);margin:2.4rem 0}
.prose code{background:var(--blue-light);padding:2px 7px;border-radius:5px;font-size:.92em;color:var(--navy)}
.share{margin-top:2.4rem;padding-top:1.6rem;border-top:1px solid var(--border)}
.share-label{font-size:.78rem;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:var(--text-muted);margin-bottom:.9rem}
.share-row{display:flex;gap:11px;flex-wrap:wrap}
.share-btn{display:inline-flex;align-items:center;gap:9px;padding:10px 18px;border-radius:26px;font-size:.86rem;font-weight:600;border:1.5px solid var(--border);color:var(--navy);background:var(--white);cursor:pointer;transition:transform .22s cubic-bezier(.34,1.56,.64,1),box-shadow .22s,background .22s,border-color .22s,color .22s;font-family:inherit}
.share-btn svg{width:17px;height:17px;flex-shrink:0;transition:transform .25s,fill .22s}
.share-btn span{line-height:1}
.share-btn:hover{transform:translateY(-3px);color:#fff}
.share-btn:hover svg{transform:scale(1.15)}
.share-btn:active{transform:translateY(-1px) scale(.97)}
.sb-fb svg{fill:#1877F2}
.sb-fb:hover{background:#1877F2;border-color:#1877F2;box-shadow:0 9px 22px rgba(24,119,242,.4)}
.sb-fb:hover svg{fill:#fff}
.sb-wa svg{fill:#25D366}
.sb-wa:hover{background:#25D366;border-color:#25D366;box-shadow:0 9px 22px rgba(37,211,102,.4)}
.sb-wa:hover svg{fill:#fff}
.sb-x svg{fill:#111}
.sb-x:hover{background:#111;border-color:#111;box-shadow:0 9px 22px rgba(0,0,0,.28)}
.sb-x:hover svg{fill:#fff}
.sb-cp svg{fill:var(--blue)}
.sb-cp:hover{background:var(--blue);border-color:var(--blue);box-shadow:0 9px 22px rgba(58,110,165,.35)}
.sb-cp:hover svg{fill:#fff}
.cta{max-width:760px;margin:2.4rem auto 0;background:linear-gradient(135deg,var(--navy),var(--blue));border-radius:var(--radius);padding:34px 30px;text-align:center;color:#fff}
.cta h3{color:#fff;font-size:1.35rem;margin-bottom:.5rem}.cta p{color:rgba(255,255,255,.85);font-size:.96rem;max-width:460px;margin:0 auto 1.4rem;line-height:1.6}
.btn-wa{display:inline-flex;align-items:center;gap:8px;background:#25d366;color:#fff;padding:14px 30px;border-radius:30px;font-weight:600;font-size:1rem;box-shadow:0 6px 20px rgba(0,0,0,.18);transition:all .25s}.btn-wa:hover{background:#1ebe5b;color:#fff;transform:translateY(-2px)}
.back2{text-align:center;margin-top:2.4rem}.back2 a{font-weight:600}
</style>
</head>
<body>
${HEADER}
<div class="article-wrap"><div class="container">
  <div class="back-bar"><a href="/blog/" class="back-link">← Volver al blog</a></div>
  <article class="article">
    ${p.cover ? `<img class="cover" src="${p.cover}" alt="${esc(p.title)}">` : ''}
    <div class="inner">
      <div class="meta"><span>${p.dateFmt}</span><span class="dot"></span><span class="muted">Por ${esc(p.author)}</span></div>
      <h1 class="title">${esc(p.title)}</h1>
      <div class="divider"></div>
      <div class="prose">${p.html}</div>
      <div class="share">
        <div class="share-label">Compartir esta entrada</div>
        <div class="share-row">
          <a class="share-btn sb-fb" href="${shareFB}" target="_blank" rel="noopener" aria-label="Compartir en Facebook">${IC_FB}<span>Facebook</span></a>
          <a class="share-btn sb-wa" href="${shareWA}" target="_blank" rel="noopener" aria-label="Compartir en WhatsApp">${IC_WA}<span>WhatsApp</span></a>
          <a class="share-btn sb-x" href="${shareX}" target="_blank" rel="noopener" aria-label="Compartir en X">${IC_X}<span>X (Twitter)</span></a>
          <button class="share-btn sb-cp" type="button" onclick="navigator.clipboard.writeText('${p.url}').then(()=>{const s=this.querySelector('span');const o=s.textContent;s.textContent='¡Copiado!';setTimeout(()=>{s.textContent=o},1800)})">${IC_CP}<span>Copiar enlace</span></button>
        </div>
      </div>
    </div>
  </article>
  <div class="cta">
    <h3>¿Te gustaría hablar con un profesional?</h3>
    <p>En AMEPSIN te acompañamos con psicoterapia y atención en salud mental, presencial en Puebla y en línea.</p>
    <a href="${waLink('Hola, leí un artículo en el blog de AMEPSIN y me gustaría agendar una cita. ¿Me pueden compartir horarios?')}" target="_blank" rel="noopener" class="btn-wa">Agendar cita por WhatsApp</a>
  </div>
  <div class="back2"><a href="/blog/">← Ver todas las entradas</a></div>
</div></div>
${FOOTER}
</body></html>`;
}

/* ---------- Página de listado ---------- */
function indexPage(posts){
  const cards = posts.map(p=>`
    <a class="post-card" href="${p.path}">
      <div class="card-media"${p.cover?` style="background-image:url(${p.cover})"`:' data-ph="1"'}></div>
      <div class="card-body">
        <span class="card-date">${p.dateFmt}</span>
        <h3 class="card-title">${esc(p.title)}</h3>
        <p class="card-ex">${esc(p.excerpt)}</p>
        <span class="card-link">Leer entrada →</span>
      </div>
    </a>`).join('\n');
  const empty = `<div style="text-align:center;color:var(--text-soft);padding:3rem 0">Pronto publicaremos nuestras primeras entradas.</div>`;
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Blog | AMEPSIN Salud Mental — Psicología en Puebla</title>
<meta name="description" content="Artículos sobre salud mental, psicología, bienestar emocional, ansiedad, depresión, relaciones y crianza, escritos por el equipo de AMEPSIN en Puebla.">
<link rel="canonical" href="${SITE.domain}/blog/">
<meta property="og:type" content="website">
<meta property="og:title" content="Blog de AMEPSIN — Salud mental en palabras claras">
<meta property="og:description" content="Artículos sobre bienestar emocional, ansiedad, depresión, relaciones y crianza, por nuestro equipo en Puebla.">
<meta property="og:image" content="${SITE.domain}${SITE.defaultShare}">
<meta property="og:url" content="${SITE.domain}/blog/">
<meta name="theme-color" content="#1e3a5f">
<link rel="alternate" type="application/rss+xml" title="Blog de AMEPSIN" href="${SITE.domain}/blog/feed.xml">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Lora:ital,wght@0,500;0,600;0,700;1,500&display=swap" rel="stylesheet">
<style>${CSS}
.blog-hero{background:linear-gradient(150deg,var(--navy-deep),#1a3553 60%,var(--navy));color:#fff;padding:4rem 0 3.5rem;position:relative;overflow:hidden}
.blog-hero::after{content:"";position:absolute;bottom:0;left:0;right:0;height:4px;background:linear-gradient(90deg,var(--blue),#5a8fc0 50%,#c4a76f)}
.blog-hero::before{content:"";position:absolute;inset:0;background:radial-gradient(ellipse 60% 60% at 80% 30%,rgba(58,110,165,.25),transparent 65%)}
.blog-hero-inner{position:relative;z-index:1;max-width:680px}
.blog-eyebrow{display:inline-block;font-size:.74rem;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:#9cc4e8;margin-bottom:1rem;padding:5px 14px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);border-radius:20px}
.blog-hero h1{color:#fff;font-size:clamp(2.1rem,4.6vw,3.2rem);margin-bottom:1rem}
.blog-hero p{color:rgba(255,255,255,.82);font-size:1.08rem;line-height:1.7;max-width:600px}
.blog-main{padding:4rem 0 5rem;background:var(--bg)}
.posts-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:26px}
@media(max-width:900px){.posts-grid{grid-template-columns:repeat(2,1fr)}}
@media(max-width:600px){.posts-grid{grid-template-columns:1fr}}
.post-card{background:var(--white);border-radius:var(--radius);overflow:hidden;box-shadow:var(--shadow);border:1px solid var(--border);display:flex;flex-direction:column;transition:transform .28s,box-shadow .28s;color:inherit}
.post-card:hover{transform:translateY(-6px);box-shadow:var(--shadow-lg)}
.card-media{aspect-ratio:16/10;background-size:cover;background-position:center;background-color:var(--blue-light)}
.card-media[data-ph]{background:linear-gradient(135deg,var(--navy),var(--blue));display:grid;place-items:center}
.card-media[data-ph]::after{content:"AMEPSIN";font-family:'Lora',serif;color:rgba(255,255,255,.35);font-size:1.1rem;letter-spacing:3px;font-weight:600}
.card-body{padding:22px 22px 24px;display:flex;flex-direction:column;flex:1}
.card-date{font-size:.76rem;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:var(--blue);margin-bottom:.6rem}
.card-title{font-size:1.22rem;color:var(--navy);margin-bottom:.6rem;line-height:1.25}
.card-ex{font-size:.92rem;color:var(--text-soft);line-height:1.6;flex:1;margin-bottom:1rem}
.card-link{font-size:.88rem;font-weight:600;color:var(--blue);display:inline-flex;align-items:center;gap:5px;transition:gap .2s}
.post-card:hover .card-link{gap:9px}
</style>
</head>
<body>
${HEADER}
<section class="blog-hero"><div class="container blog-hero-inner">
  <span class="blog-eyebrow">Blog de AMEPSIN</span>
  <h1>Salud mental, en palabras claras</h1>
  <p>Artículos sobre bienestar emocional, ansiedad, depresión, relaciones, crianza y desarrollo personal, escritos por nuestro equipo de psicología en Puebla.</p>
</div></section>
<main class="blog-main"><div class="container">
  ${posts.length ? `<div class="posts-grid">${cards}</div>` : empty}
</div></main>
${FOOTER}
</body></html>`;
}

/* ---------- RSS ---------- */
function rss(posts){
  const items = posts.map(p=>`  <item>
    <title>${esc(p.title)}</title>
    <link>${p.url}</link>
    <guid isPermaLink="true">${p.url}</guid>
    <pubDate>${p.rfc822}</pubDate>
    <dc:creator>${esc(p.author)}</dc:creator>
    ${p.cover?`<enclosure url="${p.coverAbs}" type="image/jpeg" length="0"/>\n    <media:content url="${p.coverAbs}" medium="image"/>`:''}
    <description><![CDATA[${p.cover?`<img src="${p.coverAbs}" alt="${esc(p.title)}"/><br>`:''}${esc(p.excerpt)}]]></description>
  </item>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>Blog de AMEPSIN Salud Mental</title>
  <link>${SITE.domain}/blog/</link>
  <atom:link href="${SITE.domain}/blog/feed.xml" rel="self" type="application/rss+xml"/>
  <description>Artículos sobre salud mental, psicología y bienestar emocional. AMEPSIN, Puebla.</description>
  <language>es-MX</language>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
</channel>
</rss>`;
}

/* ---------- Escribir archivos ---------- */
// limpiar carpeta /p antes de regenerar
if(fs.existsSync(OUT_P_DIR)) fs.rmSync(OUT_P_DIR, { recursive:true, force:true });
fs.mkdirSync(OUT_P_DIR, { recursive:true });

posts.forEach(p=>{
  const dir = path.join(OUT_P_DIR, p.slug);
  fs.mkdirSync(dir, { recursive:true });
  fs.writeFileSync(path.join(dir, 'index.html'), postPage(p), 'utf8');
  console.log('  ✓ /blog/p/' + p.slug + '/');
});
fs.writeFileSync(path.join(ROOT, 'index.html'), indexPage(posts), 'utf8');
fs.writeFileSync(path.join(ROOT, 'feed.xml'), rss(posts), 'utf8');
console.log('  ✓ /blog/index.html');
console.log('  ✓ /blog/feed.xml');
console.log('Listo.');
