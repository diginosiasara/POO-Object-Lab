/* Generado por herramientas/generar_motor_datos.py a partir del código Java. No editar a mano. */
window.MotorDatos = {
 "clasificador": [
  {
   "nombre": "HTML",
   "lado": "Cliente",
   "ext": ".html",
   "huellas": [
    {
     "rx": "<!DOCTYPE\\s+html",
     "flags": "mi",
     "peso": 3,
     "desc": "<!DOCTYPE html>"
    },
    {
     "rx": "<html[\\s>]",
     "flags": "mi",
     "peso": 2,
     "desc": "etiqueta <html>"
    },
    {
     "rx": "<head[\\s>]",
     "flags": "mi",
     "peso": 1,
     "desc": "etiqueta <head>"
    },
    {
     "rx": "<body[\\s>]",
     "flags": "mi",
     "peso": 1,
     "desc": "etiqueta <body>"
    },
    {
     "rx": "<(h[1-6]|p|div|ul|li|a|form|input|table)[\\s>]",
     "flags": "mi",
     "peso": 1,
     "desc": "etiquetas de estructura (<h1>, <p>, <a>…)"
    }
   ]
  },
  {
   "nombre": "JavaScript",
   "lado": "Cliente",
   "ext": ".js",
   "huellas": [
    {
     "rx": "<script",
     "flags": "mi",
     "peso": 2,
     "desc": "bloque <script>"
    },
    {
     "rx": "\\bfunction\\b",
     "flags": "m",
     "peso": 2,
     "desc": "palabra reservada function"
    },
    {
     "rx": "\\bdocument\\.(getElementById|querySelector\\w*)",
     "flags": "m",
     "peso": 3,
     "desc": "acceso al DOM (document.getElementById)"
    },
    {
     "rx": "\\b(let|const|var)\\s+\\w+\\s*=",
     "flags": "m",
     "peso": 2,
     "desc": "declaración con let / const / var"
    },
    {
     "rx": "\\b(alert|console\\.log)\\(",
     "flags": "m",
     "peso": 2,
     "desc": "alert() o console.log()"
    },
    {
     "rx": "=>|addEventListener",
     "flags": "m",
     "peso": 1,
     "desc": "funciones flecha o eventos"
    }
   ]
  },
  {
   "nombre": "JSP",
   "lado": "Servidor",
   "ext": ".jsp",
   "huellas": [
    {
     "rx": "<%@",
     "flags": "m",
     "peso": 4,
     "desc": "directiva <%@ … %>"
    },
    {
     "rx": "<%=\\s*new\\s+java\\.|<%=.*java\\.",
     "flags": "m",
     "peso": 4,
     "desc": "expresión <%= … %> con API de Java"
    },
    {
     "rx": "<jsp:",
     "flags": "m",
     "peso": 4,
     "desc": "acciones <jsp:…>"
    },
    {
     "rx": "request\\.getParameter|HttpServletRequest|session\\.getAttribute",
     "flags": "m",
     "peso": 3,
     "desc": "objetos implícitos de Servlet"
    },
    {
     "rx": "\\bimport\\s+java\\.",
     "flags": "m",
     "peso": 2,
     "desc": "import de paquetes java.*"
    }
   ]
  },
  {
   "nombre": "PHP",
   "lado": "Servidor",
   "ext": ".php",
   "huellas": [
    {
     "rx": "<\\?php",
     "flags": "m",
     "peso": 5,
     "desc": "delimitador <?php"
    },
    {
     "rx": "\\$[A-Za-z_]\\w*",
     "flags": "m",
     "peso": 2,
     "desc": "variables con $"
    },
    {
     "rx": "\\bPDO\\b|mysqli|->prepare|->execute|fetch\\(",
     "flags": "m",
     "peso": 2,
     "desc": "acceso a datos PDO / mysqli"
    },
    {
     "rx": "\\becho\\b",
     "flags": "m",
     "peso": 1,
     "desc": "instrucción echo"
    },
    {
     "rx": "\\?>",
     "flags": "m",
     "peso": 1,
     "desc": "cierre ?>"
    }
   ]
  },
  {
   "nombre": "ASP clásico (VBScript)",
   "lado": "Servidor",
   "ext": ".asp",
   "huellas": [
    {
     "rx": "Request\\.(Form|QueryString)",
     "flags": "m",
     "peso": 3,
     "desc": "Request.Form / Request.QueryString"
    },
    {
     "rx": "Response\\.(Write|Redirect)",
     "flags": "m",
     "peso": 3,
     "desc": "Response.Write / Response.Redirect"
    },
    {
     "rx": "Session\\(\"",
     "flags": "m",
     "peso": 2,
     "desc": "Session(\"…\")"
    },
    {
     "rx": "Server\\.CreateObject",
     "flags": "m",
     "peso": 3,
     "desc": "Server.CreateObject (COM / ADO)"
    },
    {
     "rx": "\\b(Dim|End If|Set\\s+\\w+\\s*=)\\b",
     "flags": "mi",
     "peso": 2,
     "desc": "sintaxis Visual Basic (Dim, End If, Set)"
    },
    {
     "rx": "<%(?![@=])",
     "flags": "m",
     "peso": 1,
     "desc": "delimitador <% … %>"
    }
   ]
  },
  {
   "nombre": "Python (Flask)",
   "lado": "Servidor",
   "ext": ".py",
   "huellas": [
    {
     "rx": "^\\s*def\\s+\\w+\\(.*\\)\\s*:",
     "flags": "m",
     "peso": 3,
     "desc": "función con def … :"
    },
    {
     "rx": "@app\\.route",
     "flags": "m",
     "peso": 4,
     "desc": "decorador @app.route"
    },
    {
     "rx": "render_template|from\\s+flask\\s+import",
     "flags": "m",
     "peso": 3,
     "desc": "framework Flask"
    },
    {
     "rx": "^\\s*(import|from)\\s+\\w+",
     "flags": "m",
     "peso": 1,
     "desc": "import / from … import"
    },
    {
     "rx": "\\b(True|False|None)\\b",
     "flags": "m",
     "peso": 1,
     "desc": "constantes True / False / None"
    }
   ]
  }
 ],
 "ud4a1": [
  "<!DOCTYPE html>\n<html lang=\"es\">\n<head>\n    <meta charset=\"UTF-8\">\n    <title>Demostración UF2405 - UD4</title>\n    <style>\n        body { font-family: Arial, sans-serif; margin: 40px; }\n        .menu { list-style: none; padding: 0; }\n        .menu li { margin: 15px 0; }\n        .menu a { text-decoration: none; color: #0066cc; font-size: 1.2em; }\n        .menu a:hover { text-decoration: underline; }\n    </style>\n</head>\n<body>\n    <h1>UF2405 - UD4: Funciones de Diferentes Códigos</h1>\n    <p>Selecciona un ejercicio para ver su funcionamiento:</p>\n    <ul class=\"menu\">\n        <li>👉 <a href=\"ejercicio1_listado\">Ejercicio 1: Conexión y Listado (SELECT)</a></li>\n        <li>👉 <a href=\"ejercicio3_insertar\">Ejercicio 3: Inserción de Datos (INSERT)</a></li>\n        <li><em>(Nota: El Ejercicio 2 (DELETE) se ejecuta al hacer clic en \"Eliminar\" dentro del Ejercicio 1)</em></li>\n    </ul>\n</body>\n</html>\n",
  "<!DOCTYPE html>\n<html lang=\"es\">\n<head>\n    <meta charset=\"UTF-8\">\n    <title>Ejercicio 1: Listado (SELECT)</title>\n</head>\n<body>\n    <h2>Pregunta 1: Listado de Empresas (SELECT)</h2>\n    <p><a href=\"index\">⬅️ Volver al Menú</a></p>\n<table border='1'>\n",
  "<!DOCTYPE html>\n<html lang=\"es\">\n<head>\n    <meta charset=\"UTF-8\">\n    <title>Ejercicio 3: Insercion (INSERT)</title>\n    <style>\n        body { font-family: Arial, sans-serif; margin: 40px; }\n        form { max-width: 420px; }\n        label { display: block; margin-top: 12px; font-weight: bold; }\n        input { width: 100%; padding: 6px; box-sizing: border-box; }\n        button { margin-top: 16px; padding: 8px 18px; }\n        .ok { color: green; font-weight: bold; }\n        .err { color: red; font-weight: bold; }\n        table { border-collapse: collapse; margin-top: 30px; }\n        td, th { border: 1px solid #999; padding: 6px 10px; }\n    </style>\n</head>\n<body>\n    <h2>Pregunta 3: Insercion de Datos en Agenda (INSERT)</h2>\n    <p><a href=\"index\">&larr; Volver al Menu</a></p>\n"
 ],
 "ud7a1": [
  "<!DOCTYPE html>\n<html lang=\"es\"><head><meta charset=\"UTF-8\"><title>Consola SQL · Biblioteca</title>\n<style>\n  body{font-family:Arial,sans-serif;margin:0;padding:24px;background:#f4f7fb;color:#1a2433}\n  .wrap{max-width:900px;margin:0 auto}h1{margin:0 0 4px}.sub{color:#4a6483;margin:0 0 18px}\n  ol{padding-left:22px}li{margin:4px 0}a{color:#1f5fbf}\n  textarea{width:100%;box-sizing:border-box;height:110px;font:14px monospace;padding:8px;border:1px solid #9fb1c7;border-radius:4px}\n  button{margin-top:8px;padding:8px 18px;background:#0e2a47;color:#fff;border:0;border-radius:4px;cursor:pointer;font-weight:bold}\n  table{border-collapse:collapse;width:100%;margin-top:10px;background:#fff}th,td{border:1px solid #c9d3df;padding:6px 10px;text-align:left}th{background:#e3e9f0}\n  .sql{background:#0a1626;color:#d6e4f5;padding:10px 14px;border-radius:4px;overflow-x:auto}\n  .ok{color:#17703f;font-weight:bold}.err{color:#b3261e;font-weight:bold}.pie{color:#4a6483;font-size:13px}\n  section{background:#fff;border:1px solid #c9d3df;padding:14px 18px;margin-top:16px}\n</style></head><body><div class=\"wrap\">\n<h1>Consola SQL · Biblioteca</h1><p class=\"sub\">Base de datos de cinco tablas (Libro, Autor, Estudiante, LibAut, Prestamo). Cada ejecución parte de datos nuevos.</p>\n<section><h3>Las diez consultas del ejercicio</h3><ol>",
  "</ol></section>\n<section><h3>Tu propia consulta (solo SELECT)</h3>\n<form method=\"post\" action=\"ejecutar\"><textarea name=\"sql\" spellcheck=\"false\">",
  "</textarea><br><button type=\"submit\">Ejecutar</button></form></section>\n<section>",
  "</section></div></body></html>\n"
 ],
 "biblioteca": [
  "CREATE TABLE Libro (IdLibro INT AUTO_INCREMENT PRIMARY KEY, Titulo VARCHAR(100) NOT NULL, Editorial VARCHAR(60), Area VARCHAR(40));\nCREATE TABLE Autor (IdAutor INT AUTO_INCREMENT PRIMARY KEY, Nombre VARCHAR(80) NOT NULL, Nacionalidad VARCHAR(40));\nCREATE TABLE Estudiante (IdLector INT AUTO_INCREMENT PRIMARY KEY, CI INT UNIQUE NOT NULL, Nombre VARCHAR(80) NOT NULL, Direccion VARCHAR(80), Carrera VARCHAR(40), Edad INT);\nCREATE TABLE LibAut (IdAutor INT NOT NULL, IdLibro INT NOT NULL, PRIMARY KEY (IdAutor, IdLibro),\n    FOREIGN KEY (IdAutor) REFERENCES Autor(IdAutor) ON DELETE CASCADE, FOREIGN KEY (IdLibro) REFERENCES Libro(IdLibro));\nCREATE TABLE Prestamo (IdLector INT NOT NULL, IdLibro INT NOT NULL, FechaPrestamo DATE NOT NULL, FechaDevolucion DATE, Devuelto BOOLEAN DEFAULT FALSE,\n    PRIMARY KEY (IdLector, IdLibro, FechaPrestamo), FOREIGN KEY (IdLector) REFERENCES Estudiante(IdLector), FOREIGN KEY (IdLibro) REFERENCES Libro(IdLibro))\n",
  "INSERT INTO Libro (Titulo, Editorial, Area) VALUES ('Visual Studio Net','McGraw-Hill','Programación'),('Java Fundamentos','Pearson','Programación'),\n    ('El amor en los tiempos del cólera','Alfaguara','Novela'),('Cien años de soledad','Sudamericana','Novela'),('Bases de Datos','Alfaomega','Informática');\nINSERT INTO Autor (Nombre, Nacionalidad) VALUES ('Pong Thinr','Desconocida'),('Gabriel García Márquez','Colombiano'),('Mario Benedetti','Uruguayo'),('James Gosling','Canadiense');\nINSERT INTO Estudiante (CI, Nombre, Direccion, Carrera, Edad) VALUES (100,'Juan Pérez','Calle 1','Informatica',22),(101,'María García','Calle 2','Informatica',20),\n    (102,'Carlos López','Calle 3','Derecho',25),(103,'Ana Martín','Calle 4','Medicina',23),(104,'Pedro Ruiz','Calle 5','Informatica',28);\nINSERT INTO LibAut (IdAutor, IdLibro) VALUES (1,1),(4,2),(2,3),(2,4),(3,5);\nINSERT INTO Prestamo (IdLector, IdLibro, FechaPrestamo, FechaDevolucion, Devuelto) VALUES\n    (1,1,'2007-04-01','2007-04-10',TRUE),(2,3,'2007-04-02','2007-04-10',TRUE),(3,2,'2007-04-03','2007-04-15',FALSE),\n    (4,4,'2007-04-05','2007-04-10',TRUE),(5,5,'2007-04-08','2007-04-20',FALSE)\n"
 ]
};
