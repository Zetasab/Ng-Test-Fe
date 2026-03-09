# Ng-Test-Fe

![Angular](https://img.shields.io/badge/Angular-21-red)
![Estado](https://img.shields.io/badge/Estado-Aprendizaje-blue)
![Licencia](https://img.shields.io/badge/Licencia-Uso%20interno-lightgrey)

> Proyecto de prueba en Angular para aprender, practicar y experimentar.
> **No es el proyecto que uso profesionalmente en produccion.**

---

## Resumen rapido

`Ng-Test-Fe` es una aplicacion frontend construida con Angular 21, enfocada en practicar:

- autenticacion y control de acceso por roles;
- rutas protegidas con guards;
- estructura modular por features;
- consumo de API con servicios reutilizables;
- componentes UI con PrimeNG y librerias visuales.

## Stack principal

| Tecnologia | Uso en el proyecto |
| --- | --- |
| Angular 21 | Estructura principal de la app |
| Angular Router | Navegacion, rutas protegidas y lazy loading |
| HttpClient | Comunicacion con backend |
| PrimeNG + PrimeIcons | Componentes visuales |
| Vitest | Pruebas unitarias |

## Como ejecutar el proyecto

### 1. Instalar dependencias

```bash
npm install
```

### 2. Levantar entorno de desarrollo

```bash
npm start
```

Abre `http://localhost:4200` en el navegador.

### 3. Comandos utiles

```bash
npm run build    # Build de produccion
npm run watch    # Build en modo watch (development)
npm test         # Ejecutar pruebas unitarias
```

## Como funciona el proyecto

### 1) Flujo de navegacion y acceso

El enrutador define dos zonas principales:

- `/login`: pantalla publica de acceso.
- `''` (layout principal): zona protegida por `authGuard`.

Dentro de la zona protegida:

- todos los usuarios autenticados pueden entrar a `home` y varias vistas de juegos;
- vistas administrativas (`users`, `audit`, `games/developer`, `games/genre`, `games/platform`, `games/review`, `games/tag`) requieren `adminGuard`.

Si una ruta no existe, redirige a la raiz.

```mermaid
flowchart LR
	A[Usuario entra] --> B{Sesion activa?}
	B -- No --> C[/login]
	B -- Si --> D[LayoutShell]
	D --> E[Home y vistas de juegos]
	D --> F{Ruta admin?}
	F -- Si y es admin --> G[Users / Audit / Catalogos]
	F -- No admin --> H[Redireccion a /]
```

### 2) Autenticacion y permisos

La sesion se gestiona en `sessionStorage`:

- `isAuthenticated`: estado de autenticacion;
- `userResponse`: datos del usuario autenticado (incluye token y rol/permisos).

Los guards validan estos datos para:

- permitir o bloquear la navegacion;
- redirigir a `/login` si no hay sesion;
- redirigir a `/` si el usuario no tiene rol de admin en rutas administrativas.

### 3) Consumo de API

`BaseService` centraliza el acceso HTTP:

- construye URLs con `environment.apiBaseUrl`;
- agrega el header `Authorization: Bearer <token>` cuando existe token en sesion;
- encapsula metodos `GET`, `POST`, `PUT`, `DELETE`;
- registra errores HTTP cuando el estado es distinto de `200`.

Servicios especificos (por ejemplo `AuthService`) heredan de `BaseService` para mantener un estilo uniforme.

### 4) Organizacion del codigo

Estructura general:

- `src/app/features/`: paginas por dominio (`home`, `login`, `games`, `users`, `audit`).
- `src/app/services/`: servicios de negocio y acceso a API.
- `src/app/shared/`: guards, layout, navbar/sidebar y utilidades compartidas.
- `src/models/`: modelos tipados usados por la aplicacion.

Ademas, el `App` raiz inicializa el tema visual mediante `ThemeService` al arrancar.

## Notas importantes

- Este repo esta pensado para aprendizaje y pruebas tecnicas.
- Puede incluir decisiones de codigo simplificadas para experimentar mas rapido.
- No representa necesariamente estandares finales de un entorno productivo.

---

## Referencias

- Angular CLI: https://angular.dev/tools/cli
- Angular Docs: https://angular.dev
