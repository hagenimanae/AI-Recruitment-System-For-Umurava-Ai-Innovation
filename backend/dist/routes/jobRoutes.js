"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jobController_1 = require("../controllers/jobController");
const router = express_1.default.Router();
router.route('/')
    .get(jobController_1.getJobs)
    .post(jobController_1.createJob);
router.route('/:id')
    .get(jobController_1.getJobById)
    .put(jobController_1.updateJob)
    .delete(jobController_1.deleteJob);
exports.default = router;
