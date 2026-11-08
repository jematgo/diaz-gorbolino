# Díaz Gorbolino — Landing page

Landing estática para Cloudflare Pages con HTML/CSS/JS, formulario de contacto vía Pages Function, Cloudflare Turnstile y envío de correo mediante Resend.

## Antes de publicar: personalización obligatoria

Busca y reemplaza en `index.html`:
- `549XXXXXXXXXX` por el número de WhatsApp en formato internacional, solo números (Argentina: 54 + código de área + número; para celular suele incluir 9 después de 54).
- `[Completar dirección del estudio]`, `[Completar días y horarios]`, `[Ciudad, provincia, Argentina]`.
- `contacto@diazgorbolino.com` si el estudio utiliza otro correo.
- Las tres áreas de práctica genéricas por las áreas reales del estudio.
- El texto y el enlace de Google Maps. El bloque actual es un marcador visual, no un mapa funcional.
- En el formulario, `REEMPLAZAR_CON_TU_TURNSTILE_SITE_KEY` por la site key real de Turnstile.

Revisa `privacidad.html` con el estudio antes de publicarlo. Es un borrador, no asesoramiento legal.

## Formulario: dependencias

El formulario no enviará correos hasta configurar:
1. Una cuenta de Cloudflare y un widget Turnstile para `diazgorbolino.com` y `www.diazgorbolino.com`.
2. Una cuenta de Resend y un dominio/correo remitente verificado según las instrucciones actuales de Resend.
3. Variables de entorno/secretos para la Pages Function:
   - `TURNSTILE_SECRET_KEY` (secret)
   - `RESEND_API_KEY` (secret)
   - `CONTACT_TO` (dirección que recibirá consultas)
   - `CONTACT_FROM` (remitente verificado, por ejemplo `Web Díaz Gorbolino <web@tu-dominio-verificado.com>`)

No pongas claves secretas dentro de `index.html`, `script.js` ni en GitHub.

## Publicación recomendada

Usa Cloudflare Pages con integración de Git, porque este proyecto usa `functions/api/contact.js`.
1. Crea un repositorio privado en GitHub y sube los archivos manteniendo la estructura:
   - `index.html`
   - `styles.css`
   - `script.js`
   - `_headers`
   - `privacidad.html`
   - `functions/api/contact.js`
2. Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git.
3. Selecciona el repositorio.
4. Framework preset: None. Build command: `exit 0`. Build output directory: `/` si el panel lo admite; si no, usa un directorio de publicación como `public` y mueve ahí los archivos estáticos, conservando `functions/` en la raíz del proyecto. La estructura exacta de funciones depende de la configuración de Pages.
5. Completa el deploy. Prueba primero la URL `*.pages.dev`.
6. En la configuración del proyecto, agrega variables de entorno y secretos para producción y vuelve a desplegar.
7. En Pages → Custom domains, agrega `diazgorbolino.com` y sigue el asistente. Para el dominio raíz, Cloudflare puede requerir que la zona y los nameservers estén gestionados por Cloudflare.
8. Configura también `www.diazgorbolino.com` si lo van a usar y crea una redirección hacia la URL canónica elegida.
9. Crea el widget Turnstile para ambos hostnames, copia la site key al HTML y guarda la secret key como secreto de entorno.

Consulta la guía oficial de Cloudflare Pages para HTML estático y dominios personalizados:
- https://developers.cloudflare.com/pages/framework-guides/deploy-anything/
- https://developers.cloudflare.com/pages/configuration/custom-domains/
- https://developers.cloudflare.com/turnstile/get-started/

## Seguridad y pruebas previas a publicar

- Verifica que HTTPS funcione y fuerza la URL canónica.
- Comprueba que el formulario rechace envíos sin token Turnstile.
- Prueba envío real con un correo autorizado y confirma que la respuesta llega al destinatario.
- Configura alertas/analítica y límites de abuso en Cloudflare; no existe protección absoluta.
- Revisa periódicamente los logs de errores sin guardar innecesariamente el contenido de consultas.
- Revisa `privacidad.html`, el consentimiento y el tratamiento de datos con el estudio.
- No solicites por este formulario documentación sensible. No hay almacenamiento de consultas en una base de datos en este proyecto: se remiten por email.
- La configuración `_headers` incluye cabeceras de seguridad iniciales. Ajusta la Content Security Policy si agregas otros servicios, mapas embebidos o herramientas de analítica.

## Mapa de Google

En Google Maps, abre la dirección correcta → Compartir → Insertar un mapa → copia el iframe. Sustituye el bloque `.map-placeholder` en `index.html`. Revisa la política de privacidad si se carga contenido de terceros.

## Limitación importante

La función implementa validación de datos, honeypot, comprobación de origen y verificación server-side de Turnstile. Para reducir abuso avanzado, añade reglas de rate limiting disponibles en tu configuración de Cloudflare y monitorea el servicio. No es una garantía absoluta contra spam.
