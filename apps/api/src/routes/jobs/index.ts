import type { FastifyPluginAsync } from "fastify";

import {
  addNoteHandler,
  addPhotoHandler,
  assignTechnicianHandler,
  completeJobHandler,
  createJobHandler,
  getJobHandler,
  getJobTimelineHandler,
  getNotesHandler,
  getPhotosHandler,
  listJobsHandler,
  scheduleJobHandler,
  transitionStatusHandler,
  updateJobHandler
} from "./handlers.js";
import {
  activityQueryValidation,
  addNoteRouteSchema,
  addNoteValidation,
  addPhotoRouteSchema,
  addPhotoValidation,
  assignTechnicianRouteSchema,
  assignTechnicianValidation,
  completeJobRouteSchema,
  completeJobValidation,
  createJobSchema,
  createJobValidation,
  getActivitySchema,
  getJobSchema,
  getNotesSchema,
  getPhotosSchema,
  jobIdValidation,
  listJobsSchema,
  listJobsValidation,
  notesQueryValidation,
  photosQueryValidation,
  scheduleJobRouteSchema,
  scheduleJobValidation,
  transitionStatusRouteSchema,
  transitionStatusValidation,
  updateJobSchema,
  updateJobValidation
} from "./schemas.js";

const jobRoutes: FastifyPluginAsync = async (fastify) => {
  const authenticate = [fastify.authenticate];

  fastify.get("/", {
    preHandler: authenticate,
    preValidation: listJobsValidation,
    schema: listJobsSchema
  }, listJobsHandler);

  fastify.post("/", {
    preHandler: authenticate,
    preValidation: createJobValidation,
    schema: createJobSchema
  }, createJobHandler);

  fastify.post("/:id/status", {
    preHandler: authenticate,
    preValidation: transitionStatusValidation,
    schema: transitionStatusRouteSchema
  }, transitionStatusHandler);

  fastify.post("/:id/assign", {
    preHandler: authenticate,
    preValidation: assignTechnicianValidation,
    schema: assignTechnicianRouteSchema
  }, assignTechnicianHandler);

  fastify.post("/:id/schedule", {
    preHandler: authenticate,
    preValidation: scheduleJobValidation,
    schema: scheduleJobRouteSchema
  }, scheduleJobHandler);

  fastify.post("/:id/complete", {
    preHandler: authenticate,
    preValidation: completeJobValidation,
    schema: completeJobRouteSchema
  }, completeJobHandler);

  fastify.post("/:id/notes", {
    preHandler: authenticate,
    preValidation: addNoteValidation,
    schema: addNoteRouteSchema
  }, addNoteHandler);

  fastify.get("/:id/notes", {
    preHandler: authenticate,
    preValidation: notesQueryValidation,
    schema: getNotesSchema
  }, getNotesHandler);

  fastify.post("/:id/photos", {
    preHandler: authenticate,
    preValidation: addPhotoValidation,
    schema: addPhotoRouteSchema
  }, addPhotoHandler);

  fastify.get("/:id/photos", {
    preHandler: authenticate,
    preValidation: photosQueryValidation,
    schema: getPhotosSchema
  }, getPhotosHandler);

  fastify.get("/:id/activity", {
    preHandler: authenticate,
    preValidation: activityQueryValidation,
    schema: getActivitySchema
  }, getJobTimelineHandler);

  fastify.get("/:id", {
    preHandler: authenticate,
    preValidation: jobIdValidation,
    schema: getJobSchema
  }, getJobHandler);

  fastify.patch("/:id", {
    preHandler: authenticate,
    preValidation: updateJobValidation,
    schema: updateJobSchema
  }, updateJobHandler);
};

export default jobRoutes;
