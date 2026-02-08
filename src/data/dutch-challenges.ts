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
    text: "De kat zit op de mat. De kat is zwart en wit. De kat heet Milo. Hij heeft grote groene ogen en een lange staart.\n\nMilo houdt van melk. Elke ochtend drinkt hij een bakje melk in de keuken. Daarna wast hij zijn gezicht met zijn pootje.\n\nMilo speelt graag met een bal. Hij rent door de kamer en springt op de bank. Soms slaapt hij de hele middag in de zon.\n\nAls het avond is, komt Milo bij ons op de bank zitten. Hij spint heel hard. Wij aaien hem zachtjes. Milo is een lieve kat.",
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
    text: "De hond rent in het park. De hond is groot en bruin. Hij heet Max. Max heeft een dikke vacht en flaporen. Hij kwispelt altijd met zijn staart.\n\nMax houdt van botten. Hij begraaft ze in de tuin. Soms vergeet hij waar hij ze heeft verstopt. Dan graaft hij de hele tuin om!\n\nMax is drie jaar oud. Hij kan zitten, liggen en pootjes geven. Elke dag gaat hij twee keer wandelen met papa.\n\nIn het park speelt Max met andere honden. Hij rent heel hard en springt over de hekjes. Na de wandeling drinkt hij veel water. Max is altijd moe na het park.",
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
    text: "Vandaag schijnt de zon. Het is warm buiten. De lucht is helemaal blauw. Er is geen wolkje te zien. Het is een perfecte zomerdag.\n\nDe kinderen spelen in de tuin. Ze rennen door het gras en lachen hard. De buurkinderen komen ook spelen. Samen bouwen ze een hut van takken.\n\nZe drinken limonade en eten watermeloen. Het sap loopt over hun handen. Mama brengt handdoeken naar buiten.\n\nAls de zon ondergaat, wordt het koeler. De kinderen gaan naar binnen. Ze zijn moe maar gelukkig. Het was een mooie dag.",
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
    text: "Lisa gaat naar school. Ze heeft een rode tas met een beer erop. In de tas zitten boeken, een etui en haar broodtrommel. Ze fietst elke dag naar school.\n\nIn de klas leest ze een boek over dieren. De juf heet mevrouw De Vries. Ze is heel aardig en helpt alle kinderen. Ze heeft lang blond haar.\n\nLisa vindt rekenen leuk. Ze kan al optellen en aftrekken. Haar vriendin Emma vindt tekenen leuker. Samen zitten ze naast elkaar.\n\nNa school speelt Lisa op het schoolplein. Ze klimt op het klimrek en gaat van de glijbaan. Om drie uur haalt papa haar op. Dan vertelt ze alles over haar dag.",
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
    text: "Papa kookt vanavond. Hij draagt een grappig schort met sterren. De keuken ruikt heerlijk. De hele familie heeft honger.\n\nHij maakt soep en brood. De soep is tomatensoep met balletjes. Het brood is warm en vers uit de oven. Mama snijdt de groenten voor de salade.\n\nWe dekken samen de tafel. Iedereen krijgt een bord, een lepel en een glas. De kleine broertje morst altijd een beetje, maar dat is niet erg.\n\nHet eten is lekker! Iedereen zegt: 'Dank je wel, papa!' Na het eten ruimen we samen op. Papa doet de afwas en wij drogen af.",
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
    text: "Wij gaan naar de dierentuin. Het is zaterdag en de zon schijnt. Papa koopt de kaartjes bij de ingang. We krijgen een plattegrond van de dierentuin.\n\nWe zien leeuwen en olifanten. De leeuw brult heel hard. De olifant spuit water met zijn slurf. De aap eet een banaan en kijkt ons grappig aan.\n\nDe pinguïns zwemmen in het water. Ze duiken en vangen visjes. Een pinguïn staat op een rots en fladdert met zijn vleugels. De kinderen lachen hard.\n\nBij de uitgang kopen we een knuffel. Ik kies een kleine pinguïn. Het is heel leuk in de dierentuin! We willen snel weer terug.",
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
    text: "Ons huis is groot en wit. Het staat aan een rustige straat met veel bomen. Er is een mooie tuin met bloemen. Bij de voordeur staat een rode brievenbus.\n\nHet huis heeft vier kamers. De keuken is beneden, naast de woonkamer. In de woonkamer staat een grote bank en een televisie. Daar kijken we samen films.\n\nMijn kamer is boven. Ik heb een blauw bed en een bureau. Aan de muur hangen posters van dieren. Mijn boeken staan op een plank boven het bureau.\n\nIk vind mijn kamer het fijnste plekje in huis. Hier lees ik, teken ik en speel ik met mijn speelgoed. Soms mag mijn vriendje komen logeren. Dan slaapt hij op een matras naast mijn bed.",
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
    text: "We gaan naar het strand. Mama pakt de tassen in met handdoeken, zonnebrand en speelgoed. De rit duurt een half uur. We zingen liedjes in de auto.\n\nDe zee is blauw en het zand is warm. Ik bouw een groot zandkasteel met een gracht eromheen. Papa helpt met de torens. We versieren het kasteel met schelpen.\n\nMijn zus zoekt schelpen langs het water. Ze vindt een hele mooie grote schelp. Ze houdt hem tegen haar oor en luistert naar de zee. Ze heeft al een hele verzameling thuis.\n\nWe eten een ijsje bij het strandhuis. Ik neem chocolade, mijn zus neemt aardbei. Het ijsje smelt snel in de zon. We likken het snel op voordat het op onze handen druipt.",
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
    text: "Vandaag is mijn verjaardag. Ik word acht jaar! Ik word wakker en zing: 'Ik ben jarig, hoera!' Mijn kamer is versierd met slingers en ballonnen.\n\nEr is een grote taart met chocolade. Er staan acht kaarsjes op. Ik blaas ze allemaal uit in één keer. Iedereen klapt en zingt 'Lang zal ze leven!'\n\nMijn vrienden komen spelen. We doen spelletjes in de tuin. We doen stoelendans en zakdoekje leggen. De winnaar krijgt een klein cadeautje.\n\nIk krijg vijf cadeaus. Van opa en oma krijg ik een boek. Van mama en papa krijg ik een nieuwe fiets. Ik ben zo blij! Dit is de beste verjaardag ooit.",
    images: [
      { src: "https://images.unsplash.com/photo-1558636508-e0db3814bd1d?w=400&h=300&fit=crop", alt: "Een verjaardagstaart" },
      { src: "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=400&h=300&fit=crop", alt: "Cadeaus" },
    ],
    questions: [
      { question: "How old is the child turning?", acceptableAnswers: ["8", "eight", "acht"], hint: "Acht = eight" },
      { question: "What is there to eat?", acceptableAnswers: ["cake", "taart", "a cake", "a big cake", "een grote taart", "chocolate cake"], hint: "Taart = cake" },
      { question: "How many presents do they get?", acceptableAnswers: ["5", "five", "vijf"], hint: "Vijf = five" },
    ],
  },
  {
    id: "de-fiets",
    title: "De Fiets",
    text: "Tom heeft een nieuwe fiets. De fiets is rood met witte strepen. Hij heeft een bel en een mandje voorop. Tom is heel trots op zijn fiets.\n\nHij fietst naar de winkel om boodschappen te doen. Onderweg ziet hij koeien in de wei en eenden in de sloot. Hij zwaait naar de buurman die in de tuin werkt.\n\nIn de winkel koopt hij appels, kaas en brood. Hij stopt alles in het mandje van zijn fiets. De mevrouw in de winkel geeft hem een snoepje.\n\nDe rit duurt tien minuten. Tom fietst langs de molen en over de brug. Als hij thuiskomt, zet hij zijn fiets in de schuur. Mama is blij met de boodschappen.",
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
    text: "Het sneeuwt vandaag. Alles is wit: de daken, de auto's en de bomen. De wereld ziet eruit als een sprookje. Wij trekken onze dikke jassen en laarzen aan.\n\nDe kinderen maken een sneeuwpop in de voortuin. Hij is bijna net zo groot als papa. Hij heeft een wortel als neus en knoopjes als ogen. Op zijn hoofd staat een oude hoed.\n\nWe gooien sneeuwballen naar elkaar. Mijn broertje valt in de sneeuw en lacht heel hard. De hond rent ook door de sneeuw en vangt sneeuwvlokken.\n\nAls we koud zijn, gaan we naar binnen. Mama maakt warme chocolademelk met slagroom. We zitten bij de kachel en warmen onze handen. Buiten sneeuwt het nog steeds.",
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
    text: "We wandelen in het bos. De bomen zijn hoog en hun bladeren zijn groen en geel. Het ruikt naar natte aarde en dennennaalden. De zon schijnt door de takken.\n\nWe zien een konijn achter een struik. Het konijn heeft lange oren en een wit staartje. Het hopt snel weg als het ons hoort. We proberen heel stil te zijn.\n\nEr zijn veel paddenstoelen op de grond. Sommige zijn rood met witte stippen. Papa zegt dat we ze niet mogen aanraken. We maken er foto's van met mama's telefoon.\n\nDe vogels zingen mooi in de bomen. We horen ook een specht die op een boom klopt. Bij de beek zien we een kikker op een steen. Het bos is vol avontuur!",
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
