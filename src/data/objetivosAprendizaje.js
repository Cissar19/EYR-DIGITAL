
/**
 * Objetivos de Aprendizaje (OA) del MINEDUC Chile
 * Bases Curriculares Educacion Basica
 *
 * Organizados por asignatura y nivel (1° a 8° Basico).
 * Fuente: Bases Curriculares MINEDUC 2012/2018
 */

export const ASIGNATURAS = [
    { code: 'MA', name: 'Matematica' },
    { code: 'LE', name: 'Lenguaje y Comunicacion' },
    { code: 'CN', name: 'Ciencias Naturales' },
    { code: 'HI', name: 'Historia, Geografia y Cs. Sociales' },
    { code: 'IN', name: 'Ingles' },
    { code: 'EF', name: 'Educacion Fisica y Salud' },
    { code: 'AV', name: 'Artes Visuales' },
    { code: 'MU', name: 'Musica' },
    { code: 'TE', name: 'Tecnologia' },
    { code: 'OR', name: 'Orientacion' },
];

export const CURSO_TO_LEVEL = {
    '1° Básico': '01',
    '2° Básico': '02',
    '3° Básico': '03',
    '4° Básico': '04',
    '5° Básico': '05',
    '6° Básico': '06',
    '7° Básico': '07',
    '8° Básico': '08',
};

export const CURSOS = Object.keys(CURSO_TO_LEVEL);

/**
 * OA_DATA keyed by "{asignaturaCode}{level}" e.g. "MA03"
 * Each entry: { code, eje, description }
 */
