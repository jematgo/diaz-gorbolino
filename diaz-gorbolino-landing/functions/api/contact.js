const MAX_BODY = 12000;
const ALLOWED_TOPICS = new Set([
  "Trabajadores — despido o indemnización",
  "Trabajadores — salarios o registración laboral",
  "Trabajadores — accidente laboral / ART",
  "Empresas y empleadores — asesoramiento laboral",
  "Empresas y empleadores — conflicto o desvinculación",
  "Otro motivo / no estoy seguro"
]);

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff"
    }
  });
}

function clean(value, max) {
  return String(value ?? "").trim().replace(/\u0000/g, "").slice(0, max);
}

export async function onRequestPost({ request, env }) {
  if (request.method !== "POST") return json({ success: false, message: "Método no permitido." }, 405);

  const origin = request.headers.get("Origin");
  const requestUrl = new URL(request.url);
  if (origin) {
    try {
      if (new URL(origin).host !== requestUrl.host) {
        return json({ success: false, message: "Solicitud no válida." }, 403);
      }
    } catch {
      return json({ success: false, message: "Solicitud no válida." }, 403);
    }
  }

  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return json({ success: false, message: "Formato de solicitud no válido." }, 415);
  }

  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > MAX_BODY) return json({ success: false, message: "El mensaje es demasiado grande." }, 413);

  let data;
  try {
    data = await request.json();
  } catch {
    return json({ success: false, message: "No se pudo leer el formulario." }, 400);
  }

  // Campo señuelo para bots. Se responde como si se hubiera enviado, sin procesar el mensaje.
  if (clean(data.website, 200)) return json({ success: true });

  const name = clean(data.name, 100);
  const email = clean(data.email, 160);
  const phone = clean(data.phone, 40);
  const topic = clean(data.topic, 80);
  const message = clean(data.message, 2500);
  const token = clean(data["cf-turnstile-response"], 2048);
  const privacy = data.privacy === "on" || data.privacy === "true";

  if (!name || !email || !topic || !message || !privacy) {
    return json({ success: false, message: "Complete los campos obligatorios y acepte el aviso de privacidad." }, 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ success: false, message: "Revise el correo electrónico ingresado." }, 400);
  }
  if (!ALLOWED_TOPICS.has(topic)) return json({ success: false, message: "Seleccione un motivo válido." }, 400);
  if (!token) return json({ success: false, message: "Complete la verificación antispam." }, 400);

  if (!env.TURNSTILE_SECRET_KEY || !env.RESEND_API_KEY || !env.CONTACT_TO || !env.CONTACT_FROM) {
    return json({ success: false, message: "El formulario aún no está configurado por el administrador." }, 503);
  }

  // Validación obligatoria del token en el servidor.
  let verification;
  try {
    const verifyResponse = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        secret: env.TURNSTILE_SECRET_KEY,
        response: token,
        remoteip: request.headers.get("CF-Connecting-IP") || undefined
      })
    });
    verification = await verifyResponse.json();
  } catch {
    return json({ success: false, message: "No pudimos verificar la protección antispam. Intente nuevamente." }, 502);
  }

  if (!verification.success || (verification.hostname && !["diazgorbolino.com", "www.diazgorbolino.com"].includes(verification.hostname))) {
    return json({ success: false, message: "La verificación expiró o no fue válida. Intente nuevamente." }, 400);
  }

  // Escapar contenido para evitar que texto del usuario se interprete como HTML en el correo.
  const escapeHtml = (s) => s.replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
  const html = `
    <h2>Nueva consulta desde diazgorbolino.com</h2>
    <p><strong>Nombre:</strong> ${escapeHtml(name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(email)}</p>
    <p><strong>Teléfono:</strong> ${escapeHtml(phone || "No informado")}</p>
    <p><strong>Motivo:</strong> ${escapeHtml(topic)}</p>
    <p><strong>Mensaje:</strong><br>${escapeHtml(message).replace(/\n/g, "<br>")}</p>
    <hr><p>El remitente aceptó el aviso de privacidad del sitio.</p>
  `;

  let mailResponse;
  try {
    mailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: env.CONTACT_FROM,
        to: [env.CONTACT_TO],
        reply_to: email,
        subject: `Consulta web — ${topic}`,
        html
      })
    });
  } catch {
    return json({ success: false, message: "No se pudo enviar el correo. Intente más tarde o contáctenos por otra vía." }, 502);
  }

  if (!mailResponse.ok) {
    // No devolver al visitante detalles internos ni credenciales del proveedor.
    return json({ success: false, message: "No se pudo enviar la consulta en este momento. Intente más tarde." }, 502);
  }

  return json({ success: true });
}
