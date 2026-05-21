import { MealSuggestion } from "./types";

// Built-in daily meal-plan generator. Produces a 4-meal day (breakfast, lunch,
// dinner, snack) sized to the user's calorie target with protein prioritized.
// Used as the offline fallback when no AI key is configured (see /api/meals).

interface Template {
  name: string;
  description: string;
}

const SLOTS: { slot: string; fraction: number; options: Template[] }[] = [
  {
    slot: "Breakfast",
    fraction: 0.25,
    options: [
      { name: "Greek yogurt, berries & whey", description: "Plain Greek yogurt, mixed berries, a scoop of protein, sprinkle of granola." },
      { name: "Veggie egg-white omelette + oats", description: "3 egg whites + 1 whole egg, spinach & peppers, side of plain oats." },
      { name: "Protein oatmeal & banana", description: "Oats cooked with milk, a scoop of protein, half a banana, cinnamon." },
      { name: "Cottage cheese toast", description: "High-protein cottage cheese on wholegrain toast, tomato, black pepper." },
    ],
  },
  {
    slot: "Lunch",
    fraction: 0.3,
    options: [
      { name: "Grilled chicken, rice & salad", description: "Grilled chicken breast, a fist of rice, big mixed salad, light dressing." },
      { name: "Salmon poke bowl (light rice)", description: "Salmon, half rice / double greens, edamame, light sauce." },
      { name: "Chicken shawarma plate", description: "Order it as a plate: chicken, salad, garlic on the side, skip the bread." },
      { name: "Tuna & chickpea salad", description: "Tuna, chickpeas, cucumber, tomato, olive oil, lemon." },
    ],
  },
  {
    slot: "Dinner",
    fraction: 0.3,
    options: [
      { name: "Steak & roasted veg", description: "Lean sirloin, roasted broccoli & peppers, small sweet potato." },
      { name: "Grilled chicken, quinoa & greens", description: "Chicken breast, quinoa, sautéed greens, olive oil." },
      { name: "Lean beef stir-fry", description: "Lean beef strips, lots of veg, a little rice or noodles, soy-ginger sauce." },
      { name: "Baked white fish & potatoes", description: "White fish, herbed baby potatoes, green beans." },
    ],
  },
  {
    slot: "Snack",
    fraction: 0.15,
    options: [
      { name: "Protein shake + almonds", description: "Whey shake and a small handful of almonds." },
      { name: "Cottage cheese & fruit", description: "Cottage cheese with an apple or pear." },
      { name: "Apple & peanut butter", description: "Apple slices with 1 tbsp natural peanut butter." },
      { name: "Beef jerky + fruit", description: "Lean jerky and a piece of fruit." },
    ],
  },
];

export function buildMealPlan(
  calorieTarget: number,
  proteinTarget: number,
  seed = 0
): MealSuggestion[] {
  return SLOTS.map(({ slot, fraction, options }, i) => {
    const tpl = options[(seed + i) % options.length];
    const calories = Math.round(calorieTarget * fraction);
    const protein = Math.round(proteinTarget * fraction);
    const fat = Math.round((calories * 0.25) / 9);
    const carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));
    return { slot, name: tpl.name, description: tpl.description, calories, protein, carbs, fat };
  });
}