export const OA_DATA = {
    // ══════════════════════════════════════════════
    //  MATEMATICA 1° BASICO
    // ══════════════════════════════════════════════
    'MA01': [
        { code: 'MA01-OA01', eje: 'Numeros y operaciones', description: 'Contar numeros del 0 al 100, de 1 en 1, de 2 en 2, de 5 en 5 y de 10 en 10, hacia adelante y hacia atras' },
        { code: 'MA01-OA02', eje: 'Numeros y operaciones', description: 'Leer numeros del 0 al 20 y representarlos en forma concreta, pictórica y simbólica' },
        { code: 'MA01-OA03', eje: 'Numeros y operaciones', description: 'Comparar y ordenar numeros del 0 al 20 de menor a mayor y viceversa, usando material concreto y monedas nacionales' },
        { code: 'MA01-OA04', eje: 'Numeros y operaciones', description: 'Estimar cantidades hasta 20 en situaciones concretas, usando un referente' },
        { code: 'MA01-OA05', eje: 'Numeros y operaciones', description: 'Componer y descomponer numeros del 0 al 20 de manera aditiva, en forma concreta, pictórica y simbólica' },
        { code: 'MA01-OA06', eje: 'Numeros y operaciones', description: 'Describir y aplicar estrategias de calculo mental para las adiciones y sustracciones hasta 20' },
        { code: 'MA01-OA07', eje: 'Numeros y operaciones', description: 'Describir y aplicar estrategias de calculo mental para determinar las adiciones y las sustracciones hasta 20' },
        { code: 'MA01-OA08', eje: 'Numeros y operaciones', description: 'Determinar las unidades y decenas en numeros del 0 al 20, agrupando de a 10' },
        { code: 'MA01-OA09', eje: 'Patrones y algebra', description: 'Demostrar que comprenden la adicion y sustraccion de numeros del 0 al 20 de forma concreta, pictórica y simbólica' },
        { code: 'MA01-OA10', eje: 'Patrones y algebra', description: 'Reconocer, describir, crear y continuar patrones repetitivos y patrones numéricos hasta el 20' },
        { code: 'MA01-OA11', eje: 'Geometria', description: 'Reconocer, visualizar y nombrar figuras 3D y 2D y asociarlas con objetos del entorno' },
        { code: 'MA01-OA12', eje: 'Geometria', description: 'Describir la posicion de objetos y personas con relacion a si mismos y a otros objetos y personas, usando un vocabulario pertinente' },
        { code: 'MA01-OA13', eje: 'Medicion', description: 'Determinar longitudes de objetos, usando unidades de medida no estandarizadas' },
        { code: 'MA01-OA14', eje: 'Medicion', description: 'Leer e interpretar lineas de tiempo y calendarios' },
        { code: 'MA01-OA15', eje: 'Datos y probabilidades', description: 'Recolectar y registrar datos para responder preguntas estadisticas sobre juegos con monedas y dados' },
    ],

    // ══════════════════════════════════════════════
    //  MATEMATICA 2° BASICO
    // ══════════════════════════════════════════════
    'MA02': [
        { code: 'MA02-OA01', eje: 'Numeros y operaciones', description: 'Contar numeros del 0 al 1.000 de 5 en 5, de 10 en 10, de 100 en 100' },
        { code: 'MA02-OA02', eje: 'Numeros y operaciones', description: 'Leer numeros del 0 al 100 y representarlos de manera concreta, pictórica y simbólica' },
        { code: 'MA02-OA03', eje: 'Numeros y operaciones', description: 'Comparar y ordenar numeros del 0 al 100 de menor a mayor y viceversa' },
        { code: 'MA02-OA04', eje: 'Numeros y operaciones', description: 'Estimar cantidades hasta 100 en situaciones concretas, usando un referente' },
        { code: 'MA02-OA05', eje: 'Numeros y operaciones', description: 'Componer y descomponer numeros del 0 al 100 de manera aditiva, en forma concreta, pictórica y simbólica' },
        { code: 'MA02-OA06', eje: 'Numeros y operaciones', description: 'Describir y aplicar estrategias de calculo mental para adiciones y sustracciones hasta 100' },
        { code: 'MA02-OA07', eje: 'Numeros y operaciones', description: 'Identificar las unidades y decenas en numeros del 0 al 100, representando las cantidades de acuerdo a su valor posicional' },
        { code: 'MA02-OA08', eje: 'Numeros y operaciones', description: 'Demostrar que comprende la adicion y sustraccion en el ambito del 0 al 100' },
        { code: 'MA02-OA09', eje: 'Numeros y operaciones', description: 'Demostrar que comprende la multiplicacion: usando representaciones concretas y pictóricas, grupos de igual cantidad, arreglos' },
        { code: 'MA02-OA10', eje: 'Patrones y algebra', description: 'Reconocer, describir, crear y continuar patrones repetitivos y patrones numéricos hasta el 100' },
        { code: 'MA02-OA11', eje: 'Patrones y algebra', description: 'Demostrar y explicar de manera concreta, pictórica y simbólica el efecto de sumar y restar 0 a un numero' },
        { code: 'MA02-OA12', eje: 'Geometria', description: 'Describir, comparar y construir figuras 2D (triángulos, cuadrados, rectángulos y círculos)' },
        { code: 'MA02-OA13', eje: 'Geometria', description: 'Describir, comparar y construir figuras 3D (cubos, paralelepípedos, esferas y conos)' },
        { code: 'MA02-OA14', eje: 'Medicion', description: 'Determinar las unidades de longitud estandarizadas (cm y m), usando la regla y el metro' },
        { code: 'MA02-OA15', eje: 'Medicion', description: 'Leer e interpretar calendarios en relacion a horas, dias, semanas, meses y fechas significativas' },
        { code: 'MA02-OA16', eje: 'Datos y probabilidades', description: 'Recolectar y registrar datos para responder preguntas estadísticas, usando tablas de conteo y pictogramas' },
    ],

    // ══════════════════════════════════════════════
    //  MATEMATICA 3° BASICO
    // ══════════════════════════════════════════════
    'MA03': [
        { code: 'MA03-OA01', eje: 'Numeros y operaciones', description: 'Contar numeros del 0 al 1.000 de 5 en 5, de 10 en 10, de 100 en 100' },
        { code: 'MA03-OA02', eje: 'Numeros y operaciones', description: 'Leer y escribir numeros del 0 al 1.000, representándolos de manera concreta, pictórica y simbólica' },
        { code: 'MA03-OA03', eje: 'Numeros y operaciones', description: 'Comparar y ordenar numeros del 0 al 1.000, utilizando la recta numérica u otros medios' },
        { code: 'MA03-OA04', eje: 'Numeros y operaciones', description: 'Identificar y describir las unidades, decenas y centenas en numeros del 0 al 1.000' },
        { code: 'MA03-OA05', eje: 'Numeros y operaciones', description: 'Estimar cantidades hasta 1.000, usando estrategias como el redondeo' },
        { code: 'MA03-OA06', eje: 'Numeros y operaciones', description: 'Demostrar que comprende la adicion y sustraccion de numeros del 0 al 1.000' },
        { code: 'MA03-OA07', eje: 'Numeros y operaciones', description: 'Describir y aplicar estrategias de calculo mental para adiciones y sustracciones con numeros hasta 1.000' },
        { code: 'MA03-OA08', eje: 'Numeros y operaciones', description: 'Demostrar que comprende las tablas de multiplicar hasta 10 de manera progresiva' },
        { code: 'MA03-OA09', eje: 'Numeros y operaciones', description: 'Demostrar que comprende la division en el contexto de las tablas de hasta 10x10' },
        { code: 'MA03-OA10', eje: 'Numeros y operaciones', description: 'Resolver problemas rutinarios de adicion, sustraccion, multiplicación y division' },
        { code: 'MA03-OA11', eje: 'Numeros y operaciones', description: 'Demostrar que comprenden las fracciones de uso común: 1/2, 1/3, 1/4 y 1/5' },
        { code: 'MA03-OA12', eje: 'Patrones y algebra', description: 'Generar, describir y registrar patrones numéricos, usando una variedad de estrategias en tablas del 100' },
        { code: 'MA03-OA13', eje: 'Patrones y algebra', description: 'Resolver ecuaciones de un paso que involucren adiciones y sustracciones' },
        { code: 'MA03-OA14', eje: 'Geometria', description: 'Describir la localizacion de un objeto en un mapa simple o cuadricula' },
        { code: 'MA03-OA15', eje: 'Geometria', description: 'Demostrar que comprende el concepto de angulo, identificando ejemplos en el entorno' },
        { code: 'MA03-OA16', eje: 'Geometria', description: 'Describir cubos, paralelepipedos, esferas, conos, cilindros y piramides de acuerdo a la forma de sus caras y el numero de aristas y vertices' },
        { code: 'MA03-OA17', eje: 'Medicion', description: 'Demostrar que comprende la medicion del peso (kg y g) con instrumentos y medición del tiempo (horas, medias horas, cuartos de hora y minutos)' },
        { code: 'MA03-OA18', eje: 'Medicion', description: 'Demostrar que comprende el perimetro de una figura regular e irregular' },
        { code: 'MA03-OA19', eje: 'Datos y probabilidades', description: 'Registrar y ordenar datos obtenidos de juegos aleatorios con dados y monedas, encontrando el dato mas frecuente' },
        { code: 'MA03-OA20', eje: 'Datos y probabilidades', description: 'Construir, leer e interpretar pictogramas y graficos de barra simple con escala' },
    ],

    // ══════════════════════════════════════════════
    //  MATEMATICA 4° BASICO
    // ══════════════════════════════════════════════
    'MA04': [
        { code: 'MA04-OA01', eje: 'Numeros y operaciones', description: 'Representar y describir numeros del 0 al 10.000, identificando el valor posicional de los digitos' },
        { code: 'MA04-OA02', eje: 'Numeros y operaciones', description: 'Describir y aplicar estrategias de calculo mental para multiplicaciones y divisiones hasta 10x10' },
        { code: 'MA04-OA03', eje: 'Numeros y operaciones', description: 'Demostrar que comprende la adicion y sustraccion de numeros hasta 10.000' },
        { code: 'MA04-OA04', eje: 'Numeros y operaciones', description: 'Fundamentar y aplicar las propiedades del 0 y del 1 en la multiplicacion y la propiedad del 1 en la division' },
        { code: 'MA04-OA05', eje: 'Numeros y operaciones', description: 'Demostrar que comprende la multiplicacion de numeros de tres digitos por numeros de un digito' },
        { code: 'MA04-OA06', eje: 'Numeros y operaciones', description: 'Demostrar que comprende la division con dividendos de dos digitos y divisores de un digito' },
        { code: 'MA04-OA07', eje: 'Numeros y operaciones', description: 'Resolver problemas rutinarios y no rutinarios, aplicando operaciones combinadas' },
        { code: 'MA04-OA08', eje: 'Numeros y operaciones', description: 'Demostrar que comprende las fracciones con denominador 100, 12, 10, 8, 6, 5, 4, 3, 2' },
        { code: 'MA04-OA09', eje: 'Numeros y operaciones', description: 'Representar y describir decimales (decimos y centesimos) en el contexto del dinero' },
        { code: 'MA04-OA10', eje: 'Numeros y operaciones', description: 'Resolver adiciones y sustracciones de decimales en el contexto del dinero' },
        { code: 'MA04-OA11', eje: 'Patrones y algebra', description: 'Reconocer y describir patrones numéricos en tablas que involucren una operacion, de manera manual y usando software educativo' },
        { code: 'MA04-OA12', eje: 'Patrones y algebra', description: 'Resolver ecuaciones e inecuaciones de un paso, que involucren adiciones y sustracciones' },
        { code: 'MA04-OA13', eje: 'Geometria', description: 'Describir la localizacion absoluta de un objeto en un mapa simple con cuadricula, utilizando el par ordenado' },
        { code: 'MA04-OA14', eje: 'Geometria', description: 'Determinar las vistas de figuras 3D desde el frente, desde el lado y desde arriba' },
        { code: 'MA04-OA15', eje: 'Geometria', description: 'Demostrar que comprende una linea de simetria, identificar y crear figuras simétricas y patrones' },
        { code: 'MA04-OA16', eje: 'Geometria', description: 'Trasladar figuras 2D de acuerdo a coordenadas en una cuadricula' },
        { code: 'MA04-OA17', eje: 'Geometria', description: 'Demostrar que comprende los angulos: identificando y estimando, clasificando en agudos, rectos y obtusos' },
        { code: 'MA04-OA18', eje: 'Medicion', description: 'Medir longitudes con unidades estandarizadas (m, cm, mm) y realizar conversiones entre estas' },
        { code: 'MA04-OA19', eje: 'Medicion', description: 'Medir y registrar el tiempo en horas, minutos y segundos' },
        { code: 'MA04-OA20', eje: 'Medicion', description: 'Determinar el area de rectangulos y cuadrados, estimando con cuadriculas' },
        { code: 'MA04-OA21', eje: 'Datos y probabilidades', description: 'Realizar encuestas, clasificar y organizar los datos obtenidos en tablas y visualizarlos en graficos de barra simple' },
        { code: 'MA04-OA22', eje: 'Datos y probabilidades', description: 'Leer e interpretar pictogramas y graficos de barra simple con escala y comunicar conclusiones' },
    ],

    // ══════════════════════════════════════════════
    //  MATEMATICA 5° BASICO
    // ══════════════════════════════════════════════
    'MA05': [
        { code: 'MA05-OA01', eje: 'Numeros y operaciones', description: 'Representar y describir numeros naturales de hasta mas de 6 digitos y menores que 1.000 millones' },
        { code: 'MA05-OA02', eje: 'Numeros y operaciones', description: 'Aplicar estrategias de calculo mental para la multiplicacion' },
        { code: 'MA05-OA03', eje: 'Numeros y operaciones', description: 'Demostrar que comprende la multiplicacion de numeros naturales de dos digitos por dos digitos' },
        { code: 'MA05-OA04', eje: 'Numeros y operaciones', description: 'Demostrar que comprende la division con dividendos de hasta cuatro digitos y divisores de un digito' },
        { code: 'MA05-OA05', eje: 'Numeros y operaciones', description: 'Resolver problemas rutinarios y no rutinarios que involucren las cuatro operaciones y combinaciones de ellas' },
        { code: 'MA05-OA06', eje: 'Numeros y operaciones', description: 'Demostrar que comprende las fracciones propias, impropias y numeros mixtos' },
        { code: 'MA05-OA07', eje: 'Numeros y operaciones', description: 'Resolver adiciones y sustracciones de fracciones propias con denominadores hasta 12' },
        { code: 'MA05-OA08', eje: 'Numeros y operaciones', description: 'Demostrar que comprende los decimales, representándolos de manera concreta, pictórica y simbólica' },
        { code: 'MA05-OA09', eje: 'Numeros y operaciones', description: 'Comparar y ordenar decimales hasta la milésima' },
        { code: 'MA05-OA10', eje: 'Numeros y operaciones', description: 'Resolver adiciones y sustracciones con numeros decimales' },
        { code: 'MA05-OA11', eje: 'Numeros y operaciones', description: 'Resolver multiplicaciones y divisiones de decimales por numeros naturales' },
        { code: 'MA05-OA12', eje: 'Patrones y algebra', description: 'Resolver ecuaciones de un paso que involucren adiciones, sustracciones y la incognita en diferentes posiciones' },
        { code: 'MA05-OA13', eje: 'Geometria', description: 'Describir y dar ejemplos de aristas y caras de figuras 3D y lados de figuras 2D' },
        { code: 'MA05-OA14', eje: 'Geometria', description: 'Identificar y dibujar puntos en el primer cuadrante del plano cartesiano' },
        { code: 'MA05-OA15', eje: 'Geometria', description: 'Medir angulos con transportador y reconocer tipos de angulos' },
        { code: 'MA05-OA16', eje: 'Medicion', description: 'Realizar conversiones entre unidades de longitud (km, m, cm, mm), volumen (L, mL) y tiempo' },
        { code: 'MA05-OA17', eje: 'Medicion', description: 'Calcular el area de triangulos, paralelogramos y trapecios, y estimar el area de figuras irregulares' },
        { code: 'MA05-OA18', eje: 'Datos y probabilidades', description: 'Calcular el promedio de datos e interpretar en contextos significativos' },
        { code: 'MA05-OA19', eje: 'Datos y probabilidades', description: 'Leer, interpretar y completar tablas, graficos de barra simple y de linea' },
        { code: 'MA05-OA20', eje: 'Datos y probabilidades', description: 'Comparar probabilidades de distintos eventos, usando material concreto y pictórico' },
    ],

    // ══════════════════════════════════════════════
    //  MATEMATICA 6° BASICO
    // ══════════════════════════════════════════════
    'MA06': [
        { code: 'MA06-OA01', eje: 'Numeros y operaciones', description: 'Demostrar que comprende la multiplicacion y division de numeros naturales, la multiplicacion de decimales y la division de decimales por numeros naturales' },
        { code: 'MA06-OA02', eje: 'Numeros y operaciones', description: 'Resolver problemas rutinarios y no rutinarios que involucren las cuatro operaciones con numeros naturales y decimales' },
        { code: 'MA06-OA03', eje: 'Numeros y operaciones', description: 'Demostrar que comprende las fracciones y numeros mixtos; su comparacion, orden y operaciones (adicion, sustraccion, multiplicacion)' },
        { code: 'MA06-OA04', eje: 'Numeros y operaciones', description: 'Demostrar que comprende el concepto de razon y proporcion, incluyendo porcentajes' },
        { code: 'MA06-OA05', eje: 'Numeros y operaciones', description: 'Resolver problemas que involucren porcentajes en contextos diversos' },
        { code: 'MA06-OA06', eje: 'Patrones y algebra', description: 'Representar generalizaciones de patrones numéricos, usando expresiones con letras y con una incógnita' },
        { code: 'MA06-OA07', eje: 'Patrones y algebra', description: 'Resolver ecuaciones de primer grado con una incógnita que involucren adiciones y sustracciones' },
        { code: 'MA06-OA08', eje: 'Geometria', description: 'Construir figuras 3D a partir de redes e identificar redes de cubos, paralelepípedos, prismas, pirámides, conos y cilindros' },
        { code: 'MA06-OA09', eje: 'Geometria', description: 'Demostrar que comprende los angulos: midiendo, estimando, construyendo con un transportador' },
        { code: 'MA06-OA10', eje: 'Geometria', description: 'Construir y comparar triángulos de acuerdo a la medida de sus lados y/o angulos, con regla y compas' },
        { code: 'MA06-OA11', eje: 'Geometria', description: 'Realizar teselados regulares de figuras 2D y explicar las condiciones para que se produzcan' },
        { code: 'MA06-OA12', eje: 'Geometria', description: 'Identificar y realizar reflexiones, traslaciones y rotaciones de figuras 2D' },
        { code: 'MA06-OA13', eje: 'Medicion', description: 'Calcular el volumen de cubos y paralelepípedos, expresando el resultado en cm³, m³ y mm³' },
        { code: 'MA06-OA14', eje: 'Medicion', description: 'Calcular el area de la superficie de cubos y paralelepipedos usando redes' },
        { code: 'MA06-OA15', eje: 'Datos y probabilidades', description: 'Interpretar datos desde tablas y graficos de barra doble, usando informacion de los datos' },
        { code: 'MA06-OA16', eje: 'Datos y probabilidades', description: 'Comparar distribuciones de dos grupos, usando diagramas de puntos y de tallo y hoja' },
    ],

    // ══════════════════════════════════════════════
    //  MATEMATICA 7° BASICO
    // ══════════════════════════════════════════════
    'MA07': [
        { code: 'MA07-OA01', eje: 'Numeros y operaciones', description: 'Mostrar que comprenden los numeros enteros: representándolos en la recta numérica, ordenándolos, operando con ellos' },
        { code: 'MA07-OA02', eje: 'Numeros y operaciones', description: 'Resolver problemas que involucren adiciones y sustracciones de numeros enteros' },
        { code: 'MA07-OA03', eje: 'Numeros y operaciones', description: 'Demostrar que comprenden las operaciones con decimales (adicion, sustraccion, multiplicacion, division)' },
        { code: 'MA07-OA04', eje: 'Numeros y operaciones', description: 'Demostrar que comprenden la multiplicacion y division de fracciones positivas, usando representaciones' },
        { code: 'MA07-OA05', eje: 'Numeros y operaciones', description: 'Mostrar que comprenden el concepto de porcentaje y resolver problemas con porcentajes superiores al 100%' },
        { code: 'MA07-OA06', eje: 'Numeros y operaciones', description: 'Resolver problemas que involucren potencias de base natural y exponente natural' },
        { code: 'MA07-OA07', eje: 'Algebra', description: 'Reducir expresiones algebraicas y resolver ecuaciones de primer grado con una incógnita' },
        { code: 'MA07-OA08', eje: 'Algebra', description: 'Modelar situaciones de la vida diaria y de las ciencias usando ecuaciones de primer grado' },
        { code: 'MA07-OA09', eje: 'Algebra', description: 'Representar relaciones entre dos variables usando tablas y graficos' },
        { code: 'MA07-OA10', eje: 'Geometria', description: 'Construir objetos geométricos de manera manual y con software educativo' },
        { code: 'MA07-OA11', eje: 'Geometria', description: 'Mostrar que comprenden el circulo: calculando el perimetro y el area' },
        { code: 'MA07-OA12', eje: 'Geometria', description: 'Calcular el area de triángulos, paralelogramos y trapecios, e investigar sobre el area de circulos' },
        { code: 'MA07-OA13', eje: 'Geometria', description: 'Construir triángulos dados tres elementos (lados, angulos), usando regla y compás o software geometrico' },
        { code: 'MA07-OA14', eje: 'Datos y probabilidades', description: 'Calcular e interpretar medidas de tendencia central y el rango en datos numéricos no agrupados' },
        { code: 'MA07-OA15', eje: 'Datos y probabilidades', description: 'Utilizar la frecuencia absoluta y la frecuencia relativa para representar información' },
        { code: 'MA07-OA16', eje: 'Datos y probabilidades', description: 'Usar experimentos aleatorios para determinar probabilidades' },
    ],

    // ══════════════════════════════════════════════
    //  MATEMATICA 8° BASICO
    // ══════════════════════════════════════════════
    'MA08': [
        { code: 'MA08-OA01', eje: 'Numeros y operaciones', description: 'Mostrar que comprenden las operaciones con numeros enteros (multiplicacion y division)' },
        { code: 'MA08-OA02', eje: 'Numeros y operaciones', description: 'Utilizar las operaciones de multiplicacion y division con numeros decimales y fracciones positivas' },
        { code: 'MA08-OA03', eje: 'Numeros y operaciones', description: 'Resolver problemas que involucren proporcionalidad directa e inversa, porcentajes y tasas' },
        { code: 'MA08-OA04', eje: 'Numeros y operaciones', description: 'Demostrar que comprende las potencias de base entera y exponente natural, y sus propiedades' },
        { code: 'MA08-OA05', eje: 'Algebra', description: 'Resolver ecuaciones de primer grado con una incognita, que involucren adiciones, sustracciones, multiplicaciones y divisiones' },
        { code: 'MA08-OA06', eje: 'Algebra', description: 'Modelar situaciones usando ecuaciones de primer grado con una incógnita' },
        { code: 'MA08-OA07', eje: 'Algebra', description: 'Resolver inecuaciones de primer grado con una incógnita' },
        { code: 'MA08-OA08', eje: 'Algebra', description: 'Graficar en el plano cartesiano la relación entre dos variables, interpretando la información' },
        { code: 'MA08-OA09', eje: 'Algebra', description: 'Mostrar que comprende la funcion afín: representándola de manera verbal, gráfica y algebraica' },
        { code: 'MA08-OA10', eje: 'Geometria', description: 'Mostrar que comprenden la composicion de transformaciones isometricas (traslaciones, reflexiones y rotaciones)' },
        { code: 'MA08-OA11', eje: 'Geometria', description: 'Mostrar que comprende el Teorema de Pitágoras de manera concreta, pictórica y simbólica' },
        { code: 'MA08-OA12', eje: 'Geometria', description: 'Explicar las relaciones entre el area y el volumen de prismas rectos y cilindros' },
        { code: 'MA08-OA13', eje: 'Geometria', description: 'Calcular el volumen de prismas rectos, cilindros, piramides, conos y esferas' },
        { code: 'MA08-OA14', eje: 'Datos y probabilidades', description: 'Utilizar permutaciones y combinaciones sencillas para calcular probabilidades' },
        { code: 'MA08-OA15', eje: 'Datos y probabilidades', description: 'Mostrar que comprende las medidas de tendencia central y el rango para datos agrupados en tablas de frecuencia' },
        { code: 'MA08-OA16', eje: 'Datos y probabilidades', description: 'Evaluar la forma en que los datos están presentados y usar la información para comparar' },
    ],

    // ══════════════════════════════════════════════
    //  LENGUAJE Y COMUNICACION 1° BASICO
    // ══════════════════════════════════════════════
    'LE01': [
        { code: 'LE01-OA01', eje: 'Lectura', description: 'Reconocer que los textos escritos transmiten mensajes y que son escritos por alguien para cumplir un proposito' },
        { code: 'LE01-OA02', eje: 'Lectura', description: 'Reconocer que las palabras son unidades de significado separadas por espacios en el texto escrito' },
        { code: 'LE01-OA03', eje: 'Lectura', description: 'Identificar los sonidos que componen las palabras (conciencia fonológica)' },
        { code: 'LE01-OA04', eje: 'Lectura', description: 'Leer palabras aisladas y en contexto, aplicando su conocimiento de la correspondencia letra-sonido' },
        { code: 'LE01-OA05', eje: 'Lectura', description: 'Leer textos breves en voz alta para adquirir fluidez: pronunciando cada palabra con precisión' },
        { code: 'LE01-OA06', eje: 'Lectura', description: 'Comprender textos, aplicando estrategias de comprensión lectora (relacionar con experiencias, visualizar)' },
        { code: 'LE01-OA07', eje: 'Lectura', description: 'Leer independientemente y familiarizarse con un amplio repertorio de literatura: poemas, cuentos folclóricos y de autor' },
        { code: 'LE01-OA08', eje: 'Lectura', description: 'Demostrar comprensión de narraciones: extrayendo información explicita e implícita, reconstruyendo la secuencia' },
        { code: 'LE01-OA09', eje: 'Lectura', description: 'Leer habitualmente y disfrutar los mejores poemas de autor y de la tradición oral, comprendiendo el significado' },
        { code: 'LE01-OA10', eje: 'Lectura', description: 'Leer independientemente y comprender textos no literarios escritos con oraciones simples (cartas, notas, instrucciones)' },
        { code: 'LE01-OA11', eje: 'Escritura', description: 'Escribir oraciones completas para transmitir mensajes' },
        { code: 'LE01-OA12', eje: 'Escritura', description: 'Escribir frecuentemente, para desarrollar la creatividad y expresar sus ideas' },
        { code: 'LE01-OA13', eje: 'Escritura', description: 'Experimentar con la escritura para comunicar hechos, ideas y sentimientos' },
        { code: 'LE01-OA14', eje: 'Comunicacion oral', description: 'Recitar con entonacion y expresion poemas, rimas, canciones, trabalenguas y adivinanzas' },
        { code: 'LE01-OA15', eje: 'Comunicacion oral', description: 'Comprender y disfrutar versiones completas de obras de la literatura, narradas o leidas por un adulto' },
        { code: 'LE01-OA16', eje: 'Comunicacion oral', description: 'Interactuar de acuerdo con las convenciones sociales en diferentes situaciones (presentarse, saludar, despedirse)' },
        { code: 'LE01-OA17', eje: 'Comunicacion oral', description: 'Expresarse de manera coherente y articulada sobre temas de su interés' },
        { code: 'LE01-OA18', eje: 'Comunicacion oral', description: 'Incorporar de manera pertinente en sus intervenciones orales el vocabulario nuevo extraido de textos escuchados o leidos' },
    ],

    // ══════════════════════════════════════════════
    //  LENGUAJE Y COMUNICACION 2° BASICO
    // ══════════════════════════════════════════════
    'LE02': [
        { code: 'LE02-OA01', eje: 'Lectura', description: 'Leer textos significativos que incluyan palabras con hiatos y diptongos, con grupos consonánticos y con combinación ce-ci, que-qui, ge-gi, gue-gui, güe-güi' },
        { code: 'LE02-OA02', eje: 'Lectura', description: 'Leer en voz alta para adquirir fluidez: pronunciando cada palabra con precisión, respetando los signos de puntuacion' },
        { code: 'LE02-OA03', eje: 'Lectura', description: 'Comprender textos aplicando estrategias de comprensión lectora: relacionar la información del texto con sus experiencias y conocimientos' },
        { code: 'LE02-OA04', eje: 'Lectura', description: 'Leer independientemente y familiarizarse con un amplio repertorio de literatura para aumentar su conocimiento del mundo' },
        { code: 'LE02-OA05', eje: 'Lectura', description: 'Demostrar comprensión de las narraciones leidas: extrayendo información explícita e implícita' },
        { code: 'LE02-OA06', eje: 'Lectura', description: 'Leer habitualmente y disfrutar los mejores poemas de autor y de la tradición oral adecuados a su edad' },
        { code: 'LE02-OA07', eje: 'Lectura', description: 'Leer independientemente y comprender textos no literarios (cartas, notas, instrucciones y artículos informativos)' },
        { code: 'LE02-OA08', eje: 'Lectura', description: 'Desarrollar el gusto por la lectura, leyendo habitualmente diversos textos' },
        { code: 'LE02-OA09', eje: 'Lectura', description: 'Asistir habitualmente a la biblioteca para encontrar información y elegir libros, cuidando el material' },
        { code: 'LE02-OA10', eje: 'Lectura', description: 'Buscar información sobre un tema en una fuente dada por el docente, para llevar a cabo una investigación' },
        { code: 'LE02-OA11', eje: 'Escritura', description: 'Buscar información sobre un tema en una fuente dada por el docente (página de internet, sección del diario, capítulo de un libro)' },
        { code: 'LE02-OA12', eje: 'Escritura', description: 'Escribir frecuentemente, para desarrollar la creatividad y expresar sus ideas, textos como poemas, diarios de vida, anécdotas, cartas' },
        { code: 'LE02-OA13', eje: 'Escritura', description: 'Escribir creativamente narraciones (experiencias personales, relatos de hechos, cuentos, etc.) que tengan inicio, desarrollo y desenlace' },
        { code: 'LE02-OA14', eje: 'Escritura', description: 'Escribir, revisar y editar sus textos para satisfacer un propósito y transmitir sus ideas con claridad' },
        { code: 'LE02-OA15', eje: 'Escritura', description: 'Incorporar de manera pertinente en la escritura el vocabulario nuevo extraído de textos escuchados o leídos' },
        { code: 'LE02-OA16', eje: 'Comunicacion oral', description: 'Comprender textos orales (explicaciones, instrucciones, relatos, anécdotas) para obtener información' },
        { code: 'LE02-OA17', eje: 'Comunicacion oral', description: 'Disfrutar de la experiencia de asistir a obras de teatro infantiles o representaciones para ampliar sus posibilidades de expresión' },
        { code: 'LE02-OA18', eje: 'Comunicacion oral', description: 'Expresarse de manera coherente y articulada sobre temas de su interés: presentando información, opiniones, narrando experiencias' },
    ],

    // ══════════════════════════════════════════════
    //  LENGUAJE Y COMUNICACION 3° BASICO
    // ══════════════════════════════════════════════
    'LE03': [
        { code: 'LE03-OA01', eje: 'Lectura', description: 'Leer en voz alta de manera fluida variados textos apropiados a su edad: pronunciando las palabras con precision, respetando signos de puntuacion' },
        { code: 'LE03-OA02', eje: 'Lectura', description: 'Comprender textos, aplicando estrategias de comprensión lectora: relacionar la información con sus experiencias y conocimientos' },
        { code: 'LE03-OA03', eje: 'Lectura', description: 'Leer y familiarizarse con un amplio repertorio de literatura para aumentar su conocimiento del mundo y desarrollar su imaginación' },
        { code: 'LE03-OA04', eje: 'Lectura', description: 'Profundizar su comprensión de las narraciones leídas: extrayendo información explícita e implícita' },
        { code: 'LE03-OA05', eje: 'Lectura', description: 'Comprender poemas adecuados al nivel e interpretar el lenguaje figurado presente en ellos' },
        { code: 'LE03-OA06', eje: 'Lectura', description: 'Leer independientemente y comprender textos no literarios (cartas, biografias, relatos historicos, instrucciones, libros y artículos informativos, noticias)' },
        { code: 'LE03-OA07', eje: 'Lectura', description: 'Desarrollar el gusto por la lectura, leyendo habitualmente diversos textos' },
        { code: 'LE03-OA08', eje: 'Lectura', description: 'Asistir habitualmente a la biblioteca para satisfacer diversos propósitos (encontrar información, elegir libros, estudiar, trabajar o investigar)' },
        { code: 'LE03-OA09', eje: 'Lectura', description: 'Buscar información sobre un tema en libros, internet, diarios, revistas, enciclopedias, atlas, etc., para llevar a cabo una investigación' },
        { code: 'LE03-OA10', eje: 'Lectura', description: 'Determinar el significado de palabras desconocidas, usando el orden alfabético para encontrarlas en un diccionario infantil o ilustrado' },
        { code: 'LE03-OA11', eje: 'Escritura', description: 'Escribir frecuentemente, para desarrollar la creatividad y expresar sus ideas' },
        { code: 'LE03-OA12', eje: 'Escritura', description: 'Escribir creativamente narraciones (experiencias personales, relatos de hechos, cuentos, etc.)' },
        { code: 'LE03-OA13', eje: 'Escritura', description: 'Escribir cartas, instrucciones, afiches, reportes de una experiencia, entre otros, para lograr diferentes propositos' },
        { code: 'LE03-OA14', eje: 'Escritura', description: 'Escribir, revisar y editar sus textos para satisfacer un proposito y transmitir sus ideas con claridad' },
        { code: 'LE03-OA15', eje: 'Escritura', description: 'Escribir con letra clara para que pueda ser leida por otros con facilidad' },
        { code: 'LE03-OA16', eje: 'Comunicacion oral', description: 'Comprender textos orales (explicaciones, instrucciones, noticias, documentales, películas, relatos, anécdotas)' },
        { code: 'LE03-OA17', eje: 'Comunicacion oral', description: 'Participar activamente en conversaciones grupales sobre textos leídos o escuchados en clases' },
        { code: 'LE03-OA18', eje: 'Comunicacion oral', description: 'Expresarse de manera coherente y articulada sobre temas de su interés' },
    ],

    // ══════════════════════════════════════════════
    //  LENGUAJE Y COMUNICACION 4° BASICO
    // ══════════════════════════════════════════════
    'LE04': [
        { code: 'LE04-OA01', eje: 'Lectura', description: 'Leer en voz alta de manera fluida variados textos apropiados a su edad: pronunciando las palabras con precision' },
        { code: 'LE04-OA02', eje: 'Lectura', description: 'Comprender textos aplicando estrategias de comprensión lectora: relacionar la información del texto con sus experiencias y conocimientos' },
        { code: 'LE04-OA03', eje: 'Lectura', description: 'Leer y familiarizarse con un amplio repertorio de literatura para aumentar su conocimiento del mundo y desarrollar su imaginación' },
        { code: 'LE04-OA04', eje: 'Lectura', description: 'Profundizar su comprensión de las narraciones leídas: extrayendo información explícita e implícita, determinando las consecuencias de hechos o acciones' },
        { code: 'LE04-OA05', eje: 'Lectura', description: 'Comprender poemas adecuados al nivel e interpretar el lenguaje figurado presente en ellos' },
        { code: 'LE04-OA06', eje: 'Lectura', description: 'Leer independientemente y comprender textos no literarios (cartas, biografías, relatos históricos, instrucciones, libros y artículos informativos, noticias)' },
        { code: 'LE04-OA07', eje: 'Lectura', description: 'Desarrollar el gusto por la lectura, leyendo habitualmente diversos textos' },
        { code: 'LE04-OA08', eje: 'Lectura', description: 'Asistir habitualmente a la biblioteca para satisfacer diversos propósitos' },
        { code: 'LE04-OA09', eje: 'Lectura', description: 'Buscar y clasificar información sobre un tema en libros, internet, diarios, revistas, enciclopedias, atlas, etc.' },
        { code: 'LE04-OA10', eje: 'Lectura', description: 'Aplicar estrategias para determinar el significado de palabras nuevas: claves del texto, raíces y afijos, preguntar a otro, diccionarios' },
        { code: 'LE04-OA11', eje: 'Escritura', description: 'Escribir frecuentemente, para desarrollar la creatividad y expresar sus ideas, textos como poemas, diarios de vida, cuentos, anécdotas, cartas, comentarios sobre lecturas' },
        { code: 'LE04-OA12', eje: 'Escritura', description: 'Escribir creativamente narraciones (experiencias personales, relatos de hechos, cuentos) que incluyan inicio, desarrollo y desenlace' },
        { code: 'LE04-OA13', eje: 'Escritura', description: 'Escribir artículos informativos para comunicar información sobre un tema' },
        { code: 'LE04-OA14', eje: 'Escritura', description: 'Escribir cartas, instrucciones, afiches, reportes de una experiencia o noticias, entre otros' },
        { code: 'LE04-OA15', eje: 'Escritura', description: 'Escribir con letra clara para que pueda ser leida por otros con facilidad' },
        { code: 'LE04-OA16', eje: 'Escritura', description: 'Planificar la escritura: estableciendo proposito y destinatario, generando ideas, organizando ideas' },
        { code: 'LE04-OA17', eje: 'Comunicacion oral', description: 'Comprender textos orales (explicaciones, instrucciones, noticias, documentales, películas, relatos, anécdotas)' },
        { code: 'LE04-OA18', eje: 'Comunicacion oral', description: 'Participar activamente en conversaciones grupales sobre textos leidos o escuchados en clases' },
    ],

    // ══════════════════════════════════════════════
    //  LENGUAJE Y COMUNICACION 5° BASICO
    // ══════════════════════════════════════════════
    'LE05': [
        { code: 'LE05-OA01', eje: 'Lectura', description: 'Leer de manera fluida textos variados apropiados a su edad: pronunciando las palabras con precisión, respetando la prosodia indicada por signos de puntuación' },
        { code: 'LE05-OA02', eje: 'Lectura', description: 'Comprender textos aplicando estrategias de comprensión lectora: relacionar la información del texto con sus experiencias, visualizar lo que describe el texto' },
        { code: 'LE05-OA03', eje: 'Lectura', description: 'Leer y familiarizarse con un amplio repertorio de literatura para aumentar su conocimiento del mundo y desarrollar su imaginación (novelas, cuentos, leyendas, poemas, noticias)' },
        { code: 'LE05-OA04', eje: 'Lectura', description: 'Analizar aspectos relevantes de las narraciones leidas: interpretar el lenguaje figurado, expresar opiniones fundamentadas sobre actitudes y acciones' },
        { code: 'LE05-OA05', eje: 'Lectura', description: 'Analizar aspectos relevantes de diversos poemas para profundizar su comprensión' },
        { code: 'LE05-OA06', eje: 'Lectura', description: 'Leer independientemente y comprender textos no literarios (cartas, biografías, relatos historicos, libros y artículos informativos, noticias)' },
        { code: 'LE05-OA07', eje: 'Lectura', description: 'Evaluar criticamente la información presente en textos de diversa procedencia' },
        { code: 'LE05-OA08', eje: 'Lectura', description: 'Sintetizar y registrar las ideas principales de textos leidos para ampliar su conocimiento' },
        { code: 'LE05-OA09', eje: 'Lectura', description: 'Desarrollar el gusto por la lectura, leyendo habitualmente diversos textos' },
        { code: 'LE05-OA10', eje: 'Lectura', description: 'Asistir habitualmente a la biblioteca para satisfacer diversos propositos' },
        { code: 'LE05-OA11', eje: 'Lectura', description: 'Buscar y clasificar información sobre un tema en diversas fuentes' },
        { code: 'LE05-OA12', eje: 'Escritura', description: 'Aplicar estrategias para determinar el significado de palabras nuevas' },
        { code: 'LE05-OA13', eje: 'Escritura', description: 'Escribir frecuentemente, para desarrollar la creatividad y expresar sus ideas' },
        { code: 'LE05-OA14', eje: 'Escritura', description: 'Escribir creativamente narraciones (relatos de experiencias personales, noticias, cuentos)' },
        { code: 'LE05-OA15', eje: 'Escritura', description: 'Escribir artículos informativos para comunicar información sobre un tema' },
        { code: 'LE05-OA16', eje: 'Escritura', description: 'Escribir, revisar y editar sus textos para satisfacer un proposito y transmitir sus ideas con claridad' },
        { code: 'LE05-OA17', eje: 'Comunicacion oral', description: 'Comprender textos orales (explicaciones, instrucciones, noticias, documentales, películas, testimonios, relatos)' },
        { code: 'LE05-OA18', eje: 'Comunicacion oral', description: 'Expresarse de manera clara y efectiva en exposiciones orales para comunicar temas de su interés' },
    ],

    // ══════════════════════════════════════════════
    //  LENGUAJE Y COMUNICACION 6° BASICO
    // ══════════════════════════════════════════════
    'LE06': [
        { code: 'LE06-OA01', eje: 'Lectura', description: 'Leer de manera fluida textos variados apropiados a su edad' },
        { code: 'LE06-OA02', eje: 'Lectura', description: 'Comprender textos aplicando estrategias de comprensión lectora' },
        { code: 'LE06-OA03', eje: 'Lectura', description: 'Leer y familiarizarse con un amplio repertorio de literatura para aumentar su conocimiento del mundo y desarrollar su imaginación' },
        { code: 'LE06-OA04', eje: 'Lectura', description: 'Analizar aspectos relevantes de las narraciones leídas: interpretar el lenguaje figurado, comparar textos con otros textos y con sus experiencias' },
        { code: 'LE06-OA05', eje: 'Lectura', description: 'Analizar aspectos relevantes de diversos poemas para profundizar su comprensión' },
        { code: 'LE06-OA06', eje: 'Lectura', description: 'Leer independientemente y comprender textos no literarios (cartas, biografias, relatos historicos, libros y artículos informativos, noticias)' },
        { code: 'LE06-OA07', eje: 'Lectura', description: 'Evaluar criticamente la información presente en textos de diversa procedencia' },
        { code: 'LE06-OA08', eje: 'Lectura', description: 'Sintetizar, registrar y ordenar las ideas principales de textos leidos para ampliar su conocimiento y comunicar la informacion' },
        { code: 'LE06-OA09', eje: 'Lectura', description: 'Desarrollar el gusto por la lectura, leyendo habitualmente diversos textos' },
        { code: 'LE06-OA10', eje: 'Lectura', description: 'Asistir habitualmente a la biblioteca para satisfacer diversos propositos' },
        { code: 'LE06-OA11', eje: 'Escritura', description: 'Buscar y clasificar información sobre un tema en diversas fuentes (libros, internet, diarios)' },
        { code: 'LE06-OA12', eje: 'Escritura', description: 'Aplicar estrategias para determinar el significado de palabras nuevas: claves contextuales, raíces y afijos, preguntar a otro, diccionarios' },
        { code: 'LE06-OA13', eje: 'Escritura', description: 'Escribir frecuentemente, para desarrollar la creatividad y expresar sus ideas' },
        { code: 'LE06-OA14', eje: 'Escritura', description: 'Escribir creativamente narraciones (relatos de experiencias personales, noticias, cuentos, etc.)' },
        { code: 'LE06-OA15', eje: 'Escritura', description: 'Escribir artículos informativos para comunicar información sobre un tema presentando el tema, desarrollándolo e incluyendo una conclusión' },
        { code: 'LE06-OA16', eje: 'Escritura', description: 'Planificar sus textos: estableciendo proposito y destinatario, generando ideas a partir de sus conocimientos e investigación' },
        { code: 'LE06-OA17', eje: 'Comunicacion oral', description: 'Comprender textos orales (explicaciones, instrucciones, noticias, documentales, películas, testimonios, relatos)' },
        { code: 'LE06-OA18', eje: 'Comunicacion oral', description: 'Expresarse de manera clara y efectiva en exposiciones orales para comunicar temas de su interés' },
    ],

    // ══════════════════════════════════════════════
    //  LENGUAJE Y COMUNICACION 7° BASICO
    // ══════════════════════════════════════════════
    'LE07': [
        { code: 'LE07-OA01', eje: 'Lectura', description: 'Leer habitualmente para aprender y recrearse, y seleccionar textos de acuerdo con sus preferencias y propositos' },
        { code: 'LE07-OA02', eje: 'Lectura', description: 'Reflexionar sobre las diferentes dimensiones de la experiencia humana, propia y ajena, a partir de la lectura de obras literarias y otros textos' },
        { code: 'LE07-OA03', eje: 'Lectura', description: 'Analizar las narraciones leidas para enriquecer su comprensión: determinando el conflicto central, los personajes, ambiente fisico y psicologico' },
        { code: 'LE07-OA04', eje: 'Lectura', description: 'Analizar los poemas leidos para enriquecer su comprensión: explicando como el lenguaje poético que emplea el autor apela a los sentidos' },
        { code: 'LE07-OA05', eje: 'Lectura', description: 'Analizar textos dramáticos leidos o vistos para enriquecer su comprensión' },
        { code: 'LE07-OA06', eje: 'Lectura', description: 'Leer independientemente y comprender textos no literarios para ampliar su conocimiento del mundo y formarse una opinión' },
        { code: 'LE07-OA07', eje: 'Lectura', description: 'Formular una interpretacion de los textos literarios leidos o vistos, que sea coherente con su análisis' },
        { code: 'LE07-OA08', eje: 'Lectura', description: 'Analizar y evaluar textos de los medios de comunicación' },
        { code: 'LE07-OA09', eje: 'Lectura', description: 'Analizar y evaluar textos con finalidad argumentativa como columnas de opinion, cartas y discursos' },
        { code: 'LE07-OA10', eje: 'Escritura', description: 'Escribir, con el proposito de explicar un tema, textos de diversos géneros (artículos, informes, reportajes)' },
        { code: 'LE07-OA11', eje: 'Escritura', description: 'Escribir, con el proposito de persuadir, textos breves de diversos géneros (columnas de opinion, cartas al director, afiches)' },
        { code: 'LE07-OA12', eje: 'Escritura', description: 'Expresarse en forma creativa por medio de la escritura de textos de diversos géneros (relatos, cuentos, poemas)' },
        { code: 'LE07-OA13', eje: 'Escritura', description: 'Planificar, escribir, revisar, reescribir y editar sus textos en funcion del contexto, el destinatario y el proposito' },
        { code: 'LE07-OA14', eje: 'Comunicacion oral', description: 'Dialogar constructivamente para debatir o explorar ideas: manteniendo el foco, fundamentando su postura con evidencia' },
        { code: 'LE07-OA15', eje: 'Comunicacion oral', description: 'Expresarse de manera clara y efectiva en presentaciones orales para comunicar temas de su interés' },
        { code: 'LE07-OA16', eje: 'Comunicacion oral', description: 'Usar conscientemente los elementos que influyen y configuran los textos orales: volumen de la voz, velocidad, pausas, entonacion' },
    ],

    // ══════════════════════════════════════════════
    //  LENGUAJE Y COMUNICACION 8° BASICO
    // ══════════════════════════════════════════════
    'LE08': [
        { code: 'LE08-OA01', eje: 'Lectura', description: 'Leer habitualmente para aprender y recrearse, y seleccionar textos de acuerdo con sus preferencias y propositos' },
        { code: 'LE08-OA02', eje: 'Lectura', description: 'Reflexionar sobre las diferentes dimensiones de la experiencia humana, propia y ajena, a partir de la lectura de obras literarias' },
        { code: 'LE08-OA03', eje: 'Lectura', description: 'Analizar las narraciones leidas para enriquecer su comprensión: determinando el conflicto central, los personajes, su evolución, el narrador' },
        { code: 'LE08-OA04', eje: 'Lectura', description: 'Analizar los poemas leidos para enriquecer su comprensión: explicando como el lenguaje poético que emplea el autor apela a los sentidos' },
        { code: 'LE08-OA05', eje: 'Lectura', description: 'Analizar textos dramáticos leidos o vistos para enriquecer su comprensión' },
        { code: 'LE08-OA06', eje: 'Lectura', description: 'Leer independientemente y comprender textos no literarios (biografías, relatos históricos, textos de divulgación científica, noticias, reportajes, cartas, textos legales, avisos)' },
        { code: 'LE08-OA07', eje: 'Lectura', description: 'Formular una interpretacion de los textos literarios leidos o vistos, que sea coherente con su análisis' },
        { code: 'LE08-OA08', eje: 'Lectura', description: 'Analizar y evaluar textos de los medios de comunicación, considerando su propósito, quién los escribe y en qué soporte' },
        { code: 'LE08-OA09', eje: 'Lectura', description: 'Analizar y evaluar textos con finalidad argumentativa como columnas de opinion, cartas, discursos y ensayos' },
        { code: 'LE08-OA10', eje: 'Escritura', description: 'Escribir, con el proposito de explicar un tema, textos de diversos géneros (artículos, informes, reportajes, etc.)' },
        { code: 'LE08-OA11', eje: 'Escritura', description: 'Escribir, con el proposito de persuadir, textos breves de diversos géneros (columnas de opinión, cartas al director, afiches, comentarios)' },
        { code: 'LE08-OA12', eje: 'Escritura', description: 'Expresarse en forma creativa por medio de la escritura de textos de diversos géneros (relatos, cuentos, poemas, diarios)' },
        { code: 'LE08-OA13', eje: 'Escritura', description: 'Planificar, escribir, revisar, reescribir y editar sus textos en función del contexto, el destinatario y el propósito' },
        { code: 'LE08-OA14', eje: 'Comunicacion oral', description: 'Dialogar constructivamente para debatir o explorar ideas: manteniendo el foco en un tema' },
        { code: 'LE08-OA15', eje: 'Comunicacion oral', description: 'Expresarse de manera clara y efectiva en presentaciones orales para comunicar temas de su interés' },
        { code: 'LE08-OA16', eje: 'Comunicacion oral', description: 'Usar conscientemente los elementos que influyen y configuran los textos orales' },
    ],

    // ══════════════════════════════════════════════
    //  CIENCIAS NATURALES 1° BASICO
    // ══════════════════════════════════════════════
    'CN01': [
        { code: 'CN01-OA01', eje: 'Ciencias de la vida', description: 'Reconocer y observar, por medio de la exploración, que los seres vivos crecen, responden a estímulos del medio, se reproducen y necesitan agua, alimento y aire para vivir' },
        { code: 'CN01-OA02', eje: 'Ciencias de la vida', description: 'Observar y comparar animales de acuerdo a características como tamaño, cubierta corporal, estructuras de desplazamiento y hábitat' },
        { code: 'CN01-OA03', eje: 'Ciencias de la vida', description: 'Observar e identificar, por medio de la exploración, las estructuras principales de las plantas: hojas, flores, tallos y raíces' },
        { code: 'CN01-OA04', eje: 'Ciencias de la vida', description: 'Observar y clasificar semillas, frutos, flores y tallos a partir de criterios como tamaño, forma, textura y color' },
        { code: 'CN01-OA05', eje: 'Ciencias de la vida', description: 'Reconocer y comparar diversas plantas y animales de nuestro país, considerando las características observables y proponiendo medidas para su cuidado' },
        { code: 'CN01-OA06', eje: 'Ciencias de la vida', description: 'Identificar y describir la ubicación y la función de los sentidos proponiendo medidas para protegerlos y para prevenir situaciones de riesgo' },
        { code: 'CN01-OA07', eje: 'Ciencias de la vida', description: 'Describir, dar ejemplos y practicar hábitos de vida saludable para mantener el cuerpo sano y prevenir enfermedades' },
        { code: 'CN01-OA08', eje: 'Ciencias fisicas y quimicas', description: 'Explorar y describir los diferentes tipos de materiales en diversos objetos, clasificándolos según sus propiedades e identificando su uso en la vida cotidiana' },
        { code: 'CN01-OA09', eje: 'Ciencias fisicas y quimicas', description: 'Observar y describir los cambios que se producen en los materiales al aplicarles fuerza, luz, calor y agua' },
        { code: 'CN01-OA10', eje: 'Ciencias fisicas y quimicas', description: 'Diseñar instrumentos tecnológicos simples considerando diversos materiales y sus propiedades para resolver problemas cotidianos' },
        { code: 'CN01-OA11', eje: 'Ciencias de la Tierra y el universo', description: 'Describir y registrar el ciclo diario y las diferencias entre el día y la noche, a partir de la observación del Sol, la Luna, las estrellas y la luminosidad del cielo' },
        { code: 'CN01-OA12', eje: 'Ciencias de la Tierra y el universo', description: 'Describir y comunicar los cambios del ciclo de las estaciones y sus efectos en los seres vivos y el ambiente' },
    ],

    // ══════════════════════════════════════════════
    //  CIENCIAS NATURALES 2° BASICO
    // ══════════════════════════════════════════════
    'CN02': [
        { code: 'CN02-OA01', eje: 'Ciencias de la vida', description: 'Observar, describir y clasificar los vertebrados en mamíferos, aves, reptiles, anfibios y peces, en relación a características como cubierta corporal, presencia de mamas y estructuras para la respiración' },
        { code: 'CN02-OA02', eje: 'Ciencias de la vida', description: 'Observar, describir y clasificar, por medio de la exploración, las características de los animales sin columna vertebral, como insectos, arácnidos, crustáceos, y compararlos con los vertebrados' },
        { code: 'CN02-OA03', eje: 'Ciencias de la vida', description: 'Observar y comparar las características de las etapas del ciclo de vida de distintos animales, relacionándolas con su hábitat' },
        { code: 'CN02-OA04', eje: 'Ciencias de la vida', description: 'Observar y comparar características de distintos hábitat, identificando la luminosidad, humedad y temperatura necesarias para la supervivencia de los animales que habitan en él' },
        { code: 'CN02-OA05', eje: 'Ciencias de la vida', description: 'Observar e identificar algunos animales nativos que se encuentran en peligro de extinción, así como el deterioro de su hábitat, proponiendo medidas para protegerlos' },
        { code: 'CN02-OA06', eje: 'Ciencias de la vida', description: 'Identificar y comunicar los efectos de la actividad humana sobre los animales y su hábitat' },
        { code: 'CN02-OA07', eje: 'Ciencias de la vida', description: 'Identificar la ubicación y explicar la función de algunas partes del cuerpo que son fundamentales para vivir: corazón, pulmones, estómago, esqueleto y músculos' },
        { code: 'CN02-OA08', eje: 'Ciencias de la vida', description: 'Explicar la importancia de la actividad física para el desarrollo de los músculos y el fortalecimiento del corazón, proponiendo formas de ejercitarla' },
        { code: 'CN02-OA09', eje: 'Ciencias fisicas y quimicas', description: 'Observar y describir, por medio de la investigación experimental, algunas características del agua, como la de escurrir, adaptarse a la forma del recipiente, disolver algunos sólidos, ser transparente e inodora' },
        { code: 'CN02-OA10', eje: 'Ciencias fisicas y quimicas', description: 'Identificar y comparar, por medio de la exploración, los estados sólido, líquido y gaseoso del agua' },
        { code: 'CN02-OA11', eje: 'Ciencias fisicas y quimicas', description: 'Describir el ciclo del agua en la naturaleza, reconociéndola como un recurso preciado y proponiendo acciones cotidianas para su cuidado' },
        { code: 'CN02-OA12', eje: 'Ciencias de la Tierra y el universo', description: 'Reconocer y describir algunas características del tiempo atmosférico, como precipitaciones, viento y temperatura ambiente, y sus cambios a lo largo del año' },
        { code: 'CN02-OA13', eje: 'Ciencias de la Tierra y el universo', description: 'Medir algunas características del tiempo atmosférico, construyendo y/o usando algunos instrumentos tecnológicos útiles para su localidad' },
        { code: 'CN02-OA14', eje: 'Ciencias de la Tierra y el universo', description: 'Describir la relación de los cambios del tiempo atmosférico con las estaciones del año y sus efectos sobre los seres vivos y el ambiente' },
    ],

    // ══════════════════════════════════════════════
    //  CIENCIAS NATURALES 3° BASICO
    // ══════════════════════════════════════════════
    'CN03': [
        { code: 'CN03-OA01', eje: 'Ciencias de la vida', description: 'Observar y describir, por medio de la investigación experimental, las necesidades de las plantas y su relación con la raíz, el tallo y las hojas' },
        { code: 'CN03-OA02', eje: 'Ciencias de la vida', description: 'Observar, registrar e identificar variadas plantas de nuestro país, incluyendo vegetales autóctonos y cultivos principales a nivel nacional y regional' },
        { code: 'CN03-OA03', eje: 'Ciencias de la vida', description: 'Observar y describir algunos cambios de las plantas con flor durante su ciclo de vida, reconociendo la importancia de la polinización y de la dispersión de la semilla' },
        { code: 'CN03-OA04', eje: 'Ciencias de la vida', description: 'Describir la importancia de las plantas para los seres vivos, el ser humano y el medio ambiente, proponiendo y comunicando medidas de cuidado' },
        { code: 'CN03-OA05', eje: 'Ciencias de la vida', description: 'Explicar la importancia de usar adecuadamente los recursos, proponiendo acciones y construyendo instrumentos tecnológicos para reutilizarlos, reducirlos y reciclarlos' },
        { code: 'CN03-OA06', eje: 'Ciencias de la vida', description: 'Clasificar los alimentos, distinguiendo sus efectos sobre la salud, y proponer hábitos alimenticios saludables' },
        { code: 'CN03-OA07', eje: 'Ciencias de la vida', description: 'Proponer, comunicar y ejercitar buenas prácticas de higiene en la manipulación de alimentos para prevenir enfermedades' },
        { code: 'CN03-OA08', eje: 'Ciencias fisicas y quimicas', description: 'Distinguir fuentes naturales y artificiales de luz, como el Sol, las ampolletas y el fuego' },
        { code: 'CN03-OA09', eje: 'Ciencias fisicas y quimicas', description: 'Investigar experimentalmente y explicar algunas características de la luz; por ejemplo: viaja en línea recta, se refleja, puede ser separada en colores' },
        { code: 'CN03-OA10', eje: 'Ciencias fisicas y quimicas', description: 'Investigar experimentalmente y explicar las características del sonido; por ejemplo: viaja en todas las direcciones, se absorbe o se refleja, se transmite por medio de distintos materiales, tiene tono e intensidad' },
        { code: 'CN03-OA11', eje: 'Ciencias de la Tierra y el universo', description: 'Describir las características de algunos de los componentes del Sistema Solar en relación con su tamaño, localización, apariencia y distancia relativa a la Tierra' },
        { code: 'CN03-OA12', eje: 'Ciencias de la Tierra y el universo', description: 'Explicar, por medio de modelos, los movimientos de rotación y traslación, considerando sus efectos en la Tierra' },
        { code: 'CN03-OA13', eje: 'Ciencias de la Tierra y el universo', description: 'Diseñar y construir modelos tecnológicos para explicar eventos del sistema solar, como la sucesión de las fases de la Luna y los eclipses de Luna y de Sol' },
    ],

    // ══════════════════════════════════════════════
    //  CIENCIAS NATURALES 4° BASICO
    // ══════════════════════════════════════════════
    'CN04': [
        { code: 'CN04-OA01', eje: 'Ciencias de la vida', description: 'Reconocer, por medio de la exploración, que un ecosistema está compuesto por elementos vivos y no vivos que interactúan entre sí' },
        { code: 'CN04-OA02', eje: 'Ciencias de la vida', description: 'Observar y comparar adaptaciones de plantas y animales para sobrevivir en los ecosistemas en relación con su estructura y conducta' },
        { code: 'CN04-OA03', eje: 'Ciencias de la vida', description: 'Dar ejemplos de cadenas alimentarias, identificando la función de los organismos productores, consumidores y descomponedores, en diferentes ecosistemas de Chile' },
        { code: 'CN04-OA04', eje: 'Ciencias de la vida', description: 'Analizar los efectos de la actividad humana en ecosistemas de Chile, proponiendo medidas para protegerlos' },
        { code: 'CN04-OA05', eje: 'Ciencias de la vida', description: 'Identificar y describir, usando modelos, estructuras del sistema esquelético y algunas de sus funciones como protección, soporte y movimiento' },
        { code: 'CN04-OA06', eje: 'Ciencias de la vida', description: 'Explicar, con apoyo de modelos, el movimiento del cuerpo, considerando la acción coordinada de músculos, huesos, tendones y articulación' },
        { code: 'CN04-OA07', eje: 'Ciencias de la vida', description: 'Identificar estructuras del sistema nervioso y describir algunas de sus funciones, como conducción de información y coordinación' },
        { code: 'CN04-OA08', eje: 'Ciencias de la vida', description: 'Investigar en diversas fuentes y comunicar los efectos que produce el consumo excesivo de alcohol en la salud humana' },
        { code: 'CN04-OA09', eje: 'Ciencias fisicas y quimicas', description: 'Demostrar, por medio de la investigación experimental, que la materia tiene masa y ocupa espacio, usando materiales del entorno' },
        { code: 'CN04-OA10', eje: 'Ciencias fisicas y quimicas', description: 'Comparar los tres estados de la materia en relación con criterios como la capacidad de fluir, cambiar de forma y volumen' },
        { code: 'CN04-OA11', eje: 'Ciencias fisicas y quimicas', description: 'Medir la masa, el volumen y la temperatura de la materia, utilizando instrumentos y unidades de medida apropiados' },
        { code: 'CN04-OA12', eje: 'Ciencias fisicas y quimicas', description: 'Demostrar, por medio de la investigación experimental, los efectos de la aplicación de fuerzas sobre objetos, considerando cambios en la forma, rapidez y dirección del movimiento' },
        { code: 'CN04-OA13', eje: 'Ciencias fisicas y quimicas', description: 'Identificar, por medio de la investigación experimental, diferentes tipos de fuerzas y sus efectos: fuerza de roce, peso y fuerza magnética' },
        { code: 'CN04-OA14', eje: 'Ciencias fisicas y quimicas', description: 'Diseñar y construir objetos tecnológicos que usen la fuerza para resolver problemas cotidianos' },
        { code: 'CN04-OA15', eje: 'Ciencias de la Tierra y el universo', description: 'Describir, por medio de modelos, que la Tierra tiene una estructura de capas con diferentes características' },
        { code: 'CN04-OA16', eje: 'Ciencias de la Tierra y el universo', description: 'Explicar los cambios de la superficie de la Tierra a partir de la interacción de sus capas y los movimientos de las placas tectónicas' },
        { code: 'CN04-OA17', eje: 'Ciencias de la Tierra y el universo', description: 'Proponer medidas de prevención y seguridad ante riesgos naturales en la escuela, la calle y el hogar' },
    ],

    // ══════════════════════════════════════════════
    //  CIENCIAS NATURALES 5° BASICO
    // ══════════════════════════════════════════════
    'CN05': [
        { code: 'CN05-OA01', eje: 'Ciencias de la vida', description: 'Reconocer y explicar que los seres vivos están formados por una o más células y que estas se organizan en tejidos, órganos y sistemas' },
        { code: 'CN05-OA02', eje: 'Ciencias de la vida', description: 'Identificar y describir por medio de modelos las estructuras básicas del sistema digestivo y sus funciones en la digestión, la absorción de alimentos y la eliminación de desechos' },
        { code: 'CN05-OA03', eje: 'Ciencias de la vida', description: 'Explicar por medio de modelos la respiración, identificando las estructuras básicas del sistema respiratorio, su función y los intercambios gaseosos' },
        { code: 'CN05-OA04', eje: 'Ciencias de la vida', description: 'Explicar la función de transporte del sistema circulatorio, identificando sus estructuras básicas: corazón, vasos sanguíneos y sangre' },
        { code: 'CN05-OA05', eje: 'Ciencias de la vida', description: 'Analizar el consumo de alimento diario reconociendo los alimentos para el crecimiento, la reparación, el desarrollo y el movimiento del cuerpo' },
        { code: 'CN05-OA06', eje: 'Ciencias de la vida', description: 'Investigar en diversas fuentes y comunicar los efectos nocivos que produce el cigarrillo en los sistemas respiratorio y circulatorio' },
        { code: 'CN05-OA07', eje: 'Ciencias de la vida', description: 'Investigar e identificar algunos microorganismos beneficiosos y dañinos para la salud, y proponer medidas de cuidado e higiene del cuerpo' },
        { code: 'CN05-OA08', eje: 'Ciencias fisicas y quimicas', description: 'Reconocer los cambios que experimenta la energía eléctrica al pasar de una forma a otra e investigar los principales aportes de científicos en su estudio' },
        { code: 'CN05-OA09', eje: 'Ciencias fisicas y quimicas', description: 'Construir un circuito eléctrico simple y utilizarlo para resolver problemas cotidianos y explicar su funcionamiento' },
        { code: 'CN05-OA10', eje: 'Ciencias fisicas y quimicas', description: 'Observar y distinguir, por medio de la investigación experimental, los materiales conductores y aisladores de electricidad' },
        { code: 'CN05-OA11', eje: 'Ciencias fisicas y quimicas', description: 'Explicar la importancia de la energía eléctrica en la vida cotidiana y proponer medidas para promover su ahorro y uso responsable' },
        { code: 'CN05-OA12', eje: 'Ciencias de la Tierra y el universo', description: 'Describir la distribución del agua dulce y salada en la Tierra, considerando océanos, glaciares, ríos y lagos, aguas subterráneas, nubes, vapor de agua' },
        { code: 'CN05-OA13', eje: 'Ciencias de la Tierra y el universo', description: 'Analizar y describir las características de los océanos y lagos: variación de temperatura, luminosidad y presión en relación a la profundidad, diversidad de flora y fauna' },
        { code: 'CN05-OA14', eje: 'Ciencias de la Tierra y el universo', description: 'Investigar y explicar efectos positivos y negativos de la actividad humana en los océanos, lagos, ríos, glaciares, proponiendo acciones de protección de las reservas hídricas en Chile' },
    ],

    // ══════════════════════════════════════════════
    //  CIENCIAS NATURALES 6° BASICO
    // ══════════════════════════════════════════════
    'CN06': [
        { code: 'CN06-OA01', eje: 'Ciencias de la vida', description: 'Explicar, a partir de una investigación experimental, los requerimientos de agua, dióxido de carbono y energía lumínica para la producción de azúcar y liberación de oxígeno en la fotosíntesis' },
        { code: 'CN06-OA02', eje: 'Ciencias de la vida', description: 'Representar, por medio de modelos, la transferencia de energía y materia desde los organismos fotosintéticos a otros seres vivos por medio de cadenas y redes alimentarias' },
        { code: 'CN06-OA03', eje: 'Ciencias de la vida', description: 'Analizar los efectos de la actividad humana sobre las redes alimentarias en ecosistemas terrestres y acuáticos' },
        { code: 'CN06-OA04', eje: 'Ciencias de la vida', description: 'Identificar y describir las funciones de las principales estructuras del sistema reproductor humano femenino y masculino' },
        { code: 'CN06-OA05', eje: 'Ciencias de la vida', description: 'Describir y comparar los cambios que se producen en la pubertad en mujeres y hombres, reconociéndola como una etapa del desarrollo humano' },
        { code: 'CN06-OA06', eje: 'Ciencias de la vida', description: 'Reconocer los beneficios de realizar actividad física en forma regular y de cuidar la higiene corporal en el período de la pubertad' },
        { code: 'CN06-OA07', eje: 'Ciencias de la vida', description: 'Investigar y comunicar los efectos nocivos de algunas drogas para la salud, proponiendo conductas de protección' },
        { code: 'CN06-OA08', eje: 'Ciencias fisicas y quimicas', description: 'Explicar que la energía es necesaria para que los objetos cambien y los seres vivos realicen sus procesos vitales, y que la mayoría de los recursos energéticos proviene directa o indirectamente del Sol' },
        { code: 'CN06-OA09', eje: 'Ciencias fisicas y quimicas', description: 'Investigar en forma experimental la transformación de la energía de una forma a otra, dando ejemplos y comunicando sus conclusiones' },
        { code: 'CN06-OA10', eje: 'Ciencias fisicas y quimicas', description: 'Demostrar, por medio de la investigación experimental, que el calor fluye de un objeto caliente a uno frío hasta que ambos alcanzan la misma temperatura' },
        { code: 'CN06-OA11', eje: 'Ciencias fisicas y quimicas', description: 'Clasificar los recursos naturales energéticos en no renovables y renovables y proponer medidas para el uso responsable de la energía' },
        { code: 'CN06-OA12', eje: 'Ciencias fisicas y quimicas', description: 'Explicar, a partir de modelos, que la materia está formada por partículas en movimiento en sus estados sólido, líquido y gaseoso' },
        { code: 'CN06-OA13', eje: 'Ciencias fisicas y quimicas', description: 'Demostrar, mediante la investigación experimental, los cambios de estado de la materia, como fusión, evaporación, ebullición, condensación, solidificación y sublimación' },
        { code: 'CN06-OA14', eje: 'Ciencias fisicas y quimicas', description: 'Diferenciar entre calor y temperatura, considerando que el calor es una forma de energía y la temperatura es una medida de lo caliente de un objeto' },
        { code: 'CN06-OA15', eje: 'Ciencias de la Tierra y el universo', description: 'Describir las características de las capas de la Tierra y explicar sus distintos tipos de interacción' },
        { code: 'CN06-OA16', eje: 'Ciencias de la Tierra y el universo', description: 'Explicar los fenómenos volcánicos y sísmicos en términos del movimiento de las placas tectónicas y los cambios en la superficie de la Tierra' },
        { code: 'CN06-OA17', eje: 'Ciencias de la Tierra y el universo', description: 'Explicar las consecuencias de la erosión sobre la superficie de la Tierra, identificando los agentes erosivos como el viento, el agua y las actividades humanas' },
    ],

    // ══════════════════════════════════════════════
    //  CIENCIAS NATURALES 7° BASICO
    // ══════════════════════════════════════════════
    'CN07': [
        { code: 'CN07-OA01', eje: 'Ciencias de la vida', description: 'Explicar los conceptos de célula, organismo y microorganismo, reconociendo que la célula es la unidad estructural y funcional de todos los seres vivos' },
        { code: 'CN07-OA02', eje: 'Ciencias de la vida', description: 'Desarrollar modelos que expliquen la estructura y función de las barreras defensivas del cuerpo humano, incluyendo piel, mucosas y respuesta inmune' },
        { code: 'CN07-OA03', eje: 'Ciencias de la vida', description: 'Analizar los principios básicos de la teoría celular, destacando las evidencias que la sustentan y su importancia para la biología' },
        { code: 'CN07-OA04', eje: 'Ciencias de la vida', description: 'Explicar la relación entre los sistemas reproductor, endocrino y nervioso en la regulación de los cambios físicos y emocionales asociados a la pubertad y la adolescencia' },
        { code: 'CN07-OA05', eje: 'Ciencias de la vida', description: 'Describir los métodos de control de natalidad, incluyendo métodos naturales, de barrera y químicos, considerando los mecanismos de acción' },
        { code: 'CN07-OA06', eje: 'Ciencias de la vida', description: 'Investigar y argumentar que el desarrollo de infecciones de transmisión sexual puede evitarse mediante conductas de autocuidado como el uso de preservativo' },
        { code: 'CN07-OA07', eje: 'Ciencias fisicas y quimicas', description: 'Investigar experimentalmente y explicar la clasificación de la materia en sustancias puras y mezclas, y la distinción entre elementos y compuestos' },
        { code: 'CN07-OA08', eje: 'Ciencias fisicas y quimicas', description: 'Investigar experimentalmente y explicar los cambios de la materia, argumentando que estos pueden ser físicos o químicos' },
        { code: 'CN07-OA09', eje: 'Ciencias fisicas y quimicas', description: 'Explicar los conceptos de transformación de la energía mecánica, la conservación de la energía y el principio de inercia' },
        { code: 'CN07-OA10', eje: 'Ciencias fisicas y quimicas', description: 'Analizar los efectos de las fuerzas gravitacional, de roce y elástica en situaciones cotidianas' },
        { code: 'CN07-OA11', eje: 'Ciencias fisicas y quimicas', description: 'Explicar los fenómenos relacionados con la luz, como reflexión, refracción, interferencia y absorción' },
        { code: 'CN07-OA12', eje: 'Ciencias de la Tierra y el universo', description: 'Investigar y explicar el origen del Universo mediante diferentes teorías, destacando el Big Bang' },
        { code: 'CN07-OA13', eje: 'Ciencias de la Tierra y el universo', description: 'Describir la formación de planetas rocosos y gaseosos, considerando las condiciones que dieron origen a la Tierra y sus características actuales' },
        { code: 'CN07-OA14', eje: 'Ciencias de la Tierra y el universo', description: 'Explicar que el clima en la Tierra depende de diversos factores como la cantidad de energía que recibe del Sol y la distribución de la energía en la atmósfera y océanos' },
        { code: 'CN07-OA15', eje: 'Ciencias de la Tierra y el universo', description: 'Analizar factores que contribuyen al cambio climático y sus consecuencias en los ecosistemas, proponiendo medidas de mitigación y adaptación' },
    ],

    // ══════════════════════════════════════════════
    //  CIENCIAS NATURALES 8° BASICO
    // ══════════════════════════════════════════════
    'CN08': [
        { code: 'CN08-OA01', eje: 'Ciencias de la vida', description: 'Explicar que los modelos de la célula han evolucionado sobre la base de evidencias, como las aportadas por científicos como Hooke, Leeuwenhoek, Virchow, Schleiden y Schwann' },
        { code: 'CN08-OA02', eje: 'Ciencias de la vida', description: 'Desarrollar modelos que expliquen la relación entre la función de una célula y sus partes, considerando sus estructuras y la actividad celular' },
        { code: 'CN08-OA03', eje: 'Ciencias de la vida', description: 'Explicar, por medio de la experimentación, los mecanismos de intercambio de partículas entre la célula y su ambiente por difusión y osmosis' },
        { code: 'CN08-OA04', eje: 'Ciencias de la vida', description: 'Crear modelos que expliquen que las plantas tienen estructuras especializadas para responder a estímulos del medioambiente, incluyendo fotoperiodicidad y tropismo' },
        { code: 'CN08-OA05', eje: 'Ciencias de la vida', description: 'Explicar los procesos de obtención y eliminación de nutrientes a nivel celular y su relación con el funcionamiento integrado de sistemas como el digestivo, circulatorio, respiratorio, renal e inmune' },
        { code: 'CN08-OA06', eje: 'Ciencias de la vida', description: 'Investigar experimentalmente y explicar las características de los nutrientes y su función para el mantenimiento de un cuerpo saludable' },
        { code: 'CN08-OA07', eje: 'Ciencias de la vida', description: 'Analizar y evaluar los factores que contribuyen a mantener un cuerpo saludable, proponiendo un plan que considere alimentación balanceada, actividad física regular y evitar consumo de drogas' },
        { code: 'CN08-OA08', eje: 'Ciencias fisicas y quimicas', description: 'Analizar las fuerzas eléctricas, considerando sus efectos en interacciones cotidianas y su utilización en la tecnología' },
        { code: 'CN08-OA09', eje: 'Ciencias fisicas y quimicas', description: 'Investigar, explicar y evaluar las tecnologías que permiten la generación de energía eléctrica, sus costos de producción y los impactos en el medio ambiente' },
        { code: 'CN08-OA10', eje: 'Ciencias fisicas y quimicas', description: 'Analizar un circuito eléctrico domiciliario y comparar experimentalmente los circuitos eléctricos en serie y en paralelo' },
        { code: 'CN08-OA11', eje: 'Ciencias fisicas y quimicas', description: 'Desarrollar modelos que expliquen el calor como un proceso de transferencia de energía térmica entre dos o más cuerpos que están a diferentes temperaturas' },
        { code: 'CN08-OA12', eje: 'Ciencias fisicas y quimicas', description: 'Investigar y analizar cómo ha evolucionado el conocimiento de la constitución de la materia, considerando los aportes de científicos como Leucipo, Demócrito, Dalton y Thomson' },
        { code: 'CN08-OA13', eje: 'Ciencias fisicas y quimicas', description: 'Desarrollar modelos que expliquen que la materia está constituida por átomos que interactúan, generando diversas partículas y sustancias' },
        { code: 'CN08-OA14', eje: 'Ciencias fisicas y quimicas', description: 'Usar la tabla periódica como un modelo para predecir las propiedades relativas de los elementos químicos basándose en los patrones de sus átomos' },
        { code: 'CN08-OA15', eje: 'Ciencias de la Tierra y el universo', description: 'Investigar y argumentar que existen algunos elementos químicos más frecuentes en la Tierra que son comunes en los seres vivos y son fundamentales para la vida' },
    ],

    // ══════════════════════════════════════════════
    //  HISTORIA, GEOGRAFIA Y CS. SOCIALES 1° BASICO
    // ══════════════════════════════════════════════
    'HI01': [
        { code: 'HI01-OA01', eje: 'Historia', description: 'Nombrar y secuenciar días de la semana y meses del año, utilizando calendarios, e identificar el año en curso' },
        { code: 'HI01-OA02', eje: 'Historia', description: 'Secuenciar acontecimientos y actividades de la vida cotidiana, personal y familiar, utilizando categorías relativas de ubicación temporal' },
        { code: 'HI01-OA03', eje: 'Historia', description: 'Registrar y comunicar información sobre elementos que forman parte de su identidad personal para reconocer sus características individuales' },
        { code: 'HI01-OA04', eje: 'Historia', description: 'Obtener y comunicar aspectos de la historia de su familia y sus características, mediante la formulación de preguntas a adultos de su entorno cercano' },
        { code: 'HI01-OA05', eje: 'Historia', description: 'Reconocer los símbolos representativos de Chile, describir costumbres y la participación de hombres y mujeres respecto de conmemoraciones nacionales' },
        { code: 'HI01-OA06', eje: 'Historia', description: 'Conocer expresiones culturales locales y nacionales, describir fiestas y tradiciones importantes de nivel local' },
        { code: 'HI01-OA07', eje: 'Historia', description: 'Conocer sobre la vida de hombres y mujeres que han contribuido a la sociedad chilena en diversos ámbitos' },
        { code: 'HI01-OA08', eje: 'Geografia', description: 'Reconocer que los mapas y planos son formas de representar lugares' },
        { code: 'HI01-OA09', eje: 'Geografia', description: 'Identificar a Chile en mapas, incluyendo la cordillera de los Andes, el océano Pacífico, su región, su capital y su localidad' },
        { code: 'HI01-OA10', eje: 'Geografia', description: 'Observar y describir paisajes de su entorno local, utilizando vocabulario geográfico adecuado y categorías de ubicación relativa' },
        { code: 'HI01-OA11', eje: 'Geografia', description: 'Identificar trabajos y productos de su familia y su localidad y cómo estos aportan a su vida diaria' },
        { code: 'HI01-OA12', eje: 'Formacion ciudadana', description: 'Mostrar actitudes y realizar acciones concretas en su entorno cercano que reflejen respeto al otro, empatía y responsabilidad' },
        { code: 'HI01-OA13', eje: 'Formacion ciudadana', description: 'Explicar y aplicar algunas normas para la buena convivencia y para la seguridad y el autocuidado en su familia, en la escuela y en la vía pública' },
        { code: 'HI01-OA14', eje: 'Formacion ciudadana', description: 'Identificar la labor que cumplen, en beneficio de la comunidad, instituciones como la escuela, la municipalidad, el hospital, Carabineros de Chile' },
    ],

    // ══════════════════════════════════════════════
    //  HISTORIA, GEOGRAFIA Y CS. SOCIALES 2° BASICO
    // ══════════════════════════════════════════════
    'HI02': [
        { code: 'HI02-OA01', eje: 'Historia', description: 'Leer y dibujar planos simples de su entorno, utilizando puntos de referencia, categorías de posición relativa y simbología pictórica' },
        { code: 'HI02-OA02', eje: 'Historia', description: 'Ubicar Chile, Santiago, la propia región y su capital en el globo terráqueo o en mapas, y describir la ubicación relativa de países limítrofes' },
        { code: 'HI02-OA03', eje: 'Historia', description: 'Clasificar y caracterizar algunos paisajes de Chile según su ubicación en la zona norte, centro y sur del país' },
        { code: 'HI02-OA04', eje: 'Historia', description: 'Describir distintos paisajes del continente americano, considerando climas, ríos, población, idiomas, países y grandes ciudades' },
        { code: 'HI02-OA05', eje: 'Geografia', description: 'Describir costumbres, actividades, vestimentas, comidas, fiestas y tradiciones de comunidades de Chile, incluyendo comunidades indígenas' },
        { code: 'HI02-OA06', eje: 'Geografia', description: 'Comparar modos de vida de la Antigüedad con el propio, identificando similitudes y diferencias' },
        { code: 'HI02-OA07', eje: 'Geografia', description: 'Identificar a Pedro de Valdivia, Bernardo O\'Higgins, José de San Martín e Isabel Riquelme como figuras fundacionales de nuestra sociedad' },
        { code: 'HI02-OA08', eje: 'Formacion ciudadana', description: 'Reconocer que los chilenos tienen derechos que les permiten participar en la sociedad, considerando los derechos a la educación, a la salud, a la seguridad' },
        { code: 'HI02-OA09', eje: 'Formacion ciudadana', description: 'Mostrar actitudes y realizar acciones concretas en su entorno cercano que reflejen valores y virtudes ciudadanas' },
        { code: 'HI02-OA10', eje: 'Formacion ciudadana', description: 'Reconocer y respetar la igualdad de derechos entre hombres y mujeres en situaciones de la vida cotidiana' },
        { code: 'HI02-OA11', eje: 'Formacion ciudadana', description: 'Reconocer diversas expresiones del patrimonio cultural del país y de su región, como manifestaciones artísticas, tradiciones folclóricas, leyendas y costumbres familiares' },
        { code: 'HI02-OA12', eje: 'Formacion ciudadana', description: 'Aplicar algunas normas para la buena convivencia, la seguridad y el cuidado de los espacios en que se desenvuelve' },
    ],

    // ══════════════════════════════════════════════
    //  HISTORIA, GEOGRAFIA Y CS. SOCIALES 3° BASICO
    // ══════════════════════════════════════════════
    'HI03': [
        { code: 'HI03-OA01', eje: 'Historia', description: 'Reconocer aspectos de la vida cotidiana de la civilización griega de la Antigüedad e identificar algunos elementos de su legado a sociedades y culturas del presente' },
        { code: 'HI03-OA02', eje: 'Historia', description: 'Reconocer aspectos de la vida cotidiana de la civilización romana de la Antigüedad e identificar algunos elementos de su legado a sociedades y culturas del presente' },
        { code: 'HI03-OA03', eje: 'Historia', description: 'Explicar, con ejemplos concretos, cómo diferentes culturas y pueblos han enfrentado de distintas maneras el desafío de desarrollarse y satisfacer las necesidades comunes' },
        { code: 'HI03-OA04', eje: 'Historia', description: 'Comparar modos de vida de la Antigüedad con el propio, considerando costumbres, trabajos y oficios, creencias, vestimentas y características de las ciudades' },
        { code: 'HI03-OA05', eje: 'Historia', description: 'Investigar en diversas fuentes sobre algunos temas relacionados con el presente de los pueblos indígenas americanos' },
        { code: 'HI03-OA06', eje: 'Geografia', description: 'Ubicar personas, lugares y elementos en una cuadrícula, utilizando líneas de referencia y puntos cardinales' },
        { code: 'HI03-OA07', eje: 'Geografia', description: 'Distinguir hemisferios, círculo del Ecuador, trópicos, polos, continentes y océanos del planeta en mapas y globos terráqueos' },
        { code: 'HI03-OA08', eje: 'Geografia', description: 'Identificar y ubicar en mapas las principales zonas climáticas del mundo y dar ejemplos de distintos paisajes que pueden encontrarse en estas zonas' },
        { code: 'HI03-OA09', eje: 'Geografia', description: 'Caracterizar el entorno geográfico de las civilizaciones estudiadas, utilizando vocabulario geográfico adecuado' },
        { code: 'HI03-OA10', eje: 'Formacion ciudadana', description: 'Asumir sus deberes y responsabilidades como estudiante y en situaciones de la vida cotidiana' },
        { code: 'HI03-OA11', eje: 'Formacion ciudadana', description: 'Mostrar actitudes y realizar acciones concretas en su entorno cercano que reflejen valores y virtudes ciudadanas, como la tolerancia, el respeto, la empatía y la responsabilidad' },
        { code: 'HI03-OA12', eje: 'Formacion ciudadana', description: 'Reconocer que los niños tienen derechos que les permiten recibir un cuidado especial por parte de la sociedad' },
        { code: 'HI03-OA13', eje: 'Formacion ciudadana', description: 'Investigar y comunicar sus resultados sobre algunas instituciones públicas y privadas, identificando el servicio que prestan en la comunidad' },
    ],

    // ══════════════════════════════════════════════
    //  HISTORIA, GEOGRAFIA Y CS. SOCIALES 4° BASICO
    // ══════════════════════════════════════════════
    'HI04': [
        { code: 'HI04-OA01', eje: 'Historia', description: 'Describir la civilización maya, considerando ubicación geográfica, organización política, actividades económicas, formas de cultivo, organización de la sociedad, religión y ritos, desarrollo de la astronomía y la matemática' },
        { code: 'HI04-OA02', eje: 'Historia', description: 'Describir la civilización azteca, considerando ubicación geográfica, organización política, la ciudad de Tenochtitlán, formas de cultivo, religión y ritos, avances tecnológicos' },
        { code: 'HI04-OA03', eje: 'Historia', description: 'Describir la civilización inca, considerando ubicación geográfica, organización política, sistema de caminos, principales actividades económicas, organización de la sociedad, formas de cultivo, construcciones y vida cotidiana' },
        { code: 'HI04-OA04', eje: 'Historia', description: 'Analizar y comparar las principales características de las civilizaciones americanas' },
        { code: 'HI04-OA05', eje: 'Historia', description: 'Describir el modo de vida y algunos aspectos de las culturas de los pueblos originarios de Chile en el período precolombino' },
        { code: 'HI04-OA06', eje: 'Historia', description: 'Identificar los aportes de los pueblos originarios de Chile a nuestra sociedad actual, como arte, cultivos, costumbres y tradiciones' },
        { code: 'HI04-OA07', eje: 'Geografia', description: 'Ubicar lugares en un mapa, utilizando coordenadas geográficas como referencia' },
        { code: 'HI04-OA08', eje: 'Geografia', description: 'Describir distintos paisajes del continente americano, considerando climas, ríos, población, idiomas, países y grandes ciudades' },
        { code: 'HI04-OA09', eje: 'Geografia', description: 'Reconocer y ubicar los principales recursos naturales de América, considerando su distribución geográfica y su uso' },
        { code: 'HI04-OA10', eje: 'Formacion ciudadana', description: 'Distinguir recursos naturales renovables y no renovables, reconocer el carácter limitado de los recursos naturales y la necesidad de cuidarlos' },
        { code: 'HI04-OA11', eje: 'Formacion ciudadana', description: 'Demostrar respeto por todas las personas mediante acciones en su vida diaria, sin discriminar por condiciones físicas, sociales, económicas, étnicas o culturales' },
        { code: 'HI04-OA12', eje: 'Formacion ciudadana', description: 'Participar en su comunidad, tomando parte en elecciones para una directiva de curso, evaluando las propuestas realizadas por los diferentes candidatos' },
    ],

    // ══════════════════════════════════════════════
    //  HISTORIA, GEOGRAFIA Y CS. SOCIALES 5° BASICO
    // ══════════════════════════════════════════════
    'HI05': [
        { code: 'HI05-OA01', eje: 'Historia', description: 'Explicar los viajes de descubrimiento de Cristóbal Colón, Hernando de Magallanes y algún otro explorador, considerando objetivos, tecnologías y consecuencias' },
        { code: 'HI05-OA02', eje: 'Historia', description: 'Describir el proceso de conquista de América y de Chile, incluyendo a los principales actores, objetivos, tecnologías, consecuencias y el rol de la mujer' },
        { code: 'HI05-OA03', eje: 'Historia', description: 'Analizar el impacto y las consecuencias que tuvo el proceso de conquista para Europa y para América' },
        { code: 'HI05-OA04', eje: 'Historia', description: 'Describir el rol de la Iglesia Católica, las misiones, la creación de universidades y las formas de evangelización en el período colonial' },
        { code: 'HI05-OA05', eje: 'Historia', description: 'Describir algunas dimensiones de la vida colonial en Chile, como organización de la sociedad, oficios, actividades económicas, costumbres y vida cotidiana' },
        { code: 'HI05-OA06', eje: 'Historia', description: 'Explicar aspectos centrales de la Colonia, como la dependencia de las colonias americanas de la metrópoli, el monopolio del comercio y la evangelización' },
        { code: 'HI05-OA07', eje: 'Historia', description: 'Explicar y dar ejemplos de las distintas formas en las que españoles y mapuches se relacionaron en el período colonial' },
        { code: 'HI05-OA08', eje: 'Historia', description: 'Identificar, en su entorno o en fotografías, elementos del patrimonio colonial de Chile que siguen presentes hoy' },
        { code: 'HI05-OA09', eje: 'Geografia', description: 'Caracterizar las grandes zonas de Chile y sus paisajes, considerando ubicación, clima y recursos naturales' },
        { code: 'HI05-OA10', eje: 'Geografia', description: 'Reconocer y ubicar los principales recursos naturales de Chile, incluyendo su distribución geográfica y valorando su importancia para la economía del país' },
        { code: 'HI05-OA11', eje: 'Geografia', description: 'Analizar y dar ejemplos de diversas maneras en las que el trabajo de las personas potencia y da valor a los recursos naturales' },
        { code: 'HI05-OA12', eje: 'Geografia', description: 'Investigar, describir y ubicar los riesgos naturales que afectan a su localidad, como sismos, maremotos, inundaciones, derrumbes y sequías' },
        { code: 'HI05-OA13', eje: 'Formacion ciudadana', description: 'Reconocer que todas las personas son sujetos de derecho, y que estos derechos deben ser respetados por los pares, la comunidad y el Estado' },
        { code: 'HI05-OA14', eje: 'Formacion ciudadana', description: 'Reconocer que los derechos generan deberes y responsabilidades en las personas e instituciones' },
        { code: 'HI05-OA15', eje: 'Formacion ciudadana', description: 'Participar en su comunidad, tomando parte en elecciones para una directiva de curso, evaluando las propuestas realizadas por los diferentes candidatos' },
    ],

    // ══════════════════════════════════════════════
    //  HISTORIA, GEOGRAFIA Y CS. SOCIALES 6° BASICO
    // ══════════════════════════════════════════════
    'HI06': [
        { code: 'HI06-OA01', eje: 'Historia', description: 'Explicar los múltiples antecedentes de la independencia de las colonias americanas y reconocer que la independencia de Chile se enmarca en un proceso continental' },
        { code: 'HI06-OA02', eje: 'Historia', description: 'Explicar el desarrollo del proceso de independencia de Chile, considerando actores sociales y acontecimientos relevantes' },
        { code: 'HI06-OA03', eje: 'Historia', description: 'Describir algunos hitos y procesos de la organización de la república, incluyendo las dificultades y los desafíos que implicó organizar en Chile una nueva forma de gobierno' },
        { code: 'HI06-OA04', eje: 'Historia', description: 'Explicar que en una sociedad democrática todos son iguales ante la ley, ejemplificando cómo el Estado ha ido reconociendo progresivamente los derechos de todas las personas' },
        { code: 'HI06-OA05', eje: 'Historia', description: 'Evaluar las principales características de la sociedad chilena del siglo XIX, como la participación de sectores sociales, las ideas liberales y conservadoras' },
        { code: 'HI06-OA06', eje: 'Historia', description: 'Describir cómo se conformó el territorio de Chile durante el siglo XIX, considerando colonizaciones europeas, la ocupación de la Araucanía, la Guerra del Pacífico' },
        { code: 'HI06-OA07', eje: 'Historia', description: 'Caracterizar los principales aspectos que definieron el período de riqueza aportada por la explotación del salitre' },
        { code: 'HI06-OA08', eje: 'Geografia', description: 'Reconocer y explicar características de la ciudad contemporánea latinoamericana, considerando procesos migratorios, desigualdades sociales, infraestructura y transporte' },
        { code: 'HI06-OA09', eje: 'Geografia', description: 'Explicar que los sismos y los tsunamis en Chile se explican debido a que el país está ubicado en el Cinturón de Fuego del Pacífico' },
        { code: 'HI06-OA10', eje: 'Geografia', description: 'Analizar y evaluar problemáticas relacionadas con el medio ambiente, como el calentamiento global y el desarrollo sustentable' },
        { code: 'HI06-OA11', eje: 'Formacion ciudadana', description: 'Explicar algunos elementos fundamentales de la organización democrática de Chile, incluyendo la división de poderes del Estado y la Constitución Política' },
        { code: 'HI06-OA12', eje: 'Formacion ciudadana', description: 'Explicar las diferentes formas de participación ciudadana en la vida política de Chile' },
        { code: 'HI06-OA13', eje: 'Formacion ciudadana', description: 'Reconocer que la Constitución Política de Chile establece la organización política del país y garantiza los derechos y las libertades de las personas' },
    ],

    // ══════════════════════════════════════════════
    //  HISTORIA, GEOGRAFIA Y CS. SOCIALES 7° BASICO
    // ══════════════════════════════════════════════
    'HI07': [
        { code: 'HI07-OA01', eje: 'Historia', description: 'Explicar el proceso de hominización, reconociendo las principales etapas de la evolución de la especie humana, la influencia de factores geográficos, su dispersión en el planeta y las distintas teorías del poblamiento americano' },
        { code: 'HI07-OA02', eje: 'Historia', description: 'Explicar que el surgimiento de la agricultura, la domesticación de animales, la sedentarización y el desarrollo del comercio fueron procesos de larga duración que revolucionaron la forma de vida humana' },
        { code: 'HI07-OA03', eje: 'Historia', description: 'Explicar que en las primeras civilizaciones la formación de Estados organizados y el ejercicio del poder estuvieron marcados por la centralización de la administración, la estratificación social y el desarrollo de la escritura' },
        { code: 'HI07-OA04', eje: 'Historia', description: 'Caracterizar el surgimiento de las primeras civilizaciones, considerando las civilizaciones de Mesopotamia, Egipto, India y China' },
        { code: 'HI07-OA05', eje: 'Historia', description: 'Caracterizar el mar Mediterráneo como ecúmene, identificando las principales civilizaciones que se desarrollaron en torno a él e identificando los conceptos de democracia, imperio y ciudadanía' },
        { code: 'HI07-OA06', eje: 'Historia', description: 'Analizar las dinámicas de convivencia entre las civilizaciones del mundo clásico, considerando las Guerras Médicas, la Guerra del Peloponeso y la expansión de Alejandro Magno' },
        { code: 'HI07-OA07', eje: 'Historia', description: 'Explicar el legado de las civilizaciones de la Antigüedad en el mundo actual, refiriéndose al desarrollo del pensamiento, la ciencia y la cultura' },
        { code: 'HI07-OA08', eje: 'Historia', description: 'Analizar el rol de la ciudad de Roma en la expansión territorial y la difusión cultural del Imperio Romano' },
        { code: 'HI07-OA09', eje: 'Historia', description: 'Analizar el impacto del cristianismo en la cultura del Imperio Romano y la Europa medieval' },
        { code: 'HI07-OA10', eje: 'Historia', description: 'Caracterizar el orden político y social del mundo medieval europeo, considerando el feudalismo, el papel político del papado, el imperio y los reinos' },
        { code: 'HI07-OA11', eje: 'Geografia', description: 'Analizar ejemplos de relaciones que se establecen entre sociedades y espacios geográficos en la civilización griega y en la civilización romana' },
        { code: 'HI07-OA12', eje: 'Geografia', description: 'Caracterizar las transformaciones en la Europa medieval, considerando factores políticos, económicos, sociales y culturales' },
        { code: 'HI07-OA13', eje: 'Formacion ciudadana', description: 'Caracterizar la Europa del Renacimiento y la Edad Moderna, considerando cambios económicos, culturales, políticos y sociales' },
        { code: 'HI07-OA14', eje: 'Formacion ciudadana', description: 'Caracterizar los grandes procesos de exploración y expansión europea durante los siglos XV y XVI' },
        { code: 'HI07-OA15', eje: 'Formacion ciudadana', description: 'Analizar la centralización del poder en los Estados europeos, el desarrollo de las monarquías absolutas y el rol de la burguesía' },
    ],

    // ══════════════════════════════════════════════
    //  HISTORIA, GEOGRAFIA Y CS. SOCIALES 8° BASICO
    // ══════════════════════════════════════════════
    'HI08': [
        { code: 'HI08-OA01', eje: 'Historia', description: 'Caracterizar el Absolutismo como régimen político predominante en Europa durante el siglo XVII, identificando sus rasgos fundamentales' },
        { code: 'HI08-OA02', eje: 'Historia', description: 'Caracterizar la Ilustración como corriente de pensamiento basada en la razón, considerando sus principales ideas' },
        { code: 'HI08-OA03', eje: 'Historia', description: 'Analizar cómo la Revolución Francesa implicó un quiebre con el Antiguo Régimen, considerando el ascenso de la burguesía y los ideales de libertad, igualdad y soberanía popular' },
        { code: 'HI08-OA04', eje: 'Historia', description: 'Explicar la independencia de las colonias hispanoamericanas como un proceso continental, marcado por la crisis del sistema colonial y la influencia de la Ilustración' },
        { code: 'HI08-OA05', eje: 'Historia', description: 'Analizar cómo durante el siglo XIX la geografía política de América Latina y de Europa se reorganizó con el surgimiento del Estado-nación' },
        { code: 'HI08-OA06', eje: 'Historia', description: 'Analizar cómo durante el siglo XIX se conformó el territorio nacional, considerando los conflictos bélicos, la expansión territorial y los procesos de colonización' },
        { code: 'HI08-OA07', eje: 'Historia', description: 'Explicar que la Constitución Política de 1833 consolidó un régimen político autoritario, caracterizado por la concentración del poder en la figura del Presidente' },
        { code: 'HI08-OA08', eje: 'Historia', description: 'Caracterizar la economía y la sociedad en Chile durante el siglo XIX, considerando la expansión de la actividad minera, agrícola y comercial' },
        { code: 'HI08-OA09', eje: 'Historia', description: 'Explicar el impacto de las ideas liberales en las transformaciones políticas y económicas de Chile durante el siglo XIX' },
        { code: 'HI08-OA10', eje: 'Historia', description: 'Explicar las principales transformaciones de la Revolución Industrial, considerando la aplicación de la energía a vapor, el desarrollo del ferrocarril y la urbanización' },
        { code: 'HI08-OA11', eje: 'Historia', description: 'Caracterizar el imperialismo europeo del siglo XIX, considerando la expansión colonial, las motivaciones económicas, políticas e ideológicas' },
        { code: 'HI08-OA12', eje: 'Geografia', description: 'Explicar la magnitud de la Primera Guerra Mundial, considerando la movilización general, el alcance geográfico y los efectos demográficos' },
        { code: 'HI08-OA13', eje: 'Geografia', description: 'Caracterizar geográficamente las regiones político-administrativas del país, considerando rasgos físicos, económicos, demográficos y culturales' },
        { code: 'HI08-OA14', eje: 'Formacion ciudadana', description: 'Reconocer la importancia de la participación ciudadana en una sociedad democrática, considerando mecanismos como el sufragio y la organización social' },
        { code: 'HI08-OA15', eje: 'Formacion ciudadana', description: 'Explicar el concepto de desarrollo sustentable, considerando la dimensión económica, social y ambiental' },
    ],

    // ══════════════════════════════════════════════
    //  INGLES 1° BASICO
    // ══════════════════════════════════════════════
    'IN01': [
        { code: 'IN01-OA01', eje: 'Comprension auditiva', description: 'Escuchar y reconocer sonidos simples del idioma inglés mediante rimas, canciones y juegos' },
        { code: 'IN01-OA02', eje: 'Comprension auditiva', description: 'Escuchar y demostrar comprensión de vocabulario básico relacionado con su entorno inmediato mediante respuestas físicas' },
        { code: 'IN01-OA03', eje: 'Comprension lectora', description: 'Reconocer palabras simples en inglés mediante asociación con imágenes' },
        { code: 'IN01-OA04', eje: 'Expresion oral', description: 'Reproducir rimas, canciones y expresiones simples del inglés de forma coral y lúdica' },
        { code: 'IN01-OA05', eje: 'Expresion oral', description: 'Participar en actividades lúdicas usando expresiones y vocabulario básico del inglés' },
        { code: 'IN01-OA06', eje: 'Expresion escrita', description: 'Copiar palabras simples del vocabulario aprendido con apoyo visual' },
    ],

    // ══════════════════════════════════════════════
    //  INGLES 2° BASICO
    // ══════════════════════════════════════════════
    'IN02': [
        { code: 'IN02-OA01', eje: 'Comprension auditiva', description: 'Escuchar y demostrar comprensión de vocabulario y expresiones simples en contextos conocidos' },
        { code: 'IN02-OA02', eje: 'Comprension auditiva', description: 'Identificar palabras y expresiones frecuentes en textos orales breves y simples con apoyo visual' },
        { code: 'IN02-OA03', eje: 'Comprension lectora', description: 'Leer y reconocer palabras y frases simples relacionadas con temas conocidos, con apoyo de imágenes' },
        { code: 'IN02-OA04', eje: 'Expresion oral', description: 'Reproducir y producir rimas, canciones y diálogos muy breves para familiarizarse con los sonidos del inglés' },
        { code: 'IN02-OA05', eje: 'Expresion oral', description: 'Expresarse oralmente con palabras y frases simples sobre temas conocidos usando apoyo visual' },
        { code: 'IN02-OA06', eje: 'Expresion escrita', description: 'Escribir palabras y frases simples de acuerdo a un modelo y con apoyo de imágenes' },
    ],

    // ══════════════════════════════════════════════
    //  INGLES 3° BASICO
    // ══════════════════════════════════════════════
    'IN03': [
        { code: 'IN03-OA01', eje: 'Comprension auditiva', description: 'Escuchar y demostrar comprensión de información explícita en textos simples y breves con repetición y apoyo visual' },
        { code: 'IN03-OA02', eje: 'Comprension auditiva', description: 'Identificar tema general, palabras clave y vocabulario temático en textos orales' },
        { code: 'IN03-OA03', eje: 'Comprension lectora', description: 'Leer y demostrar comprensión de textos breves y simples con palabras frecuentes y repetición, con apoyo visual' },
        { code: 'IN03-OA04', eje: 'Comprension lectora', description: 'Identificar el propósito y las ideas generales en textos escritos simples relacionados con temas conocidos' },
        { code: 'IN03-OA05', eje: 'Expresion oral', description: 'Reproducir canciones, rimas y diálogos breves para identificar y familiarizarse con los sonidos del inglés' },
        { code: 'IN03-OA06', eje: 'Expresion oral', description: 'Expresarse oralmente en diálogos o presentaciones breves con apoyo visual sobre temas conocidos' },
        { code: 'IN03-OA07', eje: 'Expresion escrita', description: 'Completar y escribir textos breves de acuerdo a un modelo, con apoyo de imágenes sobre temas conocidos' },
        { code: 'IN03-OA08', eje: 'Expresion escrita', description: 'Escribir para realizar funciones como saludar, dar información personal básica y describir objetos simples' },
    ],

    // ══════════════════════════════════════════════
    //  INGLES 4° BASICO
    // ══════════════════════════════════════════════
    'IN04': [
        { code: 'IN04-OA01', eje: 'Comprension auditiva', description: 'Escuchar y demostrar comprensión de información explícita en textos adaptados y auténticos simples sobre temas conocidos' },
        { code: 'IN04-OA02', eje: 'Comprension auditiva', description: 'Identificar tema, ideas generales, información específica y vocabulario temático en textos orales' },
        { code: 'IN04-OA03', eje: 'Comprension auditiva', description: 'Escuchar textos orales usando estrategias como hacer predicciones, usar claves contextuales y visualizar aspectos del texto' },
        { code: 'IN04-OA04', eje: 'Comprension lectora', description: 'Leer y demostrar comprensión de textos no literarios simples con palabras frecuentes y repetición, con apoyo visual' },
        { code: 'IN04-OA05', eje: 'Comprension lectora', description: 'Leer y demostrar comprensión de textos literarios adaptados como cuentos, rimas y canciones' },
        { code: 'IN04-OA06', eje: 'Comprension lectora', description: 'Leer comprensivamente identificando propósito, ideas generales, información explícita y palabras clave' },
        { code: 'IN04-OA07', eje: 'Expresion oral', description: 'Reproducir y producir canciones, rimas y diálogos para familiarizarse con los sonidos del inglés' },
        { code: 'IN04-OA08', eje: 'Expresion oral', description: 'Expresarse oralmente en diálogos y presentaciones con apoyo visual sobre temas del año' },
        { code: 'IN04-OA09', eje: 'Expresion oral', description: 'Participar en diálogos para saludar, dar instrucciones, describir, expresar gustos y solicitar información' },
        { code: 'IN04-OA10', eje: 'Expresion escrita', description: 'Completar y escribir textos no literarios y literarios breves de acuerdo a un modelo con apoyo visual' },
        { code: 'IN04-OA11', eje: 'Expresion escrita', description: 'Escribir para describir, expresar gustos, dar información sobre temas conocidos y solicitar información' },
    ],

    // ══════════════════════════════════════════════
    //  INGLES 5° BASICO
    // ══════════════════════════════════════════════
    'IN05': [
        { code: 'IN05-OA01', eje: 'Comprension auditiva', description: 'Escuchar y demostrar comprensión de información explícita en textos adaptados y auténticos simples, tanto no literarios como literarios, enunciados en forma clara' },
        { code: 'IN05-OA02', eje: 'Comprension auditiva', description: 'Identificar en los textos escuchados: tema general, información específica, palabras y expresiones clave, vocabulario temático, sonidos propios del inglés' },
        { code: 'IN05-OA03', eje: 'Comprension auditiva', description: 'Escuchar textos orales en diversos formatos audiovisuales, usando estrategias como hacer predicciones, usar claves contextuales y apoyo visual' },
        { code: 'IN05-OA04', eje: 'Comprension auditiva', description: 'Reaccionar a los textos escuchados expresando preferencias u opiniones o haciendo conexiones con experiencias personales' },
        { code: 'IN05-OA05', eje: 'Comprension lectora', description: 'Leer y demostrar comprensión de textos adaptados y auténticos simples no literarios con palabras de uso frecuente y apoyo visual' },
        { code: 'IN05-OA06', eje: 'Comprension lectora', description: 'Leer comprensivamente textos no literarios identificando: propósito, ideas generales, información explícita, palabras clave y vocabulario temático' },
        { code: 'IN05-OA07', eje: 'Comprension lectora', description: 'Leer comprensivamente textos literarios adaptados y auténticos simples, identificando tema, personajes, lugares, secuencia de eventos y vocabulario' },
        { code: 'IN05-OA08', eje: 'Comprension lectora', description: 'Reaccionar a los textos leídos expresando preferencias u opiniones o haciendo conexiones con experiencias personales' },
        { code: 'IN05-OA09', eje: 'Expresion oral', description: 'Expresarse oralmente en diálogos, presentaciones o actividades grupales con apoyo de lenguaje visual o digital' },
        { code: 'IN05-OA10', eje: 'Expresion oral', description: 'Participar en diálogos y actividades grupales ejecutando funciones como saludar, dar instrucciones, describir acciones, expresar gustos y solicitar información' },
        { code: 'IN05-OA11', eje: 'Expresion oral', description: 'Demostrar conocimiento y uso del vocabulario aprendido: vocabulario temático, palabras de uso frecuente y expresiones comunes' },
        { code: 'IN05-OA12', eje: 'Expresion escrita', description: 'Completar y escribir, de acuerdo a un modelo, textos no literarios y literarios sobre temas conocidos o de otras asignaturas' },
        { code: 'IN05-OA13', eje: 'Expresion escrita', description: 'Escribir, en forma guiada, para describir acciones cotidianas, expresar gustos, cantidades, información general sobre temas conocidos y solicitar información' },
    ],

    // ══════════════════════════════════════════════
    //  INGLES 6° BASICO
    // ══════════════════════════════════════════════
    'IN06': [
        { code: 'IN06-OA01', eje: 'Comprension auditiva', description: 'Escuchar y demostrar comprensión de información explícita en textos adaptados y auténticos simples, literarios y no literarios, en diversos formatos audiovisuales' },
        { code: 'IN06-OA02', eje: 'Comprension auditiva', description: 'Identificar en los textos escuchados: propósito, tema, ideas generales, información específica, palabras y expresiones de uso frecuente, vocabulario temático' },
        { code: 'IN06-OA03', eje: 'Comprension auditiva', description: 'Escuchar textos orales usando estrategias como hacer predicciones, escuchar con un propósito, usar conocimientos previos y apoyos visuales' },
        { code: 'IN06-OA04', eje: 'Comprension auditiva', description: 'Reaccionar a los textos escuchados, expresando opiniones, haciendo conexiones con experiencias personales' },
        { code: 'IN06-OA05', eje: 'Comprension lectora', description: 'Leer y demostrar comprensión de textos no literarios simples y adaptados con palabras de uso frecuente y apoyo visual' },
        { code: 'IN06-OA06', eje: 'Comprension lectora', description: 'Leer comprensivamente textos no literarios identificando: propósito, ideas generales, información explícita, palabras clave, vocabulario temático' },
        { code: 'IN06-OA07', eje: 'Comprension lectora', description: 'Leer y demostrar comprensión de textos literarios simples y adaptados con palabras de uso frecuente y apoyo visual' },
        { code: 'IN06-OA08', eje: 'Comprension lectora', description: 'Leer comprensivamente textos literarios identificando: tema, personajes, lugares, secuencia de eventos, ideas generales y vocabulario temático' },
        { code: 'IN06-OA09', eje: 'Expresion oral', description: 'Expresarse oralmente en diálogos, presentaciones o actividades grupales con apoyo visual o digital sobre temas del año' },
        { code: 'IN06-OA10', eje: 'Expresion oral', description: 'Participar en diálogos ejecutando funciones como: saludar, describir acciones, lugares, objetos y personas, expresar gustos, preferencias, solicitar información' },
        { code: 'IN06-OA11', eje: 'Expresion oral', description: 'Demostrar conocimiento y uso del vocabulario aprendido: vocabulario temático, palabras de uso frecuente, expresiones de uso común' },
        { code: 'IN06-OA12', eje: 'Expresion escrita', description: 'Completar y escribir de acuerdo a un modelo textos no literarios y literarios sobre temas de su vida diaria o de otras asignaturas' },
        { code: 'IN06-OA13', eje: 'Expresion escrita', description: 'Escribir en forma guiada para describir acciones, lugares, objetos y personas, expresar gustos, preferencias y solicitar información' },
    ],

    // ══════════════════════════════════════════════
    //  INGLES 7° BASICO
    // ══════════════════════════════════════════════
    'IN07': [
        { code: 'IN07-OA01', eje: 'Comprension auditiva', description: 'Escuchar y demostrar comprensión de información explícita en textos adaptados y auténticos simples, en diversos formatos audiovisuales sobre temas cotidianos y del contexto escolar' },
        { code: 'IN07-OA02', eje: 'Comprension auditiva', description: 'Identificar en los textos escuchados: propósito, tema, ideas relevantes, información específica, palabras y frases clave, expresiones de uso frecuente, vocabulario temático y conectores' },
        { code: 'IN07-OA03', eje: 'Comprension auditiva', description: 'Escuchar textos orales usando estrategias como hacer predicciones, escuchar con un propósito, usar conocimientos previos y hacer inferencias' },
        { code: 'IN07-OA04', eje: 'Comprension auditiva', description: 'Reaccionar a textos escuchados expresando opiniones, haciendo conexiones con experiencias personales y respondiendo preguntas' },
        { code: 'IN07-OA05', eje: 'Comprension lectora', description: 'Leer y demostrar comprensión de textos no literarios simples, adaptados y auténticos, con palabras de uso frecuente, conectores y apoyo visual' },
        { code: 'IN07-OA06', eje: 'Comprension lectora', description: 'Leer comprensivamente textos no literarios identificando: propósito, tema, ideas relevantes, información específica, palabras clave y conectores' },
        { code: 'IN07-OA07', eje: 'Comprension lectora', description: 'Leer y demostrar comprensión de textos literarios simples, adaptados y auténticos, con palabras de uso frecuente y apoyo visual' },
        { code: 'IN07-OA08', eje: 'Comprension lectora', description: 'Leer comprensivamente textos literarios identificando: tema, personajes, lugares, secuencia de eventos, ideas relevantes y vocabulario' },
        { code: 'IN07-OA09', eje: 'Expresion oral', description: 'Expresarse oralmente en diálogos, presentaciones o actividades grupales con apoyo visual o digital sobre temas de interés personal y del contexto escolar' },
        { code: 'IN07-OA10', eje: 'Expresion oral', description: 'Participar en diálogos ejecutando funciones como: saludar, dar instrucciones, describir, expresar gustos, preferencias, obligación, hacer sugerencias, pedir y dar información' },
        { code: 'IN07-OA11', eje: 'Expresion oral', description: 'Demostrar conocimiento y uso del vocabulario aprendido: vocabulario temático, palabras de uso frecuente, expresiones de uso común y conectores' },
        { code: 'IN07-OA12', eje: 'Expresion escrita', description: 'Escribir historias cortas e información relevante de acuerdo a un modelo y usando herramientas digitales sobre temas del entorno cercano' },
        { code: 'IN07-OA13', eje: 'Expresion escrita', description: 'Escribir para describir, expresar gustos, preferencias, cantidades, posesiones, expresar obligación, hacer sugerencias, pedir y dar información' },
    ],

    // ══════════════════════════════════════════════
    //  INGLES 8° BASICO
    // ══════════════════════════════════════════════
    'IN08': [
        { code: 'IN08-OA01', eje: 'Comprension auditiva', description: 'Escuchar y demostrar comprensión de información explícita e implícita en textos adaptados y auténticos simples, literarios y no literarios, en diversos formatos audiovisuales' },
        { code: 'IN08-OA02', eje: 'Comprension auditiva', description: 'Identificar en los textos escuchados: propósito, tema, ideas relevantes, información específica, palabras, frases, expresiones, vocabulario temático, conectores y entonación del inglés' },
        { code: 'IN08-OA03', eje: 'Comprension auditiva', description: 'Escuchar textos orales usando estrategias como hacer predicciones, escuchar con un propósito, focalizar la atención en expresiones clave y hacer inferencias' },
        { code: 'IN08-OA04', eje: 'Comprension auditiva', description: 'Reaccionar a textos escuchados expresando opiniones y sentimientos fundamentados, haciendo conexiones con experiencias personales' },
        { code: 'IN08-OA05', eje: 'Comprension lectora', description: 'Leer y demostrar comprensión de textos no literarios simples, adaptados y auténticos, con palabras de uso frecuente, expresiones de uso común y conectores' },
        { code: 'IN08-OA06', eje: 'Comprension lectora', description: 'Leer comprensivamente textos no literarios identificando: propósito, tema, ideas relevantes, información específica, palabras clave y conectores' },
        { code: 'IN08-OA07', eje: 'Comprension lectora', description: 'Leer y demostrar comprensión de textos literarios simples, adaptados y auténticos, con palabras de uso frecuente y expresiones de uso común' },
        { code: 'IN08-OA08', eje: 'Comprension lectora', description: 'Leer comprensivamente textos literarios identificando: tema, personajes, ambiente, secuencia de eventos, ideas relevantes y vocabulario' },
        { code: 'IN08-OA09', eje: 'Expresion oral', description: 'Expresarse oralmente en diálogos, presentaciones o actividades grupales con apoyo visual o digital sobre temas variados' },
        { code: 'IN08-OA10', eje: 'Expresion oral', description: 'Participar en diálogos ejecutando funciones como: saludar, dar instrucciones, describir, expresar gustos, preferencias, obligación, necesidad, hacer sugerencias, expresar opiniones, acuerdo y desacuerdo' },
        { code: 'IN08-OA11', eje: 'Expresion oral', description: 'Demostrar conocimiento y uso del vocabulario aprendido: vocabulario temático, palabras de uso frecuente, expresiones de uso común, conectores y marcadores de secuencia' },
        { code: 'IN08-OA12', eje: 'Expresion escrita', description: 'Escribir historias cortas e información relevante de acuerdo a un modelo y usando herramientas digitales sobre temas variados' },
        { code: 'IN08-OA13', eje: 'Expresion escrita', description: 'Escribir para describir, expresar gustos, preferencias, cantidades, posesiones, expresar obligación, necesidad, hacer sugerencias, expresar opiniones, acuerdo y desacuerdo' },
    ],
};

