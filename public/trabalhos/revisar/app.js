import {
  getProject,
  setProject
} from "/js/core/work/storage.js";

import {
  initWorkProgress
} from "/js/core/work/flow.js";


const container =
  document.querySelector("#reviewContainer");

const continueButton =
  document.querySelector("#continueButton");


const project = getProject();

initWorkProgress(
  project
);


if (!project) {
  window.location.href = "/trabalhos/criar/";
}


const structure =
  Array.isArray(project?.structure)
    ? project.structure
    : [];


const content =
  project?.content &&
  typeof project.content === "object"
    ? project.content
    : {};


if (!structure.length) {

  container.innerHTML = `
    <div class="work-empty">
      <strong>Nenhuma estrutura encontrada.</strong>

      <p>
        Volte às etapas anteriores para construir
        seu trabalho antes de revisá-lo.
      </p>
    </div>
  `;

  continueButton.disabled = true;

} else {

  container.innerHTML = structure
    .map((item, index) => {

      const text =
        typeof content[index] === "string"
          ? content[index].trim()
          : "";

      return `
        <article class="work-review-block">

          <div class="work-review-heading">

            <span class="work-review-number">
              ${String(index + 1).padStart(2, "0")}
            </span>

            <h3>${escapeHtml(item)}</h3>

          </div>

          ${
            text
              ? `
                <div class="work-review-content">
                  ${formatText(text)}
                </div>
              `
              : `
                <div class="work-review-empty">
                  Esta parte ainda não possui conteúdo.
                </div>
              `
          }

          <label class="work-review-check">

            <input
              type="checkbox"
              class="review-check"
              data-index="${index}"
            >

            <span>
              Revisei esta parte.
            </span>

          </label>

        </article>
      `;
    })
    .join("");


  const checks =
    container.querySelectorAll(".review-check");


  checks.forEach((check) => {

    check.addEventListener("change", () => {

      const current =
        getProject();

      if (!current) {
        return;
      }

      const reviewed =
        Array.from(checks).every(
          (item) => item.checked
        );

      setProject({
        ...current,
        reviewed
      });

    });

  });


  continueButton.addEventListener("click", () => {

    const current =
      getProject();

    if (!current) {
      return;
    }

    const reviewed =
      Array.from(checks).every(
        (item) => item.checked
      );

    setProject({
      ...current,
      reviewed
    });

    window.location.href =
      "/trabalhos/finalizar/";

  });

}


function formatText(text) {

  return escapeHtml(text)
    .split(/\n+/)
    .filter(Boolean)
    .map(
      (paragraph) =>
        `<p>${paragraph}</p>`
    )
    .join("");
}


function escapeHtml(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
