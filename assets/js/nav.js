/* =========================================================
   Parker Schmidt — Nav Injector
   Drop a <div id="nav-mount"></div> in any page, then include
   this script. The nav writes itself in. Active-state styling
   is driven by the body class (page-home / page-works /
   page-bio / page-project), which you set per page.
   ========================================================= */
(function () {
  // If the page is inside /projects/, links need to go up one level.
  // Detect by looking at the script's own path — or just by URL.
  var inProjects = location.pathname.indexOf('/projects/') !== -1;
  var prefix = inProjects ? '../' : '';

  var html =
    '<div id="nav">' +
      '<div class="nav-l">' +
        '<a id="nav-name" href="' + prefix + 'index.html">PARKER SCHMIDT' +
          '<span class="bracket br-tl"></span>' +
          '<span class="bracket br-tr"></span>' +
          '<span class="bracket br-bl"></span>' +
          '<span class="bracket br-br"></span>' +
        '</a>' +
        '<a id="nav-sub"  href="' + prefix + 'index.html">DIRECTOR' +
          '<span class="bracket br-tl"></span>' +
          '<span class="bracket br-tr"></span>' +
          '<span class="bracket br-bl"></span>' +
          '<span class="bracket br-br"></span>' +
        '</a>' +
      '</div>' +
      '<div class="nav-r">' +
        '<a id="nav-works" href="' + prefix + 'index.html">SELECTED WORKS' +
          '<span class="bracket br-tl"></span>' +
          '<span class="bracket br-tr"></span>' +
          '<span class="bracket br-bl"></span>' +
          '<span class="bracket br-br"></span>' +
        '</a>' +
        '<a id="nav-index" href="' + prefix + 'works.html">WORK' +
          '<span class="bracket br-tl"></span>' +
          '<span class="bracket br-tr"></span>' +
          '<span class="bracket br-bl"></span>' +
          '<span class="bracket br-br"></span>' +
        '</a>' +
        '<a id="nav-bio"   href="' + prefix + 'bio.html">BIO' +
          '<span class="bracket br-tl"></span>' +
          '<span class="bracket br-tr"></span>' +
          '<span class="bracket br-bl"></span>' +
          '<span class="bracket br-br"></span>' +
        '</a>' +
      '</div>' +
    '</div>';

  var mount = document.getElementById('nav-mount');
  if (mount) {
    mount.outerHTML = html;
  } else {
    // Fallback: prepend to body so it still works without a mount div
    document.body.insertAdjacentHTML('afterbegin', html);
  }
})();
