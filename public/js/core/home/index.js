import { getHomeState } from "./state.js";

const HOME_ROUTES = {
  home: "/",
  estudar: "/estudar/",
  resumir: "/estudar/resumir/",
  explicar: "/estudar/explicar/",
  flashcards: "/estudar/flashcards/",
  quiz: "/estudar/quiz/",
  revisar: "/estudar/revisar/",
  trabalhos: "/trabalhos/",
  criarTrabalho: "/trabalhos/criar/",
  organizar: "/organizar/",
  tarefas: "/organizar/tarefas/",
  metas: "/organizar/metas/",
  notas: "/organizar/notas/",
  agenda: "/organizar/agenda/",
  ferramentas: "/ferramentas/"
};

function buildSuggestions(state) {
  const suggestions = [];

  if (state.work.project && state.work.current) {
    suggestions.push({
      id: "continue-work",
      type: "work",
      title: "Continuar trabalho",
      description: state.work.project.title || "Continuar o teu trabalho",
      action: "Continuar →",
      href: state.work.current.path
    });
  }

  if (state.study.summary && !state.study.reviewed) {
    suggestions.push({
      id: "review-study",
      type: "study",
      title: "Revisar conteúdo",
      description: "Há conteúdo pronto para revisão.",
      action: "Revisar →",
      href: HOME_ROUTES.revisar
    });
  }

  if (
    state.study.summary &&
    !state.study.quizCompleted
  ) {
    suggestions.push({
      id: "practice-study",
      type: "study",
      title: "Praticar o que estudaste",
      description: "Testa os teus conhecimentos.",
      action: "Fazer quiz →",
      href: HOME_ROUTES.quiz
    });
  }

  if (state.organize.counts.pendingTasks > 0) {
    suggestions.push({
      id: "pending-tasks",
      type: "organize",
      title: "Ver tarefas pendentes",
      description:
        `${state.organize.counts.pendingTasks} tarefa(s) por concluir.`,
      action: "Ver tarefas →",
      href: HOME_ROUTES.tarefas
    });
  }

  if (state.organize.counts.activeGoals > 0) {
    suggestions.push({
      id: "active-goals",
      type: "organize",
      title: "Acompanhar metas",
      description:
        `${state.organize.counts.activeGoals} meta(s) ativa(s).`,
      action: "Ver metas →",
      href: HOME_ROUTES.metas
    });
  }

  return suggestions.slice(0, 4);
}

export function getHomeModel() {
  const state = getHomeState();

  return {
    state,

    routes: HOME_ROUTES,

    suggestions: buildSuggestions(state),

    quickActions: [
      {
        id: "resumir",
        label: "Resumir",
        href: HOME_ROUTES.resumir
      },
      {
        id: "explicar",
        label: "Explicar",
        href: HOME_ROUTES.explicar
      },
      {
        id: "flashcards",
        label: "Flashcards",
        href: HOME_ROUTES.flashcards
      },
      {
        id: "quiz",
        label: "Quiz",
        href: HOME_ROUTES.quiz
      }
    ]
  };
}
