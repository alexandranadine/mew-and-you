import { Router } from "express";
import { ApiError } from "../lib/errors";
import { validateRadius, validateZip } from "../lib/validation";
import { getCatProvider } from "../providers";

export const catsRouter = Router();

// GET /api/cats?zip=91350&radius=25 — available cats within a radius of a ZIP code.
catsRouter.get("/", async (req, res, next) => {
  try {
    const zip = validateZip(req.query.zip);
    const radiusMiles = validateRadius(req.query.radius);

    const provider = getCatProvider();
    const { cats, totalCount } = await provider.searchCats({
      zip,
      radiusMiles,
    });

    res.json({ cats, totalCount });
  } catch (error) {
    next(error);
  }
});

// GET /api/cats/:id — a single cat's full profile.
catsRouter.get("/:id", async (req, res, next) => {
  try {
    const provider = getCatProvider();
    const cat = await provider.getCatById(req.params.id);

    if (!cat) {
      throw new ApiError("The requested cat was not found.", 404, "not_found");
    }

    res.json({ cat });
  } catch (error) {
    next(error);
  }
});
