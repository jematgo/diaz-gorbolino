(() => {
  const menuButton = document.querySelector(".menu-toggle");
  const menu = document.querySelector("#nav-menu");
  if (menuButton && menu) {
    menuButton.addEventListener("click", () => {
      const isOpen = menu.classList.toggle("open");
      menuButton.setAttribute("aria-expanded", String(isOpen));
      menuButton.setAttribute("aria-label", isOpen ? "Cerrar menú" : "Abrir menú");
    });
    menu.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
      menu.classList.remove("open");
      menuButton.setAttribute("aria-expanded", "false");
      menuButton.setAttribute("aria-label", "Abrir menú");
    }));
  }

  const year = document.querySelector("#year");
  if (year) year.textContent = new Date().getFullYear();

  document.querySelectorAll("[data-topic]").forEach(link => {
    link.addEventListener("click", () => {
      const select = document.querySelector('#contact-form select[name="topic"]');
      if (!select) return;
      const wanted = link.dataset.topic === "Trabajadores"
        ? "Trabajadores — despido o indemnización"
        : "Empresas y empleadores — asesoramiento laboral";
      if ([...select.options].some(option => option.value === wanted || option.text === wanted)) {
        select.value = wanted;
      }
    });
  });

  const form = document.querySelector("#contact-form");
  const status = document.querySelector("#form-status");
  if (form && status) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      status.textContent = "";
      status.classList.remove("error");

      const submit = form.querySelector('button[type="submit"]');
      const token = form.querySelector('[name="cf-turnstile-response"]')?.value;
      if (!token || token === "REEMPLAZAR_CON_TU_TURNSTILE_SITE_KEY") {
        status.textContent = "La protección del formulario todavía no está configurada. Por favor, contáctenos por WhatsApp o correo.";
        status.classList.add("error");
        return;
      }

      submit.disabled = true;
      submit.textContent = "Enviando consulta…";
      try {
        const response = await fetch(form.action, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(Object.fromEntries(new FormData(form).entries()))
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.success) throw new Error(result.message || "No se pudo enviar el mensaje.");
        form.reset();
        if (window.turnstile) window.turnstile.reset();
        status.textContent = "Su consulta fue enviada. Gracias por contactarse con Díaz Gorbolino.";
      } catch (error) {
        status.textContent = error.message || "No pudimos enviar la consulta. Intente nuevamente o utilice los datos de contacto directo.";
        status.classList.add("error");
        if (window.turnstile) window.turnstile.reset();
      } finally {
        submit.disabled = false;
        submit.innerHTML = 'Enviar consulta <span aria-hidden="true">↗</span>';
      }
    });
  }
})();
