
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
    { code: 'RE', name: 'Religion Evangelica' },
    { code: 'RC', name: 'Religion Catolica' },
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
        { code: 'MA01-OA16', eje: 'Datos y probabilidades', description: 'Construir y leer pictogramas sencillos con una categoría para representar datos del entorno escolar y familiar' },
        { code: 'MA01-OA17', eje: 'Numeros y operaciones', description: 'Resolver problemas rutinarios de adicion y sustraccion hasta 20 en situaciones de la vida cotidiana' },
        { code: 'MA01-OA18', eje: 'Numeros y operaciones', description: 'Reconocer monedas de $10, $50 y $100 del sistema monetario chileno y usarlas en situaciones cotidianas de compra' },
        { code: 'MA01-OA19', eje: 'Numeros y operaciones', description: 'Resolver situaciones problemáticas simples de compra y venta usando monedas hasta $100' },
        { code: 'MA01-OA20', eje: 'Datos y probabilidades', description: 'Registrar y representar datos simples del entorno en pictogramas y describirlos oralmente' },
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
        { code: 'MA02-OA17', eje: 'Numeros y operaciones', description: 'Reconocer monedas y billetes del sistema monetario chileno hasta $1.000 y usarlos en situaciones de compra, venta y cambio' },
        { code: 'MA02-OA18', eje: 'Numeros y operaciones', description: 'Resolver problemas de compra y venta usando billetes y monedas hasta $1.000, calculando el vuelto' },
        { code: 'MA02-OA19', eje: 'Numeros y operaciones', description: 'Resolver problemas cotidianos de adición y sustracción hasta 100 en distintos contextos de la vida real' },
        { code: 'MA02-OA20', eje: 'Patrones y algebra', description: 'Resolver problemas que involucren la multiplicación usando representaciones concretas, pictóricas y simbólicas hasta 10x10' },
        { code: 'MA02-OA21', eje: 'Datos y probabilidades', description: 'Construir y leer pictogramas con escala y gráficos de barra simple para representar y comunicar datos del entorno' },
        { code: 'MA02-OA22', eje: 'Datos y probabilidades', description: 'Organizar datos en tablas de doble entrada y gráficos de barra, e interpretarlos para responder preguntas estadísticas' },
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
        { code: 'MA03-OA21', eje: 'Numeros y operaciones', description: 'Reconocer y usar monedas y billetes del sistema monetario chileno hasta $10.000 en situaciones de compra, venta y cambio' },
        { code: 'MA03-OA22', eje: 'Numeros y operaciones', description: 'Resolver problemas de compra y venta con billetes y monedas hasta $10.000, calculando el vuelto y comparando precios' },
        { code: 'MA03-OA23', eje: 'Medicion', description: 'Medir y estimar capacidades usando unidades estandarizadas (litro y mililitro) en situaciones cotidianas' },
        { code: 'MA03-OA24', eje: 'Datos y probabilidades', description: 'Resolver problemas de datos que involucren la recolección, registro, organización e interpretación de información en gráficos y tablas' },
        { code: 'MA03-OA25', eje: 'Numeros y operaciones', description: 'Resolver problemas combinados de adición, sustracción, multiplicación y división usando distintas estrategias en contextos reales' },
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
        { code: 'MA04-OA23', eje: 'Numeros y operaciones', description: 'Reconocer y usar billetes y monedas del sistema monetario chileno hasta $100.000 en situaciones de compra, venta y cambio' },
        { code: 'MA04-OA24', eje: 'Numeros y operaciones', description: 'Resolver problemas que involucren el uso del dinero hasta $100.000, incluyendo operaciones combinadas de suma, resta y multiplicación' },
        { code: 'MA04-OA25', eje: 'Medicion', description: 'Medir masas y volúmenes con unidades estandarizadas (kg, g, L, mL) y realizar conversiones entre ellas en contextos cotidianos' },
        { code: 'MA04-OA26', eje: 'Datos y probabilidades', description: 'Construir, leer e interpretar tablas de doble entrada y gráficos de barra doble con escala para comunicar datos' },
        { code: 'MA04-OA27', eje: 'Numeros y operaciones', description: 'Resolver problemas no rutinarios de múltiples pasos que combinen las cuatro operaciones y distintos contextos matemáticos reales' },
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
        { code: 'MA05-OA21', eje: 'Numeros y operaciones', description: 'Resolver problemas que involucren porcentajes en contextos de compra, descuento e impuesto en situaciones cotidianas' },
        { code: 'MA05-OA22', eje: 'Datos y probabilidades', description: 'Construir y leer tablas de frecuencia y gráficos estadísticos variados (barra, línea, circular) para analizar datos del entorno' },
        { code: 'MA05-OA23', eje: 'Datos y probabilidades', description: 'Calcular la probabilidad de eventos simples como fracción entre los resultados favorables y los posibles' },
        { code: 'MA05-OA24', eje: 'Numeros y operaciones', description: 'Resolver problemas matemáticos de múltiples pasos que involucren las cuatro operaciones y contextos variados de la vida real' },
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
        { code: 'MA06-OA17', eje: 'Numeros y operaciones', description: 'Resolver problemas que involucren razones y proporciones en contextos geométricos, estadísticos y cotidianos' },
        { code: 'MA06-OA18', eje: 'Numeros y operaciones', description: 'Calcular intereses simples y aplicar porcentajes en contextos de finanzas personales (ahorro, descuento, impuesto)' },
        { code: 'MA06-OA19', eje: 'Algebra', description: 'Modelar situaciones de la vida cotidiana usando expresiones algebraicas con letras e incógnitas' },
        { code: 'MA06-OA20', eje: 'Medicion', description: 'Calcular el volumen de cuerpos regulares (cubos y paralelepípedos) en distintas unidades y resolver problemas de aplicación' },
        { code: 'MA06-OA21', eje: 'Datos y probabilidades', description: 'Calcular la probabilidad de eventos simples y compuestos, comparando resultados teóricos y experimentales' },
        { code: 'MA06-OA22', eje: 'Datos y probabilidades', description: 'Resolver problemas estadísticos que involucren recolección, representación e interpretación de datos usando distintos tipos de gráficos' },
        { code: 'MA06-OA23', eje: 'Datos y probabilidades', description: 'Calcular e interpretar medidas de tendencia central (media, mediana, moda) y de dispersión (rango) en conjuntos de datos reales' },
        { code: 'MA06-OA24', eje: 'Numeros y operaciones', description: 'Resolver problemas complejos de múltiples pasos que involucren operaciones con fracciones, decimales, porcentajes y proporciones en contextos reales' },
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
        { code: 'MA07-OA17', eje: 'Algebra', description: 'Modelar y resolver situaciones de la vida cotidiana usando funciones lineales, representándolas en tablas, gráficos y expresiones algebraicas' },
        { code: 'MA07-OA18', eje: 'Algebra', description: 'Resolver sistemas de ecuaciones de primer grado con dos incógnitas usando métodos gráficos y algebraicos básicos' },
        { code: 'MA07-OA19', eje: 'Datos y probabilidades', description: 'Representar datos estadísticos usando distintos tipos de gráficos (circular, de línea, histograma) y seleccionar el más adecuado según el contexto' },
        { code: 'MA07-OA20', eje: 'Datos y probabilidades', description: 'Usar datos estadísticos para construir modelos matemáticos simples y hacer predicciones en distintos contextos reales' },
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
        { code: 'MA08-OA17', eje: 'Algebra', description: 'Modelar y resolver situaciones usando funciones afines e inversas, representándolas gráfica y algebraicamente' },
        { code: 'MA08-OA18', eje: 'Geometria', description: 'Resolver problemas de geometría analítica en el plano cartesiano: calcular distancia entre puntos, pendiente y ecuación de la recta' },
        { code: 'MA08-OA19', eje: 'Algebra', description: 'Resolver sistemas de ecuaciones de primer grado con dos incógnitas usando sustitución, igualación y reducción' },
        { code: 'MA08-OA20', eje: 'Datos y probabilidades', description: 'Calcular probabilidades de eventos compuestos usando reglas de la suma y el producto en situaciones concretas' },
        { code: 'MA08-OA21', eje: 'Datos y probabilidades', description: 'Construir e interpretar distintos tipos de gráficos estadísticos (histograma, diagrama de caja y bigotes) para comparar distribuciones' },
        { code: 'MA08-OA22', eje: 'Datos y probabilidades', description: 'Resolver problemas estadísticos complejos que involucren medidas de dispersión (varianza, desviación estándar) y análisis de datos agrupados' },
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
        { code: 'LE01-OA19', eje: 'Escritura', description: 'Escribir con letra legible, manteniendo un tamaño y espaciado uniformes en distintos tipos de texto' },
        { code: 'LE01-OA20', eje: 'Escritura', description: 'Usar mayúsculas al inicio de oración y en nombres propios, y punto final al terminar la idea' },
        { code: 'LE01-OA21', eje: 'Comunicacion oral', description: 'Comprender textos orales breves (instrucciones, relatos cortos) para identificar información explícita y responder preguntas' },
        { code: 'LE01-OA22', eje: 'Comunicacion oral', description: 'Participar en conversaciones grupales respetando turnos de habla y escuchando a los compañeros con atención' },
        { code: 'LE01-OA23', eje: 'Comunicacion oral', description: 'Expresar con claridad mensajes, ideas, sentimientos y experiencias propias, usando frases completas y vocabulario adecuado' },
        { code: 'LE01-OA24', eje: 'Comunicacion oral', description: 'Recitar de memoria poemas, canciones y rimas con entonación y volumen adecuados para una audiencia' },
        { code: 'LE01-OA25', eje: 'Comunicacion oral', description: 'Usar nuevas palabras aprendidas de textos escuchados y leídos en sus propias conversaciones y producciones escritas' },
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
        { code: 'LE02-OA19', eje: 'Escritura', description: 'Escribir con letra legible y con disposición correcta en la página, respetando márgenes y separación entre palabras' },
        { code: 'LE02-OA20', eje: 'Escritura', description: 'Usar correctamente los signos de puntuación básicos (punto, coma, signos de interrogación y exclamación) en sus escritos' },
        { code: 'LE02-OA21', eje: 'Escritura', description: 'Aplicar en sus escritos las reglas ortográficas estudiadas: uso de mayúsculas, b/v, c/s, h muda' },
        { code: 'LE02-OA22', eje: 'Escritura', description: 'Usar herramientas digitales básicas para escribir, revisar y presentar textos sencillos' },
        { code: 'LE02-OA23', eje: 'Comunicacion oral', description: 'Comprender textos orales variados para extraer información explícita e implícita y responder preguntas pertinentes' },
        { code: 'LE02-OA24', eje: 'Comunicacion oral', description: 'Participar en conversaciones y diálogos, compartiendo ideas y experiencias y respetando las normas de comunicación oral' },
        { code: 'LE02-OA25', eje: 'Comunicacion oral', description: 'Expresarse de manera organizada en presentaciones orales breves, manteniendo contacto visual con la audiencia' },
        { code: 'LE02-OA26', eje: 'Comunicacion oral', description: 'Escuchar con atención y comprensión textos literarios y no literarios leídos en voz alta, respondiendo preguntas de comprensión' },
        { code: 'LE02-OA27', eje: 'Comunicacion oral', description: 'Recitar y disfrutar textos de la literatura oral (poemas, adivinanzas, refranes) con expresión y entonación adecuadas' },
        { code: 'LE02-OA28', eje: 'Comunicacion oral', description: 'Usar el vocabulario nuevo aprendido de textos leídos y escuchados en sus propias producciones orales y escritas' },
        { code: 'LE02-OA29', eje: 'Comunicacion oral', description: 'Participar en dramatizaciones y juegos de roles, representando situaciones de la literatura y la vida cotidiana' },
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
        { code: 'LE03-OA19', eje: 'Escritura', description: 'Escribir con letra legible, clara y en tamaño adecuado para distintos soportes y propósitos comunicativos' },
        { code: 'LE03-OA20', eje: 'Escritura', description: 'Aplicar correctamente reglas ortográficas estudiadas (uso de g/j, z/c, ll/y, h muda, q) en sus producciones escritas' },
        { code: 'LE03-OA21', eje: 'Escritura', description: 'Revisar y editar sus textos para mejorar el contenido, la organización y la ortografía, con apoyo del docente y los pares' },
        { code: 'LE03-OA22', eje: 'Escritura', description: 'Usar herramientas digitales para escribir, revisar y publicar textos de distintos tipos' },
        { code: 'LE03-OA23', eje: 'Escritura', description: 'Usar conectores temporales y causales (y, pero, porque, entonces, sin embargo) para dar cohesión a sus textos' },
        { code: 'LE03-OA24', eje: 'Comunicacion oral', description: 'Comprender textos orales de distinto tipo (instrucciones, explicaciones, noticias) para extraer información relevante y responder preguntas' },
        { code: 'LE03-OA25', eje: 'Comunicacion oral', description: 'Participar activamente en conversaciones y debates, aportando ideas con fundamento y respetando las normas de comunicación oral' },
        { code: 'LE03-OA26', eje: 'Comunicacion oral', description: 'Expresarse de manera organizada y clara en presentaciones orales sobre temas de su interés, usando material de apoyo visual' },
        { code: 'LE03-OA27', eje: 'Comunicacion oral', description: 'Escuchar con atención textos literarios y no literarios leídos en voz alta, respondiendo preguntas de comprensión e inferencia' },
        { code: 'LE03-OA28', eje: 'Comunicacion oral', description: 'Usar el vocabulario nuevo aprendido en distintos contextos comunicativos, orales y escritos, con pertinencia y precisión' },
        { code: 'LE03-OA29', eje: 'Comunicacion oral', description: 'Participar en representaciones dramáticas y juegos de roles, desarrollando habilidades de expresión y cooperación' },
        { code: 'LE03-OA30', eje: 'Comunicacion oral', description: 'Reconocer y apreciar la diversidad de acentos y expresiones del español de Chile y América Latina, valorando la riqueza lingüística del idioma' },
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
        { code: 'LE04-OA19', eje: 'Escritura', description: 'Escribir con letra clara y legible, adaptando el formato y el tipo de letra al propósito comunicativo y al soporte' },
        { code: 'LE04-OA20', eje: 'Escritura', description: 'Aplicar reglas ortográficas estudiadas (acentuación, uso de puntuación variada, mayúsculas) con creciente autonomía en sus producciones escritas' },
        { code: 'LE04-OA21', eje: 'Escritura', description: 'Revisar y editar sus textos para mejorar la coherencia, la cohesión y la adecuación al propósito y la audiencia' },
        { code: 'LE04-OA22', eje: 'Escritura', description: 'Usar recursos digitales para escribir, revisar, diseñar y publicar textos con distintos propósitos comunicativos' },
        { code: 'LE04-OA23', eje: 'Comunicacion oral', description: 'Comprender textos orales de distinta índole (instrucciones, noticias, documentales, entrevistas) para extraer información, hacer inferencias y reflexionar sobre su propósito' },
        { code: 'LE04-OA24', eje: 'Comunicacion oral', description: 'Participar activamente en debates y conversaciones, aportando argumentos fundamentados y respondiendo a las ideas de los demás con respeto' },
        { code: 'LE04-OA25', eje: 'Comunicacion oral', description: 'Exponer de manera organizada y clara sobre temas investigados, usando material de apoyo visual y manteniendo la atención de la audiencia' },
        { code: 'LE04-OA26', eje: 'Comunicacion oral', description: 'Escuchar críticamente textos orales identificando recursos expresivos y propósitos del hablante' },
        { code: 'LE04-OA27', eje: 'Comunicacion oral', description: 'Comprender y producir distintos tipos de discurso oral: narración, descripción, argumentación, exposición' },
        { code: 'LE04-OA28', eje: 'Comunicacion oral', description: 'Usar vocabulario preciso y variado en sus producciones orales y escritas, evitando repeticiones innecesarias' },
        { code: 'LE04-OA29', eje: 'Comunicacion oral', description: 'Participar en dramatizaciones, lecturas dramatizadas y representaciones colectivas integrando habilidades expresivas y cooperativas' },
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
        { code: 'LE05-OA19', eje: 'Escritura', description: 'Escribir con fluidez y legibilidad en distintos soportes, adaptando el formato al propósito y la audiencia' },
        { code: 'LE05-OA20', eje: 'Escritura', description: 'Aplicar correctamente las principales reglas ortográficas y de puntuación en sus producciones escritas, corrigiéndolas con creciente autonomía' },
        { code: 'LE05-OA21', eje: 'Escritura', description: 'Revisar y editar textos propios y de compañeros, usando criterios de contenido, estructura, vocabulario y corrección ortográfica' },
        { code: 'LE05-OA22', eje: 'Escritura', description: 'Usar recursos digitales para crear, diseñar y publicar textos de distintos tipos para audiencias reales' },
        { code: 'LE05-OA23', eje: 'Escritura', description: 'Escribir textos argumentativos breves (cartas de opinión, reseñas) expresando y fundamentando un punto de vista propio' },
        { code: 'LE05-OA24', eje: 'Comunicacion oral', description: 'Comprender textos orales complejos (documentales, entrevistas, debates) para analizar información e identificar la posición del hablante' },
        { code: 'LE05-OA25', eje: 'Comunicacion oral', description: 'Participar con autonomía en debates y discusiones, fundamentando opiniones con argumentos y contraargumentos pertinentes' },
        { code: 'LE05-OA26', eje: 'Comunicacion oral', description: 'Exponer de manera organizada sobre temas investigados, usando recursos de apoyo variados (visual, digital) para distintas audiencias' },
        { code: 'LE05-OA27', eje: 'Comunicacion oral', description: 'Escuchar críticamente textos de distintos géneros y propósitos, identificando recursos retóricos y persuasivos del hablante' },
        { code: 'LE05-OA28', eje: 'Comunicacion oral', description: 'Usar vocabulario preciso, rico y variado en distintos contextos comunicativos, seleccionando el registro apropiado según la situación' },
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
        { code: 'LE06-OA19', eje: 'Escritura', description: 'Escribir con fluidez y precisión en distintos soportes y registros, adaptando el estilo al propósito y la audiencia' },
        { code: 'LE06-OA20', eje: 'Escritura', description: 'Aplicar con autonomía las normas ortográficas y de puntuación del español en la producción de textos de distintos géneros' },
        { code: 'LE06-OA21', eje: 'Escritura', description: 'Revisar y editar textos propios con criterios de coherencia, cohesión, adecuación y corrección, usando retroalimentación del docente y los pares' },
        { code: 'LE06-OA22', eje: 'Escritura', description: 'Crear contenidos digitales de distintos géneros y formatos para publicar y compartir con audiencias reales con propósito comunicativo claro' },
        { code: 'LE06-OA23', eje: 'Comunicacion oral', description: 'Comprender textos orales formales e informales de distintos géneros, analizando su estructura, propósito y recursos expresivos' },
        { code: 'LE06-OA24', eje: 'Comunicacion oral', description: 'Participar activa y críticamente en debates, mesas redondas y foros, fundamentando posiciones con argumentos y evidencia concreta' },
        { code: 'LE06-OA25', eje: 'Comunicacion oral', description: 'Exponer con dominio y fluidez sobre temas complejos, usando recursos de apoyo variados y adaptando el discurso a la audiencia' },
        { code: 'LE06-OA26', eje: 'Comunicacion oral', description: 'Escuchar críticamente textos orales de distintos géneros, evaluando la calidad de los argumentos y la pertinencia de los recursos expresivos' },
        { code: 'LE06-OA27', eje: 'Comunicacion oral', description: 'Comprender y utilizar convenciones propias del discurso oral formal (turnos de palabra, registro adecuado, cortesía lingüística) en distintas situaciones' },
        { code: 'LE06-OA28', eje: 'Comunicacion oral', description: 'Usar vocabulario preciso, variado y adecuado al contexto en producciones orales y escritas, incluyendo términos técnicos de las disciplinas estudiadas' },
        { code: 'LE06-OA29', eje: 'Comunicacion oral', description: 'Participar en producciones teatrales, lecturas expresivas y creaciones colectivas integrando habilidades lingüísticas, artísticas y comunicativas' },
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
        { code: 'LE07-OA17', eje: 'Escritura', description: 'Escribir textos de mayor extensión y complejidad, con coherencia temática, cohesión y adecuación al propósito, género y registro' },
        { code: 'LE07-OA18', eje: 'Escritura', description: 'Aplicar con precisión y autonomía normas ortográficas y convenciones del español escrito en la producción de textos complejos' },
        { code: 'LE07-OA19', eje: 'Escritura', description: 'Revisar y editar textos propios y ajenos con criterios técnicos de coherencia, cohesión, adecuación y normativa, incorporando retroalimentación' },
        { code: 'LE07-OA20', eje: 'Escritura', description: 'Crear contenidos digitales de distinto tipo y formato para comunicar, informar o persuadir a audiencias reales, usando recursos multimodales' },
        { code: 'LE07-OA21', eje: 'Comunicacion oral', description: 'Comprender textos orales complejos de distintos géneros discursivos (conferencias, podcasts, debates) para analizar propósito, estructura y recursos retóricos' },
        { code: 'LE07-OA22', eje: 'Comunicacion oral', description: 'Participar con autonomía y pensamiento crítico en debates y discusiones formales, construyendo argumentos sólidos y rebatiendo posiciones opuestas con evidencia' },
        { code: 'LE07-OA23', eje: 'Comunicacion oral', description: 'Exponer con dominio y fluidez ante audiencias diversas, adaptando el discurso al contexto, usando recursos multimodales y respondiendo preguntas' },
        { code: 'LE07-OA24', eje: 'Comunicacion oral', description: 'Escuchar y analizar críticamente discursos orales de distintos géneros, identificando intenciones, sesgos y recursos persuasivos del hablante' },
        { code: 'LE07-OA25', eje: 'Comunicacion oral', description: 'Usar con precisión y riqueza el vocabulario disciplinar en producciones orales y escritas, demostrando comprensión y manejo de registros formales e informales' },
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
        { code: 'LE08-OA17', eje: 'Escritura', description: 'Escribir textos extensos y complejos de distintos géneros (ensayo, crónica, artículo de opinión, carta formal) con estructura, coherencia y estilo propios' },
        { code: 'LE08-OA18', eje: 'Escritura', description: 'Aplicar con precisión y dominio las normas ortográficas y convenciones del español en producciones escritas de distintos géneros y propósitos' },
        { code: 'LE08-OA19', eje: 'Escritura', description: 'Revisar, editar y reescribir textos propios a partir de criterios técnicos de coherencia, cohesión, adecuación y normativa, incorporando retroalimentación' },
        { code: 'LE08-OA20', eje: 'Escritura', description: 'Publicar y compartir producciones escritas digitales, usando múltiples recursos y plataformas, para audiencias reales dentro y fuera del contexto escolar' },
        { code: 'LE08-OA21', eje: 'Comunicacion oral', description: 'Comprender textos orales de alta complejidad (conferencias, debates académicos, discursos) analizando críticamente propósito, estructura, recursos retóricos e ideología' },
        { code: 'LE08-OA22', eje: 'Comunicacion oral', description: 'Participar con autonomía, pensamiento crítico y liderazgo comunicativo en debates, foros y paneles formales, construyendo y sustentando argumentos complejos' },
        { code: 'LE08-OA23', eje: 'Comunicacion oral', description: 'Exponer con dominio pleno ante distintas audiencias, usando recursos multimodales y estrategias discursivas variadas, adaptando el registro con solvencia' },
        { code: 'LE08-OA24', eje: 'Comunicacion oral', description: 'Escuchar y evaluar críticamente discursos orales complejos de distintos géneros y contextos, identificando sesgos, falacias, intenciones y recursos retóricos' },
        { code: 'LE08-OA25', eje: 'Comunicacion oral', description: 'Usar con precisión y riqueza el vocabulario disciplinar y literario en producciones orales y escritas, demostrando dominio de registros formales, académicos y estéticos' },
        { code: 'LE08-OA26', eje: 'Comunicacion oral', description: 'Reflexionar metacognitivamente sobre el propio desempeño comunicativo oral y escrito, estableciendo metas de mejora y reconociendo los aprendizajes logrados' },
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
        { code: 'CN04-OA18', eje: 'Ciencias de la vida', description: 'Investigar y comprender el impacto de la acción humana sobre los ecosistemas de Chile, proponiendo medidas de conservación y sustentabilidad' },
        { code: 'CN04-OA19', eje: 'Habilidades cientificas', description: 'Diseñar y realizar experimentos científicos sencillos, registrando observaciones y formulando conclusiones usando el método científico' },
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
        { code: 'CN05-OA15', eje: 'Habilidades cientificas', description: 'Planificar y realizar investigaciones científicas, formulando preguntas, hipótesis, diseñando procedimientos y registrando resultados con rigor' },
        { code: 'CN05-OA16', eje: 'Ciencias de la vida', description: 'Analizar el impacto de las actividades humanas sobre la biodiversidad de Chile, identificando acciones de conservación y uso sustentable de los recursos naturales' },
        { code: 'CN05-OA17', eje: 'Ciencias de la vida', description: 'Investigar y describir los distintos biomas y ecosistemas presentes en Chile, relacionándolos con las condiciones climáticas y geográficas del país' },
        { code: 'CN05-OA18', eje: 'Ciencias fisicas y quimicas', description: 'Investigar y describir fuentes de energía renovables y no renovables presentes en Chile, analizando su impacto ambiental y social' },
        { code: 'CN05-OA19', eje: 'Ciencias fisicas y quimicas', description: 'Explicar el concepto de energía, sus distintas formas (luminosa, térmica, eléctrica, mecánica) y sus transformaciones en situaciones cotidianas' },
        { code: 'CN05-OA20', eje: 'Habilidades cientificas', description: 'Comunicar los resultados de investigaciones científicas usando tablas, gráficos e informes escritos con vocabulario científico pertinente' },
        { code: 'CN05-OA21', eje: 'Ciencias de la vida', description: 'Analizar el ciclo del agua y su importancia para los seres vivos y los ecosistemas, relacionándolo con los fenómenos meteorológicos y climáticos de Chile' },
        { code: 'CN05-OA22', eje: 'Ciencias de la vida', description: 'Investigar y describir las características de los principales ecosistemas de Chile (desierto, bosque, estepa, costal) y las relaciones entre los seres vivos que los habitan' },
        { code: 'CN05-OA23', eje: 'Ciencias fisicas y quimicas', description: 'Investigar y describir propiedades físicas y químicas de materiales presentes en el entorno, clasificándolos según sus características y usos' },
        { code: 'CN05-OA24', eje: 'Ciencias de la Tierra y el universo', description: 'Describir el Sistema Solar y sus componentes (Sol, planetas, satélites, asteroides), explicando los movimientos de traslación y rotación y sus consecuencias en la Tierra' },
        { code: 'CN05-OA25', eje: 'Habilidades cientificas', description: 'Analizar e interpretar datos y evidencias para construir explicaciones científicas y evaluar argumentos, reconociendo la diferencia entre opinión y evidencia' },
        { code: 'CN05-OA26', eje: 'Ciencias de la vida', description: 'Investigar y explicar la importancia de los microorganismos (bacterias, hongos, virus) en los ecosistemas y en la salud humana, identificando medidas de prevención de enfermedades' },
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
        { code: 'CN07-OA16', eje: 'Habilidades cientificas', description: 'Planificar y ejecutar investigaciones científicas complejas, formulando hipótesis, diseñando procedimientos controlados y analizando resultados con rigor estadístico' },
        { code: 'CN07-OA17', eje: 'Ciencias de la vida', description: 'Investigar y explicar la estructura y función del sistema nervioso humano y su relación con la percepción sensorial, los reflejos y la coordinación motora' },
        { code: 'CN07-OA18', eje: 'Ciencias fisicas y quimicas', description: 'Investigar y describir propiedades de las ondas (sonido, luz) y sus aplicaciones tecnológicas en la comunicación y la medicina' },
        { code: 'CN07-OA19', eje: 'Ciencias fisicas y quimicas', description: 'Explicar el concepto de energía mecánica (cinética y potencial) y la ley de conservación de la energía en distintas situaciones físicas' },
        { code: 'CN07-OA20', eje: 'Habilidades cientificas', description: 'Evaluar críticamente fuentes de información científica, distinguiendo entre evidencia empírica, opinión y pseudociencia en distintos contextos' },
        { code: 'CN07-OA21', eje: 'Ciencias de la vida', description: 'Analizar las adaptaciones de los organismos a sus ambientes y cómo estas favorecen la supervivencia y reproducción en distintos ecosistemas' },
        { code: 'CN07-OA22', eje: 'Ciencias fisicas y quimicas', description: 'Investigar y describir reacciones químicas cotidianas (combustión, oxidación, fotosíntesis), identificando reactantes, productos y sus aplicaciones' },
        { code: 'CN07-OA23', eje: 'Ciencias de la Tierra y el universo', description: 'Investigar y describir fenómenos astronómicos observables (fases de la Luna, eclipses, mareas) y su influencia en los ecosistemas y las culturas humanas' },
        { code: 'CN07-OA24', eje: 'Habilidades cientificas', description: 'Comunicar y debatir resultados de investigaciones científicas, usando lenguaje preciso, evidencia empírica y argumentos fundamentados, reconociendo la provisionalidad del conocimiento científico' },
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
        { code: 'CN08-OA16', eje: 'Habilidades cientificas', description: 'Diseñar, ejecutar y evaluar investigaciones científicas complejas, integrando variables, controles, análisis estadístico y comunicación de resultados con rigor y precisión' },
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
        { code: 'HI01-OA15', eje: 'Formacion ciudadana', description: 'Demostrar actitudes de respeto, cooperación y responsabilidad en el hogar, la escuela y la comunidad, valorando los derechos y deberes de niñas y niños' },
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
        { code: 'HI02-OA13', eje: 'Formacion ciudadana', description: 'Identificar derechos y responsabilidades propios de su vida escolar y familiar, y reconocer instituciones que los protegen' },
        { code: 'HI02-OA14', eje: 'Historia', description: 'Describir hechos y personajes destacados de la historia de Chile, reconociendo su contribución a la identidad y el patrimonio cultural nacional' },
        { code: 'HI02-OA15', eje: 'Historia', description: 'Secuenciar hechos históricos relevantes de la historia local y nacional usando líneas de tiempo y vocabulario temporal básico' },
        { code: 'HI02-OA16', eje: 'Geografia', description: 'Describir las características geográficas de la región en que vive (relieve, clima, recursos naturales) y su relación con las actividades humanas' },
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
        { code: 'HI03-OA14', eje: 'Historia', description: 'Describir hechos y personajes destacados de la historia de Chile desde el período prehispánico hasta la Independencia, reconociendo su impacto en la identidad nacional' },
        { code: 'HI03-OA15', eje: 'Historia', description: 'Secuenciar en líneas de tiempo los principales períodos y hechos de la historia de Chile, usando vocabulario temporal adecuado (siglo, período, época)' },
        { code: 'HI03-OA16', eje: 'Geografia', description: 'Describir y comparar las características geográficas de las distintas zonas de Chile (Norte Grande, Norte Chico, Zona Central, Zona Sur, Zona Austral), relacionándolas con la vida de sus habitantes' },
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
        { code: 'HI04-OA13', eje: 'Historia', description: 'Describir el proceso de Independencia de Chile: causas, actores, hechos fundamentales y su significado para la identidad nacional' },
        { code: 'HI04-OA14', eje: 'Historia', description: 'Identificar y describir hechos relevantes de la historia de Chile en el siglo XIX (organización de la República, expansión territorial, Guerra del Pacífico) y sus consecuencias' },
        { code: 'HI04-OA15', eje: 'Historia', description: 'Analizar el surgimiento de Chile como nación: su organización política, social y económica en el siglo XIX, y los desafíos para la convivencia democrática' },
        { code: 'HI04-OA16', eje: 'Geografia', description: 'Describir y comparar las características geográficas, económicas y culturales de las regiones de Chile, identificando sus recursos naturales y actividades productivas' },
        { code: 'HI04-OA17', eje: 'Formacion ciudadana', description: 'Analizar la importancia de los valores democráticos (libertad, igualdad, justicia) y de los derechos humanos para la convivencia en la sociedad chilena contemporánea' },
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
        { code: 'HI07-OA16', eje: 'Historia', description: 'Analizar el proceso de la Revolución Francesa: causas, etapas, actores principales y legado para la construcción de las democracias modernas' },
        { code: 'HI07-OA17', eje: 'Historia', description: 'Describir el proceso de independencia de América Latina en el siglo XIX, identificando factores comunes y diferencias entre los distintos movimientos independentistas' },
        { code: 'HI07-OA18', eje: 'Historia', description: 'Analizar el impacto de la Revolución Industrial en la economía, la sociedad y el medioambiente, reconociendo transformaciones que se prolongan hasta el presente' },
        { code: 'HI07-OA19', eje: 'Historia', description: 'Analizar el proceso de formación y consolidación de los estados nacionales en Europa y América durante el siglo XIX, y los conflictos asociados a la construcción de identidades nacionales' },
        { code: 'HI07-OA20', eje: 'Formacion ciudadana', description: 'Comprender y valorar el surgimiento de los derechos políticos y sociales en el siglo XIX y comienzos del XX, relacionándolos con los derechos fundamentales vigentes en Chile' },
        { code: 'HI07-OA21', eje: 'Geografia', description: 'Analizar los procesos de colonización e imperialismo del siglo XIX, identificando sus causas económicas, políticas y culturales, y su impacto en los pueblos colonizados' },
        { code: 'HI07-OA22', eje: 'Historia', description: 'Analizar las causas, el desarrollo y las consecuencias de la Primera Guerra Mundial, reconociendo su impacto en la reorganización política y territorial del mundo' },
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
        { code: 'HI08-OA16', eje: 'Historia', description: 'Analizar el período de entreguerras (1919-1939): crisis económica de 1929, surgimiento de los totalitarismos y el ascenso del fascismo y el nazismo en Europa' },
        { code: 'HI08-OA17', eje: 'Historia', description: 'Analizar las causas, el desarrollo y las consecuencias de la Segunda Guerra Mundial, incluyendo el Holocausto y su impacto en la creación de la ONU y la Declaración Universal de Derechos Humanos' },
        { code: 'HI08-OA18', eje: 'Historia', description: 'Analizar el proceso de la Guerra Fría: causas, características, conflictos asociados y su influencia en América Latina y Chile durante el siglo XX' },
        { code: 'HI08-OA19', eje: 'Historia', description: 'Describir y analizar los procesos de descolonización en Asia y África durante la segunda mitad del siglo XX y el surgimiento del Tercer Mundo' },
        { code: 'HI08-OA20', eje: 'Historia', description: 'Analizar el proceso histórico de Chile en el siglo XX: del parlamentarismo a los gobiernos radicales, la UP, el régimen militar y la transición a la democracia' },
        { code: 'HI08-OA21', eje: 'Formacion ciudadana', description: 'Analizar las violaciones a los derechos humanos ocurridas en Chile y el mundo durante el siglo XX, valorando la memoria histórica y el nunca más como fundamento ético de la convivencia democrática' },
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
        { code: 'IN05-OA14', eje: 'Conciencia cultural', description: 'Reconocer y comparar aspectos culturales de países de habla inglesa (celebraciones, costumbres, geografía) con los propios, valorando la diversidad cultural' },
        { code: 'IN05-OA15', eje: 'Conciencia cultural', description: 'Comprender la importancia del inglés como idioma global de comunicación, ciencia y tecnología, y valorar el aprendizaje de la lengua extranjera para la vida futura' },
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
        { code: 'IN06-OA14', eje: 'Conciencia cultural', description: 'Analizar y comparar aspectos culturales de países angloparlantes (historia, tradiciones, arte, deportes) con Chile, desarrollando una actitud de respeto y curiosidad intercultural' },
        { code: 'IN06-OA15', eje: 'Conciencia cultural', description: 'Reflexionar sobre el rol del inglés en el mundo globalizado e identificar oportunidades de uso en distintos contextos académicos, laborales y personales' },
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
        { code: 'IN07-OA14', eje: 'Conciencia cultural', description: 'Analizar y comparar expresiones culturales y artísticas de países de habla inglesa (música, cine, literatura, arte) con la cultura chilena, reflexionando sobre la identidad propia y la diversidad' },
        { code: 'IN07-OA15', eje: 'Conciencia cultural', description: 'Analizar el impacto del inglés en la cultura juvenil, los medios digitales y la comunicación global, reflexionando sobre el uso responsable y crítico del idioma' },
        { code: 'IN07-OA16', eje: 'Conciencia cultural', description: 'Investigar y presentar aspectos de la cultura y la historia de países angloparlantes, reconociendo similitudes y diferencias con la realidad latinoamericana' },
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
        { code: 'IN08-OA14', eje: 'Conciencia cultural', description: 'Analizar críticamente aspectos culturales, históricos y sociales de países de habla inglesa, estableciendo comparaciones fundadas con Chile y América Latina' },
        { code: 'IN08-OA15', eje: 'Conciencia cultural', description: 'Reflexionar críticamente sobre la influencia del inglés en la globalización cultural y tecnológica, valorando el multilingüismo y la diversidad cultural como riqueza' },
        { code: 'IN08-OA16', eje: 'Conciencia cultural', description: 'Investigar y debatir en inglés sobre temas globales relevantes (medioambiente, diversidad, tecnología), usando evidencia y argumentos para sostener posiciones propias' },
    ],

    // ══════════════════════════════════════════════
    //  ORIENTACION 1° BASICO
    // ══════════════════════════════════════════════
    'OR01': [
        { code: 'OR01-OA01', eje: 'Crecimiento y Autoconocimiento', description: 'Reconocerse como persona única con características, gustos y habilidades propias' },
        { code: 'OR01-OA02', eje: 'Crecimiento y Autoconocimiento', description: 'Identificar y expresar sus emociones básicas en situaciones cotidianas' },
        { code: 'OR01-OA03', eje: 'Convivencia y Ciudadania', description: 'Relacionarse con respeto y empatía con sus compañeros y adultos del entorno' },
        { code: 'OR01-OA04', eje: 'Convivencia y Ciudadania', description: 'Reconocer y practicar normas básicas de convivencia en el hogar y la escuela' },
        { code: 'OR01-OA05', eje: 'Convivencia y Ciudadania', description: 'Participar en actividades grupales respetando turnos y escuchando a los demás' },
    ],

    // ══════════════════════════════════════════════
    //  ORIENTACION 2° BASICO
    // ══════════════════════════════════════════════
    'OR02': [
        { code: 'OR02-OA01', eje: 'Crecimiento y Autoconocimiento', description: 'Reconocer sus características personales, gustos e intereses que lo hacen único' },
        { code: 'OR02-OA02', eje: 'Crecimiento y Autoconocimiento', description: 'Identificar y regular sus emociones frente a situaciones cotidianas' },
        { code: 'OR02-OA03', eje: 'Convivencia y Ciudadania', description: 'Demostrar empatía y respeto ante las diferencias individuales de sus compañeros' },
        { code: 'OR02-OA04', eje: 'Convivencia y Ciudadania', description: 'Practicar normas de convivencia y resolver conflictos de manera pacífica y dialogada' },
        { code: 'OR02-OA05', eje: 'Convivencia y Ciudadania', description: 'Valorar el trabajo colaborativo y el aporte de cada integrante del grupo' },
    ],

    // ══════════════════════════════════════════════
    //  ORIENTACION 3° BASICO
    // ══════════════════════════════════════════════
    'OR03': [
        { code: 'OR03-OA01', eje: 'Crecimiento y Autoconocimiento', description: 'Reflexionar sobre sus fortalezas y áreas de mejora personal y académica' },
        { code: 'OR03-OA02', eje: 'Crecimiento y Autoconocimiento', description: 'Desarrollar estrategias sencillas para regular sus emociones frente a situaciones de dificultad' },
        { code: 'OR03-OA03', eje: 'Convivencia y Ciudadania', description: 'Establecer relaciones de amistad basadas en el respeto, la confianza y la comunicación' },
        { code: 'OR03-OA04', eje: 'Convivencia y Ciudadania', description: 'Reconocer y valorar la diversidad de personas, culturas y estilos de vida' },
        { code: 'OR03-OA05', eje: 'Convivencia y Ciudadania', description: 'Participar en decisiones del grupo y asumir compromisos y responsabilidades' },
    ],

    // ══════════════════════════════════════════════
    //  ORIENTACION 4° BASICO
    // ══════════════════════════════════════════════
    'OR04': [
        { code: 'OR04-OA01', eje: 'Crecimiento y Autoconocimiento', description: 'Identificar sus emociones, fortalezas y aspectos a desarrollar en diferentes contextos' },
        { code: 'OR04-OA02', eje: 'Crecimiento y Autoconocimiento', description: 'Aplicar estrategias de autorregulación emocional frente a situaciones de dificultad' },
        { code: 'OR04-OA03', eje: 'Convivencia y Ciudadania', description: 'Valorar la amistad y las relaciones interpersonales basadas en la confianza y el respeto mutuo' },
        { code: 'OR04-OA04', eje: 'Convivencia y Ciudadania', description: 'Analizar situaciones de conflicto y proponer soluciones pacíficas y democráticas' },
        { code: 'OR04-OA05', eje: 'Convivencia y Ciudadania', description: 'Reconocer derechos y deberes en la comunidad escolar y familiar' },
    ],

    // ══════════════════════════════════════════════
    //  ORIENTACION 5° BASICO
    // ══════════════════════════════════════════════
    'OR05': [
        { code: 'OR05-OA01', eje: 'Crecimiento y Autoconocimiento', description: 'Analizar sus características personales, emociones y cómo influyen en sus relaciones' },
        { code: 'OR05-OA02', eje: 'Crecimiento y Autoconocimiento', description: 'Desarrollar habilidades de comunicación efectiva: escucha activa, asertividad y empatía' },
        { code: 'OR05-OA03', eje: 'Convivencia y Ciudadania', description: 'Valorar la diversidad cultural y respetar las diferencias entre las personas' },
        { code: 'OR05-OA04', eje: 'Convivencia y Ciudadania', description: 'Promover relaciones de buen trato, rechazando toda forma de discriminación y violencia' },
        { code: 'OR05-OA05', eje: 'Convivencia y Ciudadania', description: 'Participar activamente en la vida de la comunidad escolar ejerciendo sus derechos y deberes' },
    ],

    // ══════════════════════════════════════════════
    //  ORIENTACION 6° BASICO
    // ══════════════════════════════════════════════
    'OR06': [
        { code: 'OR06-OA01', eje: 'Crecimiento y Autoconocimiento', description: 'Reflexionar sobre su identidad, valores personales y metas de desarrollo' },
        { code: 'OR06-OA02', eje: 'Crecimiento y Autoconocimiento', description: 'Reconocer factores que influyen en su bienestar emocional y en sus relaciones interpersonales' },
        { code: 'OR06-OA03', eje: 'Convivencia y Ciudadania', description: 'Analizar críticamente situaciones de discriminación o violencia y proponer acciones de prevención' },
        { code: 'OR06-OA04', eje: 'Convivencia y Ciudadania', description: 'Valorar la participación ciudadana y los mecanismos democráticos en distintas comunidades' },
        { code: 'OR06-OA05', eje: 'Convivencia y Ciudadania', description: 'Reflexionar sobre el impacto de sus decisiones en el entorno y en la convivencia' },
    ],

    // ══════════════════════════════════════════════
    //  ORIENTACION 7° BASICO
    // ══════════════════════════════════════════════
    'OR07': [
        { code: 'OR07-OA01', eje: 'Crecimiento y Autoconocimiento', description: 'Analizar su proceso de desarrollo personal reconociendo cambios físicos, emocionales y sociales de la adolescencia' },
        { code: 'OR07-OA02', eje: 'Crecimiento y Autoconocimiento', description: 'Desarrollar habilidades socioemocionales para enfrentar los desafíos de la adolescencia' },
        { code: 'OR07-OA03', eje: 'Convivencia y Ciudadania', description: 'Analizar y valorar el diálogo y la resolución pacífica de conflictos en la convivencia' },
        { code: 'OR07-OA04', eje: 'Convivencia y Ciudadania', description: 'Reconocer sus derechos y responsabilidades como ciudadano y miembro de distintas comunidades' },
        { code: 'OR07-OA05', eje: 'Proyecto de Vida', description: 'Reflexionar sobre sus intereses, valores y habilidades en relación con sus metas futuras' },
        { code: 'OR07-OA06', eje: 'Proyecto de Vida', description: 'Identificar factores que influyen en la toma de decisiones y establecer metas a corto plazo' },
    ],

    // ══════════════════════════════════════════════
    //  ORIENTACION 8° BASICO
    // ══════════════════════════════════════════════
    'OR08': [
        { code: 'OR08-OA01', eje: 'Crecimiento y Autoconocimiento', description: 'Reflexionar sobre su identidad personal, valores y sentido de vida en la adolescencia' },
        { code: 'OR08-OA02', eje: 'Crecimiento y Autoconocimiento', description: 'Desarrollar estrategias de autocuidado y bienestar emocional frente a los desafíos del entorno' },
        { code: 'OR08-OA03', eje: 'Convivencia y Ciudadania', description: 'Analizar críticamente situaciones de inequidad, discriminación y violencia, proponiendo acciones de cambio' },
        { code: 'OR08-OA04', eje: 'Convivencia y Ciudadania', description: 'Valorar la participación activa y responsable en la vida democrática de la comunidad' },
        { code: 'OR08-OA05', eje: 'Proyecto de Vida', description: 'Elaborar un proyecto de vida considerando sus intereses, habilidades, valores y el contexto social' },
        { code: 'OR08-OA06', eje: 'Proyecto de Vida', description: 'Analizar distintas opciones de desarrollo personal, académico y laboral de manera fundamentada' },
    ],

    // ══════════════════════════════════════════════
    //  RELIGION EVANGELICA 1° BASICO
    // ══════════════════════════════════════════════
    'RE01': [
        { code: 'RE01-OA01', eje: 'Biblia', description: 'Conocer relatos bíblicos sencillos sobre la creación y el cuidado de Dios por las personas y la naturaleza' },
        { code: 'RE01-OA02', eje: 'Fe y Vida', description: 'Reconocer a Dios como Padre creador que ama y cuida a las personas' },
        { code: 'RE01-OA03', eje: 'Fe y Vida', description: 'Expresar gratitud a Dios mediante la oración, el canto y acciones de cuidado del entorno' },
        { code: 'RE01-OA04', eje: 'Comunidad', description: 'Valorar la familia y la comunidad escolar como espacios de amor y convivencia' },
        { code: 'RE01-OA05', eje: 'Comunidad', description: 'Practicar valores como el amor, el respeto y la solidaridad en su vida cotidiana' },
    ],

    // ══════════════════════════════════════════════
    //  RELIGION EVANGELICA 2° BASICO
    // ══════════════════════════════════════════════
    'RE02': [
        { code: 'RE02-OA01', eje: 'Biblia', description: 'Identificar personajes y relatos bíblicos del Antiguo Testamento relacionados con la fe y la obediencia a Dios' },
        { code: 'RE02-OA02', eje: 'Fe y Vida', description: 'Reconocer a Jesucristo como Hijo de Dios y modelo de vida para los creyentes' },
        { code: 'RE02-OA03', eje: 'Fe y Vida', description: 'Expresar su fe mediante la oración personal y comunitaria' },
        { code: 'RE02-OA04', eje: 'Comunidad', description: 'Valorar la comunidad cristiana como espacio de apoyo y crecimiento en la fe' },
        { code: 'RE02-OA05', eje: 'Comunidad', description: 'Demostrar respeto y amor al prójimo en sus relaciones cotidianas' },
    ],

    // ══════════════════════════════════════════════
    //  RELIGION EVANGELICA 3° BASICO
    // ══════════════════════════════════════════════
    'RE03': [
        { code: 'RE03-OA01', eje: 'Biblia', description: 'Comprender relatos bíblicos del Nuevo Testamento sobre la vida y enseñanzas de Jesucristo' },
        { code: 'RE03-OA02', eje: 'Fe y Vida', description: 'Identificar valores del Evangelio como el amor, la justicia y la misericordia y su aplicación en la vida' },
        { code: 'RE03-OA03', eje: 'Fe y Vida', description: 'Practicar la oración y la lectura bíblica como medios de crecimiento espiritual' },
        { code: 'RE03-OA04', eje: 'Comunidad', description: 'Reconocer el rol de la familia y la iglesia como espacios de formación en la fe evangélica' },
        { code: 'RE03-OA05', eje: 'Comunidad', description: 'Demostrar actitudes de solidaridad y servicio al prójimo inspiradas en el Evangelio' },
    ],

    // ══════════════════════════════════════════════
    //  RELIGION EVANGELICA 4° BASICO
    // ══════════════════════════════════════════════
    'RE04': [
        { code: 'RE04-OA01', eje: 'Biblia', description: 'Analizar relatos y enseñanzas bíblicas identificando su mensaje central y su relevancia para la vida' },
        { code: 'RE04-OA02', eje: 'Fe y Vida', description: 'Comprender el significado de la fe cristiana y cómo orienta las decisiones y acciones cotidianas' },
        { code: 'RE04-OA03', eje: 'Fe y Vida', description: 'Reconocer la oración, el culto y el servicio como expresiones de la vida cristiana' },
        { code: 'RE04-OA04', eje: 'Comunidad', description: 'Valorar la comunidad de fe como espacio de aprendizaje, apoyo y servicio' },
        { code: 'RE04-OA05', eje: 'Comunidad', description: 'Aplicar principios bíblicos en sus relaciones interpersonales y en el cuidado del entorno' },
    ],

    // ══════════════════════════════════════════════
    //  RELIGION EVANGELICA 5° BASICO
    // ══════════════════════════════════════════════
    'RE05': [
        { code: 'RE05-OA01', eje: 'Biblia', description: 'Comprender el mensaje central de las Escrituras sobre la salvación y el llamado a seguir a Jesucristo' },
        { code: 'RE05-OA02', eje: 'Fe y Vida', description: 'Analizar la relación entre los valores del Evangelio y los desafíos éticos de la vida cotidiana' },
        { code: 'RE05-OA03', eje: 'Fe y Vida', description: 'Desarrollar una vida de oración y estudio bíblico como práctica espiritual personal' },
        { code: 'RE05-OA04', eje: 'Comunidad', description: 'Valorar el servicio a los demás como expresión concreta del amor cristiano' },
        { code: 'RE05-OA05', eje: 'Comunidad', description: 'Reconocer la diversidad dentro del protestantismo y el diálogo ecuménico como expresión de unidad' },
    ],

    // ══════════════════════════════════════════════
    //  RELIGION EVANGELICA 6° BASICO
    // ══════════════════════════════════════════════
    'RE06': [
        { code: 'RE06-OA01', eje: 'Biblia', description: 'Interpretar textos bíblicos relacionándolos con el contexto histórico y su mensaje para el mundo actual' },
        { code: 'RE06-OA02', eje: 'Fe y Vida', description: 'Analizar dilemas éticos desde una perspectiva cristiana fundamentada en los valores del Evangelio' },
        { code: 'RE06-OA03', eje: 'Fe y Vida', description: 'Reflexionar sobre su propia fe y su desarrollo espiritual en el contexto de la comunidad cristiana' },
        { code: 'RE06-OA04', eje: 'Comunidad', description: 'Valorar el aporte de la Iglesia Evangélica a la sociedad chilena en educación, salud y bien común' },
        { code: 'RE06-OA05', eje: 'Comunidad', description: 'Promover el respeto entre personas de distintas creencias y tradiciones religiosas' },
    ],

    // ══════════════════════════════════════════════
    //  RELIGION EVANGELICA 7° BASICO
    // ══════════════════════════════════════════════
    'RE07': [
        { code: 'RE07-OA01', eje: 'Biblia', description: 'Analizar el contexto histórico y teológico de los textos bíblicos y su relevancia para la vida contemporánea' },
        { code: 'RE07-OA02', eje: 'Fe y Vida', description: 'Reflexionar sobre la identidad cristiana y su relación con la identidad personal en la adolescencia' },
        { code: 'RE07-OA03', eje: 'Fe y Vida', description: 'Analizar decisiones y proyectos de vida a la luz de los valores del Evangelio' },
        { code: 'RE07-OA04', eje: 'Comunidad', description: 'Reconocer el compromiso social del cristiano frente a la injusticia, la pobreza y el cuidado de la creación' },
        { code: 'RE07-OA05', eje: 'Comunidad', description: 'Valorar el diálogo interreligioso y el respeto a la libertad de conciencia como principios democráticos' },
    ],

    // ══════════════════════════════════════════════
    //  RELIGION EVANGELICA 8° BASICO
    // ══════════════════════════════════════════════
    'RE08': [
        { code: 'RE08-OA01', eje: 'Biblia', description: 'Interpretar críticamente textos bíblicos aplicando su mensaje a situaciones actuales de la vida personal y social' },
        { code: 'RE08-OA02', eje: 'Fe y Vida', description: 'Fundamentar su fe cristiana frente a preguntas sobre el sentido de la vida, el sufrimiento y la esperanza' },
        { code: 'RE08-OA03', eje: 'Fe y Vida', description: 'Elaborar un proyecto de vida personal orientado por los valores del Evangelio' },
        { code: 'RE08-OA04', eje: 'Comunidad', description: 'Analizar el rol de la Iglesia Evangélica en la historia de Chile y su aporte actual a la sociedad' },
        { code: 'RE08-OA05', eje: 'Comunidad', description: 'Comprometerse con acciones concretas de servicio, justicia y cuidado del medio ambiente como expresión de fe' },
    ],

    // ══════════════════════════════════════════════
    //  RELIGION CATOLICA 1° BASICO
    // ══════════════════════════════════════════════
    'RC01': [
        { code: 'RC01-OA01', eje: 'Dios y la Creacion', description: 'Reconocer a Dios como creador del mundo y de las personas, que ama y cuida su creación' },
        { code: 'RC01-OA02', eje: 'Dios y la Creacion', description: 'Valorar la naturaleza como regalo de Dios y practicar su cuidado' },
        { code: 'RC01-OA03', eje: 'Jesucristo y el Evangelio', description: 'Conocer episodios sencillos de la vida de Jesús y su mensaje de amor' },
        { code: 'RC01-OA04', eje: 'La Iglesia y los Sacramentos', description: 'Reconocer la familia y la comunidad cristiana como espacios de amor y pertenencia' },
        { code: 'RC01-OA05', eje: 'La Iglesia y los Sacramentos', description: 'Expresar su relación con Dios mediante la oración, el canto y signos religiosos sencillos' },
    ],

    // ══════════════════════════════════════════════
    //  RELIGION CATOLICA 2° BASICO
    // ══════════════════════════════════════════════
    'RC02': [
        { code: 'RC02-OA01', eje: 'Dios y la Creacion', description: 'Reconocer a Dios Padre como origen de la vida y fuente del amor, a quien los seres humanos pueden conocer' },
        { code: 'RC02-OA02', eje: 'Jesucristo y el Evangelio', description: 'Conocer la historia de Jesús de Nazaret, su mensaje del Reino de Dios y los milagros como signos de amor' },
        { code: 'RC02-OA03', eje: 'Jesucristo y el Evangelio', description: 'Reconocer a María como madre de Jesús y modelo de fe para los cristianos' },
        { code: 'RC02-OA04', eje: 'La Iglesia y los Sacramentos', description: 'Conocer el Bautismo como sacramento de iniciación a la vida cristiana' },
        { code: 'RC02-OA05', eje: 'La Iglesia y los Sacramentos', description: 'Practicar la oración personal y comunitaria como diálogo con Dios' },
    ],

    // ══════════════════════════════════════════════
    //  RELIGION CATOLICA 3° BASICO
    // ══════════════════════════════════════════════
    'RC03': [
        { code: 'RC03-OA01', eje: 'Dios y la Creacion', description: 'Comprender la Biblia como Palabra de Dios y conocer relatos del Antiguo Testamento' },
        { code: 'RC03-OA02', eje: 'Jesucristo y el Evangelio', description: 'Profundizar en las enseñanzas de Jesús: las bienaventuranzas y el mandamiento del amor' },
        { code: 'RC03-OA03', eje: 'Jesucristo y el Evangelio', description: 'Conocer la Pascua de Jesús (muerte y resurrección) como centro de la fe cristiana' },
        { code: 'RC03-OA04', eje: 'La Iglesia y los Sacramentos', description: 'Reconocer la Eucaristía como memorial de la última cena de Jesús y sacramento de unidad' },
        { code: 'RC03-OA05', eje: 'La Iglesia y los Sacramentos', description: 'Valorar la comunidad parroquial como espacio de celebración, servicio y fraternidad' },
    ],

    // ══════════════════════════════════════════════
    //  RELIGION CATOLICA 4° BASICO
    // ══════════════════════════════════════════════
    'RC04': [
        { code: 'RC04-OA01', eje: 'Dios y la Creacion', description: 'Conocer la historia de salvación en el Antiguo Testamento: patriarcas, Moisés y los profetas' },
        { code: 'RC04-OA02', eje: 'Jesucristo y el Evangelio', description: 'Profundizar en las parábolas del Evangelio y su mensaje sobre el Reino de Dios' },
        { code: 'RC04-OA03', eje: 'Jesucristo y el Evangelio', description: 'Reconocer a Jesucristo como plenitud de la revelación de Dios' },
        { code: 'RC04-OA04', eje: 'La Iglesia y los Sacramentos', description: 'Conocer el sacramento de la Reconciliación como signo del perdón y la misericordia de Dios' },
        { code: 'RC04-OA05', eje: 'La Iglesia y los Sacramentos', description: 'Valorar el servicio al prójimo, especialmente a los más pobres, como expresión de la fe cristiana' },
    ],

    // ══════════════════════════════════════════════
    //  RELIGION CATOLICA 5° BASICO
    // ══════════════════════════════════════════════
    'RC05': [
        { code: 'RC05-OA01', eje: 'Dios y la Creacion', description: 'Comprender el significado de la Trinidad: Padre, Hijo y Espíritu Santo en la fe católica' },
        { code: 'RC05-OA02', eje: 'Jesucristo y el Evangelio', description: 'Analizar el mensaje de justicia, paz y fraternidad de Jesús y su vigencia en el mundo actual' },
        { code: 'RC05-OA03', eje: 'Jesucristo y el Evangelio', description: 'Conocer el Credo como expresión de la fe de la Iglesia Católica' },
        { code: 'RC05-OA04', eje: 'La Iglesia y los Sacramentos', description: 'Reconocer los siete sacramentos como signos de la presencia de Cristo en la vida de los creyentes' },
        { code: 'RC05-OA05', eje: 'La Iglesia y los Sacramentos', description: 'Valorar el aporte de la Iglesia Católica a la educación, la salud y el bien común en Chile' },
    ],

    // ══════════════════════════════════════════════
    //  RELIGION CATOLICA 6° BASICO
    // ══════════════════════════════════════════════
    'RC06': [
        { code: 'RC06-OA01', eje: 'Dios y la Creacion', description: 'Reflexionar sobre el ser humano como imagen de Dios, con dignidad, libertad y responsabilidad' },
        { code: 'RC06-OA02', eje: 'Jesucristo y el Evangelio', description: 'Analizar la doctrina social de la Iglesia: solidaridad, justicia y opción preferencial por los pobres' },
        { code: 'RC06-OA03', eje: 'Jesucristo y el Evangelio', description: 'Comprender la moral cristiana como respuesta a la llamada de Dios y camino de plena realización' },
        { code: 'RC06-OA04', eje: 'La Iglesia y los Sacramentos', description: 'Conocer la historia de la Iglesia Católica y su presencia en América Latina y Chile' },
        { code: 'RC06-OA05', eje: 'La Iglesia y los Sacramentos', description: 'Valorar la diversidad de expresiones religiosas y promover el diálogo interreligioso' },
    ],

    // ══════════════════════════════════════════════
    //  RELIGION CATOLICA 7° BASICO
    // ══════════════════════════════════════════════
    'RC07': [
        { code: 'RC07-OA01', eje: 'Dios y la Creacion', description: 'Analizar preguntas fundamentales sobre el sentido de la vida, el sufrimiento y la esperanza desde la fe cristiana' },
        { code: 'RC07-OA02', eje: 'Jesucristo y el Evangelio', description: 'Reflexionar sobre la ética cristiana y los valores del Evangelio frente a los desafíos de la adolescencia' },
        { code: 'RC07-OA03', eje: 'Jesucristo y el Evangelio', description: 'Comprender el mensaje de la Resurrección como fundamento de la esperanza cristiana' },
        { code: 'RC07-OA04', eje: 'La Iglesia y los Sacramentos', description: 'Reconocer el papel de los sacramentos de iniciación (Bautismo, Confirmación, Eucaristía) en la vida del creyente' },
        { code: 'RC07-OA05', eje: 'La Iglesia y los Sacramentos', description: 'Analizar el compromiso social cristiano frente a la injusticia, la pobreza y el cuidado del medio ambiente' },
    ],

    // ══════════════════════════════════════════════
    //  RELIGION CATOLICA 8° BASICO
    // ══════════════════════════════════════════════
    'RC08': [
        { code: 'RC08-OA01', eje: 'Dios y la Creacion', description: 'Reflexionar sobre la fe cristiana frente a corrientes del pensamiento contemporáneo y el ateísmo' },
        { code: 'RC08-OA02', eje: 'Jesucristo y el Evangelio', description: 'Elaborar un proyecto de vida personal inspirado en los valores del Evangelio y la enseñanza social de la Iglesia' },
        { code: 'RC08-OA03', eje: 'Jesucristo y el Evangelio', description: 'Analizar el diálogo fe-razón y la contribución del pensamiento cristiano a la cultura y la ciencia' },
        { code: 'RC08-OA04', eje: 'La Iglesia y los Sacramentos', description: 'Conocer el Concilio Vaticano II y la renovación de la Iglesia en su misión evangelizadora' },
        { code: 'RC08-OA05', eje: 'La Iglesia y los Sacramentos', description: 'Comprometerse con acciones de justicia, solidaridad y cuidado de la creación como respuesta a la fe' },
    ],

    // ══════════════════════════════════════════════
    //  EDUCACION FISICA Y SALUD 1° BASICO
    // ══════════════════════════════════════════════
    'EF01': [
        { code: 'EF01-OA01', eje: 'Habilidades motrices', description: 'Demostrar habilidades motrices básicas de locomoción (caminar, correr, saltar, trepar, deslizarse) y de manipulación (lanzar, cachar, golpear, patear) en juegos y actividades físicas' },
        { code: 'EF01-OA02', eje: 'Habilidades motrices', description: 'Demostrar habilidades de equilibrio y coordinación en juegos y actividades físicas' },
        { code: 'EF01-OA03', eje: 'Vida activa y saludable', description: 'Participar en actividades físicas de intensidad moderada a vigorosa, reconociendo sus beneficios para la salud' },
        { code: 'EF01-OA04', eje: 'Vida activa y saludable', description: 'Reconocer la importancia del aseo personal, la postura y el descanso para mantener la salud' },
        { code: 'EF01-OA05', eje: 'Vida activa y saludable', description: 'Identificar alimentos saludables y su importancia para el crecimiento y la actividad física' },
        { code: 'EF01-OA06', eje: 'Juego limpio y liderazgo', description: 'Participar en juegos y actividades grupales mostrando respeto por los compañeros, los turnos y las reglas' },
        { code: 'EF01-OA07', eje: 'Juego limpio y liderazgo', description: 'Demostrar actitudes de colaboración, honestidad y espíritu de superación en juegos y actividades físicas' },
        { code: 'EF01-OA08', eje: 'Seguridad y primeros auxilios', description: 'Identificar situaciones de riesgo en la práctica de actividades físicas y aplicar medidas básicas de seguridad' },
        { code: 'EF01-OA09', eje: 'Juego limpio y liderazgo', description: 'Reconocer y valorar la diversidad de capacidades físicas entre los compañeros, respetando las diferencias individuales' },
        { code: 'EF01-OA10', eje: 'Habilidades motrices', description: 'Explorar y descubrir las posibilidades de movimiento de su propio cuerpo en diferentes planos y direcciones' },
        { code: 'EF01-OA11', eje: 'Vida activa y saludable', description: 'Demostrar conocimiento de las partes del cuerpo y su función en el movimiento' },
    ],

    // ══════════════════════════════════════════════
    //  EDUCACION FISICA Y SALUD 2° BASICO
    // ══════════════════════════════════════════════
    'EF02': [
        { code: 'EF02-OA01', eje: 'Habilidades motrices', description: 'Demostrar habilidades motrices básicas (locomoción, estabilidad y manipulación) con mayor control y coordinación en juegos y actividades físicas variadas' },
        { code: 'EF02-OA02', eje: 'Habilidades motrices', description: 'Combinar habilidades motrices básicas en secuencias de movimiento con ritmo y fluidez' },
        { code: 'EF02-OA03', eje: 'Vida activa y saludable', description: 'Participar en actividades físicas de intensidad moderada a vigorosa, reconociendo los cambios que se producen en el cuerpo durante el ejercicio' },
        { code: 'EF02-OA04', eje: 'Vida activa y saludable', description: 'Reconocer la importancia de la actividad física regular, la alimentación equilibrada y el descanso para la salud' },
        { code: 'EF02-OA05', eje: 'Vida activa y saludable', description: 'Distinguir alimentos saludables de no saludables y comprender la importancia de una dieta equilibrada para la práctica de actividad física' },
        { code: 'EF02-OA06', eje: 'Juego limpio y liderazgo', description: 'Participar en juegos y actividades grupales respetando las reglas, los compañeros y el espacio de juego' },
        { code: 'EF02-OA07', eje: 'Juego limpio y liderazgo', description: 'Demostrar conductas de juego limpio: honestidad, respeto al adversario y aceptación de resultados' },
        { code: 'EF02-OA08', eje: 'Seguridad y primeros auxilios', description: 'Aplicar medidas de seguridad básicas antes, durante y después de la práctica de actividad física' },
        { code: 'EF02-OA09', eje: 'Juego limpio y liderazgo', description: 'Reconocer y apreciar las capacidades de todos los compañeros, fomentando la inclusión en los juegos y actividades' },
        { code: 'EF02-OA10', eje: 'Habilidades motrices', description: 'Explorar y practicar movimientos rítmicos y expresivos en actividades de expresión corporal' },
        { code: 'EF02-OA11', eje: 'Vida activa y saludable', description: 'Mantener una postura corporal adecuada en diferentes posiciones y durante la práctica de actividades físicas' },
    ],

    // ══════════════════════════════════════════════
    //  EDUCACION FISICA Y SALUD 3° BASICO
    // ══════════════════════════════════════════════
    'EF03': [
        { code: 'EF03-OA01', eje: 'Habilidades motrices', description: 'Demostrar habilidades motrices especializadas (lanzar, cachar, golpear, dribling) en juegos deportivos y actividades físicas, con énfasis en la precisión y el control' },
        { code: 'EF03-OA02', eje: 'Habilidades motrices', description: 'Combinar habilidades motrices en situaciones de juego predeportivo con mayor complejidad' },
        { code: 'EF03-OA03', eje: 'Vida activa y saludable', description: 'Participar en actividades físicas de intensidad moderada a vigorosa, identificando la frecuencia cardíaca como indicador de esfuerzo' },
        { code: 'EF03-OA04', eje: 'Vida activa y saludable', description: 'Reconocer la importancia de la actividad física para el bienestar físico y mental, y planificar momentos de actividad en la rutina diaria' },
        { code: 'EF03-OA05', eje: 'Vida activa y saludable', description: 'Comprender la importancia de la hidratación antes, durante y después de la actividad física' },
        { code: 'EF03-OA06', eje: 'Juego limpio y liderazgo', description: 'Participar activamente en juegos y actividades grupales asumiendo distintos roles (jugador, árbitro, organizador)' },
        { code: 'EF03-OA07', eje: 'Juego limpio y liderazgo', description: 'Demostrar responsabilidad y compromiso con el grupo en la realización de actividades físicas colectivas' },
        { code: 'EF03-OA08', eje: 'Seguridad y primeros auxilios', description: 'Aplicar procedimientos de calentamiento y enfriamiento en las sesiones de actividad física' },
        { code: 'EF03-OA09', eje: 'Juego limpio y liderazgo', description: 'Proponer y acordar reglas para la práctica de juegos en el contexto escolar, resolviendo conflictos de manera pacífica' },
        { code: 'EF03-OA10', eje: 'Habilidades motrices', description: 'Participar en actividades de expresión corporal y danza, coordinando movimientos con ritmo y música' },
        { code: 'EF03-OA11', eje: 'Vida activa y saludable', description: 'Reconocer las capacidades físicas básicas (resistencia, fuerza, flexibilidad y velocidad) e identificar actividades que las desarrollan' },
    ],

    // ══════════════════════════════════════════════
    //  EDUCACION FISICA Y SALUD 4° BASICO
    // ══════════════════════════════════════════════
    'EF04': [
        { code: 'EF04-OA01', eje: 'Habilidades motrices', description: 'Demostrar habilidades motrices especializadas en juegos predeportivos y deportes básicos (fútbol, básquetbol, voleibol u otros), aplicando técnicas fundamentales' },
        { code: 'EF04-OA02', eje: 'Habilidades motrices', description: 'Combinar habilidades motrices en situaciones de juego con oposición, tomando decisiones tácticas sencillas' },
        { code: 'EF04-OA03', eje: 'Vida activa y saludable', description: 'Participar regularmente en actividades físicas de intensidad moderada a vigorosa, valorando sus efectos en la salud' },
        { code: 'EF04-OA04', eje: 'Vida activa y saludable', description: 'Describir los efectos que produce la actividad física en el organismo: aumento de la frecuencia cardíaca y respiratoria, sudoración' },
        { code: 'EF04-OA05', eje: 'Vida activa y saludable', description: 'Comprender la importancia de la actividad física regular, la alimentación saludable y el descanso para la calidad de vida' },
        { code: 'EF04-OA06', eje: 'Juego limpio y liderazgo', description: 'Colaborar en la organización y práctica de juegos y actividades deportivas, asumiendo distintos roles con responsabilidad' },
        { code: 'EF04-OA07', eje: 'Juego limpio y liderazgo', description: 'Mostrar actitudes de respeto, tolerancia e inclusión en la práctica de actividades físicas y deportivas' },
        { code: 'EF04-OA08', eje: 'Seguridad y primeros auxilios', description: 'Aplicar medidas de seguridad y primeros auxilios básicos en la práctica de actividades físicas' },
        { code: 'EF04-OA09', eje: 'Juego limpio y liderazgo', description: 'Asumir el liderazgo en situaciones de juego y actividad física, promoviendo la participación y el bienestar del grupo' },
        { code: 'EF04-OA10', eje: 'Habilidades motrices', description: 'Realizar actividades de expresión corporal, danza y juegos rítmicos con coordinación y creatividad' },
        { code: 'EF04-OA11', eje: 'Vida activa y saludable', description: 'Evaluar su condición física mediante pruebas sencillas y establecer metas personales de mejora' },
    ],

    // ══════════════════════════════════════════════
    //  EDUCACION FISICA Y SALUD 5° BASICO
    // ══════════════════════════════════════════════
    'EF05': [
        { code: 'EF05-OA01', eje: 'Habilidades motrices', description: 'Demostrar habilidades motrices en deportes y actividades físicas, aplicando técnicas y tácticas básicas en situaciones de juego real' },
        { code: 'EF05-OA02', eje: 'Habilidades motrices', description: 'Aplicar principios tácticos ofensivos y defensivos elementales en juegos deportivos' },
        { code: 'EF05-OA03', eje: 'Vida activa y saludable', description: 'Practicar actividad física de forma regular, reconociendo los beneficios a corto y largo plazo para la salud física y mental' },
        { code: 'EF05-OA04', eje: 'Vida activa y saludable', description: 'Analizar y evaluar sus hábitos de alimentación, actividad física y descanso, proponiendo mejoras' },
        { code: 'EF05-OA05', eje: 'Vida activa y saludable', description: 'Reconocer los efectos del sedentarismo y las enfermedades asociadas, valorando la actividad física como prevención' },
        { code: 'EF05-OA06', eje: 'Juego limpio y liderazgo', description: 'Organizar y arbitrar juegos y actividades deportivas, aplicando las reglas con criterio y justicia' },
        { code: 'EF05-OA07', eje: 'Juego limpio y liderazgo', description: 'Demostrar valores de juego limpio, respeto al rival y aceptación de la derrota en competencias deportivas' },
        { code: 'EF05-OA08', eje: 'Seguridad y primeros auxilios', description: 'Aplicar procedimientos de calentamiento específico, enfriamiento y técnicas básicas de primeros auxilios' },
        { code: 'EF05-OA09', eje: 'Juego limpio y liderazgo', description: 'Proponer y desarrollar estrategias de juego en equipo, valorando el aporte de cada integrante' },
        { code: 'EF05-OA10', eje: 'Habilidades motrices', description: 'Participar en actividades de danza, expresión corporal y juegos cooperativos, integrando habilidades motrices y sociales' },
        { code: 'EF05-OA11', eje: 'Vida activa y saludable', description: 'Evaluar su condición física (resistencia, fuerza, flexibilidad y velocidad) e implementar un plan básico de mejora' },
    ],

    // ══════════════════════════════════════════════
    //  EDUCACION FISICA Y SALUD 6° BASICO
    // ══════════════════════════════════════════════
    'EF06': [
        { code: 'EF06-OA01', eje: 'Habilidades motrices', description: 'Aplicar habilidades motrices especializadas en deportes individuales y colectivos con mayor nivel de complejidad técnica y táctica' },
        { code: 'EF06-OA02', eje: 'Habilidades motrices', description: 'Desarrollar y aplicar estrategias tácticas en situaciones de juego reducido y real' },
        { code: 'EF06-OA03', eje: 'Vida activa y saludable', description: 'Diseñar y ejecutar un plan personal de actividad física semanal considerando intensidad, frecuencia y duración' },
        { code: 'EF06-OA04', eje: 'Vida activa y saludable', description: 'Analizar los cambios corporales propios de la pubertad y su relación con la actividad física y la salud' },
        { code: 'EF06-OA05', eje: 'Vida activa y saludable', description: 'Comprender el concepto de condición física saludable y sus componentes: resistencia cardiovascular, fuerza muscular, flexibilidad y composición corporal' },
        { code: 'EF06-OA06', eje: 'Juego limpio y liderazgo', description: 'Liderar equipos en la práctica de actividades físicas y deportivas, promoviendo la inclusión y el respeto entre pares' },
        { code: 'EF06-OA07', eje: 'Juego limpio y liderazgo', description: 'Demostrar conductas éticas y valores de juego limpio en competencias y actividades deportivas formales' },
        { code: 'EF06-OA08', eje: 'Seguridad y primeros auxilios', description: 'Aplicar protocolos de seguridad, calentamiento específico y primeros auxilios básicos en la práctica deportiva' },
        { code: 'EF06-OA09', eje: 'Juego limpio y liderazgo', description: 'Resolver conflictos de manera autónoma y pacífica durante la práctica de actividades físicas y deportivas' },
        { code: 'EF06-OA10', eje: 'Habilidades motrices', description: 'Participar en actividades de danza folklórica nacional, reconociendo su valor cultural' },
        { code: 'EF06-OA11', eje: 'Vida activa y saludable', description: 'Evaluar su condición física mediante baterías de pruebas estandarizadas y proponer metas de mejora personal' },
    ],

    // ══════════════════════════════════════════════
    //  EDUCACION FISICA Y SALUD 7° BASICO
    // ══════════════════════════════════════════════
    'EF07': [
        { code: 'EF07-OA01', eje: 'Habilidades motrices', description: 'Aplicar y perfeccionar habilidades técnicas y tácticas en deportes individuales y colectivos, participando en competencias formales internas' },
        { code: 'EF07-OA02', eje: 'Habilidades motrices', description: 'Analizar y evaluar el propio desempeño técnico-táctico en deportes y actividades físicas, identificando fortalezas y aspectos a mejorar' },
        { code: 'EF07-OA03', eje: 'Vida activa y saludable', description: 'Diseñar, ejecutar y evaluar un plan de entrenamiento personal de 4 semanas que incluya los componentes de la condición física saludable' },
        { code: 'EF07-OA04', eje: 'Vida activa y saludable', description: 'Analizar la influencia de los medios de comunicación y las redes sociales en los hábitos de actividad física y alimentación de los adolescentes' },
        { code: 'EF07-OA05', eje: 'Vida activa y saludable', description: 'Comprender los principios del entrenamiento deportivo (especificidad, sobrecarga, progresión y recuperación) y aplicarlos en actividades físicas' },
        { code: 'EF07-OA06', eje: 'Juego limpio y liderazgo', description: 'Organizar y dirigir eventos deportivos escolares, asumiendo roles de liderazgo con responsabilidad y criterio' },
        { code: 'EF07-OA07', eje: 'Juego limpio y liderazgo', description: 'Demostrar respeto por la diversidad cultural en prácticas deportivas y de actividad física' },
        { code: 'EF07-OA08', eje: 'Seguridad y primeros auxilios', description: 'Aplicar técnicas de primeros auxilios en situaciones de emergencia durante la práctica deportiva' },
    ],

    // ══════════════════════════════════════════════
    //  EDUCACION FISICA Y SALUD 8° BASICO
    // ══════════════════════════════════════════════
    'EF08': [
        { code: 'EF08-OA01', eje: 'Habilidades motrices', description: 'Demostrar un nivel de competencia técnica y táctica en al menos dos deportes o actividades físicas, participando en instancias competitivas formales' },
        { code: 'EF08-OA02', eje: 'Habilidades motrices', description: 'Analizar el desempeño propio y del equipo en situaciones de juego real, proponiendoestrategias de mejora' },
        { code: 'EF08-OA03', eje: 'Vida activa y saludable', description: 'Diseñar y ejecutar un plan de actividad física personal de largo plazo, integrando los principios del entrenamiento y los componentes de la condición física saludable' },
        { code: 'EF08-OA04', eje: 'Vida activa y saludable', description: 'Analizar críticamente factores personales, sociales y ambientales que facilitan u obstaculizan la práctica de actividad física regular en la adolescencia' },
        { code: 'EF08-OA05', eje: 'Vida activa y saludable', description: 'Comprender y valorar la práctica de actividad física como un estilo de vida saludable que previene enfermedades crónicas no transmisibles' },
        { code: 'EF08-OA06', eje: 'Juego limpio y liderazgo', description: 'Liderar con autonomía la organización de eventos deportivos y actividades físicas escolares' },
        { code: 'EF08-OA07', eje: 'Juego limpio y liderazgo', description: 'Reflexionar sobre el deporte como fenómeno social y cultural, reconociendo su impacto en la sociedad contemporánea' },
        { code: 'EF08-OA08', eje: 'Seguridad y primeros auxilios', description: 'Aplicar con autonomía protocolos de seguridad y primeros auxilios en la práctica de actividades físicas y deportivas' },
    ],

    // ══════════════════════════════════════════════
    //  MUSICA 1° BASICO
    // ══════════════════════════════════════════════
    'MU01': [
        { code: 'MU01-OA01', eje: 'Escuchar y apreciar', description: 'Escuchar y describir cualidades del sonido (altura, duración, timbre e intensidad) en piezas musicales de distintos géneros y estilos, incluyendo la música de Chile' },
        { code: 'MU01-OA02', eje: 'Escuchar y apreciar', description: 'Identificar instrumentos musicales de las familias de viento, cuerda y percusión al escucharlos en distintas obras musicales' },
        { code: 'MU01-OA03', eje: 'Interpretar y crear', description: 'Cantar canciones del repertorio infantil y de la tradición oral chilena, con afinación y expresión adecuadas' },
        { code: 'MU01-OA04', eje: 'Interpretar y crear', description: 'Ejecutar ritmos sencillos con instrumentos de percusión de la sala y con el cuerpo (palmas, pies), manteniendo el pulso y siguiendo indicaciones del profesor' },
        { code: 'MU01-OA05', eje: 'Interpretar y crear', description: 'Improvisar sonidos, ritmos y melodías sencillas, usando la voz, el cuerpo e instrumentos, para acompañar textos, imágenes y situaciones' },
        { code: 'MU01-OA06', eje: 'Reflexionar y contextualizar', description: 'Expresar mediante el movimiento, el dibujo u otras formas las emociones y sensaciones que le produce la música escuchada' },
        { code: 'MU01-OA07', eje: 'Reflexionar y contextualizar', description: 'Reconocer y valorar manifestaciones musicales de la tradición oral chilena (rondas, canciones de cuna, villancicos) como parte de la identidad cultural nacional' },
    ],

    // ══════════════════════════════════════════════
    //  MUSICA 2° BASICO
    // ══════════════════════════════════════════════
    'MU02': [
        { code: 'MU02-OA01', eje: 'Escuchar y apreciar', description: 'Escuchar con atención piezas musicales de distintos géneros y culturas, identificando elementos musicales como el pulso, el ritmo y la melodía' },
        { code: 'MU02-OA02', eje: 'Escuchar y apreciar', description: 'Reconocer y describir el uso de los elementos musicales en obras del patrimonio musical chileno e iberoamericano' },
        { code: 'MU02-OA03', eje: 'Interpretar y crear', description: 'Cantar canciones del repertorio escolar, folclórico y popular, con atención a la afinación, la expresión y la dinámica' },
        { code: 'MU02-OA04', eje: 'Interpretar y crear', description: 'Ejecutar patrones rítmicos con instrumentos de percusión y con el cuerpo, manteniendo el tempo y la coordinación con el grupo' },
        { code: 'MU02-OA05', eje: 'Interpretar y crear', description: 'Crear e improvisar acompañamientos rítmicos y melódicos para canciones y poemas, usando instrumentos y materiales de la sala' },
        { code: 'MU02-OA06', eje: 'Reflexionar y contextualizar', description: 'Utilizar un vocabulario básico para describir y comentar la música escuchada y las propias producciones musicales' },
        { code: 'MU02-OA07', eje: 'Reflexionar y contextualizar', description: 'Reconocer y valorar la música folclórica de diferentes regiones de Chile, identificando características propias de cada zona' },
    ],

    // ══════════════════════════════════════════════
    //  MUSICA 3° BASICO
    // ══════════════════════════════════════════════
    'MU03': [
        { code: 'MU03-OA01', eje: 'Escuchar y apreciar', description: 'Escuchar y analizar obras musicales de distintos géneros, estilos y culturas, identificando elementos de la forma musical (introducción, estrofa, coro, coda)' },
        { code: 'MU03-OA02', eje: 'Escuchar y apreciar', description: 'Identificar y describir el uso de los elementos del lenguaje musical (melodía, ritmo, armonía, textura, timbre, dinámica y tempo) en obras escuchadas' },
        { code: 'MU03-OA03', eje: 'Interpretar y crear', description: 'Cantar canciones en dos voces o con canon, manteniendo la afinación, la expresión y la coordinación con el grupo' },
        { code: 'MU03-OA04', eje: 'Interpretar y crear', description: 'Ejecutar ritmos con mayor complejidad usando instrumentos de percusión, siguiendo la partitura rítmica básica y el director' },
        { code: 'MU03-OA05', eje: 'Interpretar y crear', description: 'Componer piezas musicales breves usando los elementos del lenguaje musical aprendidos, con recursos del entorno y digitales' },
        { code: 'MU03-OA06', eje: 'Reflexionar y contextualizar', description: 'Compartir y comentar las propias experiencias musicales usando un vocabulario musical pertinente y con respeto hacia las producciones de los compañeros' },
        { code: 'MU03-OA07', eje: 'Reflexionar y contextualizar', description: 'Reconocer y valorar géneros y estilos de la música popular chilena e iberoamericana, identificando sus contextos culturales e históricos' },
    ],

    // ══════════════════════════════════════════════
    //  MUSICA 4° BASICO
    // ══════════════════════════════════════════════
    'MU04': [
        { code: 'MU04-OA01', eje: 'Escuchar y apreciar', description: 'Escuchar y analizar obras del repertorio musical occidental (música barroca, clásica, romántica) identificando características de cada período' },
        { code: 'MU04-OA02', eje: 'Escuchar y apreciar', description: 'Reconocer y describir el uso de los elementos del lenguaje musical en obras de distintos períodos de la historia de la música, comparando estilos y géneros' },
        { code: 'MU04-OA03', eje: 'Interpretar y crear', description: 'Interpretar piezas vocales e instrumentales sencillas, solo y en grupo, con expresión musical adecuada al estilo de la obra' },
        { code: 'MU04-OA04', eje: 'Interpretar y crear', description: 'Leer y ejecutar ritmos escritos en notación musical básica (redonda, blanca, negra, corchea) en instrumentos de percusión' },
        { code: 'MU04-OA05', eje: 'Interpretar y crear', description: 'Crear y presentar composiciones musicales originales, usando los elementos del lenguaje musical y recursos tecnológicos básicos' },
        { code: 'MU04-OA06', eje: 'Reflexionar y contextualizar', description: 'Reflexionar sobre el papel de la música en distintos contextos de la vida cotidiana (ceremonias, publicidad, películas, fiestas) y en la propia experiencia personal' },
        { code: 'MU04-OA07', eje: 'Reflexionar y contextualizar', description: 'Identificar y valorar el aporte de músicos y compositores chilenos al patrimonio musical nacional, reconociendo sus obras más representativas' },
    ],

    // ══════════════════════════════════════════════
    //  MUSICA 5° BASICO
    // ══════════════════════════════════════════════
    'MU05': [
        { code: 'MU05-OA01', eje: 'Escuchar y apreciar', description: 'Escuchar y analizar obras de distintos géneros y culturas musicales del mundo, comparando sus características y contextos culturales' },
        { code: 'MU05-OA02', eje: 'Escuchar y apreciar', description: 'Analizar críticamente el rol de la música en los medios de comunicación, el cine y la publicidad, identificando recursos del lenguaje musical utilizados' },
        { code: 'MU05-OA03', eje: 'Interpretar y crear', description: 'Interpretar piezas musicales vocales e instrumentales con mayor complejidad técnica y expresiva, en conjunto con sus pares' },
        { code: 'MU05-OA04', eje: 'Interpretar y crear', description: 'Leer y ejecutar melodías sencillas en notación musical convencional, usando un instrumento melódico o la voz' },
        { code: 'MU05-OA05', eje: 'Interpretar y crear', description: 'Componer piezas musicales originales integrando elementos de la armonía básica (acorde tónica y dominante) y estructuras formales' },
        { code: 'MU05-OA06', eje: 'Reflexionar y contextualizar', description: 'Investigar y presentar aspectos de la vida y obra de un músico o compositor chileno o latinoamericano de relevancia histórica o contemporánea' },
        { code: 'MU05-OA07', eje: 'Reflexionar y contextualizar', description: 'Valorar y respetar las distintas expresiones musicales de las culturas originarias de Chile y América Latina, reconociendo su vigencia en la actualidad' },
    ],

    // ══════════════════════════════════════════════
    //  MUSICA 6° BASICO
    // ══════════════════════════════════════════════
    'MU06': [
        { code: 'MU06-OA01', eje: 'Escuchar y apreciar', description: 'Escuchar y analizar obras representativas de distintos géneros y movimientos musicales del siglo XX y XXI, identificando características y contextos' },
        { code: 'MU06-OA02', eje: 'Escuchar y apreciar', description: 'Analizar cómo los elementos del lenguaje musical (melodía, ritmo, armonía, textura, timbre, dinámica y forma) se utilizan para crear efectos expresivos en distintas obras' },
        { code: 'MU06-OA03', eje: 'Interpretar y crear', description: 'Interpretar piezas musicales en conjunto, asumiendo distintos roles y responsabilidades dentro del ensamble' },
        { code: 'MU06-OA04', eje: 'Interpretar y crear', description: 'Leer y ejecutar fragmentos musicales en notación convencional con mayor fluidez y precisión rítmica y melódica' },
        { code: 'MU06-OA05', eje: 'Interpretar y crear', description: 'Crear y presentar una producción musical original para una audiencia, integrando elementos compositivos y tecnología musical básica' },
        { code: 'MU06-OA06', eje: 'Reflexionar y contextualizar', description: 'Investigar y reflexionar sobre fenómenos musicales contemporáneos (géneros urbanos, fusiones, música electrónica) y su impacto social y cultural' },
        { code: 'MU06-OA07', eje: 'Reflexionar y contextualizar', description: 'Valorar el patrimonio musical chileno en su diversidad de géneros y regiones, reconociendo su aporte a la identidad cultural nacional' },
    ],

    // ══════════════════════════════════════════════
    //  MUSICA 7° BASICO
    // ══════════════════════════════════════════════
    'MU07': [
        { code: 'MU07-OA01', eje: 'Escuchar y apreciar', description: 'Escuchar y analizar obras musicales de distintos géneros, períodos y culturas, explicando sus características técnicas y su contexto histórico-cultural' },
        { code: 'MU07-OA02', eje: 'Escuchar y apreciar', description: 'Analizar con pensamiento crítico el uso de la música en los medios de comunicación, las industrias culturales y la vida cotidiana' },
        { code: 'MU07-OA03', eje: 'Interpretar y crear', description: 'Interpretar piezas musicales en conjunto con mayor nivel técnico y expresivo, demostrando autonomía y sensibilidad artística' },
        { code: 'MU07-OA04', eje: 'Interpretar y crear', description: 'Leer y ejecutar partituras con mayor complejidad rítmica y melódica, utilizando convenciones de la notación musical estándar' },
        { code: 'MU07-OA05', eje: 'Interpretar y crear', description: 'Componer y arreglar piezas musicales originales, usando recursos analógicos y digitales, para distintos contextos y audiencias' },
        { code: 'MU07-OA06', eje: 'Reflexionar y contextualizar', description: 'Investigar y presentar el legado de músicos y movimientos musicales chilenos e iberoamericanos, valorando su aporte a la cultura universal' },
        { code: 'MU07-OA07', eje: 'Reflexionar y contextualizar', description: 'Reflexionar críticamente sobre las propias producciones musicales y las de sus compañeros, usando criterios estéticos fundamentados' },
    ],

    // ══════════════════════════════════════════════
    //  MUSICA 8° BASICO
    // ══════════════════════════════════════════════
    'MU08': [
        { code: 'MU08-OA01', eje: 'Escuchar y apreciar', description: 'Escuchar, analizar y comparar obras musicales representativas de distintas épocas, géneros y culturas, fundamentando juicios estéticos propios' },
        { code: 'MU08-OA02', eje: 'Escuchar y apreciar', description: 'Analizar y evaluar críticamente el papel de la música en la identidad cultural, la globalización y los fenómenos sociales contemporáneos' },
        { code: 'MU08-OA03', eje: 'Interpretar y crear', description: 'Interpretar un repertorio musical variado y de mayor complejidad técnica, demostrando control expresivo y autonomía artística' },
        { code: 'MU08-OA04', eje: 'Interpretar y crear', description: 'Leer y ejecutar partituras con fluidez, integrando aspectos técnicos y expresivos de la notación musical' },
        { code: 'MU08-OA05', eje: 'Interpretar y crear', description: 'Crear proyectos musicales originales que integren composición, interpretación y uso de tecnología musical, presentándolos a una audiencia' },
        { code: 'MU08-OA06', eje: 'Reflexionar y contextualizar', description: 'Investigar y reflexionar sobre la historia de la música chilena y su inserción en el contexto latinoamericano y mundial' },
        { code: 'MU08-OA07', eje: 'Reflexionar y contextualizar', description: 'Evaluar de manera fundamentada producciones musicales propias y ajenas, aplicando criterios estéticos, técnicos y culturales' },
    ],

    // ══════════════════════════════════════════════
    //  ARTES VISUALES 1° BASICO
    // ══════════════════════════════════════════════
    'AV01': [
        { code: 'AV01-OA01', eje: 'Expresion creativa', description: 'Crear trabajos de arte usando una variedad de herramientas, soportes y técnicas bidimensionales y tridimensionales (dibujo, pintura, modelado, collage), para expresar ideas y experiencias' },
        { code: 'AV01-OA02', eje: 'Expresion creativa', description: 'Experimentar con distintos materiales y texturas para descubrir posibilidades expresivas en la creación plástica' },
        { code: 'AV01-OA03', eje: 'Apreciar y responder', description: 'Observar y describir obras de arte y objetos del entorno, usando vocabulario visual básico (línea, forma, color, textura)' },
        { code: 'AV01-OA04', eje: 'Apreciar y responder', description: 'Identificar elementos del lenguaje visual (línea, forma, color, textura) en obras de arte y en el entorno natural y cultural' },
        { code: 'AV01-OA05', eje: 'Apreciar y responder', description: 'Compartir y comentar sus propias creaciones y las de sus compañeros, expresando sensaciones, emociones e ideas con respeto' },
        { code: 'AV01-OA06', eje: 'Contextualizar', description: 'Reconocer manifestaciones artísticas presentes en el entorno local (murales, artesanía, monumentos) y en su patrimonio cultural' },
        { code: 'AV01-OA07', eje: 'Contextualizar', description: 'Conocer y apreciar manifestaciones del arte y la artesanía de los pueblos originarios de Chile' },
    ],

    // ══════════════════════════════════════════════
    //  ARTES VISUALES 2° BASICO
    // ══════════════════════════════════════════════
    'AV02': [
        { code: 'AV02-OA01', eje: 'Expresion creativa', description: 'Crear trabajos de arte usando diversas técnicas bidimensionales y tridimensionales, integrando intencionalmente elementos del lenguaje visual para expresar ideas y sentimientos' },
        { code: 'AV02-OA02', eje: 'Expresion creativa', description: 'Explorar las posibilidades expresivas del color (mezclas, armonías y contrastes) en trabajos de arte propios' },
        { code: 'AV02-OA03', eje: 'Apreciar y responder', description: 'Observar, describir e interpretar obras de arte de distintos artistas nacionales e internacionales, expresando impresiones personales' },
        { code: 'AV02-OA04', eje: 'Apreciar y responder', description: 'Identificar y describir el uso de los elementos del lenguaje visual (línea, forma, color, textura, espacio) en obras de arte y en el entorno' },
        { code: 'AV02-OA05', eje: 'Apreciar y responder', description: 'Compartir y fundamentar sus apreciaciones sobre las propias obras y las de sus compañeros, usando vocabulario visual adecuado' },
        { code: 'AV02-OA06', eje: 'Contextualizar', description: 'Reconocer manifestaciones artísticas de distintas culturas y épocas, valorando la diversidad de expresiones humanas' },
        { code: 'AV02-OA07', eje: 'Contextualizar', description: 'Conocer la vida y obra de artistas chilenos representativos, valorando su aporte a la cultura nacional' },
    ],

    // ══════════════════════════════════════════════
    //  ARTES VISUALES 3° BASICO
    // ══════════════════════════════════════════════
    'AV03': [
        { code: 'AV03-OA01', eje: 'Expresion creativa', description: 'Crear trabajos de arte planificados, usando técnicas y materiales variados, que comuniquen ideas, experiencias y emociones con intención artística' },
        { code: 'AV03-OA02', eje: 'Expresion creativa', description: 'Explorar y usar intencionalmente elementos del lenguaje visual (línea, forma, color, textura, espacio, valor) para crear efectos expresivos' },
        { code: 'AV03-OA03', eje: 'Apreciar y responder', description: 'Observar, analizar e interpretar obras de arte de distintos períodos y culturas, usando un vocabulario visual pertinente' },
        { code: 'AV03-OA04', eje: 'Apreciar y responder', description: 'Identificar y analizar cómo los artistas usan los elementos del lenguaje visual para transmitir significados, emociones e ideas en sus obras' },
        { code: 'AV03-OA05', eje: 'Apreciar y responder', description: 'Elaborar juicios estéticos sobre obras de arte propias y ajenas, fundamentándolos con criterios visuales y personales' },
        { code: 'AV03-OA06', eje: 'Contextualizar', description: 'Investigar sobre manifestaciones del arte y la artesanía de regiones de Chile, valorando su identidad cultural' },
        { code: 'AV03-OA07', eje: 'Contextualizar', description: 'Reconocer estilos y movimientos artísticos significativos de la historia del arte occidental (renacimiento, impresionismo, muralismo) y sus características' },
    ],

    // ══════════════════════════════════════════════
    //  ARTES VISUALES 4° BASICO
    // ══════════════════════════════════════════════
    'AV04': [
        { code: 'AV04-OA01', eje: 'Expresion creativa', description: 'Crear trabajos de arte originales y planificados, usando técnicas variadas y recursos digitales básicos, para comunicar ideas y experiencias con intención artística' },
        { code: 'AV04-OA02', eje: 'Expresion creativa', description: 'Usar intencionalmente principios de diseño (repetición, contraste, ritmo, equilibrio, proporción) en la creación de trabajos artísticos' },
        { code: 'AV04-OA03', eje: 'Apreciar y responder', description: 'Analizar e interpretar obras de arte de distintas épocas y culturas, considerando el contexto histórico y cultural en que fueron creadas' },
        { code: 'AV04-OA04', eje: 'Apreciar y responder', description: 'Analizar cómo los artistas usan elementos y principios del lenguaje visual para crear significados, emociones y mensajes en sus obras' },
        { code: 'AV04-OA05', eje: 'Apreciar y responder', description: 'Elaborar y fundamentar juicios estéticos sobre obras de arte propias y ajenas, usando criterios técnicos, expresivos y culturales' },
        { code: 'AV04-OA06', eje: 'Contextualizar', description: 'Investigar y presentar la vida y obra de artistas chilenos relevantes, valorando su aporte a la identidad y el patrimonio cultural' },
        { code: 'AV04-OA07', eje: 'Contextualizar', description: 'Analizar el arte como expresión de valores, creencias e identidad de distintas culturas y épocas, desarrollando respeto por la diversidad' },
    ],

    // ══════════════════════════════════════════════
    //  ARTES VISUALES 5° BASICO
    // ══════════════════════════════════════════════
    'AV05': [
        { code: 'AV05-OA01', eje: 'Expresion creativa', description: 'Crear trabajos de arte elaborados y planificados, usando técnicas variadas y recursos digitales, que integren elementos y principios del lenguaje visual con propósito expresivo' },
        { code: 'AV05-OA02', eje: 'Expresion creativa', description: 'Desarrollar proyectos artísticos personales que expresen una visión original, aplicando procesos creativos de exploración, experimentación y reflexión' },
        { code: 'AV05-OA03', eje: 'Apreciar y responder', description: 'Analizar obras de arte de distintos movimientos y estilos, comparando el uso de los elementos del lenguaje visual y los propósitos expresivos' },
        { code: 'AV05-OA04', eje: 'Apreciar y responder', description: 'Analizar críticamente el uso de imágenes y recursos visuales en los medios de comunicación y la publicidad, identificando mensajes e intenciones' },
        { code: 'AV05-OA05', eje: 'Apreciar y responder', description: 'Elaborar juicios estéticos fundamentados sobre obras de arte y diseño, usando criterios técnicos, expresivos, culturales y éticos' },
        { code: 'AV05-OA06', eje: 'Contextualizar', description: 'Investigar sobre movimientos artísticos latinoamericanos (muralismo, arte precolombino, arte popular) y su relación con contextos históricos y sociales' },
        { code: 'AV05-OA07', eje: 'Contextualizar', description: 'Analizar el arte contemporáneo chileno, reconociendo la diversidad de expresiones, medios y temáticas que abordan artistas actuales' },
    ],

    // ══════════════════════════════════════════════
    //  ARTES VISUALES 6° BASICO
    // ══════════════════════════════════════════════
    'AV06': [
        { code: 'AV06-OA01', eje: 'Expresion creativa', description: 'Crear proyectos artísticos personales y colaborativos, usando técnicas variadas y medios digitales, que comuniquen ideas complejas con intención artística y coherencia visual' },
        { code: 'AV06-OA02', eje: 'Expresion creativa', description: 'Desarrollar procesos creativos personales: investigar, planificar, ejecutar y reflexionar sobre proyectos artísticos propios' },
        { code: 'AV06-OA03', eje: 'Apreciar y responder', description: 'Analizar obras de arte de distintos períodos históricos, identificando características formales, expresivas y contextuales' },
        { code: 'AV06-OA04', eje: 'Apreciar y responder', description: 'Analizar críticamente el papel de las artes visuales en la construcción de identidades culturales, sociales y políticas' },
        { code: 'AV06-OA05', eje: 'Apreciar y responder', description: 'Elaborar y comunicar juicios estéticos fundamentados sobre obras de arte y diseño, considerando criterios técnicos, expresivos y culturales' },
        { code: 'AV06-OA06', eje: 'Contextualizar', description: 'Investigar sobre el arte de los pueblos originarios de Chile y América, valorando su vigencia y aporte a la identidad cultural contemporánea' },
        { code: 'AV06-OA07', eje: 'Contextualizar', description: 'Analizar el rol del arte y el diseño en la sociedad contemporánea, reconociendo su capacidad para generar reflexión crítica y transformación social' },
    ],

    // ══════════════════════════════════════════════
    //  ARTES VISUALES 7° BASICO
    // ══════════════════════════════════════════════
    'AV07': [
        { code: 'AV07-OA01', eje: 'Expresion creativa', description: 'Crear proyectos artísticos autorales usando técnicas y medios variados (incluyendo fotografía, video y medios digitales), que expresen una visión personal con coherencia técnica y estética' },
        { code: 'AV07-OA02', eje: 'Expresion creativa', description: 'Desarrollar procesos creativos complejos: investigar referentes, planificar, experimentar, ejecutar y reflexionar críticamente sobre proyectos artísticos personales' },
        { code: 'AV07-OA03', eje: 'Apreciar y responder', description: 'Analizar obras de arte de distintos movimientos y vanguardias del siglo XX, identificando características formales, conceptuales y contextuales' },
        { code: 'AV07-OA04', eje: 'Apreciar y responder', description: 'Analizar críticamente el uso de imágenes visuales en los medios de comunicación, la publicidad y las redes sociales, identificando intenciones y efectos' },
        { code: 'AV07-OA05', eje: 'Apreciar y responder', description: 'Elaborar juicios estéticos fundamentados sobre obras de arte contemporáneo, considerando criterios técnicos, conceptuales, culturales y éticos' },
        { code: 'AV07-OA06', eje: 'Contextualizar', description: 'Investigar sobre artistas chilenos contemporáneos y sus obras, analizando su aporte al arte nacional e internacional' },
        { code: 'AV07-OA07', eje: 'Contextualizar', description: 'Reflexionar sobre la relación entre arte, poder, identidad y sociedad, analizando ejemplos de distintas culturas y períodos históricos' },
    ],

    // ══════════════════════════════════════════════
    //  ARTES VISUALES 8° BASICO
    // ══════════════════════════════════════════════
    'AV08': [
        { code: 'AV08-OA01', eje: 'Expresion creativa', description: 'Desarrollar y presentar proyectos artísticos personales de mayor complejidad técnica y conceptual, usando técnicas, medios y lenguajes visuales variados con autonomía creativa' },
        { code: 'AV08-OA02', eje: 'Expresion creativa', description: 'Desarrollar procesos creativos autorales: investigar, conceptualizar, planificar, ejecutar, reflexionar y comunicar proyectos artísticos propios con fundamentación' },
        { code: 'AV08-OA03', eje: 'Apreciar y responder', description: 'Analizar y comparar obras de arte contemporáneo de distintas culturas, identificando características formales, conceptuales y sus contextos de producción' },
        { code: 'AV08-OA04', eje: 'Apreciar y responder', description: 'Analizar críticamente el arte como herramienta de reflexión, denuncia y transformación social en distintos períodos históricos y culturas' },
        { code: 'AV08-OA05', eje: 'Apreciar y responder', description: 'Elaborar y comunicar juicios estéticos fundamentados sobre obras de arte y diseño, usando criterios técnicos, conceptuales, culturales y éticos con autonomía crítica' },
        { code: 'AV08-OA06', eje: 'Contextualizar', description: 'Investigar sobre movimientos artísticos latinoamericanos contemporáneos y su relación con contextos políticos, sociales y culturales' },
        { code: 'AV08-OA07', eje: 'Contextualizar', description: 'Reflexionar sobre el propio proceso creativo y la identidad artística personal, valorando el arte como forma de expresión y conocimiento' },
    ],

    // ══════════════════════════════════════════════
    //  TECNOLOGIA 1° BASICO
    // ══════════════════════════════════════════════
    'TE01': [
        { code: 'TE01-OA01', eje: 'Uso responsable de TIC', description: 'Identificar y usar dispositivos tecnológicos del entorno (computador, tablet, teléfono) reconociendo sus partes y funciones principales' },
        { code: 'TE01-OA02', eje: 'Uso responsable de TIC', description: 'Usar dispositivos tecnológicos básicos con autonomía para explorar programas educativos, juegos y recursos multimedia' },
        { code: 'TE01-OA03', eje: 'Uso responsable de TIC', description: 'Distinguir usos responsables y seguros de la tecnología, identificando situaciones de riesgo en el entorno digital' },
        { code: 'TE01-OA04', eje: 'Diseño y resolución de problemas', description: 'Explorar y manipular objetos tecnológicos del entorno, identificando sus funciones y el problema que resuelven' },
        { code: 'TE01-OA05', eje: 'Diseño y resolución de problemas', description: 'Diseñar y construir objetos sencillos con materiales del entorno para resolver un problema concreto, siguiendo un proceso de diseño básico' },
        { code: 'TE01-OA06', eje: 'Uso responsable de TIC', description: 'Usar herramientas digitales básicas (procesador de texto, software de dibujo) para crear productos sencillos' },
        { code: 'TE01-OA07', eje: 'Diseño y resolución de problemas', description: 'Presentar y evaluar los objetos diseñados, explicando si resuelven el problema planteado y cómo podrían mejorarse' },
    ],

    // ══════════════════════════════════════════════
    //  TECNOLOGIA 2° BASICO
    // ══════════════════════════════════════════════
    'TE02': [
        { code: 'TE02-OA01', eje: 'Uso responsable de TIC', description: 'Usar con mayor autonomía dispositivos tecnológicos y programas educativos básicos para aprender y crear' },
        { code: 'TE02-OA02', eje: 'Uso responsable de TIC', description: 'Usar herramientas digitales (procesador de texto, presentaciones, software de dibujo) para comunicar ideas y crear productos digitales sencillos' },
        { code: 'TE02-OA03', eje: 'Uso responsable de TIC', description: 'Reconocer la importancia de proteger la información personal y mantener comportamientos seguros y responsables en entornos digitales' },
        { code: 'TE02-OA04', eje: 'Diseño y resolución de problemas', description: 'Analizar objetos tecnológicos del entorno, identificando los materiales, las funciones y cómo resuelven necesidades humanas' },
        { code: 'TE02-OA05', eje: 'Diseño y resolución de problemas', description: 'Diseñar y construir objetos o sistemas sencillos para resolver un problema, aplicando un proceso de diseño paso a paso' },
        { code: 'TE02-OA06', eje: 'Pensamiento computacional', description: 'Resolver problemas sencillos mediante algoritmos básicos (secuencias de pasos) y explorar actividades introductorias de programación visual' },
        { code: 'TE02-OA07', eje: 'Diseño y resolución de problemas', description: 'Presentar y evaluar colectivamente los objetos o sistemas diseñados, identificando aspectos logrados y posibles mejoras' },
    ],

    // ══════════════════════════════════════════════
    //  TECNOLOGIA 3° BASICO
    // ══════════════════════════════════════════════
    'TE03': [
        { code: 'TE03-OA01', eje: 'Uso responsable de TIC', description: 'Usar herramientas digitales con mayor fluidez para buscar información, crear contenidos y comunicarse, evaluando la calidad de la información obtenida en línea' },
        { code: 'TE03-OA02', eje: 'Uso responsable de TIC', description: 'Crear contenidos digitales (presentaciones, documentos, producciones multimedia sencillas) para comunicar ideas y compartir aprendizajes' },
        { code: 'TE03-OA03', eje: 'Uso responsable de TIC', description: 'Identificar y practicar comportamientos seguros, éticos y responsables en el uso de internet y redes sociales' },
        { code: 'TE03-OA04', eje: 'Diseño y resolución de problemas', description: 'Analizar necesidades del entorno y diseñar objetos o sistemas tecnológicos que las resuelvan, considerando criterios de funcionalidad, seguridad y sustentabilidad' },
        { code: 'TE03-OA05', eje: 'Diseño y resolución de problemas', description: 'Construir y probar prototipos de objetos o sistemas tecnológicos, evaluando si cumplen con los criterios de diseño establecidos y realizando mejoras' },
        { code: 'TE03-OA06', eje: 'Pensamiento computacional', description: 'Desarrollar y aplicar el pensamiento computacional (descomposición, patrones, abstracción, algoritmos) para resolver problemas usando programación visual por bloques' },
        { code: 'TE03-OA07', eje: 'Diseño y resolución de problemas', description: 'Comunicar y evaluar los resultados del proceso de diseño tecnológico, reflexionando sobre el impacto de la tecnología en la sociedad y el medio ambiente' },
    ],

    // ══════════════════════════════════════════════
    //  TECNOLOGIA 4° BASICO
    // ══════════════════════════════════════════════
    'TE04': [
        { code: 'TE04-OA01', eje: 'Uso responsable de TIC', description: 'Usar herramientas digitales avanzadas para investigar, crear y colaborar, evaluando críticamente la información obtenida en línea' },
        { code: 'TE04-OA02', eje: 'Uso responsable de TIC', description: 'Crear contenidos digitales originales (sitios web sencillos, videos, podcasts, presentaciones interactivas) para distintos propósitos y audiencias' },
        { code: 'TE04-OA03', eje: 'Uso responsable de TIC', description: 'Analizar situaciones de seguridad, privacidad y ética en el uso de tecnologías digitales, desarrollando comportamientos responsables en línea' },
        { code: 'TE04-OA04', eje: 'Diseño y resolución de problemas', description: 'Aplicar un proceso de diseño tecnológico completo para diseñar, construir y evaluar objetos o sistemas que resuelvan problemas reales del entorno' },
        { code: 'TE04-OA05', eje: 'Diseño y resolución de problemas', description: 'Seleccionar y usar materiales, herramientas y técnicas adecuadas para la construcción de objetos o sistemas tecnológicos, considerando criterios de calidad' },
        { code: 'TE04-OA06', eje: 'Pensamiento computacional', description: 'Aplicar el pensamiento computacional para crear programas con estructuras de control (secuencias, condicionales, bucles) usando lenguajes de programación visual' },
        { code: 'TE04-OA07', eje: 'Diseño y resolución de problemas', description: 'Reflexionar sobre el impacto social, cultural y medioambiental de las tecnologías, proponiendo usos responsables y sustentables' },
    ],

    // ══════════════════════════════════════════════
    //  TECNOLOGIA 5° BASICO
    // ══════════════════════════════════════════════
    'TE05': [
        { code: 'TE05-OA01', eje: 'Uso responsable de TIC', description: 'Usar herramientas digitales de manera autónoma y crítica para investigar, crear, colaborar y comunicar, evaluando la calidad y pertinencia de la información' },
        { code: 'TE05-OA02', eje: 'Uso responsable de TIC', description: 'Crear y publicar contenidos digitales originales y de calidad para distintos propósitos y audiencias, usando herramientas digitales avanzadas' },
        { code: 'TE05-OA03', eje: 'Uso responsable de TIC', description: 'Analizar dilemas éticos relacionados con la tecnología (privacidad, propiedad intelectual, fake news) y desarrollar criterios para un uso responsable y ético' },
        { code: 'TE05-OA04', eje: 'Diseño y resolución de problemas', description: 'Aplicar un proceso de diseño tecnológico iterativo para desarrollar soluciones innovadoras a problemas reales, incorporando criterios de sustentabilidad' },
        { code: 'TE05-OA05', eje: 'Diseño y resolución de problemas', description: 'Construir y probar prototipos funcionales de objetos o sistemas tecnológicos, evaluando el desempeño y realizando iteraciones de mejora' },
        { code: 'TE05-OA06', eje: 'Pensamiento computacional', description: 'Crear programas y proyectos de robótica educativa que resuelvan problemas reales, usando lenguajes de programación visual y físicos con lógica de control avanzada' },
        { code: 'TE05-OA07', eje: 'Diseño y resolución de problemas', description: 'Analizar críticamente el impacto de las tecnologías emergentes (inteligencia artificial, robótica, realidad aumentada) en la sociedad y el mundo del trabajo' },
    ],

    // ══════════════════════════════════════════════
    //  TECNOLOGIA 6° BASICO
    // ══════════════════════════════════════════════
    'TE06': [
        { code: 'TE06-OA01', eje: 'Uso responsable de TIC', description: 'Usar herramientas digitales colaborativas para investigar, crear proyectos y comunicar resultados con calidad técnica y pertinencia comunicativa' },
        { code: 'TE06-OA02', eje: 'Uso responsable de TIC', description: 'Crear proyectos digitales colaborativos de mayor complejidad (sitios web, aplicaciones básicas, producciones audiovisuales) para audiencias reales' },
        { code: 'TE06-OA03', eje: 'Uso responsable de TIC', description: 'Analizar y debatir sobre el impacto social, económico y cultural de las tecnologías digitales, desarrollando una ciudadanía digital crítica y responsable' },
        { code: 'TE06-OA04', eje: 'Diseño y resolución de problemas', description: 'Aplicar un proceso de diseño tecnológico centrado en el usuario para crear soluciones innovadoras a problemas comunitarios o escolares' },
        { code: 'TE06-OA05', eje: 'Diseño y resolución de problemas', description: 'Construir y probar sistemas tecnológicos funcionales (incluyendo circuitos eléctricos básicos o prototipos con componentes electrónicos), evaluando el desempeño' },
        { code: 'TE06-OA06', eje: 'Pensamiento computacional', description: 'Crear proyectos de programación y robótica que integren sensores, actuadores y lógica de control para resolver problemas reales de manera autónoma' },
        { code: 'TE06-OA07', eje: 'Diseño y resolución de problemas', description: 'Reflexionar y debatir sobre temas de ética tecnológica y futuro del trabajo, desarrollando visiones críticas y propositivas sobre el rol de la tecnología en la sociedad' },
    ],

    // ══════════════════════════════════════════════
    //  TECNOLOGIA 7° BASICO
    // ══════════════════════════════════════════════
    'TE07': [
        { code: 'TE07-OA01', eje: 'Uso responsable de TIC', description: 'Usar herramientas digitales avanzadas de manera autónoma y crítica para investigar, crear, comunicar y colaborar en proyectos complejos' },
        { code: 'TE07-OA02', eje: 'Uso responsable de TIC', description: 'Crear y publicar proyectos digitales de calidad profesional (portafolios digitales, aplicaciones web, producciones multimedia) para audiencias reales y con propósito claro' },
        { code: 'TE07-OA03', eje: 'Uso responsable de TIC', description: 'Analizar y evaluar críticamente el impacto de las tecnologías digitales en la vida personal, social y el medioambiente, desarrollando una ciudadanía digital activa' },
        { code: 'TE07-OA04', eje: 'Diseño y resolución de problemas', description: 'Aplicar metodologías de diseño centradas en el usuario (design thinking) para crear soluciones tecnológicas innovadoras a problemas reales de la comunidad' },
        { code: 'TE07-OA05', eje: 'Diseño y resolución de problemas', description: 'Construir y evaluar sistemas tecnológicos complejos (incluyendo electrónica, robótica o impresión 3D) con criterios de funcionalidad, seguridad y sustentabilidad' },
        { code: 'TE07-OA06', eje: 'Pensamiento computacional', description: 'Crear programas y aplicaciones usando lenguajes de programación de texto, aplicando principios de la ingeniería del software y el pensamiento computacional' },
        { code: 'TE07-OA07', eje: 'Diseño y resolución de problemas', description: 'Investigar y reflexionar sobre tecnologías emergentes (IA, blockchain, IoT, biotecnología) y sus implicancias éticas, sociales y económicas para el futuro' },
    ],

    // ══════════════════════════════════════════════
    //  TECNOLOGIA 8° BASICO
    // ══════════════════════════════════════════════
    'TE08': [
        { code: 'TE08-OA01', eje: 'Uso responsable de TIC', description: 'Usar con dominio herramientas digitales profesionales para investigar, crear, colaborar y comunicar proyectos de alto nivel técnico y creativo' },
        { code: 'TE08-OA02', eje: 'Uso responsable de TIC', description: 'Crear proyectos digitales originales y de alta calidad que demuestren dominio de múltiples herramientas y lenguajes digitales, con propósito comunicativo claro' },
        { code: 'TE08-OA03', eje: 'Uso responsable de TIC', description: 'Analizar y evaluar críticamente el rol de la tecnología en la construcción de la identidad digital, la ciudadanía y los derechos en el mundo contemporáneo' },
        { code: 'TE08-OA04', eje: 'Diseño y resolución de problemas', description: 'Liderar procesos de diseño tecnológico complejos para crear soluciones innovadoras a problemas reales, incorporando metodologías ágiles y centradas en el usuario' },
        { code: 'TE08-OA05', eje: 'Diseño y resolución de problemas', description: 'Construir, probar y optimizar sistemas tecnológicos complejos, evaluando su impacto técnico, social y medioambiental con criterios de sustentabilidad' },
        { code: 'TE08-OA06', eje: 'Pensamiento computacional', description: 'Desarrollar proyectos de programación avanzada y aplicaciones funcionales usando lenguajes de texto, aplicando principios de la ingeniería de software y análisis de datos' },
        { code: 'TE08-OA07', eje: 'Diseño y resolución de problemas', description: 'Reflexionar sobre el propio proceso de aprendizaje tecnológico y planificar un camino de desarrollo de competencias digitales para el futuro personal y profesional' },
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
