"use client";

import { useEffect } from 'react';
import DemoDashboard from '../components/DemoDashboard';

export default function LandingPage() {
  useEffect(() => {
    /* ── CURSOR ── */
    const cur = document.getElementById('cur');
    const ring = document.getElementById('cur-ring');
    let mx=0,my=0,rx=0,ry=0;
    
    const mouseMoveHandler = e=>{
      mx=e.clientX;my=e.clientY;
      if(cur) { cur.style.left=mx+'px';cur.style.top=my+'px'; }
    };
    document.addEventListener('mousemove', mouseMoveHandler);
    
    let animId;
    (function animR(){
      rx+=(mx-rx)*.11; ry+=(my-ry)*.11;
      if(ring) { ring.style.left=rx+'px';ring.style.top=ry+'px'; }
      animId = requestAnimationFrame(animR);
    })();
    
    const interactables = document.querySelectorAll('button,a,.feat-card,.step,.stat-box,.trend-item');
    const mouseEnter = () => document.body.classList.add('cursor-hover');
    const mouseLeave = () => document.body.classList.remove('cursor-hover');
    interactables.forEach(el=>{
      el.addEventListener('mouseenter', mouseEnter);
      el.addEventListener('mouseleave', mouseLeave);
    });

    /* ── NAV ── */
    const nav=document.getElementById('nav');
    const scrollHandler = ()=>{
      if(nav) nav.classList.toggle('scrolled',window.scrollY>50);
    };
    window.addEventListener('scroll', scrollHandler);

    /* ── PARTICLES ── */
    let resizeHandler, drawId;
    const canvas=document.getElementById('bg-canvas');
    if (canvas) {
      const ctx=canvas.getContext('2d');
      let W,H,pts=[];
      resizeHandler = ()=>{W=canvas.width=window.innerWidth;H=canvas.height=window.innerHeight;};
      resizeHandler();
      window.addEventListener('resize',resizeHandler);

      function mkPt(){
        return{
          x:Math.random()*W,y:Math.random()*H,
          vx:(Math.random()-.5)*.25,vy:(Math.random()-.5)*.25,
          r:Math.random()*1.2+.3,
          o:Math.random()*.4+.05,
          c:Math.random()<.7?'200,241,53':'61,255,192'
        };
      }
      for(let i=0;i<90;i++) pts.push(mkPt());

      function drawPts(){
        ctx.clearRect(0,0,W,H);
        pts.forEach(p=>{
          p.x+=p.vx;p.y+=p.vy;
          if(p.x<0)p.x=W;if(p.x>W)p.x=0;
          if(p.y<0)p.y=H;if(p.y>H)p.y=0;
          ctx.beginPath();
          ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
          ctx.fillStyle=`rgba(${p.c},${p.o})`;
          ctx.fill();
        });
        // draw connections
        for(let i=0;i<pts.length;i++){
          for(let j=i+1;j<pts.length;j++){
            const dx=pts[i].x-pts[j].x,dy=pts[i].y-pts[j].y;
            const d=Math.sqrt(dx*dx+dy*dy);
            if(d<120){
              ctx.beginPath();
              ctx.moveTo(pts[i].x,pts[i].y);
              ctx.lineTo(pts[j].x,pts[j].y);
              ctx.strokeStyle=`rgba(200,241,53,${(.08*(1-d/120))})`;
              ctx.lineWidth=.5;
              ctx.stroke();
            }
          }
        }
        drawId = requestAnimationFrame(drawPts);
      }
      drawPts();
    }

    /* ── BUILD CHART ── */
    const chartEl=document.getElementById('chart');
    if (chartEl && chartEl.children.length === 0) {
      const heights=[32,44,38,55,50,68,63,78,88,72,85,95];
      heights.forEach((h,i)=>{
        const b=document.createElement('div');
        b.className='bar';
        b.style.height=h+'%';
        b.style.animationDelay=(i*.06+1.1)+'s';
        chartEl.appendChild(b);
      });
    }

    /* ── SCROLL REVEAL ── */
    const obs=new IntersectionObserver(entries=>{
      entries.forEach(e=>{
        if(e.isIntersecting){e.target.classList.add('vis');obs.unobserve(e.target);}
      });
    },{threshold:.1});
    document.querySelectorAll('.sr').forEach(el=>obs.observe(el));

    /* ── STEPS & TERMINAL REVEAL ── */
    const stepObs=new IntersectionObserver(entries=>{
      entries.forEach(e=>{
        if(e.isIntersecting){
          const steps=e.target.querySelectorAll('.step');
          steps.forEach((s,i)=>{setTimeout(()=>s.classList.add('visible'),i*150);});
          obs.unobserve(e.target);
        }
      });
    },{threshold:.1});
    const stepsEl=document.getElementById('steps');
    if(stepsEl)stepObs.observe(stepsEl);

    const termObs=new IntersectionObserver(entries=>{
      entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');}});
    },{threshold:.1});
    const termEl=document.getElementById('term');
    if(termEl)termObs.observe(termEl);

    /* ── FEAT LIST REVEAL ── */
    const featObs=new IntersectionObserver(entries=>{
      entries.forEach(e=>{
        if(e.isIntersecting){
          const items=e.target.querySelectorAll('.feat-item');
          items.forEach((it,i)=>{setTimeout(()=>it.classList.add('visible'),i*80);});
        }
      });
    },{threshold:.1});
    const featListEl=document.getElementById('featList');
    if(featListEl)featObs.observe(featListEl);

    /* ── COUNTDOWN TIMER ── */
    const endTime=new Date();
    endTime.setHours(endTime.getHours()+23,endTime.getMinutes()+47,endTime.getSeconds()+12);
    let timerInterval;
    function updateTimer(){
      const now=new Date();
      let diff=Math.max(0,endTime-now);
      const h=Math.floor(diff/3600000);diff%=3600000;
      const m=Math.floor(diff/60000);diff%=60000;
      const s=Math.floor(diff/1000);
      const th = document.getElementById('th');
      const tm = document.getElementById('tm');
      const ts = document.getElementById('ts');
      if(th) th.textContent=String(h).padStart(2,'0');
      if(tm) tm.textContent=String(m).padStart(2,'0');
      if(ts) ts.textContent=String(s).padStart(2,'0');
    }
    updateTimer();timerInterval = setInterval(updateTimer,1000);

    /* ── PRICE COUNTER ANIMATION ── */
    let priceAnimId;
    function animateCounter(el,from,to,duration){
      const start=performance.now();
      function update(now){
        const t=Math.min(1,(now-start)/duration);
        const ease=1-Math.pow(1-t,3);
        if(el) el.textContent=Math.round(from+(to-from)*ease);
        if(t<1) priceAnimId = requestAnimationFrame(update);
      }
      priceAnimId = requestAnimationFrame(update);
    }
    const priceObs=new IntersectionObserver(entries=>{
      entries.forEach(e=>{
        if(e.isIntersecting){
          animateCounter(document.getElementById('priceNum'),999,499,1200);
          priceObs.unobserve(e.target);
        }
      });
    },{threshold:.5});
    const priceEl=document.getElementById('priceNum');
    if(priceEl)priceObs.observe(priceEl);

    /* ── TILT on holo card ── */
    const holoCard=document.querySelector('.holo-card');
    const mouseMoveHolo = e=>{
      const r=holoCard.getBoundingClientRect();
      const cx=r.left+r.width/2,cy=r.top+r.height/2;
      const rx2=((e.clientY-cy)/r.height)*8;
      const ry2=((e.clientX-cx)/r.width)*-8;
      holoCard.style.transform=`perspective(800px) rotateX(${rx2}deg) rotateY(${ry2}deg)`;
    };
    const mouseLeaveHolo = ()=>{
      holoCard.style.transform='perspective(800px) rotateX(0) rotateY(0)';
    };
    if(holoCard){
      holoCard.addEventListener('mousemove', mouseMoveHolo);
      holoCard.addEventListener('mouseleave', mouseLeaveHolo);
    }

    /* ── STAT COUNTER ANIMATION ── */
    const statObs=new IntersectionObserver(entries=>{
      entries.forEach(e=>{
        if(e.isIntersecting){
          document.querySelectorAll('.stat-val').forEach(el=>{
            el.style.animation='none';
            el.style.opacity='0';
            setTimeout(()=>{
              el.style.transition='opacity .5s ease';
              el.style.opacity='1';
            },300+Math.random()*400);
          });
          statObs.unobserve(e.target);
        }
      });
    },{threshold:.5});
    const statsEl=document.querySelector('.stats-row');
    if(statsEl)statObs.observe(statsEl);

    return () => {
      document.removeEventListener('mousemove', mouseMoveHandler);
      cancelAnimationFrame(animId);
      interactables.forEach(el=>{
        el.removeEventListener('mouseenter', mouseEnter);
        el.removeEventListener('mouseleave', mouseLeave);
      });
      window.removeEventListener('scroll', scrollHandler);
      if (resizeHandler) window.removeEventListener('resize', resizeHandler);
      cancelAnimationFrame(drawId);
      obs.disconnect();
      stepObs.disconnect();
      termObs.disconnect();
      featObs.disconnect();
      clearInterval(timerInterval);
      cancelAnimationFrame(priceAnimId);
      priceObs.disconnect();
      if(holoCard){
        holoCard.removeEventListener('mousemove', mouseMoveHolo);
        holoCard.removeEventListener('mouseleave', mouseLeaveHolo);
      }
      statObs.disconnect();
    };
  }, []);

  return (
    <>
      <style jsx global>{`
        :root {
          --bg: #030407;
          --surface: #080a10;
          --border: rgba(255,255,255,0.06);
          --border2: rgba(200,241,53,0.15);
          --accent: #c8f135;
          --accent2: #3dffc0;
          --accent3: #ff4f6d;
          --accent4: #6c63ff;
          --text: #e8ecf0;
          --muted: #4a5060;
          --card: #0c0e16;
          --glow: rgba(200,241,53,0.12);
        }
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body {
          background: var(--bg);
          color: var(--text);
          font-family: 'DM Mono', monospace;
          overflow-x: hidden;
          cursor: none;
        }

        /* ── CURSOR ── */
        #cur { position:fixed;width:10px;height:10px;background:var(--accent);border-radius:50%;pointer-events:none;z-index:9999;transform:translate(-50%,-50%);transition:width .15s,height .15s,background .2s;mix-blend-mode:difference; }
        #cur-ring { position:fixed;width:40px;height:40px;border:1.5px solid rgba(200,241,53,.35);border-radius:50%;pointer-events:none;z-index:9998;transform:translate(-50%,-50%);transition:width .3s,height .3s,border-color .3s; }
        body.cursor-hover #cur { width:18px;height:18px; }
        body.cursor-hover #cur-ring { width:64px;height:64px;border-color:rgba(200,241,53,.5); }

        /* ── CANVAS ── */
        #bg-canvas { position:fixed;inset:0;z-index:0;pointer-events:none; }

        /* ── GRAIN ── */
        body::after {
          content:'';position:fixed;inset:0;z-index:1;pointer-events:none;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
          opacity:.4;
        }

        /* ── NAV ── */
        nav {
          position:fixed;top:0;left:0;right:0;z-index:100;
          display:flex;align-items:center;justify-content:space-between;
          padding:22px 52px;
          transition:background .4s,backdrop-filter .4s;
        }
        nav.scrolled { background:rgba(3,4,7,.88);backdrop-filter:blur(24px); }

        .logo {
          font-family:'Syne',sans-serif;font-weight:800;font-size:1.15rem;
          letter-spacing:-.03em;color:#fff;display:flex;align-items:center;gap:10px;
          opacity:0;animation:fadeDown .7s .1s ease forwards;
        }
        .logo-pulse {
          width:9px;height:9px;background:var(--accent);border-radius:50%;
          box-shadow:0 0 0 0 rgba(200,241,53,.6);
          animation:logoPulse 2s ease infinite;
        }
        @keyframes logoPulse {
          0%{box-shadow:0 0 0 0 rgba(200,241,53,.6)}
          70%{box-shadow:0 0 0 10px rgba(200,241,53,0)}
          100%{box-shadow:0 0 0 0 rgba(200,241,53,0)}
        }

        .nav-links { display:flex;gap:32px;list-style:none;opacity:0;animation:fadeDown .7s .2s ease forwards; }
        .nav-links a { color:var(--muted);text-decoration:none;font-size:.72rem;letter-spacing:.1em;text-transform:uppercase;transition:color .2s;position:relative; }
        .nav-links a::after { content:'';position:absolute;bottom:-4px;left:0;width:0;height:1px;background:var(--accent);transition:width .3s; }
        .nav-links a:hover { color:var(--text); }
        .nav-links a:hover::after { width:100%; }

        .nav-cta {
          background:var(--accent);color:#050607;border:none;
          padding:11px 24px;font-family:'Syne',sans-serif;font-size:.78rem;font-weight:800;
          letter-spacing:.04em;cursor:none;position:relative;overflow:hidden;
          opacity:0;animation:fadeDown .7s .3s ease forwards;
          clip-path:polygon(0 0,calc(100% - 10px) 0,100% 10px,100% 100%,0 100%);
        }
        .nav-cta::before { content:'';position:absolute;top:0;left:-100%;width:100%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.25),transparent);transition:left .5s; }
        .nav-cta:hover::before { left:100%; }
        .nav-cta:hover { box-shadow:0 0 30px rgba(200,241,53,.4); }

        @keyframes fadeDown { from{opacity:0;transform:translateY(-16px)} to{opacity:1;transform:translateY(0)} }

        /* ── HERO ── */
        .hero {
          min-height:100vh;display:flex;align-items:center;
          padding:130px 52px 80px;position:relative;z-index:2;
          display:grid;grid-template-columns:1.1fr .9fr;gap:60px;align-items:center;
        }

        .hero-left {}

        .hero-badge {
          display:inline-flex;align-items:center;gap:10px;
          border:1px solid var(--border2);background:rgba(200,241,53,.05);
          padding:7px 16px;font-size:.68rem;letter-spacing:.12em;text-transform:uppercase;color:var(--accent);
          margin-bottom:32px;
          opacity:0;animation:slideUp .6s .4s ease forwards;
        }
        .badge-dot { width:7px;height:7px;background:var(--accent);border-radius:50%;animation:logoPulse 1.8s ease infinite; }

        .hero-title {
          font-family:'Syne',sans-serif;
          font-size:clamp(3rem,5.5vw,5.5rem);
          font-weight:800;line-height:.92;letter-spacing:-.05em;color:#fff;
          margin-bottom:28px;
        }
        .hero-title .line { display:block;overflow:hidden; }
        .hero-title .line span {
          display:block;
          opacity:0;animation:lineReveal .8s ease forwards;
        }
        .hero-title .line:nth-child(1) span { animation-delay:.5s; }
        .hero-title .line:nth-child(2) span { animation-delay:.65s; }
        .hero-title .line:nth-child(3) span { animation-delay:.8s; }
        @keyframes lineReveal { from{opacity:0;transform:translateY(100%)} to{opacity:1;transform:translateY(0)} }

        .hero-title .stroke {
          color:transparent;-webkit-text-stroke:1.5px var(--accent);
        }
        .hero-title .accent-word {
          position:relative;display:inline-block;
        }
        .hero-title .accent-word::after {
          content:'';position:absolute;bottom:4px;left:0;right:0;height:3px;
          background:var(--accent);transform:scaleX(0);transform-origin:left;
          animation:underlineGrow .6s 1.4s ease forwards;
        }
        @keyframes underlineGrow { to{transform:scaleX(1)} }

        .hero-desc {
          color:var(--muted);font-size:.83rem;line-height:1.85;max-width:440px;
          margin-bottom:44px;
          opacity:0;animation:slideUp .6s .95s ease forwards;
        }

        .hero-actions {
          display:flex;gap:18px;align-items:center;
          opacity:0;animation:slideUp .6s 1.1s ease forwards;
        }

        .btn-primary {
          background:var(--accent);color:#040506;padding:15px 36px;
          font-family:'Syne',sans-serif;font-weight:800;font-size:.85rem;letter-spacing:.04em;
          border:none;cursor:none;position:relative;overflow:hidden;
          clip-path:polygon(0 0,calc(100% - 12px) 0,100% 12px,100% 100%,0 100%);
          transition:transform .2s,box-shadow .2s;
        }
        .btn-primary::after { content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.2) 0%,transparent 50%);opacity:0;transition:opacity .2s; }
        .btn-primary:hover { transform:translateY(-3px);box-shadow:0 12px 40px rgba(200,241,53,.4); }
        .btn-primary:hover::after { opacity:1; }

        .btn-ghost {
          color:var(--muted);font-family:'DM Mono',monospace;font-size:.75rem;
          letter-spacing:.06em;cursor:none;border:none;background:none;
          display:flex;align-items:center;gap:8px;transition:color .2s;
        }
        .btn-ghost svg { transition:transform .2s; }
        .btn-ghost:hover { color:var(--text); }
        .btn-ghost:hover svg { transform:translateX(5px); }

        @keyframes slideUp { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }

        /* ── HERO VISUAL ── */
        .hero-visual {
          position:relative;
          opacity:0;animation:slideUp .9s 1s ease forwards;
        }

        .holo-card {
          background:var(--card);border:1px solid var(--border);
          position:relative;overflow:hidden;padding:24px;
          transform-style:preserve-3d;transition:transform .1s;
        }
        .holo-card::before {
          content:'';position:absolute;inset:0;
          background:linear-gradient(135deg,rgba(200,241,53,.04) 0%,transparent 40%,rgba(61,255,192,.03) 100%);
        }
        .holo-card .top-line {
          position:absolute;top:0;left:0;right:0;height:1px;
          background:linear-gradient(90deg,transparent 0%,var(--accent) 40%,var(--accent2) 70%,transparent 100%);
          animation:shimmer 3s ease infinite;
        }
        @keyframes shimmer { 0%{opacity:.4} 50%{opacity:1} 100%{opacity:.4} }

        .mock-header { display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;padding-bottom:14px;border-bottom:1px solid var(--border); }
        .mock-title { font-family:'Syne',sans-serif;font-size:.78rem;font-weight:700;color:var(--text); }
        .live-badge {
          display:flex;align-items:center;gap:6px;
          background:rgba(200,241,53,.08);border:1px solid rgba(200,241,53,.2);
          padding:3px 10px;font-size:.6rem;letter-spacing:.1em;color:var(--accent);
        }
        .live-dot { width:6px;height:6px;background:var(--accent);border-radius:50%;animation:logoPulse 1.5s infinite; }

        .stats-row { display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:18px; }
        .stat-box {
          background:var(--surface);border:1px solid var(--border);padding:12px 10px;
          position:relative;overflow:hidden;transition:border-color .3s;
        }
        .stat-box:hover { border-color:rgba(200,241,53,.2); }
        .stat-box::after { content:'';position:absolute;bottom:0;left:0;height:2px;background:var(--accent);transform:scaleX(0);transform-origin:left;transition:transform .4s; }
        .stat-box:hover::after { transform:scaleX(1); }
        .stat-label { font-size:.58rem;color:var(--muted);letter-spacing:.08em;text-transform:uppercase;margin-bottom:4px; }
        .stat-val { font-family:'Syne',sans-serif;font-size:1.05rem;font-weight:800;color:#fff; }
        .stat-up { font-size:.58rem;color:var(--accent);margin-top:2px; }

        /* Chart */
        .chart-wrap { height:72px;display:flex;align-items:flex-end;gap:3px;margin-bottom:16px;position:relative; }
        .chart-wrap::after { content:'';position:absolute;bottom:0;left:0;right:0;height:1px;background:var(--border); }
        .bar {
          flex:1;background:rgba(200,241,53,.1);border-top:1px solid rgba(200,241,53,.3);
          transform:scaleY(0);transform-origin:bottom;
          animation:barUp .8s ease forwards;
        }
        @keyframes barUp { to{transform:scaleY(1)} }
        .bar:hover { background:rgba(200,241,53,.25); }

        /* Trend items */
        .trend-list { display:flex;flex-direction:column;gap:8px; }
        .trend-item {
          display:flex;align-items:center;gap:10px;
          background:var(--surface);border:1px solid var(--border);padding:9px 12px;
          transition:border-color .25s,transform .25s;
          animation:slideInRight .5s ease both;
        }
        .trend-item:nth-child(1){animation-delay:1.2s}
        .trend-item:nth-child(2){animation-delay:1.35s}
        .trend-item:nth-child(3){animation-delay:1.5s}
        @keyframes slideInRight { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
        .trend-item:hover { border-color:rgba(200,241,53,.2);transform:translateX(-3px); }
        .t-icon { width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-size:.75rem;flex-shrink:0; }
        .t-text { flex:1; }
        .t-name { font-size:.68rem;color:var(--text);margin-bottom:1px;font-family:'Syne',sans-serif;font-weight:700; }
        .t-sub { font-size:.58rem;color:var(--muted); }
        .t-score { font-family:'Syne',sans-serif;font-size:.75rem;font-weight:800; }

        /* ── TICKER ── */
        .ticker { border-top:1px solid var(--border);border-bottom:1px solid var(--border);padding:13px 0;overflow:hidden;position:relative;z-index:2; }
        .ticker::before,.ticker::after { content:'';position:absolute;top:0;bottom:0;width:120px;z-index:2; }
        .ticker::before { left:0;background:linear-gradient(90deg,var(--bg),transparent); }
        .ticker::after { right:0;background:linear-gradient(-90deg,var(--bg),transparent); }
        .ticker-track { display:flex;gap:56px;animation:tick 22s linear infinite;width:max-content; }
        @keyframes tick { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        .tick-item { display:flex;align-items:center;gap:12px;font-size:.68rem;letter-spacing:.08em;color:var(--muted);white-space:nowrap; }
        .tick-item strong { color:var(--accent);font-family:'Syne',sans-serif;font-weight:700; }
        .tick-sep { opacity:.3; }

        /* ── SECTIONS ── */
        .section { padding:110px 52px;max-width:1240px;margin:0 auto;position:relative;z-index:2; }

        .section-eyebrow {
          font-size:.62rem;letter-spacing:.22em;text-transform:uppercase;color:var(--accent);
          margin-bottom:14px;display:flex;align-items:center;gap:12px;
        }
        .section-eyebrow::before { content:'';width:28px;height:1px;background:var(--accent);opacity:.6; }

        .section-h {
          font-family:'Syne',sans-serif;
          font-size:clamp(2rem,3.2vw,3rem);
          font-weight:800;letter-spacing:-.04em;color:#fff;margin-bottom:16px;line-height:1.05;
        }
        .section-h em { font-style:normal;color:var(--accent); }
        .section-h .stroke-text { color:transparent;-webkit-text-stroke:1px rgba(255,255,255,.3); }

        .section-sub { color:var(--muted);font-size:.8rem;line-height:1.9;max-width:500px;margin-bottom:64px; }

        /* ── FEATURE GRID ── */
        .feat-grid { display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--border); border:1px solid var(--border); }

        .feat-card {
          background:var(--bg);padding:36px 30px;position:relative;overflow:hidden;
          transition:background .3s;
        }
        .feat-card .hover-bg {
          position:absolute;inset:0;
          background:linear-gradient(135deg,rgba(200,241,53,.05) 0%,transparent 60%);
          opacity:0;transition:opacity .4s;
        }
        .feat-card:hover { background:var(--card); }
        .feat-card:hover .hover-bg { opacity:1; }
        .feat-card .corner {
          position:absolute;top:0;right:0;width:0;height:0;
          border-style:solid;border-width:0 30px 30px 0;
          border-color:transparent var(--border) transparent transparent;
          transition:border-width .3s;
        }
        .feat-card:hover .corner { border-width:0 40px 40px 0;border-color:transparent rgba(200,241,53,.2) transparent transparent; }

        .feat-num { font-family:'Syne',sans-serif;font-size:.6rem;font-weight:700;color:var(--muted);letter-spacing:.2em;margin-bottom:18px;opacity:.5; }
        .feat-icon {
          width:44px;height:44px;border:1px solid var(--border);
          display:flex;align-items:center;justify-content:center;margin-bottom:22px;
          font-size:1.1rem;transition:border-color .3s,background .3s,transform .3s;
        }
        .feat-card:hover .feat-icon { border-color:rgba(200,241,53,.35);background:rgba(200,241,53,.07);transform:rotate(-6deg) scale(1.1); }
        .feat-name { font-family:'Syne',sans-serif;font-size:.95rem;font-weight:800;color:#fff;margin-bottom:10px;letter-spacing:-.01em; }
        .feat-desc { color:var(--muted);font-size:.73rem;line-height:1.8; }
        .feat-tags { display:flex;flex-wrap:wrap;gap:6px;margin-top:16px; }
        .feat-tag { font-size:.58rem;letter-spacing:.08em;padding:3px 8px;border:1px solid var(--border);color:var(--muted);text-transform:uppercase;transition:border-color .25s,color .25s; }
        .feat-card:hover .feat-tag { border-color:rgba(200,241,53,.15);color:rgba(200,241,53,.6); }

        /* ── MARQUEE ── */
        .marquee-wrap { padding:48px 0;overflow:hidden;border-top:1px solid var(--border);border-bottom:1px solid var(--border);position:relative;z-index:2; }
        .marquee-track { display:flex;gap:56px;animation:marquee 18s linear infinite;width:max-content; }
        @keyframes marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        .m-word { font-family:'Syne',sans-serif;font-size:clamp(1.6rem,2.8vw,2.4rem);font-weight:800;letter-spacing:-.03em;color:transparent;-webkit-text-stroke:1px rgba(255,255,255,.1);white-space:nowrap;transition:color .3s,-webkit-text-stroke .3s; }
        .m-word.solid { color:#fff;-webkit-text-stroke:0; }
        .m-dot { font-family:'Syne',sans-serif;font-size:1rem;color:var(--accent);opacity:.4; }

        /* ── HOW IT WORKS ── */
        .how-wrap { display:grid;grid-template-columns:1fr;max-width:800px;margin:0 auto;gap:72px;align-items:start; }

        .steps { display:flex;flex-direction:column; }
        .step {
          display:flex;gap:24px;padding:28px 0;border-bottom:1px solid var(--border);
          position:relative;transition:padding-left .3s;cursor:default;
          opacity:0;transform:translateX(-20px);transition:opacity .5s,transform .5s,padding-left .3s;
        }
        .step.visible { opacity:1;transform:translateX(0); }
        .step:first-child { border-top:1px solid var(--border); }
        .step:hover { padding-left:12px; }
        .step-line {
          position:absolute;left:0;top:0;bottom:0;width:2px;
          background:linear-gradient(to bottom,var(--accent),transparent);
          transform:scaleY(0);transform-origin:top;transition:transform .5s .3s;
        }
        .step.visible .step-line { transform:scaleY(1); }
        .step-n { font-family:'Syne',sans-serif;font-size:.62rem;font-weight:700;color:var(--accent);opacity:.7;width:26px;flex-shrink:0;padding-top:2px;letter-spacing:.1em; }
        .step-name { font-family:'Syne',sans-serif;font-size:.92rem;font-weight:700;color:#fff;margin-bottom:7px; }
        .step-desc { color:var(--muted);font-size:.73rem;line-height:1.75; }

        /* Terminal */
        .terminal {
          background:var(--card);border:1px solid var(--border);
          position:relative;overflow:hidden;
          opacity:0;transform:translateY(20px);transition:opacity .6s .4s,transform .6s .4s;
        }
        .terminal.visible { opacity:1;transform:translateY(0); }
        .terminal::before { content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,var(--accent2),transparent); }
        .term-head { padding:12px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:6px; }
        .d { width:9px;height:9px;border-radius:50%; }
        .d1{background:#ff5f57}.d2{background:#febc2e}.d3{background:#28c840}
        .term-lbl { font-size:.62rem;color:var(--muted);margin-left:10px;letter-spacing:.08em; }
        .term-body { padding:20px;font-size:.7rem;line-height:2; }
        .tl { display:flex;gap:8px;color:var(--muted); }
        .tl .p { color:var(--accent);opacity:.8; }
        .tl .c { color:var(--text); }
        .tl .v { color:var(--accent2); }
        .tl .h { color:var(--accent3); }
        .tl .g { color:var(--accent); }
        .tl .i { font-style:italic; }
        .blink { display:inline-block;width:7px;height:13px;background:var(--accent);margin-left:2px;animation:blink 1s step-end infinite;vertical-align:middle; }
        @keyframes blink { 50%{opacity:0} }

        /* ── PRICING ── */
        .pricing-wrap { position:relative; }

        .offer-banner {
          background:linear-gradient(135deg,#1a0f00 0%,#0d1a00 100%);
          border:1px solid rgba(200,241,53,.3);
          padding:16px 28px;margin-bottom:2px;
          display:flex;align-items:center;justify-content:space-between;
          position:relative;overflow:hidden;
        }
        .offer-banner::before {
          content:'';position:absolute;inset:0;
          background:linear-gradient(90deg,transparent 0%,rgba(200,241,53,.04) 50%,transparent 100%);
          animation:scanline 3s ease-in-out infinite;
        }
        @keyframes scanline { 0%,100%{transform:translateX(-100%)} 50%{transform:translateX(100%)} }
        .offer-left { display:flex;align-items:center;gap:14px; }
        .offer-tag { background:var(--accent3);color:#fff;font-family:'Syne',sans-serif;font-size:.62rem;font-weight:800;letter-spacing:.1em;padding:4px 10px; }
        .offer-text { font-family:'Syne',sans-serif;font-size:.88rem;font-weight:700;color:#fff; }
        .offer-sub { font-size:.65rem;color:var(--muted);margin-top:2px; }
        .offer-countdown { text-align:right; }
        .offer-count-label { font-size:.58rem;color:var(--muted);letter-spacing:.1em;text-transform:uppercase;margin-bottom:4px; }
        .timer { display:flex;gap:6px;align-items:center; }
        .time-block { text-align:center; }
        .time-num { font-family:'Syne',sans-serif;font-size:1.2rem;font-weight:800;color:var(--accent);line-height:1; }
        .time-label { font-size:.52rem;color:var(--muted);letter-spacing:.06em; }
        .time-sep { font-family:'Syne',sans-serif;font-size:1rem;color:var(--accent);opacity:.4;margin-bottom:8px; }

        .pricing-card {
          background:var(--card);border:1px solid rgba(200,241,53,.2);
          padding:52px 48px;position:relative;overflow:hidden;
          display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:start;
        }
        .pricing-card::before { content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,var(--accent),var(--accent2)); }
        .pricing-card::after {
          content:'';position:absolute;
          width:400px;height:400px;
          background:radial-gradient(circle,rgba(200,241,53,.06) 0%,transparent 70%);
          right:-100px;top:-100px;pointer-events:none;
        }

        .price-left {}
        .price-tier { font-size:.62rem;letter-spacing:.2em;text-transform:uppercase;color:var(--accent);margin-bottom:20px;display:flex;align-items:center;gap:8px; }
        .tier-dot { width:5px;height:5px;background:var(--accent);border-radius:50%; }

        .price-amount {
          display:flex;align-items:flex-start;gap:0;margin-bottom:4px;
        }
        .price-currency { font-family:'Syne',sans-serif;font-size:1.4rem;font-weight:800;color:var(--muted);margin-top:10px; }
        .price-num { font-family:'Syne',sans-serif;font-size:5rem;font-weight:800;line-height:1;letter-spacing:-.05em;color:#fff; }
        .price-period { font-family:'Syne',sans-serif;font-size:.85rem;font-weight:600;color:var(--muted);margin-top:auto;margin-bottom:10px;margin-left:4px; }

        .price-was {
          display:flex;align-items:center;gap:10px;margin-bottom:8px;
        }
        .was-amt { font-family:'Syne',sans-serif;font-size:1.1rem;font-weight:700;color:var(--muted);text-decoration:line-through;opacity:.5; }
        .save-badge {
          background:rgba(255,79,109,.15);border:1px solid rgba(255,79,109,.3);
          color:var(--accent3);font-size:.62rem;font-weight:700;letter-spacing:.08em;
          padding:3px 10px;font-family:'Syne',sans-serif;
          animation:badgePop .4s 1.5s ease both;
        }
        @keyframes badgePop { from{transform:scale(0);opacity:0} 80%{transform:scale(1.1)} to{transform:scale(1);opacity:1} }

        .price-trial { font-size:.7rem;color:var(--accent);margin-bottom:28px;display:flex;align-items:center;gap:6px; }
        .price-trial::before { content:'★';font-size:.7rem; }

        .btn-pricing {
          width:100%;padding:16px;
          font-family:'Syne',sans-serif;font-size:.85rem;font-weight:800;letter-spacing:.06em;
          background:var(--accent);color:#040506;border:none;cursor:none;
          position:relative;overflow:hidden;
          clip-path:polygon(0 0,calc(100% - 14px) 0,100% 14px,100% 100%,0 100%);
          transition:transform .2s,box-shadow .2s;
        }
        .btn-pricing::before { content:'';position:absolute;top:0;left:-100%;width:100%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.25),transparent);transition:left .5s; }
        .btn-pricing:hover::before { left:100%; }
        .btn-pricing:hover { transform:translateY(-3px);box-shadow:0 12px 40px rgba(200,241,53,.45); }

        .price-note { font-size:.65rem;color:var(--muted);margin-top:12px;text-align:center;letter-spacing:.04em; }

        .price-right {}
        .feat-list { list-style:none;display:flex;flex-direction:column;gap:12px; }
        .feat-item {
          display:flex;gap:12px;align-items:flex-start;
          font-size:.73rem;color:var(--text);
          opacity:0;transform:translateX(20px);
          transition:opacity .4s,transform .4s;
        }
        .feat-item.visible { opacity:1;transform:translateX(0); }
        .feat-check { color:var(--accent);flex-shrink:0;margin-top:1px;font-size:.75rem; }

        /* ── CTA ── */
        .cta-wrap {
          margin:0 52px 90px;border:1px solid var(--border);
          background:var(--card);padding:100px;
          text-align:center;position:relative;overflow:hidden;z-index:2;
        }
        .cta-wrap::before {
          content:'';position:absolute;inset:0;
          background:radial-gradient(ellipse 60% 80% at 50% 120%,rgba(200,241,53,.08) 0%,transparent 100%);
        }
        .cta-ghost-text {
          position:absolute;font-family:'Syne',sans-serif;font-size:15vw;font-weight:800;
          color:transparent;-webkit-text-stroke:1px rgba(255,255,255,.025);
          left:50%;top:50%;transform:translate(-50%,-50%);white-space:nowrap;letter-spacing:-.04em;
          pointer-events:none;user-select:none;
        }
        .cta-eyebrow { font-size:.62rem;letter-spacing:.2em;text-transform:uppercase;color:var(--accent);margin-bottom:16px;position:relative; }
        .cta-title {
          font-family:'Syne',sans-serif;font-size:clamp(2.2rem,4vw,4rem);font-weight:800;
          letter-spacing:-.04em;color:#fff;margin-bottom:20px;position:relative;
        }
        .cta-desc { color:var(--muted);font-size:.8rem;line-height:1.9;max-width:440px;margin:0 auto 44px;position:relative; }
        .cta-actions { position:relative;display:flex;gap:18px;justify-content:center;align-items:center; }

        /* ── FOOTER ── */
        footer {
          border-top:1px solid var(--border);padding:40px 52px;
          display:flex;justify-content:space-between;align-items:center;position:relative;z-index:2;
        }
        .footer-logo { font-family:'Syne',sans-serif;font-weight:800;font-size:.95rem;letter-spacing:-.02em;color:var(--muted); }
        .footer-links { display:flex;gap:28px; }
        .footer-links a { font-size:.68rem;color:var(--muted);text-decoration:none;letter-spacing:.06em;text-transform:uppercase;transition:color .2s; }
        .footer-links a:hover { color:var(--text); }
        .footer-copy { font-size:.65rem;color:var(--muted);opacity:.5; }

        /* ── SCROLL REVEAL ── */
        .sr { opacity:0;transform:translateY(36px);transition:opacity .7s ease,transform .7s ease; }
        .sr.vis { opacity:1;transform:translateY(0); }
        .sr-d1{transition-delay:.1s}.sr-d2{transition-delay:.2s}.sr-d3{transition-delay:.3s}.sr-d4{transition-delay:.4s}.sr-d5{transition-delay:.5s}

        /* ── FLOATING ORBS ── */
        .orb {
          position:fixed;border-radius:50%;pointer-events:none;z-index:1;filter:blur(80px);
        }
        .orb1 { width:400px;height:400px;background:rgba(200,241,53,.04);top:10%;right:5%;animation:float1 12s ease-in-out infinite; }
        .orb2 { width:300px;height:300px;background:rgba(61,255,192,.03);bottom:20%;left:5%;animation:float2 15s ease-in-out infinite; }
        .orb3 { width:200px;height:200px;background:rgba(108,99,255,.04);top:50%;left:40%;animation:float3 10s ease-in-out infinite; }
        @keyframes float1 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-30px,40px)} }
        @keyframes float2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(40px,-30px)} }
        @keyframes float3 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-20px,20px)} }

        /* ── RESPONSIVE ── */
        @media(max-width:900px){
          nav{padding:16px 24px}
          .nav-links{display:none}
          .hero{grid-template-columns:1fr;padding:100px 24px 60px}
          .hero-visual{display:none}
          .section{padding:64px 24px}
          .feat-grid{grid-template-columns:1fr}
          .how-wrap{grid-template-columns:1fr}
          .pricing-card{grid-template-columns:1fr;padding:36px 28px}
          .cta-wrap{padding:60px 28px;margin:0 24px 60px}
          footer{flex-direction:column;gap:16px;padding:32px 24px;text-align:center}
          .offer-banner{flex-direction:column;gap:16px}
        }
      `}</style>

      <div id="cur"></div>
      <div id="cur-ring"></div>

      {/* Floating orbs */}
      <div className="orb orb1"></div>
      <div className="orb orb2"></div>
      <div className="orb orb3"></div>

      {/* Particle canvas */}
      <canvas id="bg-canvas"></canvas>

      {/* ── NAV ── */}
      <nav id="nav">
        <div className="logo"><div className="logo-pulse"></div>Vyron Intelligence</div>
        <ul className="nav-links">
          <li><a href="#">Features</a></li>
          <li><a href="#">Trends</a></li>
          <li><a href="#">Pricing</a></li>
          <li><a href="#">Docs</a></li>
        </ul>
        <button className="nav-cta">Get Access →</button>
      </nav>

      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-left">
          <div className="hero-badge"><div className="badge-dot"></div>Live Intelligence Platform · v3.0</div>
          <h1 className="hero-title">
            <div className="line"><span>Outrank.</span></div>
            <div className="line"><span>Outsmart.</span></div>
            <div className="line"><span className="stroke"><em>Outgrow.</em></span></div>
          </h1>
          <p className="hero-desc">Real-time YouTube analytics, viral trend radar, and competitor intelligence — everything to dominate your niche before anyone else does.</p>
          <div className="hero-actions">
            <button className="btn-primary">Start Free Trial →</button>
            <button className="btn-ghost">Watch demo <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
          </div>
        </div>

        <div className="hero-visual">
          <div className="holo-card">
            <div className="top-line"></div>
            <div className="mock-header">
              <span className="mock-title">Channel Intelligence</span>
              <span className="live-badge"><span className="live-dot"></span> LIVE</span>
            </div>
            <div className="stats-row">
              <div className="stat-box">
                <div className="stat-label">Subscribers</div>
                <div className="stat-val" id="s1">48.2K</div>
                <div className="stat-up">↑ +2.1% today</div>
              </div>
              <div className="stat-box">
                <div className="stat-label">Total Views</div>
                <div className="stat-val" id="s2">3.4M</div>
                <div className="stat-up">↑ +8.6K</div>
              </div>
              <div className="stat-box">
                <div className="stat-label">Hot Videos</div>
                <div className="stat-val" id="s3">3</div>
                <div className="stat-up">↑ Above avg</div>
              </div>
            </div>
            <div className="chart-wrap" id="chart"></div>
            <div className="trend-list">
              <div className="trend-item">
                <div className="t-icon">🔥</div>
                <div className="t-text"><div className="t-name">AI Tools for Creators</div><div className="t-sub">viral momentum detected</div></div>
                <div className="t-score" style={{color: 'var(--accent3)'}}>HOT</div>
              </div>
              <div className="trend-item">
                <div className="t-icon">📈</div>
                <div className="t-text"><div className="t-name">YouTube SEO 2025</div><div className="t-sub">growing above niche avg</div></div>
                <div className="t-score" style={{color: 'var(--accent)'}}>+147%</div>
              </div>
              <div className="trend-item">
                <div className="t-icon">🎯</div>
                <div className="t-text"><div className="t-name">Competitor gap found</div><div className="t-sub">high-value keyword uncovered</div></div>
                <div className="t-score" style={{color: 'var(--accent2)'}}>NEW</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── DEMO DASHBOARD ── */}
      <div className="section" style={{ paddingTop: '40px', paddingBottom: '40px' }}>
        <div className="section-eyebrow sr">Live Preview</div>
        <h2 className="section-h sr sr-d1">See Vyron in <em>Action</em></h2>
        <p className="section-sub sr sr-d2" style={{ marginBottom: '40px' }}>Explore the dashboard features directly in your browser with live demo data.</p>
        <DemoDashboard />
      </div>

      {/* ── TICKER ── */}
      <div className="ticker">
        <div className="ticker-track">
          <div className="tick-item"><strong>48.2K</strong> channels tracked <span className="tick-sep">—</span></div>
          <div className="tick-item"><strong>Trend Radar</strong> updates hourly <span className="tick-sep">—</span></div>
          <div className="tick-item"><strong>3.4M+</strong> data points daily <span className="tick-sep">—</span></div>
          <div className="tick-item"><strong>Competitor Matrix</strong> 50+ niches <span className="tick-sep">—</span></div>
          <div className="tick-item"><strong>AI-powered</strong> virality score <span className="tick-sep">—</span></div>
          <div className="tick-item"><strong>Real-time</strong> growth projections <span className="tick-sep">—</span></div>
          <div className="tick-item"><strong>48.2K</strong> channels tracked <span className="tick-sep">—</span></div>
          <div className="tick-item"><strong>Trend Radar</strong> updates hourly <span className="tick-sep">—</span></div>
          <div className="tick-item"><strong>3.4M+</strong> data points daily <span className="tick-sep">—</span></div>
          <div className="tick-item"><strong>Competitor Matrix</strong> 50+ niches <span className="tick-sep">—</span></div>
          <div className="tick-item"><strong>AI-powered</strong> virality score <span className="tick-sep">—</span></div>
          <div className="tick-item"><strong>Real-time</strong> growth projections <span className="tick-sep">—</span></div>
        </div>
      </div>

      {/* ── FEATURES ── */}
      <div className="section">
        <div className="section-eyebrow sr">Core Capabilities</div>
        <h2 className="section-h sr sr-d1">Built for creators who<br/>play to <em>win</em></h2>
        <p className="section-sub sr sr-d2">Every tool to understand your channel, outsmart competitors, and find viral content before everyone else does.</p>
        <div className="feat-grid sr sr-d2">
          <div className="feat-card">
            <div className="hover-bg"></div><div className="corner"></div>
            <div className="feat-num">01</div>
            <div className="feat-icon">📊</div>
            <div className="feat-name">Analytics & Tracking</div>
            <p className="feat-desc">Daily snapshots tracking subscribers, views, and video counts. Growth projections based on historical data and recent performance patterns.</p>
            <div className="feat-tags"><span className="feat-tag">Historical</span><span className="feat-tag">Projections</span><span className="feat-tag">Milestones</span></div>
          </div>
          <div className="feat-card">
            <div className="hover-bg"></div><div className="corner"></div>
            <div className="feat-num">02</div>
            <div className="feat-icon">🔭</div>
            <div className="feat-name">Trend Radar</div>
            <p className="feat-desc">Real-time scanning of niche content to identify viral momentum. AI generates Quick Wins and tracks psychological hooks and winning patterns.</p>
            <div className="feat-tags"><span className="feat-tag">Real-time</span><span className="feat-tag">AI Insights</span><span className="feat-tag">Viral Hooks</span></div>
          </div>
          <div className="feat-card">
            <div className="hover-bg"></div><div className="corner"></div>
            <div className="feat-num">03</div>
            <div className="feat-icon">⚔️</div>
            <div className="feat-name">Competitor Matrix</div>
            <p className="feat-desc">Identify rivals, market leaders, and rising stars. Deep-dive analysis on competitor Content DNA and growth velocity.</p>
            <div className="feat-tags"><span className="feat-tag">Content DNA</span><span className="feat-tag">Velocity</span><span className="feat-tag">Benchmarks</span></div>
          </div>
          <div className="feat-card">
            <div className="hover-bg"></div><div className="corner"></div>
            <div className="feat-num">04</div>
            <div className="feat-icon">🔍</div>
            <div className="feat-name">Advanced Search</div>
            <p className="feat-desc">Multi-parameter YouTube search with region, language, date, and duration filters. Sort by proprietary virality and growth scores.</p>
            <div className="feat-tags"><span className="feat-tag">Virality Score</span><span className="feat-tag">Growth Rank</span><span className="feat-tag">Precision</span></div>
          </div>
          <div className="feat-card">
            <div className="hover-bg"></div><div className="corner"></div>
            <div className="feat-num">05</div>
            <div className="feat-icon">📁</div>
            <div className="feat-name">Research Library</div>
            <p className="feat-desc">Save trends, competitor analysis, and content ideas. Built-in rich text editor for deep-dive research, strategy notes, and content blueprints.</p>
            <div className="feat-tags"><span className="feat-tag">Notes</span><span className="feat-tag">Blueprints</span><span className="feat-tag">Strategy</span></div>
          </div>
          <div className="feat-card">
            <div className="hover-bg"></div><div className="corner"></div>
            <div className="feat-num">06</div>
            <div className="feat-icon">⚡</div>
            <div className="feat-name">AI Infrastructure</div>
            <p className="feat-desc">Vector search via Zilliz/Milvus for semantic content matching. Background automation for daily snapshots and automated email reporting.</p>
            <div className="feat-tags"><span className="feat-tag">Vector Search</span><span className="feat-tag">Automation</span><span className="feat-tag">Email Reports</span></div>
          </div>
        </div>
      </div>

      {/* ── MARQUEE ── */}
      <div className="marquee-wrap">
        <div className="marquee-track">
          <span className="m-word">Analytics</span><span className="m-dot">✦</span>
          <span className="m-word solid">Trend Radar</span><span className="m-dot">✦</span>
          <span className="m-word">Competitor Intel</span><span className="m-dot">✦</span>
          <span className="m-word solid">Virality Score</span><span className="m-dot">✦</span>
          <span className="m-word">Growth Engine</span><span className="m-dot">✦</span>
          <span className="m-word solid">Deep Research</span><span className="m-dot">✦</span>
          <span className="m-word">Analytics</span><span className="m-dot">✦</span>
          <span className="m-word solid">Trend Radar</span><span className="m-dot">✦</span>
          <span className="m-word">Competitor Intel</span><span className="m-dot">✦</span>
          <span className="m-word solid">Virality Score</span><span className="m-dot">✦</span>
          <span className="m-word">Growth Engine</span><span className="m-dot">✦</span>
          <span className="m-word solid">Deep Research</span><span className="m-dot">✦</span>
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <div className="section">
        <div className="section-eyebrow sr">Process</div>
        <h2 className="section-h sr sr-d1">Intelligence in <em>motion</em></h2>
        <div className="how-wrap">
          <div className="steps" id="steps">
            <div className="step"><div className="step-line"></div><div className="step-n">01</div><div><div className="step-name">Connect your channel</div><p className="step-desc">Link your YouTube channel in seconds. Vyron immediately builds your analytics baseline with full historical data.</p></div></div>
            <div className="step"><div className="step-line"></div><div className="step-n">02</div><div><div className="step-name">Scan your niche</div><p className="step-desc">Trend Radar continuously monitors your niche for viral momentum, identifying content patterns before they peak.</p></div></div>
            <div className="step"><div className="step-line"></div><div className="step-n">03</div><div><div className="step-name">Map the competition</div><p className="step-desc">Competitor Matrix identifies rivals and analyzes their Content DNA, growth velocity, and efficiency metrics vs yours.</p></div></div>
            <div className="step"><div className="step-line"></div><div className="step-n">04</div><div><div className="step-name">Act on insights</div><p className="step-desc">Save ideas to Library, receive automated email reports, and act on AI Quick Wins before competitors do.</p></div></div>
          </div>
        </div>
      </div>

      {/* ── PRICING ── */}
      <div className="section">
        <div className="section-eyebrow sr">Pricing</div>
        <h2 className="section-h sr sr-d1">One plan. <em>Total access.</em><br/><span className="stroke-text">No limits.</span></h2>
        <p className="section-sub sr sr-d2">7 days free — no card needed. Cancel anytime. Powered by Razorpay.</p>

        <div className="pricing-wrap sr sr-d2">
          <div className="offer-banner">
            <div className="offer-left">
              <div className="offer-tag">VERSION 3 OFFER</div>
              <div>
                <div className="offer-text">🎉 Early adopter — 50% off for life</div>
                <div className="offer-sub">Lock in ₹499/mo before this offer expires. Never pay more.</div>
              </div>
            </div>
            <div className="offer-countdown">
              <div className="offer-count-label">Offer ends in</div>
              <div className="timer">
                <div className="time-block"><div className="time-num" id="th">00</div><div className="time-label">HRS</div></div>
                <div className="time-sep">:</div>
                <div className="time-block"><div className="time-num" id="tm">00</div><div className="time-label">MIN</div></div>
                <div className="time-sep">:</div>
                <div className="time-block"><div className="time-num" id="ts">00</div><div className="time-label">SEC</div></div>
              </div>
            </div>
          </div>

          <div className="pricing-card">
            <div className="price-left">
              <div className="price-tier"><span className="tier-dot"></span>Pro — Everything Included</div>
              <div className="price-was">
                <span className="was-amt">₹999/mo</span>
                <span className="save-badge">SAVE 50%</span>
              </div>
              <div className="price-amount">
                <span className="price-currency">₹</span>
                <span className="price-num" id="priceNum">499</span>
                <span className="price-period">/mo</span>
              </div>
              <div className="price-trial">7 days free · no card required to start</div>
              <button className="btn-pricing">Start Free Trial →</button>
              <div className="price-note">Then ₹499/mo · cancel anytime · Razorpay secure</div>
            </div>
            <div className="price-right">
              <ul className="feat-list" id="featList">
                <li className="feat-item"><span className="feat-check">→</span> Real-time Trend Radar + Quick Wins</li>
                <li className="feat-item"><span className="feat-check">→</span> Full Competitor Matrix & Content DNA</li>
                <li className="feat-item"><span className="feat-check">→</span> AI growth projections & milestone tracking</li>
                <li className="feat-item"><span className="feat-check">→</span> Advanced search with virality sorting</li>
                <li className="feat-item"><span className="feat-check">→</span> Historical analytics & daily snapshots</li>
                <li className="feat-item"><span className="feat-check">→</span> Unlimited research library & notes</li>
                <li className="feat-item"><span className="feat-check">→</span> Automated email trend reports</li>
                <li className="feat-item"><span className="feat-check">→</span> Vector semantic search (Milvus)</li>
                <li className="feat-item"><span className="feat-check">→</span> Video performance "Hot" detection</li>
                <li className="feat-item"><span className="feat-check">→</span> All future features included free</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* ── CTA ── */}
      <div className="cta-wrap sr">
        <div className="cta-ghost-text">VYRON</div>
        <div className="cta-eyebrow">Ready to dominate</div>
        <h2 className="cta-title">Your niche won't<br/>wait for you.</h2>
        <p className="cta-desc">Every hour without Vyron is an hour your competitors are finding the trends you're missing. Start free today.</p>
        <div className="cta-actions">
          <button className="btn-primary">Start 7-Day Free Trial →</button>
          <button className="btn-ghost" style={{color: 'var(--muted)'}}>View all features <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer>
        <div className="footer-logo">Vyron Intelligence</div>
        <div className="footer-links">
          <a href="#">Privacy</a><a href="#">Terms</a><a href="#">Docs</a><a href="#">Support</a>
        </div>
        <div className="footer-copy">© 2025 Vyron Intelligence</div>
      </footer>
    </>
  );
}
