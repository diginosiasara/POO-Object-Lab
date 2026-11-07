/* Motor del navegador (1/3): ejercicios. Réplica en JavaScript de las fichas Java (Ficha.ejecutar). */
(function (global) {
  'use strict';
  var M = global.__MotorInterno, E = M.E, esc = M.esc, jd = M.jd, txt = M.txt, ent = M.ent, dec = M.dec, cmp = M.cmp, f2 = M.f2, lista = M.lista;
  var res = M.res, paso = M.paso, tarjeta = M.tarjeta, cp = M.cp, PRES = M.PRES, NEG = M.NEG, DAT = M.DAT, base = M.base, D = M.D;

  /* ------------------------------ UF2404 ------------------------------ */

  E.uf2404_ud2a1 = function (p, c) {
    function serie(t, n, g, cr) { return { k: 'Serie', t: t, n: n, g: g, x: cr, e: false }; }
    function juego(t, h, g, co) { return { k: 'Videojuego', t: t, n: h, g: g, x: co, e: false }; }
    var a = serie(txt(p, 'tituloA'), ent(p, 'tempA', 3), 'Drama', 'Creador A'), b = serie(txt(p, 'tituloB'), ent(p, 'tempB', 3), 'Ciencia ficción', 'Creador B');
    var va = juego('Juego A', ent(p, 'horasA', 10), 'Aventura', 'Estudio A'), vb = juego('Juego B', ent(p, 'horasB', 10), 'Acción', 'Estudio B');
    function str(o) {
      return o.k === 'Serie'
        ? "Serie{titulo='" + o.t + "', numeroTemporadas=" + o.n + ', entregado=' + o.e + ", genero='" + o.g + "', creador='" + o.x + "'}"
        : "Videojuego{titulo='" + o.t + "', horasEstimadas=" + o.n + ', entregado=' + o.e + ", genero='" + o.g + "', compania='" + o.x + "'}";
    }
    var todos = [a, b, va, vb], est = [];
    est.push(paso('Estado inicial', 'isEntregado() de los 4 objetos: ' + lista(todos.map(function (o) { return o.e; })), 'info'));
    a.e = true;
    est.push(paso('lista[0].entregar()', a.t + ' → isEntregado() = ' + a.e, 'ok'));
    a.e = false;
    est.push(paso('lista[0].devolver()', a.t + ' → isEntregado() = ' + a.e, 'ok'));
    var r = res(c.base.consola);
    r.pasos('Comparaciones con tus datos', [
      paso('A.compareTo(B)', a.t + ' vs ' + b.t + ' → ' + cmp(a.n, b.n) + '  (1: más temporadas, 0: iguales, -1: menos)', 'ok'),
      paso('Juego A.compareTo(Juego B)', va.n + ' h vs ' + vb.n + ' h → ' + cmp(va.n, vb.n), 'ok')]);
    r.pasos('Contrato Entregable (polimorfismo)', est);
    r.objetos('Objetos creados (toString)', todos.map(function (o) { return tarjeta(o.k, { 'toString()': str(o) }); }));
    return r.o;
  };

  E.uf2404_ud2a2 = function (p, c) {
    var sx = txt(p, 'sexo'), sexo = sx === '' ? 'X' : sx.charAt(0);
    var nombre = txt(p, 'nombre'), edad = ent(p, 'edad', 0), peso = dec(p, 'peso', 0), altura = dec(p, 'altura', 0);
    if (sexo !== 'H' && sexo !== 'M') sexo = 'H';                      // comprobarSexo()
    var imc = altura > 0 ? peso / (altura * altura) : 0, cod = altura <= 0 ? 0 : imc < 20 ? -1 : imc <= 25 ? 0 : 1;
    var num = Math.floor(Math.random() * 100000000), letras = 'TRWAGMYFPDXBNJZSQVHLCKE';
    var dni = ('00000000' + num).slice(-8) + letras.charAt(num % 23);
    var estado = cod === -1 ? 'por debajo de su peso ideal' : cod === 0 ? 'en su peso ideal' : 'con sobrepeso';
    var toString = "Persona{nombre='" + nombre + "', edad=" + edad + ", dni='" + dni + "', sexo=" + sexo + ', peso=' + jd(peso) + ' kg, altura=' + jd(altura) + ' m, IMC=' + estado + ', mayorDeEdad=' + (edad >= 18 ? 'Sí' : 'No') + '}';
    var kv = {};
    kv['toString()'] = toString;
    kv['Sexo asignado'] = sexo + (sx === sexo ? '' : '  (corregido por comprobarSexo)');
    kv['calcularIMC()'] = cod + (cod === -1 ? '  → por debajo de su peso ideal' : cod === 0 ? '  → en su peso ideal' : '  → con sobrepeso');
    kv['esMayorDeEdad()'] = edad >= 18;
    var r = res(c.base.consola);
    r.kv('Tu persona', kv);
    r.escala('Índice de masa corporal', Math.floor(imc * 10 + 0.5) / 10, 10, 40, [{ hasta: 20, etiqueta: 'Bajo' }, { hasta: 25, etiqueta: 'Ideal' }, { hasta: 40, etiqueta: 'Sobrepeso' }]);
    r.veredicto(true, 'DNI generado ' + dni + ': la letra coincide con el número módulo 23.');
    return r.o;
  };

  E.uf2404_ud3a1 = function (p, c) {
    var tipo = txt(p, 'tipo'), color = ent(p, 'color', 0), serie = ent(p, 'serie', 0), cil = ent(p, 'cilindrada', 0);
    var v = { k: tipo === 'Coche' || tipo === 'Bicicleta' ? tipo : 'Vehiculo', color: color, serie: serie };
    function str() {
      return v.k + '{color=' + v.color + ', numeroSerie=' + v.serie + (v.k === 'Coche' ? ', cilindrada=' + cil : '') + '}';
    }
    var pasos = [paso('Vehiculo v = new ' + v.k + '(…)', str(), 'info')];
    v.color = ent(p, 'nuevoColor', 0);
    pasos.push(paso('v.pinta(' + ent(p, 'nuevoColor', 0) + ')  — heredado de Vehiculo', str(), 'ok'));
    v.serie = ent(p, 'nuevaSerie', 0);
    pasos.push(paso('v.cambiaNumeroSerie(' + ent(p, 'nuevaSerie', 0) + ')  — heredado de Vehiculo', str(), 'ok'));
    var kv = {};
    kv['Tipo declarado'] = 'Vehiculo';
    kv['Tipo real (en ejecución)'] = v.k;
    kv['Superclase'] = v.k === 'Vehiculo' ? 'Object' : 'Vehiculo';
    kv['v instanceof Vehiculo'] = true;
    return res(c.base.consola).pasos('Tu objeto paso a paso', pasos).kv('Tipos', kv).o;
  };

  E.uf2404_ud4a1 = function (p, c) {
    var admin = txt(p, 'tipo') === 'Administrativo', sueldo = dec(p, 'sueldo', 0), extra = dec(p, 'extra', 0), aplicar, msg;
    if (admin) {
      var ant = ent(p, 'antiguedad', 0);
      aplicar = ant >= 5;
      msg = aplicar ? '  -> Extra de ' + jd(extra) + ' € APLICADO (antigüedad ' + ant + ' >= 5 años).' : '  -> NO se aplica el extra: antigüedad < 5 años.';
    } else {
      var com = dec(p, 'comision', 0);
      aplicar = com < 45;
      msg = aplicar ? '  -> Extra de ' + jd(extra) + ' € APLICADO (comisión ' + jd(com) + ' < 45).' : '  -> NO se aplica el extra: la comisión es >= 45.';
    }
    var despues = aplicar ? sueldo + extra : sueldo, aplicado = despues !== sueldo, kv = {};
    kv['Sueldo antes'] = f2(sueldo) + ' €';
    kv['Sueldo después'] = f2(despues) + ' €';
    kv['Mensaje del método'] = msg.trim();
    return res(c.base.consola).kv('Resultado con tus datos', kv).veredicto(aplicado, aplicado ? 'El extra se ha aplicado.' : 'El extra no se aplica con esa regla.').o;
  };

  E.uf2404_ud5a1 = function (p, c) {
    var n = Math.max(0, Math.min(100, ent(p, 'veces', 2)));
    var us = [['Usuario', 'UserNormal', '—'], ['Moderador', 'ModSuper', 'Moderador: papelera'], ['Administrador', 'AdminRoot', 'Administrador: baneos']];
    var filas = us.map(function (u, i) { return ['usuarios[' + i + ']', 'Usuario', u[0], u[1], n, u[2]]; });
    return res(c.base.consola).tabla('Tipo declarado frente a tipo real', ['Variable', 'Declarado', 'Real', 'Nick', 'Mensajes', 'Miembros propios'], filas).o;
  };

  E.uf2404_ud6a1 = function (p, c) {
    var n = ent(p, 'n', 1), pasos = [];
    pasos.push(paso('incrementar(n): primitivo', 'n antes = ' + n + ' · dentro del método = ' + (n + 1) + ' · n después = ' + n + ' → la copia cambió, la original no', 'error'));
    pasos.push(paso('Solución 1: clase Contenedor', 'antes = ' + n + ' · después = ' + (n + 1) + ' → se copió la referencia, ambos apuntan al mismo objeto', 'ok'));
    pasos.push(paso('Solución 2: array de un elemento', 'antes = ' + n + ' · después = ' + (n + 1) + ' → el array es un objeto y se modifica en el sitio', 'ok'));
    pasos.push(paso('Solución 3: devolver el valor', 'antes = ' + n + ' · n = incrementar(n) → ' + (n + 1) + ' → la variable se reasigna con el retorno', 'ok'));
    return res(c.base.consola).pasos('Las cuatro estrategias con tu valor', pasos).o;
  };

  function equilibrada(expr) {
    var d = 0;
    for (var i = 0; i < expr.length; i++) {
      if (expr.charAt(i) === '(') d++;
      else if (expr.charAt(i) === ')') { if (d === 0) return false; d--; }
    }
    return d === 0;
  }
  E.uf2404_ud7a1 = function (p, c) {
    var expr = p.expresion == null ? '' : String(p.expresion), pila = [], pasos = [], ok = true;
    function ps() { return 'Pila[' + pila.join(', ') + ']'; }
    for (var i = 0; i < expr.length && ok; i++) {
      var ch = expr.charAt(i);
      if (ch === '(') { pila.push('('); pasos.push(paso('Posición ' + i + ": '('", 'apilar → ' + ps() + ' (tamaño ' + pila.length + ')', 'info')); }
      else if (ch === ')') {
        if (!pila.length) { pasos.push(paso('Posición ' + i + ": ')'", 'La pila está vacía: cierre sin apertura', 'error')); ok = false; }
        else { pila.pop(); pasos.push(paso('Posición ' + i + ": ')'", 'desapilar → ' + ps() + ' (tamaño ' + pila.length + ')', 'ok')); }
      }
    }
    if (ok && pila.length) { pasos.push(paso('Fin de la expresión', 'Quedan ' + pila.length + ' paréntesis sin cerrar', 'error')); ok = false; }
    if (!pasos.length) pasos.push(paso('Sin paréntesis', 'No hay nada que apilar: la expresión es equilibrada', 'ok'));
    var oficial = equilibrada(expr);
    var ocho = ['(a + b) * c', '((a + b) * (c - d))', '(a + b)) * c', '((a + b) * c', 'a + b * c', '((( )))', ')(', '((a + b) * (c - (d / e)))'];
    return res(c.base.consola).veredicto(oficial, 'Programa.verificarEquilibrio("' + expr + '") = ' + oficial)
      .pasos('Recorrido con la pila', pasos)
      .tabla('Las ocho expresiones del ejercicio original', ['Expresión', 'Resultado'], ocho.map(function (e) { return [e, equilibrada(e) ? 'equilibrada' : 'NO equilibrada']; })).o;
  };

  E.uf2404_ud8a1 = function (p, c) {
    var nombre = txt(p, 'nombre') === '' ? 'Sin nombre' : txt(p, 'nombre');
    var an = [['Perro', nombre, 'guau'], ['Gato', nombre + ' (gato)', 'miau']], salida = '';
    an.forEach(function (a) { salida += a[1] + ' (' + a[0] + ') dice: ' + a[2] + '\n'; });
    return res(salida).tabla('Clasificación por paradigma', base(c, 'Clasificación por paradigma').columnas, base(c, 'Clasificación por paradigma').filas)
      .objetos('Objetos creados: una clase, varias instancias', an.map(function (a) { return tarjeta(a[0], { nombre: a[1], 'hablar()': a[2], superclase: 'Animal' }); })).o;
  };

  E.uf2404_ud9a1 = function (p, c) {
    var t = base(c, 'Herramientas (5)') || (c.base.secciones[0]), crit = txt(p, 'criterio');
    var filas = t.filas.filter(function (f) { return crit === 'Solo IDE completos' ? f[3] === 'IDE completo' : crit === 'Solo editores ligeros' ? f[3] === 'Editor' : true; });
    return res('').tabla('Herramientas (' + filas.length + ')', t.columnas, filas).o;
  };

  E.uf2404_ud9a2 = function (p, c) {
    var args = [];
    if (txt(p, 'a') !== '') args.push(txt(p, 'a'));
    if (txt(p, 'b') !== '') args.push(txt(p, 'b'));
    var lineas = c.base.consola.split('\n'), cab = lineas.slice(1, lineas.length - 2).join('\n'), salida = cab + '\n';
    var num = function (s) { return /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?[dDfF]?$/.test(s) ? parseFloat(s) : NaN; };
    if (args.length < 2) salida += 'ERROR: Debes proporcionar dos números como argumentos.\nEjemplo de uso correcto: java PrimeraAplicacion 5 10\n';
    else {
      var n1 = num(args[0]), n2 = num(args[1]);
      if (isNaN(n1) || isNaN(n2)) salida += 'ERROR DE FORMATO: Los argumentos deben ser números válidos. No se permiten letras o símbolos.\n';
      else salida += 'La suma de ' + jd(n1) + ' y ' + jd(n2) + ' es: ' + jd(n1 + n2) + '\n';
    }
    var ok = salida.indexOf('es:') >= 0;
    return res('$ java PrimeraAplicacion ' + args.join(' ') + '\n' + salida)
      .veredicto(ok, ok ? 'Suma calculada correctamente.' : 'El programa ha detectado un problema con los argumentos.').o;
  };
})(typeof window !== 'undefined' ? window : globalThis);
