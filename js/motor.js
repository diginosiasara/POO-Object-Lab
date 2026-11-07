/* Motor del navegador: réplica en JavaScript de la lógica Java de cada ejercicio y de las aplicaciones de muestra.
   Permite usar el portafolio con tus propios datos sin servidor (versión estática, alojamiento web normal).
   Los datos (huellas del clasificador, plantillas HTML, SQL) se generan desde el código Java: ver herramientas/generar_motor_datos.py.
   Su fidelidad con Java se comprueba automáticamente: herramientas/paridad.js compara ambos resultados caso por caso. */
(function (global) {
  'use strict';
  var D = global.MotorDatos || {};
  var E = {};            // ejercicios: id → función(p, ctx) que devuelve {consola, secciones}
  var APPS = {};         // aplicaciones: id → constructor

  /* ===================== utilidades (equivalentes Java) ===================== */
  function esc(v) {
    return v == null ? '' : String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  /** Double.toString de Java */
  function jd(x) {
    if (isNaN(x)) return 'NaN';
    if (!isFinite(x)) return x > 0 ? 'Infinity' : '-Infinity';
    if (x === 0) return 1 / x < 0 ? '-0.0' : '0.0';
    var a = Math.abs(x);
    if (a >= 1e-3 && a < 1e7) { var s = String(x); return s.indexOf('.') < 0 ? s + '.0' : s; }
    var m = x.toExponential().split('e'), mant = m[0];
    if (mant.indexOf('.') < 0) mant += '.0';
    return mant + 'E' + parseInt(m[1], 10);
  }
  function txt(p, k) { return String(p[k] == null ? '' : p[k]).trim(); }
  function ent(p, k, def) { var s = txt(p, k); return /^[+-]?\d+$/.test(s) ? parseInt(s, 10) : def; }
  function dec(p, k, def) {
    var s = txt(p, k).replace(/,/g, '.');
    return /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(s) ? parseFloat(s) : def;
  }
  function cmp(a, b) { return a < b ? -1 : a > b ? 1 : 0; }
  function f2(x) { return x.toFixed(2); }
  function clonar(o) { return JSON.parse(JSON.stringify(o)); }
  function lista(a) { return '[' + a.join(', ') + ']'; }

  /* ===================== SHA-256 (sin depender de crypto.subtle) ===================== */
  var K = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
  function sha256(texto) {
    var bytes = unescape(encodeURIComponent(texto)).split('').map(function (c) { return c.charCodeAt(0); });
    var l = bytes.length * 8;
    bytes.push(0x80);
    while (bytes.length % 64 !== 56) bytes.push(0);
    for (var i = 7; i >= 0; i--) bytes.push(i >= 4 ? 0 : (l >>> (i * 8)) & 255);
    var H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    function rr(x, n) { return (x >>> n) | (x << (32 - n)); }
    for (var o = 0; o < bytes.length; o += 64) {
      var w = [];
      for (var t = 0; t < 16; t++) w[t] = (bytes[o + 4 * t] << 24) | (bytes[o + 4 * t + 1] << 16) | (bytes[o + 4 * t + 2] << 8) | bytes[o + 4 * t + 3];
      for (t = 16; t < 64; t++) {
        var s0 = rr(w[t - 15], 7) ^ rr(w[t - 15], 18) ^ (w[t - 15] >>> 3), s1 = rr(w[t - 2], 17) ^ rr(w[t - 2], 19) ^ (w[t - 2] >>> 10);
        w[t] = (w[t - 16] + s0 + w[t - 7] + s1) | 0;
      }
      var a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
      for (t = 0; t < 64; t++) {
        var S1 = rr(e, 6) ^ rr(e, 11) ^ rr(e, 25), ch = (e & f) ^ (~e & g), t1 = (h + S1 + ch + K[t] + w[t]) | 0;
        var S0 = rr(a, 2) ^ rr(a, 13) ^ rr(a, 22), mj = (a & b) ^ (a & c) ^ (b & c), t2 = (S0 + mj) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      H = [(H[0] + a) | 0, (H[1] + b) | 0, (H[2] + c) | 0, (H[3] + d) | 0, (H[4] + e) | 0, (H[5] + f) | 0, (H[6] + g) | 0, (H[7] + h) | 0];
    }
    return H.map(function (x) { return ('00000000' + (x >>> 0).toString(16)).slice(-8); }).join('');
  }

  /* ===================== constructor de resultados (como portafolio.nucleo.Resultado) ===================== */
  function res(consola) {
    var o = { consola: consola || '', secciones: [] }, api = { o: o };
    function add(s) { o.secciones.push(s); return api; }
    api.tabla = function (titulo, columnas, filas) { return add({ tipo: 'tabla', titulo: titulo, columnas: columnas, filas: filas }); };
    api.objetos = function (titulo, items) { return add({ tipo: 'objetos', titulo: titulo, items: items }); };
    api.pasos = function (titulo, items) { return add({ tipo: 'pasos', titulo: titulo, items: items }); };
    api.kv = function (titulo, pares) { return add({ tipo: 'kv', titulo: titulo, pares: pares }); };
    api.veredicto = function (ok, texto) { return add({ tipo: 'veredicto', titulo: '', ok: ok, texto: texto }); };
    api.escala = function (titulo, valor, min, max, zonas) { return add({ tipo: 'escala', titulo: titulo, valor: valor, min: min, max: max, zonas: zonas }); };
    api.capas = function (titulo, items) { return add({ tipo: 'capas', titulo: titulo, items: items }); };
    api.pagina = function (titulo, html) { return add({ tipo: 'pagina', titulo: titulo, html: html }); };
    api.consulta = function (titulo, sql, columnas, filas, nota) { return add({ tipo: 'consulta', titulo: titulo, sql: sql, columnas: columnas, filas: filas, nota: nota }); };
    return api;
  }
  function paso(titulo, detalle, estado) { return { titulo: titulo, detalle: detalle, estado: estado }; }
  function tarjeta(titulo, campos) { return { titulo: titulo, campos: campos }; }
  function cp(capa, componente, detalle) { return { capa: capa, componente: componente, detalle: detalle }; }
  var PRES = 'PRESENTACION', NEG = 'NEGOCIO', DAT = 'DATOS';
  /** Sección de la ejecución por defecto (la que no depende de los datos del visitante) */
  function base(ctx, titulo) {
    var s = (ctx.base.secciones || []).filter(function (x) { return x.titulo === titulo; })[0];
    return s ? clonar(s) : null;
  }

  /* ===================== mini-motor JSP (mismo comportamiento que portafolio.apps.Jsp) ===================== */
  var ETIQ = /<c:if\s+test="([^"]*)"\s*>|<\/c:if>|<c:forEach\s+var="([^"]*)"\s+items="([^"]*)"\s*>|<\/c:forEach>|<%=([\s\S]*?)%>|\$\{([^}]*)\}/g;
  function quitarLlaves(e) { var t = e.trim(); return t.indexOf('${') === 0 && t.slice(-1) === '}' ? t.slice(2, -1).trim() : t; }
  function vacio(v) { return v == null || v === '' || (Array.isArray(v) && v.length === 0); }
  function propiedad(o, nombre) {
    var llamada = /\(\)$/.test(nombre), n = llamada ? nombre.slice(0, -2) : nombre;
    if (!n) return null;
    if (Array.isArray(o)) { if (n === 'size') return o.length; if (n === 'isEmpty' || n === 'empty') return o.length === 0; }
    var v = o[n];
    if (v === undefined && /^(get|is)[A-Z]/.test(n)) { var m = n.replace(/^(get|is)/, ''); v = o[m.charAt(0).toLowerCase() + m.slice(1)]; }
    if (v === undefined && !llamada) v = o['get' + n.charAt(0).toUpperCase() + n.slice(1)];
    return v === undefined ? null : v;
  }
  function evaluar(expresion, ambito) {
    var e = quitarLlaves(expresion);
    if (e === 'new java.util.Date()' || e === 'new java.util.Date().toString()') return new Date().toString();
    if (e === 'pageContext.request.contextPath' || e === 'request.getContextPath()') return '.';
    if (e.length >= 2 && ((e.charAt(0) === "'" && e.slice(-1) === "'") || (e.charAt(0) === '"' && e.slice(-1) === '"'))) return e.slice(1, -1);
    var partes = e.split('.'), actual = ambito[partes[0].trim()];
    if (actual === undefined) actual = null;
    for (var i = 1; i < partes.length && actual != null; i++) actual = propiedad(actual, partes[i].trim());
    return actual;
  }
  function cumple(test, ambito) {
    return quitarLlaves(test).split('&&').every(function (t) {
      t = t.trim();
      if (t.indexOf('not empty ') === 0) return !vacio(evaluar(t.slice(10), ambito));
      if (t.indexOf('empty ') === 0) return vacio(evaluar(t.slice(6), ambito));
      var v = evaluar(t, ambito);
      return typeof v === 'boolean' ? v : v != null;
    });
  }
  function pintar(nodos, ambito) {
    var out = '';
    nodos.forEach(function (n) {
      if (n.t === 'texto') out += n.v;
      else if (n.t === 'expr') out += esc(evaluar(n.v, ambito));
      else if (n.t === 'si') { if (cumple(n.v, ambito)) out += pintar(n.h, ambito); }
      else {
        var col = evaluar(n.items, ambito);
        if (Array.isArray(col)) col.forEach(function (el) { var a = Object.create(ambito); a[n.v] = el; out += pintar(n.h, a); });
      }
    });
    return out;
  }
  function jsp(fuente, atributos) {
    var s = fuente.replace(/<%--[\s\S]*?--%>/g, '').replace(/<%@[\s\S]*?%>/g, '').replace(/<%(?![=@\-])[\s\S]*?%>/g, '');
    var pila = [{ t: 'raiz', h: [] }], pos = 0, m;
    ETIQ.lastIndex = 0;
    while ((m = ETIQ.exec(s))) {
      if (m.index > pos) pila[pila.length - 1].h.push({ t: 'texto', v: s.slice(pos, m.index) });
      pos = ETIQ.lastIndex;
      var tag = m[0];
      if (tag.indexOf('<c:if') === 0) pila.push({ t: 'si', v: m[1], h: [] });
      else if (tag.indexOf('<c:forEach') === 0) pila.push({ t: 'para', v: m[2], items: m[3], h: [] });
      else if (tag === '</c:if>' || tag === '</c:forEach>') { var f = pila.pop(); pila[pila.length - 1].h.push(f); }
      else pila[pila.length - 1].h.push({ t: 'expr', v: m[4] != null ? m[4] : m[5] });
    }
    if (pos < s.length) pila[pila.length - 1].h.push({ t: 'texto', v: s.slice(pos) });
    return pintar(pila[0].h, atributos || {});
  }

  global.__MotorInterno = { E: E, APPS: APPS, esc: esc, jd: jd, txt: txt, ent: ent, dec: dec, cmp: cmp, f2: f2, clonar: clonar, lista: lista, sha256: sha256,
    res: res, paso: paso, tarjeta: tarjeta, cp: cp, PRES: PRES, NEG: NEG, DAT: DAT, base: base, jsp: jsp, D: D };
})(typeof window !== 'undefined' ? window : globalThis);
