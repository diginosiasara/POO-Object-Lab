/* Resaltador de sintaxis mínimo (Java, JS, PHP, Python, SQL, VBScript/ASP, HTML/JSP, CSS).
   Devuelve las líneas como listas de [clase, texto]; la web las pinta con textContent (nunca innerHTML). */
(function () {
  'use strict';
  var KW = {
    java: 'abstract assert boolean break byte case catch char class const continue default do double else enum extends final finally float for if implements import instanceof int interface long new package private protected public return short static super switch synchronized this throw throws try var void volatile while record sealed permits yield null true false',
    js: 'break case catch class const continue default delete do else export extends finally for function if import in instanceof let new null return super switch this throw try typeof var void while yield async await true false undefined of',
    php: 'abstract and array as break case catch class const continue default do echo else elseif empty extends final finally for foreach function global if implements include include_once instanceof interface isset new null or print private protected public require require_once return static switch throw try use var while true false die exit',
    py: 'and as assert break class continue def del elif else except finally for from global if import in is lambda None nonlocal not or pass raise return try while with yield True False self',
    sql: 'select from where and or not insert into values update set delete create table primary key foreign references on cascade join inner left right outer group by order having asc desc limit as distinct count avg min max sum null is in between like union all drop alter add default unique check auto_increment boolean integer int varchar date true false if exists',
    vbs: 'dim set if then else elseif end for next each in do loop while wend function sub call select case not and or true false nothing new response request session server'
  };
  var SET = {};
  Object.keys(KW).forEach(function (k) { SET[k] = new Set(KW[k].split(' ')); });

  var NUM = ['num', '\\b\\d[\\d_]*(?:\\.\\d+)?[LlFfDd]?\\b'];
  var BLOQUE = ['com', '\\/\\*[\\s\\S]*?\\*\\/'];
  var LINEA = ['com', '\\/\\/[^\\n]*'];
  var STR2 = ['str', '"(?:\\\\.|[^"\\\\\\n])*"'];
  var STR1 = ['str', "'(?:\\\\.|[^'\\\\\\n])*'"];
  var ID = ['id', '[A-Za-z_$][\\w$]*'];

  var DEFS = {
    java: [BLOQUE, LINEA, ['str', '"""[\\s\\S]*?"""'], STR2, STR1, ['anot', '@[A-Za-z_]\\w*'], NUM, ID],
    js: [BLOQUE, LINEA, ['str', '`(?:\\\\.|[^`\\\\])*`'], STR2, STR1, NUM, ID],
    php: [['kw', '<\\?php|<\\?=|\\?>'], BLOQUE, LINEA, ['com', '#[^\\n]*'], STR2, STR1, ['var', '\\$[A-Za-z_]\\w*'], NUM, ID],
    py: [['com', '#[^\\n]*'], ['str', '"""[\\s\\S]*?"""|\'\'\'[\\s\\S]*?\'\'\''], STR2, STR1, ['anot', '@[A-Za-z_][\\w.]*'], NUM, ID],
    sql: [['com', '--[^\\n]*'], BLOQUE, ['str', "'(?:''|[^'])*'"], NUM, ID],
    vbs: [['kw', '<%=?|%>'], ['com', "'[^\\n]*"], ['str', '"(?:""|[^"\\n])*"'], NUM, ID],
    html: [['com', '<!--[\\s\\S]*?-->'], ['anot', '<%[\\s\\S]*?%>'], ['tag', '<\\/?[A-Za-z][\\w:-]*'], ['tag', '\\/?>'], ['str', '"[^"\\n]*"|\'[^\'\\n]*\''], ['attr', '[A-Za-z_:][\\w:.-]*(?=\\s*=)']],
    css: [BLOQUE, ['str', '"[^"\\n]*"|\'[^\'\\n]*\''], ['num', '-?\\b\\d+(?:\\.\\d+)?(?:px|em|rem|%|s|vh|vw)?'], ['attr', '[a-z-]+(?=\\s*:)'], ['tipo', '[.#][A-Za-z_-][\\w-]*']]
  };

  function lenguaje(nombre) {
    var e = (nombre.split('.').pop() || '').toLowerCase();
    return { java: 'java', js: 'js', php: 'php', py: 'py', sql: 'sql', asp: 'vbs', html: 'html', jsp: 'html', htm: 'html', css: 'css' }[e] || 'texto';
  }

  function tokenizar(txt, lang) {
    var defs = DEFS[lang];
    if (!defs) return [['', txt]];
    var re = new RegExp(defs.map(function (d) { return '(' + d[1] + ')'; }).join('|'), 'g');
    var out = [], ult = 0, m;
    while ((m = re.exec(txt))) {
      if (m.index > ult) out.push(['', txt.slice(ult, m.index)]);
      var g = 1;
      while (m[g] === undefined) g++;
      var cls = defs[g - 1][0], t = m[0];
      if (cls === 'id') {
        var ci = lang === 'sql' || lang === 'vbs';
        var s = SET[lang];
        if (s && s.has(ci ? t.toLowerCase() : t)) cls = 'kw';
        else if (/^[A-Z]/.test(t) && lang !== 'sql' && lang !== 'vbs') cls = 'tipo';
        else cls = '';
      }
      out.push([cls, t]);
      ult = re.lastIndex;
      if (t.length === 0) re.lastIndex++;
    }
    if (ult < txt.length) out.push(['', txt.slice(ult)]);
    return out;
  }

  function lineas(codigo, nombreArchivo) {
    var toks = tokenizar(codigo, lenguaje(nombreArchivo));
    var res = [[]];
    toks.forEach(function (tk) {
      tk[1].split('\n').forEach(function (parte, i) {
        if (i > 0) res.push([]);
        if (parte !== '') res[res.length - 1].push([tk[0], parte]);
      });
    });
    return res;
  }

  window.Resaltado = { lineas: lineas, lenguaje: lenguaje };
})();
