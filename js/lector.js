/* Lector en voz alta: lee la vista actual con la síntesis de voz del navegador (Web Speech API).
   No sustituye a un lector de pantallas (NVDA, JAWS, VoiceOver, TalkBack), con los que la web es compatible:
   usa regiones, encabezados, etiquetas ARIA y anuncia los cambios de vista y de resultado. */
(function () {
  'use strict';
  var btn = document.getElementById('escuchar');
  var ss = window.speechSynthesis, U = window.SpeechSynthesisUtterance;
  if (!btn) return;
  if (!ss || !U) { btn.hidden = true; return; }

  var principal = document.getElementById('principal');
  var voz = null, cola = [], pos = 0, leyendo = false, pausado = false, ticket = 0, velocidad = 1;
  try { var g = parseFloat(localStorage.getItem('lectorVelocidad')); if (g >= 0.5 && g <= 2) velocidad = g; } catch (e) { /* sin almacenamiento */ }
  var barra = null, estado = null, bPausa = null, selVel = null;

  function anunciar(t) { if (window.PortafolioA11y) window.PortafolioA11y.anunciar(t); }
  function elegirVoz() {
    var vs = ss.getVoices ? ss.getVoices() : [];
    voz = vs.filter(function (v) { return /^es[-_]ES/i.test(v.lang); })[0] || vs.filter(function (v) { return /^es/i.test(v.lang); })[0] || null;
  }
  elegirVoz();
  if ('onvoiceschanged' in ss) ss.onvoiceschanged = elegirVoz;

  /* ---------- qué se lee ---------- */
  var EXCLUIR = 'pre, svg, iframe, .visor, .consola, [aria-hidden="true"], [hidden], script, style, .solo-lector';
  function limpia(t) { return (t || '').replace(/\s+/g, ' ').trim(); }
  function textoPagina() {
    var partes = [];
    Array.prototype.forEach.call(principal.querySelectorAll('h1,h2,h3,h4,p,li,tr,dl,summary,.veredicto,figcaption'), function (el) {
      if (el.closest(EXCLUIR)) return;
      var t = '';
      if (el.matches('dl')) {
        Array.prototype.forEach.call(el.querySelectorAll('dt'), function (dt) {
          var dd = dt.nextElementSibling;
          t += limpia(dt.textContent) + ': ' + limpia(dd ? dd.textContent : '') + '. ';
        });
      } else if (el.matches('tr')) {
        t = Array.prototype.map.call(el.children, function (c) { return limpia(c.textContent); }).filter(Boolean).join(', ');
      } else if (el.matches('li') && el.querySelector('.t')) {
        t = limpia(el.querySelector('.t').textContent) + '. ' + limpia((el.querySelector('.d') || {}).textContent);
      } else if (el.matches('.veredicto')) {
        t = limpia(el.lastElementChild ? el.lastElementChild.textContent : el.textContent);
      } else if (el.matches('li') && el.closest('dl, .pasos')) {
        return;
      } else {
        t = limpia(el.textContent);
      }
      if (t) partes.push(t);
    });
    return partes;
  }
  function trozos(textos) {
    var out = [];
    textos.forEach(function (t) {
      t = limpia(t);
      if (!t) return;
      if (!/[.!?…:;]$/.test(t)) t += '.';
      var frases = t.match(/[^.!?…]+[.!?…]*\s*/g) || [t], cur = '';
      frases.forEach(function (f) {
        f = limpia(f);
        if (cur && (cur + ' ' + f).length > 200) { out.push(cur); cur = f; } else cur = cur ? cur + ' ' + f : f;
      });
      if (cur) out.push(cur);
    });
    var fin = [];
    out.forEach(function (c) {
      while (c.length > 240) { var k = c.lastIndexOf(' ', 220); if (k < 80) k = 220; fin.push(c.slice(0, k)); c = c.slice(k).trim(); }
      if (c) fin.push(c);
    });
    return fin;
  }

  /* ---------- reproducción ---------- */
  function hablar() {
    if (pos >= cola.length) { detener(true); anunciar('Lectura terminada.'); return; }
    var mio = ticket, u = new U(cola[pos]);
    u.lang = (voz && voz.lang) || 'es-ES';
    if (voz) u.voice = voz;
    u.rate = velocidad;
    u.onend = function () { if (mio !== ticket) return; pos++; hablar(); };
    u.onerror = function (e) { if (mio !== ticket || e.error === 'canceled' || e.error === 'interrupted') return; pos++; hablar(); };
    ss.speak(u);
  }
  function iniciar() {
    detener(true);
    cola = trozos(textoPagina()); pos = 0;
    if (!cola.length) { anunciar('No hay texto que leer en esta vista.'); return; }
    leyendo = true; pausado = false; ticket++;
    btn.setAttribute('aria-pressed', 'true');
    btn.setAttribute('aria-label', 'Detener la lectura en voz alta');
    mostrarBarra('Leyendo la página…');
    hablar();
  }
  function detener(silencio) {
    ticket++;
    try { ss.cancel(); } catch (e) { /* nada */ }
    var estaba = leyendo;
    leyendo = false; pausado = false;
    btn.setAttribute('aria-pressed', 'false');
    btn.setAttribute('aria-label', 'Escuchar esta página en voz alta');
    if (barra) barra.hidden = true;
    if (!silencio && estaba) anunciar('Lectura detenida.');
  }
  function pausar() {
    if (!leyendo) return;
    if (pausado) { ss.resume(); pausado = false; bPausa.textContent = 'Pausar'; estado.textContent = 'Leyendo la página…'; }
    else { ss.pause(); pausado = true; bPausa.textContent = 'Reanudar'; estado.textContent = 'Lectura en pausa'; }
  }

  /* ---------- barra de control ---------- */
  function boton(texto, fn) { var b = document.createElement('button'); b.type = 'button'; b.textContent = texto; b.addEventListener('click', fn); return b; }
  function mostrarBarra(txt) {
    if (!barra) {
      barra = document.createElement('div');
      barra.className = 'lector'; barra.setAttribute('role', 'region'); barra.setAttribute('aria-label', 'Lectura en voz alta');
      estado = document.createElement('span'); estado.className = 'lector-estado';
      bPausa = boton('Pausar', pausar);
      var bParar = boton('Detener', function () { detener(false); btn.focus(); });
      var et = document.createElement('label'); et.textContent = 'Velocidad ';
      selVel = document.createElement('select');
      [['0.75', 'Lenta'], ['1', 'Normal'], ['1.25', 'Rápida'], ['1.5', 'Muy rápida']].forEach(function (o) {
        var op = document.createElement('option'); op.value = o[0]; op.textContent = o[1]; selVel.append(op);
      });
      selVel.value = String(velocidad);
      if (selVel.value !== String(velocidad)) selVel.value = '1';
      selVel.addEventListener('change', function () {
        velocidad = parseFloat(selVel.value);
        try { localStorage.setItem('lectorVelocidad', String(velocidad)); } catch (e) { /* nada */ }
        if (leyendo && !pausado) { ticket++; ss.cancel(); hablar(); }
      });
      et.append(selVel);
      barra.append(estado, bPausa, bParar, et);
      document.body.append(barra);
    }
    estado.textContent = txt; bPausa.textContent = 'Pausar'; barra.hidden = false;
  }

  btn.addEventListener('click', function () { if (leyendo) detener(false); else iniciar(); });
  window.addEventListener('hashchange', function () { if (leyendo) detener(true); });
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && leyendo) detener(false); });
  window.addEventListener('pagehide', function () { try { ss.cancel(); } catch (e) { /* nada */ } });
})();
