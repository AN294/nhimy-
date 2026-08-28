"use strict";

export function formatNumber(value) {
  return new Intl.NumberFormat("pt-PT", {
    maximumFractionDigits: 8
  }).format(value);
}

export function setMessage(element, message) {
  if (element) {
    element.textContent = message;
  }
}

export function show(element, visible = true) {
  if (element) {
    element.hidden = !visible;
  }
}
