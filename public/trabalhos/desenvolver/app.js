import {
  getProject,
  setProject
} from "/js/core/work/storage.js";

import {
  initWorkProgress
} from "/js/core/work/flow.js";


const container =
  document.querySelector("#structureContainer");

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


if (!structure.length) {
  container.innerHTML = `
    <div class="work-empty">
      <strong>Nenhuma estrutura encontrada.</strong>
      <p>
        Volte à etapa anterior e defina as partes
        do seu trabalho antes de começar a desenvolver.
      </p>
    </div>
  `;

  continueButton.disabled = true;

} else {

  const content =
    typeof project.content === "object" &&
    project.content !== null
      ? { ...project.content }
      : {};

  container.innerHTML = structure
    .map((item, index) => {

      const value =
        typeof content[index] === "string"
          ? content[index]
          : "";

      return `
        <article class="work-development-block">

          <div class="work-development-heading">
            <span class="work-development-number">
              ${String(index + 1).padStart(2, "0")}
            </span>

            <h3>${escapeHtml(item)}</h3>
          </div>

          <textarea
            class="work-development-editor"
            data-index="${index}"
            rows="10"
            placeholder="Desenvolva esta parte do seu trabalho..."
          >${escapeHtml(value)}</textarea>

        </article>
      `;
    })
    .join("");


  const editors =
    container.querySelectorAll(".work-development-editor");


  editors.forEach((editor) => {

    editor.addEventListener("input", () => {

      content[editor.dataset.index] =
        editor.value;

      saveContent(content);
    });

  });


  continueButton.addEventListener("click", () => {

    saveContent(content);

    window.location.href =
      "/trabalhos/revisar/";

  });

}


function saveContent(content) {

  const current =
    getProject();

  if (!current) {
    return false;
  }

  return setProject({
    ...current,
    content
  });
}


function escapeHtml(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
