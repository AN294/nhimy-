import {
  getProject,
  setProject
} from "/js/core/work/storage.js";

import {
  createDevelopmentPlan
} from "/js/core/work/development/plan.js";

import {
  generateWorkContent
} from "/js/core/work/writing.js";

import {
  initWorkProgress
} from "/js/core/work/flow.js";


const container =
  document.querySelector("#structureContainer");

const continueButton =
  document.querySelector("#continueButton");


let project = getProject();


if (!project) {
  window.location.href = "/trabalhos/criar/";
} else {

  initWorkProgress(project);

  const structure =
    Array.isArray(project.structure)
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

    /*
     * -------------------------------------------------------
     * DEVELOPMENT PLAN
     * -------------------------------------------------------
     * Estrutura real + Research real.
     *
     * Nenhum finding é reconstruído.
     * Nenhum sourceId é recriado.
     * Nenhuma source é perdida.
     * -------------------------------------------------------
     */

    const developmentPlan =
      createDevelopmentPlan({
        structure,
        research: project.research
      });


    /*
     * Persiste o plano completo no projeto.
     */
    project = {
      ...project,
      developmentPlan
    };

    setProject(project);


    /*
     * -------------------------------------------------------
     * CONTENT + WRITING ENGINE
     * -------------------------------------------------------
     * Mantém conteúdo existente.
     * Gera apenas as seções que ainda não possuem texto.
     *
     * Development continua sendo o responsável por:
     * project.content -> Revisar
     * -------------------------------------------------------
     */
    const existingContent =
      typeof project.content === "object" &&
      project.content !== null &&
      !Array.isArray(project.content)
        ? { ...project.content }
        : {};

    const generatedContent =
      generateWorkContent({
        ...project,
        developmentPlan
      });

    const content = {
      ...generatedContent,
      ...existingContent
    };

    project = {
      ...project,
      content
    };

    setProject(project);


    /*
     * -------------------------------------------------------
     * RENDER
     * -------------------------------------------------------
     */
    container.innerHTML =
      developmentPlan.sections
        .map((sectionPlan, index) => {

          const item =
            sectionPlan.section;

          const value =
            typeof content[index] === "string"
              ? content[index]
              : "";


          /*
           * Dados da Research disponíveis para esta seção.
           */
          const findings =
            Array.isArray(sectionPlan.findings)
              ? sectionPlan.findings
              : [];

          const sourceIds =
            Array.isArray(sectionPlan.sourceIds)
              ? sectionPlan.sourceIds
              : [];

          const sources =
            Array.isArray(sectionPlan.sources)
              ? sectionPlan.sources
              : [];

          const evidence =
            Array.isArray(sectionPlan.evidence)
              ? sectionPlan.evidence
              : [];


          /*
           * Evidências são mantidas no DOM como metadados.
           * A escrita continua separada dos dados científicos.
           */
          const researchMetadata =
            escapeHtml(
              JSON.stringify({
                findings,
                sourceIds,
                sources,
                evidence
              })
            );


          return `
            <article
              class="work-development-block"
              data-section-index="${index}"
              data-research="${researchMetadata}"
            >

              <div class="work-development-heading">

                <span class="work-development-number">
                  ${String(index + 1).padStart(2, "0")}
                </span>

                <h3>${escapeHtml(item)}</h3>

              </div>


              ${
                evidence.length
                  ? `
                    <div class="work-development-research">
                      <strong>
                        Evidências da pesquisa:
                      </strong>

                      <span>
                        ${evidence.length}
                        evidência(s) ·
                        ${sourceIds.length}
                        fonte(s) vinculada(s)
                      </span>
                    </div>
                  `
                  : ""
              }


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


    /*
     * -------------------------------------------------------
     * EDITORES
     * -------------------------------------------------------
     */
    const editors =
      container.querySelectorAll(
        ".work-development-editor"
      );


    editors.forEach((editor) => {

      editor.addEventListener("input", () => {

        content[editor.dataset.index] =
          editor.value;

        saveContent(content);

      });

    });


    /*
     * -------------------------------------------------------
     * CONTINUAR
     * -------------------------------------------------------
     */
    continueButton.addEventListener(
      "click",
      () => {

        saveContent(content);

        window.location.href =
          "/trabalhos/revisar/";

      }
    );

  }
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
