export interface Suggestion {
  name: string;
  protein: number;
}

const FOODS: Suggestion[] = [
  { name: 'Whey Isolate', protein: 25 },
  { name: 'Greek Yogurt', protein: 17 },
  { name: '3 Eggs', protein: 18 },
  { name: 'Grilled Chicken', protein: 35 },
  { name: 'Cottage Cheese', protein: 14 },
  { name: 'Tuna Can', protein: 28 },
  { name: 'Protein Bar', protein: 20 },
  { name: 'Steak', protein: 45 },
  { name: 'Salmon Fillet', protein: 30 },
];

export function getSuggestions(remaining: number): Suggestion[] {
  if (remaining <= 0) return [];
  // Pick 3 foods closest to satisfying remaining or smaller snacks if low
  if (remaining < 20) {
    return FOODS.filter(f => f.protein <= 20).slice(0, 3);
  }
  if (remaining < 40) {
    return FOODS.filter(f => f.protein >= 14 && f.protein <= 28).slice(0, 3);
  }
  return FOODS.filter(f => f.protein >= 25).slice(0, 3);
}
