import { MealType } from './types';

export type FoodCategory =
  | 'supplement' | 'meat' | 'poultry' | 'dairy' | 'fish' | 'seafood'
  | 'eggs' | 'snack' | 'legume' | 'grain' | 'nut' | 'plant' | 'drink';

export interface FoodItem {
  id: string;
  name: string;
  proteinGrams: number;       // grams of protein per typical serving
  servingLabel?: string;      // human-friendly serving size
  category: FoodCategory;
  suggestedMeal?: MealType;
}

// Curated database of ~210 common high-protein and everyday foods.
// Values represent grams of protein per the listed serving size.
export const FOOD_DATABASE: FoodItem[] = [
  // ── Supplements / shakes ────────────────────────────────────────────────
  { id: 'whey-isolate',         name: 'Whey Isolate',          proteinGrams: 25, servingLabel: '1 scoop (30g)',   category: 'supplement', suggestedMeal: 'snack' },
  { id: 'whey-concentrate',     name: 'Whey Concentrate',      proteinGrams: 22, servingLabel: '1 scoop (32g)',   category: 'supplement', suggestedMeal: 'snack' },
  { id: 'casein',               name: 'Casein Protein',        proteinGrams: 24, servingLabel: '1 scoop (33g)',   category: 'supplement', suggestedMeal: 'snack' },
  { id: 'plant-protein',        name: 'Plant Protein Blend',   proteinGrams: 21, servingLabel: '1 scoop (30g)',   category: 'supplement', suggestedMeal: 'snack' },
  { id: 'pea-protein',          name: 'Pea Protein',           proteinGrams: 24, servingLabel: '1 scoop (30g)',   category: 'supplement', suggestedMeal: 'snack' },
  { id: 'soy-protein',          name: 'Soy Protein Isolate',   proteinGrams: 25, servingLabel: '1 scoop (30g)',   category: 'supplement', suggestedMeal: 'snack' },
  { id: 'collagen',             name: 'Collagen Peptides',     proteinGrams: 18, servingLabel: '2 scoops (20g)',  category: 'supplement', suggestedMeal: 'breakfast' },
  { id: 'eaa',                  name: 'EAA Drink',             proteinGrams: 10, servingLabel: '1 scoop',         category: 'supplement', suggestedMeal: 'snack' },
  { id: 'mass-gainer',          name: 'Mass Gainer Shake',     proteinGrams: 50, servingLabel: '2 scoops',        category: 'supplement', suggestedMeal: 'snack' },
  { id: 'protein-shake-rtd',    name: 'Ready-to-Drink Shake',  proteinGrams: 30, servingLabel: '1 bottle (330ml)',category: 'supplement', suggestedMeal: 'snack' },
  { id: 'fairlife-shake',       name: 'Fairlife Core Power',   proteinGrams: 26, servingLabel: '1 bottle (414ml)',category: 'supplement', suggestedMeal: 'snack' },
  { id: 'premier-shake',        name: 'Premier Protein Shake', proteinGrams: 30, servingLabel: '1 bottle (325ml)',category: 'supplement', suggestedMeal: 'snack' },

  // ── Poultry ─────────────────────────────────────────────────────────────
  { id: 'chicken-breast',       name: 'Chicken Breast (cooked)',proteinGrams: 31, servingLabel: '100g',           category: 'poultry', suggestedMeal: 'lunch' },
  { id: 'grilled-chicken',      name: 'Grilled Chicken',       proteinGrams: 30, servingLabel: '100g',            category: 'poultry', suggestedMeal: 'lunch' },
  { id: 'chicken-thigh',        name: 'Chicken Thigh (cooked)',proteinGrams: 26, servingLabel: '100g',            category: 'poultry', suggestedMeal: 'dinner' },
  { id: 'rotisserie-chicken',   name: 'Rotisserie Chicken',    proteinGrams: 28, servingLabel: '100g',            category: 'poultry', suggestedMeal: 'dinner' },
  { id: 'chicken-wings',        name: 'Chicken Wings',         proteinGrams: 27, servingLabel: '100g',            category: 'poultry', suggestedMeal: 'dinner' },
  { id: 'turkey-breast',        name: 'Turkey Breast (cooked)',proteinGrams: 30, servingLabel: '100g',            category: 'poultry', suggestedMeal: 'dinner' },
  { id: 'turkey-slices',        name: 'Turkey Deli Slices',    proteinGrams: 18, servingLabel: '4 slices',        category: 'poultry', suggestedMeal: 'lunch' },
  { id: 'ground-turkey-93',     name: 'Ground Turkey 93%',     proteinGrams: 27, servingLabel: '100g',            category: 'poultry', suggestedMeal: 'dinner' },
  { id: 'duck-breast',          name: 'Duck Breast (cooked)',  proteinGrams: 24, servingLabel: '100g',            category: 'poultry', suggestedMeal: 'dinner' },

  // ── Red meat ────────────────────────────────────────────────────────────
  { id: 'sirloin-steak',        name: 'Sirloin Steak (cooked)',proteinGrams: 29, servingLabel: '100g',            category: 'meat',    suggestedMeal: 'dinner' },
  { id: 'ribeye',               name: 'Ribeye Steak',          proteinGrams: 25, servingLabel: '100g',            category: 'meat',    suggestedMeal: 'dinner' },
  { id: 'filet-mignon',         name: 'Filet Mignon',          proteinGrams: 26, servingLabel: '100g',            category: 'meat',    suggestedMeal: 'dinner' },
  { id: 'flank-steak',          name: 'Flank Steak',           proteinGrams: 27, servingLabel: '100g',            category: 'meat',    suggestedMeal: 'dinner' },
  { id: 'ground-beef-90',       name: 'Ground Beef 90/10',     proteinGrams: 26, servingLabel: '100g',            category: 'meat',    suggestedMeal: 'dinner' },
  { id: 'ground-beef-80',       name: 'Ground Beef 80/20',     proteinGrams: 25, servingLabel: '100g',            category: 'meat',    suggestedMeal: 'dinner' },
  { id: 'beef-jerky',           name: 'Beef Jerky',            proteinGrams: 13, servingLabel: '1 oz (28g)',      category: 'meat',    suggestedMeal: 'snack' },
  { id: 'biltong',              name: 'Biltong',               proteinGrams: 16, servingLabel: '1 oz (28g)',      category: 'meat',    suggestedMeal: 'snack' },
  { id: 'pork-chop',            name: 'Pork Chop (cooked)',    proteinGrams: 27, servingLabel: '100g',            category: 'meat',    suggestedMeal: 'dinner' },
  { id: 'pork-tenderloin',      name: 'Pork Tenderloin',       proteinGrams: 28, servingLabel: '100g',            category: 'meat',    suggestedMeal: 'dinner' },
  { id: 'bacon',                name: 'Bacon (cooked)',        proteinGrams: 12, servingLabel: '3 slices',        category: 'meat',    suggestedMeal: 'breakfast' },
  { id: 'turkey-bacon',         name: 'Turkey Bacon',          proteinGrams: 10, servingLabel: '3 slices',        category: 'meat',    suggestedMeal: 'breakfast' },
  { id: 'ham-slices',           name: 'Ham Deli Slices',       proteinGrams: 16, servingLabel: '4 slices',        category: 'meat',    suggestedMeal: 'lunch' },
  { id: 'prosciutto',           name: 'Prosciutto',            proteinGrams: 14, servingLabel: '3 slices (40g)',  category: 'meat',    suggestedMeal: 'lunch' },
  { id: 'sausage-pork',         name: 'Pork Sausage Link',     proteinGrams: 12, servingLabel: '2 links',         category: 'meat',    suggestedMeal: 'breakfast' },
  { id: 'lamb-chop',            name: 'Lamb Chop (cooked)',    proteinGrams: 25, servingLabel: '100g',            category: 'meat',    suggestedMeal: 'dinner' },
  { id: 'venison',              name: 'Venison (cooked)',      proteinGrams: 30, servingLabel: '100g',            category: 'meat',    suggestedMeal: 'dinner' },
  { id: 'bison',                name: 'Bison (cooked)',        proteinGrams: 28, servingLabel: '100g',            category: 'meat',    suggestedMeal: 'dinner' },
  { id: 'corned-beef',          name: 'Corned Beef',           proteinGrams: 18, servingLabel: '100g',            category: 'meat',    suggestedMeal: 'lunch' },
  { id: 'pastrami',             name: 'Pastrami',              proteinGrams: 22, servingLabel: '100g',            category: 'meat',    suggestedMeal: 'lunch' },
  { id: 'salami',               name: 'Salami',                proteinGrams: 13, servingLabel: '5 slices (40g)',  category: 'meat',    suggestedMeal: 'snack' },
  { id: 'pepperoni',            name: 'Pepperoni',             proteinGrams: 9,  servingLabel: '15 slices (30g)', category: 'meat',    suggestedMeal: 'snack' },
  { id: 'hot-dog-beef',         name: 'Beef Hot Dog',          proteinGrams: 7,  servingLabel: '1 hot dog',       category: 'meat',    suggestedMeal: 'lunch' },
  { id: 'meatball',             name: 'Meatballs',             proteinGrams: 20, servingLabel: '4 meatballs',     category: 'meat',    suggestedMeal: 'dinner' },

  // ── Fish & seafood ──────────────────────────────────────────────────────
  { id: 'salmon',               name: 'Salmon Fillet',         proteinGrams: 25, servingLabel: '100g',            category: 'fish',    suggestedMeal: 'dinner' },
  { id: 'smoked-salmon',        name: 'Smoked Salmon',         proteinGrams: 18, servingLabel: '100g',            category: 'fish',    suggestedMeal: 'breakfast' },
  { id: 'tuna-can',             name: 'Tuna (canned in water)',proteinGrams: 25, servingLabel: '1 can (140g)',    category: 'fish',    suggestedMeal: 'lunch' },
  { id: 'ahi-tuna',             name: 'Ahi Tuna Steak',        proteinGrams: 28, servingLabel: '100g',            category: 'fish',    suggestedMeal: 'dinner' },
  { id: 'tilapia',              name: 'Tilapia (cooked)',      proteinGrams: 26, servingLabel: '100g',            category: 'fish',    suggestedMeal: 'dinner' },
  { id: 'cod',                  name: 'Cod (cooked)',          proteinGrams: 23, servingLabel: '100g',            category: 'fish',    suggestedMeal: 'dinner' },
  { id: 'haddock',              name: 'Haddock',               proteinGrams: 24, servingLabel: '100g',            category: 'fish',    suggestedMeal: 'dinner' },
  { id: 'halibut',              name: 'Halibut',               proteinGrams: 27, servingLabel: '100g',            category: 'fish',    suggestedMeal: 'dinner' },
  { id: 'mackerel',             name: 'Mackerel',              proteinGrams: 25, servingLabel: '100g',            category: 'fish',    suggestedMeal: 'dinner' },
  { id: 'sardines',             name: 'Sardines (canned)',     proteinGrams: 23, servingLabel: '1 can (100g)',    category: 'fish',    suggestedMeal: 'lunch' },
  { id: 'anchovies',            name: 'Anchovies',             proteinGrams: 13, servingLabel: '5 fillets',       category: 'fish',    suggestedMeal: 'snack' },
  { id: 'trout',                name: 'Trout (cooked)',        proteinGrams: 24, servingLabel: '100g',            category: 'fish',    suggestedMeal: 'dinner' },
  { id: 'shrimp',               name: 'Shrimp (cooked)',       proteinGrams: 24, servingLabel: '100g',            category: 'seafood', suggestedMeal: 'dinner' },
  { id: 'lobster',              name: 'Lobster',               proteinGrams: 19, servingLabel: '100g',            category: 'seafood', suggestedMeal: 'dinner' },
  { id: 'crab',                 name: 'Crab Meat',             proteinGrams: 19, servingLabel: '100g',            category: 'seafood', suggestedMeal: 'dinner' },
  { id: 'scallops',             name: 'Scallops',              proteinGrams: 20, servingLabel: '100g',            category: 'seafood', suggestedMeal: 'dinner' },
  { id: 'mussels',              name: 'Mussels',               proteinGrams: 24, servingLabel: '100g',            category: 'seafood', suggestedMeal: 'dinner' },
  { id: 'oysters',              name: 'Oysters',               proteinGrams: 9,  servingLabel: '6 oysters',       category: 'seafood', suggestedMeal: 'dinner' },
  { id: 'octopus',              name: 'Octopus (cooked)',      proteinGrams: 30, servingLabel: '100g',            category: 'seafood', suggestedMeal: 'dinner' },
  { id: 'calamari',             name: 'Calamari',              proteinGrams: 18, servingLabel: '100g',            category: 'seafood', suggestedMeal: 'dinner' },

  // ── Eggs ────────────────────────────────────────────────────────────────
  { id: 'eggs',                 name: 'Eggs (2 large)',        proteinGrams: 12, servingLabel: '2 eggs',          category: 'eggs',    suggestedMeal: 'breakfast' },
  { id: 'egg-1',                name: 'Egg (1 large)',         proteinGrams: 6,  servingLabel: '1 egg',           category: 'eggs',    suggestedMeal: 'breakfast' },
  { id: 'egg-3',                name: 'Eggs (3 large)',        proteinGrams: 18, servingLabel: '3 eggs',          category: 'eggs',    suggestedMeal: 'breakfast' },
  { id: 'egg-whites',           name: 'Egg Whites',            proteinGrams: 11, servingLabel: '3 whites (100g)', category: 'eggs',    suggestedMeal: 'breakfast' },
  { id: 'liquid-egg-whites',    name: 'Liquid Egg Whites',     proteinGrams: 26, servingLabel: '1 cup (240ml)',   category: 'eggs',    suggestedMeal: 'breakfast' },
  { id: 'scrambled-eggs',       name: 'Scrambled Eggs',        proteinGrams: 14, servingLabel: '2 eggs',          category: 'eggs',    suggestedMeal: 'breakfast' },
  { id: 'omelette-3',           name: '3-Egg Omelette',        proteinGrams: 20, servingLabel: '3 eggs',          category: 'eggs',    suggestedMeal: 'breakfast' },
  { id: 'hard-boiled-egg',      name: 'Hard-Boiled Egg',       proteinGrams: 6,  servingLabel: '1 egg',           category: 'eggs',    suggestedMeal: 'snack' },
  { id: 'quiche',               name: 'Quiche Slice',          proteinGrams: 14, servingLabel: '1 slice',         category: 'eggs',    suggestedMeal: 'breakfast' },

  // ── Dairy ───────────────────────────────────────────────────────────────
  { id: 'greek-yogurt',         name: 'Greek Yogurt (nonfat)', proteinGrams: 17, servingLabel: '170g cup',        category: 'dairy',   suggestedMeal: 'breakfast' },
  { id: 'greek-yogurt-2',       name: 'Greek Yogurt 2%',       proteinGrams: 20, servingLabel: '170g cup',        category: 'dairy',   suggestedMeal: 'breakfast' },
  { id: 'icelandic-skyr',       name: 'Icelandic Skyr',        proteinGrams: 17, servingLabel: '150g cup',        category: 'dairy',   suggestedMeal: 'breakfast' },
  { id: 'cottage-cheese',       name: 'Cottage Cheese',        proteinGrams: 14, servingLabel: '1/2 cup (113g)',  category: 'dairy',   suggestedMeal: 'snack' },
  { id: 'cottage-cheese-cup',   name: 'Cottage Cheese (1 cup)',proteinGrams: 28, servingLabel: '1 cup (226g)',    category: 'dairy',   suggestedMeal: 'snack' },
  { id: 'milk',                 name: 'Milk (1 cup)',          proteinGrams: 8,  servingLabel: '240ml',           category: 'dairy',   suggestedMeal: 'breakfast' },
  { id: 'skim-milk',            name: 'Skim Milk (1 cup)',     proteinGrams: 8,  servingLabel: '240ml',           category: 'dairy',   suggestedMeal: 'breakfast' },
  { id: 'fairlife-milk',        name: 'Fairlife Milk',         proteinGrams: 13, servingLabel: '1 cup (240ml)',   category: 'dairy',   suggestedMeal: 'breakfast' },
  { id: 'chocolate-milk',       name: 'Chocolate Milk',        proteinGrams: 8,  servingLabel: '1 cup',           category: 'dairy',   suggestedMeal: 'snack' },
  { id: 'cheddar',              name: 'Cheddar Cheese',        proteinGrams: 7,  servingLabel: '1 oz (28g)',      category: 'dairy',   suggestedMeal: 'snack' },
  { id: 'mozzarella',           name: 'Mozzarella',            proteinGrams: 6,  servingLabel: '1 oz (28g)',      category: 'dairy',   suggestedMeal: 'snack' },
  { id: 'string-cheese',        name: 'String Cheese',         proteinGrams: 7,  servingLabel: '1 stick',         category: 'dairy',   suggestedMeal: 'snack' },
  { id: 'feta',                 name: 'Feta',                  proteinGrams: 4,  servingLabel: '1 oz (28g)',      category: 'dairy',   suggestedMeal: 'lunch' },
  { id: 'parmesan',             name: 'Parmesan (grated)',     proteinGrams: 10, servingLabel: '1 oz (28g)',      category: 'dairy',   suggestedMeal: 'dinner' },
  { id: 'goat-cheese',          name: 'Goat Cheese',           proteinGrams: 5,  servingLabel: '1 oz (28g)',      category: 'dairy',   suggestedMeal: 'snack' },
  { id: 'ricotta',              name: 'Ricotta',               proteinGrams: 14, servingLabel: '1/2 cup',         category: 'dairy',   suggestedMeal: 'breakfast' },
  { id: 'cream-cheese',         name: 'Cream Cheese',          proteinGrams: 2,  servingLabel: '1 tbsp',          category: 'dairy',   suggestedMeal: 'breakfast' },
  { id: 'kefir',                name: 'Kefir',                 proteinGrams: 11, servingLabel: '1 cup',           category: 'dairy',   suggestedMeal: 'breakfast' },

  // ── Legumes ────────────────────────────────────────────────────────────
  { id: 'lentils',              name: 'Lentils (cooked)',      proteinGrams: 18, servingLabel: '1 cup (198g)',    category: 'legume',  suggestedMeal: 'lunch' },
  { id: 'black-beans',          name: 'Black Beans (cooked)',  proteinGrams: 15, servingLabel: '1 cup (172g)',    category: 'legume',  suggestedMeal: 'lunch' },
  { id: 'chickpeas',            name: 'Chickpeas (cooked)',    proteinGrams: 15, servingLabel: '1 cup (164g)',    category: 'legume',  suggestedMeal: 'lunch' },
  { id: 'kidney-beans',         name: 'Kidney Beans',          proteinGrams: 15, servingLabel: '1 cup',           category: 'legume',  suggestedMeal: 'lunch' },
  { id: 'pinto-beans',          name: 'Pinto Beans',           proteinGrams: 15, servingLabel: '1 cup',           category: 'legume',  suggestedMeal: 'lunch' },
  { id: 'white-beans',          name: 'White Beans',           proteinGrams: 17, servingLabel: '1 cup',           category: 'legume',  suggestedMeal: 'lunch' },
  { id: 'edamame',              name: 'Edamame',               proteinGrams: 17, servingLabel: '1 cup shelled',   category: 'legume',  suggestedMeal: 'snack' },
  { id: 'soybeans',             name: 'Soybeans (cooked)',     proteinGrams: 29, servingLabel: '1 cup',           category: 'legume',  suggestedMeal: 'dinner' },
  { id: 'tofu-firm',            name: 'Tofu (firm)',           proteinGrams: 15, servingLabel: '100g',            category: 'legume',  suggestedMeal: 'dinner' },
  { id: 'tofu-extra-firm',      name: 'Tofu (extra-firm)',     proteinGrams: 18, servingLabel: '100g',            category: 'legume',  suggestedMeal: 'dinner' },
  { id: 'tempeh',               name: 'Tempeh',                proteinGrams: 19, servingLabel: '100g',            category: 'legume',  suggestedMeal: 'dinner' },
  { id: 'seitan',               name: 'Seitan',                proteinGrams: 25, servingLabel: '100g',            category: 'legume',  suggestedMeal: 'dinner' },
  { id: 'hummus',               name: 'Hummus',                proteinGrams: 5,  servingLabel: '1/4 cup',         category: 'legume',  suggestedMeal: 'snack' },
  { id: 'refried-beans',        name: 'Refried Beans',         proteinGrams: 13, servingLabel: '1 cup',           category: 'legume',  suggestedMeal: 'lunch' },
  { id: 'falafel',              name: 'Falafel',               proteinGrams: 13, servingLabel: '4 balls',         category: 'legume',  suggestedMeal: 'lunch' },
  { id: 'split-peas',           name: 'Split Peas (cooked)',   proteinGrams: 16, servingLabel: '1 cup',           category: 'legume',  suggestedMeal: 'lunch' },
  { id: 'green-peas',           name: 'Green Peas',            proteinGrams: 8,  servingLabel: '1 cup',           category: 'legume',  suggestedMeal: 'dinner' },

  // ── Grains ──────────────────────────────────────────────────────────────
  { id: 'oats',                 name: 'Oats (dry)',            proteinGrams: 10, servingLabel: '1/2 cup (40g)',   category: 'grain',   suggestedMeal: 'breakfast' },
  { id: 'oatmeal',              name: 'Oatmeal (cooked)',      proteinGrams: 6,  servingLabel: '1 cup',           category: 'grain',   suggestedMeal: 'breakfast' },
  { id: 'overnight-oats',       name: 'Overnight Oats',        proteinGrams: 12, servingLabel: '1 cup',           category: 'grain',   suggestedMeal: 'breakfast' },
  { id: 'quinoa',               name: 'Quinoa (cooked)',       proteinGrams: 8,  servingLabel: '1 cup (185g)',    category: 'grain',   suggestedMeal: 'lunch' },
  { id: 'brown-rice',           name: 'Brown Rice (cooked)',   proteinGrams: 5,  servingLabel: '1 cup',           category: 'grain',   suggestedMeal: 'lunch' },
  { id: 'white-rice',           name: 'White Rice (cooked)',   proteinGrams: 4,  servingLabel: '1 cup',           category: 'grain',   suggestedMeal: 'lunch' },
  { id: 'wild-rice',            name: 'Wild Rice',             proteinGrams: 7,  servingLabel: '1 cup',           category: 'grain',   suggestedMeal: 'lunch' },
  { id: 'farro',                name: 'Farro (cooked)',        proteinGrams: 9,  servingLabel: '1 cup',           category: 'grain',   suggestedMeal: 'lunch' },
  { id: 'bulgur',               name: 'Bulgur',                proteinGrams: 6,  servingLabel: '1 cup',           category: 'grain',   suggestedMeal: 'lunch' },
  { id: 'buckwheat',            name: 'Buckwheat (cooked)',    proteinGrams: 6,  servingLabel: '1 cup',           category: 'grain',   suggestedMeal: 'lunch' },
  { id: 'whole-wheat-bread',    name: 'Whole-Wheat Bread',     proteinGrams: 4,  servingLabel: '1 slice',         category: 'grain',   suggestedMeal: 'breakfast' },
  { id: 'sourdough',            name: 'Sourdough Bread',       proteinGrams: 4,  servingLabel: '1 slice',         category: 'grain',   suggestedMeal: 'breakfast' },
  { id: 'bagel',                name: 'Bagel',                 proteinGrams: 11, servingLabel: '1 plain bagel',   category: 'grain',   suggestedMeal: 'breakfast' },
  { id: 'ezekiel-bread',        name: 'Ezekiel Bread',         proteinGrams: 5,  servingLabel: '1 slice',         category: 'grain',   suggestedMeal: 'breakfast' },
  { id: 'protein-bread',        name: 'Protein Bread',         proteinGrams: 10, servingLabel: '1 slice',         category: 'grain',   suggestedMeal: 'breakfast' },
  { id: 'pita',                 name: 'Pita Bread',            proteinGrams: 5,  servingLabel: '1 pita',          category: 'grain',   suggestedMeal: 'lunch' },
  { id: 'tortilla-flour',       name: 'Flour Tortilla',        proteinGrams: 4,  servingLabel: '1 tortilla',      category: 'grain',   suggestedMeal: 'lunch' },
  { id: 'tortilla-corn',        name: 'Corn Tortilla',         proteinGrams: 2,  servingLabel: '1 tortilla',      category: 'grain',   suggestedMeal: 'lunch' },
  { id: 'pasta-cooked',         name: 'Pasta (cooked)',        proteinGrams: 8,  servingLabel: '1 cup',           category: 'grain',   suggestedMeal: 'dinner' },
  { id: 'protein-pasta',        name: 'Protein Pasta (Banza)', proteinGrams: 25, servingLabel: '85g dry',         category: 'grain',   suggestedMeal: 'dinner' },
  { id: 'whole-wheat-pasta',    name: 'Whole-Wheat Pasta',     proteinGrams: 7,  servingLabel: '1 cup cooked',    category: 'grain',   suggestedMeal: 'dinner' },
  { id: 'couscous',             name: 'Couscous',              proteinGrams: 6,  servingLabel: '1 cup cooked',    category: 'grain',   suggestedMeal: 'lunch' },
  { id: 'english-muffin',       name: 'English Muffin',        proteinGrams: 5,  servingLabel: '1 muffin',        category: 'grain',   suggestedMeal: 'breakfast' },
  { id: 'pancakes',             name: 'Pancakes',              proteinGrams: 8,  servingLabel: '2 pancakes',      category: 'grain',   suggestedMeal: 'breakfast' },
  { id: 'protein-pancakes',     name: 'Protein Pancakes',      proteinGrams: 25, servingLabel: '3 pancakes',      category: 'grain',   suggestedMeal: 'breakfast' },
  { id: 'waffle',               name: 'Waffle',                proteinGrams: 6,  servingLabel: '1 waffle',        category: 'grain',   suggestedMeal: 'breakfast' },
  { id: 'cereal-bran',          name: 'Bran Cereal',           proteinGrams: 4,  servingLabel: '1 cup',           category: 'grain',   suggestedMeal: 'breakfast' },
  { id: 'granola',              name: 'Granola',               proteinGrams: 5,  servingLabel: '1/2 cup',         category: 'grain',   suggestedMeal: 'breakfast' },

  // ── Nuts & seeds ───────────────────────────────────────────────────────
  { id: 'almonds',              name: 'Almonds',               proteinGrams: 6,  servingLabel: '1 oz (28g)',      category: 'nut',     suggestedMeal: 'snack' },
  { id: 'peanuts',              name: 'Peanuts',               proteinGrams: 7,  servingLabel: '1 oz (28g)',      category: 'nut',     suggestedMeal: 'snack' },
  { id: 'cashews',              name: 'Cashews',               proteinGrams: 5,  servingLabel: '1 oz (28g)',      category: 'nut',     suggestedMeal: 'snack' },
  { id: 'pistachios',           name: 'Pistachios',            proteinGrams: 6,  servingLabel: '1 oz (28g)',      category: 'nut',     suggestedMeal: 'snack' },
  { id: 'walnuts',              name: 'Walnuts',               proteinGrams: 4,  servingLabel: '1 oz (28g)',      category: 'nut',     suggestedMeal: 'snack' },
  { id: 'pecans',               name: 'Pecans',                proteinGrams: 3,  servingLabel: '1 oz (28g)',      category: 'nut',     suggestedMeal: 'snack' },
  { id: 'macadamia',            name: 'Macadamia Nuts',        proteinGrams: 2,  servingLabel: '1 oz (28g)',      category: 'nut',     suggestedMeal: 'snack' },
  { id: 'brazil-nuts',          name: 'Brazil Nuts',           proteinGrams: 4,  servingLabel: '1 oz (28g)',      category: 'nut',     suggestedMeal: 'snack' },
  { id: 'peanut-butter',        name: 'Peanut Butter',         proteinGrams: 8,  servingLabel: '2 tbsp (32g)',    category: 'nut',     suggestedMeal: 'snack' },
  { id: 'almond-butter',        name: 'Almond Butter',         proteinGrams: 7,  servingLabel: '2 tbsp (32g)',    category: 'nut',     suggestedMeal: 'snack' },
  { id: 'pb-powder',            name: 'PB2 Powder',            proteinGrams: 6,  servingLabel: '2 tbsp',          category: 'nut',     suggestedMeal: 'snack' },
  { id: 'chia-seeds',           name: 'Chia Seeds',            proteinGrams: 5,  servingLabel: '2 tbsp (28g)',    category: 'nut',     suggestedMeal: 'breakfast' },
  { id: 'flax-seeds',           name: 'Flax Seeds',            proteinGrams: 5,  servingLabel: '2 tbsp',          category: 'nut',     suggestedMeal: 'breakfast' },
  { id: 'hemp-seeds',           name: 'Hemp Seeds',            proteinGrams: 10, servingLabel: '3 tbsp (30g)',    category: 'nut',     suggestedMeal: 'breakfast' },
  { id: 'pumpkin-seeds',        name: 'Pumpkin Seeds',         proteinGrams: 9,  servingLabel: '1 oz (28g)',      category: 'nut',     suggestedMeal: 'snack' },
  { id: 'sunflower-seeds',      name: 'Sunflower Seeds',       proteinGrams: 6,  servingLabel: '1 oz (28g)',      category: 'nut',     suggestedMeal: 'snack' },
  { id: 'sesame-seeds',         name: 'Sesame Seeds',          proteinGrams: 5,  servingLabel: '1 oz (28g)',      category: 'nut',     suggestedMeal: 'snack' },
  { id: 'tahini',               name: 'Tahini',                proteinGrams: 5,  servingLabel: '2 tbsp',          category: 'nut',     suggestedMeal: 'snack' },

  // ── Snack & convenience ────────────────────────────────────────────────
  { id: 'protein-bar',          name: 'Protein Bar',           proteinGrams: 20, servingLabel: '1 bar',           category: 'snack',   suggestedMeal: 'snack' },
  { id: 'quest-bar',            name: 'Quest Bar',             proteinGrams: 21, servingLabel: '1 bar',           category: 'snack',   suggestedMeal: 'snack' },
  { id: 'rxbar',                name: 'RXBAR',                 proteinGrams: 12, servingLabel: '1 bar',           category: 'snack',   suggestedMeal: 'snack' },
  { id: 'clif-builder',         name: 'Clif Builder Bar',      proteinGrams: 20, servingLabel: '1 bar',           category: 'snack',   suggestedMeal: 'snack' },
  { id: 'protein-cookie',       name: 'Protein Cookie',        proteinGrams: 16, servingLabel: '1 cookie',        category: 'snack',   suggestedMeal: 'snack' },
  { id: 'protein-chips',        name: 'Protein Chips (Quest)', proteinGrams: 19, servingLabel: '1 bag',           category: 'snack',   suggestedMeal: 'snack' },
  { id: 'protein-puffs',        name: 'Protein Puffs',         proteinGrams: 21, servingLabel: '1 bag',           category: 'snack',   suggestedMeal: 'snack' },
  { id: 'protein-yogurt-drink', name: 'Protein Yogurt Drink',  proteinGrams: 15, servingLabel: '1 bottle',        category: 'snack',   suggestedMeal: 'snack' },
  { id: 'protein-ice-cream',    name: 'Protein Ice Cream (Halo)',proteinGrams: 20, servingLabel: '1 pint',        category: 'snack',   suggestedMeal: 'snack' },
  { id: 'protein-pudding',      name: 'Protein Pudding',       proteinGrams: 17, servingLabel: '1 cup',           category: 'snack',   suggestedMeal: 'snack' },
  { id: 'protein-granola',      name: 'Protein Granola',       proteinGrams: 10, servingLabel: '1/2 cup',         category: 'snack',   suggestedMeal: 'breakfast' },
  { id: 'jerky-turkey',         name: 'Turkey Jerky',          proteinGrams: 11, servingLabel: '1 oz (28g)',      category: 'snack',   suggestedMeal: 'snack' },
  { id: 'meat-stick',           name: 'Meat Stick (Chomps)',   proteinGrams: 9,  servingLabel: '1 stick',         category: 'snack',   suggestedMeal: 'snack' },

  // ── Plant foods (lower protein) ────────────────────────────────────────
  { id: 'broccoli',             name: 'Broccoli (cooked)',     proteinGrams: 3,  servingLabel: '1 cup',           category: 'plant',   suggestedMeal: 'dinner' },
  { id: 'spinach',              name: 'Spinach (cooked)',      proteinGrams: 5,  servingLabel: '1 cup',           category: 'plant',   suggestedMeal: 'dinner' },
  { id: 'kale',                 name: 'Kale (cooked)',         proteinGrams: 3,  servingLabel: '1 cup',           category: 'plant',   suggestedMeal: 'dinner' },
  { id: 'brussels-sprouts',     name: 'Brussels Sprouts',      proteinGrams: 4,  servingLabel: '1 cup',           category: 'plant',   suggestedMeal: 'dinner' },
  { id: 'asparagus',            name: 'Asparagus',             proteinGrams: 3,  servingLabel: '1 cup',           category: 'plant',   suggestedMeal: 'dinner' },
  { id: 'corn',                 name: 'Corn',                  proteinGrams: 5,  servingLabel: '1 cup',           category: 'plant',   suggestedMeal: 'dinner' },
  { id: 'mushrooms',            name: 'Mushrooms',             proteinGrams: 4,  servingLabel: '1 cup',           category: 'plant',   suggestedMeal: 'dinner' },
  { id: 'potato',               name: 'Baked Potato',          proteinGrams: 5,  servingLabel: '1 medium',        category: 'plant',   suggestedMeal: 'dinner' },
  { id: 'sweet-potato',         name: 'Sweet Potato',          proteinGrams: 4,  servingLabel: '1 medium',        category: 'plant',   suggestedMeal: 'dinner' },
  { id: 'artichoke',            name: 'Artichoke',             proteinGrams: 4,  servingLabel: '1 medium',        category: 'plant',   suggestedMeal: 'dinner' },
  { id: 'avocado',              name: 'Avocado',               proteinGrams: 3,  servingLabel: '1 medium',        category: 'plant',   suggestedMeal: 'breakfast' },
  { id: 'banana',               name: 'Banana',                proteinGrams: 1,  servingLabel: '1 medium',        category: 'plant',   suggestedMeal: 'snack' },
  { id: 'apple',                name: 'Apple',                 proteinGrams: 0,  servingLabel: '1 medium',        category: 'plant',   suggestedMeal: 'snack' },
  { id: 'berries-cup',          name: 'Berries (mixed)',       proteinGrams: 1,  servingLabel: '1 cup',           category: 'plant',   suggestedMeal: 'snack' },

  // ── Drinks ──────────────────────────────────────────────────────────────
  { id: 'soy-milk',             name: 'Soy Milk',              proteinGrams: 7,  servingLabel: '1 cup',           category: 'drink',   suggestedMeal: 'breakfast' },
  { id: 'almond-milk',          name: 'Almond Milk',           proteinGrams: 1,  servingLabel: '1 cup',           category: 'drink',   suggestedMeal: 'breakfast' },
  { id: 'oat-milk',             name: 'Oat Milk',              proteinGrams: 3,  servingLabel: '1 cup',           category: 'drink',   suggestedMeal: 'breakfast' },
  { id: 'pea-milk',             name: 'Pea Milk (Ripple)',     proteinGrams: 8,  servingLabel: '1 cup',           category: 'drink',   suggestedMeal: 'breakfast' },
  { id: 'protein-coffee',       name: 'Protein Coffee',        proteinGrams: 15, servingLabel: '1 bottle',        category: 'drink',   suggestedMeal: 'breakfast' },
  { id: 'latte',                name: 'Latte (whole milk)',    proteinGrams: 8,  servingLabel: '12 oz',           category: 'drink',   suggestedMeal: 'breakfast' },

  // ── Common composite meals ─────────────────────────────────────────────
  { id: 'chicken-caesar',       name: 'Chicken Caesar Salad',  proteinGrams: 35, servingLabel: '1 bowl',          category: 'poultry', suggestedMeal: 'lunch' },
  { id: 'chicken-burrito',      name: 'Chicken Burrito',       proteinGrams: 35, servingLabel: '1 burrito',       category: 'poultry', suggestedMeal: 'lunch' },
  { id: 'steak-burrito',        name: 'Steak Burrito',         proteinGrams: 32, servingLabel: '1 burrito',       category: 'meat',    suggestedMeal: 'lunch' },
  { id: 'chicken-bowl',         name: 'Chipotle Chicken Bowl', proteinGrams: 32, servingLabel: '1 bowl',          category: 'poultry', suggestedMeal: 'lunch' },
  { id: 'sushi-roll',           name: 'Sushi Roll (salmon)',   proteinGrams: 18, servingLabel: '8 pieces',        category: 'fish',    suggestedMeal: 'dinner' },
  { id: 'poke-bowl',            name: 'Poke Bowl',             proteinGrams: 30, servingLabel: '1 bowl',          category: 'fish',    suggestedMeal: 'lunch' },
  { id: 'turkey-sandwich',      name: 'Turkey Sandwich',       proteinGrams: 22, servingLabel: '1 sandwich',      category: 'poultry', suggestedMeal: 'lunch' },
  { id: 'cheeseburger',         name: 'Cheeseburger',          proteinGrams: 25, servingLabel: '1 burger',        category: 'meat',    suggestedMeal: 'dinner' },
  { id: 'double-cheeseburger',  name: 'Double Cheeseburger',   proteinGrams: 40, servingLabel: '1 burger',        category: 'meat',    suggestedMeal: 'dinner' },
  { id: 'pizza-slice',          name: 'Pizza Slice',           proteinGrams: 12, servingLabel: '1 slice',         category: 'grain',   suggestedMeal: 'dinner' },
  { id: 'big-mac',              name: 'Big Mac',               proteinGrams: 25, servingLabel: '1 burger',        category: 'meat',    suggestedMeal: 'dinner' },
  { id: 'mcd-mcchicken',        name: 'McChicken',             proteinGrams: 14, servingLabel: '1 sandwich',      category: 'poultry', suggestedMeal: 'lunch' },
  { id: 'mcd-nuggets-10',       name: 'Chicken Nuggets (10pc)',proteinGrams: 23, servingLabel: '10 pieces',       category: 'poultry', suggestedMeal: 'lunch' },
  { id: 'chick-fil-a-sandwich', name: 'Chick-fil-A Sandwich',  proteinGrams: 28, servingLabel: '1 sandwich',      category: 'poultry', suggestedMeal: 'lunch' },
  { id: 'subway-footlong-turkey',name:'Subway Turkey Footlong',proteinGrams: 36, servingLabel: '1 footlong',      category: 'poultry', suggestedMeal: 'lunch' },
  { id: 'protein-smoothie',     name: 'Protein Smoothie',      proteinGrams: 30, servingLabel: '16 oz',           category: 'drink',   suggestedMeal: 'breakfast' },
  { id: 'breakfast-burrito',    name: 'Breakfast Burrito',     proteinGrams: 22, servingLabel: '1 burrito',       category: 'eggs',    suggestedMeal: 'breakfast' },
  { id: 'egg-mcmuffin',         name: 'Egg McMuffin',          proteinGrams: 17, servingLabel: '1 sandwich',      category: 'eggs',    suggestedMeal: 'breakfast' },
  { id: 'protein-oats-bowl',    name: 'Protein Oats Bowl',     proteinGrams: 30, servingLabel: '1 bowl',          category: 'grain',   suggestedMeal: 'breakfast' },
  { id: 'tuna-salad',           name: 'Tuna Salad',            proteinGrams: 24, servingLabel: '1 cup',           category: 'fish',    suggestedMeal: 'lunch' },
  { id: 'chicken-salad',        name: 'Chicken Salad',         proteinGrams: 22, servingLabel: '1 cup',           category: 'poultry', suggestedMeal: 'lunch' },
  { id: 'beef-stew',            name: 'Beef Stew',             proteinGrams: 28, servingLabel: '1 bowl',          category: 'meat',    suggestedMeal: 'dinner' },
  { id: 'chili-con-carne',      name: 'Chili Con Carne',       proteinGrams: 25, servingLabel: '1 bowl',          category: 'meat',    suggestedMeal: 'dinner' },
];

export function searchFoods(q: string): FoodItem[] {
  const s = q.trim().toLowerCase();
  if (!s) return FOOD_DATABASE;
  return FOOD_DATABASE.filter(f =>
    f.name.toLowerCase().includes(s) || f.category.includes(s)
  );
}
