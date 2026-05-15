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

    // Shared fullscreen toggle. On desktop we fullscreen the .pp-hero
    // wrapper so our custom controls go fullscreen too. On iOS Safari
    // the wrapper approach doesn't work (only the underlying <video>
    // element can go fullscreen), so we fall back to the Vimeo SDK's
    // requestFullscreen which knows how to call webkitEnterFullscreen
    // on the video itself — iOS then shows its native player controls.
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    function toggleFullscreen() {
      const wrap = iframe.closest('.pp-hero') || iframe.parentElement;
      // Exit fullscreen if currently fullscreen.
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(()=>{});
        return;
      }
      // iOS: defer to Vimeo SDK so the native video player handles it.
      if (isIOS && player.requestFullscreen) {
        player.requestFullscreen().catch(()=>{});
        return;
      }
      // Desktop: fullscreen the wrapper so custom controls come along.
      if (wrap && wrap.requestFullscreen) {
        wrap.requestFullscreen().catch(()=>{
          // Last-resort fallback: ask Vimeo SDK.
          if (player.requestFullscreen) player.requestFullscreen().catch(()=>{});
        });
      }
    }

    // ----- Click-anywhere-to-play/pause + double-click fullscreen -----
    // Vimeo's iframe captures clicks on the video itself, so we layer
    // a transparent catcher above the iframe but below the controls.
    // Single click = play/pause, double click = fullscreen. We delay
    // acting on a single click by 250ms so a second click can promote
    // it to a double — and cancel the pending play/pause if it does.
    const hero = iframe.closest('.pp-hero');
    if (hero) {
      const catcher = document.createElement('div');
      catcher.style.position = 'absolute';
      catcher.style.inset = '0';
      catcher.style.cursor = 'pointer';
      catcher.style.zIndex = '2';
      catcher.style.background = 'transparent';
      const controls = hero.querySelector('.pp-controls');
      if (controls) {
        controls.style.position = 'absolute';
        controls.style.zIndex = '3';
      }
      let singleClickTimer = null;
      catcher.addEventListener('click', ()=>{
        if (singleClickTimer) return; // a second click is incoming — let dblclick handle it
        singleClickTimer = setTimeout(()=>{
          singleClickTimer = null;
          (playing ? player.pause() : player.play()).catch(()=>{});
        }, 250);
      });
      catcher.addEventListener('dblclick', ()=>{
        if (singleClickTimer) { clearTimeout(singleClickTimer); singleClickTimer = null; }
        toggleFullscreen();
      });
      hero.appendChild(catcher);

      // ----- Replay overlay on video end -----
      // Centered icon that appears when the video finishes. Clicking
      // it (or anywhere on the video) restarts from the beginning.
      // Hidden once playback resumes.
      const replay = document.createElement('div');
      replay.style.position = 'absolute';
      replay.style.top = '50%';
      replay.style.left = '50%';
      replay.style.transform = 'translate(-50%, -50%)';
      replay.style.width = '64px';
      replay.style.height = '64px';
      replay.style.borderRadius = '50%';
      replay.style.background = 'rgba(0,0,0,0.55)';
      replay.style.display = 'none';
      replay.style.alignItems = 'center';
      replay.style.justifyContent = 'center';
      replay.style.cursor = 'pointer';
      replay.style.zIndex = '4'; // above controls
      replay.style.pointerEvents = 'auto';
      // Replay icon: circular arrow.
      replay.innerHTML = '<svg width="28" height="28" viewBox="0 0 28 28" fill="none">' +
        '<path d="M14 6 V2 L8 7 L14 12 V8 a6 6 0 1 1 -6 6" ' +
        'stroke="rgba(255,255,255,0.9)" stroke-width="1.6" fill="none" stroke-linejoin="round" stroke-linecap="round"/>' +
        '</svg>';
      replay.addEventListener('click', (e)=>{
        e.stopPropagation();
        player.setCurrentTime(0).then(()=>player.play()).catch(()=>{});
      });
      hero.appendChild(replay);
      player.on('ended', ()=>{ replay.style.display = 'flex'; });
      player.on('play',  ()=>{ replay.style.display = 'none'; });
    }

    if (muteBtn) muteBtn.addEventListener('click', ()=>{
      muted = !muted;
      player.setMuted(muted).catch(()=>{});
      if (muteLine) muteLine.style.display = muted ? '' : 'none';
      if (volArc) volArc.style.display = muted ? 'none' : '';
    });
    if (fsBtn) fsBtn.addEventListener('click', toggleFullscreen);
    if (progressWrap) {
      progressWrap.addEventListener('click', async (e)=>{
        const r = progressWrap.getBoundingClientRect();
        const x = Math.min(1, Math.max(0, (e.clientX - r.left) / Math.max(1, r.width)));
        const d = duration || await player.getDuration().catch(()=>0);
        if (d > 0) player.setCurrentTime(d * x).catch(()=>{});
      });
    }

    // Register this player as the keyboard focus target whenever the
    // user interacts with it (catcher click, control button click) or
    // it starts playing. Keyboard shortcuts only act on the most
    // recently focused player so multi-video pages don't all toggle
    // together.
    function takeKeyboardFocus() { window.__ppActivePlayer = playerHandle; }
    const playerHandle = {
      player: player,
      isPlaying: () => playing,
      getDuration: () => duration,
      toggleFullscreen: toggleFullscreen,
      toggleMute: () => {
        muted = !muted;
        player.setMuted(muted).catch(()=>{});
        if (muteLine) muteLine.style.display = muted ? '' : 'none';
        if (volArc) volArc.style.display = muted ? 'none' : '';
      }
    };
    if (hero) hero.addEventListener('mousedown', takeKeyboardFocus);
    player.on('play', takeKeyboardFocus);
    // Default to the first player set up, so keyboard works on page
    // load without requiring a click first.
    if (!window.__ppActivePlayer) window.__ppActivePlayer = playerHandle;
  }

  // ----- Global keyboard shortcuts -----
  // Space: play/pause. Left/Right: seek -/+ 5s. Up/Down: volume +/- 10%.
  // F: fullscreen. M: mute.
  // Only fires when the active player is set and the user isn't typing
  // in an input/textarea/contenteditable.
  document.addEventListener('keydown', (e)=>{
    const active = window.__ppActivePlayer;
    if (!active) return;
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;

    const p = active.player;
    if (e.key === ' ' || e.code === 'Space') {
      e.preventDefault();
      (active.isPlaying() ? p.pause() : p.play()).catch(()=>{});
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      p.getCurrentTime().then((s)=>p.setCurrentTime(Math.max(0, s - 5))).catch(()=>{});
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      p.getCurrentTime().then((s)=>{
        const d = active.getDuration();
        p.setCurrentTime(d ? Math.min(d, s + 5) : s + 5);
      }).catch(()=>{});
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      p.getVolume().then((v)=>p.setVolume(Math.min(1, v + 0.1))).catch(()=>{});
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      p.getVolume().then((v)=>p.setVolume(Math.max(0, v - 0.1))).catch(()=>{});
    } else if (e.key === 'f' || e.key === 'F') {
      e.preventDefault();
      active.toggleFullscreen();
    } else if (e.key === 'm' || e.key === 'M') {
      e.preventDefault();
      active.toggleMute();
    }
  });

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
