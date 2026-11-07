/* Motor del navegador (2/3): ejercicios de UF2405. Réplica en JavaScript de las fichas Java. */
(function (global) {
  'use strict';
  var M = global.__MotorInterno, E = M.E, esc = M.esc, jd = M.jd, txt = M.txt, ent = M.ent, dec = M.dec, f2 = M.f2, sha256 = M.sha256;
  var res = M.res, paso = M.paso, cp = M.cp, PRES = M.PRES, NEG = M.NEG, DAT = M.DAT, base = M.base, D = M.D;

  /* ------------- estado inicial de las bases de datos en memoria (como los reiniciar() de los DAO) ------------- */
  M.SEEDS = {
    uf2405_ud3a1: function () { return { sig: 3, tareas: [{ id: 1, titulo: 'Leer el enunciado', descripcion: 'Identificar los seis fragmentos', completada: true }, { id: 2, titulo: 'Clasificar los fragmentos', descripcion: 'Cliente o servidor', completada: false }] }; },
    uf2405_ud4a1: function () { return { sigE: 4, sigA: 1, empresas: [[1, 'Textiles del Sur', 'C/ Real 12'], [2, 'Ferretería Norte', 'Av. Mar 3'], [3, 'Cafés Vega', 'Plaza Mayor 1']], agenda: [] }; },
    uf2405_ud5a1: function () { return { sig: 6, personas: [[1, 'Ana', 'García López'], [2, 'Alberto', 'Ruiz Díaz'], [3, 'Beatriz', 'Moreno Sanz'], [4, 'Carlos', 'Vega Torres'], [5, 'Álvaro', 'Núñez Gil']] }; },
    uf2405_ud6a1: function () { return { sig: 5, contactos: [[1, 'Laura', 'Gómez Ruiz', 17], [2, 'Mario', 'Santos Peña', 25], [3, 'Elena', 'Cano Vidal', 34], [4, 'Hugo', 'Reyes Mora', 52]] }; }
  };

  /* ------------- Html.pagina de Java ------------- */
  function paginaHtml(titulo, cuerpo) {
    return '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>' + esc(titulo) + '</title><style>'
      + 'body{font:15px/1.5 system-ui,sans-serif;margin:0;padding:20px;color:#1a2433;background:#fff}'
      + 'h2{margin:0 0 12px;font-size:20px}table{border-collapse:collapse;width:100%}'
      + 'th,td{border:1px solid #c9d3df;padding:6px 10px;text-align:left}th{background:#eef2f7}'
      + 'ul{padding-left:20px}.ok{color:#14733a}.err{color:#b3261e}.btn{display:inline-block;margin-top:12px;color:#1f5fbf}'
      + '</style></head><body>' + cuerpo + '</body></html>';
  }
  M.paginaHtml = paginaHtml;

  /* ------------- UD2-A1: librería ------------- */
  var LIBROS = [[1, 'El Quijote', 'Miguel de Cervantes', 15.50], [2, '1984', 'George Orwell', 12.00], [3, 'Cien años de soledad', 'García Márquez', 18.90]];
  /** LibroService.listarLibros(precioMax, descuento) */
  function listarLibros(max, desc) {
    var out = [];
    LIBROS.forEach(function (l) {
      if (max != null && l[3] > max) return;
      out.push([l[0], l[1], l[2], Math.floor(l[3] * (100 - desc) + 0.5) / 100]);
    });
    return out;
  }
  M.listarLibros = listarLibros;

  E.uf2405_ud2a1 = function (p) {
    var max = txt(p, 'precioMax') === '' ? null : dec(p, 'precioMax', 0), desc = Math.max(0, Math.min(90, ent(p, 'descuento', 0)));
    var libros = listarLibros(max, desc), filas = '';
    libros.forEach(function (l) { filas += '<tr><td>' + l[0] + '</td><td><strong>' + esc(l[1]) + '</strong></td><td>' + esc(l[2]) + '</td><td>' + f2(l[3]) + ' €</td></tr>'; });
    if (!libros.length) filas = '<tr><td colspan="4">Ningún libro cumple la regla de negocio.</td></tr>';
    var cuerpo = '<h2>Catálogo de la librería</h2><table><thead><tr><th>ID</th><th>Título</th><th>Autor</th><th>Precio</th></tr></thead><tbody>' + filas + '</tbody></table>';
    return res('').capas('La petición baja por las tres capas', [
      cp(PRES, 'LibroControlador.doGet()', 'GET /catalogo → solicita los libros al servicio'),
      cp(NEG, 'LibroService.listarLibros()', 'Regla de negocio: precio máximo ' + (max == null ? 'sin límite' : jd(max) + ' €') + ', descuento ' + desc + ' %'),
      cp(DAT, 'LibroDAO.obtenerCatalogo()', 'SELECT id, titulo, autor, precio FROM libros')])
      .pagina('Lo que ve el usuario', paginaHtml('Catálogo de libros', cuerpo)).o;
  };

  /* ------------- UD2-A2: login por capas ------------- */
  var USUARIOS = [{ username: 'admin', hash: sha256('1234'), nombreCompleto: 'Administrador del Sistema', rol: 'ADMIN' },
                  { username: 'usuario', hash: sha256('pass'), nombreCompleto: 'Usuario Normal', rol: 'USER' }];
  M.USUARIOS_LOGIN = USUARIOS;
  M.autenticar = function (user, pass) {
    var intento = sha256(pass);
    return USUARIOS.some(function (u) { return u.username === user && u.hash === intento; });
  };
  M.usuarioDe = function (user) { return USUARIOS.filter(function (u) { return u.username === user; })[0] || null; };

  E.uf2405_ud2a2 = function (p) {
    var user = txt(p, 'usuario'), pass = p.password == null ? '' : String(p.password), error = null;
    if (user === '' || pass.trim() === '') error = 'Por favor, completa todos los campos.';
    else if (pass.length < 4) error = 'La contraseña debe tener al menos 4 caracteres.';
    var tr = [];
    if (error) {
      tr.push(cp(PRES, 'LoginControlador.validar()', 'Rechazado antes de llegar al servicio'));
      return res('').veredicto(false, error).capas('Recorrido de la petición', tr).o;
    }
    tr.push(cp(PRES, 'LoginControlador.doPost()', 'POST /login con los datos del formulario'));
    tr.push(cp(NEG, 'LoginService.autenticar()', 'Regla: usuario y contraseña deben coincidir con un registro'));
    tr.push(cp(DAT, 'UsuarioDAO.validarCredenciales()', 'Busca el usuario y compara hashes SHA-256 (tiempo constante)'));
    var u = null;
    if (M.autenticar(user, pass)) {
      tr.push(cp(NEG, 'LoginService.obtenerDatosUsuario()', 'Pide los datos del usuario ya autenticado'));
      tr.push(cp(DAT, 'UsuarioDAO.buscarPorUsername()', 'Recupera los datos del usuario'));
      tr.push(cp(PRES, 'Sesión', 'Guarda el usuario en la sesión y redirige a bienvenida'));
      u = M.usuarioDe(user);
    } else tr.push(cp(PRES, 'Redirección', 'Credenciales incorrectas → error'));
    var r = res('').capas('Recorrido de la petición', tr);
    if (!u) return r.veredicto(false, 'Credenciales incorrectas: se redirige a error.jsp.').o;
    var kv = {};
    kv['Usuario'] = u.username; kv['Nombre completo'] = u.nombreCompleto; kv['Rol'] = u.rol; kv['Hash guardado (SHA-256)'] = u.hash;
    return r.veredicto(true, 'Acceso concedido: se redirige a bienvenida.jsp.').kv('Datos de la sesión', kv).o;
  };

  /* ------------- UD3-A1: clasificador de lenguajes + tareas ------------- */
  var LENG = (D.clasificador || []).map(function (l) {
    return { nombre: l.nombre, lado: l.lado, ext: l.ext, huellas: l.huellas.map(function (h) { return { re: new RegExp(h.rx, h.flags), peso: h.peso, desc: h.desc }; }) };
  });
  function analizar(codigo) {
    var out = [];
    LENG.forEach(function (l) {
      var pts = 0, hs = [];
      l.huellas.forEach(function (h) { if (h.re.test(codigo)) { pts += h.peso; hs.push(h.desc + ' (+' + h.peso + ')'); } });
      if (pts > 0) out.push({ lenguaje: l.nombre, lado: l.lado, ext: l.ext, puntos: pts, huellas: hs });
    });
    return out.sort(function (a, b) { return b.puntos - a.puntos; });
  }
  M.analizar = analizar;
  function fragmentos(c) {
    var f = c.ficha, m = {};
    (f.escenarios || []).forEach(function (e) { if (e.nombre.indexOf('Fragmento ') === 0) m[e.nombre.slice(10)] = e.parametros.fragmento; });
    (f.campos || []).forEach(function (k) { if (k.nombre === 'fragmento') m.PHP = k.valor; });
    return ['JSP', 'Python', 'PHP', 'JavaScript', 'HTML', 'ASP'].map(function (n) { return [n, m[n] || '']; });
  }

  E.uf2405_ud3a1 = function (p, c) {
    var st = c.estado(), r = res('');
    if (txt(p, 'accion').indexOf('Añadir') === 0) {
      var titulo = p.titulo == null ? '' : String(p.titulo).trim(), creada = titulo !== '';
      if (creada) { st.tareas.push({ id: st.sig++, titulo: titulo, descripcion: p.descripcion == null ? '' : String(p.descripcion).trim(), completada: false }); }
      r.veredicto(creada, creada ? 'Tarea creada con PreparedStatement.' : 'No se crea una tarea sin título.');
    } else {
      var d = analizar(p.fragmento == null ? '' : String(p.fragmento));
      if (!d.length) r.veredicto(false, 'No se ha encontrado ninguna huella conocida.');
      else {
        r.veredicto(true, d[0].lenguaje + ' · se ejecuta en el ' + d[0].lado.toLowerCase() + ' · extensión ' + d[0].ext);
        r.tabla('Candidatos y huellas encontradas', ['Lenguaje', 'Lado', 'Puntos', 'Huellas'], d.map(function (x) { return [x.lenguaje, x.lado, x.puntos, x.huellas.join('; ')]; }));
      }
    }
    r.tabla('Los seis fragmentos del ejercicio, clasificados', ['Fragmento', 'Detectado', 'Lado', 'Puntos', 'Comprobación'], fragmentos(c).map(function (fr) {
      var d = analizar(fr[1]);
      return [fr[0], d.length ? d[0].lenguaje : '?', d.length ? d[0].lado : '', d.length ? d[0].puntos : 0, !d.length || d[0].lenguaje.indexOf(fr[0]) === 0 ? 'acierta' : 'revisar'];
    }));
    return r.tabla('Mini-aplicación de tareas (H2)', ['id', 'título', 'descripción', 'completada'],
      st.tareas.map(function (t) { return [t.id, t.titulo, t.descripcion, t.completada ? 'Sí' : 'No']; })).o;
  };

  /* ------------- UD3-A2: validador de etiquetas HTML con una pila ------------- */
  var VACIAS = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr'];
  function validarHtml(html) {
    var pasos = [], pila = [], re = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)[^>]*?(\/?)>/g, m;
    var ps = function () { return '[' + pila.slice().reverse().join(', ') + ']'; };      // ArrayDeque: la cima va primero
    var texto = html.replace(/<!--[\s\S]*?-->/g, '');
    while ((m = re.exec(texto))) {
      var cierre = m[1] !== '', nombre = m[2].toLowerCase();
      if (!cierre) {
        if (VACIAS.indexOf(nombre) >= 0 || m[3] !== '') pasos.push('<' + nombre + '> es una etiqueta vacía: no se apila');
        else { pila.push(nombre); pasos.push('abre <' + nombre + '> → pila ' + ps()); }
      } else if (!pila.length) { pasos.push('cierra </' + nombre + '> con la pila vacía'); return { valido: false, mensaje: 'Cierre </' + nombre + '> sin etiqueta de apertura.', pasos: pasos }; }
      else if (pila[pila.length - 1] !== nombre) {
        pasos.push('cierra </' + nombre + '> pero la cima es <' + pila[pila.length - 1] + '>');
        return { valido: false, mensaje: 'Se esperaba </' + pila[pila.length - 1] + '> y se encontró </' + nombre + '>.', pasos: pasos };
      } else { pila.pop(); pasos.push('cierra </' + nombre + '> → pila ' + ps()); }
    }
    if (pila.length) return { valido: false, mensaje: 'Faltan por cerrar: ' + ps() + '.', pasos: pasos };
    return { valido: true, mensaje: 'Todas las etiquetas están bien anidadas.', pasos: pasos };
  }
  E.uf2405_ud3a2 = function (p, c) {
    var v = validarHtml(p.html == null ? '' : String(p.html));
    var pasos = v.pasos.map(function (s) { return paso(s, '', s.indexOf('sin ') >= 0 || s.indexOf('pero') >= 0 ? 'error' : 'info'); });
    if (!pasos.length) pasos.push(paso('No hay etiquetas', '', 'info'));
    var t = base(c, 'JavaScript frente a VBScript');
    return res('').veredicto(v.valido, v.mensaje).pasos('Recorrido con la pila', pasos).tabla(t.titulo, t.columnas, t.filas).o;
  };

  /* ------------- UD4-A1: scripts PHP en Java (empresas y agenda) ------------- */
  function getParam(v, def) { return v == null || String(v).trim() === '' ? def : String(v).trim(); }
  E.uf2405_ud4a1 = function (p, c) {
    var st = c.estado(), r = res(''), accion = txt(p, 'accion');
    if (accion === 'Eliminar empresa') {
      var id = ent(p, 'id', -1), n = st.empresas.filter(function (e) { return e[0] === id; }).length;
      st.empresas = st.empresas.filter(function (e) { return e[0] !== id; });
      r.veredicto(n > 0, n > 0 ? 'DELETE FROM empresas WHERE id = ' + id + ' → 1 fila eliminada.' : 'No existe ninguna empresa con ese id.');
    } else if (accion === 'Insertar en la agenda') {
      var nombre = getParam(p.nombre, ''), apellidos = getParam(p.apellidos, ''), edadTxt = txt(p, 'edad'), alturaTxt = txt(p, 'altura').replace(/,/g, '.'), errores = [];
      if (nombre === '') errores.push('El nombre es obligatorio.');
      if (apellidos === '') errores.push('Los apellidos son obligatorios.');
      if (!/^\d{1,3}$/.test(edadTxt)) errores.push('La edad debe ser un número entero.');
      if (!/^\d(\.\d{1,2})?$/.test(alturaTxt)) errores.push('La altura debe ser un decimal, p. ej. 1,68.');
      if (!errores.length) {
        st.agenda.push([st.sigA++, nombre, apellidos, getParam(p.telefono, ''), parseInt(edadTxt, 10), parseFloat(parseFloat(alturaTxt).toFixed(2)), getParam(p.direccion, '')]);
        r.veredicto(true, 'Contacto guardado en la agenda.');
      } else r.veredicto(false, errores.join(' '));
    }
    r.tabla('Tabla empresas', ['id', 'nombre', 'dirección'], st.empresas.map(function (e) { return e.slice(); }));
    r.tabla('Tabla agenda', ['id', 'nombre', 'apellidos', 'teléfono', 'edad', 'altura'], st.agenda.map(function (a) { return a.slice(0, 6); }));
    var t = base(c, 'Efecto de sqlValue() sobre entradas maliciosas');
    return r.tabla(t.titulo, t.columnas, t.filas).o;
  };

  /* ------------- UD5-A1: gestor de personas ------------- */
  var NOMBRE_OK = /^\p{L}[\p{L} '-]{1,59}$/u, INICIAL_OK = /^\p{L}$/u;
  M.nombreValido = function (s) { return s != null && NOMBRE_OK.test(String(s).trim()); };
  M.inicialValida = function (s) { return s != null && INICIAL_OK.test(String(s).trim()); };
  function porApellidos(a, b) { return a[2] < b[2] ? -1 : a[2] > b[2] ? 1 : a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0; }
  M.personasListar = function (st) { return st.personas.slice().sort(porApellidos); };
  M.personasBuscar = function (st, ini) {
    var i = String(ini).trim().toUpperCase();
    return st.personas.filter(function (x) { return x[1].toUpperCase().indexOf(i) === 0; }).sort(function (a, b) { return a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0; });
  };
  M.personasAgregar = function (st, nombre, apellidos) { st.personas.push([st.sig++, nombre.trim(), apellidos.trim()]); };

  E.uf2405_ud5a1 = function (p, c) {
    var st = c.estado(), r = res(''), accion = txt(p, 'accion'), personas = null, tr = [cp(PRES, 'PersonaControlador', 'Recibe la acción «' + accion + '»')];
    var T = { listar: ['PersonaDAO.listarPersonas()', 'SELECT … FROM personas ORDER BY apellidos, nombre   (antes: CALL listar_personas())'],
              contar: ['PersonaDAO.contarPersonas()', 'SELECT COUNT(*) FROM personas   (antes: CALL contar_personas(?))'],
              agregar: ['PersonaDAO.agregarPersona()', 'INSERT INTO personas (nombre, apellidos) VALUES (?, ?)   (antes: CALL agregar_persona(?, ?))'] };
    if (accion === 'Buscar por inicial') {
      if (!M.inicialValida(txt(p, 'inicial'))) r.veredicto(false, 'La inicial debe ser una sola letra.');
      else {
        tr.push(cp(DAT, 'PersonaDAO.buscarPorInicial("' + txt(p, 'inicial') + '")', 'SELECT … WHERE UPPER(nombre) LIKE ?   (antes: CALL buscar_por_inicial(?))'));
        personas = M.personasBuscar(st, txt(p, 'inicial'));
        r.veredicto(true, personas.length + ' persona(s) cuyo nombre empieza por «' + txt(p, 'inicial') + '».');
      }
    } else if (accion === 'Contar') {
      tr.push(cp(DAT, T.contar[0], T.contar[1]));
      r.veredicto(true, 'Hay ' + st.personas.length + ' personas registradas.');
    } else if (accion === 'Agregar') {
      if (!M.nombreValido(txt(p, 'nombre')) || !M.nombreValido(txt(p, 'apellidos'))) r.veredicto(false, 'Nombre y apellidos deben contener solo letras, espacios, apóstrofos o guiones (2-60 caracteres).');
      else { tr.push(cp(DAT, T.agregar[0], T.agregar[1])); M.personasAgregar(st, txt(p, 'nombre'), txt(p, 'apellidos')); r.veredicto(true, 'Persona agregada.'); }
    } else { tr.push(cp(DAT, T.listar[0], T.listar[1])); personas = M.personasListar(st); }
    r.capas('Recorrido por las capas', tr);
    if (personas == null) personas = M.personasListar(st);
    return r.tabla('Personas', ['id', 'nombre', 'apellidos'], personas.map(function (x) { return x.slice(); })).o;
  };

  /* ------------- UD6-A1: contactos (MVC + JDBC) ------------- */
  E.uf2405_ud6a1 = function (p, c) {
    var st = c.estado(), r = res(''), accion = txt(p, 'accion'), lista;
    var tr = [cp(PRES, 'ContactoServlet (controlador)', 'Recibe la acción «' + accion + '»')];
    var todos = function () { tr.push(cp(DAT, 'ContactoDAO.obtenerTodos()', 'SELECT id, nombre, apellidos, edad FROM contactos ORDER BY id')); return st.contactos.slice().sort(function (a, b) { return a[0] - b[0]; }); };
    if (accion === 'Filtrar por edad mínima') {
      var min = ent(p, 'edadMin', 0);
      tr.push(cp(DAT, 'ContactoDAO.obtenerPorEdadMinima(' + min + ')', 'SELECT … FROM contactos WHERE edad >= ? ORDER BY edad'));
      lista = st.contactos.filter(function (x) { return x[3] >= min; }).sort(function (a, b) { return a[3] - b[3]; });
      r.veredicto(true, lista.length + ' contacto(s) con edad ≥ ' + min);
    } else {
      if (accion === 'Agregar') {
        var edad = ent(p, 'edad', -1);
        if (txt(p, 'nombre') === '' || txt(p, 'apellidos') === '' || edad < 0 || edad > 120) r.veredicto(false, 'Nombre y apellidos obligatorios y edad entre 0 y 120.');
        else {
          tr.push(cp(DAT, 'ContactoDAO.agregar()', 'INSERT INTO contactos (nombre, apellidos, edad) VALUES (?, ?, ?)'));
          st.contactos.push([st.sig++, txt(p, 'nombre'), txt(p, 'apellidos'), edad]);
          r.veredicto(true, 'Contacto agregado.');
        }
      }
      lista = todos();
    }
    r.capas('Recorrido MVC', tr);
    return r.tabla('Contactos', ['id', 'nombre', 'apellidos', 'edad'], lista.map(function (x) { return x.slice(); })).o;
  };
})(typeof window !== 'undefined' ? window : globalThis);
