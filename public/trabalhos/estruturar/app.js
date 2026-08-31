import {
  getProject,
  setProject
} from "/js/core/work/storage.js";

import {
  initWorkProgress
} from "/js/core/work/flow.js";

import {
  suggestStructure,
  suggestResearchStructure
} from "/js/core/work/structure.js";


const project = getProject();

initWorkProgress(
  project
);

const projectTitle = document.querySelector("#projectTitle");
const projectInfo = document.querySelector("#projectInfo");

const sectionTitle = document.querySelector("#sectionTitle");
const addSection = document.querySelector("#addSection");
const structureList = document.querySelector("#structureList");
const continueButton = document.querySelector("#continueButton");


if (!project) {
  window.location.href = "/trabalhos/criar/";
}


if (project) {

  projectTitle.textContent =
    project.title || "Seu trabalho";

  projectInfo.textContent =
    project.subject
      ? `Disciplina: ${project.subject}`
      : "Organize a sequência que fará sentido para o seu trabalho.";

}


let structure = Array.isArray(project?.structure)
  ? [...project.structure]
  : [];


  if (!structure.length) {

    let suggested = [];

    /*
     * Research tem prioridade quando
     * a pesquisa já foi concluída.
     */
    if (
      project?.researchReady === true &&
      project?.research &&
      typeof project.research === "object"
    ) {
      suggested =
        suggestResearchStructure(
          project.research
        );
    }

    /*
     * Fallback para a estrutura tradicional.
     */
    if (
      !Array.isArray(suggested) ||
      !suggested.length
    ) {
      if (
        project?.orientationReady === true
      ) {
        suggested =
          suggestStructure({
            type: project.type,
            orientation: project.orientation,
            orientationContext:
              project.orientationContext
          });
      }
    }

    if (
      Array.isArray(suggested) &&
      suggested.length
    ) {
      structure = [...suggested];

      setProject({
        ...project,
        structure
      });
    }
  }



function renderStructure() {

  structureList.innerHTML = "";

  if (!structure.length) {
    structureList.innerHTML = `
      <div class="work-empty-state">
        <strong>Seu trabalho ainda não tem capítulos.</strong>
        <small>Adicione o primeiro tópico para começar.</small>
      </div>
    `;

    return;
  }


  structure.forEach((item, index) => {

    const element = document.createElement("div");

    element.className = "work-structure-item";

    element.innerHTML = `
      <span class="work-structure-number">
        ${String(index + 1).padStart(2, "0")}
      </span>

      <strong></strong>

      <button
        type="button"
        class="work-remove"
        aria-label="Remover tópico"
      >
        ×
      </button>
    `;

    element.querySelector("strong").textContent = item;

    element
      .querySelector(".work-remove")
      .addEventListener("click", () => {

        structure.splice(index, 1);

        saveStructure();
        renderStructure();

      });

    structureList.appendChild(element);

  });

}


function saveStructure() {

  const updatedProject = {
    ...project,
    structure
  };

  setProject(updatedProject);

}


function addNewSection() {

  const value = sectionTitle.value.trim();

  if (!value) {
    sectionTitle.focus();
    return;
  }

  structure.push(value);

  saveStructure();

  sectionTitle.value = "";

  renderStructure();

  sectionTitle.focus();

}


addSection.addEventListener(
  "click",
  addNewSection
);


sectionTitle.addEventListener(
  "keydown",
  (event) => {

    if (event.key === "Enter") {

      event.preventDefault();

      addNewSection();

    }

  }
);


continueButton.addEventListener(
  "click",
  () => {

    saveStructure();

    window.location.href =
      "/trabalhos/desenvolver/";

  }
);


renderStructure();
