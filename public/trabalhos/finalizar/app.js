import {
  getProject,
  setProject
} from "/js/core/work/storage.js";

import {
  initWorkProgress
} from "/js/core/work/flow.js";


const titleElement =
  document.querySelector("#workTitle");

const metaElement =
  document.querySelector("#workMeta");

const contentElement =
  document.querySelector("#finalContent");

const statusElement =
  document.querySelector("#finalStatus");

const finishButton =
  document.querySelector("#finishButton");


const project = getProject();

initWorkProgress(
  project
);


if (!project) {
  window.location.href = "/trabalhos/criar/";
}


function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function render() {

  if (!project) {
    return;
  }

  titleElement.textContent =
    project.title || "Seu trabalho";

  metaElement.textContent =
    project.subject
      ? project.subject
      : "Trabalho acadêmico";


  const structure =
    Array.isArray(project.structure)
      ? project.structure
      : [];


  const content =
    project.content &&
    typeof project.content === "object"
      ? project.content
      : {};


  if (!structure.length) {

    contentElement.innerHTML = `
      <div class="work-empty">
        <strong>Nenhuma estrutura encontrada.</strong>

        <p>
          Volte às etapas anteriores para construir
          seu trabalho antes de finalizar.
        </p>
      </div>
    `;

    finishButton.disabled = true;

    return;
  }


  contentElement.innerHTML =
    structure
      .map((item, index) => {

        const text =
          typeof content[index] === "string"
            ? content[index].trim()
            : "";

        return `
          <article class="work-final-block">

            <div class="work-final-heading">

              <span class="work-final-number">
                ${String(index + 1).padStart(2, "0")}
              </span>

              <h3>${escapeHtml(item)}</h3>

            </div>

            <div class="work-final-text">
              ${
                text
                  ? escapeHtml(text)
                      .split(/\\n+/)
                      .filter(Boolean)
                      .map(
                        paragraph => `<p>${paragraph}</p>`
                      )
                      .join("")
                  : `
                    <p class="work-final-empty">
                      Esta parte ainda não possui conteúdo.
                    </p>
                  `
              }
            </div>

          </article>
        `;
      })
      .join("");


  if (project.finalized) {

    statusElement.innerHTML = `
      <strong>✓ Trabalho finalizado</strong>

      <span>
        Este trabalho já foi marcado como finalizado.
      </span>
    `;

    finishButton.disabled = true;

  } else {

    statusElement.innerHTML = `
      <strong>Pronto para finalizar</strong>

      <span>
        Confira o conteúdo acima antes de concluir.
      </span>
    `;

  }

}


finishButton.addEventListener("click", () => {

  const current =
    getProject();

  if (!current) {
    return;
  }

  setProject({
    ...current,
    finalized: true
  });

  render();

});


render();
