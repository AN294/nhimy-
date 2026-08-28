"use strict";

export function setMessage(element, message) {
  if (!element) return;

  element.textContent = message || "";
}

export function clearMessage(element) {
  if (!element) return;

  element.textContent = "";
}

export function showMessage(element, message) {
  if (!element) return;

  element.textContent = message || "";
  element.hidden = false;
}

export function hideMessage(element) {
  if (!element) return;

  element.hidden = true;
  element.textContent = "";
}
