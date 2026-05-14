(function(){
  function fmt(sec){
    if(!isFinite(sec)) return '0:00';
    sec = Math.max(0, Math.floor(sec));
    const m = Math.floor(sec/60);
    const s = String(sec%60).padStart(2,'0');
    return `${m}:${s}`;
  }

  function setupPlayer(suffix){
    const suf = suffix ? `-${suffix}` : '';
    const iframe = document.getElementById(`pp-vimeo${suf}`);
    if(!iframe) return;

    const playBtn = document.getElementById(`pp-play-pause${suf}`);
    const playIcon = document.getElementById(`pp-icon-play${suf}`);
    const pauseIcon = document.getElementById(`pp-icon-pause${suf}`);
    const timeEl = document.getElementById(`pp-time${suf}`);
    const muteBtn = document.getElementById(`pp-mute${suf}`);
    const muteLine = document.getElementById(`pp-mute-line${suf}`);
    const volArc = document.getElementById(`pp-vol-arc${suf}`);
    const fsBtn = document.getElementById(`pp-fullscreen${suf}`);
    const progressWrap = document.getElementById(`pp-progress-wrap${suf}`);
    const progressFill = document.getElementById(`pp-progress-fill${suf}`);

    if (!window.Vimeo || !window.Vimeo.Player) return;
    const player = new window.Vimeo.Player(iframe);
    let duration = 0;
    let playing = false;
    let muted = false;

    player.getDuration().then((d)=>{ duration = d || 0; }).catch(()=>{});
    player.on('timeupdate', (d)=>{
      if (timeEl) timeEl.textContent = `${fmt(d.seconds)} / ${fmt(d.duration || duration)}`;
      duration = d.duration || duration;
      if (progressFill && duration > 0) progressFill.style.width = `${(d.seconds/duration)*100}%`;
    });
    player.on('play', ()=>{
      playing = true;
      if (playIcon) playIcon.style.display = 'none';
      if (pauseIcon) pauseIcon.style.display = '';
    });
    player.on('pause', ()=>{
      playing = false;
      if (playIcon) playIcon.style.display = '';
      if (pauseIcon) pauseIcon.style.display = 'none';
    });

    if (playBtn) playBtn.addEventListener('click', ()=>{ (playing ? player.pause() : player.play()).catch(()=>{}); });
    if (muteBtn) muteBtn.addEventListener('click', ()=>{
      muted = !muted;
      player.setMuted(muted).catch(()=>{});
      if (muteLine) muteLine.style.display = muted ? '' : 'none';
      if (volArc) volArc.style.display = muted ? 'none' : '';
    });
    if (fsBtn) fsBtn.addEventListener('click', ()=>{
      // Try the Vimeo Player SDK's fullscreen first — it knows how to
      // call iOS's webkitEnterFullscreen on the underlying <video>.
      if (player.requestFullscreen) {
        player.requestFullscreen().catch(()=>{
          // Fallback: standard Fullscreen API on the wrapper (desktop).
          const wrap = iframe.closest('.pp-hero') || iframe.parentElement;
          if (!wrap) return;
          if (document.fullscreenElement) document.exitFullscreen().catch(()=>{});
          else if (wrap.requestFullscreen) wrap.requestFullscreen().catch(()=>{});
        });
        return;
      }
      const wrap = iframe.closest('.pp-hero') || iframe.parentElement;
      if (!wrap) return;
      if (document.fullscreenElement) document.exitFullscreen().catch(()=>{});
      else if (wrap.requestFullscreen) wrap.requestFullscreen().catch(()=>{});
    });
    if (progressWrap) {
      progressWrap.addEventListener('click', async (e)=>{
        const r = progressWrap.getBoundingClientRect();
        const x = Math.min(1, Math.max(0, (e.clientX - r.left) / Math.max(1, r.width)));
        const d = duration || await player.getDuration().catch(()=>0);
        if (d > 0) player.setCurrentTime(d * x).catch(()=>{});
      });
    }
  }

  const script = document.createElement('script');
  script.src = 'https://player.vimeo.com/api/player.js';
  script.onload = () => {
    setupPlayer('');
    document.querySelectorAll('iframe[id^="pp-vimeo-"]').forEach((el)=>{
      setupPlayer(el.id.replace('pp-vimeo-',''));
    });
  };
  document.head.appendChild(script);
})();
