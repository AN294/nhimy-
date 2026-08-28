"use strict";

import { $ } from "../core/dom.js";
import { setMessage, show } from "../core/utils.js";
import { copyText } from "../ui/clipboard.js";

function secureRandomIndex(max) {
  if (!Number.isInteger(max) || max <= 0) {
    throw new Error("Valor inválido.");
  }

  const array = new Uint32Array(1);
  crypto.getRandomValues(array);

  return array[0] % max;
}

function generateSecurePassword(
  length,
  useUpper,
  useLower,
  useNumbers,
  useSymbols
) {
  let characters = "";

  if (useUpper) {
    characters += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  }

  if (useLower) {
    characters += "abcdefghijklmnopqrstuvwxyz";
  }

  if (useNumbers) {
    characters += "0123456789";
  }

  if (useSymbols) {
    characters += "!@#$%^&*()-_=+[]{};:,.?/|";
  }

  if (!characters) {
    throw new Error(
      "Selecione pelo menos um tipo de caractere."
    );
  }

  const password = [];

  for (let i = 0; i < length; i++) {
    password.push(
      characters[
        secureRandomIndex(characters.length)
      ]
    );
  }

  return password.join("");
}

export function initPasswordTool() {
  const passwordLength =
    $("passwordLength");

  const passwordUpper =
    $("passwordUpper");

  const passwordLower =
    $("passwordLower");

  const passwordNumbers =
    $("passwordNumbers");

  const passwordSymbols =
    $("passwordSymbols");

  const generatePasswordButton =
    $("generatePasswordButton");

  const passwordMessage =
    $("passwordMessage");

  const passwordResult =
    $("passwordResult");

  const generatedPassword =
    $("generatedPassword");

  const copyPasswordButton =
    $("copyPasswordButton");

  if (!generatePasswordButton) {
    return;
  }

  generatePasswordButton.addEventListener(
    "click",
    async () => {
      try {
        const length =
          Number(
            passwordLength?.value || 16
          );

        if (
          !Number.isInteger(length) ||
          length < 4 ||
          length > 128
        ) {
          throw new Error(
            "Use um comprimento entre 4 e 128 caracteres."
          );
        }

        const password =
          generateSecurePassword(
            length,
            passwordUpper?.checked ?? true,
            passwordLower?.checked ?? true,
            passwordNumbers?.checked ?? true,
            passwordSymbols?.checked ?? true
          );

        if (generatedPassword) {
          generatedPassword.value =
            password;
          generatedPassword.textContent =
            password;
        }

        show(passwordResult, true);

        setMessage(
          passwordMessage,
          "Password gerada com segurança."
        );
      } catch (error) {
        show(passwordResult, false);

        setMessage(
          passwordMessage,
          error.message ||
            "Não foi possível gerar a password."
        );
      }
    }
  );

  copyPasswordButton?.addEventListener(
    "click",
    async () => {
      const password =
        generatedPassword?.value ||
        generatedPassword?.textContent ||
        "";

      try {
        await copyText(password);

        setMessage(
          passwordMessage,
          "Password copiada."
        );
      } catch (error) {
        setMessage(
          passwordMessage,
          error.message ||
            "Não foi possível copiar a password."
        );
      }
    }
  );
}
