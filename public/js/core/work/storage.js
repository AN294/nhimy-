/*
 * =========================================================
 * NHIMY — WORK STORAGE
 *
 * Fonte central do estado de Trabalhos.
 *
 * Nenhum módulo de Trabalhos deve acessar
 * diretamente o sessionStorage.
 * =========================================================
 */

const KEY = "nhimy.work.project";


function read() {
  const stored = sessionStorage.getItem(KEY);

  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored);
  } catch (error) {
    console.error(
      "Erro ao ler estado do trabalho.",
      error
    );

    return null;
  }
}


function write(project) {
  sessionStorage.setItem(
    KEY,
    JSON.stringify(project)
  );
}


function createProject(data = {}) {
  return {
    title:
      typeof data.title === "string"
        ? data.title.trim()
        : "",

    subject:
      typeof data.subject === "string"
        ? data.subject.trim()
        : "",

    type:
      typeof data.type === "string"
        ? data.type
        : "",

    orientation:
      typeof data.orientation === "string"
        ? data.orientation
        : "",

    orientationContext:
      typeof data.orientationContext === "string"
        ? data.orientationContext
        : "",

    orientationReady:
      data.orientationReady === true,

    structure:
      Array.isArray(data.structure)
        ? [...data.structure]
        : [],

    content:
      data.content &&
      typeof data.content === "object" &&
      !Array.isArray(data.content)
        ? { ...data.content }
        : {},

    reviewed:
      data.reviewed === true,

    finalized:
      data.finalized === true
  };
}


function getProject() {
  return read();
}


function setProject(project) {
  if (
    !project ||
    typeof project !== "object"
  ) {
    return false;
  }

  write(project);

  return true;
}


function clearProject() {
  sessionStorage.removeItem(KEY);
}


export {
  KEY,
  createProject,
  getProject,
  setProject,
  clearProject
};
