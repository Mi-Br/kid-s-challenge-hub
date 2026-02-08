export interface DutchQuestion {
  question: string;
  acceptableAnswers: string[]; // lowercase variants that are accepted
  hint?: string;
}

export interface DutchChallenge {
  id: string;
  title: string;
  text: string;
  images: { src: string; alt: string }[];
  questions: DutchQuestion[];
}

const dutchChallenges: DutchChallenge[] = [
  {
    id: "de-kat",
    title: "De Kat",
    text: "De kat zit op de mat. De kat is zwart en wit. De kat heet Milo. Milo houdt van melk. Hij speelt graag met een bal.",
    images: [
      { src: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=300&fit=crop", alt: "Een zwart-witte kat" },
      { src: "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400&h=300&fit=crop", alt: "Een kat die speelt" },
    ],
    questions: [
      { question: "What is the cat's name?", acceptableAnswers: ["milo"], hint: "Look at the third sentence" },
      { question: "What color is the cat?", acceptableAnswers: ["black and white", "zwart en wit", "black & white"], hint: "Zwart = black, wit = white" },
      { question: "What does Milo like to drink?", acceptableAnswers: ["milk", "melk"], hint: "Melk = milk" },
    ],
  },
  {
    id: "de-hond",
    title: "De Hond",
    text: "De hond rent in het park. De hond is groot en bruin. Hij heet Max. Max houdt van botten. Hij is drie jaar oud.",
    images: [
      { src: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=300&fit=crop", alt: "Een bruine hond" },
      { src: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=300&fit=crop", alt: "Een hond in het park" },
    ],
    questions: [
      { question: "Where does the dog run?", acceptableAnswers: ["the park", "het park", "park", "in the park", "in het park"], hint: "Park is the same word!" },
      { question: "What is the dog's name?", acceptableAnswers: ["max"], hint: "Look at the third sentence" },
      { question: "How old is Max?", acceptableAnswers: ["3", "three", "drie", "3 years", "three years", "drie jaar"], hint: "Drie = three" },
    ],
  },
  {
    id: "het-weer",
    title: "Het Weer",
    text: "Vandaag schijnt de zon. Het is warm buiten. De kinderen spelen in de tuin. Ze drinken limonade. Het is een mooie dag.",
    images: [
      { src: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop", alt: "Een zonnige dag" },
      { src: "https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=400&h=300&fit=crop", alt: "Kinderen die buiten spelen" },
    ],
    questions: [
      { question: "What is the weather like today?", acceptableAnswers: ["sunny", "warm", "the sun shines", "de zon schijnt", "warm and sunny"], hint: "Zon = sun" },
      { question: "Where do the children play?", acceptableAnswers: ["the garden", "de tuin", "garden", "tuin", "in the garden", "in de tuin"], hint: "Tuin = garden" },
      { question: "What do they drink?", acceptableAnswers: ["lemonade", "limonade"], hint: "Limonade sounds like..." },
    ],
  },
  {
    id: "de-school",
    title: "De School",
    text: "Lisa gaat naar school. Ze heeft een rode tas. In de klas leest ze een boek. De juf heet mevrouw De Vries. Lisa vindt rekenen leuk.",
    images: [
      { src: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=300&fit=crop", alt: "Een school" },
      { src: "https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?w=400&h=300&fit=crop", alt: "Een kind dat leest" },
    ],
    questions: [
      { question: "What color is Lisa's bag?", acceptableAnswers: ["red", "rood", "rode"], hint: "Rode = red" },
      { question: "What is the teacher's name?", acceptableAnswers: ["mevrouw de vries", "de vries", "mrs de vries"], hint: "Juf = teacher" },
      { question: "What subject does Lisa enjoy?", acceptableAnswers: ["math", "rekenen", "maths", "arithmetic"], hint: "Rekenen = math" },
    ],
  },
  {
    id: "het-eten",
    title: "Het Eten",
    text: "Papa kookt vanavond. Hij maakt soep en brood. De soep is tomatensoep. Mama snijdt de groenten. Het eten is lekker!",
    images: [
      { src: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop", alt: "Tomatensoep" },
      { src: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=300&fit=crop", alt: "Brood" },
    ],
    questions: [
      { question: "Who is cooking tonight?", acceptableAnswers: ["papa", "dad", "father"], hint: "Papa = dad" },
      { question: "What kind of soup is it?", acceptableAnswers: ["tomato soup", "tomatensoep", "tomato"], hint: "Tomaten = tomato" },
      { question: "What does mama cut?", acceptableAnswers: ["vegetables", "groenten", "the vegetables", "de groenten"], hint: "Groenten = vegetables" },
    ],
  },
  {
    id: "de-dierentuin",
    title: "De Dierentuin",
    text: "Wij gaan naar de dierentuin. We zien leeuwen en olifanten. De aap eet een banaan. De pinguïns zwemmen in het water. Het is heel leuk!",
    images: [
      { src: "https://images.unsplash.com/photo-1534567153574-2b12153a87f0?w=400&h=300&fit=crop", alt: "Een leeuw" },
      { src: "https://images.unsplash.com/photo-1462888210965-cdf193e5529e?w=400&h=300&fit=crop", alt: "Pinguïns" },
      { src: "https://images.unsplash.com/photo-1540573133985-87b6da6d54a9?w=400&h=300&fit=crop", alt: "Een aap" },
    ],
    questions: [
      { question: "Where are they going?", acceptableAnswers: ["the zoo", "de dierentuin", "zoo", "dierentuin"], hint: "Dierentuin = zoo" },
      { question: "What does the monkey eat?", acceptableAnswers: ["a banana", "banana", "banaan", "een banaan"], hint: "Banaan = banana" },
      { question: "What do the penguins do?", acceptableAnswers: ["swim", "zwemmen", "swim in the water", "they swim", "swimming"], hint: "Zwemmen = swim" },
    ],
  },
  {
    id: "het-huis",
    title: "Het Huis",
    text: "Ons huis is groot. Het heeft vier kamers. De keuken is beneden. Mijn kamer is boven. Ik heb een blauw bed.",
    images: [
      { src: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=400&h=300&fit=crop", alt: "Een huis" },
      { src: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400&h=300&fit=crop", alt: "Een slaapkamer" },
    ],
    questions: [
      { question: "How many rooms does the house have?", acceptableAnswers: ["4", "four", "vier"], hint: "Vier = four" },
      { question: "Where is the kitchen?", acceptableAnswers: ["downstairs", "beneden", "below"], hint: "Beneden = downstairs" },
      { question: "What color is the bed?", acceptableAnswers: ["blue", "blauw"], hint: "Blauw = blue" },
    ],
  },
  {
    id: "het-strand",
    title: "Het Strand",
    text: "We gaan naar het strand. De zee is blauw. Ik bouw een zandkasteel. Mijn zus zoekt schelpen. We eten een ijsje.",
    images: [
      { src: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop", alt: "Het strand" },
      { src: "https://images.unsplash.com/photo-1473116763249-2faaef81ccda?w=400&h=300&fit=crop", alt: "Een zandkasteel" },
    ],
    questions: [
      { question: "What color is the sea?", acceptableAnswers: ["blue", "blauw"], hint: "Blauw = blue" },
      { question: "What does the sister look for?", acceptableAnswers: ["shells", "schelpen", "seashells"], hint: "Schelpen = shells" },
      { question: "What do they eat?", acceptableAnswers: ["ice cream", "ijsje", "an ice cream", "een ijsje"], hint: "IJsje = ice cream" },
    ],
  },
  {
    id: "de-verjaardag",
    title: "De Verjaardag",
    text: "Vandaag is mijn verjaardag. Ik word acht jaar. Er is een grote taart. Mijn vrienden komen spelen. Ik krijg vijf cadeaus.",
    images: [
      { src: "https://images.unsplash.com/photo-1558636508-e0db3814bd1d?w=400&h=300&fit=crop", alt: "Een verjaardagstaart" },
      { src: "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=400&h=300&fit=crop", alt: "Cadeaus" },
    ],
    questions: [
      { question: "How old is the child turning?", acceptableAnswers: ["8", "eight", "acht"], hint: "Acht = eight" },
      { question: "What is there to eat?", acceptableAnswers: ["cake", "taart", "a cake", "a big cake", "een grote taart"], hint: "Taart = cake" },
      { question: "How many presents do they get?", acceptableAnswers: ["5", "five", "vijf"], hint: "Vijf = five" },
    ],
  },
  {
    id: "de-fiets",
    title: "De Fiets",
    text: "Tom heeft een nieuwe fiets. De fiets is rood. Hij fietst naar de winkel. Hij koopt appels en kaas. De rit duurt tien minuten.",
    images: [
      { src: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=400&h=300&fit=crop", alt: "Een rode fiets" },
      { src: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=300&fit=crop", alt: "Een winkel" },
    ],
    questions: [
      { question: "What color is Tom's bike?", acceptableAnswers: ["red", "rood"], hint: "Rood = red" },
      { question: "Where does Tom ride to?", acceptableAnswers: ["the shop", "the store", "de winkel", "winkel", "shop", "store"], hint: "Winkel = shop" },
      { question: "How long does the ride take?", acceptableAnswers: ["10 minutes", "ten minutes", "tien minuten", "10", "ten", "tien"], hint: "Tien = ten" },
    ],
  },
  {
    id: "de-winter",
    title: "De Winter",
    text: "Het sneeuwt vandaag. Alles is wit. De kinderen maken een sneeuwpop. Hij heeft een wortel als neus. We drinken warme chocolademelk.",
    images: [
      { src: "https://images.unsplash.com/photo-1491002052546-bf38f186af56?w=400&h=300&fit=crop", alt: "Sneeuw" },
      { src: "https://images.unsplash.com/photo-1610398752800-146f269dfcc8?w=400&h=300&fit=crop", alt: "Een sneeuwpop" },
    ],
    questions: [
      { question: "What is the weather doing?", acceptableAnswers: ["snowing", "it is snowing", "het sneeuwt", "snow"], hint: "Sneeuwt = snowing" },
      { question: "What is the snowman's nose made of?", acceptableAnswers: ["a carrot", "carrot", "wortel", "een wortel"], hint: "Wortel = carrot" },
      { question: "What warm drink do they have?", acceptableAnswers: ["hot chocolate", "chocolademelk", "warme chocolademelk", "hot cocoa", "chocolate milk"], hint: "Chocolademelk = chocolate milk" },
    ],
  },
  {
    id: "het-bos",
    title: "Het Bos",
    text: "We wandelen in het bos. De bomen zijn hoog. We zien een konijn. Er zijn veel paddenstoelen. De vogels zingen mooi.",
    images: [
      { src: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=400&h=300&fit=crop", alt: "Een bos" },
      { src: "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=400&h=300&fit=crop", alt: "Een konijn" },
      { src: "https://images.unsplash.com/photo-1504006833117-8886a355efbf?w=400&h=300&fit=crop", alt: "Paddenstoelen" },
    ],
    questions: [
      { question: "Where are they walking?", acceptableAnswers: ["the forest", "het bos", "forest", "bos", "in the forest", "in het bos"], hint: "Bos = forest" },
      { question: "What animal do they see?", acceptableAnswers: ["a rabbit", "rabbit", "konijn", "een konijn"], hint: "Konijn = rabbit" },
      { question: "What do the birds do?", acceptableAnswers: ["sing", "zingen", "they sing", "singing"], hint: "Zingen = sing" },
    ],
  },
];

export default dutchChallenges;

// History management
const HISTORY_KEY = "dutch-challenge-history";

export function getCompletedChallengeIds(): string[] {
  const stored = localStorage.getItem(HISTORY_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function markChallengeCompleted(id: string) {
  const completed = getCompletedChallengeIds();
  if (!completed.includes(id)) {
    completed.push(id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(completed));
  }
}

export function pickSessionChallenges(count = 3): DutchChallenge[] {
  const completed = getCompletedChallengeIds();
  // Prefer unseen challenges
  let available = dutchChallenges.filter((c) => !completed.includes(c.id));

  // If not enough unseen, reset history and use all
  if (available.length < count) {
    localStorage.removeItem(HISTORY_KEY);
    available = [...dutchChallenges];
  }

  // Shuffle and pick
  const shuffled = available.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
