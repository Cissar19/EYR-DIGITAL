/**
 * Tests para evaluacionParser.js
 * Ejecutar: node scripts/testEvaluacionParser.js
 */
import assert from 'assert';
import { parseEvaluacion } from '../src/lib/evaluacionParser.js';

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

// ── Test 1: Selección múltiple simple ─────────────────────────────────────────

test('selección múltiple simple — 4 alternativas', () => {
  const text = `
1. El promedio de un conjunto de datos representa:
a) El número más grande del conjunto.
b) El número más pequeño del conjunto.
c) El valor que representa o resume a todos los datos.
d) El total de todos los datos sin dividir.
`.trim();

  const result = parseEvaluacion(text);
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].numero, 1);
  assert.strictEqual(result[0].tipo, 'seleccion_multiple');
  assert.strictEqual(result[0].alternativas.a, 'El número más grande del conjunto.');
  assert.strictEqual(result[0].alternativas.b, 'El número más pequeño del conjunto.');
  assert.strictEqual(result[0].alternativas.c, 'El valor que representa o resume a todos los datos.');
  assert.strictEqual(result[0].alternativas.d, 'El total de todos los datos sin dividir.');
  assert.strictEqual(result[0].enunciado, 'El promedio de un conjunto de datos representa:');
});

// ── Test 2: Pregunta de desarrollo ────────────────────────────────────────────

test('pregunta de desarrollo — sin alternativas', () => {
  const text = `
2. Si en un grupo los puntajes fueron 5, 6 y 7, ¿qué indica el promedio sobre estos datos?
`.trim();

  const result = parseEvaluacion(text);
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].numero, 2);
  assert.strictEqual(result[0].tipo, 'desarrollo');
  assert.deepStrictEqual(result[0].alternativas, {});
  assert(result[0].enunciado.includes('puntajes fueron 5, 6 y 7'));
});

// ── Test 3: Enunciado en dos líneas antes de las alternativas ─────────────────

test('enunciado en dos líneas antes de alternativas', () => {
  const text = `
3. En una clase de 30 estudiantes, la mitad obtuvo nota 5
y el resto obtuvo nota 7. ¿Cuál es el promedio de la clase?
a) 5
b) 6
c) 7
d) 4
`.trim();

  const result = parseEvaluacion(text);
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].numero, 3);
  assert.strictEqual(result[0].tipo, 'seleccion_multiple');
  assert(result[0].enunciado.includes('la mitad obtuvo nota 5'), 'primera línea del enunciado');
  assert(result[0].enunciado.includes('y el resto obtuvo nota 7'), 'segunda línea del enunciado');
  assert.strictEqual(Object.keys(result[0].alternativas).length, 4);
});

// ── Test 4: Secciones romanas ignoradas + mezcla de tipos ─────────────────────

test('títulos de sección romana son ignorados', () => {
  const text = `
I. Estadística

1. ¿Qué es la moda en un conjunto de datos?
a) El valor que más se repite.
b) El valor del medio.
c) La suma de todos los datos.
d) El rango de los datos.

II. Operaciones

2. Explica con tus palabras qué es la mediana.
`.trim();

  const result = parseEvaluacion(text);
  assert.strictEqual(result.length, 2, 'debe haber 2 preguntas, no los títulos romanos');
  assert.strictEqual(result[0].numero, 1);
  assert.strictEqual(result[0].tipo, 'seleccion_multiple');
  assert.strictEqual(result[1].numero, 2);
  assert.strictEqual(result[1].tipo, 'desarrollo');
});

// ── Test 5: Preguntas que dependen de imagen son ignoradas ────────────────────

test('pregunta con referencia a imagen es ignorada', () => {
  const text = `
4. Observa la siguiente imagen y responde:
a) Opción A
b) Opción B
c) Opción C
d) Opción D

5. Une con una línea según corresponda.

6. ¿Cuál es el resultado de 3 + 5?
a) 6
b) 7
c) 8
d) 9
`.trim();

  const result = parseEvaluacion(text);
  assert.strictEqual(result.length, 1, 'solo la pregunta 6 debe pasar el filtro');
  assert.strictEqual(result[0].numero, 6);
});

// ── Test 6: Enunciado muy corto (< 15 chars) es ignorado ─────────────────────

test('enunciado muy corto es ignorado', () => {
  const text = `
7. Ver figura.
a) Sí
b) No
c) Tal vez
d) Nunca

8. ¿Cuántos lados tiene un hexágono?
a) 4
b) 5
c) 6
d) 8
`.trim();

  const result = parseEvaluacion(text);
  assert.strictEqual(result.length, 1, 'pregunta 7 debe ignorarse por enunciado corto');
  assert.strictEqual(result[0].numero, 8);
});

// ── Test 7: Líneas de respuesta (____) son ignoradas ─────────────────────────

test('líneas de espacio para respuesta son ignoradas', () => {
  const text = `
9. ¿Qué es la varianza estadística?
__________________________
__________________________
`.trim();

  const result = parseEvaluacion(text);
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].tipo, 'desarrollo');
  assert(!result[0].enunciado.includes('_'), 'el enunciado no debe contener guiones');
});

// ── Test 8: Texto completo mezclado (integración) ─────────────────────────────

test('texto completo con secciones, imagen, desarrollo y selección múltiple', () => {
  const text = `
I. Selección Múltiple (2 puntos cada una)

1. ¿Cuál de las siguientes opciones define correctamente el concepto de "promedio"?
a) La suma de todos los valores dividida por la cantidad de valores.
b) El valor que aparece con más frecuencia.
c) El valor del medio al ordenar los datos.
d) La diferencia entre el mayor y el menor valor.

2. Observa el gráfico y elige la alternativa correcta:
a) Enero
b) Febrero
c) Marzo
d) Abril

II. Desarrollo (4 puntos cada una)

3. Explica con tus propias palabras la diferencia entre media, mediana y moda.
__________________________
__________________________

4. Calcula el promedio de los siguientes datos: 10, 8, 9, 7, 6
__________________________
`.trim();

  const result = parseEvaluacion(text);
  // Pregunta 2 debe ignorarse (referencia a gráfico)
  assert.strictEqual(result.length, 3, 'preguntas 1, 3 y 4 deben parsearse');
  assert.strictEqual(result[0].numero, 1);
  assert.strictEqual(result[0].tipo, 'seleccion_multiple');
  assert.strictEqual(result[1].numero, 3);
  assert.strictEqual(result[1].tipo, 'desarrollo');
  assert.strictEqual(result[2].numero, 4);
  assert.strictEqual(result[2].tipo, 'desarrollo');
});

// ── Resumen ───────────────────────────────────────────────────────────────────

console.log('\nevaluacionParser\n');
// Los tests ya se ejecutaron arriba al llamar test()
console.log(`\n${passed + failed} tests: ${passed} pasaron, ${failed} fallaron`);
if (failed > 0) process.exit(1);
