"use strict";

import { getUserData, replaceUserData, deleteUserData } from "../account/server.js";
import { validateRepository } from "./repository.js";

const fileRepository = validateRepository({
  getUserData,
  replaceUserData,
  deleteUserData
});

export { fileRepository };
