import { Router } from "express";
import { ApiError } from "../lib/errors";
import { getHomepageSampleCats } from "../lib/homepageSample";
import { assertSupportedServiceAreaZip } from "../lib/serviceArea";
import {
  validateRadius,
  validateSampleCount,
  validateZip,
} from "../lib/validation";
import { getCatProvider } from "../providers";

export const catsRouter = Router();

// GET /api/cats/sample?zip=90012&radius=50&count=3 — random homepage listings.
// ZIP is validated for API contract compatibility; the candidate pool is built
// from fixed LA + San Diego centers (see HOMEPAGE_SAMPLE_ZIPS).
// Must be registered before /:id so "sample" is not treated as a cat id.
catsRouter.get("/sample", async (req, res, next) => {
  try {
    validateZip(req.query.zip);
    const radiusMiles = validateRadius(req.query.radius);
    const count = validateSampleCount(req.query.count);

    const { cats } = await getHomepageSampleCats({
      radiusMiles,
      count,
    });

    res.json({ cats });
  } catch (error) {
    next(error);
  }
});

// GET /api/cats?zip=91350&radius=25 — available cats within a radius of a ZIP code.
catsRouter.get("/", async (req, res, next) => {
  try {
    const zip = validateZip(req.query.zip);
    assertSupportedServiceAreaZip(zip);
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
