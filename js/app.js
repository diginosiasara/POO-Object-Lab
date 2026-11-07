/* Portafolio Java: interfaz. Sin dependencias. Todo el contenido dinámico se pinta con textContent (sin innerHTML). */
(function () {
  'use strict';
  var EST = window.PORTAFOLIO_ESTATICO || null;     // presente solo en la versión estática exportada
  var principal = document.getElementById('principal');
  var info = null, lista = [], fichas = {};
  var filtro = { uf: 'todos', tipo: 'todos', q: '', proyecto: false };

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
  function anunciar(t) {
    var a = document.getElementById('anuncios');
    if (!a) return;
    a.textContent = '';
    setTimeout(function () { a.textContent = t; }, 60);
  }
  var primeraVista = true;
  /* Tras cambiar de vista, el foco va al título y se anuncia (lectores de pantalla) */
  function foco() {
    if (primeraVista) { primeraVista = false; return; }
    var t = principal.querySelector('h1');
    if (t) { t.setAttribute('tabindex', '-1'); t.focus({ preventScroll: true }); }
    anunciar(document.title);
  }
  window.PortafolioA11y = { anunciar: anunciar };
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
    if (EST) {
      if (window.Motor && window.Motor.soporta(EST, f.id)) return window.Motor.ejecutar(EST, f.id, params);   // réplica en JavaScript
      return Promise.resolve(EST.resultados[f.id + '#' + idx]);
    }
    return api('api/ejecutar/' + encodeURIComponent(f.id), {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(params)
    });
  }

  /* ---------- tema y modo ---------- */
  function iniciarCabecera() {
    var modo = document.getElementById('modo');
    modo.textContent = EST ? 'Modo navegador' : 'Java en vivo';
    if (EST) modo.className = 'modo estatico';
    modo.title = EST ? 'Los ejercicios se ejecutan en tu navegador con una réplica en JavaScript de la lógica Java, verificada contra los resultados reales de Java. Con ./run.sh se ejecuta el Java real.' : 'Cada ejecución se hace ahora mismo en el servidor Java';
    document.getElementById('tema').addEventListener('click', function () {
      var r = document.documentElement;
      var n = r.getAttribute('data-tema') === 'oscuro' ? 'claro' : 'oscuro';
      r.setAttribute('data-tema', n);
      try { localStorage.setItem('tema', n); } catch (e) { /* sin almacenamiento: no pasa nada */ }
    });
    document.getElementById('pie-autora').textContent = '© ' + info.autora + ' · ' + info.nombre + ', bajo la marca registrada ' + info.marca.nombre + ' (OEPM, marca n.º ' + info.marca.numero + ')';
  }
  document.addEventListener('click', function (ev) {
    var a = ev.target.closest ? ev.target.closest('[data-ir]') : null;
    if (!a) return;
    ev.preventDefault();
    var d = document.getElementById(a.getAttribute('data-ir'));
    if (d) { d.scrollIntoView({ behavior: 'smooth', block: 'start' }); if (d.focus) d.focus({ preventScroll: true }); }
  });

  /* ---------- enrutado ---------- */
  function consultaHash(q) {
    var o = {};
    (q || '').split('&').forEach(function (par) {
      if (!par) return;
      var i = par.indexOf('='), dec = function (x) { try { return decodeURIComponent(x.replace(/\+/g, ' ')); } catch (e) { return x; } };
      o[dec(i < 0 ? par : par.slice(0, i))] = i < 0 ? '' : dec(par.slice(i + 1));
    });
    return o;
  }
  /* Abre la demostración en una ventana nueva (si el navegador la bloquea, se muestra en esta misma). */
  function abrirDemo(id, params) {
    var q = params ? '?' + Object.keys(params).map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]); }).join('&') : '';
    var url = location.href.split('#')[0] + '#/demo/' + encodeURIComponent(id) + q;
    var w = window.open(url, '_blank');
    if (w) { try { w.opener = null; } catch (e) { /* nada */ } anunciar('Demostración abierta en una ventana nueva.'); }
    else location.href = url;
  }

  function ruta() {
    var crudo = location.hash.replace(/^#\/?/, ''), q = '', qi = crudo.indexOf('?');
    if (qi >= 0) { q = crudo.slice(qi + 1); crudo = crudo.slice(0, qi); }
    var m = crudo.split('/');
    document.body.classList.toggle('modo-demo', m[0] === 'demo');
    if (m[0] === 'demo' && m[1]) pintarDemo(decodeURIComponent(m[1]), consultaHash(q));
    else if (m[0] === 'marca') pintarMarca();
    else if (m[0] === 'ej' && m[1]) pintarEjercicio(decodeURIComponent(m[1]), m[2] || '');
    else pintarInicio();
  }
  window.addEventListener('hashchange', function () { window.scrollTo(0, 0); ruta(); });

  /* ---------- portada ---------- */
  function pintarInicio() {
    document.title = info.nombre + ' · Portafolio de ejercicios Java · ' + info.autora;
    var interactivos = lista.filter(function (e) { return e.interactivo; }).length;
    var plano = h('div', { class: 'uml-wrap' }, h('span', { class: 'mono' }, 'Dibujando el diagrama…'));
    var ufs = info.ufs.map(function (u) { return u.id; }).join(' y ');
    var hero = h('section', { class: 'hero' },
      h('div', null,
        h('p', { class: 'kicker' }, 'Portafolio de ejercicios · ' + ufs),
        h('h1', { 'aria-label': 'POO Object Lab' },
          h('span', { class: 'h-poo', 'aria-hidden': 'true' }, 'POO'), h('span', { class: 'h-bar', 'aria-hidden': 'true' }, '|'),
          h('span', { class: 'h-obj', 'aria-hidden': 'true' }, 'Object Lab')),
        h('p', { class: 'lema' }, info.lema),
        h('p', { class: 'lead' }, h('strong', null, 'Java que se ejecuta delante de ti. '),
          info.total + ' ejercicios de orientación a objetos, desarrollo web y bases de datos, adaptados a Java. ' +
          'Cada uno se ejecuta en esta misma página y puedes probarlo con tus propios datos.'),
        h('div', { class: 'acciones' },
          h('a', { class: 'btn', href: '#ejercicios', 'data-ir': 'ejercicios' }, 'Ver los ejercicios'),
          h('a', { class: 'btn sec', href: '#/ej/uf2404_ud3a1' }, 'Empezar por la herencia')),
        h('div', { class: 'cajetin' },
          h('div', { class: 'cajetin-logo' }, h('img', { src: 'img/poo-object-lab.png', alt: '', width: '150', height: '169' })),
          h('dl', null,
            h('dt', null, 'Autoría'), h('dd', null, info.autora),
            h('dt', null, 'Marca'), h('dd', null, h('a', { href: '#/marca' }, info.marca.nombre + ' · n.º ' + info.marca.numero)),
            h('dt', null, 'Formación'), h('dd', null, info.formacion),
            h('dt', null, 'Ejercicios'), h('dd', null, info.total + ' (' + interactivos + ' interactivos)'),
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
      h('button', { type: 'button', class: 'conmutador', 'aria-pressed': String(filtro.proyecto), onclick: function (ev) {
        filtro.proyecto = !filtro.proyecto; ev.currentTarget.setAttribute('aria-pressed', String(filtro.proyecto)); pintarLista(cont, contador);
      } }, 'Con proyecto web'),
      buscar, contador);
    principal.replaceChildren(hero,
      h('div', { class: 'seccion-t', id: 'ejercicios', tabindex: '-1' }, h('h2', null, 'Los ejercicios')),
      filtros, cont);
    pintarLista(cont, contador);
    foco();

    getFicha('uf2404_ud3a1').then(function (f) {
      if (f.uml) vaciar(plano).append(Uml.dibujar(f.uml, { anima: true, titulo: 'Jerarquía Vehiculo, Coche y Bicicleta' }));
    }).catch(function () { plano.textContent = ''; });
  }

  function pintarLista(cont, contador) {
    var q = filtro.q.trim().toLowerCase();
    var vis = lista.filter(function (e) {
      if (filtro.uf !== 'todos' && e.uf !== filtro.uf) return false;
      if (filtro.tipo !== 'todos' && e.tipo !== filtro.tipo) return false;
      if (filtro.proyecto && !e.proyecto) return false;
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
        h('span', { class: e.interactivo || e.proyecto ? 'etiq-vivo' : '' }, e.proyecto ? 'proyecto web' : e.interactivo ? 'interactivo' : e.tipo === 'Caso práctico' ? 'práctico' : 'teórico')),
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
    document.title = f.titulo + ' · ' + info.nombre;
    var defs = [['ejecucion', 'Ejecución', function () { return panelEjecucion(f); }]];
    if (f.proyecto) defs.unshift(['proyecto', 'Proyecto en marcha', function () { return panelProyecto(f); }]);
    var porDefecto = defs[0][0];
    if (f.archivos.length || f.originales.length) defs.push(['codigo', 'Código', function () { return panelCodigo(f); }]);
    if (f.uml) defs.push(['diagrama', 'Diagrama UML', function () { return panelDiagrama(f); }]);
    if (f.enunciado.length || f.teoria.length) defs.push(['teoria', 'Enunciado y teoría', function () { return panelTeoria(f); }]);
    if (f.notas.length) defs.push(['adaptacion', 'Adaptación a Java', function () { return panelNotas(f); }]);
    var activa = defs.some(function (d) { return d[0] === tabInicial; }) ? tabInicial : porDefecto;

    var botones = {}, paneles = {};
    var barra = h('div', { class: 'tabs', role: 'tablist', 'aria-label': 'Secciones del ejercicio' });
    var zona = h('div');
    function mostrar(clave) {
      defs.forEach(function (d) {
        var sel = d[0] === clave;
        botones[d[0]].setAttribute('aria-selected', String(sel));
        botones[d[0]].tabIndex = sel ? 0 : -1;
        if (sel && !paneles[d[0]]) { paneles[d[0]] = h('div', { class: 'panel-tab', role: 'tabpanel', id: 'p-' + d[0], 'aria-labelledby': 't-' + d[0] }, d[2]()); zona.append(paneles[d[0]]); }
        if (paneles[d[0]]) paneles[d[0]].hidden = !sel;
      });
      history.replaceState(null, '', '#/ej/' + f.id + (clave === porDefecto ? '' : '/' + clave));
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
        h('div', { class: 'acciones demo-acc-cab' },
          h('button', { type: 'button', class: 'btn', onclick: function () { abrirDemo(f.id); } }, 'Ver demostración ↗'),
          h('span', { class: 'nota-demo' }, f.proyecto ? 'Se abre en una ventana nueva con la aplicación funcionando.' : 'Se abre en una ventana nueva con el ejercicio funcionando como una web.')),
        h('div', { class: 'chips' }, f.conceptos.map(function (c) { return h('span', { class: 'chip' }, c); }))),
      barra, zona,
      h('nav', { class: 'nav-ej', 'aria-label': 'Otros ejercicios' },
        ant ? h('a', { href: '#/ej/' + ant.id }, h('small', null, '← Anterior'), h('strong', null, ant.titulo)) : h('span'),
        sig ? h('a', { class: 'sig', href: '#/ej/' + sig.id }, h('small', null, 'Siguiente →'), h('strong', null, sig.titulo)) : null));
    mostrar(activa);
    foco();
  }

  /* ---------- pestaña: proyecto en marcha ---------- */
  // Código que se inyecta en las páginas de la versión estática: convierte clics y envíos de formulario en mensajes a la web.
  var SHIM = [
    "(function(){",
    "function enviar(m){ parent.postMessage(m,'*'); }",
    "document.addEventListener('click',function(e){",
    " var a=e.target.closest&&e.target.closest('a[href]'); if(!a) return; var h=a.getAttribute('href');",
    " if(/^https?:/i.test(h)){ e.preventDefault(); window.open(h,'_blank','noopener'); return; }",
    " if(/^(mailto:|tel:|javascript:|#)/i.test(h)) return;",
    " e.preventDefault(); enviar({poo:'nav',metodo:'GET',destino:h}); });",
    "document.addEventListener('submit',function(e){",
    " if(e.defaultPrevented) return; e.preventDefault(); var f=e.target, o={};",
    " new FormData(f).forEach(function(v,k){ o[k]=String(v); });",
    " enviar({poo:'nav',metodo:(f.getAttribute('method')||'GET').toUpperCase(),destino:f.getAttribute('action')||'',params:o}); });",
    "})();"
  ].join('\n');

  function claveNav(metodo, destino, params) {
    var q = {}, i = destino.indexOf('?'), ruta = i < 0 ? destino : destino.slice(0, i);
    if (i >= 0) destino.slice(i + 1).split('&').forEach(function (par) {
      if (!par) return;
      var j = par.indexOf('=');
      var dec = function (x) { try { return decodeURIComponent(x.replace(/\+/g, ' ')); } catch (e) { return x; } };
      q[dec(j < 0 ? par : par.slice(0, j))] = j < 0 ? '' : dec(par.slice(j + 1));
    });
    Object.keys(params || {}).forEach(function (k) { q[k] = params[k]; });
    ruta = ruta.replace(/^(\.\/|\/)+/, '');
    return metodo + '|' + ruta + '|' + Object.keys(q).sort().map(function (k) { return k + '=' + q[k]; }).join('&');
  }

  /* Incrusta CSS, JS e imágenes en la página (un marco aislado no puede cargar archivos locales desde file://) y añade el interceptor. */
  function prepararHtml(html, id) {
    var rec = (EST.apps && EST.apps[id] || {}).recursos || {};
    var norm = function (p) { return p.replace(/^(\.\/|\/)+/, ''); };
    var out = html.replace(/<link\b[^>]*?href=["']([^"']+)["'][^>]*>/gi, function (m, h) {
      var t = rec[norm(h)];
      return t != null && /stylesheet/i.test(m) ? '<style>' + t + '</style>' : m;
    }).replace(/<script\b([^>]*?)src=["']([^"']+)["']([^>]*)>\s*<\/script>/gi, function (m, a, h) {
      var t = rec[norm(h)];
      return t != null ? '<script>' + t.replace(/<\/script/gi, '<\\/script') + '<\/script>' : m;
    }).replace(/(<img\b[^>]*?src=["'])([^"']+)(["'])/gi, function (m, a, h, c) {
      var t = rec[norm(h)];
      return t != null ? a + 'data:' + (/\.svg$/i.test(h) ? 'image/svg+xml' : 'text/plain') + ';charset=utf-8,' + encodeURIComponent(t) + c : m;
    });
    var script = '<script>' + SHIM + '<\/script>';
    return /<\/body>/i.test(out) ? out.replace(/<\/body>/i, function () { return script + '</body>'; }) : out + script;
  }

  var NO_DISPONIBLE = '<!DOCTYPE html><meta charset="utf-8"><body style="font:16px/1.5 system-ui,sans-serif;padding:28px;color:#1a2433;background:#fff">' +
    '<h2 style="margin-top:0">No disponible en el modo navegador</h2><p>Esta acción no está entre las que puede resolver la versión sin servidor.</p>' +
    '<p>Prueba los <strong>casos de prueba</strong> de arriba o navega desde la portada de la aplicación.</p></body>';

  function panelProyecto(f, opc) {
    var demo = !!(opc && opc.demo);
    var pr = f.proyecto, base = 'app/' + encodeURIComponent(f.id) + '/';
    var paginas = EST ? ((EST.apps && EST.apps[f.id] || {}).paginas || {}) : null;
    var hist = [], pos = -1;
    var motorApp = (EST && window.Motor && window.Motor.tieneApp(f.id)) ? window.Motor.crearApp(EST, f.id) : null;
    var iframe = h('iframe', { class: 'marco-app', name: 'marco-' + f.id, title: 'Aplicación de muestra: ' + pr.titulo,
      sandbox: 'allow-scripts allow-forms allow-modals allow-popups' + (EST ? '' : ' allow-same-origin') });
    var url = h('input', { class: 'url', type: 'text', readonly: true, 'aria-label': 'Dirección actual de la aplicación', value: '' });
    var descripcion = h('p', { class: 'caso-desc', 'aria-live': 'polite' }, 'Elige un caso de prueba o navega libremente por la aplicación.');
    var bAtras = h('button', { type: 'button', class: 'nav-btn', 'aria-label': 'Página anterior', title: 'Atrás' }, '←');
    var bAdel = h('button', { type: 'button', class: 'nav-btn', 'aria-label': 'Página siguiente', title: 'Adelante' }, '→');
    var bRec = h('button', { type: 'button', class: 'nav-btn', 'aria-label': 'Recargar la página', title: 'Recargar' }, '↻');
    var bIni = h('button', { type: 'button', class: 'nav-btn', 'aria-label': 'Ir a la página de inicio de la aplicación', title: 'Inicio' }, '⌂');

    function actualizarBotones() { if (EST) { bAtras.disabled = pos <= 0; bAdel.disabled = pos >= hist.length - 1; } }

    /* --- versión estática: páginas precalculadas --- */
    function mostrarEst(r, k, sinHistoria) {
      iframe.srcdoc = prepararHtml(r.html, f.id);
      url.value = '/app/' + f.id + '/' + r.ruta;
      if (!sinHistoria) { hist = hist.slice(0, pos + 1); hist.push({ r: r, k: k }); pos = hist.length - 1; }
      actualizarBotones();
    }
    function irEst(metodo, destino, params) {
      var actual = pos >= 0 ? hist[pos].r.ruta : pr.inicio;
      var d = destino === '' ? actual : destino;
      var k = claveNav(metodo, d, params);
      var origen = motorApp ? motorApp.ir(metodo, d, params)
        : Promise.resolve(paginas[k] ? { ruta: paginas[k].ruta, codigo: paginas[k].codigo, html: paginas[k].html } : null);
      return origen.then(function (r) {
        if (!r) { iframe.srcdoc = NO_DISPONIBLE; anunciar('Acción no disponible en el modo navegador.'); return false; }
        mostrarEst(r, k, false);
        anunciar('Página cargada: ' + r.ruta);
        return true;
      }, function () { iframe.srcdoc = NO_DISPONIBLE; return false; });
    }

    /* --- versión en vivo: el servidor Java responde --- */
    function esperarCarga() {
      return new Promise(function (resolver) {
        function fin() { iframe.removeEventListener('load', fin); resolver(); }
        iframe.addEventListener('load', fin);
      });
    }
    function irVivo(metodo, destino, params) {
      var espera = esperarCarga();
      if (metodo === 'GET') {
        var q = Object.keys(params || {}).map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]); }).join('&');
        iframe.src = base + destino + (q ? (destino.indexOf('?') < 0 ? '?' : '&') + q : '');
      } else {
        var form = h('form', { method: 'post', action: base + destino, target: iframe.name, style: 'display:none' });
        Object.keys(params || {}).forEach(function (k) { form.append(h('input', { type: 'hidden', name: k, value: params[k] })); });
        document.body.append(form); form.submit(); form.remove();
      }
      return espera;
    }
    function reiniciarVivo() { return fetch(base + '__reiniciar', { method: 'POST' }).catch(function () { /* sin servidor */ }); }

    iframe.addEventListener('load', function () {
      if (EST) return;
      try {
        var l = iframe.contentWindow.location;
        url.value = l.pathname + l.search;
        anunciar('Página cargada: ' + (iframe.contentDocument.title || l.pathname));
      } catch (e) { /* otro origen */ }
    });

    /* --- barra de navegación --- */
    bAtras.addEventListener('click', function () {
      if (EST) { if (pos > 0) { pos--; mostrarEst(hist[pos].r, hist[pos].k, true); } } else { try { iframe.contentWindow.history.back(); } catch (e) { /* nada */ } }
    });
    bAdel.addEventListener('click', function () {
      if (EST) { if (pos < hist.length - 1) { pos++; mostrarEst(hist[pos].r, hist[pos].k, true); } } else { try { iframe.contentWindow.history.forward(); } catch (e) { /* nada */ } }
    });
    bRec.addEventListener('click', function () {
      if (EST) { if (pos >= 0) mostrarEst(hist[pos].r, hist[pos].k, true); } else { try { iframe.contentWindow.location.reload(); } catch (e) { iframe.src = iframe.src; } }
    });
    bIni.addEventListener('click', function () { if (EST) irEst('GET', pr.inicio, {}); else irVivo('GET', pr.inicio, {}); });

    if (EST) {
      var oyente = function (ev) {
        if (!document.contains(iframe)) { window.removeEventListener('message', oyente); return; }
        if (ev.source !== iframe.contentWindow) return;
        var d = ev.data;
        if (!d || d.poo !== 'nav') return;
        irEst(String(d.metodo || 'GET').toUpperCase(), String(d.destino || ''), d.params || {});
      };
      window.addEventListener('message', oyente);
    }

    /* --- casos de prueba --- */
    var chips = h('div', { class: 'esc', role: 'group', 'aria-label': 'Casos de prueba de la aplicación' });
    var botones = [];
    function ejecutarCaso(c, k) {
      botones.forEach(function (b, j) { b.setAttribute('aria-pressed', String(j === k)); });
      descripcion.textContent = c.descripcion;
      if (EST) {
        if (motorApp) motorApp.reiniciar();
        hist = []; pos = -1;
        c.pasos.reduce(function (acc, p) { return acc.then(function () { return irEst(p.metodo, p.ruta, p.params || {}); }); }, Promise.resolve());
      } else {
        reiniciarVivo().then(function () {
          return c.pasos.reduce(function (acc, p) { return acc.then(function () { return irVivo(p.metodo, p.ruta, p.params || {}); }); }, Promise.resolve());
        });
      }
    }
    pr.casos.forEach(function (c, k) {
      var b = h('button', { type: 'button', 'aria-pressed': 'false', title: c.descripcion }, c.nombre);
      b.addEventListener('click', function () { ejecutarCaso(c, k); });
      botones.push(b); chips.append(b);
    });

    var reiniciar = (EST && !motorApp) ? null : h('button', { type: 'button', class: 'nav-btn texto' }, 'Reiniciar datos y sesión');
    if (reiniciar) reiniciar.addEventListener('click', function () {
      var hecho = EST ? (motorApp.reiniciar(), Promise.resolve()) : reiniciarVivo();
      hecho.then(function () { botones.forEach(function (b) { b.setAttribute('aria-pressed', 'false'); }); descripcion.textContent = 'Datos y sesión reiniciados.'; anunciar('Datos y sesión reiniciados.'); return EST ? irEst('GET', pr.inicio, {}) : irVivo('GET', pr.inicio, {}); });
    });
    var abrir = EST ? null : h('a', { class: 'nav-btn texto', href: base, target: '_blank', rel: 'noopener' }, 'Abrir en otra pestaña ↗');

    setTimeout(function () { if (EST) irEst('GET', pr.inicio, {}); else { iframe.src = base + pr.inicio; } }, 0);
    actualizarBotones();

    return h('div', { class: 'proyecto' + (demo ? ' en-demo' : '') },
      demo ? null : h('div', { class: 'proyecto-cab' },
        h('h2', null, pr.titulo),
        h('p', null, !EST
          ? 'Esta es la aplicación original funcionando dentro de la página: cada clic, formulario y sesión los resuelve el servidor Java ahora mismo.'
          : motorApp ? 'Esta es la aplicación original funcionando dentro de la página: una réplica en JavaScript de los servlets Java (verificada contra Java) atiende cada clic, formulario y sesión en tu navegador.'
                     : 'Esta es la aplicación original dentro de la página. No cambia con los datos: sus páginas las generó Java al exportar el sitio.')),
      h(demo ? 'h2' : 'h3', { class: 'bloque-t' }, 'Casos de prueba'), chips, descripcion,
      EST && motorApp ? h('p', { class: 'nota-modo' }, 'Cada caso de prueba parte de datos nuevos. Lo que hagas se guarda solo en esta ventana y se pierde al cerrarla. El Java real se ejecuta con ./run.sh.') : null,
      h('div', { class: 'navegador' },
        h('div', { class: 'navegador-barra' }, bAtras, bAdel, bRec, bIni, url, abrir, reiniciar),
        iframe),
      !demo && pr.notas && pr.notas.length ? h('section', { class: 'adapt-proyecto', 'aria-label': 'Cómo se adaptó para verse en la web' },
        h('h3', { class: 'bloque-t' }, 'Cómo se adaptó para verse en la web'),
        h('ul', { class: 'lista-notas' }, pr.notas.map(function (n) { return h('li', null, n); }))) : null);
  }

  /* ---------- pestaña: ejecución ---------- */
  function panelEjecucion(f, ini) {
    var enDemo = !!ini;
    var motor = !!(EST && window.Motor && window.Motor.soporta(EST, f.id));
    var estatico = EST && !motor;
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
    function correr(idx, avisar) {
      vaciar(res).append(h('div', { class: 'cargando-res' }, 'Ejecutando en Java…'));
      ejecutar(f, f.campos.length ? valores() : {}, idx).then(function (r) {
        if (!r) throw new Error('sin datos');
        pintarResultado(res, r, f);
        if (avisar) {
          var v = (r.secciones || []).filter(function (x) { return x.tipo === 'veredicto'; })[0];
          anunciar('Resultado actualizado. ' + (v ? v.texto : (r.secciones || []).length + ' bloques de resultado.'));
        }
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
      correr(idx, true);
    }

    if (f.campos.length) {
      var form = h('form', { class: 'formulario', onsubmit: function (ev) {
        ev.preventDefault();
        if (!enDemo) abrirDemo(f.id, estatico ? { esc: String(activo) } : valores());
        if (!estatico) { botonesEsc.forEach(function (b) { b.setAttribute('aria-pressed', 'false'); }); correr(activo, true); }
      } });
      if (f.escenarios.length > 1) {
        var esc = h('div', { class: 'esc', role: 'group', 'aria-label': 'Casos de prueba' });
        f.escenarios.forEach(function (e, k) {
          var b = h('button', { type: 'button', 'aria-pressed': String(k === 0) }, e.nombre);
          b.addEventListener('click', function () { elegir(k); });
          botonesEsc.push(b); esc.append(b);
        });
        form.append(esc);
      }
      form.insertBefore(h('h2', null, f.escenarios.length > 1 ? 'Casos de prueba' : 'Parámetros'), form.firstChild);
      f.campos.forEach(function (c, k) {
        var id = 'c-' + f.id + '-' + k, input;
        if (c.tipo === 'select') input = h('select', { id: id }, c.opciones.map(function (o) { return h('option', { value: o }, o); }));
        else if (c.tipo === 'textarea') input = h('textarea', { id: id, spellcheck: 'false', rows: '6' });
        else input = h('input', { id: id, type: c.tipo, step: c.tipo === 'number' ? 'any' : null, autocomplete: 'off' });
        input.value = c.valor;
        if (estatico) input.disabled = true;
        input.addEventListener('input', function () { visibilidad(); botonesEsc.forEach(function (b) { b.setAttribute('aria-pressed', 'false'); }); });
        input.addEventListener('change', visibilidad);
        var fila = h('div', { class: 'campo' }, h('label', { for: id }, c.etiqueta), input, c.ayuda ? h('small', null, c.ayuda) : null);
        entradas[c.nombre] = { input: input, fila: fila };
        form.append(fila);
      });
      if (estatico) form.append(h('p', { class: 'aviso-estatico' }, 'Estos son los resultados que generó Java al exportar el sitio.'));
      if (motor) form.append(h('p', { class: 'nota-modo' }, 'Se ejecuta aquí, en tu navegador, con una réplica en JavaScript del código Java (verificada contra Java). El Java real se ejecuta con ./run.sh.'));
      if (!(estatico && enDemo)) form.append(h('button', { class: 'btn', type: 'submit' }, enDemo ? 'Actualizar la demostración' : 'Ver demostración ↗'));
      cont.append(form);
      visibilidad();
    }
    cont.append(res);
    setTimeout(function () {
      if (ini && ini.esc > 0 && f.escenarios[ini.esc]) { elegir(ini.esc); return; }
      if (ini && ini.valores && !estatico) {
        f.campos.forEach(function (c) { if (ini.valores[c.nombre] != null && entradas[c.nombre]) entradas[c.nombre].input.value = ini.valores[c.nombre]; });
        botonesEsc.forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
        visibilidad();
      }
      correr(0);
    }, 0);
    return cont;
  }

  /* ---------- pintar resultados ---------- */
  function pintarResultado(res, r, f) {
    vaciar(res).append(h('h2', { class: 'solo-lector' }, 'Resultados'));
    var secs = r.secciones || [];
    var consolaPrimero = !f.interactivo || secs.every(function (s) { return s.tipo === 'veredicto'; });
    var consola = r.consola && r.consola.trim() ? h('section', { class: 'res-sec' },
      h('div', { class: 'consola' },
        h('header', null, h('span', null, consolaPrimero ? 'salida de consola' : 'salida del programa original (main)'), h('span', null, 'System.out')),
        h('pre', { tabindex: '0', 'aria-label': 'Salida de consola' }, r.consola.replace(/\s+$/, '')))) : null;
    if (consolaPrimero && consola) res.append(consola);
    secs.forEach(function (s) {
      var fn = RENDER[s.tipo];
      if (!fn) return;
      var nodo = fn(s);
      res.append(h('section', { class: 'res-sec' }, s.titulo && s.tipo !== 'consulta' ? h('h3', null, s.titulo) : null, s.tipo === 'consulta' ? h('h3', null, s.titulo) : null, nodo));
    });
    if (!consolaPrimero && consola) res.append(consola);
    if (res.children.length <= 1) res.append(h('p', { class: 'vacio' }, 'Sin salida.'));
  }

  function celda(v) {
    if (v === null || v === undefined) return h('td', { class: 'nulo' }, 'NULL');
    var s = String(v);
    return h('td', { class: /^-?\d+([.,]\d+)?$/.test(s) ? 'num' : '' }, s);
  }
  function tabla(cols, filas, cap) {
    return h('div', { class: 'tabla-wrap' }, h('table', null, cap ? h('caption', { class: 'solo-lector' }, cap) : null,
      h('thead', null, h('tr', null, cols.map(function (c) { return h('th', { scope: 'col' }, c); }))),
      h('tbody', null, filas.map(function (fila) { return h('tr', null, fila.map(celda)); }))));
  }
  function sqlResaltado(sql) {
    var pre = h('pre', { class: 'sql', tabindex: '0', 'aria-label': 'Sentencia SQL' });
    Resaltado.lineas(sql, 'q.sql').forEach(function (ln, i) {
      if (i) pre.append('\n');
      ln.forEach(function (t) { pre.append(t[0] ? h('span', { class: 't-' + t[0] }, t[1]) : t[1]); });
    });
    return pre;
  }

  var RENDER = {
    tabla: function (s) { return tabla(s.columnas, s.filas, s.titulo); },
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
      else d.append(s.filas.length ? tabla(s.columnas, s.filas, s.titulo) : h('p', { class: 'nulo' }, 'La consulta no devuelve filas.'));
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
  var FRASE_REL = { herencia: ' hereda de ', realizacion: ' implementa ', asociacion: ' se asocia con ', agregacion: ' agrega a ',
    composicion: ' se compone de ', dependencia: ' depende de ', claseAsociacion: ' (clase de asociación) se une a ' };
  function descripcionUml(u) {
    var cl = h('ul'), rl = h('ul');
    u.clases.forEach(function (c) {
      var p = [c.titulo + ', ' + c.tipo];
      if (c.atributos.length) p.push('atributos: ' + c.atributos.join('; '));
      if (c.metodos.length) p.push('métodos: ' + c.metodos.join('; '));
      cl.append(h('li', null, p.join('. ') + '.'));
    });
    u.relaciones.forEach(function (r) { rl.append(h('li', null, r.de + (FRASE_REL[r.tipo] || ' se relaciona con ') + r.a + (r.etiqueta ? ' (' + r.etiqueta + ')' : '') + '.')); });
    return h('details', { class: 'qa alt-uml' }, h('summary', null, 'Descripción textual del diagrama (para lectores de pantalla)'),
      h('div', { class: 'alt-cuerpo' }, h('h2', null, 'Clases'), cl, h('h2', null, 'Relaciones'), rl.children.length ? rl : h('p', null, 'No hay relaciones entre estas clases.')));
  }
  function panelDiagrama(f) {
    var tipos = {};
    f.uml.relaciones.forEach(function (r) { tipos[r.tipo] = true; });
    return h('div', null,
      h('div', { class: 'uml-scroll' }, Uml.dibujar(f.uml, { titulo: 'Diagrama de clases de ' + f.titulo })),
      h('div', { class: 'leyenda' }, Object.keys(tipos).map(function (t) { return h('span', null, LEYENDA[t] || t); })),
      descripcionUml(f.uml),
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

  /* ---------- ventana de demostración ---------- */
  function pintarDemo(id, params) {
    principal.replaceChildren(h('p', { class: 'cargando' }, 'Preparando la demostración…'));
    getFicha(id).then(function (f) {
      document.title = 'Demostración: ' + f.titulo + ' · ' + info.nombre;
      var valores = {};
      Object.keys(params).forEach(function (k) { if (k !== 'esc') valores[k] = params[k]; });
      var esc = parseInt(params.esc, 10);
      var cuerpo = f.proyecto ? panelProyecto(f, { demo: true })
                              : panelEjecucion(f, { valores: Object.keys(valores).length ? valores : null, esc: isNaN(esc) ? 0 : esc });
      var cerrar = h('button', { type: 'button', class: 'btn sec' }, 'Cerrar');
      cerrar.addEventListener('click', function () {
        window.close();
        setTimeout(function () { location.hash = '#/ej/' + f.id; }, 150);   // si la ventana no se puede cerrar, volver al ejercicio
      });
      principal.replaceChildren(
        h('div', { class: 'demo-barra' },
          h('div', { class: 'demo-tit' }, h('span', { class: 'etq uf' }, 'Demostración'), h('h1', null, f.titulo)),
          h('div', { class: 'demo-acc' },
            h('a', { class: 'btn sec', href: '#/ej/' + f.id + '/codigo' }, 'Ver el código'),
            h('a', { class: 'btn sec', href: '#/ej/' + f.id }, 'Página del ejercicio'), cerrar)),
        h('div', { class: 'demo-cuerpo' }, cuerpo));
      foco();
    }).catch(function () { principal.replaceChildren(h('p', { class: 'vacio' }, 'No se pudo preparar la demostración.')); });
  }

  /* ---------- autoría y marca ---------- */
  function pintarMarca() {
    var m = info.marca;
    document.title = 'Autoría y marca · ' + info.nombre;
    function filas(pares) {
      var dl = h('dl', { class: 'kv' });
      pares.forEach(function (p) { dl.append(h('dt', null, p[0]), h('dd', null, p[1])); });
      return dl;
    }
    principal.replaceChildren(
      h('a', { class: 'volver', href: '#/' }, '← Portafolio'),
      h('header', { class: 'marca-cab' },
        h('div', null,
          h('p', { class: 'kicker' }, 'Autoría'),
          h('h1', null, 'Autoría y marca'),
          h('p', { class: 'lead' }, 'Este portafolio es obra de ' + info.autora + ' y se publica bajo la marca registrada ' + m.nombre + '.')),
        h('div', { class: 'placa-logo' }, h('img', { src: 'img/poo-object-lab.png', alt: info.nombre + '. ' + info.lema, width: '240', height: '271' }))),
      h('section', { class: 'res-sec', 'aria-labelledby': 'h-proyecto' }, h('h2', { class: 'bloque-t', id: 'h-proyecto' }, 'El proyecto'),
        filas([['Nombre', info.nombre], ['Lema', info.lema], ['Autoría', info.autora], ['Formación', info.formacion]])),
      h('section', { class: 'res-sec', 'aria-labelledby': 'h-marca' }, h('h2', { class: 'bloque-t', id: 'h-marca' }, 'Marca registrada'),
        filas([['Marca', m.nombre], ['Marca n.º', m.numero], ['Titular', m.titular], ['Tipo de distintivo', m.distintivo], ['Modalidad', m.modalidad],
          ['Fecha de presentación', m.presentacion], ['Fecha de concesión', m.concesion], ['Oficina', m.oficina], ['Normativa', m.ley],
          ['Vigencia indicada en el título', m.vigencia], ['Clase', m.clase + ' (servicios científicos y tecnológicos)']])),
      h('details', { class: 'qa servicios' }, h('summary', null, 'Servicios protegidos (clase ' + m.clase + ')'),
        h('ul', null, m.servicios.map(function (x) { return h('li', null, x); }))),
      h('p', { class: 'nota-marca' }, 'Datos transcritos del título de registro de marca expedido por la Oficina Española de Patentes y Marcas.'));
    foco();
  }

  /* ---------- arranque ---------- */
  cargarBase().then(function () { iniciarCabecera(); ruta(); }).catch(function () {
    principal.replaceChildren(h('p', { class: 'vacio' }, 'No se pudo conectar con el servidor Java. Arráncalo con ./run.sh y recarga la página.'));
  });
})();
