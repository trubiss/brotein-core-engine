import { MealType } from './types';

export type FoodCategory = 'supplement' | 'meat' | 'dairy' | 'fish' | 'eggs' | 'snack';

export interface FoodItem {
  id: string;
  name: string;
  proteinGrams: number;
  category: FoodCategory;
  suggestedMeal?: MealType;
}

export const FOOD_DATABASE: FoodItem[] = [
  { id: 'whey-isolate',   name: 'Whey Isolate',     proteinGrams: 25, category: 'supplement', suggestedMeal: 'snack' },
  { id: 'grilled-chicken',name: 'Grilled Chicken',  proteinGrams: 30, category: 'meat',       suggestedMeal: 'lunch' },
  { id: 'greek-yogurt',   name: 'Greek Yogurt',     proteinGrams: 17, category: 'dairy',      suggestedMeal: 'breakfast' },
  { id: 'tuna-can',       name: 'Tuna Can',         proteinGrams: 25, category: 'fish',       suggestedMeal: 'lunch' },
  { id: 'eggs',           name: 'Eggs (2 large)',   proteinGrams: 12, category: 'eggs',       suggestedMeal: 'breakfast' },
  { id: 'cottage-cheese', name: 'Cottage Cheese',   proteinGrams: 14, category: 'dairy',      suggestedMeal: 'snack' },
  { id: 'salmon',         name: 'Salmon Fillet',    proteinGrams: 28, category: 'fish',       suggestedMeal: 'dinner' },
  { id: 'turkey-slices',  name: 'Turkey Slices',    proteinGrams: 18, category: 'meat',       suggestedMeal: 'lunch' },
  { id: 'protein-bar',    name: 'Protein Bar',      proteinGrams: 20, category: 'snack',      suggestedMeal: 'snack' },
  { id: 'milk',           name: 'Milk (1 cup)',     proteinGrams: 8,  category: 'dairy',      suggestedMeal: 'breakfast' },
];

export function searchFoods(q: string): FoodItem[] {
  const s = q.trim().toLowerCase();
  if (!s) return FOOD_DATABASE;
  return FOOD_DATABASE.filter(f =>
    f.name.toLowerCase().includes(s) || f.category.includes(s)
  );
}
