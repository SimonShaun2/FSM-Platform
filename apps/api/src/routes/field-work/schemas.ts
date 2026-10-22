import { SubmitFieldWorkSyncBatchBodySchema } from "@fsm/types";

import { withZodValidation } from "../shared/validation.js";

export const submitFieldWorkSyncBatchValidation = withZodValidation({
  body: SubmitFieldWorkSyncBatchBodySchema
});
