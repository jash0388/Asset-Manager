import { Router } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import usersRouter from "./users.js";
import attendanceRouter from "./attendance.js";
import mentorRouter from "./mentor.js";
import facultyRouter from "./faculty.js";
import facultyAcademicsRouter from "./faculty-academics.js";
import facultyDelegateRouter from "./faculty-delegate.js";
import facultyWorkloadRouter from "./faculty-workload.js";
import notebookAttendanceRouter from "./notebook-attendance.js";

const router = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(attendanceRouter);
router.use(mentorRouter);
router.use(facultyRouter);
router.use(facultyAcademicsRouter);
router.use(facultyDelegateRouter);
router.use(facultyWorkloadRouter);
router.use(notebookAttendanceRouter);

export default router;
