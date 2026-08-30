import {
  getProject,
  setProject
} from "/js/core/work/storage.js";

import {
  initWorkProgress,
  getCurrentStage
} from "/js/core/work/flow.js";

import {
  createResearchPlan
} from "/js/core/work/intelligence.js";

import {
  buildResearchRequest
} from "/js/core/work/research/requestBuilder.js";


const project = getProject();

initWorkProgress(
  project
);


if (!project) {
  window.location.href = "/trabalhos/criar/";
  throw new Error("Projeto de trabalho não encontrado.");
}


const orientationTitle =
  document.querySelector("#orientationTitle");

const orientationDescription =
  document.querySelector("#orientationDescription");

const orientationContent =
  document.querySelector("#orientationContent");

const continueButton =
  document.querySelector("#continueButton");


const orientations = {

  tema: {
    title:
      "Você já tem um tema. Vamos descobrir como desenvolvê-lo.",
    description:
      "Conte ao Nhimy qual é o tema. A partir disso, vamos descobrir o que pode ser desenvolvido.",
    label:
      "Qual é o tema do seu trabalho?",
    placeholder:
      "Ex.: A importância da alimentação saudável",
    help:
      "Pode escrever apenas o tema. Você não precisa saber o resto ainda."
  },

  ideias: {
    title:
      "Você já tem ideias. Vamos colocá-las em ordem.",
    description:
      "Escreva livremente o que você já pensou. Não precisa organizar.",
    label:
      "Quais são as ideias que você já tem?",
    placeholder:
      "Escreva aqui tudo o que você lembra ou gostaria de colocar no trabalho...",
    help:
      "Não se preocupe com organização, frases corretas ou ordem das ideias."
  },

  inicio: {
    title:
      "Você já começou. Vamos continuar de onde parou.",
    description:
      "Mostre ao Nhimy o que você já escreveu para identificarmos o próximo passo.",
    label:
      "O que você já escreveu?",
    placeholder:
      "Cole ou escreva aqui o conteúdo que você já começou...",
    help:
      "Pode ser apenas uma parte do trabalho."
  },

  instrucoes: {
    title:
      "Vamos transformar as instruções do professor em um plano.",
    description:
      "As instruções ajudam a entender exatamente o que o trabalho precisa conter.",
    label:
      "O que o professor pediu?",
    placeholder:
      "Escreva ou cole aqui as instruções do professor...",
    help:
      "Pode copiar exatamente como recebeu."
  },

  zero: {
    title:
      "Tudo bem não saber por onde começar.",
    description:
      "Vamos descobrir juntos o que você precisa fazer. Não é necessário ter um tema pronto.",
    label:
      "O que você sabe sobre esse trabalho até agora?",
    placeholder:
      "Pode escrever qualquer coisa que você sabe, mesmo que pareça pouco...",
    help:
      "Se não souber nada ainda, você também pode escrever: 'Não sei'."
  }

};


const current =
  orientations[project.orientation];


if (!current) {

  orientationTitle.textContent =
    "Vamos começar pelo que você já tem.";

  orientationDescription.textContent =
    "Escolha uma situação anterior para continuarmos.";

} else {

  orientationTitle.textContent =
    current.title;

  orientationDescription.textContent =
    current.description;

  const previousContext =
    typeof project.orientationContext === "string"
      ? project.orientationContext
      : "";

  orientationContent.innerHTML = `
    <div class="work-orientation-form">

      <label
        class="form-label"
        for="orientationInput"
      >
        ${current.label}
      </label>

      <textarea
        id="orientationInput"
        rows="7"
        placeholder="${current.placeholder}"
      >${escapeHtml(previousContext)}</textarea>

      <span class="form-help">
        ${current.help}
      </span>

    </div>
  `;
}


const orientationInput =
  document.querySelector("#orientationInput");


async function continueOrientation() {

  const currentProject =
    getProject();

  if (!currentProject) {
    window.location.href =
      "/trabalhos/criar/";
    return;
  }


  const context =
    orientationInput
      ? orientationInput.value.trim()
      : "";


  if (!context) {
    orientationInput?.focus();
    return;
  }


  continueButton.disabled = true;


  try {

    const plan =
      createResearchPlan({

        title:
          currentProject.title,

        subject:
          currentProject.subject,

        orientationContext:
          context,

        questions: [
          `O que é ${currentProject.title} e qual é o seu contexto?`,
          `Quais são os principais fatores, causas, consequências e evidências científicas relacionadas a ${currentProject.title}?`
        ],

        researchNeeds: [
          "Definir os principais conceitos relacionados ao tema.",
          "Identificar os aspectos mais importantes que devem ser abordados.",
          "Pesquisar informações confiáveis relacionadas ao tema.",
          "Selecionar informações relevantes para cada seção do trabalho."
        ],

        requestedSections: [
          {
            title: "Introdução",
            purpose:
              "Apresentar o tema, contextualizar o assunto e indicar o objetivo do trabalho."
          },
          {
            title: "Desenvolvimento",
            purpose:
              "Apresentar e explicar os principais conteúdos relacionados ao tema."
          },
          {
            title: "Conclusão",
            purpose:
              "Retomar as ideias principais e apresentar uma síntese do trabalho."
          },
          {
            title: "Referências",
            purpose:
              "Registrar as fontes utilizadas na construção do trabalho."
          }
        ]

      });


    if (
      !plan ||
      plan.status !== "success"
    ) {
      throw new Error(
        "Não foi possível criar o plano de pesquisa."
      );
    }


    const request =
      buildResearchRequest({

        topic:
          plan.topic,

        subject:
          plan.subject,

        questions:
          plan.questions,

        sections:
          plan.sections,

        sourcePolicy: {
          requireSource: true,
          preserveSourceDetails: true,
          allowStudentMaterials: true,
          allowExternalSources: true
        }

      });


    const response =
      await fetch(
        "/api/research",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify(request)
        }
      );


    const data =
      await response.json();


    if (
      !response.ok ||
      !data.ok ||
      !data.result
    ) {
      throw new Error(
        data.error ||
        "Não foi possível realizar a pesquisa."
      );
    }


    const result =
      data.result;


    setProject({

      ...currentProject,

      orientationContext:
        context,

      orientationReady:
        true,

      researchReady:
        result.readyForStructure === true,

      research: result,

      researchPlan:
        plan,

      researchRequest:
        request

    });


    window.location.href =
      "/trabalhos/estruturar/";

  } catch (error) {

    console.error(
      "Erro ao preparar pesquisa:",
      error
    );

    continueButton.disabled = false;

    alert(
      "Não foi possível preparar a pesquisa. Tente novamente."
    );
  }

}


continueButton.addEventListener(
  "click",
  continueOrientation
);


orientationInput?.addEventListener(
  "keydown",
  (event) => {

    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {

      event.preventDefault();

      continueOrientation();

    }

  }
);


function escapeHtml(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
