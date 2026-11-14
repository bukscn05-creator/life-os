(function(){
  try {
    var m = localStorage.getItem('lifeos_theme_mode') || 'auto';
    var a = localStorage.getItem('lifeos_theme_accent') || 'teal';
    var root = document.documentElement;
    if (m === 'light' || m === 'dark' || m === 'oled') root.setAttribute('data-mode', m);
    else root.removeAttribute('data-mode');
    root.setAttribute('data-accent', a);
  } catch(_e){}
})();
