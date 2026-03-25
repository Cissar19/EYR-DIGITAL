# Tab Inteligencia — Guia de Usuario

## Que es

El tab **Inteligencia** es la primera pestana dentro de **Estadisticas**. A diferencia de los otros tabs que muestran *lo que ya paso*, este tab responde a la pregunta **"que va a pasar"**. Analiza automaticamente los datos del colegio y genera alertas tempranas para que el equipo directivo pueda actuar antes de que los problemas escalen.

Todo se calcula en tiempo real con los datos que ya existen en el sistema. No requiere configuracion adicional.

---

## Seccion 1: Pronostico de Ausencias Semanales

### Que muestra

Un grafico de linea con dos partes:
- **Linea solida** (izquierda): las clases que realmente se perdieron cada semana
- **Linea punteada** (derecha): cuantas clases se espera perder en las proximas 4 semanas
- **Banda sombreada**: el rango probable (puede ser un poco mas o un poco menos)

Ademas, dos tarjetas resumen:
- "Proyeccion Prox. Semana: ~X clases perdidas"
- "Semanas Proyectadas: 4 hacia adelante"

### Como se calcula

El sistema mira las **ultimas 6 semanas** de clases perdidas (sumando todas las fuentes: dias administrativos, licencias medicas y atrasos/ausencias) y calcula un promedio, pero **dandole mas importancia a las semanas recientes**.

Concretamente, la semana mas reciente pesa 6 veces mas que la mas antigua. Asi, si la ultima semana se perdieron muchas clases, la proyeccion sube; si la ultima semana fue tranquila, la proyeccion baja.

**Ejemplo visual:**

```
Semanas reales:           Sem 7   Sem 8   Sem 9   Sem 10  Sem 11  Sem 12
Clases perdidas:            10      8      12       15      11      14
Peso en el calculo:        bajo   bajo    medio   medio    alto   maximo
                            ↓
Proyeccion semana 13:  ~13 clases perdidas (pesa mas el 14 y 11 recientes)
```

**La banda sombreada** representa la variabilidad natural. Si las semanas anteriores fueron muy disparejas (5, 20, 3, 18...), la banda sera ancha = "hay mucha incertidumbre". Si fueron estables (10, 11, 10, 12...), la banda sera angosta = "la proyeccion es confiable".

### Como leerlo

- Si la linea punteada **sube**, se esperan mas ausencias en las proximas semanas
- Si la banda es **muy ancha**, significa que las semanas anteriores fueron impredecibles y la proyeccion es orientativa
- El numero en la tarjeta KPI es la mejor estimacion para la semana siguiente

---

## Seccion 2: Agotamiento de Dias Administrativos

### Que muestra

Una tabla con los docentes que **van camino a quedarse sin dias administrativos**, ordenada por urgencia:

| Columna | Significado |
|---------|-------------|
| **Docente** | Nombre del profesor |
| **Saldo** | Cuantos dias le quedan hoy (de los 6 anuales) |
| **Uso/Mes** | Cuantos dias usa en promedio cada mes |
| **Meses Rest.** | En cuantos meses se le acaban al ritmo actual |
| **Fecha Est.** | Fecha aproximada en que llegara a 0 |
| **Estado** | Semaforo de urgencia |

El semaforo funciona asi:

| Color | Etiqueta | Significado |
|-------|----------|-------------|
| Rojo | Critico | Ya se quedo sin dias, o le queda menos de 1 mes |
| Amarillo | Precaucion | Le quedan entre 1 y 3 meses |
| Verde | OK | Le quedan mas de 3 meses |

Arriba de la tabla hay una tarjeta que resume: **"X docentes agotaran dias antes de fin de ano"**.

### Como se calcula

Para cada docente:

1. Se toman todas las solicitudes **aprobadas** que consumen dias (dias completos, medios dias, descuentos — excluyendo permisos de horas y devoluciones)
2. Se agrupan por mes: "en marzo uso 2 dias, en abril uso 1"
3. Se calcula el **promedio mensual de uso**
4. Se divide el **saldo actual** por esa tasa

