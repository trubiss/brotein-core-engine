import { calculateMacros, saveProfile, setOnboarded, type UserProfile } from '@/lib/store';

interface Props {
  data: {
    name: string;
    email: string;
    weight: number;
    height: number;
    age: number;
    activityLevel: 'active' | 'moderate' | 'recovery';
    goal: 'hypertrophy' | 'equilibrium';
  };
  onComplete: () => void;
  onBack: () => void;
}

export default function ResultsScreen({ data, onComplete, onBack }: Props) {
  const macros = calculateMacros(data.weight, data.activityLevel, data.goal);

  const handleStart = () => {
    const profile: UserProfile = {
      name: data.name,
      email: data.email,
      weight: data.weight,
      height: data.height,
      age: data.age,
      activityLevel: data.activityLevel,
      goal: data.goal,
      dailyProtein: macros.protein,
      dailyCalories: macros.calories,
      dailyCarbs: macros.carbs,
      dailyFats: macros.fats,
      mealFrequency: macros.mealFrequency,
      notifications: true,
    };
    saveProfile(profile);
    setOnboarded();
    onComplete();
  };

  return (
    <div className="flex-1 flex flex-col justify-between">
      <div className="pt-16">
        <h1 className="text-3xl font-bold tracking-[0.1em] mb-2">CALCULATION COMPLETE</h1>
        <div className="w-12 h-0.5 bg-foreground mb-12" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <p className="label-spaced text-center">Daily Protein Target</p>
        <p className="text-7xl font-bold font-display tracking-tight mb-1">{macros.protein}g</p>
        <div className="w-16 h-0.5 bg-foreground my-8" />

        <div className="grid grid-cols-3 gap-8 w-full max-w-xs text-center">
          <div>
            <p className="label-spaced">Calories</p>
            <p className="text-2xl font-bold font-display">{macros.calories}</p>
          </div>
          <div>
            <p className="label-spaced">Carbs</p>
            <p className="text-2xl font-bold font-display">{macros.carbs}g</p>
          </div>
          <div>
            <p className="label-spaced">Fats</p>
            <p className="text-2xl font-bold font-display">{macros.fats}g</p>
          </div>
        </div>

        <div className="mt-8">
          <p className="label-spaced text-center">Meal Frequency</p>
          <p className="text-2xl font-bold font-display text-center">{macros.mealFrequency}x / day</p>
        </div>
      </div>

      <div className="flex gap-4">
        <button className="btn-outline flex-1" onClick={onBack}>BACK</button>
        <button className="btn-primary flex-1" onClick={handleStart}>START TRACKING</button>
      </div>
    </div>
  );
}
