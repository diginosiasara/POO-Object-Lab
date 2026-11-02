/* Dibuja un diagrama de clases UML en SVG a partir del JSON que genera portafolio.nucleo.Uml (reflexión de Java). */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var contador = 0;

  function el(nombre, attrs, texto) {
    var e = document.createElementNS(NS, nombre);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (texto != null) e.textContent = texto;
    return e;
  }
  function recorta(s, max) { return s.length > max ? s.slice(0, max - 1) + '…' : s; }

  function dibujar(datos, op) {
    op = op || {};
    var CW = 7.2, LH = 16, PAD = 10, MAXC = 46, MAXM = 9, GX = 44, GY = 70, M = 18;
    var uid = 'u' + (++contador);

    var nodos = datos.clases.map(function (c, i) {
      var estereo = c.tipo === 'interfaz' ? '«interfaz»' : c.tipo === 'abstracta' ? '«abstracta»' : c.tipo === 'enum' ? '«enum»' : '';
      var attrs = op.sinMiembros ? [] : c.atributos.map(function (s) { return recorta(s, MAXC); });
      var mets = op.sinMiembros ? [] : c.metodos.slice(0, MAXM).map(function (s) { return recorta(s, MAXC); });
      if (!op.sinMiembros && c.metodos.length > MAXM) mets.push('… +' + (c.metodos.length - MAXM) + ' más');
      var linea = Math.max.apply(null, attrs.concat(mets).map(function (s) { return s.length; }).concat([0]));
      var w = Math.ceil(Math.max(c.titulo.length * 8.4, estereo.length * 6.4, linea * CW) + PAD * 2);
      var cabH = estereo ? 40 : 28;
      var h = cabH + (attrs.length ? attrs.length * LH + 8 : 6) + (mets.length ? mets.length * LH + 8 : 0);
      return { id: c.id, c: c, estereo: estereo, attrs: attrs, mets: mets, w: Math.max(w, 90), h: h, cabH: cabH, x: 0, y: 0, i: i };
    });
    var por = {};
    nodos.forEach(function (n) { por[n.id] = n; });
    var rels = datos.relaciones.filter(function (r) { return por[r.de] && por[r.a]; });

    // Capas: lo general arriba, lo derivado abajo
    var jerarquicas = rels.filter(function (r) { return r.tipo !== 'asociacion'; });
    var conJerarquia = {};
    jerarquicas.forEach(function (r) { conJerarquia[r.de] = conJerarquia[r.a] = true; });
    // Una clase que solo se asocia con otra ya situada va a su misma altura (la línea no cruza otras cajas)
    var hermanas = rels.filter(function (r) {
      return r.tipo === 'asociacion' && ((!conJerarquia[r.de] && conJerarquia[r.a]) || (!conJerarquia[r.a] && conJerarquia[r.de]));
    });
    var enHermana = {};
    hermanas.forEach(function (r) { enHermana[conJerarquia[r.de] ? r.a : r.de] = conJerarquia[r.de] ? r.de : r.a; });
    var dir = rels.filter(function (r) { return hermanas.indexOf(r) < 0; }).map(function (r) {
      return (r.tipo === 'herencia' || r.tipo === 'realizacion' || r.tipo === 'claseAsociacion') ? [r.a, r.de] : [r.de, r.a];
    });
    var capa = {};
    nodos.forEach(function (n) { capa[n.id] = 0; });
    for (var it = 0; it < nodos.length; it++) {
      var cambio = false;
      dir.forEach(function (e) {
        if (capa[e[1]] < capa[e[0]] + 1 && capa[e[0]] + 1 < nodos.length) { capa[e[1]] = capa[e[0]] + 1; cambio = true; }
      });
      if (!cambio) break;
    }
    Object.keys(enHermana).forEach(function (k) { capa[k] = capa[enHermana[k]]; });
    var maxCapa = Math.max.apply(null, Object.keys(capa).map(function (k) { return capa[k]; }));
    var capas = [];
    for (var l = 0; l <= maxCapa; l++) capas.push(nodos.filter(function (n) { return capa[n.id] === l; }));

    // Reducir cruces: barrido por baricentros
    function pos(n) { return capas[capa[n.id]].indexOf(n); }
    function vecinos(n) {
      var v = [];
      dir.concat(hermanas.map(function (r) { return [r.de, r.a]; })).forEach(function (e) { if (e[0] === n.id) v.push(por[e[1]]); if (e[1] === n.id) v.push(por[e[0]]); });
      return v;
    }
    for (var pasada = 0; pasada < 4; pasada++) {
      (pasada % 2 ? capas.slice().reverse() : capas).forEach(function (fila) {
        var claves = fila.map(function (n, idx) {
          var vs = vecinos(n).filter(function (x) { return capa[x.id] !== capa[n.id]; });
          return { n: n, k: vs.length ? vs.reduce(function (a, x) { return a + pos(x) / Math.max(1, capas[capa[x.id]].length - 1 || 1); }, 0) / vs.length : idx / Math.max(1, fila.length) };
        });
        claves.sort(function (a, b) { return a.k - b.k; });
        claves.forEach(function (c, idx) { fila[idx] = c.n; });
      });
    }

    // Las clases «hermanas» se sitúan justo a la derecha de su pareja para que su línea no cruce otras cajas
    Object.keys(enHermana).forEach(function (k) {
      var fila = capas[capa[k]], n = por[k], pareja = por[enHermana[k]];
      fila.splice(fila.indexOf(n), 1);
      fila.splice(fila.indexOf(pareja) + 1, 0, n);
    });

    var anchos = capas.map(function (f) { return f.reduce(function (a, n) { return a + n.w; }, 0) + GX * Math.max(0, f.length - 1); });
    var W = Math.max.apply(null, anchos) + M * 2, y = M;
    capas.forEach(function (fila, i) {
      var x = M + (W - M * 2 - anchos[i]) / 2, alto = 0;
      fila.forEach(function (n) { n.x = Math.round(x); n.y = y; x += n.w + GX; alto = Math.max(alto, n.h); });
      y += alto + GY;
    });
    var H = y - GY + M;

    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, class: 'uml' + (op.anima ? ' anima' : ''), role: 'img', 'aria-label': op.titulo || 'Diagrama de clases UML' });
    var defs = el('defs', {});
    function marcador(id, w, h, rx, ry, orient, hijo) {
      var m = el('marker', { id: uid + id, markerWidth: w, markerHeight: h, refX: rx, refY: ry, orient: orient, markerUnits: 'userSpaceOnUse' });
      m.appendChild(hijo);
      defs.appendChild(m);
    }
    marcador('tri', 13, 12, 13, 6, 'auto', el('path', { d: 'M0.5,0.8 L12.5,6 L0.5,11.2 z', class: 'mk-hueco' }));
    marcador('abi', 11, 10, 10.5, 5, 'auto', el('path', { d: 'M0.8,0.8 L10,5 L0.8,9.2', class: 'mk-abierta' }));
    marcador('romh', 16, 12, 0.5, 6, 'auto', el('path', { d: 'M0.5,6 L8,0.8 L15.5,6 L8,11.2 z', class: 'mk-hueco' }));
    marcador('roml', 16, 12, 0.5, 6, 'auto', el('path', { d: 'M0.5,6 L8,0.8 L15.5,6 L8,11.2 z', class: 'mk-lleno' }));
    svg.appendChild(defs);

    function centro(n) { return { x: n.x + n.w / 2, y: n.y + n.h / 2 }; }
    function borde(n, hacia) {
      var c = centro(n), dx = hacia.x - c.x, dy = hacia.y - c.y;
      var sx = dx === 0 ? Infinity : (n.w / 2) / Math.abs(dx), sy = dy === 0 ? Infinity : (n.h / 2) / Math.abs(dy);
      var s = Math.min(sx, sy);
      return { x: c.x + dx * s, y: c.y + dy * s };
    }

    var gRel = el('g', {});
    rels.forEach(function (r) {
      var a = por[r.de], b = por[r.a];
      var p1 = borde(a, centro(b)), p2 = borde(b, centro(a));
      var attrs = { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, class: 'rel' };
      var t = r.tipo;
      if (t === 'realizacion' || t === 'dependencia' || t === 'claseAsociacion') attrs.class += ' disc';
      if (t === 'herencia' || t === 'realizacion') attrs['marker-end'] = 'url(#' + uid + 'tri)';
      else if (t === 'dependencia' || t === 'asociacion') attrs['marker-end'] = 'url(#' + uid + 'abi)';
      if (t === 'agregacion') attrs['marker-start'] = 'url(#' + uid + 'romh)';
      if (t === 'composicion') attrs['marker-start'] = 'url(#' + uid + 'roml)';
      gRel.appendChild(el('line', attrs));
      if (r.etiqueta) {
        var mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;
        var tw = r.etiqueta.length * 6.2 + 8;
        gRel.appendChild(el('rect', { x: mx - tw / 2, y: my - 8, width: tw, height: 15, rx: 2, class: 'fondo-etq' }));
        gRel.appendChild(el('text', { x: mx, y: my + 3.5, 'text-anchor': 'middle', class: 'etq-rel' }, r.etiqueta));
      }
    });
    svg.appendChild(gRel);

    nodos.forEach(function (n) {
      var ext = el('g', { transform: 'translate(' + n.x + ',' + n.y + ')' });
      var g = el('g', { class: 'nodo', style: '--i:' + n.i });
      g.appendChild(el('title', {}, n.c.titulo + '\n' + n.c.atributos.concat(n.c.metodos).join('\n')));
      g.appendChild(el('rect', { width: n.w, height: n.h, rx: 3, class: 'caja' }));
      g.appendChild(el('rect', { width: n.w - 1.4, height: n.cabH, x: 0.7, y: 0.7, rx: 2.5, class: 'cab-caja' }));
      if (n.estereo) g.appendChild(el('text', { x: n.w / 2, y: 15, 'text-anchor': 'middle', class: 'est' }, n.estereo));
      var tit = el('text', { x: n.w / 2, y: n.estereo ? 32 : 19, 'text-anchor': 'middle', class: 'tit' }, n.c.titulo);
      if (n.c.tipo === 'abstracta' || n.c.tipo === 'interfaz') tit.setAttribute('font-style', 'italic');
      g.appendChild(tit);
      var yy = n.cabH;
      g.appendChild(el('line', { x1: 0, x2: n.w, y1: yy, y2: yy, class: 'sep' }));
      n.attrs.forEach(function (s, i) { g.appendChild(el('text', { x: PAD, y: yy + 14 + i * LH, class: 'mie' }, s)); });
      yy += n.attrs.length ? n.attrs.length * LH + 8 : 6;
      if (n.mets.length) {
        g.appendChild(el('line', { x1: 0, x2: n.w, y1: yy, y2: yy, class: 'sep' }));
        n.mets.forEach(function (s, i) { g.appendChild(el('text', { x: PAD, y: yy + 14 + i * LH, class: 'mie' }, s)); });
      }
      ext.appendChild(g);
      svg.appendChild(ext);
    });
    return svg;
  }

  window.Uml = { dibujar: dibujar };
})();
