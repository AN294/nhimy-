/*
 * =========================================================
 * NHIMY — WORK FLOW
 *
 * Camada visual do fluxo de Trabalhos.
 *
 * Não altera o projeto.
 * Não grava estado.
 * Apenas interpreta o estado atual e atualiza
 * visualmente o progresso da experiência.
 * =========================================================
 */

const STAGES = [
  {
    key: "criar",
    label: "Criar"
  },
  {
    key: "orientar",
    label: "Orientar"
  },
  {
    key: "estruturar",
    label: "Estruturar"
  },
  {
    key: "desenvolver",
    label: "Desenvolver"
  },
  {
    key: "revisar",
    label: "Revisar"
  },
  {
    key: "finalizar",
    label: "Finalizar"
  }
];


function hasContent(project) {
  if (
    !project?.content ||
    typeof project.content !== "object"
  ) {
    return false;
  }

  return Object.values(project.content).some(
    value =>
      typeof value === "string" &&
      value.trim().length > 0
  );
}


function getCompletedStages(project) {
  const completed = new Set();

  if (project) {
    completed.add("criar");
  }

  if (project?.orientationReady === true) {
    completed.add("orientar");
  }

  if (
    Array.isArray(project?.structure) &&
    project.structure.length > 0
  ) {
    completed.add("estruturar");
  }

  if (hasContent(project)) {
    completed.add("desenvolver");
  }

  if (project?.reviewed === true) {
    completed.add("revisar");
  }

  if (project?.finalized === true) {
    completed.add("finalizar");
  }

  return completed;
}


function getCurrentStage() {
  const element = document.querySelector(
    ".work-progress"
  );

  return element?.dataset.currentStage || "";
}


export function updateWorkProgress(project) {
  const progress = document.querySelector(
    ".work-progress"
  );

  if (!progress) {
    return;
  }

  const currentStage = getCurrentStage();
  const completed = getCompletedStages(project);

  const currentIndex = STAGES.findIndex(
    stage => stage.key === currentStage
  );

  const steps = progress.querySelectorAll(
    ".work-progress-step"
  );

  steps.forEach((step, index) => {
    const stage = STAGES[index];

    if (!stage) {
      return;
    }

    step.classList.remove(
      "active",
      "completed"
    );

    if (
      currentStage === stage.key
    ) {
      step.classList.add("active");
      return;
    }

    if (
      completed.has(stage.key) &&
      index < currentIndex
    ) {
      step.classList.add("completed");
    }
  });
}


export function initWorkProgress(project) {
  updateWorkProgress(project);
}
