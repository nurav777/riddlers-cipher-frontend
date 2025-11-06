import dotenv from "dotenv";
dotenv.config();

import { sesService } from "../services/sesService";

(async () => {
  await sesService.sendCongratsMessage("varunr4705@gmail.com");
  console.log("test send attempted");
})();
