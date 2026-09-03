import {
  getSummary,
  isReviewed,
  isQuizCompleted,
  getQuizResult
} from "../study/storage.js";

import {
  getProject
} from "../work/storage.js";

import {
  getState as getOrganizeState
} from "../organize/storage.js";

function getWorkStages(project) {
  if (!project) {
    return {
      stages: [],
      completed: [],
      current: null,
      progress: 0
    };
  }

  const stages = [
    {
      id: "criar",
      label: "Criar",
      path: "/trabalhos/criar/",
      done: true
    },
    {
      id: "orientar",
      label: "Orientar",
      path: "/trabalhos/orientar/",
      done: project.orientationReady === true
    },
    {
      id: "estruturar",
      label: "Estruturar",
      path: "/trabalhos/estruturar/",
      done: Array.isArray(project.structure) &&
        project.structure.length > 0
    },
    {
      id: "desenvolver",
      label: "Desenvolver",
      path: "/trabalhos/desenvolver/",
      done: typeof project.content === "string" &&
        project.content.trim().length > 0
    },
    {
      id: "revisar",
      label: "Revisar",
      path: "/trabalhos/revisar/",
      done: project.reviewed === true
    },
    {
      id: "finalizar",
      label: "Finalizar",
      path: "/trabalhos/finalizar/",
      done: project.finalized === true
    }
  ];

  const completed = stages.filter(stage => stage.done);
  const current = stages.find(stage => !stage.done) || stages[stages.length - 1];

  return {
    stages,
    completed,
    current,
    progress: Math.round(
      (completed.length / stages.length) * 100
    )
  };
}

function getStudyState() {
  const summary = getSummary();
  const reviewed = isReviewed();
  const quizCompleted = isQuizCompleted();
  const quizResult = getQuizResult();

  const completed = [
    Boolean(summary),
    reviewed,
    quizCompleted
  ].filter(Boolean).length;

  return {
    summary,
    reviewed,
    quizCompleted,
    quizResult,
    completed,
    total: 3,
    progress: Math.round((completed / 3) * 100)
  };
}

function getOrganizeData() {
  const state = getOrganizeState() || {};

  const tasks = Array.isArray(state.tasks)
    ? state.tasks
    : [];

  const goals = Array.isArray(state.goals)
    ? state.goals
    : [];

  const notes = Array.isArray(state.notes)
    ? state.notes
    : [];

  const events = Array.isArray(state.events)
    ? state.events
    : [];

  const pendingTasks = tasks.filter(
    task => task.completed !== true
  );

  const activeGoals = goals.filter(
    goal => goal.completed !== true
  );

  const now = Date.now();

  const upcomingEvents = events.filter(event => {
    if (event.completed === true) {
      return false;
    }

    const value =
      event.datetime ||
      event.date ||
      event.start ||
      event.startAt;

    if (!value) {
      return true;
    }

    const time = new Date(value).getTime();

    return Number.isNaN(time) || time >= now;
  });

  return {
    state,
    tasks,
    goals,
    notes,
    events,
    pendingTasks,
    activeGoals,
    upcomingEvents,
    counts: {
      pendingTasks: pendingTasks.length,
      activeGoals: activeGoals.length,
      notes: notes.length,
      upcomingEvents: upcomingEvents.length
    }
  };
}

export function getHomeState() {
  const project = getProject();
  const work = getWorkStages(project);
  const study = getStudyState();
  const organize = getOrganizeData();

  return {
    study,
    work: {
      project,
      ...work
    },
    organize
  };
}
