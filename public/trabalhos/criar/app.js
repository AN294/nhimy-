import {
  getProject,
  createProject,
  setProject
} from "/js/core/work/storage.js";

import {
  initWorkProgress
} from "/js/core/work/flow.js";


const form =
  document.querySelector("#workForm");


const title =
  document.querySelector("#workTitle");


const subject =
  document.querySelector("#workSubject");


const type =
  document.querySelector("#workType");


const orientationOptions =
  document.querySelectorAll(
    'input[name="workOrientation"]'
  );


const existingProject =
  getProject();

initWorkProgress(
  existingProject
);


if (existingProject?.orientation) {

  const selected =
    document.querySelector(
      `input[name="workOrientation"][value="${existingProject.orientation}"]`
    );

  if (selected) {
    selected.checked = true;
  }
}


if (existingProject) {

  title.value =
    existingProject.title || "";

  subject.value =
    existingProject.subject || "";

  type.value =
    existingProject.type || "";
}


form.addEventListener(
  "submit",
  (event) => {

    event.preventDefault();


    const selectedOrientation =
      Array.from(orientationOptions)
        .find(
          (option) =>
            option.checked
        );


    const project =
      createProject({
        ...(existingProject || {}),

        orientation:
          selectedOrientation?.value || "",

        title:
          title.value.trim(),

        subject:
          subject.value.trim(),

        type:
          type.value
      });


    const saved =
      setProject(project);


    if (!saved) {
      return;
    }


    window.location.href =
      "/trabalhos/orientar/";
  }
);