**Ejemplo:**

```
Profesora Maria:
  - Saldo actual: 3 dias
  - Marzo: uso 2 dias
  - Abril: uso 1 dia
  - Promedio mensual: 1.5 dias/mes
  - Meses restantes: 3 / 1.5 = 2 meses
  - Fecha estimada: ~fin de mayo
  - Estado: AMARILLO (entre 1 y 3 meses)
```

### Como leerlo

- Los docentes en **rojo** necesitan atencion inmediata — ya no les quedan dias o se agotan este mes
- Los docentes en **amarillo** van a necesitar atencion pronto — conviene conversar con ellos sobre planificacion
- Solo aparecen docentes que ya han usado algun dia. Si un docente no ha usado ninguno, no aparece (porque no hay patron que proyectar)
- La columna "Uso/Mes" es clave: un docente con uso 0.5/mes y saldo 2 esta tranquilo (4 meses); uno con uso 2.0/mes y saldo 2 esta en problemas (1 mes)

---

## Seccion 3: Alumnos en Riesgo

### Que muestra

Los **10 alumnos con mas senales de alerta**, con:
- Un **grafico de barras horizontales apiladas** donde cada color representa un factor de riesgo diferente
- Una **lista detallada** con el nombre, curso, mini-barras por factor y un puntaje de 0 a 100
- Un semaforo por alumno: **Alto** (rojo), **Medio** (amarillo) o **Bajo** (verde)

### Los 5 factores de riesgo

El sistema evalua a cada alumno en 5 dimensiones, cada una con un peso diferente:

| Factor | Peso | Que mide | Color en el grafico |
|--------|------|----------|---------------------|
| Incidencias de convivencia | 30% | Cantidad y gravedad de incidencias registradas | Violeta |
| Justificativos (90 dias) | 25% | Cuantos justificativos tiene en los ultimos 3 meses | Rosa |
| Entrevistas recientes | 20% | Cuantas entrevistas (con alumno o apoderado) en 90 dias | Amarillo |
| Medicos reiterados | 15% | Cuantos justificativos medicos especificamente | Cyan |
| Incidencias no resueltas | 10% | Cuantas incidencias siguen abiertas o en seguimiento | Rojo |

### Como se calcula el puntaje

El puntaje va de **0 a 100**. Se calcula en 3 pasos:

**Paso 1 — Contar.** Para cada alumno se cuentan los eventos en cada factor. Las incidencias se ponderan por gravedad:
- Incidencia leve = 1 punto
- Incidencia grave = 3 puntos
- Incidencia muy grave = 5 puntos
- Si la incidencia ocurrio en los ultimos 90 dias, cuenta **el doble**

**Paso 2 — Comparar.** Cada factor se compara contra el alumno que tiene el valor mas alto en todo el colegio. Si el alumno con mas justificativos tiene 8 y este alumno tiene 4, su valor normalizado es 4/8 = 0.50 (50% del maximo).

**Paso 3 — Ponderar.** Se multiplica cada factor normalizado por su peso y se suman:

```
Ejemplo — Alumno Pedro:

  Justificativos:    4 de 8 posibles = 50% × 25% = 12.5 puntos
  Medicos:           2 de 5 posibles = 40% × 15% =  6.0 puntos
  Incidencias:       6 de 10 posibles = 60% × 30% = 18.0 puntos
  Entrevistas:       1 de 3 posibles = 33% × 20% =  6.6 puntos
  No resueltas:      1 de 2 posibles = 50% × 10% =  5.0 puntos
                                                    ─────────────
  SCORE TOTAL:                                       48 (Medio)
```

**Niveles de riesgo:**

| Puntaje | Nivel | Significado |
|---------|-------|-------------|
| 60 — 100 | Alto (rojo) | Requiere intervencion prioritaria |
| 30 — 59 | Medio (amarillo) | Requiere seguimiento cercano |
| 1 — 29 | Bajo (verde) | Situacion a monitorear |

### Como leer el grafico de barras

Cada barra horizontal representa un alumno. Los **colores apilados** muestran que factores contribuyen mas a su puntaje:

