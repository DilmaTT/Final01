import { cn } from "@/lib/utils";

interface PokerCardProps {
  hand: string;
  className?: string;
  fixedCards?: Array<{ rank: string, suit: string }>; // New prop to accept pre-determined suits
}

const SUITS = ['spades', 'hearts', 'diamonds', 'clubs'];

export const PokerCard = ({ hand, className, fixedCards }: PokerCardProps) => {
  // Parse hand like "AA", "AKs", "72o" etc.
  const getCardInfo = (hand: string) => {
    const getRandomSuit = () => SUITS[Math.floor(Math.random() * SUITS.length)];
    const getTwoDifferentRandomSuits = () => {
      let suit1 = getRandomSuit();
      let suit2 = getRandomSuit();
      while (suit1 === suit2) {
        suit2 = getRandomSuit();
      }
      return [suit1, suit2];
    };

    if (hand.length === 2 && hand[0] === hand[1]) {
      // Pocket pairs like AA, KK, etc.
      const [suit1, suit2] = getTwoDifferentRandomSuits();
      return [
        { rank: hand[0], suit: suit1 },
        { rank: hand[1], suit: suit2 }
      ];
    } else if (hand.length === 3) {
      // Suited or offsuit like AKs, AKo
      const suited = hand[2] === 's';
      if (suited) {
        const commonSuit = getRandomSuit();
        return [
          { rank: hand[0], suit: commonSuit },
          { rank: hand[1], suit: commonSuit }
        ];
      } else { // Offsuit
        const [suit1, suit2] = getTwoDifferentRandomSuits();
        return [
          { rank: hand[0], suit: suit1 },
          { rank: hand[1], suit: suit2 }
        ];
      }
    } else if (hand.length === 2) { // Non-paired offsuit like AK, QJ (implicitly offsuit if no 's' or 'o')
      const [suit1, suit2] = getTwoDifferentRandomSuits();
      return [
        { rank: hand[0], suit: suit1 },
        { rank: hand[1], suit: suit2 }
      ];
    }
    // Fallback for invalid hand format, though it should not happen with proper data
    return [
      { rank: 'A', suit: 'spades' },
      { rank: 'A', suit: 'hearts' }
    ];
  };

  // Use fixedCards if provided, otherwise generate based on the hand string
  const cards = fixedCards || getCardInfo(hand);

  const getSuitStyles = (suit: string) => {
    switch (suit) {
      case 'hearts':
        return 'bg-red-600 text-white'; // Черви - красные
      case 'diamonds':
        return 'bg-blue-600 text-white'; // Бубни - синие
      case 'clubs':
        return 'bg-green-600 text-white'; // Крести - зеленые
      case 'spades':
      default:
        return 'bg-gray-500 text-white'; // Пики - серые
    }
  };

  const getSuitSymbol = (suit: string) => {
    switch (suit) {
      case 'hearts':
        return '♥';
      case 'diamonds':
        return '♦';
      case 'clubs':
        return '♣';
      case 'spades':
      default:
        return '♠';
    }
  };

  const formatRank = (rank: string) => {
    if (rank === 'T') return '10';
    return rank;
  };

  return (
    <div className={cn("flex gap-1", className)}>
      {cards.map((card, index) => (
        <div
          key={index}
          className={cn(
            "rounded-lg border-2 border-gray-300 shadow-lg w-12 h-16 sm:w-16 sm:h-20 flex items-center justify-center relative",
            getSuitStyles(card.suit)
          )}
        >
          {/* Suit symbol in top-left corner */}
          <div className="absolute top-1 left-1 text-white text-sm sm:text-lg font-bold opacity-90">
            {getSuitSymbol(card.suit)}
          </div>
          
          <div className="text-2xl sm:text-4xl font-bold">
            {formatRank(card.rank)}
          </div>
        </div>
      ))}
    </div>
  );
};
