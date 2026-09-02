export interface LootResult {
  shard: boolean;
  lore_page: boolean;
  recipe_page: boolean;
}

/** GDD section 11 — independent low-odds rolls, with pity after 5 shard-less full raids. */
export function rollLoot(
  raidsSinceShard: number,
  recipesAllUnlocked: boolean,
  kitchenPhaseBUnlocked: boolean,
): LootResult {
  const pity = raidsSinceShard >= 5;
  const shard = pity || Math.random() < 0.35;
  const lore_page = Math.random() < 0.15;
  const recipe_page = kitchenPhaseBUnlocked && !recipesAllUnlocked && Math.random() < 0.1;
  return { shard, lore_page, recipe_page };
}
