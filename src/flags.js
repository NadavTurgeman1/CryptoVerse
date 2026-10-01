/** Country flags for echoes and meteors. Names come from the runtime locale. */

const F = (id, layout, colors, emblem = '') => ({ id, layout, colors, emblem });

export const FLAGS = [
  F('af', 'v', ['#000000', '#d32011', '#007a36']),
  F('al', 'disc', ['#e41e20', '#000000'], 'eagle'),
  F('dz', 'v', ['#006233', '#ffffff'], 'crescent'),
  F('ad', 'v', ['#0018a8', '#ffd100', '#c70000']),
  F('ao', 'h', ['#cc0000', '#000000'], 'star'),
  F('ag', 'h', ['#000000', '#0066cc', '#ffffff'], 'sun'),
  F('ar', 'h', ['#74acdf', '#ffffff', '#74acdf'], 'sun'),
  F('am', 'h', ['#d90012', '#0033a0', '#f2a800']),
  F('au', 'union', ['#012169', '#ffffff', '#e4002b'], 'star'),
  F('at', 'h', ['#ed2939', '#ffffff', '#ed2939']),
  F('az', 'h', ['#00b5e2', '#ef3340', '#509e2f'], 'crescent'),
  F('bs', 'triangle', ['#000000', '#00778b', '#ffc72c', '#00778b']),
  F('bh', 'v', ['#ffffff', '#ce1126']),
  F('bd', 'disc', ['#006a4e', '#f42a41']),
  F('bb', 'v', ['#00267f', '#ffc726', '#00267f']),
  F('by', 'h', ['#c8313e', '#4aa657']),
  F('be', 'v', ['#000000', '#fdda24', '#ef3340']),
  F('bz', 'h', ['#003f87', '#d21034']),
  F('bj', 'hoist', ['#008751', '#fcd116', '#e8112d']),
  F('bt', 'triangle', ['#ff4e12', '#ffcc00']),
  F('bo', 'h', ['#d52b1e', '#f9e300', '#007934']),
  F('ba', 'triangle', ['#002395', '#ffcc00', '#ffffff']),
  F('bw', 'h', ['#75aadb', '#000000', '#75aadb']),
  F('br', 'diamond', ['#009c3b', '#ffdf00', '#002776']),
  F('bn', 'h', ['#f7e017', '#ffffff', '#000000']),
  F('bg', 'h', ['#ffffff', '#00966e', '#d62612']),
  F('bf', 'h', ['#ef2b2d', '#fcd116'], 'star'),
  F('bi', 'saltire', ['#ce1126', '#1eb53a', '#ffffff'], 'star'),
  F('cv', 'h', ['#003893', '#ffffff', '#cf2027', '#f7d116']),
  F('kh', 'h', ['#032ea1', '#e00025', '#032ea1']),
  F('cm', 'v', ['#007a5e', '#ce1126', '#fcd116'], 'star'),
  F('ca', 'v', ['#ff0000', '#ffffff', '#ff0000'], 'maple'),
  F('cf', 'h', ['#003082', '#ffffff', '#289728', '#ffce00'], 'star'),
  F('td', 'v', ['#002664', '#fecb00', '#c60c30']),
  F('cl', 'h', ['#d52b1e', '#ffffff'], 'canton'),
  F('cn', 'disc', ['#de2910', '#ffde00'], 'star'),
  F('co', 'h', ['#fcd116', '#003893', '#ce1126']),
  F('km', 'h', ['#3a75c4', '#ffd100', '#ffffff', '#ce1126'], 'crescent'),
  F('cg', 'triangle', ['#009543', '#fbde4a', '#dc241f']),
  F('cd', 'h', ['#007fff', '#f7d618', '#ce1021'], 'star'),
  F('cr', 'h', ['#002b7f', '#ffffff', '#ce1126', '#ffffff', '#002b7f']),
  F('ci', 'v', ['#ff8200', '#ffffff', '#009a44']),
  F('hr', 'h', ['#ff0000', '#ffffff', '#171796']),
  F('cu', 'triangle', ['#cb1515', '#002a8f', '#ffffff', '#002a8f', '#ffffff', '#002a8f'], 'star'),
  F('cy', 'disc', ['#ffffff', '#d57800']),
  F('cz', 'triangle', ['#11457e', '#ffffff', '#d7141a']),
  F('dk', 'nordic', ['#c8102e', '#ffffff']),
  F('dj', 'triangle', ['#ffffff', '#6ab2e7', '#12ad2b'], 'star'),
  F('dm', 'h', ['#006b3f', '#fcd116', '#000000', '#ffffff', '#d7141a']),
  F('do', 'plus', ['#ffffff', '#ce1126', '#002d62']),
  F('ec', 'h', ['#ffd100', '#034ea2', '#ed1c24']),
  F('eg', 'h', ['#ce1126', '#ffffff', '#000000']),
  F('sv', 'h', ['#0f47af', '#ffffff', '#0f47af']),
  F('gq', 'triangle', ['#3a75c4', '#3e9a00', '#ffffff', '#e32118']),
  F('er', 'triangle', ['#ef3340', '#43b02a', '#4189dd']),
  F('ee', 'h', ['#0072ce', '#000000', '#ffffff']),
  F('sz', 'h', ['#3e5eb9', '#ffd900', '#b10c0c']),
  F('et', 'h', ['#078930', '#fcdd09', '#da121a'], 'star'),
  F('fj', 'union', ['#68bfe5', '#ffffff', '#ce1126']),
  F('fi', 'nordic', ['#ffffff', '#003580']),
  F('fr', 'v', ['#0055a4', '#ffffff', '#ef4135']),
  F('ga', 'h', ['#009e60', '#fcd116', '#3a75c4']),
  F('gm', 'h', ['#ce1126', '#ffffff', '#0c1c8c', '#3a7728']),
  F('ge', 'plus', ['#ffffff', '#ff0000']),
  F('de', 'h', ['#000000', '#dd0000', '#ffce00']),
  F('gh', 'h', ['#ce1126', '#fcd116', '#006b3f'], 'star'),
  F('gr', 'h', ['#0d5eaf', '#ffffff'], 'canton'),
  F('gd', 'h', ['#ce1126', '#fcd116', '#007a5e'], 'star'),
  F('gt', 'v', ['#4997d0', '#ffffff', '#4997d0']),
  F('gn', 'v', ['#ce1126', '#fcd116', '#009460']),
  F('gw', 'hoist', ['#ce1126', '#fcd116', '#009e49'], 'star'),
  F('gy', 'triangle', ['#009e49', '#fcd116', '#ce1126']),
  F('ht', 'h', ['#00209f', '#d21034']),
  F('hn', 'h', ['#0073cf', '#ffffff', '#0073cf'], 'star'),
  F('hu', 'h', ['#ce2939', '#ffffff', '#477050']),
  F('is', 'nordic', ['#02529c', '#ffffff', '#dc1e35']),
  F('in', 'h', ['#ff9933', '#ffffff', '#138808'], 'disc'),
  F('id', 'h', ['#ce1126', '#ffffff']),
  F('ir', 'h', ['#239f40', '#ffffff', '#da0000']),
  F('iq', 'h', ['#ce1126', '#ffffff', '#000000']),
  F('ie', 'v', ['#169b62', '#ffffff', '#ff883e']),
  F('il', 'israel', ['#ffffff', '#0038b8'], 'david'),
  F('it', 'v', ['#009246', '#ffffff', '#ce2b37']),
  F('jm', 'saltire', ['#000000', '#fed100', '#007749']),
  F('jp', 'disc', ['#ffffff', '#bc002d']),
  F('jo', 'triangle', ['#ce1126', '#000000', '#ffffff', '#007a3d'], 'star'),
  F('kz', 'disc', ['#00afca', '#ffd700'], 'sun'),
  F('ke', 'h', ['#000000', '#bb0000', '#006600']),
  F('ki', 'h', ['#ce1126', '#fcd116', '#003f87'], 'sun'),
  F('kp', 'h', ['#024fa2', '#ffffff', '#ed1c27'], 'star'),
  F('kr', 'disc', ['#ffffff', '#cd2e3a', '#0047a0']),
  F('kw', 'triangle', ['#000000', '#007a3d', '#ffffff', '#ce1126']),
  F('kg', 'disc', ['#e8112d', '#ffef00'], 'sun'),
  F('la', 'h', ['#ce1126', '#002868', '#ce1126'], 'disc'),
  F('lv', 'h', ['#9e3039', '#ffffff', '#9e3039']),
  F('lb', 'h', ['#ed1c24', '#ffffff', '#ed1c24']),
  F('ls', 'h', ['#00209f', '#ffffff', '#009543']),
  F('lr', 'h', ['#bf0a30', '#ffffff'], 'canton'),
  F('ly', 'h', ['#e70013', '#000000', '#239e46'], 'crescent'),
  F('li', 'h', ['#002b7f', '#ce1126']),
  F('lt', 'h', ['#fdb913', '#006a44', '#c1272d']),
  F('lu', 'h', ['#ea141d', '#ffffff', '#00a1de']),
  F('mg', 'hoist', ['#ffffff', '#fc3d32', '#007e3a']),
  F('mw', 'h', ['#000000', '#ce1126', '#339e35'], 'sun'),
  F('my', 'h', ['#cc0001', '#ffffff'], 'canton'),
  F('mv', 'disc', ['#d21034', '#007e3a'], 'crescent'),
  F('ml', 'v', ['#14b53a', '#fcd116', '#ce1126']),
  F('mt', 'v', ['#ffffff', '#cf142b']),
  F('mh', 'triangle', ['#003893', '#dd7500', '#ffffff']),
  F('mr', 'disc', ['#006233', '#ffd700'], 'crescent'),
  F('mu', 'h', ['#ea2839', '#1a206d', '#ffd500', '#00a551']),
  F('mx', 'v', ['#006847', '#ffffff', '#ce1126']),
  F('fm', 'disc', ['#75b2dd', '#ffffff'], 'star'),
  F('md', 'v', ['#003da5', '#ffd100', '#c8102e']),
  F('mc', 'h', ['#ce1126', '#ffffff']),
  F('mn', 'v', ['#da2032', '#0066b3', '#da2032']),
  F('me', 'disc', ['#d4af37', '#c40308']),
  F('ma', 'disc', ['#c1272d', '#006233'], 'star'),
  F('mz', 'triangle', ['#d21034', '#007168', '#fce100', '#000000'], 'star'),
  F('mm', 'h', ['#fecb00', '#34b233', '#ea2839'], 'star'),
  F('na', 'triangle', ['#003580', '#009543', '#d21034', '#ffffff']),
  F('nr', 'h', ['#002b7f', '#ffc72c'], 'star'),
  F('np', 'triangle', ['#dc143c', '#003893', '#ffffff']),
  F('nl', 'h', ['#ae1c28', '#ffffff', '#21468b']),
  F('nz', 'union', ['#00247d', '#ffffff', '#cc142b'], 'star'),
  F('ni', 'h', ['#0067c6', '#ffffff', '#0067c6']),
  F('ne', 'h', ['#e05206', '#ffffff', '#0db02b'], 'disc'),
  F('ng', 'v', ['#008751', '#ffffff', '#008751']),
  F('mk', 'disc', ['#d20000', '#ffe600'], 'sun'),
  F('no', 'nordic', ['#ba0c2f', '#ffffff', '#00205b']),
  F('om', 'h', ['#ffffff', '#db161b', '#008000'], 'canton'),
  F('pk', 'v', ['#ffffff', '#01411c'], 'crescent'),
  F('pw', 'disc', ['#4aaddd', '#ffde00']),
  F('ps', 'triangle', ['#ee2a35', '#000000', '#ffffff', '#007a3d']),
  F('pa', 'plus', ['#ffffff', '#005293', '#d21034'], 'star'),
  F('pg', 'triangle', ['#000000', '#ce1126', '#fcd116']),
  F('py', 'h', ['#d52b1e', '#ffffff', '#0038a8'], 'disc'),
  F('pe', 'v', ['#d91023', '#ffffff', '#d91023']),
  F('ph', 'triangle', ['#ffffff', '#0038a8', '#ce1126'], 'sun'),
  F('pl', 'h', ['#ffffff', '#dc143c']),
  F('pt', 'v', ['#006600', '#ff0000'], 'disc'),
  F('qa', 'v', ['#ffffff', '#8d1b3d']),
  F('ro', 'v', ['#002b7f', '#fcd116', '#ce1126']),
  F('ru', 'h', ['#ffffff', '#0039a6', '#d52b1e']),
  F('rw', 'h', ['#00a1de', '#fad201', '#20603d'], 'sun'),
  F('kn', 'saltire', ['#009739', '#000000', '#ce1126', '#ffd100']),
  F('lc', 'v', ['#6cf', '#ffffff', '#000000', '#ffda00']),
  F('vc', 'v', ['#002868', '#fcd116', '#007a33'], 'diamond'),
  F('ws', 'disc', ['#ce1126', '#002b7f'], 'star'),
  F('sm', 'h', ['#ffffff', '#5eb6e4']),
  F('st', 'triangle', ['#d21034', '#12ad2b', '#ffce00', '#12ad2b'], 'star'),
  F('sa', 'disc', ['#006c35', '#ffffff']),
  F('sn', 'v', ['#00853f', '#fdef42', '#e31b23'], 'star'),
  F('rs', 'h', ['#c6363c', '#0c4076', '#ffffff']),
  F('sc', 'triangle', ['#003f87', '#fcd856', '#d62828', '#007a3d', '#ffffff']),
  F('sl', 'h', ['#1eb53a', '#ffffff', '#0072c6']),
  F('sg', 'h', ['#ef3340', '#ffffff'], 'crescent'),
  F('sk', 'h', ['#ffffff', '#0b4ea2', '#ee1c25']),
  F('si', 'h', ['#ffffff', '#003da5', '#ed1c24']),
  F('sb', 'triangle', ['#0051ba', '#215b33', '#fcd116']),
  F('so', 'disc', ['#4189dd', '#ffffff'], 'star'),
  F('za', 'za', ['#de3831', '#002395', '#007a4d', '#ffb612', '#000000', '#ffffff']),
  F('ss', 'triangle', ['#0f47af', '#000000', '#e31d1a', '#078930'], 'star'),
  F('es', 'h', ['#aa151b', '#f1bf00', '#aa151b']),
  F('lk', 'v', ['#ffbe29', '#8d153a', '#00534e']),
  F('sd', 'triangle', ['#007229', '#d21034', '#ffffff', '#000000']),
  F('sr', 'h', ['#377e3f', '#ffffff', '#b40a2d', '#ffffff', '#377e3f'], 'star'),
  F('se', 'nordic', ['#006aa7', '#fecc00']),
  F('ch', 'plus', ['#da291c', '#ffffff']),
  F('sy', 'h', ['#007a3d', '#ffffff', '#000000'], 'star'),
  F('tw', 'disc', ['#fe0000', '#000095'], 'star'),
  F('tj', 'h', ['#cc0000', '#ffffff', '#006600'], 'sun'),
  F('tz', 'saltire', ['#1eb53a', '#fcd116', '#000000', '#00a3dd']),
  F('th', 'h', ['#a51931', '#ffffff', '#2d2a4a', '#ffffff', '#a51931']),
  F('tl', 'triangle', ['#dc241f', '#ffc726', '#000000']),
  F('tg', 'h', ['#006a4e', '#ffce00', '#d21034', '#ffce00', '#006a4e'], 'canton'),
  F('to', 'disc', ['#c10000', '#ffffff'], 'canton'),
  F('tt', 'saltire', ['#da1a35', '#ffffff', '#000000']),
  F('tn', 'disc', ['#e70013', '#ffffff'], 'crescent'),
  F('tr', 'crescent', ['#e30a17', '#ffffff'], 'star'),
  F('tm', 'disc', ['#00843d', '#ffffff'], 'crescent'),
  F('tv', 'union', ['#5b97d0', '#ffffff', '#cf142b'], 'star'),
  F('ug', 'h', ['#000000', '#fcdc04', '#d90000', '#000000', '#fcdc04', '#d90000']),
  F('ua', 'h', ['#005bbb', '#ffd500']),
  F('ae', 'hoist', ['#ff0000', '#00732f', '#ffffff', '#000000']),
  F('gb', 'union', ['#012169', '#ffffff', '#c8102e']),
  F('us', 'usa', ['#3c3b6e', '#b22234', '#ffffff'], 'star'),
  F('uy', 'h', ['#ffffff', '#0038a8'], 'canton'),
  F('uz', 'h', ['#1eb53a', '#ffffff', '#0099b5', '#ce1126'], 'crescent'),
  F('vu', 'triangle', ['#d21034', '#009543', '#000000', '#fdce12']),
  F('va', 'v', ['#ffe000', '#ffffff']),
  F('ve', 'h', ['#ffcc00', '#00247d', '#cf142b'], 'star'),
  F('vn', 'disc', ['#da251d', '#ff0'], 'star'),
  F('ye', 'h', ['#ce1126', '#ffffff', '#000000']),
  F('zm', 'h', ['#198a00', '#de2010', '#000000', '#ef7d00']),
  F('zw', 'triangle', ['#000000', '#006400', '#ffd200', '#d40000', '#000000'], 'star'),
  F('xk', 'disc', ['#244aa5', '#d0a650'], 'star'),
  F('fo', 'nordic', ['#ffffff', '#003897', '#ed2939']),
  F('gl', 'disc', ['#ffffff', '#d00c33']),
  F('hk', 'disc', ['#de2910', '#ffffff'], 'star'),
  F('mo', 'disc', ['#067662', '#ffffff', '#ffde00']),
].map((flag) => ({
  ...flag,
  colors: flag.colors.map((color) => (color.length === 4 ? `${color[0]}${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}` : color)),
}));

