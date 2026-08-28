"use strict";

import { $ } from "../core/dom.js";
import { formatNumber, setMessage, show } from "../core/utils.js";

export function initPercentageTool() {
  const percentageValue = $("percentageValue");
  const percentageRate = $("percentageRate");
  const calculatePercentageButton =
    $("calculatePercentageButton");
  const percentageResult = $("percentageResult");

  if (!calculatePercentageButton) return;

  calculatePercentageButton.addEventListener("click", () => {
    const value = Number(percentageValue?.value);
    const rate = Number(percentageRate?.value);

    if (
      !Number.isFinite(value) ||
      !Number.isFinite(rate)
    ) {
      setMessage(
        percentageResult,
        "Digite valores válidos."
      );

      show(percentageResult, true);
      return;
    }

    const percentage = value * rate / 100;
    const afterIncrease = value + percentage;
    const afterDiscount = value - percentage;

    if (percentageResult) {
      percentageResult.innerHTML =
        `<strong>${formatNumber(rate)}% de ${formatNumber(
          value
        )} = ${formatNumber(percentage)}</strong><br>` +
        `Aumento: ${formatNumber(afterIncrease)}<br>` +
        `Desconto: ${formatNumber(afterDiscount)}`;

      percentageResult.hidden = false;
    }
  });
}
