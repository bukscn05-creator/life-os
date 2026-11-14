#!/usr/bin/env node
// Calcula contraste WCAG (texto >=4.5:1, texto grande/UI >=3:1, tinta/fondo >=7:1)
// para las 15 combinaciones (3 modos x 5 acentos). Falla con exit 1 si no cumple.
const MODES = {
  light: { name:'Claro Papel', bg:'#F5F3EE', surface:'#FFFFFF', surface2:'#FAF9F6', ink:'#1C1B18', ink2:'#55524A', ink3:'#6B675C', border:'#E4E0D6', field:'#8F8A7D', ok:'#1F7A45', okSoft:'#E3F3EA', warn:'#8A5A00', warnSoft:'#FFF1D0', danger:'#B3261E', dangerSoft:'#FCE9E7' },
  dark:  { name:'Oscuro Grafito', bg:'#131312', surface:'#1C1C1A', surface2:'#242421', ink:'#F3F1EB', ink2:'#BDB8AC', ink3:'#9A958A', border:'#34332F', field:'#7A766B', ok:'#5DD18B', okSoft:'#16301F', warn:'#F2B94B', warnSoft:'#33280F', danger:'#FF8A80', dangerSoft:'#3A1A18' },
  oled:  { name:'Negro OLED', bg:'#000000', surface:'#0E0E0D', surface2:'#171715', ink:'#F3F1EB', ink2:'#BDB8AC', ink3:'#9A958A', border:'#2A2926', field:'#7A766B', ok:'#5DD18B', okSoft:'#0F2A19', warn:'#F2B94B', warnSoft:'#2B2108', danger:'#FF8A80', dangerSoft:'#321514' },
};
const ACCENTS = {
  teal:    { light:{a:'#0B6E6E', fg:'#FFFFFF'}, dark:{a:'#4FD1C5', fg:'#06231F'} },
  indigo:  { light:{a:'#4338CA', fg:'#FFFFFF'}, dark:{a:'#A5B4FC', fg:'#14173A'} },
  plum:    { light:{a:'#9D2F6F', fg:'#FFFFFF'}, dark:{a:'#F0A6CF', fg:'#3A0F2A'} },
  orange:  { light:{a:'#B34700', fg:'#FFFFFF'}, dark:{a:'#FFB27A', fg:'#331700'} },
  graphite:{ light:{a:'#1C1B18', fg:'#FFFFFF'}, dark:{a:'#F3F1EB', fg:'#131312'} },
};

function hex(h){ h=h.replace('#',''); if(h.length===3) h=h.split('').map(c=>c+c).join(''); const n=parseInt(h,16); return [(n>>16)&255,(n>>8)&255,n&255]; }
function lin(c){ c=c/255; return c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4); }
function lum(hexC){ const [r,g,b]=hex(hexC); return 0.2126*lin(r)+0.7152*lin(g)+0.0722*lin(b); }
function ratio(a,b){ const L1=lum(a), L2=lum(b); const hi=Math.max(L1,L2), lo=Math.min(L1,L2); return (hi+0.05)/(lo+0.05); }
function check(fg,bg,min,label,failures){ const r=ratio(fg,bg); if(r+1e-9 < min){ failures.push({label, fg,bg, ratio:r.toFixed(2), min}); } return r; }

const failures=[];
for (const [mk,m] of Object.entries(MODES)){
  for (const [ak,ac] of Object.entries(ACCENTS)){
    const isDark = mk!=='light';
    const accent = isDark?ac.dark:ac.light;
    const tag = `${m.name} / ${ak}`;
    // tinta/fondo >=7
    check(m.ink, m.bg, 7, `${tag} ink/bg`, failures);
    check(m.ink, m.surface, 7, `${tag} ink/surface`, failures);
    check(m.ink, m.surface2, 7, `${tag} ink/surface2`, failures);
    // texto normal >=4.5
    check(m.ink2, m.bg, 4.5, `${tag} ink2/bg`, failures);
    check(m.ink2, m.surface, 4.5, `${tag} ink2/surface`, failures);
    check(m.ink3, m.bg, 4.5, `${tag} ink3/bg`, failures);
    check(m.ink3, m.surface, 4.5, `${tag} ink3/surface`, failures);
    // UI/components >=3
    check(accent.fg, accent.a, 4.5, `${tag} accent-fg/accent (texto)`, failures);
    check(m.field, m.bg, 3, `${tag} field-border/bg`, failures);
    check(m.ok, m.bg, 3, `${tag} ok/bg`, failures);
    check(m.warn, m.bg, 3, `${tag} warn/bg`, failures);
    check(m.danger, m.bg, 3, `${tag} danger/bg`, failures);
    // texto sobre suaves >=4.5
    check(m.ok, m.okSoft, 3, `${tag} ok/okSoft`, failures);
    check(m.warn, m.warnSoft, 3, `${tag} warn/warnSoft`, failures);
    check(m.danger, m.dangerSoft, 3, `${tag} danger/dangerSoft`, failures);
  }
}
if (failures.length){
  console.error(`FALLOS DE CONTRASTE: ${failures.length}`);
  for (const f of failures) console.error(`- ${f.label}: ${f.fg} sobre ${f.bg} = ${f.ratio}:1 (mín ${f.min}:1)`);
  process.exit(1);
} else {
  console.log('Contraste OK: 15 combinaciones verificadas.');
}
