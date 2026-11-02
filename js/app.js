/* Portafolio Java: interfaz. Sin dependencias. Todo el contenido dinámico se pinta con textContent (sin innerHTML). */
(function () {
  'use strict';
  var EST = window.PORTAFOLIO_ESTATICO || null;     // presente solo en la versión estática exportada
  var principal = document.getElementById('principal');
  var info = null, lista = [], fichas = {};
  var filtro = { uf: 'todos', tipo: 'todos', q: '' };

  /* ---------- utilidades ---------- */
  function h(tag, props) {
    var e = document.createElement(tag);
    if (props) Object.keys(props).forEach(function (k) {
      var v = props[k];
      if (v == null || v === false) return;
      if (k === 'class') e.className = v;
      else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), v);
      else if (k === 'value' || k === 'disabled' || k === 'hidden' || k === 'checked') e[k] = v;
      else e.setAttribute(k, v === true ? '' : v);
    });
    for (var i = 2; i < arguments.length; i++) añadir(e, arguments[i]);
    return e;
  }
  function añadir(e, c) {
    if (c == null || c === false) return;
    if (Array.isArray(c)) c.forEach(function (x) { añadir(e, x); });
    else e.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  function vaciar(e) { while (e.firstChild) e.removeChild(e.firstChild); return e; }
  function sinCodigo(a) { return (a || '').replace('Actividad ', 'A'); }

  /* ---------- acceso a datos (servidor Java en vivo o datos exportados) ---------- */
  function api(ruta, opc) {
    return fetch(ruta, opc).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }
  function cargarBase() {
    if (EST) { info = EST.info; lista = EST.ejercicios; return Promise.resolve(); }
    return Promise.all([api('api/info'), api('api/ejercicios')]).then(function (r) { info = r[0]; lista = r[1]; });
  }
  function getFicha(id) {
    if (fichas[id]) return Promise.resolve(fichas[id]);
    var p = EST ? Promise.resolve(EST.fichas[id]) : api('api/ejercicio/' + encodeURIComponent(id));
    return p.then(function (f) { fichas[id] = f; return f; });
  }
  function ejecutar(f, params, idx) {
    if (EST) return Promise.resolve(EST.resultados[f.id + '#' + idx]);
    return api('api/ejecutar/' + encodeURIComponent(f.id), {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(params)
    });
  }

  /* ---------- tema y modo ---------- */
  function iniciarCabecera() {
    var modo = document.getElementById('modo');
    modo.textContent = EST ? 'Versión estática' : 'Java en vivo';
    if (EST) modo.className = 'modo estatico';
    modo.title = EST ? 'Resultados generados por Java al exportar el sitio' : 'Cada ejecución se hace ahora mismo en el servidor Java';
    document.getElementById('tema').addEventListener('click', function () {
      var r = document.documentElement;
      var n = r.getAttribute('data-tema') === 'oscuro' ? 'claro' : 'oscuro';
      r.setAttribute('data-tema', n);
      try { localStorage.setItem('tema', n); } catch (e) { /* sin almacenamiento: no pasa nada */ }
    });
    document.getElementById('pie-autora').textContent = info.autora + ' · ' + info.formacion;
  }
  document.addEventListener('click', function (ev) {
    var a = ev.target.closest ? ev.target.closest('[data-ir]') : null;
    if (!a) return;
    ev.preventDefault();
    var d = document.getElementById(a.getAttribute('data-ir'));
    if (d) { d.scrollIntoView({ behavior: 'smooth', block: 'start' }); if (d.focus) d.focus({ preventScroll: true }); }
  });

  /* ---------- enrutado ---------- */
  function ruta() {
    var m = location.hash.replace(/^#\/?/, '').split('/');
    if (m[0] === 'ej' && m[1]) pintarEjercicio(decodeURIComponent(m[1]), m[2] || 'ejecucion');
    else pintarInicio();
  }
  window.addEventListener('hashchange', function () { window.scrollTo(0, 0); ruta(); });

  /* ---------- portada ---------- */
  function pintarInicio() {
    document.title = 'Portafolio de ejercicios Java · ' + info.autora;
    var interactivos = lista.filter(function (e) { return e.interactivo; }).length;
    var plano = h('div', { class: 'uml-wrap' }, h('span', { class: 'mono' }, 'Dibujando el diagrama…'));
    var hero = h('section', { class: 'hero' },
      h('div', null,
        h('p', { class: 'kicker' }, 'Portafolio de ejercicios · ' + info.ufs.map(function (u) { return u.id; }).join(' y ')),
        h('h1', null, 'Java que se ejecuta ', h('span', { class: 'resalte' }, 'delante de ti'), '.'),
        h('p', { class: 'lead' }, info.total + ' ejercicios de orientación a objetos, desarrollo web y bases de datos, adaptados a Java. ' +
          (EST ? 'Cada uno muestra la salida real de su código con varios casos de prueba.' : 'Cada uno se ejecuta con su código real y puedes probarlo con tus propios datos.')),
        h('div', { class: 'acciones' },
          h('a', { class: 'btn', href: '#ejercicios', 'data-ir': 'ejercicios' }, 'Ver los ejercicios'),
          h('a', { class: 'btn sec', href: '#/ej/uf2404_ud3a1' }, 'Empezar por la herencia')),
        h('div', { class: 'cajetin' }, h('dl', null,
          h('dt', null, 'Autora'), h('dd', null, info.autora),
          h('dt', null, 'Formación'), h('dd', null, info.formacion),
          h('dt', null, 'Unidades'), h('dd', null, info.ufs.map(function (u) { return u.id; }).join(' · ')),
          h('dt', null, 'Ejercicios'), h('dd', null, info.total + ' (' + interactivos + (EST ? ' con casos de prueba)' : ' interactivos)')),
          h('dt', null, 'Plataforma'), h('dd', null, info.java + ' · JDBC · H2')))),
      h('div', { class: 'plano' }, plano,
        h('div', { class: 'plano-cap' },
          h('span', null, 'Diagrama de clases dibujado a partir de las clases Java reales, por reflexión.'),
          h('a', { href: '#/ej/uf2404_ud3a1/diagrama' }, 'Ver'))));

    var cont = h('div', { id: 'lista' });
    var buscar = h('input', { class: 'buscar', type: 'search', placeholder: 'Buscar por título o concepto', 'aria-label': 'Buscar ejercicios', value: filtro.q });
    buscar.addEventListener('input', function () { filtro.q = buscar.value; pintarLista(cont, contador); });
    var contador = h('span', { class: 'contador', 'aria-live': 'polite' });
    function grupo(clave, opciones) {
      var g = h('div', { class: 'grupo', role: 'group', 'aria-label': clave });
      opciones.forEach(function (o) {
        var b = h('button', { type: 'button', 'aria-pressed': String(filtro[clave] === o[0]) }, o[1]);
        b.addEventListener('click', function () {
          filtro[clave] = o[0];
          Array.prototype.forEach.call(g.children, function (x, i) { x.setAttribute('aria-pressed', String(opciones[i][0] === o[0])); });
          pintarLista(cont, contador);
        });
        g.append(b);
      });
      return g;
    }
    var filtros = h('div', { class: 'filtros' },
      grupo('uf', [['todos', 'Todas'], ['UF2404', 'UF2404'], ['UF2405', 'UF2405']]),
      grupo('tipo', [['todos', 'Todos los tipos'], ['Caso práctico', 'Casos prácticos'], ['Teórico-práctico', 'Teórico-prácticos']]),
      buscar, contador);
    principal.replaceChildren(hero,
      h('div', { class: 'seccion-t', id: 'ejercicios', tabindex: '-1' }, h('h2', null, 'Los ejercicios')),
      filtros, cont);
    pintarLista(cont, contador);

    getFicha('uf2404_ud3a1').then(function (f) {
      if (f.uml) vaciar(plano).append(Uml.dibujar(f.uml, { anima: true, titulo: 'Jerarquía Vehiculo, Coche y Bicicleta' }));
    }).catch(function () { plano.textContent = ''; });
  }

  function pintarLista(cont, contador) {
    var q = filtro.q.trim().toLowerCase();
    var vis = lista.filter(function (e) {
      if (filtro.uf !== 'todos' && e.uf !== filtro.uf) return false;
      if (filtro.tipo !== 'todos' && e.tipo !== filtro.tipo) return false;
      if (q && (e.titulo + ' ' + e.resumen + ' ' + e.conceptos.join(' ') + ' ' + e.tecnologias.join(' ')).toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
    contador.textContent = vis.length + ' de ' + lista.length;
    vaciar(cont);
    if (!vis.length) { cont.append(h('p', { class: 'vacio' }, 'Ningún ejercicio coincide con esos filtros.')); return; }
    info.ufs.forEach(function (uf) {
      var items = vis.filter(function (e) { return e.uf === uf.id; });
      if (!items.length) return;
      cont.append(
        h('div', { class: 'uf-cab' }, h('span', { class: 'cod' }, uf.id), h('h3', null, uf.titulo), h('p', null, uf.descripcion)),
        h('div', { class: 'grid' }, items.map(tarjeta)));
    });
  }

  function tarjeta(e) {
    return h('a', { class: 'ficha', href: '#/ej/' + e.id },
      h('div', { class: 'id' }, h('span', null, e.ud + ' · ' + sinCodigo(e.actividad)),
        h('span', { class: e.interactivo ? 'etiq-vivo' : '' }, e.interactivo ? (EST ? 'casos' : 'interactivo') : e.tipo === 'Caso práctico' ? 'práctico' : 'teórico')),
      h('h4', null, e.titulo), h('p', { class: 'res' }, e.resumen),
      h('div', { class: 'chips' }, e.conceptos.slice(0, 3).map(function (c) { return h('span', { class: 'chip' }, c); })));
  }

  /* ---------- página de ejercicio ---------- */
  function pintarEjercicio(id, tab) {
    var i = lista.findIndex(function (e) { return e.id === id; });
    if (i < 0) {
      principal.replaceChildren(h('p', { class: 'vacio' }, 'Ese ejercicio no existe. '), h('a', { class: 'btn', href: '#/' }, 'Volver al portafolio'));
      return;
    }
    principal.replaceChildren(h('p', { class: 'cargando' }, 'Preparando el ejercicio…'));
    getFicha(id).then(function (f) { montarEjercicio(f, i, tab); })
      .catch(function () { principal.replaceChildren(h('p', { class: 'vacio' }, 'No se pudo cargar el ejercicio.')); });
  }

  function montarEjercicio(f, i, tabInicial) {
    document.title = f.titulo + ' · Portafolio Java';
    var defs = [['ejecucion', 'Ejecución', function () { return panelEjecucion(f); }]];
    if (f.archivos.length || f.originales.length) defs.push(['codigo', 'Código', function () { return panelCodigo(f); }]);
    if (f.uml) defs.push(['diagrama', 'Diagrama UML', function () { return panelDiagrama(f); }]);
    if (f.enunciado.length || f.teoria.length) defs.push(['teoria', 'Enunciado y teoría', function () { return panelTeoria(f); }]);
    if (f.notas.length) defs.push(['adaptacion', 'Adaptación a Java', function () { return panelNotas(f); }]);
    var activa = defs.some(function (d) { return d[0] === tabInicial; }) ? tabInicial : 'ejecucion';

    var botones = {}, paneles = {};
    var barra = h('div', { class: 'tabs', role: 'tablist', 'aria-label': 'Secciones del ejercicio' });
    var zona = h('div');
    function mostrar(clave) {
      defs.forEach(function (d) {
        var sel = d[0] === clave;
        botones[d[0]].setAttribute('aria-selected', String(sel));
        botones[d[0]].tabIndex = sel ? 0 : -1;
        if (sel && !paneles[d[0]]) { paneles[d[0]] = h('div', { class: 'panel-tab', role: 'tabpanel', id: 'p-' + d[0] }, d[2]()); zona.append(paneles[d[0]]); }
        if (paneles[d[0]]) paneles[d[0]].hidden = !sel;
      });
      history.replaceState(null, '', '#/ej/' + f.id + (clave === 'ejecucion' ? '' : '/' + clave));
    }
    defs.forEach(function (d, k) {
      var b = h('button', { type: 'button', role: 'tab', 'aria-controls': 'p-' + d[0], id: 't-' + d[0] }, d[1]);
      b.addEventListener('click', function () { mostrar(d[0]); });
      b.addEventListener('keydown', function (ev) {
        var n = ev.key === 'ArrowRight' ? k + 1 : ev.key === 'ArrowLeft' ? k - 1 : null;
        if (n == null) return;
        n = (n + defs.length) % defs.length;
        mostrar(defs[n][0]); botones[defs[n][0]].focus();
      });
      botones[d[0]] = b; barra.append(b);
    });

    var ant = lista[i - 1], sig = lista[i + 1];
    principal.replaceChildren(
      h('a', { class: 'volver', href: '#/' }, '← Todos los ejercicios'),
      h('header', { class: 'ej-cab' },
        h('div', { class: 'meta' }, h('span', { class: 'etq uf' }, f.uf), h('span', { class: 'etq' }, f.ud + ' · ' + f.actividad), h('span', { class: 'etq' }, f.tipo),
          f.tecnologias.map(function (t) { return h('span', { class: 'etq' }, t); })),
        h('h1', null, f.titulo), h('p', { class: 'res' }, f.resumen),
        h('div', { class: 'chips' }, f.conceptos.map(function (c) { return h('span', { class: 'chip' }, c); }))),
      barra, zona,
      h('nav', { class: 'nav-ej', 'aria-label': 'Otros ejercicios' },
        ant ? h('a', { href: '#/ej/' + ant.id }, h('small', null, '← Anterior'), h('strong', null, ant.titulo)) : h('span'),
        sig ? h('a', { class: 'sig', href: '#/ej/' + sig.id }, h('small', null, 'Siguiente →'), h('strong', null, sig.titulo)) : null));
    mostrar(activa);
  }

  /* ---------- pestaña: ejecución ---------- */
  function panelEjecucion(f) {
    var res = h('div', { class: 'resultados', 'aria-live': 'polite' });
    var cont = h('div', { class: 'ejec' + (f.campos.length ? '' : ' solo') });
    var entradas = {}, botonesEsc = [], activo = 0;

    function valores() {
      var o = {};
      f.campos.forEach(function (c) { o[c.nombre] = entradas[c.nombre].input.value; });
      return o;
    }
    function visibilidad() {
      f.campos.forEach(function (c) {
        if (!c.cuando) return;
        var p = c.cuando.split('=');
        entradas[c.nombre].fila.hidden = entradas[p[0]].input.value !== p.slice(1).join('=');
      });
    }
    function correr(idx) {
      vaciar(res).append(h('div', { class: 'cargando-res' }, 'Ejecutando en Java…'));
      ejecutar(f, f.campos.length ? valores() : {}, idx).then(function (r) {
        if (!r) throw new Error('sin datos');
        pintarResultado(res, r, f);
      }).catch(function () {
        vaciar(res).append(h('div', { class: 'veredicto mal' }, h('span', null, '✕'), h('span', null, 'No se pudo ejecutar. ¿Sigue en marcha el servidor Java?')));
      });
    }
    function elegir(idx) {
      activo = idx;
      var p = f.escenarios[idx].parametros;
      f.campos.forEach(function (c) { if (p[c.nombre] != null) entradas[c.nombre].input.value = p[c.nombre]; });
      botonesEsc.forEach(function (b, k) { b.setAttribute('aria-pressed', String(k === idx)); });
      visibilidad();
      correr(idx);
    }

    if (f.campos.length) {
      var form = h('form', { class: 'formulario', onsubmit: function (ev) { ev.preventDefault(); if (!EST) { botonesEsc.forEach(function (b) { b.setAttribute('aria-pressed', 'false'); }); correr(activo); } } });
      if (f.escenarios.length > 1) {
        var esc = h('div', { class: 'esc' });
        f.escenarios.forEach(function (e, k) {
          var b = h('button', { type: 'button', 'aria-pressed': String(k === 0) }, e.nombre);
          b.addEventListener('click', function () { elegir(k); });
          botonesEsc.push(b); esc.append(b);
        });
        form.append(h('h3', null, 'Casos de prueba'), esc);
      }
      f.campos.forEach(function (c, k) {
        var id = 'c-' + f.id + '-' + k, input;
        if (c.tipo === 'select') input = h('select', { id: id }, c.opciones.map(function (o) { return h('option', { value: o }, o); }));
        else if (c.tipo === 'textarea') input = h('textarea', { id: id, spellcheck: 'false', rows: '6' });
        else input = h('input', { id: id, type: c.tipo, step: c.tipo === 'number' ? 'any' : null, autocomplete: 'off' });
        input.value = c.valor;
        if (EST) input.disabled = true;
        input.addEventListener('input', function () { visibilidad(); botonesEsc.forEach(function (b) { b.setAttribute('aria-pressed', 'false'); }); });
        input.addEventListener('change', visibilidad);
        var fila = h('div', { class: 'campo' }, h('label', { for: id }, c.etiqueta), input, c.ayuda ? h('small', null, c.ayuda) : null);
        entradas[c.nombre] = { input: input, fila: fila };
        form.append(fila);
      });
      if (EST) form.append(h('p', { class: 'aviso-estatico' }, 'Versión estática: estos son los resultados que generó Java al exportar el sitio. Para probar tus propios datos, arranca el servidor con ./run.sh.'));
      else form.append(h('button', { class: 'btn', type: 'submit' }, 'Ejecutar en Java'));
      cont.append(form);
      visibilidad();
    }
    cont.append(res);
    setTimeout(function () { correr(0); }, 0);
    return cont;
  }

  /* ---------- pintar resultados ---------- */
  function pintarResultado(res, r, f) {
    vaciar(res);
    var secs = r.secciones || [];
    var consolaPrimero = !f.interactivo || secs.every(function (s) { return s.tipo === 'veredicto'; });
    var consola = r.consola && r.consola.trim() ? h('section', { class: 'res-sec' },
      h('div', { class: 'consola' },
        h('header', null, h('span', null, consolaPrimero ? 'salida de consola' : 'salida del programa original (main)'), h('span', null, 'System.out')),
        h('pre', null, r.consola.replace(/\s+$/, '')))) : null;
    if (consolaPrimero && consola) res.append(consola);
    secs.forEach(function (s) {
      var fn = RENDER[s.tipo];
      if (!fn) return;
      var nodo = fn(s);
      res.append(h('section', { class: 'res-sec' }, s.titulo && s.tipo !== 'consulta' ? h('h3', null, s.titulo) : null, s.tipo === 'consulta' ? h('h3', null, s.titulo) : null, nodo));
    });
    if (!consolaPrimero && consola) res.append(consola);
    if (!res.children.length) res.append(h('p', { class: 'vacio' }, 'Sin salida.'));
  }

  function celda(v) {
    if (v === null || v === undefined) return h('td', { class: 'nulo' }, 'NULL');
    var s = String(v);
    return h('td', { class: /^-?\d+([.,]\d+)?$/.test(s) ? 'num' : '' }, s);
  }
  function tabla(cols, filas) {
    return h('div', { class: 'tabla-wrap' }, h('table', null,
      h('thead', null, h('tr', null, cols.map(function (c) { return h('th', { scope: 'col' }, c); }))),
      h('tbody', null, filas.map(function (fila) { return h('tr', null, fila.map(celda)); }))));
  }
  function sqlResaltado(sql) {
    var pre = h('pre', { class: 'sql' });
    Resaltado.lineas(sql, 'q.sql').forEach(function (ln, i) {
      if (i) pre.append('\n');
      ln.forEach(function (t) { pre.append(t[0] ? h('span', { class: 't-' + t[0] }, t[1]) : t[1]); });
    });
    return pre;
  }

  var RENDER = {
    tabla: function (s) { return tabla(s.columnas, s.filas); },
    objetos: function (s) {
      return h('div', { class: 'objetos' }, s.items.map(function (o) {
        var dl = h('dl');
        Object.keys(o.campos).forEach(function (k) { dl.append(h('dt', null, k), h('dd', null, String(o.campos[k]))); });
        return h('div', { class: 'obj' }, h('h4', null, o.titulo), dl);
      }));
    },
    pasos: function (s) {
      return h('ol', { class: 'pasos' }, s.items.map(function (p) {
        return h('li', { class: p.estado }, h('div', null, h('div', { class: 't' }, p.titulo), p.detalle ? h('div', { class: 'd' }, p.detalle) : null));
      }));
    },
    kv: function (s) {
      var dl = h('dl', { class: 'kv' });
      Object.keys(s.pares).forEach(function (k) { dl.append(h('dt', null, k), h('dd', null, String(s.pares[k]))); });
      return dl;
    },
    veredicto: function (s) { return h('div', { class: 'veredicto ' + (s.ok ? 'ok' : 'mal'), role: 'status' }, h('span', { 'aria-hidden': 'true' }, s.ok ? '✓' : '✕'), h('span', null, s.texto)); },
    texto: function (s) { return h('p', null, s.texto); },
    escala: function (s) {
      var total = s.max - s.min, prev = s.min, barra = h('div', { class: 'escala-barra' }), etq = h('div', { class: 'escala-etq' });
      s.zonas.forEach(function (z, i) {
        var w = (z.hasta - prev) / total * 100; prev = z.hasta;
        barra.append(h('span', { class: 'z' + i, style: 'width:' + w + '%' }));
        etq.append(h('span', { style: 'width:' + w + '%' }, z.etiqueta));
      });
      var pos = Math.max(0, Math.min(100, (s.valor - s.min) / total * 100));
      return h('div', { class: 'escala', role: 'img', 'aria-label': s.titulo + ': ' + s.valor }, h('div', { class: 'escala-pin', style: 'left:' + pos + '%' }, String(s.valor)), barra, etq);
    },
    capas: function (s) {
      var cols = { PRESENTACION: 1, NEGOCIO: 2, DATOS: 3 }, nom = { PRESENTACION: 'Presentación', NEGOCIO: 'Negocio', DATOS: 'Datos' };
      var g = h('div', { class: 'capas' });
      ['PRESENTACION', 'NEGOCIO', 'DATOS'].forEach(function (k, i) { g.append(h('div', { class: 'cab ' + k, style: 'grid-column:' + (i + 1) + ';grid-row:1' }, nom[k])); });
      s.items.forEach(function (p, i) {
        g.append(h('div', { class: 'p ' + p.capa, style: 'grid-column:' + cols[p.capa] + ';grid-row:' + (i + 2) },
          h('div', { class: 'c' }, h('span', { class: 'n' }, String(i + 1)), p.componente), h('div', { class: 'dt' }, p.detalle)));
      });
      return g;
    },
    pagina: function (s) {
      var f = h('iframe', { class: 'marco', title: s.titulo || 'Página generada', sandbox: 'allow-scripts' });
      f.srcdoc = s.html;
      return f;
    },
    consulta: function (s) {
      var d = h('div', { class: 'res-sec' }, sqlResaltado(s.sql));
      if (s.nota) d.append(h('p', { class: 'nota-sql' }, s.nota));
      else d.append(s.filas.length ? tabla(s.columnas, s.filas) : h('p', { class: 'nulo' }, 'La consulta no devuelve filas.'));
      return d;
    }
  };

  /* ---------- pestaña: código ---------- */
  function panelCodigo(f) {
    var todos = f.archivos.map(function (a) { return { n: a.nombre, c: a.codigo, g: 'Código adaptado' }; })
      .concat(f.originales.map(function (a) { return { n: a.nombre, c: a.codigo, g: 'Original' }; }));
    var visor = h('div', { class: 'visor' });
    var barra = h('div', { class: 'cod-barra' });
    var btns = [];
    function ver(k) {
      var a = todos[k];
      btns.forEach(function (b, j) { b.setAttribute('aria-pressed', String(j === k)); });
      var lineas = Resaltado.lineas(a.c, a.n);
      var pre = h('pre', { tabindex: '0', 'aria-label': 'Código de ' + a.n });
      var code = h('code');
      lineas.forEach(function (ln, i) {
        var l = h('span', { class: 'l', 'data-n': String(i + 1) });
        ln.forEach(function (t) { l.append(t[0] ? h('span', { class: 't-' + t[0] }, t[1]) : t[1]); });
        code.append(l);
      });
      pre.append(code);
      var copiar = h('button', { type: 'button' }, 'Copiar');
      copiar.addEventListener('click', function () {
        var ok = function () { copiar.textContent = 'Copiado'; setTimeout(function () { copiar.textContent = 'Copiar'; }, 1500); };
        try { navigator.clipboard.writeText(a.c).then(ok, function () { copiar.textContent = 'No se pudo'; }); } catch (e) { copiar.textContent = 'No se pudo'; }
      });
      visor.replaceChildren(h('header', null, h('span', null, a.n + ' · ' + lineas.length + ' líneas'), copiar), pre);
    }
    var ult = '';
    todos.forEach(function (a, k) {
      if (a.g !== ult) { barra.append(h('span', { class: 'grp' }, a.g)); ult = a.g; }
      var b = h('button', { type: 'button', 'aria-pressed': 'false' }, a.n);
      b.addEventListener('click', function () { ver(k); });
      btns.push(b); barra.append(b);
    });
    ver(0);
    return h('div', null, barra, visor);
  }

  /* ---------- pestaña: diagrama ---------- */
  var LEYENDA = {
    herencia: 'Herencia: línea continua con triángulo hueco hacia la clase padre',
    realizacion: 'Realización: línea discontinua con triángulo hueco hacia la interfaz',
    asociacion: 'Asociación: línea con flecha abierta',
    agregacion: 'Agregación: rombo hueco en el lado del todo',
    composicion: 'Composición: rombo relleno en el lado del todo',
    dependencia: 'Dependencia: línea discontinua con flecha abierta',
    claseAsociacion: 'Clase de asociación: línea discontinua hacia las dos clases que une'
  };
  function panelDiagrama(f) {
    var tipos = {};
    f.uml.relaciones.forEach(function (r) { tipos[r.tipo] = true; });
    return h('div', null,
      h('div', { class: 'uml-scroll' }, Uml.dibujar(f.uml, { titulo: 'Diagrama de clases de ' + f.titulo })),
      h('div', { class: 'leyenda' }, Object.keys(tipos).map(function (t) { return h('span', null, LEYENDA[t] || t); })),
      h('p', { class: 'leyenda' }, 'Los atributos y métodos se leen por reflexión (java.lang.reflect) de las clases compiladas; los getters y setters se resumen.'));
  }

  /* ---------- pestañas de texto ---------- */
  function panelTeoria(f) {
    return h('div', null,
      f.enunciado.length ? h('div', { class: 'prosa' }, f.enunciado.map(function (p) { return h('p', null, p); })) : null,
      f.teoria.length ? h('h2', { class: 'bloque-t' }, 'Respuestas y conceptos') : null,
      f.teoria.map(function (t, i) {
        var d = h('details', { class: 'qa' }, h('summary', null, t.pregunta), h('p', null, t.respuesta));
        if (i === 0) d.open = true;
        return d;
      }));
  }
  function panelNotas(f) {
    return h('div', null, h('ul', { class: 'lista-notas' }, f.notas.map(function (n) { return h('li', null, n); })));
  }

  /* ---------- arranque ---------- */
  cargarBase().then(function () { iniciarCabecera(); ruta(); }).catch(function () {
    principal.replaceChildren(h('p', { class: 'vacio' }, 'No se pudo conectar con el servidor Java. Arráncalo con ./run.sh y recarga la página.'));
  });
})();
