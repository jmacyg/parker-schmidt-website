/* =========================================================
   Parker Schmidt — Artefact Pointclouds (works page grid)

   For each canvas listed below, fetches its positions (Float32)
   and colors (Uint8) from /assets/data/ and renders a small,
   slowly rotating + breathing pointcloud inside its grid tile.

   Pulled out of the old monolithic works.js so the data is
   cached separately and the page parses fast.

   Requires THREE.js to be loaded first.
   ========================================================= */
(function () {
  if (typeof THREE === 'undefined') {
    console.warn('[artefacts] THREE.js not loaded — skipping artefact pointclouds');
    return;
  }

  // Path prefix — works from root OR from /projects/ subfolder.
  var inProjects = location.pathname.indexOf('/projects/') !== -1;
  var DATA_BASE = (inProjects ? '../' : '') + 'assets/data/';

  // canvas id  →  data slug (filename stem in assets/data/)
  // Optional `tilt`: { x, y, z } in radians applied to the cloud once
  // at load (before the spin loop), used to fix scans that came in
  // lying on the wrong axis. The knife scan was captured flat (blade
  // along X), so spinning it on Y just shows a sliver — we rotate it
  // 90° on Z to stand it upright like the angel/wolf clouds.
  var ARTEFACTS = [
    { canvasId: 'angel-canvas', slug: 'angel'       },
    { canvasId: 'knife-canvas', slug: 'knife', tilt: { x: Math.PI / 6 } },
    { canvasId: 'sun-canvas',   slug: 'sun'         },
    { canvasId: 'wolf-canvas',  slug: 'wolf'        },
    { canvasId: 'artefact-14',  slug: 'artefact-14' },
    { canvasId: 'artefact-15',  slug: 'artefact-15' },
    { canvasId: 'artefact-19',  slug: 'artefact-19' },
    { canvasId: 'artefact-22',  slug: 'artefact-22' },
    { canvasId: 'artefact-25',  slug: 'artefact-25' },
    { canvasId: 'artefact-28',  slug: 'artefact-28' },
    { canvasId: 'artefact-30',  slug: 'artefact-30' }
  ];

  // ----- Helpers -----
  function b64ToTyped(b64, TypedArray) {
    var binary = atob(b64.trim());
    var buf = new ArrayBuffer(binary.length);
    var u8 = new Uint8Array(buf);
    for (var i = 0; i < binary.length; i++) u8[i] = binary.charCodeAt(i);
    return new TypedArray(buf);
  }

  function fetchText(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error('Failed to fetch ' + url + ' (' + r.status + ')');
      return r.text();
    });
  }

  // ----- Per-artefact renderer -----
  function buildArtefact(canvas, posArr, colBytes, tilt) {
    var n = posArr.length / 3;

    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    var scene  = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(55, 1, 0.001, 50);

    // Convert colors from Uint8 [0..255] to Float32 [0..1]
    var colors = new Float32Array(n * 3);
    for (var i = 0; i < n * 3; i++) colors[i] = colBytes[i] / 255;

    var geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
    geom.setAttribute('color',    new THREE.BufferAttribute(colors, 3));
    geom.computeBoundingSphere();
    var bs = geom.boundingSphere;

    var mat = new THREE.PointsMaterial({
      vertexColors: true,
      size: 0.010,
      sizeAttenuation: true
    });

    var cloud = new THREE.Points(geom, mat);
    cloud.position.set(-bs.center.x, -bs.center.y, -bs.center.z);

    // Parent group carries the static tilt (if any), so the per-frame
    // cloud.rotation.y spin doesn't wipe it. If no tilt is provided we
    // still use the group for free, costs nothing.
    var group = new THREE.Group();
    if (tilt) {
      group.rotation.x = tilt.x || 0;
      group.rotation.y = tilt.y || 0;
      group.rotation.z = tilt.z || 0;
    }
    group.add(cloud);
    scene.add(group);

    // Fit camera distance to bounding sphere given the tile's aspect ratio.
    function calcCamZ(w, h) {
      var fovRad = 55 * Math.PI / 180;
      var aspect = w / h;
      var hFov   = 2 * Math.atan(Math.tan(fovRad / 2) * aspect);
      return bs.radius / (Math.tan(Math.min(fovRad, hFov) / 2) * 0.92);
    }

    function resize() {
      var rect = canvas.parentElement.getBoundingClientRect();
      var w = Math.round(rect.width);
      var h = Math.round(rect.height);
      if (w < 2 || h < 2) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.position.set(0, 0, calcCamZ(w, h));
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
    }
    resize();

    // Random phase so the tiles don't all bob in sync.
    var t = Math.random() * Math.PI * 2;
    (function loop() {
      requestAnimationFrame(loop);
      t += 0.007;
      cloud.rotation.y = t * 0.22;
      cloud.position.y = -bs.center.y + Math.sin(t * 0.65) * 0.015;
      renderer.render(scene, camera);
    })();

    if (window.ResizeObserver) {
      new ResizeObserver(resize).observe(canvas.parentElement);
    }
    window.addEventListener('resize', resize);
  }

  // ----- Boot every artefact whose canvas exists on this page -----
  ARTEFACTS.forEach(function (a) {
    var canvas = document.getElementById(a.canvasId);
    if (!canvas) return;   // canvas isn't on this page — skip silently

    Promise.all([
      fetchText(DATA_BASE + a.slug + '.pos.b64'),
      fetchText(DATA_BASE + a.slug + '.col.b64')
    ]).then(function (results) {
      var posArr   = b64ToTyped(results[0], Float32Array);
      var colBytes = b64ToTyped(results[1], Uint8Array);
      buildArtefact(canvas, posArr, colBytes, a.tilt);
    }).catch(function (err) {
      console.error('[artefacts] failed to load ' + a.slug + ':', err);
    });
  });
})();
