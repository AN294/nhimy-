"use strict";

import { $ } from "../core/dom.js";
import {
  formatNumber,
  setMessage,
  show
} from "../core/utils.js";

const unitDefinitions = {
  length: {
    meter: {
      name: "Metro (m)",
      factor: 1
    },
    kilometer: {
      name: "Quilómetro (km)",
      factor: 1000
    },
    centimeter: {
      name: "Centímetro (cm)",
      factor: 0.01
    },
    millimeter: {
      name: "Milímetro (mm)",
      factor: 0.001
    },
    mile: {
      name: "Milha (mi)",
      factor: 1609.344
    },
    foot: {
      name: "Pé (ft)",
      factor: 0.3048
    }
  },

  weight: {
    kilogram: {
      name: "Quilograma (kg)",
      factor: 1
    },
    gram: {
      name: "Grama (g)",
      factor: 0.001
    },
    milligram: {
      name: "Miligrama (mg)",
      factor: 0.000001
    },
    pound: {
      name: "Libra (lb)",
      factor: 0.45359237
    },
    ounce: {
      name: "Onça (oz)",
      factor: 0.028349523125
    }
  },

  temperature: {
    celsius: {
      name: "Celsius (°C)"
    },
    fahrenheit: {
      name: "Fahrenheit (°F)"
    },
    kelvin: {
      name: "Kelvin (K)"
    }
  }
};

function populateUnitSelects(
  unitCategory,
  unitFrom,
  unitTo
) {
  if (
    !unitCategory ||
    !unitFrom ||
    !unitTo
  ) {
    return;
  }

  const definitions =
    unitDefinitions[unitCategory.value];

  if (!definitions) {
    return;
  }

  unitFrom.innerHTML = "";
  unitTo.innerHTML = "";

  Object.entries(definitions).forEach(
    ([key, definition]) => {
      const optionFrom =
        document.createElement("option");

      optionFrom.value = key;
      optionFrom.textContent =
        definition.name;

      const optionTo =
        optionFrom.cloneNode(true);

      unitFrom.appendChild(
        optionFrom
      );

      unitTo.appendChild(
        optionTo
      );
    }
  );

  if (unitTo.options.length > 1) {
    unitTo.selectedIndex = 1;
  }
}

function convertTemperature(
  value,
  from,
  to
) {
  let celsius;

  if (from === "celsius") {
    celsius = value;
  } else if (from === "fahrenheit") {
    celsius =
      (value - 32) * 5 / 9;
  } else if (from === "kelvin") {
    celsius =
      value - 273.15;
  } else {
    throw new Error(
      "Unidade de temperatura inválida."
    );
  }

  if (to === "celsius") {
    return celsius;
  }

  if (to === "fahrenheit") {
    return celsius * 9 / 5 + 32;
  }

  if (to === "kelvin") {
    return celsius + 273.15;
  }

  throw new Error(
    "Unidade de temperatura inválida."
  );
}

function convertUnits(
  value,
  category,
  from,
  to
) {
  if (category === "temperature") {
    return convertTemperature(
      value,
      from,
      to
    );
  }

  const definitions =
    unitDefinitions[category];

  if (
    !definitions?.[from] ||
    !definitions?.[to]
  ) {
    throw new Error(
      "Unidades inválidas."
    );
  }

  const baseValue =
    value *
    definitions[from].factor;

  return (
    baseValue /
    definitions[to].factor
  );
}

export function initConverterTool() {
  const unitCategory =
    $("unitCategory");

  const unitValue =
    $("unitValue");

  const unitFrom =
    $("unitFrom");

  const unitTo =
    $("unitTo");

  const convertUnitButton =
    $("convertUnitButton");

  const unitResult =
    $("unitResult");

  if (
    !unitCategory ||
    !convertUnitButton
  ) {
    return;
  }

  populateUnitSelects(
    unitCategory,
    unitFrom,
    unitTo
  );

  unitCategory.addEventListener(
    "change",
    () => {
      populateUnitSelects(
        unitCategory,
        unitFrom,
        unitTo
      );
    }
  );

  convertUnitButton.addEventListener(
    "click",
    () => {
      const value =
        Number(unitValue?.value);

      if (
        !Number.isFinite(value)
      ) {
        setMessage(
          unitResult,
          "Digite um valor válido."
        );

        show(
          unitResult,
          true
        );

        return;
      }

      try {
        const category =
          unitCategory.value;

        const from =
          unitFrom?.value;

        const to =
          unitTo?.value;

        const result =
          convertUnits(
            value,
            category,
            from,
            to
          );

        const fromName =
          unitFrom?.options[
            unitFrom.selectedIndex
          ]?.textContent || from;

        const toName =
          unitTo?.options[
            unitTo.selectedIndex
          ]?.textContent || to;

        if (unitResult) {
          unitResult.innerHTML =
            `<strong>${formatNumber(
              value
            )} ${fromName}</strong> = ` +
            `<strong>${formatNumber(
              result
            )} ${toName}</strong>`;

          unitResult.hidden = false;
        }
      } catch (error) {
        setMessage(
          unitResult,
          error.message ||
            "Não foi possível converter."
        );

        show(
          unitResult,
          true
        );
      }
    }
  );
}
