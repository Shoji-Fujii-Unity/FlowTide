require("./_gen.js");
const FT = globalThis.__FT;
let fails = 0, slowest = 0;
function validate(p, rows, cols, tag){
  if(!p){ console.log("FAIL null board", tag); fails++; return; }
  if(p.rows!==rows||p.cols!==cols){ console.log("FAIL dims", tag); fails++; }
  const free = rows*cols - p.blocked.size;
  const seen = new Map();
  let total = 0;
  for(let ci=0; ci<p.colors; ci++){
    const seg = p.solution[ci];
    if(!seg || seg.length < 2){ console.log("FAIL short seg", tag, ci); fails++; break; }
    const e = p.eps.find(x=>x.color===ci);
    if(!e){ console.log("FAIL missing ep", tag, ci); fails++; break; }
    if(e.r1!==seg[0].r||e.c1!==seg[0].c||e.r2!==seg[seg.length-1].r||e.c2!==seg[seg.length-1].c){ console.log("FAIL ep mismatch", tag, ci); fails++; }
    for(let i=0;i<seg.length;i++){
      const cell = seg[i], k = cell.r*cols+cell.c;
      if(cell.r<0||cell.c<0||cell.r>=rows||cell.c>=cols){ console.log("FAIL oob", tag); fails++; }
      if(p.blocked.has(k)){ console.log("FAIL path crosses wall", tag); fails++; }
      if(seen.has(k)){ console.log("FAIL overlap", tag, k); fails++; }
      seen.set(k, ci);
      if(i>0 && Math.abs(seg[i].r-seg[i-1].r)+Math.abs(seg[i].c-seg[i-1].c)!==1){ console.log("FAIL non-adjacent", tag, ci, i); fails++; }
    }
    total += seg.length;
  }
  if(total!==free){ console.log("FAIL coverage", tag, total+"/"+free); fails++; }
  const epSet = new Set();
  for(const e of p.eps) for(const q of [[e.r1,e.c1],[e.r2,e.c2]]){
    const k=q[0]*cols+q[1];
    if(p.blocked.has(k)){ console.log("FAIL ep on wall", tag); fails++; }
    if(epSet.has(k)){ console.log("FAIL duplicate ep", tag, k); fails++; }
    epSet.add(k);
  }
}
function run(tag, rows, cols, colors, walls, seed){
  const t0 = process.hrtime.bigint();
  const p = FT.makeBoard({rows,cols,colors,walls,seed});
  const ms = Number(process.hrtime.bigint()-t0)/1e6;
  slowest = Math.max(slowest, ms);
  validate(p, rows, cols, tag);
  return {p, ms};
}
const stats = [];
for(let lv=0; lv<FT.LEVELS.length; lv++){
  const cfg = FT.LEVELS[lv]; let wsum=0, msum=0;
  for(let k=0;k<12;k++){
    const seed = (FT.hashStr("flowtide-lv-"+(lv+1)) ^ (k*2654435761))>>>0;
    const r = run("lv"+(lv+1)+"-"+k, cfg.size, cfg.size, cfg.colors, cfg.walls, seed);
    wsum += r.p.blocked.size; msum += r.ms;
  }
  stats.push(`lv${String(lv+1).padStart(2)}  ${cfg.size}x${cfg.size} colors=${cfg.colors} walls(want ${cfg.walls}/got ${(wsum/12).toFixed(1)}) avg ${msum<1?msum.toFixed(2):msum.toFixed(1)}ms`);
}
stats.filter((s,i)=>i%6===0||i===29).forEach(s=>console.log(s));
const d = run("daily", 9, 9, 8, 4, FT.hashStr("flowtide-daily-2026-11-18"));
console.log("daily 9x9 walls="+d.p.blocked.size, d.ms.toFixed(1)+"ms");
for(const s of [5,7,9,11]) run("zen"+s, s, s, Math.round(s*0.85), s>=7?2:0, FT.hashStr("zen-"+s));
let wc=0, mx=0;
for(let i=0;i<150;i++){ const r=run("rnd"+i, 9,9,8,4,(i*2654435761)>>>0); wc+=r.p.blocked.size; }
console.log("random 9x9 avg walls:", (wc/150).toFixed(2), "| slowest gen:", slowest.toFixed(1)+"ms");
// determinism check: same seed -> same board
const a = JSON.stringify(FT.makeBoard({rows:8,cols:8,colors:6,walls:3,seed:12345}));
const b = JSON.stringify(FT.makeBoard({rows:8,cols:8,colors:6,walls:3,seed:12345}));
console.log("determinism:", a===b ? "OK" : "BROKEN");
if(a!==b) fails++;
console.log(fails ? ("TOTAL FAILS: "+fails) : "ALL CHECKS PASSED");
