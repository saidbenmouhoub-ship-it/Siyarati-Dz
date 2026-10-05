import { Router, type IRouter } from "express";
import healthRouter from "./health";
import vinRouter from "./vin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(vinRouter);

export default router;
