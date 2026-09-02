import { env } from "../config/env";
import type { CatProvider } from "./CatProvider";
import { MockCatProvider } from "./MockCatProvider";
import { RescueGroupsProvider } from "./RescueGroupsProvider";

const providerCache = new Map<string, CatProvider>();

/**
 * Picks the active data source based on DATA_PROVIDER. Accepts an explicit
 * name (used by tests) but defaults to the configured environment value.
 */
export function getCatProvider(
  providerName: "mock" | "rescuegroups" = env.dataProvider,
): CatProvider {
  const cached = providerCache.get(providerName);
  if (cached) return cached;

  const provider =
    providerName === "rescuegroups"
      ? new RescueGroupsProvider()
      : new MockCatProvider();
  providerCache.set(providerName, provider);
  return provider;
}