- Si la barra es mayormente **violeta** (incidencias), el alumno tiene problemas de convivencia
- Si es mayormente **rosa** (justificativos), falta mucho a clases
- Si es mayormente **amarillo** (entrevistas), ya ha requerido multiples reuniones
- Una barra **larga y multicolor** indica problemas en multiples dimensiones — situacion mas compleja

### Como leer las mini-barras en la lista

Debajo del nombre de cada alumno hay 5 barritas de colores. Cada una representa un factor:
- Barra **llena** = este alumno tiene el valor mas alto del colegio en ese factor
- Barra **al 50%** = esta en la mitad
- Barra **casi vacia** = tiene pocos eventos en ese factor

Esto permite ver de un vistazo **donde esta el problema** de cada alumno sin necesidad de leer numeros.

### Consideracion importante

Los puntajes son **relativos al grupo actual**. Si ningun alumno del colegio tiene incidencias graves, incluso el alumno "mas problematico" tendra un puntaje bajo. El sistema identifica a los que mas se desvian del grupo, no define umbrales absolutos.

---

## Seccion 4: Deteccion de Anomalias

### Que muestra

Una de dos cosas:
- **Card verde** "Sin Anomalias Esta Semana" — todo esta dentro de los rangos normales
- **Cards naranjas o rojas** — alguna metrica esta inusualmente alta esta semana

Cada alerta muestra:
- Que metrica esta fuera de rango (ej: "Clases perdidas: 18 esta semana")
- El promedio historico y cuanto se desvio

### Que metricas monitorea

| Metrica | De donde salen los datos |
|---------|--------------------------|
| Clases perdidas esta semana | Dias admin + licencias + atrasos |
| Justificativos nuevos esta semana | Modulo de justificativos |
| Incidencias nuevas esta semana | Modulo de convivencia |
| Tickets abiertos esta semana | Modulo de soporte tecnico |

### Como decide si algo es anomalo

El sistema compara **lo que paso esta semana** con **lo que pasa normalmente**:

1. Calcula el **promedio** de todas las semanas anteriores
2. Calcula la **variabilidad** (que tan disparejas son las semanas entre si)
3. Calcula cuanto se aleja la semana actual del promedio, medido en "desviaciones estandar"

**En simple:** si normalmente se pierden ~10 clases por semana (con variaciones de ±2), y esta semana se perdieron 18, eso esta muy fuera de lo normal → alerta.

**Ejemplo concreto:**

```
Historial de clases perdidas por semana: 8, 10, 12, 9, 11, 10
Promedio: 10
Variacion tipica: ±1.3

Esta semana: 14  → se alejo 3.1 veces la variacion tipica
                 → ALERTA ROJA (muy fuera de lo normal)

Esta semana: 12  → se alejo 1.5 veces la variacion tipica
                 → ALERTA NARANJA (moderadamente fuera de lo normal)

Esta semana: 11  → se alejo 0.8 veces la variacion tipica
                 → Sin alerta (dentro del rango normal)
```

**Colores de alerta:**

| Color | Significado |
|-------|-------------|
| Verde | Todo normal. Nada que reportar |
| Naranja | Algo inusual esta pasando. Vale la pena investigar |
| Rojo | Situacion claramente fuera de lo normal. Requiere atencion |

### Como leerlo

- **Card verde** = semana normal, no se requiere accion
- **Card naranja** = algo subio mas de lo habitual. Puede ser un evento puntual (ej: semana de examenes) o el inicio de una tendencia. Conviene revisar
- **Card roja** = incremento significativo. Revisar que esta pasando y si se requiere intervencion
- Si hay **multiples alertas a la vez** (ej: suben clases perdidas Y justificativos Y incidencias), probablemente hay una causa comun que vale la pena investigar

### Nota

El sistema necesita al menos **3 semanas de datos historicos** para poder detectar anomalias. Si el sistema es nuevo o tiene pocos datos, esta seccion mostrara "Sin anomalias" por defecto hasta acumular suficiente historial.
