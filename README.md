# Dybamic Forms Demo

## **Estrategia para un sistema *Multi-Tenant* de formularios dinámicos con integridad garantizada en la capa de aplicación**

El objetivo de esta demo es diseñar y validar una arquitectura para una plataforma de servicios médicos multi-tenant. El requisito principal es permitir que cada *tenant* defina, cree y gestione sus propios formularios dinámicos, sin sacrificar la integridad de los datos, el rendimiento bajo carga ni la seguridad de un sistema fuertemente tipado.

Para atender esa necesidad, se implementó una arquitectura de datos híbrida, aprovechando la robustez de un esquema relacional para los datos estructurados (*Tenants*, *Patients*) y la flexibilidad del tipo `jsonb` de *PostgreSQL* para los datos dinámicos de los formularios. La clave de la solución es un **motor de validación dinámico** construido en la capa de aplicación (*NestJS* y *Zod*), que garantiza la integridad de los datos en el punto de inserción y actualización, trasladando la responsabilidad de la consistencia desde la base de datos hacia una lógica de negocio controlada y segura.

La arquitectura fue sometida a rigurosas pruebas de carga simulando 50 usuarios concurrentes sobre una base de datos con 10,000 registros. Los resultados validaron empíricamente la solución:

- Rendimiento Excepcional: Latencias por debajo de los 40ms en el percentil 95 (p95) para operaciones complejas de lectura y escritura dentro de los datos JSON.
- Alta Robustez: Una tasa de error del 0% bajo carga, demostrando la estabilidad de la API y la correcta gestión de la concurrencia.
- Escalabilidad Comprobada: El diseño, que incluye patrones de caché distribuido y transacciones atómicas, está preparado para un entorno de producción de alta demanda.

![image-1](https://github.com/user-attachments/assets/dc60f131-50af-48ce-8f8a-14829af0b032)

![image-2](https://github.com/user-attachments/assets/c46a09cc-45a2-4c7a-be51-40dea393d039)

![image-3](https://github.com/user-attachments/assets/147cbf83-75d9-4730-8839-0092e991269a)

### Modelo de datos híbrido

La estrategia de persistencia de datos se basó en un principio fundamental: *”utilizar la herramienta adecuada para el trabajo adecuado”*. En lugar de forzar una única solución, se optó por un modelo híbrido que combina lo mejor del mundo relacional y el no estructurado.

- Lo Relacional para lo Estructurado: Entidades con una estructura predecible y relaciones bien definidas como `Tenant`, `Patient` y la tabla de unión `MedicalConsultation` se modelaron utilizando un esquema relacional tradicional. Esto nos brinda beneficios cruciales como la **integridad referencial** (un *paciente* siempre pertenecerá a un *tenant* válido), la eficiencia en las consultas que involucran `JOINs` y la claridad de un esquema de datos predecible y fuertemente tipado desde la base.
- JSONB para lo Dinámico: Para el contenido de los formularios (`formData`), que varía por `tenant` y evoluciona en el tiempo, se eligió el tipo `jsonb` de *PostgreSQL*. Esta decisión ofrece una flexibilidad inmensa, permitiendo que cada inquilino defina estructuras de datos complejas y anidadas sin necesidad de realizar costosas migraciones de esquema en la base de datos. Se evita así la sobrecarga y complejidad de patrones alternativos como *EAV (Entidad-Atributo-Valor)*, que son notoriamente difíciles de consultar y mantener.
- La Sinergia: Este enfoque híbrido logra un equilibrio óptimo. Mantenemos la solidez y las garantías del modelo relacional para el esqueleto de la aplicación, mientras delegamos la flexibilidad necesaria para los datos de negocio dinámicos al potente motor de `jsonb` de *PostgreSQL*.

![image-4](https://github.com/user-attachments/assets/f7a40c5b-ffdd-420f-a5fe-4170d4844937)

### Motor de integridad en la capa de aplicación

El núcleo de esta arquitectura reside en un cambio de paradigma: “*si la base de datos no puede garantizar la integridad de una columna `jsonb`, entonces la aplicación debe hacerlo de forma infalible **antes de cada operación de escritura**”*.

- El Contrato de Integridad: Se estableció como regla inquebrantable que ningún dato podría ser insertado o actualizado en la columna `formData` sin antes pasar por una validación rigurosa contra la definición del formulario correspondiente.
- El Generador Dinámico de Schemas con Zod: Se implementó un servicio central, el `DynamicSchemaService`, cuyo único propósito es actuar como un motor de integridad. Este servicio:
    1. Lee la definición de un formulario (almacenada como JSON en la base de datos).
    2. Traduce en tiempo de ejecución esta definición (que incluye tipos de campo, reglas de validación como `required`, `minLength`, etc.) en un ***schema* de validación de *Zod*** compilado y altamente optimizado.
    3. Aplica este *schema* generado para validar los datos entrantes. Cualquier desviación, ya sea un tipo incorrecto, un campo faltante o una propiedad extra no permitida, resulta en el rechazo inmediato de la petición.
- Gestión de Versiones de Formularios: Para manejar la evolución de los formularios, se implementó un sistema de versionado en la tabla `FormDefinition`. Cuando un *tenant* actualiza un formulario, se crea una nueva versión en lugar de sobrescribir la antigua. Cada registro en `MedicalConsultation` se enlaza de forma inmutable a la versión exacta (`formDefinitionId`) del formulario que se usó para validarlo. Esto garantiza la **integridad histórica** y permite analizar datos antiguos con el contexto de las reglas que se les aplicaron en su momento.

![image-5](https://github.com/user-attachments/assets/8349a533-fec3-4ccb-8350-0b7e6c69f27a)

### Garantizando rendimiento y escalabilidad

Una arquitectura flexible no sirve de nada si no es performante. Se implementaron dos estrategias clave para asegurar la escalabilidad.

- El Acelerador de JSONB: El Índice GIN: Una columna `jsonb` sin indexar obliga a la base de datos a realizar un escaneo secuencial completo (*Full Scan*) para encontrar datos en su interior, lo cual es inaceptablemente lento. Para solucionar esto, se aplicó un **índice GIN (Índice Invertido Generalizado)** sobre la columna `formData`. Este tipo de índice está específicamente diseñado para datos compuestos y permite a *PostgreSQL* encontrar valores dentro de documentos JSON con una eficiencia comparable a la de buscar en una columna tradicional indexada.
- Validación Empírica (Lectura): Las pruebas de carga lo demostraron. Las búsquedas de texto libre (`string_contains`) dentro del `jsonb` sobre una tabla de **10,000 registros** mostraron una latencia en el percentil 95 (`p95`) de **~35ms**, probando que el índice GIN es una solución eficaz y de alto rendimiento.
- Caché Distribuido con Redis: La generación de un schema de *Zod*, aunque rápida, es un trabajo computacional. Realizarlo en cada petición sería un desperdicio de recursos. La solución implementa una capa de caché que almacena los validadores de Zod ya compilados. En un entorno de producción con múltiples instancias, esta capa se implementaría con ***Redis***, un almacén de caché centralizado y compartido. Esto asegura que cada versión de cada formulario se "compila" una sola vez, y todas las instancias de la aplicación se benefician de ese trabajo, reduciendo drásticamente la latencia y la carga en el servidor.

![image-6](https://github.com/user-attachments/assets/467d242f-2a32-4375-80cf-ac30b7567f98)


## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# database seed
$ npm run prisma:seed

# load test
$ npm run test:load

# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## License
[MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
