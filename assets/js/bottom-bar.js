/* =========================================================
   Parker Schmidt — Bottom Bar Injector
   Drop a <div id="bottom-bar-mount"></div> in any page, then
   include this script. It writes the bottom bar and ticks
   the Idaho time once per second.
   ========================================================= */
(function () {
  var html =
    '<div id="bottom-bar">' +
      '<div class="bb-l">Scroll to navigate</div>' +
      '<div class="bb-c">' +
        '<span class="bb-c-desktop">' +
          '<a href="legal.html">Legal Information</a> — ' +
          '<a href="https://canis44.com" target="_blank" rel="noopener">Website by CANIS44.com</a>' +
        '</span>' +
        '<a class="bb-c-mobile" href="https://canis44.com" target="_blank" rel="noopener">Website by CANIS44.com</a>' +
      '</div>' +
      '<div class="bb-r">' +
        '<span class="bb-r-desktop">&copy; 2026</span>' +
        '<a class="bb-r-mobile" href="legal.html">Legal Information</a>' +
      '</div>' +
    '</div>';

  var mount = document.getElementById('bottom-bar-mount');
  if (mount) {
    mount.outerHTML = html;
  } else {
    document.body.insertAdjacentHTML('beforeend', html);
  }

})();
