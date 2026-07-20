import { Router, type IRouter } from "express";
import healthRouter from "./health";
import animeRouter from "./anime";
import moviesRouter from "./movies";
import watchlistRouter from "./watchlist";

const router: IRouter = Router();

router.use(healthRouter);
router.use(animeRouter);
router.use(moviesRouter);
router.use(watchlistRouter);

export default router;
