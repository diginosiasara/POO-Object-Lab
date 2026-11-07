/* Motor del navegador (3/3): laboratorio SQL, aplicaciones de muestra y API pública (window.Motor). */
(function (global) {
  'use strict';
  var M = global.__MotorInterno, E = M.E, APPS = M.APPS, esc = M.esc, jd = M.jd, txt = M.txt, ent = M.ent, f2 = M.f2, res = M.res, base = M.base, D = M.D;

  /* ===================== motor SQL (sql.js: SQLite compilado a WebAssembly) ===================== */
  var SQLJS = null;
  function cargarSql() {
    if (SQLJS) return Promise.resolve(SQLJS);
    return new Promise(function (ok, ko) {
      if (global.initSqlJs) return ok();
      var s = document.createElement('script');
      s.src = 'js/sql-wasm-inline.js'; s.onload = ok;
      s.onerror = function () { ko(new Error('No se pudo cargar el motor SQL del navegador.')); };
      document.head.appendChild(s);
    }).then(function () { return global.initSqlJs(); }).then(function (SQL) { SQLJS = SQL; return SQL; });
  }
  function crearBiblioteca(SQL) {
    var db = new SQL.Database();
    db.run('PRAGMA foreign_keys = ON;');
    db.run(D.biblioteca[0].replace(/INT AUTO_INCREMENT PRIMARY KEY/g, 'INTEGER PRIMARY KEY AUTOINCREMENT'));
    db.run(D.biblioteca[1]);
    return db;
  }
  var PROHIBIDO = /\b(file_read|file_write|csvread|csvwrite|link_schema|runscript|script|shutdown|call|sleep|java|alias|create|drop|alter|grant|insert|update|delete|merge|truncate|set|pragma|attach|detach|load_extension|vacuum|recursive)\b/i;
  function sqlLibre(sql) {
    var s = (sql == null ? '' : String(sql)).trim();
    if (s.slice(-1) === ';') s = s.slice(0, -1).trim();
    if (s === '') throw new Error('Escribe una consulta SELECT.');
    if (s.length > 600) throw new Error('La consulta es demasiado larga (máximo 600 caracteres).');
    if (s.indexOf(';') >= 0) throw new Error('Solo se admite una sentencia.');
    if (!/^\s*(select|with)\b/i.test(s)) throw new Error('Solo se permiten consultas SELECT.');
    if (PROHIBIDO.test(s)) throw new Error('La consulta contiene una palabra no permitida en este laboratorio.');
    return s;
  }
  /** Ejecuta un SELECT y devuelve {cols, filas} con el mismo formato que JDBC/H2 (etiquetas en mayúsculas, valores como texto). */
  function consultar(db, sql, limite) {
    var st = db.prepare(sql), cols = st.getColumnNames().map(function (c) { return c.toUpperCase(); }), filas = [];
    try {
      while (st.step() && (!limite || filas.length < limite)) {
        filas.push(st.get().map(function (v, i) {
          if (v == null) return null;
          if (cols[i] === 'DEVUELTO') return v ? 'TRUE' : 'FALSE';
          if (typeof v === 'number' && /AVG|MEDIA|PROM/.test(cols[i])) return jd(v);
          return String(v);
        }));
      }
    } finally { st.free(); }
    return { cols: cols, filas: filas };
  }
  function sqlSqlite(sql) { return sql.replace(/DATE\s+'/g, "'"); }

  E.uf2405_ud7a1 = function (p, c) {
    return cargarSql().then(function (SQL) {
      var db = crearBiblioteca(SQL), r = res('');
      try {
        if (txt(p, 'modo').indexOf('Mi propia') === 0) {
          try {
            var s = sqlLibre(p.sql);
            db.run('PRAGMA query_only = 1;');
            var q = consultar(db, s, 200);
            r.veredicto(true, q.filas.length + ' fila(s) devuelta(s).');
            r.consulta('Tu consulta', String(p.sql).trim(), q.cols, q.filas, '');
          } catch (e) { r.veredicto(false, e.message); }
          var t = (c.est.resultados['uf2405_ud7a1#1'] || { secciones: [] }).secciones.filter(function (x) { return x.titulo === 'Tablas disponibles'; })[0];
          if (t) r.tabla(t.titulo, t.columnas, t.filas);
          return r.o;
        }
        (c.base.secciones || []).forEach(function (s) {
          if (s.tipo !== 'consulta') return;
          if (/^SELECT/.test(s.sql)) { var q = consultar(db, sqlSqlite(s.sql)); r.consulta(s.titulo, s.sql, q.cols, q.filas, ''); }
          else { db.run(sqlSqlite(s.sql)); r.consulta(s.titulo, s.sql, [], [], db.getRowsModified() + ' fila(s) afectada(s)'); }
        });
        return r.o;
      } finally { db.close(); }
    });
  };

  /* ===================== aplicaciones de muestra (servlets en JavaScript) ===================== */
  function html(h) { return { codigo: 200, html: h }; }
  function redir(u) { return { ubicacion: u }; }
  function texto(codigo, t) { return { codigo: codigo, html: t }; }
  function plantilla(pre, nombre) { return (pre.recursos || {})[nombre] || ''; }

  /* --- UD2-A1: librería --- */
  APPS.uf2405_ud2a1 = function () {
    return function (metodo, ruta, p) {
      if (ruta !== 'catalogo' || metodo !== 'GET') return null;
      var max = txt(p, 'precioMax') === '' ? null : (function () { var s = txt(p, 'precioMax').replace(/,/g, '.'); return /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(s) ? parseFloat(s) : Number.MAX_VALUE; })();
      var desc = Math.max(0, Math.min(90, ent(p, 'descuento', 0)));
      var o = "<!DOCTYPE html>\n<html><head><title>Catálogo de Libros</title>\n<link rel='stylesheet' href='css/estilos.css'>\n</head><body>\n"
        + "<div class='container'>\n<h2>📚 Catálogo de la Librería</h2>\n<table class='tabla-libros'>\n"
        + '<thead><tr><th>ID</th><th>Título</th><th>Autor</th><th>Precio</th></tr></thead>\n<tbody>\n';
      M.listarLibros(max, desc).forEach(function (l) {
        o += '<tr>\n<td>' + l[0] + '</td>\n<td><strong>' + esc(l[1]) + '</strong></td>\n<td>' + esc(l[2]) + '</td>\n<td>' + f2(l[3]) + ' €</td>\n</tr>\n';
      });
      return html(o + "</tbody></table>\n<a href='index.html' class='btn'>Volver al inicio</a>\n</div></body></html>\n");
    };
  };

  /* --- UD2-A2: login --- */
  APPS.uf2405_ud2a2 = function (pre) {
    return function (metodo, ruta, p, ses) {
      if (ruta === 'login.jsp') return html(M.jsp(plantilla(pre, 'login.jsp'), {}));
      if (ruta === 'error.jsp') return html(M.jsp(plantilla(pre, 'error.jsp'), {}));
      if (ruta === 'bienvenida.jsp') {
        if (!ses.usuario) return redir('login.jsp');
        var vista = plantilla(pre, 'bienvenida.jsp').replace('<a href="login.jsp" class="btn">🚪 Cerrar Sesión</a>', '<a href="LoginServlet?accion=salir" class="btn">🚪 Cerrar Sesión</a>');
        return html(M.jsp(vista, { usuario: ses.usuario }));
      }
      if (ruta === 'LoginServlet') {
        if (metodo === 'POST') {
          var user = p.username == null ? '' : String(p.username), pass = p.password == null ? '' : String(p.password);
          if (M.autenticar(user, pass)) { ses.usuario = M.usuarioDe(user); return redir('bienvenida.jsp'); }
          return redir('error.jsp');
        }
        if (p.accion === 'salir') { delete ses.usuario; return redir('login.jsp'); }
        return texto(405, 'HTTP 405 – LoginServlet solo acepta peticiones POST');
      }
      return null;
    };
  };

  /* --- UD4-A1: scripts PHP en Java --- */
  function getParam(v, def) { return v == null || String(v).trim() === '' ? def : String(v).trim(); }
  APPS.uf2405_ud4a1 = function () {
    var B = D.ud4a1;
    function campo(et, tipo, nombre, extra, v, req) {
      return '        <label>' + et + ' <input type="' + tipo + '" name="' + nombre + '" ' + extra + ' value="' + esc(v[nombre]) + '"' + (req ? ' required' : '') + '></label>\n';
    }
    return function (metodo, ruta, p, ses, est) {
      var st = est();
      if (ruta === 'index') return html(B[0]);
      if (ruta === 'ejercicio1_listado') {
        var o = B[1];
        st.empresas.forEach(function (f) {
          o += '\t<tr>\n';
          f.forEach(function (col) { o += '\t\t<td>' + esc(col) + '</td>\n'; });
          o += "\t\t<td><form method='post' action='ejercicio2_eliminar' style='display:inline'><input type='hidden' name='id' value='" + esc(f[0]) + "'><input type='hidden' name='action' value='del'>"
            + "<button type='submit' style='background:none;border:0;padding:0;font:inherit;color:#0000ee;text-decoration:underline;cursor:pointer'>Eliminar</button></form></td>\n\t</tr>\n";
        });
        return html(o + '</table>\n</body>\n</html>\n');
      }
      if (ruta === 'ejercicio2_eliminar') {
        var id = getParam(p.id, '-1'), accion = getParam(p.action, '');
        if (metodo === 'POST' && accion === 'del') {
          var m = /^[+-]?\d+/.exec(id), n = m ? parseInt(m[0], 10) : 0;
          st.empresas = st.empresas.filter(function (e) { return e[0] !== n; });
          return redir('ejercicio1_listado');
        }
        return html('Peticion no valida. (El borrado solo se acepta por POST.)');
      }
      if (ruta === 'ejercicio3_insertar') {
        var v = { nombre: '', apellidos: '', direccion: '', telefono: '', edad: '', altura: '' }, mensaje = '', error = '';
        if (metodo === 'POST') {
          Object.keys(v).forEach(function (k) { v[k] = getParam(p[k], ''); });
          var altura = v.altura.replace(/,/g, '.');
          if (v.nombre === '' || v.apellidos === '') error = 'El nombre y los apellidos son obligatorios.';
          else if (v.edad !== '' && !/^\d+$/.test(v.edad)) error = 'La edad debe ser un numero entero.';
          else if (altura !== '' && !/^\d+(\.\d+)?$/.test(altura)) error = 'La altura debe ser un numero, por ejemplo 1.75';
          if (error === '') {
            if (altura !== '' && parseFloat(altura) >= 10) error = 'Error al insertar: valor fuera de rango para la columna altura';
            else {
              st.agenda.push([st.sigA++, v.nombre, v.apellidos, v.telefono, v.edad === '' ? null : parseInt(v.edad, 10), altura === '' ? null : parseFloat(parseFloat(altura).toFixed(2)), v.direccion]);
              mensaje = 'Los datos han sido insertados en la base de datos correctamente.';
              Object.keys(v).forEach(function (k) { v[k] = ''; });
            }
          }
        }
        var o3 = B[2];
        if (mensaje) o3 += '    <p class="ok">' + esc(mensaje) + '</p>\n';
        if (error) o3 += '    <p class="err">' + esc(error) + '</p>\n';
        o3 += '    <form method="post" action="ejercicio3_insertar">\n'
          + campo('Nombre *', 'text', 'nombre', 'maxlength="50"', v, true) + campo('Apellidos *', 'text', 'apellidos', 'maxlength="100"', v, true)
          + campo('Direccion', 'text', 'direccion', 'maxlength="255"', v, false) + campo('Telefono', 'text', 'telefono', 'maxlength="20"', v, false)
          + campo('Edad', 'number', 'edad', 'min="0" max="150"', v, false) + campo('Altura (m)', 'text', 'altura', 'placeholder="1.75"', v, false)
          + '        <button type="submit">Insertar</button>\n    </form>\n    <h3>Contenido actual de la agenda</h3>\n    <table>\n'
          + '        <tr><th>ID</th><th>Nombre</th><th>Apellidos</th><th>Direccion</th><th>Telefono</th><th>Edad</th><th>Altura</th></tr>\n';
        st.agenda.slice().reverse().forEach(function (a) {
          o3 += '        <tr>\n            ';
          [a[0], a[1], a[2], a[6], a[3], a[4], a[5] == null ? null : a[5].toFixed(2)].forEach(function (col) { o3 += '<td>' + esc(col) + '</td>'; });
          o3 += '\n        </tr>\n';
        });
        return html(o3 + '    </table>\n</body>\n</html>\n');
      }
      return null;
    };
  };

  /* --- UD5-A1: gestor de personas --- */
  APPS.uf2405_ud5a1 = function (pre) {
    function vista(a) { return html(M.jsp(plantilla(pre, 'webresultado.jsp'), a)); }
    function objs(l) { return l.map(function (x) { return { id: x[0], nombre: x[1], apellidos: x[2] }; }); }
    return function (metodo, ruta, p, ses, est) {
      var st = est();
      if (ruta === 'index.jsp') return html(M.jsp(plantilla(pre, 'index.jsp'), {}));
      if (ruta === 'webresultado.jsp') return vista({});
      if (ruta !== 'Personas') return null;
      if (metodo === 'POST') {
        if ((p.accion || '') === 'agregar') {
          if (!M.nombreValido(p.nombre) || !M.nombreValido(p.apellidos)) return vista({ error: 'Error al agregar: nombre y apellidos solo pueden llevar letras, espacios, apóstrofos o guiones.' });
          M.personasAgregar(st, p.nombre, p.apellidos);
          return redir('Personas?accion=listar');
        }
        return vista({});
      }
      var accion = p.accion ? p.accion : 'listar';
      if (accion === 'buscar') {
        if (!M.inicialValida(p.inicial)) return vista({ error: 'Error: la inicial debe ser una sola letra.' });
        return vista({ personas: objs(M.personasBuscar(st, p.inicial)), titulo: "Personas que empiezan por '" + p.inicial + "'" });
      }
      if (accion === 'contar') return vista({ mensaje: 'Total de personas: ' + st.personas.length });
      return vista({ personas: objs(M.personasListar(st)), titulo: 'Listado de Personas' });
    };
  };

  /* --- UD6-A1: contactos --- */
  APPS.uf2405_ud6a1 = function (pre) {
    function vista(l) { return html(M.jsp(plantilla(pre, 'index.jsp'), l ? { listaContactos: l.map(function (x) { return { id: x[0], nombre: x[1], apellidos: x[2], edad: x[3] }; }) } : {})); }
    return function (metodo, ruta, p, ses, est) {
      var st = est();
      if (ruta === 'index.jsp' && metodo === 'GET') return vista(null);
      if (ruta !== 'contactos') return null;
      if (metodo === 'POST') {
        var nombre = txt(p, 'nombre'), apellidos = txt(p, 'apellidos'), edad = ent(p, 'edad', -1);
        if (nombre === '' || apellidos === '' || edad < 0 || edad > 120) return texto(400, 'HTTP 400 – Nombre y apellidos obligatorios y edad entre 0 y 120');
        st.contactos.push([st.sig++, nombre, apellidos, edad]);
        return redir('contactos');
      }
      var min = txt(p, 'edadMin');
      if (/^\d{1,3}$/.test(min)) return vista(st.contactos.filter(function (x) { return x[3] >= parseInt(min, 10); }).sort(function (a, b) { return a[3] - b[3]; }));
      return vista(st.contactos.slice().sort(function (a, b) { return a[0] - b[0]; }));
    };
  };

  /* --- UD7-A1: consola SQL --- */
  APPS.uf2405_ud7a1 = function (pre, EST) {
    var consultas = ((EST.resultados['uf2405_ud7a1#0'] || { secciones: [] }).secciones || []).filter(function (s) { return s.tipo === 'consulta'; });
    var COMPROBACION = { 1: 'SELECT * FROM Estudiante ORDER BY IdLector', 5: 'SELECT * FROM Autor ORDER BY IdAutor', 7: 'SELECT * FROM Autor ORDER BY IdAutor' };
    var B = D.ud7a1;
    function tabla(cols, filas) {
      var o = '<table><thead><tr>';
      cols.forEach(function (c) { o += '<th>' + esc(c) + '</th>'; });
      o += '</tr></thead><tbody>';
      filas.forEach(function (f) { o += '<tr>'; f.forEach(function (v) { o += '<td>' + (v == null ? '<em>NULL</em>' : esc(v)) + '</td>'; }); o += '</tr>'; });
      return o + "</tbody></table><p class='pie'>" + filas.length + ' fila(s)</p>';
    }
    function sqlBloque(s) { return "<pre class='sql'>" + esc(s) + '</pre>'; }
    function pagina(resultado, sqlInicial) {
      var li = '';
      consultas.forEach(function (c, i) { li += '<li><a href="ejecutar?n=' + (i + 1) + '">' + esc(c.titulo) + '</a></li>'; });
      return B[0] + li + B[1] + esc(sqlInicial) + B[2] + (resultado === '' ? "<p class='pie'>Elige una consulta o escribe la tuya.</p>" : resultado) + B[3];
    }
    return function (metodo, ruta, p) {
      if (ruta === 'index.html') return html(pagina('', 'SELECT Nombre, Carrera, Edad\nFROM Estudiante\nWHERE Edad > 22\nORDER BY Edad'));
      if (ruta !== 'ejecutar') return null;
      return cargarSql().then(function (SQL) {
        var db = crearBiblioteca(SQL);
        try {
          if (metodo === 'POST') {
            var sql = p.sql == null ? '' : String(p.sql);
            try {
              var s = sqlLibre(sql); db.run('PRAGMA query_only = 1;');
              var q = consultar(db, s, 200);
              return html(pagina('<h2>Resultado</h2>' + sqlBloque(sql) + tabla(q.cols, q.filas), sql));
            } catch (e) { return html(pagina('<h2>Resultado</h2>' + sqlBloque(sql) + "<p class='err'>" + esc(e.message) + '</p>', sql)); }
          }
          var n = /^\d+$/.test(txt(p, 'n')) ? parseInt(txt(p, 'n'), 10) : 0;
          if (n < 1 || n > consultas.length) return texto(404, '404 – No existe esa consulta');
          var c = consultas[n - 1], enun = c.titulo.replace(/^\d+\.\s/, '');
          var cuerpo = '<h2>Consulta ' + n + '</h2><p>' + esc(enun) + '</p>' + sqlBloque(c.sql);
          if (/^SELECT/.test(c.sql)) { var r1 = consultar(db, sqlSqlite(c.sql)); cuerpo += tabla(r1.cols, r1.filas); }
          else {
            db.run(sqlSqlite(c.sql));
            cuerpo += "<p class='ok'>" + db.getRowsModified() + ' fila(s) afectada(s)</p>';
            if (COMPROBACION[n]) { var r2 = consultar(db, COMPROBACION[n]); cuerpo += '<h3>Estado de la tabla después</h3>' + tabla(r2.cols, r2.filas); }
          }
          return html(pagina(cuerpo, c.sql));
        } finally { db.close(); }
      });
    };
  };

  /* ===================== API pública ===================== */
  var estados = {};
  function estadoDe(id) { if (!estados[id]) estados[id] = M.SEEDS[id] ? M.SEEDS[id]() : {}; return estados[id]; }
  function fusionar(f, params) {
    var p = {};
    (f.campos || []).forEach(function (c) { p[c.nombre] = c.valor; });
    Object.keys(params || {}).forEach(function (k) { if (k in p) p[k] = params[k] == null ? '' : String(params[k]); });
    return p;
  }
  function normalizar(r) { var n = String(r).replace(/^(\.\/|\/)+/, ''); return n; }
  function consulta(d) {
    var o = {}, i = d.indexOf('?');
    if (i < 0) return o;
    d.slice(i + 1).split('&').forEach(function (par) {
      if (!par) return;
      var j = par.indexOf('='), dec = function (x) { try { return decodeURIComponent(x.replace(/\+/g, ' ')); } catch (e) { return x; } };
      o[dec(j < 0 ? par : par.slice(0, j))] = j < 0 ? '' : dec(par.slice(j + 1));
    });
    return o;
  }
  function clave(m, d, ps) {
    var q = consulta(d), k;
    for (k in ps) q[k] = ps[k];
    return m + '|' + normalizar(d.split('?')[0]) + '|' + Object.keys(q).sort().map(function (x) { return x + '=' + q[x]; }).join('&');
  }

  global.Motor = {
    /** ¿Puede el navegador ejecutar este ejercicio con datos propios? */
    soporta: function (EST, id) { var f = EST && EST.fichas && EST.fichas[id]; return !!(f && f.campos && f.campos.length && E[id]); },
    ejecutar: function (EST, id, params) {
      var f = EST.fichas[id], ctx = { base: EST.resultados[id + '#0'], est: EST, ficha: f, estado: function () { return estadoDe(id); } };
      try { return Promise.resolve(E[id](fusionar(f, params), ctx)); } catch (e) { return Promise.reject(e); }
    },
    reiniciar: function (id) { delete estados[id]; },
    /** ¿Tiene esta aplicación lógica propia en el navegador? (las demás usan las páginas precalculadas por Java) */
    tieneApp: function (id) { return !!APPS[id]; },
    crearApp: function (EST, id) {
      var pre = (EST.apps && EST.apps[id]) || { paginas: {}, recursos: {} }, ses = {};
      var handler = APPS[id] ? APPS[id](pre, EST) : null;
      function paso(m, d, ps, n) {
        var q = consulta(d), todos = {}, k;
        for (k in q) todos[k] = q[k];
        for (k in ps) todos[k] = ps[k];
        var ruta = normalizar(d.split('?')[0]), r = null;
        try { r = handler ? handler(m, ruta, todos, ses, function () { return estadoDe(id); }) : null; } catch (e) { return Promise.reject(e); }
        return Promise.resolve(r).then(function (r) {
          if (!r) { var pc = pre.paginas[clave(m, d, ps)]; return pc ? { ruta: pc.ruta, codigo: pc.codigo, html: pc.html } : null; }
          if (r.ubicacion) return n > 5 ? null : paso('GET', r.ubicacion, {}, n + 1);
          return { ruta: ruta, codigo: r.codigo || 200, html: r.html };
        });
      }
      return {
        ir: function (m, d, ps) { return paso(m, d, ps || {}, 0); },
        reiniciar: function () { ses = {}; delete estados[id]; }
      };
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