const BY_ID = new Map(FLAGS.map((flag) => [flag.id, flag]));

export function flagById(id) {
  if (!id) return null;
  return BY_ID.get(String(id).toLowerCase()) ?? null;
}

export function countryName(id, lang) {
  const code = String(id || '').toUpperCase();
  const fallback = {
    XK: 'Kosovo',
    TW: 'Taiwan',
  };
  try {
    const name = new Intl.DisplayNames([lang || 'en'], { type: 'region' }).of(code);
    if (name && name !== code) return name;
  } catch {
    /* locale data missing */
  }
  return fallback[code] || code;
}

export function flagsSorted(lang) {
  return [...FLAGS].sort((a, b) => countryName(a.id, lang).localeCompare(countryName(b.id, lang), lang));
}

export function flagInk(flag) {
  return flag.colors.find((color) => color.toLowerCase() !== '#ffffff') || flag.colors[0];
}

export function flagTrail(flag) {
  const first = flag.colors[0];
  const second = flag.colors.find((color) => color !== first) || first;
  return [first, second];
}

function star(ctx, x, y, r, color, points = 5) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < points * 2; i += 1) {
    const radius = i % 2 === 0 ? r : r * 0.42;
    const angle = -Math.PI / 2 + (i * Math.PI) / points;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

function starOfDavid(ctx, x, y, r, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = color;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(1, r * 0.11);
  for (const turn of [0, Math.PI]) {
    ctx.beginPath();
    for (let i = 0; i < 3; i += 1) {
      const angle = -Math.PI / 2 + turn + (i * Math.PI * 2) / 3;
      const px = Math.cos(angle) * r;
      const py = Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
  }
  ctx.restore();
}

function crescent(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x - r * 0.12, y, r, 0, Math.PI * 2);
  ctx.arc(x + r * 0.22, y - r * 0.08, r * 0.76, 0, Math.PI * 2, true);
  ctx.fill('evenodd');
}

function stripes(ctx, x, y, w, h, colors, vertical) {
  colors.forEach((color, index) => {
    ctx.fillStyle = color;
    if (vertical) {
      const span = w / colors.length;
      ctx.fillRect(x + span * index, y, span + 0.5, h);
    } else {
      const span = h / colors.length;
      ctx.fillRect(x, y + span * index, w, span + 0.5);
    }
  });
}

function nordic(ctx, x, y, w, h, colors) {
  ctx.fillStyle = colors[0];
  ctx.fillRect(x, y, w, h);
  const outline = colors[2] ? colors[1] : null;
  const cross = colors[2] || colors[1];
  const bar = h * (outline ? 0.28 : 0.2);
  const left = w * 0.32;
  if (outline) {
    ctx.fillStyle = outline;
    const wide = bar * 1.7;
    ctx.fillRect(x + left - wide / 2, y, wide, h);
    ctx.fillRect(x, y + h / 2 - wide / 2, w, wide);
  }
  ctx.fillStyle = cross;
  ctx.fillRect(x + left - bar / 2, y, bar, h);
  ctx.fillRect(x, y + h / 2 - bar / 2, w, bar);
}

function unionJack(ctx, x, y, w, h) {
  ctx.fillStyle = '#012169';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = h * 0.16;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y + h);
  ctx.moveTo(x + w, y);
  ctx.lineTo(x, y + h);
  ctx.stroke();
  ctx.strokeStyle = '#c8102e';
  ctx.lineWidth = h * 0.08;
  ctx.stroke();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = h * 0.28;
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y);
  ctx.lineTo(x + w / 2, y + h);
  ctx.moveTo(x, y + h / 2);
  ctx.lineTo(x + w, y + h / 2);
  ctx.stroke();
  ctx.strokeStyle = '#c8102e';
  ctx.lineWidth = h * 0.16;
  ctx.stroke();
}

