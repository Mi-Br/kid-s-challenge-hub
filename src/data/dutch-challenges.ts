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
  level?: number; // 1, 2, or 3 for beginner, intermediate, advanced
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
      { question: "Hoe heet de kat?", acceptableAnswers: ["milo"], hint: "Kijk naar de derde zin" },
      { question: "Welke kleur heeft de kat?", acceptableAnswers: ["zwart en wit"], hint: "Kijk naar de tweede zin" },
      { question: "Wat drinkt Milo graag?", acceptableAnswers: ["melk"], hint: "Kijk in het tweede stukje" },
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
      { question: "Waar rent de hond?", acceptableAnswers: ["in het park", "het park", "park"], hint: "Kijk naar de eerste zin" },
      { question: "Hoe heet de hond?", acceptableAnswers: ["max"], hint: "Kijk naar de derde zin" },
      { question: "Hoe oud is Max?", acceptableAnswers: ["3", "drie", "drie jaar"], hint: "Kijk in het derde stukje" },
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
      { question: "Hoe is het weer vandaag?", acceptableAnswers: ["warm", "zonnig", "de zon schijnt", "warm en zonnig"], hint: "Kijk naar de eerste twee zinnen" },
      { question: "Waar spelen de kinderen?", acceptableAnswers: ["in de tuin", "de tuin", "tuin"], hint: "Kijk in het tweede stukje" },
      { question: "Wat drinken ze?", acceptableAnswers: ["limonade"], hint: "Kijk in het derde stukje" },
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
      { question: "Welke kleur heeft Lisa's tas?", acceptableAnswers: ["rood", "rode"], hint: "Kijk naar de tweede zin" },
      { question: "Hoe heet de juf?", acceptableAnswers: ["mevrouw de vries", "de vries"], hint: "Kijk in het tweede stukje" },
      { question: "Welk vak vindt Lisa leuk?", acceptableAnswers: ["rekenen"], hint: "Kijk in het derde stukje" },
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
      { question: "Wie kookt vanavond?", acceptableAnswers: ["papa"], hint: "Kijk naar de eerste zin" },
      { question: "Wat voor soep is het?", acceptableAnswers: ["tomatensoep"], hint: "Kijk in het tweede stukje" },
      { question: "Wat snijdt mama?", acceptableAnswers: ["groenten", "de groenten"], hint: "Kijk in het tweede stukje" },
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
      { question: "Waar gaan ze naartoe?", acceptableAnswers: ["de dierentuin", "dierentuin", "naar de dierentuin"], hint: "Kijk naar de eerste zin" },
      { question: "Wat eet de aap?", acceptableAnswers: ["een banaan", "banaan"], hint: "Kijk in het tweede stukje" },
      { question: "Wat doen de pinguïns?", acceptableAnswers: ["zwemmen", "ze zwemmen", "zwemmen in het water"], hint: "Kijk in het derde stukje" },
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
      { question: "Hoeveel kamers heeft het huis?", acceptableAnswers: ["4", "vier"], hint: "Kijk in het tweede stukje" },
      { question: "Waar is de keuken?", acceptableAnswers: ["beneden"], hint: "Kijk in het tweede stukje" },
      { question: "Welke kleur heeft het bed?", acceptableAnswers: ["blauw"], hint: "Kijk in het derde stukje" },
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
      { question: "Welke kleur heeft de zee?", acceptableAnswers: ["blauw"], hint: "Kijk in het tweede stukje" },
      { question: "Wat zoekt de zus?", acceptableAnswers: ["schelpen"], hint: "Kijk in het derde stukje" },
      { question: "Wat eten ze?", acceptableAnswers: ["een ijsje", "ijsje"], hint: "Kijk in het laatste stukje" },
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
      { question: "Hoe oud wordt het kind?", acceptableAnswers: ["8", "acht"], hint: "Kijk naar de tweede zin" },
      { question: "Wat is er te eten?", acceptableAnswers: ["taart", "een grote taart", "chocoladetaart"], hint: "Kijk in het tweede stukje" },
      { question: "Hoeveel cadeaus krijgt hij/zij?", acceptableAnswers: ["5", "vijf"], hint: "Kijk in het laatste stukje" },
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
      { question: "Welke kleur heeft de fiets van Tom?", acceptableAnswers: ["rood"], hint: "Kijk naar de tweede zin" },
      { question: "Waar fietst Tom naartoe?", acceptableAnswers: ["de winkel", "winkel", "naar de winkel"], hint: "Kijk in het tweede stukje" },
      { question: "Hoe lang duurt de rit?", acceptableAnswers: ["tien minuten", "10 minuten", "tien", "10"], hint: "Kijk in het laatste stukje" },
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
      { question: "Wat doet het weer vandaag?", acceptableAnswers: ["het sneeuwt", "sneeuwt", "sneeuwen"], hint: "Kijk naar de eerste zin" },
      { question: "Waarvan is de neus van de sneeuwpop?", acceptableAnswers: ["een wortel", "wortel"], hint: "Kijk in het tweede stukje" },
      { question: "Welk warm drankje drinken ze?", acceptableAnswers: ["warme chocolademelk", "chocolademelk"], hint: "Kijk in het laatste stukje" },
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
      { question: "Waar wandelen ze?", acceptableAnswers: ["in het bos", "het bos", "bos"], hint: "Kijk naar de eerste zin" },
      { question: "Welk dier zien ze?", acceptableAnswers: ["een konijn", "konijn"], hint: "Kijk in het tweede stukje" },
      { question: "Wat doen de vogels?", acceptableAnswers: ["zingen", "ze zingen", "mooi zingen"], hint: "Kijk in het laatste stukje" },
    ],
  },
];

export default dutchChallenges;
