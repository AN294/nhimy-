/*
 * =========================================================
 * NHIMY — WORK FLOW
 *
 * Fluxo visual e navegável de Trabalhos.
 * Interpreta o estado atual, mostra o progresso e permite
 * entrar diretamente em qualquer etapa do percurso.
 * =========================================================
 */

const STAGES = [
  { key: "criar", label: "Criar" },
  { key: "orientar", label: "Orientar" },
  { key: "estruturar", label: "Estruturar" },
  { key: "desenvolver", label: "Desenvolver" },
  { key: "revisar", label: "Revisar" },
  { key: "finalizar", label: "Finalizar" }
];

const STAGE_PATHS = Object.fromEntries(
  STAGES.map(stage => [stage.key, `/trabalhos/${stage.key}/`])
);

function hasContent(project) {
  if (!project?.content || typeof project.content !== "object") return false;
  return Object.values(project.content).some(
    value => typeof value === "string" && value.trim().length > 0
  );
}

function getCompletedStages(project) {
  const completed = new Set();
  if (project) completed.add("criar");
  if (project?.orientationReady === true) completed.add("orientar");
  if (Array.isArray(project?.structure) && project.structure.length > 0) completed.add("estruturar");
  if (hasContent(project)) completed.add("desenvolver");
  if (project?.reviewed === true) completed.add("revisar");
  if (project?.finalized === true) completed.add("finalizar");
  return completed;
}

export function getCurrentStage() {
  const element = document.querySelector(".work-progress");
  return element?.dataset.currentStage || "";
}

function makeStepNavigable(step, stage) {
  if (!step || !stage || step.dataset.navigationReady === "true") return;

  const href = STAGE_PATHS[stage.key];
  step.dataset.href = href;
  step.dataset.navigationReady = "true";
  step.setAttribute("role", "link");
  step.setAttribute("tabindex", "0");
  step.setAttribute("aria-label", `Abrir etapa ${stage.label}`);

  const go = event => {
    event.preventDefault();
    window.location.href = href;
  };

  step.addEventListener("click", go);
  step.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") go(event);
  });
}

export function updateWorkProgress(project) {
  const progress = document.querySelector(".work-progress");
  if (!progress) return;

  const currentStage = getCurrentStage();
  const completed = getCompletedStages(project);
  const currentIndex = STAGES.findIndex(stage => stage.key === currentStage);
  const steps = progress.querySelectorAll(".work-progress-step");

  steps.forEach((step, index) => {
    const stage = STAGES[index];
    if (!stage) return;

    makeStepNavigable(step, stage);
    step.classList.remove("active", "completed");

    if (currentStage === stage.key) {
      step.classList.add("active");
      step.setAttribute("aria-current", "step");
      return;
    }

    step.removeAttribute("aria-current");
    if (completed.has(stage.key) && index < currentIndex) {
      step.classList.add("completed");
    }
  });
}

export function initWorkProgress(project) {
  updateWorkProgress(project);
}
