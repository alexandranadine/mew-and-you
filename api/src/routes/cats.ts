import { Router } from "express";
import {
  getAnimalById,
  searchAvailableCats,
} from "../integrations/rescuegroups/client";
import { mapRescueGroupsAnimal } from "../integrations/rescuegroups/mapper";
import { ApiError } from "../lib/errors";
import {
  parseRescueGroupsAnimalId,
  validateRadius,
  validateZip,
} from "../lib/validation";
import type { CatWithDistance } from "../models/cat";

export const catsRouter = Router();

// GET /api/cats?zip=91350&radius=25 — available cats within a radius of a ZIP code.
catsRouter.get("/", async (req, res, next) => {
  try {
    const zip = validateZip(req.query.zip);
    const radiusMiles = validateRadius(req.query.radius);

    const response = await searchAvailableCats({
      postalcode: zip,
      miles: radiusMiles,
      limit: 100,
    });
    const included = response.included ?? [];

    const cats: CatWithDistance[] = response.data.map((animal) => ({
      ...mapRescueGroupsAnimal(animal, included),
      distanceMiles:
        typeof animal.attributes.distance === "number"
          ? animal.attributes.distance
          : radiusMiles,
    }));

    res.json({ cats, totalCount: response.meta?.count ?? cats.length });
  } catch (error) {
    next(error);
  }
});

// GET /api/cats/:id — a single cat's full profile.
catsRouter.get("/:id", async (req, res, next) => {
  try {
    const animalId = parseRescueGroupsAnimalId(req.params.id);
    const response = await getAnimalById(animalId);

    if (!response.data) {
      throw new ApiError("The requested cat was not found.", 404, "not_found");
    }

    const cat = mapRescueGroupsAnimal(response.data, response.included ?? []);
    res.json({ cat });
  } catch (error) {
    next(error);
  }
});
