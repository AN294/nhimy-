"use strict";

/*
 * NHIMY 3.0 — ASSINATURA DE ENTRADA
 *
 * Responsabilidade:
 * Controlar exclusivamente a experiência de abertura
 * do NHIMY. Não interfere na lógica das ferramentas.
 */

(() => {
  const INTRO_KEY = "nhimy_intro_shown";
  const AUTO_ENTER_DELAY = 12000;

  const intro = document.getElementById("nhimyIntro");

  if (!intro) return;

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const alreadyShown =
    sessionStorage.getItem(INTRO_KEY) === "1";

  if (alreadyShown) {
    intro.remove();
    return;
  }

  let entered = false;
  let timer = null;

  const enterNHIMY = () => {
    if (entered) return;

    entered = true;

    if (timer) {
      clearTimeout(timer);
      timer = null;
    }

    sessionStorage.setItem(INTRO_KEY, "1");

    intro.classList.add("is-leaving");

    window.setTimeout(() => {
      intro.remove();
    }, reduceMotion ? 120 : 650);
  };

  intro.addEventListener("click", (event) => {
    if (
      event.target.closest(".nhimy-intro-skip")
    ) {
      enterNHIMY();
    }
  });

  if (reduceMotion) {
    window.setTimeout(enterNHIMY, 120);
    return;
  }

  timer = window.setTimeout(
    enterNHIMY,
    AUTO_ENTER_DELAY
  );
})();