/**
 * Get OAs for a given asignatura code + curso name
 * @param {string} code - e.g. 'MA'
 * @param {string} curso - e.g. '3° Basico'
 * @returns {Array} OA entries or empty array
 */
export function getOAsForCursoAsignatura(code, curso) {
    const level = CURSO_TO_LEVEL[curso] || findLevelNormalized(curso);
    if (!level) return [];
    return OA_DATA[`${code}${level}`] || [];
}

// Fallback lookup that ignores accents (handles legacy data with "Basico" vs "Básico")
function findLevelNormalized(curso) {
    if (!curso) return null;
    const norm = curso.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    for (const [key, val] of Object.entries(CURSO_TO_LEVEL)) {
        if (key.normalize('NFD').replace(/[\u0300-\u036f]/g, '') === norm) return val;
    }
    return null;
}

/**
 * Get unique ejes for a given asignatura + curso
 * @param {string} code
 * @param {string} curso
 * @returns {string[]}
 */
export function getEjesForAsignatura(code, curso) {
    const oas = getOAsForCursoAsignatura(code, curso);
    return [...new Set(oas.map(oa => oa.eje))];
}

/**
 * Lookup a single OA by its code
 * @param {string} oaCode - e.g. 'MA03-OA01'
 * @returns {Object|null}
 */
export function getOAByCode(oaCode) {
    for (const key in OA_DATA) {
        const found = OA_DATA[key].find(oa => oa.code === oaCode);
        if (found) return found;
    }
    return null;
}
