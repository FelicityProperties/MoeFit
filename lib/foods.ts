// A lightweight built-in food/restaurant knowledge base used by the coach engine
// to estimate calories & macros and judge weight-loss friendliness WITHOUT any
// external API. Values are per typical serving. This is intentionally simple and
// easy to extend — add rows as you discover your go-to meals.

export type Friendliness = "good" | "ok" | "avoid";

export interface FoodFact {
  /** lowercase keywords that should match this item in a query */
  keywords: string[];
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  friendliness: Friendliness;
  /** suggested healthier swaps */
  alternatives: string[];
  note?: string;
}

export const FOOD_DB: FoodFact[] = [
  // --- Fast food / takeout (the "Order Smart" zone) ---
  {
    keywords: ["burger", "cheeseburger", "hamburger", "big mac", "whopper"],
    name: "Fast-food burger",
    calories: 650,
    protein: 30,
    carbs: 45,
    fat: 38,
    friendliness: "avoid",
    alternatives: ["Single grilled chicken burger, no mayo", "Burger wrapped in lettuce (no bun)", "Grilled chicken + side salad"],
    note: "High fat + refined carbs. Fine occasionally, not on a cut day.",
  },
  {
    keywords: ["pizza", "pepperoni", "margherita"],
    name: "Pizza (2 slices)",
    calories: 570,
    protein: 24,
    carbs: 62,
    fat: 24,
    friendliness: "avoid",
    alternatives: ["Thin-crust veggie, 2 slices max", "Add a side salad and stop at 2 slices", "Protein + veg bowl instead"],
    note: "Easy to overeat. Pre-decide your slice count.",
  },
  {
    keywords: ["fries", "chips", "french fries"],
    name: "French fries (medium)",
    calories: 365,
    protein: 4,
    carbs: 48,
    fat: 17,
    friendliness: "avoid",
    alternatives: ["Side salad", "Apple slices", "Small fries split with someone"],
  },
  {
    keywords: ["sushi", "maki", "nigiri", "roll"],
    name: "Sushi (8-piece roll)",
    calories: 350,
    protein: 14,
    carbs: 55,
    fat: 7,
    friendliness: "ok",
    alternatives: ["Sashimi (no rice)", "Salmon/tuna nigiri", "Edamame + sashimi combo"],
    note: "Lean protein but rice adds up. Skip tempura/spicy-mayo rolls.",
  },
  {
    keywords: ["sashimi"],
    name: "Sashimi platter",
    calories: 220,
    protein: 34,
    carbs: 2,
    fat: 8,
    friendliness: "good",
    alternatives: [],
    note: "Excellent — lean protein, almost no carbs.",
  },
  {
    keywords: ["shawarma", "shwarma", "gyro", "wrap", "kebab", "doner"],
    name: "Chicken shawarma wrap",
    calories: 600,
    protein: 35,
    carbs: 50,
    fat: 28,
    friendliness: "ok",
    alternatives: ["Chicken shawarma plate, no bread, extra salad", "Half wrap + salad", "Skip the garlic/tahini overload"],
    note: "Get it as a plate with salad to cut the calories hard.",
  },
  {
    keywords: ["fried chicken", "kfc", "wings", "nuggets"],
    name: "Fried chicken (2-3 pieces)",
    calories: 540,
    protein: 32,
    carbs: 22,
    fat: 35,
    friendliness: "avoid",
    alternatives: ["Grilled chicken", "Rotisserie chicken (no skin)", "Grilled chicken salad"],
  },
  {
    keywords: ["grilled chicken", "chicken breast", "rotisserie"],
    name: "Grilled chicken breast",
    calories: 280,
    protein: 45,
    carbs: 0,
    fat: 10,
    friendliness: "good",
    alternatives: [],
    note: "Perfect cut food. Pair with veg or a small rice portion.",
  },
  {
    keywords: ["salad", "greek salad", "caesar"],
    name: "Mixed salad (with protein)",
    calories: 320,
    protein: 25,
    carbs: 18,
    fat: 16,
    friendliness: "good",
    alternatives: ["Dressing on the side", "Skip croutons & creamy dressing"],
    note: "Caesar with creamy dressing can secretly be 700+ kcal — get dressing on the side.",
  },
  {
    keywords: ["poke", "poke bowl"],
    name: "Poke bowl",
    calories: 480,
    protein: 32,
    carbs: 55,
    fat: 14,
    friendliness: "ok",
    alternatives: ["Half rice / double greens", "Light sauce", "Brown rice base"],
  },
  {
    keywords: ["pasta", "spaghetti", "alfredo", "carbonara"],
    name: "Pasta dish",
    calories: 700,
    protein: 22,
    carbs: 85,
    fat: 28,
    friendliness: "avoid",
    alternatives: ["Tomato-based over creamy", "Half portion + side salad", "Add grilled chicken, lose the cream"],
  },
  {
    keywords: ["rice", "fried rice", "biryani"],
    name: "Rice dish",
    calories: 600,
    protein: 15,
    carbs: 90,
    fat: 18,
    friendliness: "ok",
    alternatives: ["Half rice portion", "Steamed over fried", "Extra protein, less rice"],
  },
  {
    keywords: ["steak", "beef"],
    name: "Steak (sirloin)",
    calories: 450,
    protein: 46,
    carbs: 0,
    fat: 28,
    friendliness: "ok",
    alternatives: ["Lean cut, trim fat", "Pair with veg not fries"],
    note: "Great protein. Watch the sides and butter.",
  },
  {
    keywords: ["salmon"],
    name: "Grilled salmon",
    calories: 367,
    protein: 40,
    carbs: 0,
    fat: 22,
    friendliness: "good",
    alternatives: [],
    note: "Great protein + healthy fats.",
  },
  {
    keywords: ["eggs", "omelette", "omelet"],
    name: "Eggs / omelette (3 eggs)",
    calories: 230,
    protein: 19,
    carbs: 2,
    fat: 16,
    friendliness: "good",
    alternatives: ["Add veggies", "Use 1 yolk + extra whites for fewer calories"],
  },
  {
    keywords: ["oats", "oatmeal", "porridge"],
    name: "Oatmeal bowl",
    calories: 300,
    protein: 10,
    carbs: 54,
    fat: 6,
    friendliness: "good",
    alternatives: ["Add protein powder", "Top with berries not sugar"],
  },
  // --- Drinks ---
  {
    keywords: ["coke zero", "diet coke", "zero sugar", "pepsi max", "diet soda"],
    name: "Coke Zero / diet soda",
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    friendliness: "good",
    alternatives: ["Sparkling water with lime"],
    note: "Zero calories — totally fine for weight loss. Just don't let it drive sweet cravings.",
  },
  {
    keywords: ["coke", "soda", "pepsi", "sprite", "fanta", "soft drink", "cola"],
    name: "Regular soda (can)",
    calories: 140,
    protein: 0,
    carbs: 39,
    fat: 0,
    friendliness: "avoid",
    alternatives: ["Coke Zero / Diet", "Sparkling water", "Water with lemon"],
    note: "Liquid sugar — switch to the zero-sugar version.",
  },
  {
    keywords: ["juice", "orange juice", "smoothie"],
    name: "Fruit juice / smoothie",
    calories: 250,
    protein: 3,
    carbs: 55,
    fat: 1,
    friendliness: "ok",
    alternatives: ["Whole fruit instead", "Protein smoothie, no added sugar"],
  },
  {
    keywords: ["beer", "wine", "alcohol", "cocktail", "vodka", "whiskey"],
    name: "Alcoholic drink",
    calories: 200,
    protein: 0,
    carbs: 12,
    fat: 0,
    friendliness: "avoid",
    alternatives: ["Soda water + lime", "Spirit + diet mixer", "Just skip it tonight"],
    note: "Stalls fat loss and lowers your willpower for food. Limit it.",
  },
  {
    keywords: ["coffee", "latte", "cappuccino", "americano", "espresso"],
    name: "Coffee (black / light)",
    calories: 10,
    protein: 0,
    carbs: 1,
    fat: 0,
    friendliness: "good",
    alternatives: ["Black or with a splash of milk", "Skip the syrups & whipped cream"],
    note: "Black coffee is basically free. Sugary lattes can be 400+ kcal though.",
  },
  {
    keywords: ["protein shake", "whey", "protein"],
    name: "Protein shake",
    calories: 160,
    protein: 28,
    carbs: 6,
    fat: 3,
    friendliness: "good",
    alternatives: [],
    note: "Great for hitting protein and killing hunger.",
  },
  // --- Snacks / sweets ---
  {
    keywords: ["chocolate", "candy", "dessert", "cake", "ice cream", "donut", "cookie"],
    name: "Dessert / sweets",
    calories: 350,
    protein: 4,
    carbs: 45,
    fat: 18,
    friendliness: "avoid",
    alternatives: ["Greek yogurt + berries", "Square of dark chocolate", "Protein bar"],
  },
  {
    keywords: ["banana", "apple", "fruit", "berries"],
    name: "Whole fruit",
    calories: 95,
    protein: 1,
    carbs: 25,
    fat: 0,
    friendliness: "good",
    alternatives: [],
  },
  {
    keywords: ["nuts", "almonds", "peanuts"],
    name: "Nuts (handful)",
    calories: 200,
    protein: 7,
    carbs: 7,
    fat: 18,
    friendliness: "ok",
    alternatives: ["Measure a single handful — easy to overdo"],
  },
  {
    keywords: ["yogurt", "greek yogurt"],
    name: "Greek yogurt",
    calories: 130,
    protein: 17,
    carbs: 9,
    fat: 3,
    friendliness: "good",
    alternatives: [],
  },
];

/** Find the best matching food fact for a free-text query. */
export function matchFood(query: string): FoodFact | null {
  const q = query.toLowerCase();
  let best: { fact: FoodFact; score: number } | null = null;
  for (const fact of FOOD_DB) {
    for (const kw of fact.keywords) {
      if (q.includes(kw)) {
        const score = kw.length; // prefer longer/more specific matches
        if (!best || score > best.score) best = { fact, score };
      }
    }
  }
  return best?.fact ?? null;
}

/** Find ALL matching foods (for multi-item orders like "burger and fries"). */
export function matchAllFoods(query: string): FoodFact[] {
  const q = query.toLowerCase();
  const found: FoodFact[] = [];
  for (const fact of FOOD_DB) {
    if (fact.keywords.some((kw) => q.includes(kw)) && !found.includes(fact)) {
      found.push(fact);
    }
  }
  return found;
}