export function drawFlag(ctx, x, y, w, h, flag) {
  if (!flag || !(w > 0) || !(h > 0)) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  const { colors, layout, emblem } = flag;
  if (layout === 'v') stripes(ctx, x, y, w, h, colors, true);
  else if (layout === 'nordic') nordic(ctx, x, y, w, h, colors);
  else if (layout === 'saltire') {
    ctx.fillStyle = colors[0];
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = colors[1];
    ctx.lineWidth = h * 0.22;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y + h);
    ctx.moveTo(x + w, y);
    ctx.lineTo(x, y + h);
    ctx.stroke();
    if (colors[2]) {
      ctx.strokeStyle = colors[2];
      ctx.lineWidth = h * 0.1;
      ctx.stroke();
    }
  } else if (layout === 'disc') {
    ctx.fillStyle = colors[0];
    ctx.fillRect(x, y, w, h);
    const cx = x + w / 2;
    const cy = y + h / 2;
    const discR = Math.min(w, h) * 0.32;
    if (flag.id === 'kr') {
      ctx.fillStyle = '#0047a0';
      ctx.beginPath();
      ctx.arc(cx, cy, discR, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#cd2e3a';
      ctx.beginPath();
      ctx.arc(cx, cy, discR, -Math.PI / 2, Math.PI / 2);
      ctx.arc(cx, cy + discR / 2, discR / 2, Math.PI / 2, -Math.PI / 2, true);
      ctx.arc(cx, cy - discR / 2, discR / 2, Math.PI / 2, -Math.PI / 2);
      ctx.fill();
    } else {
      ctx.fillStyle = colors[1];
      ctx.beginPath();
      ctx.arc(cx, cy, discR, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (layout === 'israel') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x, y, w, h);
    const blue = colors[1] || '#0038b8';
    ctx.fillStyle = blue;
    const band = h * (25 / 160);
    ctx.fillRect(x, y + h * (15 / 160), w, band);
    ctx.fillRect(x, y + h * (120 / 160), w, band);
    starOfDavid(ctx, x + w / 2, y + h / 2, h * (28 / 160), blue);
  } else if (layout === 'hoist') {
    const band = w * 0.36;
    stripes(ctx, x + band, y, w - band, h, colors.slice(1), false);
    ctx.fillStyle = colors[0];
    ctx.fillRect(x, y, band + 0.5, h);
  } else if (layout === 'crescent') {
    ctx.fillStyle = colors[0];
    ctx.fillRect(x, y, w, h);
    crescent(ctx, x + w * 0.42, y + h / 2, Math.min(w, h) * 0.26, colors[1] || '#ffffff');
    if (emblem === 'star') star(ctx, x + w * 0.66, y + h / 2, Math.min(w, h) * 0.12, colors[1] || '#ffffff');
  } else if (layout === 'usa') {
    for (let i = 0; i < 13; i += 1) {
      ctx.fillStyle = i % 2 === 0 ? colors[1] : colors[2];
      ctx.fillRect(x, y + (h / 13) * i, w, h / 13 + 0.4);
    }
    ctx.fillStyle = colors[0];
    ctx.fillRect(x, y, w * 0.4, h * 0.54);
    ctx.fillStyle = colors[2];
    for (let row = 0; row < 4; row += 1) {
      for (let col = 0; col < 5; col += 1) {
        ctx.beginPath();
        ctx.arc(x + w * 0.06 + col * w * 0.07, y + h * 0.08 + row * h * 0.11, Math.max(0.8, h * 0.018), 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (layout === 'union') {
    unionJack(ctx, x, y, w * 0.5, h * 0.55);
    ctx.fillStyle = colors[0];
    ctx.fillRect(x + w * 0.5, y, w * 0.5, h);
    ctx.fillRect(x, y + h * 0.55, w, h * 0.45);
    if (emblem === 'star') star(ctx, x + w * 0.72, y + h * 0.68, Math.min(w, h) * 0.12, colors[1] || '#ffffff');
  } else if (layout === 'plus') {
    ctx.fillStyle = colors[0];
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = colors[1] || '#ffffff';
    const t = Math.min(w, h) * 0.22;
    ctx.fillRect(x + w / 2 - t / 2, y + h * 0.15, t, h * 0.7);
    ctx.fillRect(x + w * 0.2, y + h / 2 - t / 2, w * 0.6, t);
    if (colors[2]) {
      ctx.fillStyle = colors[2];
      ctx.fillRect(x, y + h / 2, w / 2, h / 2);
    }
  } else if (layout === 'diamond') {
    ctx.fillStyle = colors[0];
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = colors[1];
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y + h * 0.08);
    ctx.lineTo(x + w * 0.92, y + h / 2);
    ctx.lineTo(x + w / 2, y + h * 0.92);
    ctx.lineTo(x + w * 0.08, y + h / 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = colors[2] || colors[0];
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2, Math.min(w, h) * 0.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (layout === 'za') {
    ctx.fillStyle = colors[0];
    ctx.fillRect(x, y, w, h / 2);
    ctx.fillStyle = colors[1];
    ctx.fillRect(x, y + h / 2, w, h / 2);
    ctx.strokeStyle = colors[5] || '#ffffff';
    ctx.lineWidth = h * 0.2;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w * 0.3, y + h / 2);
    ctx.lineTo(x, y + h);
    ctx.moveTo(x + w * 0.28, y + h / 2);
    ctx.lineTo(x + w, y + h / 2);
    ctx.stroke();
    ctx.strokeStyle = colors[2];
    ctx.lineWidth = h * 0.08;
    ctx.stroke();
    ctx.fillStyle = colors[4] || '#000000';
    ctx.beginPath();
    ctx.moveTo(x, y + h * 0.18);
    ctx.lineTo(x + w * 0.22, y + h / 2);
    ctx.lineTo(x, y + h * 0.82);
    ctx.closePath();
    ctx.fill();
  } else if (layout === 'triangle') {
    stripes(ctx, x, y, w, h, colors.slice(1), false);
    ctx.fillStyle = colors[0];
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w * 0.42, y + h / 2);
    ctx.lineTo(x, y + h);
    ctx.closePath();
    ctx.fill();
  } else {
    stripes(ctx, x, y, w, h, colors, false);
  }

  if (emblem === 'canton' || layout === 'canton') {
    ctx.fillStyle = colors[0];
    ctx.fillRect(x, y, w * 0.42, h * 0.5);
  }
  const markAt = layout === 'triangle' || layout === 'hoist'
    ? { x: x + w * 0.18, y: y + h * 0.5 }
    : { x: x + w * 0.5, y: y + h * 0.5 };
  const markSize = layout === 'h'
    ? (h / Math.max(colors.length, 1)) * 0.36
    : layout === 'v'
      ? (w / Math.max(colors.length, 1)) * 0.36
      : Math.min(w, h) * (layout === 'triangle' || layout === 'hoist' ? 0.12 : 0.22);
  const mark = flag.id === 'dj' ? '#d7141a'
    : flag.id === 'ph' ? '#fcd116'
    : flag.id === 'ss' || flag.id === 'mz' ? '#f7d116'
      : flag.id === 'st' || flag.id === 'gw' ? '#000000'
        : layout === 'triangle' || layout === 'hoist' ? '#ffffff'
          : (colors[1] || '#ffd100');
  if (emblem === 'star' && layout !== 'crescent' && layout !== 'union' && layout !== 'usa') {
    star(ctx, markAt.x, markAt.y, markSize, mark);
  }
  if (emblem === 'sun') star(ctx, markAt.x, markAt.y, markSize, flag.id === 'ph' ? '#fcd116' : colors.at(-1), 12);
  if (emblem === 'david' && layout !== 'israel') {
    starOfDavid(ctx, x + w / 2, y + h / 2, Math.min(w, h) * 0.22, colors[1] || '#0038b8');
  }
  if (emblem === 'crescent' && layout !== 'crescent') {
    crescent(ctx, x + w * 0.58, y + h / 2, Math.min(w, h) * 0.2, colors.at(-1));
  }
  if (emblem === 'disc' && layout !== 'disc') {
    ctx.fillStyle = colors.at(-1);
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2, Math.min(w, h) * 0.16, 0, Math.PI * 2);
    ctx.fill();
  }
  if (emblem === 'maple') {
    ctx.fillStyle = colors[0];
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y + h * 0.18);
    ctx.lineTo(x + w * 0.58, y + h * 0.38);
    ctx.lineTo(x + w * 0.7, y + h * 0.36);
    ctx.lineTo(x + w * 0.6, y + h * 0.52);
    ctx.lineTo(x + w * 0.68, y + h * 0.66);
    ctx.lineTo(x + w / 2, y + h * 0.56);
    ctx.lineTo(x + w * 0.32, y + h * 0.66);
    ctx.lineTo(x + w * 0.4, y + h * 0.52);
    ctx.lineTo(x + w * 0.3, y + h * 0.36);
    ctx.lineTo(x + w * 0.42, y + h * 0.38);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/** Paint the flag across the ghost sheet, keeping the flag's own proportions. */
export function paintGhostFlag(ctx, radius, flag) {
  if (!flag) return;
  const aspect = flag.layout === 'israel' ? 11 / 8 : 3 / 2;
  let w = radius * 2.2;
  let h = w / aspect;
  const maxH = radius * 2.55;
  if (h > maxH) {
    h = maxH;
    w = h * aspect;
  }
  drawFlag(ctx, -w / 2, -h * 0.58, w, h, flag);
}
