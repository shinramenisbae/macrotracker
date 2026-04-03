const quotes = [
  { text: "The only bad workout is the one that didn't happen.", author: "Unknown" },
  { text: "Take care of your body. It's the only place you have to live.", author: "Jim Rohn" },
  { text: "You don't have to be extreme, just consistent.", author: "Unknown" },
  { text: "Your diet is a bank account. Good food choices are good investments.", author: "Bethenny Frankel" },
  { text: "The food you eat can be either the safest and most powerful form of medicine or the slowest form of poison.", author: "Ann Wigmore" },
  { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
  { text: "It's not about perfect. It's about effort.", author: "Jillian Michaels" },
  { text: "Every meal is a chance to nourish your body.", author: "Unknown" },
  { text: "Small daily improvements over time lead to stunning results.", author: "Robin Sharma" },
  { text: "You're only one meal away from being back on track.", author: "Unknown" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Health is not about the weight you lose, but about the life you gain.", author: "Unknown" },
  { text: "What you eat in private, you wear in public.", author: "Unknown" },
  { text: "Motivation is what gets you started. Habit is what keeps you going.", author: "Jim Ryun" },
  { text: "Don't dig your grave with your own knife and fork.", author: "English Proverb" },
  { text: "If it was easy, everybody would do it.", author: "Unknown" },
  { text: "Progress, not perfection.", author: "Unknown" },
  { text: "The pain of discipline is nothing like the pain of disappointment.", author: "Justin Langer" },
  { text: "Abs are made in the kitchen.", author: "Unknown" },
  { text: "You can feel sore tomorrow or you can feel sorry tomorrow. You choose.", author: "Unknown" },
  { text: "A year from now you'll wish you started today.", author: "Karen Lamb" },
  { text: "Your body hears everything your mind says. Stay positive.", author: "Unknown" },
  { text: "Nothing tastes as good as being healthy feels.", author: "Unknown" },
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
  { text: "When you feel like quitting, think about why you started.", author: "Unknown" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  { text: "Strength does not come from physical capacity. It comes from an indomitable will.", author: "Gandhi" },
  { text: "One workout at a time. One meal at a time. One day at a time.", author: "Unknown" },
  { text: "You are what you eat, so don't be fast, cheap, easy, or fake.", author: "Unknown" },
  { text: "The groundwork for all happiness is good health.", author: "Leigh Hunt" },
  { text: "Fall seven times, stand up eight.", author: "Japanese Proverb" },
];

function getDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export default function DailyQuote() {
  const quote = quotes[getDayOfYear() % quotes.length];

  return (
    <div className="px-4 py-3 rounded-xl bg-dark-card/50 border border-dark-border/50 mb-4">
      <p className="text-sm text-gray-300 italic leading-relaxed">"{quote.text}"</p>
      <p className="text-xs text-dark-muted mt-1 text-right">— {quote.author}</p>
    </div>
  );
}
