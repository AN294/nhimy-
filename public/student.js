/* =====================================================
   NHIMY ESTUDANTE 1.0
   Ferramentas locais para estudantes
   ===================================================== */

(() => {
  "use strict";

  const tools = {
    resumo: {
      title: "Resumo de texto",
      description:
        "Cole um texto e obtenha uma versão mais curta, organizada e fácil de estudar."
    },

    perguntas: {
      title: "Perguntas de revisão",
      description:
        "Transforme um texto em perguntas para testar a sua compreensão."
    },

    plano: {
      title: "Plano de estudo",
      description:
        "Organize uma sessão de estudo com objetivo, tempo e etapas."
    },

    trabalho: {
      title: "Estrutura de trabalho",
      description:
        "Crie uma estrutura inicial para organizar um trabalho escolar."
    }
  };

  function normalizeText(text) {
    return String(text || "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function splitSentences(text) {
    return normalizeText(text)
      .split(/(?<=[.!?])\s+/)
      .map((sentence) => sentence.trim())
      .filter(Boolean);
  }

  function getWords(text) {
    return normalizeText(text)
      .split(/\s+/)
      .filter(Boolean);
  }

  function createSummary(text) {
    const sentences = splitSentences(text);

    if (!sentences.length) {
      return "Digite ou cole um texto para criar o resumo.";
    }

    if (sentences.length <= 3) {
      return sentences.join(" ");
    }

    const selected = sentences.slice(
      0,
      Math.max(3, Math.ceil(sentences.length * 0.35))
    );

    return selected.join(" ");
  }

  function createQuestions(text) {
    const sentences = splitSentences(text);

    if (!sentences.length) {
      return "Digite ou cole um texto para gerar perguntas.";
    }

    const questions = [];

    sentences.slice(0, 8).forEach((sentence, index) => {
      const clean = sentence.replace(/[.!?]+$/, "");

      questions.push(
        `${index + 1}. Qual é a ideia principal apresentada em: "${clean}"?`
      );
    });

    questions.push(
      `${questions.length + 1}. Quais são os conceitos mais importantes do texto?`
    );

    questions.push(
      `${questions.length + 1}. Como você explicaria este conteúdo com as suas próprias palavras?`
    );

    return questions.join("\n\n");
  }

  function createStudyPlan(subject, goal, minutes) {
    const safeSubject = normalizeText(subject) || "a matéria";
    const safeGoal = normalizeText(goal) || "compreender o conteúdo";

    let time = Number(minutes);

    if (!Number.isFinite(time) || time < 15) {
      time = 30;
    }

    const review = Math.max(5, Math.round(time * 0.2));
    const study = Math.max(10, Math.round(time * 0.5));
    const practice = Math.max(5, time - review - study);

    return [
      `PLANO DE ESTUDO — ${safeSubject}`,
      "",
      `Objetivo: ${safeGoal}`,
      `Tempo disponível: ${time} minutos`,
      "",
      `1. Preparação — ${review} min`,
      "• Organize o material.",
      "• Defina o que precisa aprender.",
      "",
      `2. Estudo principal — ${study} min`,
      "• Leia o conteúdo com atenção.",
      "• Anote os conceitos principais.",
      "• Marque as partes que não compreendeu.",
      "",
      `3. Prática e revisão — ${practice} min`,
      "• Responda perguntas sobre o conteúdo.",
      "• Explique o que aprendeu sem consultar o material.",
      "• Anote o que precisa revisar depois."
    ].join("\n");
  }

  function createWorkStructure(subject, topic, level) {
    const safeSubject = normalizeText(subject) || "Disciplina";
    const safeTopic = normalizeText(topic) || "Tema do trabalho";
    const safeLevel = normalizeText(level) || "Ensino geral";

    return [
      "ESTRUTURA DE TRABALHO ESCOLAR",
      "",
      `Disciplina: ${safeSubject}`,
      `Tema: ${safeTopic}`,
      `Nível: ${safeLevel}`,
      "",
      "1. CAPA",
      "• Nome da instituição",
      "• Nome do aluno",
      "• Disciplina",
      "• Tema",
      "• Professor",
      "• Local e ano",
      "",
      "2. INTRODUÇÃO",
      "• Apresentação do tema",
      "• Contextualização",
      "• Objetivo do trabalho",
      "",
      "3. DESENVOLVIMENTO",
      "• Conceitos principais",
      "• Informações e explicações",
      "• Exemplos relacionados ao tema",
      "• Análise do conteúdo",
      "",
      "4. CONCLUSÃO",
      "• Principais pontos aprendidos",
      "• Síntese das ideias",
      "• Considerações finais",
      "",
      "5. REFERÊNCIAS",
      "• Livros, artigos, sites ou outras fontes utilizadas."
    ].join("\n");
  }

  function copyText(text, button) {
    if (!text) return;

    navigator.clipboard
      .writeText(text)
      .then(() => {
        if (!button) return;

        const original = button.textContent;
        button.textContent = "Copiado!";

        setTimeout(() => {
          button.textContent = original;
        }, 1400);
      })
      .catch(() => {
        window.prompt("Copie o resultado:", text);
      });
  }

  function createCard(toolId) {
    const tool = tools[toolId];

    const article = document.createElement("article");
    article.className = "student-tool";
    article.dataset.studentTool = toolId;

    const title = document.createElement("h3");
    title.textContent = tool.title;

    const description = document.createElement("p");
    description.textContent = tool.description;

    article.append(title, description);

    if (toolId === "resumo") {
      const textarea = document.createElement("textarea");
      textarea.placeholder = "Cole aqui o texto que deseja resumir...";
      textarea.rows = 7;

      const button = document.createElement("button");
      button.type = "button";
      button.textContent = "Criar resumo";

      const result = document.createElement("div");
      result.className = "student-result";
      result.hidden = true;

      const copy = document.createElement("button");
      copy.type = "button";
      copy.textContent = "Copiar resumo";

      button.addEventListener("click", () => {
        result.textContent = createSummary(textarea.value);
        result.hidden = false;
      });

      copy.addEventListener("click", () => {
        copyText(result.textContent, copy);
      });

      article.append(textarea, button, result, copy);
    }

    if (toolId === "perguntas") {
      const textarea = document.createElement("textarea");
      textarea.placeholder = "Cole aqui o conteúdo que está estudando...";
      textarea.rows = 7;

      const button = document.createElement("button");
      button.type = "button";
      button.textContent = "Gerar perguntas";

      const result = document.createElement("div");
      result.className = "student-result";
      result.hidden = true;

      const copy = document.createElement("button");
      copy.type = "button";
      copy.textContent = "Copiar perguntas";

      button.addEventListener("click", () => {
        result.textContent = createQuestions(textarea.value);
        result.hidden = false;
      });

      copy.addEventListener("click", () => {
        copyText(result.textContent, copy);
      });

      article.append(textarea, button, result, copy);
    }

    if (toolId === "plano") {
      const subject = document.createElement("input");
      subject.placeholder = "Matéria";

      const goal = document.createElement("input");
      goal.placeholder = "O que você quer aprender?";

      const minutes = document.createElement("input");
      minutes.type = "number";
      minutes.min = "15";
      minutes.value = "30";
      minutes.placeholder = "Tempo em minutos";

      const button = document.createElement("button");
      button.type = "button";
      button.textContent = "Criar plano";

      const result = document.createElement("div");
      result.className = "student-result";
      result.hidden = true;

      const copy = document.createElement("button");
      copy.type = "button";
      copy.textContent = "Copiar plano";

      button.addEventListener("click", () => {
        result.textContent = createStudyPlan(
          subject.value,
          goal.value,
          minutes.value
        );

        result.hidden = false;
      });

      copy.addEventListener("click", () => {
        copyText(result.textContent, copy);
      });

      article.append(
        subject,
        goal,
        minutes,
        button,
        result,
        copy
      );
    }

    if (toolId === "trabalho") {
      const subject = document.createElement("input");
      subject.placeholder = "Disciplina";

      const topic = document.createElement("input");
      topic.placeholder = "Tema do trabalho";

      const level = document.createElement("input");
      level.placeholder = "Nível de ensino";

      const button = document.createElement("button");
      button.type = "button";
      button.textContent = "Criar estrutura";

      const result = document.createElement("div");
      result.className = "student-result";
      result.hidden = true;

      const copy = document.createElement("button");
      copy.type = "button";
      copy.textContent = "Copiar estrutura";

      button.addEventListener("click", () => {
        result.textContent = createWorkStructure(
          subject.value,
          topic.value,
          level.value
        );

        result.hidden = false;
      });

      copy.addEventListener("click", () => {
        copyText(result.textContent, copy);
      });

      article.append(
        subject,
        topic,
        level,
        button,
        result,
        copy
      );
    }

    return article;
  }

  function initStudent() {
    const section = document.querySelector("#student");

    if (!section) return;

    const existingTools = section.querySelector(".student-tools");

    if (existingTools) return;

    const heading = document.createElement("div");
    heading.className = "student-tools-header";

    heading.innerHTML = `
      <p class="eyebrow">FERRAMENTAS PARA ESTUDANTES</p>
      <h3>Comece a estudar melhor.</h3>
      <p>
        Recursos simples para organizar trabalhos,
        compreender conteúdos e preparar seus estudos.
      </p>
    `;

    const grid = document.createElement("div");
    grid.className = "student-tools";

    Object.keys(tools).forEach((toolId) => {
      grid.appendChild(createCard(toolId));
    });

    section.querySelector(".container")?.append(
      heading,
      grid
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initStudent);
  } else {
    initStudent();
  }
})();