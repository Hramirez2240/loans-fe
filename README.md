# Frontend de préstamos

Aplicación Angular para registrar usuarios, enviar solicitudes de préstamo y consultar su estado. Las cuentas administradoras pueden revisar, aprobar o rechazar solicitudes.

## Desarrollo local

El API debe estar disponible en `http://localhost:8080`.

```powershell
npm install
npm start
```

Abre `http://localhost:4200`. Los usuarios pueden crear su cuenta desde la pantalla de inicio. El acceso de administrador se configura en el API.

## Integración con el API

El módulo de préstamos consume:

- `GET` y `POST /api/loans` para consultar y crear solicitudes.
- `GET /api/admin/loans` para listar solicitudes como administrador.
- `PATCH /api/admin/loans/{id}/status` para aprobar o rechazar solicitudes.
- `POST /api/auth/login` y `POST /api/auth/register` para autenticación.

El token JWT se envía en las peticiones protegidas. La autorización del lado del API sigue siendo obligatoria; las guardas del frontend solo controlan el acceso a las vistas.

## Validación

```powershell
npm run build
npm test
```
