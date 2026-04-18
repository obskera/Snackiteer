import type {
    MachineSlot,
    SnackItemInstance,
    RoundEventDef,
} from "./snackTypes";
import { getItemDef } from "./itemDefs";
import { priceAdjustment } from "./snackFactory";

import type { TypewriterLine } from "@/hooks/useTypewriter";

// ── Customer name pool ───────────────────────────────────

const FIRST_NAMES = [
    "Dave",
    "Karen",
    "Gus",
    "Tina",
    "Brock",
    "Yuki",
    "Mo",
    "Liz",
    "Chad",
    "Mabel",
    "Hank",
    "Priya",
    "Reggie",
    "Fern",
    "Duke",
    "Jess",
    "Barb",
    "Clint",
    "Suki",
    "Vlad",
    "Nora",
    "Benny",
    "Dot",
    "Ravi",
    "Kip",
    "Luna",
    "Earl",
    "Zara",
    "Greta",
    "Nico",
    "Pam",
    "Sergei",
    "Trudy",
    "Axel",
    "Iris",
    "Hiro",
    "Dolly",
    "Marco",
    "Opal",
    "Finn",
    "Betty",
    "Raj",
    "Xena",
    "Otis",
    "Ming",
    "Leroy",
    "Astrid",
    "Jorge",
    "Penny",
    "Sven",
    "Kenji",
    "Flo",
    "Dex",
    "Maude",
    "Rocco",
    "Ingrid",
    "Buzz",
    "Edna",
    "Khalil",
    "Wanda",
    "Rufus",
    "Tamsin",
    "Igor",
    "Olive",
    "Gwen",
    "Milo",
    "Faye",
    "Lars",
    "Bea",
    "Otto",
    "Nell",
    "Kirk",
    "Ada",
    "Bruno",
    "Cleo",
    "Dane",
    "Eve",
    "Felix",
    "Gaia",
    "Hugo",
    "Ivy",
    "Jasper",
    "Kit",
    "Lola",
    "Nash",
    "Oona",
    "Pike",
    "Quinn",
    "Rosa",
    "Sol",
    "Thea",
    "Udo",
    "Vera",
    "Walt",
    "Xander",
    "Yvette",
    "Zeke",
    "Alma",
    "Boyd",
    "Cass",
    "Dion",
    "Edie",
    "Flint",
    "Gigi",
    "Hart",
    "Ilsa",
    "Jules",
    "Kira",
    "Lev",
    "Mona",
    "Ned",
    "Orla",
    "Prue",
    "Rex",
    "Sage",
    "Tito",
    "Uma",
    "Vex",
    "Wyn",
    "Xixi",
    "Yael",
    "Zola",
    "Abe",
    "Blair",
    "Cora",
    "Drew",
    "Esme",
    "Ford",
    "Gale",
    "Hope",
    "Ivan",
    "Joan",
    "Knox",
    "Lily",
    "Mack",
    "Nia",
    "Owen",
    "Paz",
    "Ren",
    "Sky",
    "Tess",
    "Uri",
    "Val",
    "Wren",
    "Xia",
    "Yuri",
    "Zara",
    "Ace",
    "Beck",
    "Clay",
    "Dale",
    "Elm",
    "Fay",
    "Gil",
    "Hugh",
    "Ida",
    "Jay",
    "Kay",
    "Lou",
    "Mae",
    "Nix",
    "Oak",
    "Pip",
    "Rae",
    "Sam",
    "Tab",
    "Viv",
    "Zelda",
    "Arlo",
    "Bess",
    "Cruz",
    "Dina",
    "Enzo",
    "Flora",
    "Grey",
    "Haze",
    "Ines",
    "Jude",
    "Kell",
    "Lux",
    "Mars",
    "Noel",
    "Olin",
    "Pearl",
    "Quill",
    "Rhea",
    "Shay",
    "Tara",
    "Ulla",
    "Vance",
    "Wave",
    "Xeno",
    "Yoko",
    "Zed",
    "Ansel",
    "Birch",
    "Cliff",
    "Dawn",
    "Echo",
    "Frost",
    "Glen",
    "Hana",
    "Iris",
    "Jet",
    "Kane",
    "Leah",
    "Moss",
    "Nova",
    "Orion",
    "Plum",
    "Rune",
    "Storm",
    "Twig",
    "Vale",
    "Wynn",
    "Zephyr",
    "Ash",
    "Bram",
    "Cove",
    "Dove",
    "Ember",
    "Fleur",
    "Greer",
    "Heath",
    "Indigo",
    "Jett",
    "Kai",
    "Lake",
    "Maple",
    "North",
    "Onyx",
    "Petra",
    "Rain",
    "Slate",
    "Terra",
    "Ursa",
    "Vesper",
    "Wilder",
    "Yarrow",
    "Zen",
    "Alden",
    "Briar",
    "Cedar",
    "Delta",
    "Ellis",
    "Freya",
    "Garnet",
    "Holly",
    "Izar",
    "Junco",
    "Kestrel",
    "Lark",
    "Merle",
    "Nestor",
    "Oleander",
    "Piper",
    "Quince",
    "Robin",
    "Sparrow",
    "Tansy",
    "Umber",
    "Violet",
    "Willow",
    "Zinnia",
    "Alder",
    "Bay",
    "Coral",
    "Dusk",
    "Elm",
    "Fable",
    "Grove",
    "Harbor",
    "Isle",
    "Jasmine",
    "Kelp",
    "Lichen",
    "Meadow",
    "Nimbus",
    "Oasis",
    "Pebble",
    "Ridge",
    "Sable",
    "Tide",
    "Umber",
    "Vista",
    "Wisteria",
    "Xerxes",
    "Yew",
    "Basil",
    "Clover",
    "Dahlia",
    "Fern",
    "Hazel",
    "Laurel",
    "Olive",
    "Reed",
    "Rowan",
    "Thyme",
    "Wren",
    "Sage",
    "Rue",
    "Bryn",
    "Cade",
    "Darcy",
    "Elowen",
    "Fia",
    "Grit",
    "Huck",
    "Io",
    "Jinx",
    "Koda",
    "Lin",
    "Mab",
    "Nyx",
    "Oz",
    "Pan",
    "Rook",
    "Suri",
    "Taz",
    "Uma",
    "Vex",
    "Wolf",
    "Yara",
    "Zuri",
    "Ajax",
    "Bolt",
    "Chip",
    "Dash",
    "Edge",
    "Fox",
    "Grim",
    "Hook",
    "Ice",
    "Jab",
    "King",
    "Lynx",
    "Muse",
    "Nemo",
    "Opus",
    "Puck",
    "Quest",
    "Riot",
    "Styx",
    "Thor",
    "Vice",
    "Warp",
    "Yogi",
    "Zoom",
    "Blitz",
    "Crash",
    "Drift",
    "Flash",
    "Glitch",
    "Hex",
    "Jinx",
    "Knack",
    "Latch",
    "Morph",
    "Nudge",
    "Pixel",
    "Quirk",
    "Rush",
    "Spark",
    "Trick",
    "Volt",
    "Whisk",
    "Zing",
    "Blaze",
    "Crux",
    "Dex",
    "Fizz",
    "Haze",
    "Jazz",
    "Maze",
    "Prism",
    "Quartz",
    "Swirl",
    "Twist",
    "Vortex",
    "Whirl",
    "Axle",
    "Beam",
    "Coil",
    "Dynamo",
    "Flux",
    "Gear",
    "Hinge",
    "Lever",
    "Motor",
    "Pulse",
    "Relay",
    "Shaft",
    "Turbo",
    "Valve",
    "Widget",
    "Zap",
    "Arc",
    "Burr",
    "Cam",
    "Dowel",
    "Fuse",
    "Gauge",
    "Jack",
    "Lug",
    "Nut",
    "Pawl",
    "Rivet",
    "Shim",
    "Tang",
    "Wedge",
    "Axel",
    "Brass",
    "Cork",
    "Drum",
    "Flange",
    "Gasket",
    "Hub",
    "Lathe",
    "Mandrel",
    "Nozzle",
    "Piston",
    "Ratchet",
    "Spool",
    "Washer",
];

const DESCRIPTORS = [
    "a tired office worker",
    "someone in a hurry",
    "a suspicious-looking teenager",
    "a very hungry construction worker",
    "an old lady with exact change",
    "a guy who's clearly lost",
    "a student pulling an all-nighter",
    "someone who just finished a jog",
    "a small child with a crumpled bill",
    "a person arguing on the phone",
    "a vending machine enthusiast",
    "someone who smells like coffee",
    "a delivery driver on break",
    "a tourist taking photos of everything",
    "an accountant counting coins",
    "someone wearing a cape for no reason",
    "a firefighter still in full gear",
    "three kids in a trenchcoat",
    "a mime (they don't speak but their eyes say everything)",
    "an exhausted parent carrying a sleeping toddler",
    "someone who clearly just woke up",
    "a person with way too many grocery bags",
    "a gym bro who won't stop flexing",
    "someone dressed entirely in denim",
    "a very polite robot (or a person in a costume?)",
    "a suspiciously cheerful person",
    "someone muttering about their horoscope",
    "a food blogger filming everything",
    "a person who keeps checking behind them",
    "someone aggressively chewing gum",
    "a retired pirate (they said so)",
    "a dog walker with zero dogs",
    "a competitive eater in training",
    "someone covered in paint",
    "a person wearing sunglasses indoors at night",
    "an off-duty mall Santa",
    "someone who just lost a bet",
    "a very tall person who has to duck",
    "a person carrying a sword (it's foam, probably)",
    "someone holding a live chicken",
    "a person who keeps sniffing the air dramatically",
    "a clown between gigs",
    "someone carrying six textbooks and crying",
    "a person in a bathrobe who clearly just woke up",
    "an aspiring magician practicing card tricks badly",
    "someone wearing two different shoes on purpose",
    "a lifeguard very far from any body of water",
    "a person arguing with their GPS",
    "someone who looks like they lost a fight with a lawn sprinkler",
    "a barista on their seventh espresso",
    "someone wearing a fanny pack ironically (or not, hard to tell)",
    "a person who keeps quoting movies nobody's seen",
    "a very small person in a very large hat",
    "someone carrying a taxidermy owl",
    "a person who clearly just rage-quit something",
    "a professional mourner on their lunch break",
    "someone aggressively reading a self-help book",
    "a person whose phone has been ringing for three minutes straight",
    "an off-duty clown (the makeup is smudged but unmistakable)",
    "someone wearing rollerblades indoors",
    "a person who thinks they're invisible (they are not)",
    "someone speed-walking with no clear destination",
    "a medieval knight cosplayer still in full armor",
    "a person who brought their own chair",
    "someone whispering into a walkie-talkie",
    "a fortune teller who saw this coming",
    "a person covered in cat hair (no cats visible)",
    "someone wearing oven mitts for no apparent reason",
    "a person practicing tai chi at double speed",
    "an astronaut (costume? uniform? unclear)",
    "someone who smells strongly of cinnamon",
    "a person carrying a ladder sideways through a crowd",
    "an opera singer who hasn't stopped warming up",
    "someone with a parrot on each shoulder",
    "a person writing a novel on napkins",
    "someone in full scuba gear (they're nowhere near water)",
    "a person who introduced themselves as 'The Manager'",
    "someone juggling lemons and losing",
    "a person with an extremely complicated hat",
    "someone wearing a name tag that says 'Human Person'",
    "a chess player mid-game (they brought the board)",
    "someone carrying a very long baguette like a sword",
    "a person who keeps checking their watch (they're not wearing one)",
    "someone in a wedding dress doing errands",
    "a competitive yodeler between rounds",
    "a person whose backpack is making suspicious beeping sounds",
    "someone who walks backwards and seems fine with it",
    "a lumberjack in the city for the first time",
    "a person carrying a fish tank (with fish)",
    "someone who's clearly allergic to everything but doesn't care",
    "a telegraph operator who refuses to update",
    "someone wearing noise-canceling headphones and shouting",
    "a person who keeps tripping over nothing",
    "someone counting backwards from a thousand",
    "a person who brought their emotional support cactus",
    "an accountant having an existential crisis",
    "someone wearing a lab coat covered in glitter",
    "a person arguing with a pigeon",
    "someone who claims they're from the future",
    "a person in a sleeping bag who shuffled here somehow",
    "an interpretive dancer interpreting the vending machine",
    "someone wearing a snorkel as a fashion statement",
    "a person who keeps doing jazz hands at nobody",
    "someone balancing a stack of pizza boxes",
    "a ventriloquist without their dummy (the dummy is on vacation)",
    "a person wearing a full tuxedo at 2pm on a Tuesday",
    "someone who keeps taking their pulse nervously",
    "a person who brought binoculars to look at the snacks",
    "someone who communicates exclusively in finger guns",
    "a person wearing one roller skate",
    "someone who keeps apologizing to the floor",
    "a time traveler who seems confused by modern snack packaging",
    "a person carrying a watermelon under each arm",
    "someone doing crossword puzzles while walking",
    "a retired stunt double with a visible limp",
    "someone wearing a tinfoil hat (for protection, they explain)",
    "a person who speaks only in questions",
    "someone who brought a folding table and is setting it up",
    "a person wrapped in a blanket like a burrito",
    "someone who keeps high-fiving strangers",
    "a person photosynthesizing (standing very still in sunlight)",
    "someone who arrived by unicycle",
    "a person with really, really long fingernails",
    "someone in a hazmat suit (just being careful)",
    "a person whose pockets are full of loose spaghetti",
    "someone who barks at squirrels",
    "a person carrying a trophy from an unknown competition",
    "someone who keeps doing push-ups between sentences",
    "a person who brought their own spotlight",
    "someone reading the machine's serial number out loud",
    "a person who is definitely three raccoons in a coat",
    "someone wearing a sash that says 'Most Likely To Snack'",
    "a person who arrived by skateboard and immediately fell off",
    "someone who keeps flexing at their own reflection",
    "a person with confetti in their hair from an unknown celebration",
    "someone who's been standing here since the machine was installed",
    "a person who brought their own condiments",
    "someone rehearsing an apology to the machine",
    "a person who smells like a campfire",
    "someone doing math on their hand with a marker",
    "a person who keeps saying 'trust the process'",
    "someone in head-to-toe camouflage (failing to blend in)",
    "a person carrying a ukulele they clearly can't play",
    "someone with a monocle and strong opinions",
    "a person who sneezes every twelve seconds exactly",
    "someone who's been circling the machine for twenty minutes",
    "a person wearing a cape and not acknowledging it",
    "someone who keeps whispering to their shoes",
    "a person who arrived in a shopping cart",
    "someone consulting a Magic 8-Ball for snack advice",
    "a person whose hair defies gravity and explanation",
    "someone who introduced themselves to the machine by name",
    "a person carrying a comically large key",
    "someone who appears to be levitating (they're on tiptoes)",
    "a cowboy who's never seen a vending machine before",
    "someone who keeps narrating their own actions out loud",
    "a person who brought a stool to reach the top row",
    "someone who's clearly in the witness protection program",
    "a retired superhero just trying to get a snack",
    "someone whose shirt says 'I PUT THE SNACK IN SNACKITEER'",
    "a person who arrived by pogo stick",
    "someone who's been talking to the machine for 10 minutes",
    "a person in full plate mail (historically inaccurate, but committed)",
    "someone who tip-toed here and won't explain why",
    "a person who is visibly vibrating",
    "someone wearing a sandwich board that says 'NEED SNACKS'",
    "a person who keeps looking at the sun and squinting",
    "someone who arrived with a dramatic entrance and theme music (from their phone)",
    "a ghost (or someone very pale and quiet)",
    "someone who keeps measuring the machine with a tape measure",
    "a person who brought a tiny folding chair and is sitting in front of the machine",
    "someone in a bear costume (the head is off, they're sweating)",
    "a person who clearly hasn't eaten in days based on the look in their eyes",
    "someone who keeps reciting prime numbers",
    "a person carrying a surfboard in a landlocked city",
    "someone who's been staring at the candy bar slot for an uncomfortable amount of time",
    "a person who keeps whispering 'soon' to the machine",
    "someone who brought their own napkin, plate, and fork",
    "a person having a staring contest with their own reflection in the glass",
    "someone who arrived in a hot dog costume and refuses to discuss it",
    "a street performer taking a snack break",
    "someone who keeps looking over both shoulders nervously",
    "a person who won't stop humming the Jeopardy theme",
    "someone who brought a friend just to watch them buy a snack",
    "a person speed-reading every label on the machine",
    "someone who arrived dramatically and is breathing heavily",
    "a person covered in stickers from unknown events",
    "someone who keeps patting the machine encouragingly",
    "a person who appears to be sleepwalking (but their aim is perfect)",
    "someone conducting an invisible orchestra while waiting",
    "a person who brought a lawn chair and a cooler but no money",
    "someone who keeps doodling on their hand with a sharpie",
    "a person carrying seventeen keychains and nothing else",
    "someone who introduced themselves as 'the snack whisperer'",
    "a lost tour group of one",
    "someone who keeps doing the robot between decisions",
    "a person who smells like they work at a candle factory",
    "someone who arrived in a kayak (there is no water nearby)",
    "a person whose watch alarm keeps going off",
    "someone who keeps testing the structural integrity of the machine",
    "a person who brought a very small dog in a very large purse",
    "someone who is clearly procrastinating something important",
    "a person wearing mismatched everything on purpose (they claim)",
    "someone who hasn't blinked once since arriving",
    "a person who keeps making 'beep boop' sounds at the buttons",
    "someone who's writing a Yelp review in real time",
    "a person who arrived by running and hasn't caught their breath yet",
    "someone who brought popcorn to watch other people buy snacks",
    "a person who keeps trying to insert a library card",
    "someone who appears to be made entirely of flannel",
    "a person who talks to the machine like it's a horse",
    "someone still in their pajamas at 3pm",
    "a person who arrived by scooter and parked it inside",
    "someone who keeps doing lunges while deciding",
    "a person whose ringtone is just someone screaming",
    "someone carrying a cat that also looks hungry",
    "a person who smells like they bathed in hand sanitizer",
    "someone visibly calculating tip for a machine",
    "a person who just finished a marathon and is still running in place",
    "someone who brought their own taste-testing scorecards",
    "a person who keeps pressing buttons in Morse code",
    "someone wearing a crown (Burger King? Real? Unknown.)",
    "a person who arrived by shopping cart and shows no signs of stopping",
    "someone who keeps pointing at items and saying 'enhance'",
    "a very normal person (suspicious)",
];

// ── Reaction pools ───────────────────────────────────────

type Reaction = (name: string, item: string) => string;
type SkipReaction = (name: string) => string;

// ── Match reactions (mood-specific + generic fallbacks) ──

const MATCH_GENERIC: Reaction[] = [
    (name, item) => `${name} grabs the ${item}. Nice.`,
    (name, item) => `${name} slams the button for ${item}. No hesitation.`,
    (name, item) => `"Perfect," mutters ${name}, taking the ${item}.`,
    (name, item) => `${name} does a little fist pump. ${item} acquired.`,
    (name, item) => `${name} lunges for the ${item} like it owes them money.`,
    (name, item) =>
        `${name} takes the ${item} with the confidence of someone who knows what they want.`,
    (name, item) =>
        `The ${item} falls. ${name} catches it like a newborn. Beautiful.`,
    (name, item) => `${name} whispers "come to me" and takes the ${item}.`,
    (name, item) => `${name} and the ${item} lock eyes. It was meant to be.`,
    (name, item) =>
        `${name} presses the button with their whole palm. ${item} deployed.`,
    (name, item) =>
        `${name} takes the ${item} and immediately smells it. Satisfied.`,
    (name, item) => `"Mine." ${name} claims the ${item}. End of discussion.`,
    (name, item) => `${name} selects the ${item} with surgical precision.`,
    (name, item) =>
        `${name} high-fives the machine after getting the ${item}. The machine does not high-five back.`,
    (name, item) =>
        `${name} grabs the ${item} and does a little victory dance. Nobody's watching. Or are they.`,
    (name, item) =>
        `${name} gently caresses the button before pressing it. ${item} summoned.`,
    (name, item) =>
        `${name} takes the ${item} and holds it above their head like a trophy. Majestic.`,
    (name, item) =>
        `"Today is a GOOD day." ${name} takes the ${item} with zero hesitation.`,
    (name, item) =>
        `${name} does a little bow to the machine. Takes the ${item}. Classy.`,
    (name, item) =>
        `${name} narrates their own purchase of the ${item} in third person. Dramatic.`,
    (name, item) =>
        `${name} gives the machine a thumbs up after getting the ${item}. Wholesome.`,
    (name, item) =>
        `${name} takes the ${item} and kisses it. The wrapper crinkles. Romance.`,
    (name, item) =>
        `"You complete me," ${name} whispers to the ${item}. It's a snack. They don't care.`,
    (name, item) =>
        `${name} presses the button, catches the ${item} mid-air. Olympic-level reflexes.`,
    (name, item) =>
        `${name} moonwalks up to the machine and takes the ${item}. Smooth.`,
    (name, item) =>
        `${name} thanks the machine out loud after getting the ${item}. It's a machine. But still.`,
    (name, item) =>
        `${name} takes the ${item} and immediately starts planning their second visit.`,
    (name, item) =>
        `${name} makes the ${item} purchase look like an Olympic sport. 10/10 form.`,
    (name, item) =>
        `${name} takes the ${item} and tucks it into their jacket like a precious artifact.`,
    (name, item) =>
        `"Don't mind if I do." ${name} takes the ${item} with a grin.`,
    (name, item) =>
        `${name} winks at the machine. Takes the ${item}. Was the wink necessary? No. Did it happen? Yes.`,
    (name, item) =>
        `${name} gets the ${item} and pumps their fist so hard they almost pull a muscle.`,
    (name, item) =>
        `${name} writes "thank you" in the dust on the glass. Takes the ${item}.`,
    (name, item) =>
        `${name} does finger guns at the machine after getting the ${item}. Pew pew.`,
    (name, item) =>
        `${name} takes the ${item} with the reverence of someone receiving a diploma.`,
    (name, item) =>
        `${name} salutes the machine. Takes the ${item}. At ease, soldier.`,
    (name, item) =>
        `${name} makes airplane noises while moving the ${item} to their bag. They're an adult.`,
    (name, item) =>
        `${name} takes the ${item} and immediately tells a stranger about it. The stranger doesn't care.`,
    (name, item) =>
        `${name} catches the ${item} and yells "GOOOAL!" Nobody else is here.`,
    (name, item) =>
        `${name} pockets the ${item} and walks away whistling. Transaction complete.`,
    (name, item) =>
        `${name} inspects the ${item} from every angle. Satisfied. Takes it.`,
    (name, item) =>
        `"This is exactly what I needed." ${name} takes the ${item} like fate intended it.`,
    (name, item) =>
        `${name} nods approvingly at the machine. Good machine. ${item} acquired.`,
    (name, item) =>
        `${name} takes the ${item} and texts someone about it. The text just says "YES."`,
];

const MATCH_BY_MOOD: Record<string, Reaction[]> = {
    sweet: [
        (name, item) =>
            `${name} would commit a felony for something sweet. The ${item} saves a life today.`,
        (name, item) => `${name}'s eyes go wide. ${item}. Sugar. YES.`,
        (name, item) =>
            `"CANDY!" ${name} practically headbutts the glass to get the ${item}.`,
        (name, item) =>
            `${name} cradles the ${item} like a newborn. Sweet, sweet sugar.`,
        (name, item) =>
            `The ${item} calls to ${name} like a sugary siren. They are powerless.`,
        (name, item) =>
            `${name} makes a noise only dogs can hear. The ${item} is PERFECT.`,
        (name, item) =>
            `${name} hugs the ${item} through the glass before it even drops. Pure love.`,
        (name, item) =>
            `"I KNEW you'd have it." ${name} takes the ${item} like they've been reunited with a lost child.`,
        (name, item) =>
            `${name}'s pupils dilate to the size of dinner plates. ${item}. SUGAR. NOW.`,
        (name, item) =>
            `${name} sheds a single tear of joy. The ${item} is everything they dreamed of.`,
        (name, item) =>
            `${name} presses their face against the glass. The ${item} is RIGHT THERE. Sugar. SUGAR.`,
        (name, item) =>
            `"I have been WAITING for this." ${name} takes the ${item} like a predator catching prey.`,
        (name, item) =>
            `${name}'s blood sugar was dangerously low. The ${item} is literally medicine. Delicious medicine.`,
        (name, item) =>
            `${name} does a full pirouette of joy. The ${item} is SWEET. Life is SWEET. Everything is SWEET.`,
        (name, item) =>
            `${name} grabs the ${item} and whispers sweet nothings to it. The wrapper blushes. Probably.`,
        (name, item) =>
            `${name} takes the ${item} and holds it to their chest. "We're going home, baby."`,
        (name, item) =>
            `The ${item} drops. ${name} catches it and immediately names it. They're keeping it. (They eat it 30 seconds later.)`,
        (name, item) =>
            `${name} sees the ${item} and their whole body relaxes. Sugar crisis averted.`,
        (name, item) =>
            `${name} takes the ${item} with both hands trembling with sugary anticipation.`,
    ],
    salty: [
        (name, item) =>
            `${name} spots the ${item}. Salty. Crunchy. Life is good.`,
        (name, item) =>
            `"Oh HELLO," ${name} says to the ${item}, like greeting an old friend.`,
        (name, item) =>
            `${name} needed sodium and the ${item} delivers. Their blood pressure doesn't mind.`,
        (name, item) => `${name} snatches the ${item}. Cronch. Perfect.`,
        (name, item) =>
            `${name} can already taste the salt. The ${item} doesn't stand a chance.`,
        (name, item) =>
            `"This is the crunch I've been missing," ${name} says, cradling the ${item}.`,
        (name, item) =>
            `${name} rips open the ${item} before even leaving. Crumbs everywhere. No regrets.`,
        (name, item) =>
            `${name} does a chef's kiss at the ${item}. Salty perfection.`,
        (name, item) =>
            `The ${item} calls out to ${name} with its siren crunch. They obey.`,
        (name, item) =>
            `${name} opens the ${item} and crumbs go everywhere. They don't even notice. Bliss.`,
        (name, item) =>
            `"CRUNCH TIME." ${name} takes the ${item} like they're going into battle. Salty, crunchy battle.`,
        (name, item) =>
            `${name} eats the ${item} so loudly it echoes. They have no shame. Only crunch.`,
        (name, item) =>
            `${name} takes the ${item} and holds it to their ear. "I can hear the ocean." It's chips. It's just chips.`,
        (name, item) =>
            `${name} grabs the ${item} and immediately licks the seasoning off their fingers. Pre-emptive.`,
        (name, item) =>
            `The ${item} is perfectly salty. ${name} has achieved nirvana. Salty, crunchy nirvana.`,
        (name, item) =>
            `${name} double-fists the ${item}. One hand isn't enough for this much crunch.`,
        (name, item) =>
            `"Music to my mouth," ${name} says, already eating the ${item}. Crunch crunch crunch.`,
        (name, item) =>
            `${name} takes the ${item} and starts a one-person crunch orchestra. The audience: nobody.`,
    ],
    energy: [
        (name, item) =>
            `${name} downs the ${item} before it even drops. They needed that.`,
        (name, item) =>
            `The ${item} is the only thing between ${name} and a nap on the floor.`,
        (name, item) =>
            `${name} grabs the ${item} with the desperation of someone on hour 14 of a shift.`,
        (name, item) =>
            `"Caffeine. Now." ${name} takes the ${item}. Crisis averted.`,
        (name, item) =>
            `${name} cracks open the ${item} and ascends to a higher plane of consciousness.`,
        (name, item) =>
            `${name} was legally dead for 3 seconds before the ${item} arrived. Resurrected.`,
        (name, item) =>
            `The ${item} saves ${name}'s career, marriage, and will to live. All at once.`,
        (name, item) =>
            `${name} inhales the ${item}. Their soul re-enters their body.`,
        (name, item) =>
            `"I can see sounds now," ${name} says after the ${item}. That's probably fine.`,
        (name, item) =>
            `${name} shotguns the ${item}. Their hands stop shaking. Their eyes snap open. They can smell time.`,
        (name, item) =>
            `"GIVE IT TO ME." ${name} takes the ${item} with the urgency of a medical emergency. It basically is.`,
        (name, item) =>
            `${name} hugs the ${item}. It's cold. They don't care. Caffeine is caffeine.`,
        (name, item) =>
            `${name} opens the ${item} and the fizz sounds like angels singing. They're very tired.`,
        (name, item) =>
            `${name} was on the verge of napping forever. The ${item} brought them back. Heroic.`,
        (name, item) =>
            `${name} takes the ${item} and chugs it in 0.3 seconds. A personal and probably medical record.`,
        (name, item) =>
            `"This ${item} is the only reason I'm still employed," ${name} says. They're not wrong.`,
        (name, item) =>
            `${name} pours the ${item} directly into their bloodstream. Metaphorically. Mostly.`,
        (name, item) =>
            `${name} takes the ${item} and immediately looks 10 years younger. Caffeine: the real fountain of youth.`,
    ],
    drink: [
        (name, item) =>
            `${name} grabs the ${item} and chugs it immediately. Hydration achieved.`,
        (name, item) =>
            `The ${item} never stood a chance. ${name} was PARCHED.`,
        (name, item) =>
            `${name} presses the button so fast it's basically violence. ${item} obtained.`,
        (name, item) =>
            `"Finally, a drink." ${name} takes the ${item} with visible relief.`,
        (name, item) =>
            `${name} drinks the ${item} in one gulp. A personal record.`,
        (name, item) =>
            `${name} pours the ${item} directly into their face. Close enough to drinking.`,
        (name, item) =>
            `${name} cradles the ${item} like it's the last drink on Earth. To them, it is.`,
        (name, item) =>
            `"I was starting to see mirages," ${name} says, grabbing the ${item}. Desert: survived.`,
        (name, item) =>
            `${name} makes eye contact with the ${item} and mouths "I need you." Sold.`,
        (name, item) =>
            `${name} catches the ${item} and immediately tilts their head back. Hydration speedrun.`,
        (name, item) =>
            `"LIQUID. YES." ${name} has been reduced to single words. The ${item} fixes everything.`,
        (name, item) =>
            `${name} presses the cold ${item} against their forehead first. Then drinks it. Priorities.`,
        (name, item) =>
            `${name} takes the ${item} and gargles it. That's... not how you drink things. But they're happy.`,
        (name, item) =>
            `${name} pours the ${item} into their mouth from a height. Impressive aim. Minimal spillage.`,
        (name, item) =>
            `"I was turning into a raisin," ${name} says, taking the ${item}. Rehydration commencing.`,
        (name, item) =>
            `${name} takes the ${item} and splashes some on their face. Refreshing. Wasteful. But refreshing.`,
        (name, item) =>
            `${name} drinks the ${item} so fast the can implodes slightly. Thirst: eliminated.`,
        (name, item) =>
            `${name} takes the ${item} and just... vibrates with hydration. Beautiful.`,
    ],
    fancy: [
        (name, item) =>
            `${name} selects the ${item} with the air of a wine sommelier. Exquisite.`,
        (name, item) =>
            `"Ah, the ${item}. A person of taste stocks this machine." ${name} approves.`,
        (name, item) => `${name} takes the ${item}. Premium. As they deserve.`,
        (name, item) =>
            `The ${item} is expensive and ${name} doesn't even flinch. Baller.`,
        (name, item) =>
            `${name} adjusts their monocle (they don't have one) and selects the ${item}.`,
        (name, item) =>
            `"Exquisite," ${name} purrs, taking the ${item}. They're having a moment.`,
        (name, item) =>
            `${name} takes the ${item} and holds it up to the light like a jeweler inspecting a diamond.`,
        (name, item) =>
            `${name} buys the ${item} and immediately posts about it. #blessed #premium #snacklife`,
        (name, item) =>
            `"Finally, a machine that understands quality." ${name} takes the ${item} reverently.`,
        (name, item) =>
            `${name} takes the ${item} and immediately starts a food blog post about it. In their head.`,
        (name, item) =>
            `"One simply does not rush premium," ${name} says, savoring the ${item} selection process.`,
        (name, item) =>
            `${name} photographs the ${item} from seven angles before consuming it. Content first.`,
        (name, item) =>
            `${name} takes the ${item} and immediately starts comparing it to similar products in Milan.`,
        (name, item) =>
            `"This ${item} speaks to my SOUL," ${name} says. Their soul has expensive taste.`,
        (name, item) =>
            `${name} takes the ${item} and rates it on an internal 100-point scale. It scores well.`,
        (name, item) =>
            `${name} tips the machine after getting the ${item}. Just puts coins on top of it. Classy.`,
        (name, item) =>
            `"A connoisseur recognizes quality." ${name} takes the ${item}. The machine is flattered.`,
        (name, item) =>
            `${name} takes the ${item} with a pinky raised. Old money energy.`,
    ],
    cheap: [
        (name, item) =>
            `${name} spots the ${item} — affordable! Today is a good day.`,
        (name, item) =>
            `"Ooh, ${item} for THAT price?" ${name} smashes the button.`,
        (name, item) =>
            `${name} counts their coins. Enough for ${item}. The math works. Joy.`,
        (name, item) =>
            `Budget intact. ${item} acquired. ${name} is a financial genius.`,
        (name, item) =>
            `${name} almost cries. A ${item} they can actually AFFORD. What a world.`,
        (name, item) =>
            `"That's... that's reasonable." ${name} is visibly shaken by fair pricing. Takes the ${item}.`,
        (name, item) =>
            `${name} does the math on a napkin. The ${item} fits the budget. Napkin goes in pocket for safekeeping.`,
        (name, item) =>
            `${name} gets the ${item} and still has coins left over. This is their Super Bowl.`,
        (name, item) =>
            `"I'll take two!" ${name} says. They can only take one. They take the ${item}, satisfied anyway.`,
        (name, item) =>
            `${name} triple-checks the price. It's real. It's affordable. They take the ${item}, hands shaking with joy.`,
        (name, item) =>
            `${name} finds the ${item} and starts crying happy tears. "It's so CHEAP. It's so BEAUTIFUL."`,
        (name, item) =>
            `"I can eat AND pay rent this month!" ${name} takes the ${item}, elated.`,
        (name, item) =>
            `${name} buys the ${item} and has enough left over for bus fare. Today is a W.`,
        (name, item) =>
            `${name} takes the ${item} and writes the price down in a little notebook labeled "GOOD DEALS."`,
        (name, item) =>
            `"FINALLY. Reasonable pricing." ${name} takes the ${item} with the energy of someone winning the lottery.`,
        (name, item) =>
            `${name} takes the ${item} and calls their mom to tell her about the great deal. Mom doesn't answer.`,
        (name, item) =>
            `${name} counts their coins after buying the ${item}. Still has some! Today is a miracle.`,
        (name, item) =>
            `${name} buys the ${item} and immediately starts planning what to do with the money they saved. (Nothing. But the dream is alive.)`,
    ],
};

// ── Settle reactions (mood-specific + generic fallbacks) ─

const SETTLE_GENERIC: Reaction[] = [
    (name, item) => `${name} sighs and settles on the ${item}. It'll do.`,
    (name, item) => `"I guess..." ${name} reluctantly takes the ${item}.`,
    (name, item) => `${name} squints at the ${item}. "...fine." Sold.`,
    (name, item) =>
        `${name} looks left. Looks right. Settles on the ${item}. Not ideal.`,
    (name, item) =>
        `${name} stares at the ${item} for an uncomfortably long time. "...sure."`,
    (name, item) =>
        `"You're not what I wanted, but you're what I've got." ${name} takes the ${item} with grim acceptance.`,
    (name, item) =>
        `${name} takes the ${item} like a knight accepting a quest they didn't volunteer for.`,
    (name, item) =>
        `${name} points at the ${item} and says "You. You'll do." Romantic.`,
    (name, item) =>
        `${name} buys the ${item} out of spite. Not spite toward the ${item}. Just general spite.`,
    (name, item) =>
        `"I'm settling and I want you to KNOW I'm settling," ${name} says to the ${item}. The ${item} does not care.`,
    (name, item) =>
        `${name} takes the ${item} with the enthusiasm of someone filling out tax forms.`,
    (name, item) =>
        `${name} grabs the ${item}. It's not love. It's not hate. It's just... ${item}.`,
    (name, item) =>
        `${name} takes the ${item} like someone accepting a consolation prize at a game show.`,
    (name, item) =>
        `"It's fine. Everything is fine." ${name} takes the ${item}. It is not fine.`,
    (name, item) =>
        `${name} picks the ${item} and makes a face like they just agreed to overtime.`,
    (name, item) =>
        `${name} exhales through their nose. Takes the ${item}. This is survival.`,
    (name, item) =>
        `"I've had worse," ${name} says, taking the ${item}. That's not a compliment.`,
    (name, item) =>
        `${name} takes the ${item} and stares at it like a disappointed parent.`,
    (name, item) =>
        `${name} takes the ${item} with the passion of someone choosing a font for a spreadsheet.`,
    (name, item) =>
        `"This ${item} and I are going to have a very mediocre time together." ${name} buys it.`,
    (name, item) =>
        `${name} gives the ${item} a nod of reluctant acceptance. It'll get the job done.`,
    (name, item) =>
        `${name} takes the ${item} and promises themselves something better later. The lie sustains them.`,
    (name, item) =>
        `"When life gives you ${item}, you make... ${item}." ${name} is bad at metaphors.`,
    (name, item) =>
        `${name} takes the ${item}. They'll think about this moment in the shower tonight.`,
    (name, item) =>
        `${name} selects the ${item} with the conviction of someone choosing which bill to pay first.`,
    (name, item) =>
        `"I deserve better but I'll take the ${item}." ${name} is a realist.`,
    (name, item) =>
        `${name} pokes the ${item} button like they're defusing a bomb. A boring bomb.`,
    (name, item) =>
        `${name} closes their eyes and takes the ${item}. If they can't see it, it might be good.`,
    (name, item) =>
        `${name} takes the ${item} and immediately starts planning their apology to their taste buds.`,
    (name, item) =>
        `"Hello, ${item}. You're... here." ${name} buys it with all the warmth of a refrigerator.`,
    (name, item) =>
        `${name} grabs the ${item} and sighs like they just agreed to a family dinner.`,
    (name, item) =>
        `${name} takes the ${item}. The ${item} is adequate. Adequacy is... fine.`,
    (name, item) =>
        `${name} buys the ${item} the way you'd pick a dentist — grudgingly, because you must.`,
    (name, item) =>
        `"I'm not mad. I'm just disappointed." ${name} takes the ${item}.`,
    (name, item) =>
        `${name} takes the ${item} with the energy of someone who just said 'sure, whatever' to a wedding venue.`,
    (name, item) =>
        `${name} holds the ${item} at arm's length. Studies it. "I suppose." Buys it.`,
    (name, item) =>
        `${name} takes the ${item} and mutters something about lowered expectations.`,
    (name, item) =>
        `"This is the ${item} I get. Not the ${item} I want." ${name} is philosophical about it.`,
    (name, item) =>
        `${name} takes the ${item} the way a cat accepts a bath. With resignation and fury.`,
    (name, item) =>
        `${name} buys the ${item}. Their therapist would call this growth. ${name} calls it hunger.`,
    (name, item) =>
        `${name} takes the ${item} with the exact energy of 'I guess this is my life now.'`,
    (name, item) =>
        `"Beggars can't be choosers." ${name} takes the ${item}. They're neither. But still.`,
    (name, item) =>
        `${name} grabs the ${item} like it was the last one picked in gym class. Fair enough.`,
    (name, item) =>
        `${name} takes the ${item} and stares into the middle distance. Contemplating.`,
    (name, item) =>
        `${name} buys the ${item} with all the enthusiasm of a Monday morning alarm.`,
    (name, item) =>
        `"You know what? ${item}. Why not." ${name} has given up in the most peaceful way.`,
    (name, item) =>
        `${name} takes the ${item}. It's not what they ordered. They didn't order anything. This is a vending machine.`,
    (name, item) =>
        `${name} selects the ${item} like someone scrolling past all the good shows on streaming.`,
    (name, item) =>
        `"I'll survive." ${name} takes the ${item}. The bar was on the ground.`,
    (name, item) =>
        `${name} presses the button for the ${item} with the vibe of 'eh.'`,
    (name, item) =>
        `${name} takes the ${item} and nods once. Not approval. Acknowledgment.`,
    (name, item) =>
        `"At least it's not nothing," ${name} says, taking the ${item}. A ringing endorsement.`,
    (name, item) =>
        `${name} settles for the ${item} like choosing which toe to stub.`,
    (name, item) =>
        `${name} takes the ${item} and whispers "we'll get through this together."`,
    (name, item) =>
        `"This wasn't the plan," ${name} mutters, buying the ${item}. Plans are suggestions anyway.`,
    (name, item) =>
        `${name} looks at the ${item} the way you look at a rainy day on your birthday. Takes it.`,
    (name, item) =>
        `${name} takes the ${item}. Somewhere, a better vending machine exists. Not here though.`,
    (name, item) =>
        `${name} buys the ${item} and stares at it like a Magic 8 Ball that said 'ask again later.'`,
    (name, item) =>
        `"My standards have entered the chat. And immediately left." ${name} takes the ${item}.`,
    (name, item) =>
        `${name} grabs the ${item} with the gusto of someone agreeing to fold laundry.`,
    (name, item) =>
        `${name} takes the ${item}. They'll give it 3 out of 10 stars. 4 if they're feeling generous.`,
    (name, item) =>
        `"It is what it is." ${name} takes the ${item}. The ${item} is what it is.`,
    (name, item) =>
        `${name} buys the ${item} with the same expression as reading terms and conditions.`,
    (name, item) =>
        `${name} takes the ${item} and mumbles "character building" to themselves.`,
    (name, item) =>
        `"I'm a survivor." ${name} takes the ${item}. Destiny's Child would be proud.`,
    (name, item) =>
        `${name} presses the button for ${item} like signing a lease they didn't read.`,
    (name, item) =>
        `${name} takes the ${item}. It tastes like compromise. Compromise tastes like the ${item}.`,
    (name, item) =>
        `"This is just a chapter, not the whole book." ${name} takes the ${item}. Deep.`,
    (name, item) =>
        `${name} takes the ${item} with the energy of 'I paid for parking and I'm going to USE it.'`,
    (name, item) =>
        `${name} inspects the ${item} like a forensic scientist. Inconclusive. Buys it anyway.`,
    (name, item) =>
        `"Tomorrow is another day." ${name} takes the ${item}. Today is ${item} day.`,
    (name, item) =>
        `${name} takes the ${item} and silently adds it to their list of life's small disappointments.`,
    (name, item) =>
        `${name} buys the ${item}. Not with joy. Not with anger. With... ${item}-ness.`,
    (name, item) =>
        `"Look, ${item}, we don't have to like each other." ${name} buys it anyway.`,
    (name, item) =>
        `${name} takes the ${item} the way one takes medicine. Necessary. Unpleasant. Functional.`,
    (name, item) =>
        `${name} grabs the ${item} and says "this is fine" loud enough for the machine to hear.`,
    (name, item) =>
        `${name} buys the ${item} with a sigh that could power a wind turbine.`,
    (name, item) =>
        `"It could be worse." ${name} takes the ${item}. They're trying to be positive.`,
    (name, item) =>
        `${name} takes the ${item} and immediately wonders what could have been.`,
    (name, item) =>
        `${name} selects the ${item} with the decisiveness of someone choosing where to sit on an empty bus.`,
    (name, item) =>
        `"At this point, sure." ${name} takes the ${item}. Rock bottom has a floor and they've found it.`,
    (name, item) =>
        `${name} takes the ${item}. Their face says nothing. Their eyes say everything.`,
    (name, item) =>
        `${name} buys the ${item} the way you'd accept a LinkedIn connection from a stranger.`,
    (name, item) =>
        `"We're doing this." ${name} grabs the ${item}. No one asked. They're doing it anyway.`,
    (name, item) =>
        `${name} takes the ${item} and immediately forgets they bought it. That's how exciting this is.`,
    (name, item) =>
        `${name} presses the button and catches the ${item} with the energy of catching a bus you don't want.`,
    (name, item) =>
        `"Not my first choice. Not my last." ${name} takes the ${item}. It's their only choice.`,
    (name, item) =>
        `${name} takes the ${item}. They say nothing. The ${item} says nothing. A perfect understanding.`,
    (name, item) =>
        `${name} grabs the ${item} and walks away before they can change their mind.`,
    (name, item) =>
        `"You'll do." ${name} takes the ${item} with a nod that's 40% acceptance, 60% resignation.`,
    (name, item) =>
        `${name} buys the ${item} the way you'd date someone your mom set you up with. Fine. FINE.`,
    (name, item) =>
        `${name} takes the ${item} with both hands, as if the weight of settling requires support.`,
    (name, item) =>
        `"In a perfect world, I wouldn't need you." ${name} takes the ${item}. This world is imperfect.`,
    (name, item) =>
        `${name} takes the ${item} and stares at it like it's a crossword clue with no answer.`,
    (name, item) =>
        `${name} reluctantly takes the ${item}. They'll tell people they chose it on purpose.`,
    (name, item) =>
        `"Fine. FINE." ${name} takes the ${item}. They said fine twice. It's not fine.`,
    (name, item) =>
        `${name} takes the ${item} with an air of defeated dignity. Noble suffering.`,
    (name, item) =>
        `${name} grabs the ${item} the way a knight picks up a quest for a lost cat. Beneath them. But duty calls.`,
    (name, item) =>
        `"I'm being flexible," ${name} announces, taking the ${item}. The ${item} doesn't applaud.`,
    (name, item) =>
        `${name} takes the ${item} and adds 'adaptable' to their mental resume.`,
    (name, item) =>
        `${name} buys the ${item}. It's the vending machine equivalent of 'I voted.'`,
    (name, item) =>
        `"This ${item} will not define me." ${name} takes it. The ${item} was never trying to.`,
    (name, item) =>
        `${name} takes the ${item} and whispers "I'm sorry" to their past self who had standards.`,
    (name, item) =>
        `${name} grabs the ${item} with a shrug that starts at their toes.`,
    (name, item) =>
        `"Some days you get caviar. Some days you get ${item}." ${name} takes the ${item}. Today is ${item} day.`,
    (name, item) =>
        `${name} takes the ${item}. It's the thought that counts. And the thought is 'meh.'`,
];

const SETTLE_BY_MOOD: Record<string, Reaction[]> = {
    sweet: [
        (name, item) =>
            `${name} would kill for a candy bar, but there are none. Perhaps this ${item} will quell their murderous intent.`,
        (name, item) =>
            `No candy in sight. ${name} grabs the ${item} and tries to pretend it's sweet.`,
        (name, item) =>
            `${name} wanted sugar. The ${item} is not sugar. ${name} takes it anyway, defeated.`,
        (name, item) =>
            `"This ${item} better be secretly sweet," ${name} mutters darkly.`,
        (name, item) =>
            `${name} stares longingly where candy should be. Takes the ${item} out of spite.`,
        (name, item) =>
            `${name} licks the ${item} to check if it's secretly sweet. It isn't. They buy it anyway.`,
        (name, item) =>
            `"Do you have ANY idea how much I need sugar right now?" ${name} asks the ${item}. The ${item} is silent.`,
        (name, item) =>
            `${name} holds the ${item} up to the light hoping to see sugar crystals. Nope. Buys it anyway.`,
        (name, item) =>
            `${name} sprinkles imaginary sugar on the ${item}. It doesn't help. They eat it anyway.`,
        (name, item) =>
            `"If I close my eyes, this ${item} is candy." ${name} closes their eyes. It's still not candy.`,
        (name, item) =>
            `${name} takes the ${item} and immediately starts googling 'how to make anything sweet.'`,
        (name, item) =>
            `"My blood sugar is filing a complaint." ${name} takes the ${item}. It's not sugar. It's survival.`,
        (name, item) =>
            `${name} considers adding sugar packets from a nearby coffee station to the ${item}. Takes it plain instead. Barely.`,
        (name, item) =>
            `${name} names the ${item} 'Candy' to make themselves feel better. It doesn't work.`,
        (name, item) =>
            `"Somewhere, candy exists. But not here." ${name} takes the ${item} with cosmic disappointment.`,
        (name, item) =>
            `${name} buys the ${item} and whispers "you could've been chocolate" to it. Devastating.`,
        (name, item) =>
            `${name} takes the ${item} and stares at the empty candy row like a memorial.`,
        (name, item) =>
            `"The sugar drought continues." ${name} takes the ${item}. Day 47 without candy. They're losing hope.`,
        (name, item) =>
            `${name} takes the ${item} and pretends it's a candy bar. The illusion lasts 0.2 seconds.`,
        (name, item) =>
            `"I'll remember this, machine." ${name} takes the sugarless ${item} and files a mental grievance.`,
        (name, item) =>
            `${name} buys the ${item} while humming a sad song about candy. It's surprisingly moving.`,
        (name, item) =>
            `${name} takes the ${item} and immediately writes a passive-aggressive note about the lack of sweets.`,
        (name, item) =>
            `"One day, this machine will have candy. Today is not that day." ${name} takes the ${item}.`,
        (name, item) =>
            `${name} licks the glass where candy should be, then sadly takes the ${item} instead.`,
        (name, item) =>
            `${name} buys the ${item} but makes it clear to everyone nearby that they WANTED candy.`,
        (name, item) =>
            `"This ${item} is NOT candy and I want that on the record." ${name} buys it. Grudgingly.`,
        (name, item) =>
            `${name} holds the ${item} next to where the candy should be. Compares them. Sighs. Buys it.`,
        (name, item) =>
            `${name} tries to lick the sugar off the glass display. There is no sugar. Takes the ${item}.`,
        (name, item) =>
            `${name} wraps the ${item} in a candy wrapper from their pocket. "Close enough." It's not.`,
        (name, item) =>
            `${name} buys the ${item} and tells it bedtime stories about candy. Therapy for both of them.`,
        (name, item) =>
            `"Am I supposed to just EXIST without sugar?" ${name} takes the ${item}. Apparently yes.`,
        (name, item) =>
            `${name} makes the ${item} pinky-promise to taste sweet. It does not. Pinky promises are meaningless.`,
        (name, item) =>
            `${name} stares at the ${item}. "You'll never be candy but I respect you." Buys it.`,
        (name, item) =>
            `"The audacity of a machine without candy." ${name} settles for the ${item} while judging this entire establishment.`,
        (name, item) =>
            `${name} writes 'CANDY' on the ${item} wrapper with a pen. Problem... not solved. But addressed.`,
        (name, item) =>
            `${name} buys the ${item} and eats it while looking at a picture of candy on their phone.`,
        (name, item) =>
            `${name} takes the ${item}. Their dentist would be proud. ${name} is not proud.`,
        (name, item) =>
            `"A candyless ${item} in a candyless world." ${name} is getting poetic about it.`,
        (name, item) =>
            `${name} buys the ${item} and creates an imaginary support group for people who can't find candy.`,
        (name, item) =>
            `${name} takes the ${item} while composing a haiku about missing candy. 5-7-5 syllables of pain.`,
        (name, item) =>
            `${name} drizzles imaginary chocolate on the ${item}. "There. Now it's sweet." (It's not.)`,
        (name, item) =>
            `"I'm a sugar person in a ${item} world." ${name} buys it and mourns.`,
        (name, item) =>
            `${name} takes the ${item} and plans a formal petition for more candy options.`,
        (name, item) =>
            `${name} opens the ${item} and squints at the ingredients hoping to find 'sugar' listed anywhere.`,
        (name, item) =>
            `${name} buys the ${item} and dips it in the memory of candy. Memories don't have flavor.`,
        (name, item) =>
            `"If this ${item} was candy, I'd be so happy right now." ${name} buys the non-candy ${item}. Tragic.`,
        (name, item) =>
            `${name} takes the ${item} and immediately starts a countdown to when they can get actual candy.`,
        (name, item) =>
            `${name} stares at the ${item} for an uncomfortably long time. "I accept you." They don't mean it.`,
        (name, item) =>
            `${name} buys the ${item} and decides to just vibrate at a frequency that makes everything taste sweet.`,
        (name, item) =>
            `${name} takes the ${item}. On a scale of candy to not-candy, it's a solid not-candy.`,
        (name, item) =>
            `"Life without sugar is just survival." ${name} takes the ${item} and barely survives.`,
        (name, item) =>
            `${name} takes the ${item} with the grim acceptance of someone who just found out candy is sold out everywhere.`,
        (name, item) =>
            `${name} buys the ${item} and makes a solemn vow to never forget the candy that should've been here.`,
        (name, item) =>
            `"Not sweet. Not even close." ${name} takes the ${item}. Their sweet tooth files a formal protest.`,
        (name, item) =>
            `${name} tastes the ${item}. Not sweet. Checks again. Still not sweet. Eats it anyway.`,
        (name, item) =>
            `${name} buys the ${item} and immediately texts their friend: "no candy. send help."`,
        (name, item) =>
            `${name} settles for the ${item}. Their inner child is SCREAMING for sugar.`,
    ],
    salty: [
        (name, item) =>
            `No chips. ${name}'s day is ruined. The ${item} is a consolation prize at best.`,
        (name, item) =>
            `${name} wanted something salty. The ${item} is not salty. This is a tragedy.`,
        (name, item) =>
            `"Where are the chips?!" ${name} grabs the ${item} angrily. It's not the same.`,
        (name, item) =>
            `${name} takes the ${item}, still mourning the chips that could have been.`,
        (name, item) =>
            `${name} shakes the ${item} hoping it'll sound crunchy. It doesn't. Despair.`,
        (name, item) =>
            `"I'd add salt to this myself if I could." ${name} takes the ${item} with a haunted look.`,
        (name, item) =>
            `${name} grabs the ${item} and immediately starts planning a letter to the management about the chip situation.`,
        (name, item) =>
            `"This ${item} is the opposite of crunchy." ${name} buys it. Under protest.`,
        (name, item) =>
            `${name} tries to crunch the ${item}. It doesn't crunch right. Nothing will ever crunch right again.`,
        (name, item) =>
            `${name} takes the ${item} and whispers "you could've been chips" to it. Heartbreaking.`,
        (name, item) =>
            `"My sodium levels are dangerously low." ${name} takes the non-salty ${item}. Dangerously.`,
        (name, item) =>
            `${name} buys the ${item} and immediately starts rationing imaginary salt on it.`,
        (name, item) =>
            `"A crunchless existence." ${name} takes the ${item}. They're being dramatic but they're not wrong.`,
        (name, item) =>
            `${name} buys the ${item} and stares at the empty chip row like it's a crime scene.`,
        (name, item) =>
            `${name} shakes the ${item} aggressively. No crunch emerges. Despair deepens.`,
        (name, item) =>
            `"You taste like disappointment and not-chips." ${name} eats the ${item} anyway.`,
        (name, item) =>
            `${name} takes the ${item} and adds it to their growing list of chip-related betrayals.`,
        (name, item) =>
            `${name} buys the ${item} and licks a nearby salt shaker to compensate. Nobody knows where the salt shaker came from.`,
        (name, item) =>
            `"The crunch void in my soul grows larger." ${name} takes the ${item}. It doesn't fill the void.`,
        (name, item) =>
            `${name} takes the ${item} and immediately starts a one-person protest about the chip shortage.`,
        (name, item) =>
            `${name} buys the ${item} while reminiscing about the last time they had chips. Beautiful, crunchy memories.`,
        (name, item) =>
            `"If I pretend hard enough, this ${item} has salt on it." ${name} pretends. It doesn't work.`,
        (name, item) =>
            `${name} takes the ${item}. Their jaw, primed for crunch, doesn't know what to do.`,
        (name, item) =>
            `${name} buys the ${item} and holds a moment of silence for the absent chips.`,
        (name, item) =>
            `"No chips. No crunch. No joy." ${name} takes the ${item}. Three for three on disappointments.`,
        (name, item) =>
            `${name} takes the ${item} and swears an oath to only visit machines that stock chips from now on.`,
        (name, item) =>
            `${name} buys the ${item} while their brain plays a sad montage of every chip they've ever loved.`,
        (name, item) =>
            `"This ${item} is the saddest snack I've ever settled for." ${name} eats it. Sadly.`,
        (name, item) =>
            `${name} takes the ${item} and starts composing a strongly-worded email about chip availability.`,
        (name, item) =>
            `${name} tries to salt the ${item} with their tears. That's... not how salt works.`,
        (name, item) =>
            `"I need CRUNCH. This ${item} offers no crunch." ${name} buys it and crunches on principle alone.`,
        (name, item) =>
            `${name} buys the ${item} and vows to carry emergency chips at all times from now on.`,
        (name, item) =>
            `${name} settles for the ${item}. Their crunch cravings settle for nothing. This is war.`,
        (name, item) =>
            `"Not salty enough. Not crunchy enough. Not chips enough." ${name} takes the ${item}. It's enough, though. Barely.`,
        (name, item) =>
            `${name} takes the ${item} and rates it 2/10 on the secret crunch scale they've been maintaining.`,
        (name, item) =>
            `${name} buys the ${item} and decides this is the machine's one free pass on the chip situation.`,
        (name, item) =>
            `"A world without chips is just a world with holes in it." ${name} takes the ${item}. Philosophical.`,
        (name, item) =>
            `${name} grabs the ${item} and crunches the wrapper as loud as possible. It's not the same. It'll never be the same.`,
        (name, item) =>
            `${name} takes the ${item} while making sustained eye contact with the empty chip row. Accusatory.`,
        (name, item) =>
            `"Fine. ${item}. Fine." ${name} buys it. Their jaw is angry about the lack of crunch though.`,
        (name, item) =>
            `${name} buys the ${item} and spends the next three minutes describing what they WISH they were eating.`,
        (name, item) =>
            `${name} takes the ${item} and salutes the fallen chip row. "I'll never forget you."`,
    ],
    energy: [
        (name, item) =>
            `No energy drinks. ${name} is going to fall asleep standing up. Takes the ${item} hoping for a miracle.`,
        (name, item) =>
            `${name} needed caffeine. The ${item} has no caffeine. ${name} takes it anyway. They're too tired to care.`,
        (name, item) =>
            `"This ${item} better give me the will to live," ${name} says, exhausted.`,
        (name, item) =>
            `${name} grabs the ${item}. It won't wake them up, but at least they'll die with snacks.`,
        (name, item) =>
            `${name} tries to absorb energy from the ${item} through osmosis. Takes it anyway.`,
        (name, item) =>
            `"I'll pretend this ${item} has caffeine in it," ${name} says, dead behind the eyes.`,
        (name, item) =>
            `${name} falls asleep briefly while reaching for the ${item}. Wakes up. Takes it. Barely.`,
        (name, item) =>
            `"This ${item} has zero caffeine and I have zero will to live." ${name} buys it. Coincidence? No.`,
        (name, item) =>
            `${name} yawns so wide they almost swallow the ${item} whole. Takes it. Barely awake.`,
        (name, item) =>
            `${name} buys the ${item} and immediately tries to absorb its energy through their skin. Physics says no.`,
        (name, item) =>
            `"I need something that will make my heart race. This ${item} makes my heart walk." ${name} buys it.`,
        (name, item) =>
            `${name} drools on the ${item} before they even open it. They're falling asleep. WAKE UP. They take it.`,
        (name, item) =>
            `${name} takes the ${item} and stares at it like it might spontaneously develop caffeine. It does not.`,
        (name, item) =>
            `"My eyes are closing against my will." ${name} buys the ${item}. Their eyes don't care about snacks.`,
        (name, item) =>
            `${name} buys the ${item} and eats it standing up so they don't fall asleep. Smart. Exhausted. But smart.`,
        (name, item) =>
            `${name} holds the ${item} against their forehead. "Cool me into consciousness." It doesn't work.`,
        (name, item) =>
            `"Not caffeinated but at least it's calories." ${name} takes the ${item}. Survival mode activated.`,
        (name, item) =>
            `${name} takes the ${item} and pinches themselves to stay awake. The ${item} watches in concern.`,
        (name, item) =>
            `${name} buys the ${item} while their brain operates at 2% battery. Critical.`,
        (name, item) =>
            `"I'm running on fumes and ${item}." ${name} has reached a new low. The ${item} is the floor.`,
        (name, item) =>
            `${name} sleepwalks to the machine. Buys the ${item}. Sleepwalks away. Was any of this intentional? Unclear.`,
        (name, item) =>
            `${name} tries to mainline the ${item}. It's a snack. You can't mainline a snack. They eat it instead.`,
        (name, item) =>
            `"My Kingdom for an energy drink. Instead I get ${item}." ${name} is Shakespearean about it.`,
        (name, item) =>
            `${name} takes the ${item} and tells it to try harder. It's food. It can't try. ${name} is delirious.`,
        (name, item) =>
            `${name} buys the ${item} with the urgency of someone who's been awake for 38 hours. Which they have.`,
        (name, item) =>
            `"If consciousness is a spectrum, I'm on the wrong end." ${name} takes the ${item}. It won't help.`,
        (name, item) =>
            `${name} takes the ${item} and shakes it vigorously. "Wake up, snack. Wake ME up." Neither wakes up.`,
        (name, item) =>
            `${name} buys the ${item} as a last resort before simply lying on the floor forever.`,
        (name, item) =>
            `"My body is 70% water and 30% exhaustion. This ${item} helps with neither." ${name} buys it.`,
        (name, item) =>
            `${name} takes the ${item} and uses the wrapper crinkling to try to stay awake. Moderate success.`,
        (name, item) =>
            `${name} buys the ${item} and eats it with their eyes closed. Not on purpose. They fell asleep again.`,
        (name, item) =>
            `"No energy drink. This is the darkest timeline." ${name} takes the ${item}. The timeline agrees.`,
        (name, item) =>
            `${name} buys the ${item}. Their eyelids weigh approximately 400 pounds each. The ${item} weighs nothing. Unfair.`,
        (name, item) =>
            `${name} takes the ${item} and places it on their head for a brief nap. Then eats it. Refreshed? No. Full? Barely.`,
        (name, item) =>
            `"Can you INJECT this ${item} directly into my brain?" ${name} asks nobody. No. You can't. They eat it normally.`,
        (name, item) =>
            `${name} takes the ${item}. Their consciousness flickers like a bad lightbulb. The ${item} does not fix the wiring.`,
        (name, item) =>
            `${name} falls asleep TWICE during the ${item} transaction. A personal record. Takes it. Somehow.`,
        (name, item) =>
            `"Caffeine-free is a war crime and this ${item} is evidence." ${name} buys it anyway. For the trial.`,
        (name, item) =>
            `${name} buys the ${item} with the resignation of someone who's accepted they will never be awake again.`,
        (name, item) =>
            `${name} takes the ${item} and tries to read the ingredients through half-closed eyes. Gives up. Eats it.`,
        (name, item) =>
            `"At least the ${item} won't judge me for napping in public." ${name} buys it and immediately dozes off.`,
    ],
    drink: [
        (name, item) =>
            `${name} is SO thirsty. The ${item} is not a drink. ${name} buys it anyway, confused.`,
        (name, item) =>
            `"I wanted a DRINK but I guess this ${item} will... exist near me." ${name} is not happy.`,
        (name, item) =>
            `${name} takes the ${item}. It's not liquid, but it's food. Close enough? No. But sold.`,
        (name, item) =>
            `Dehydrated and disappointed, ${name} grabs the ${item}.`,
        (name, item) =>
            `${name} considers squeezing the ${item} to see if any liquid comes out. Takes it whole instead.`,
        (name, item) =>
            `"This ${item} better be MOIST," ${name} demands. It probably isn't.`,
        (name, item) =>
            `${name} takes the ${item} and stares at it like it personally drained all the beverages from this machine.`,
        (name, item) =>
            `"Dry. So dry." ${name} takes the ${item}. Their tongue has entered survival mode.`,
        (name, item) =>
            `${name} buys the ${item} hoping it contains at least SOME moisture. Hopes are high. Moisture is not.`,
        (name, item) =>
            `${name} takes the ${item} and their mouth makes the Sahara Desert sound moist by comparison.`,
        (name, item) =>
            `"I'm turning to dust and this ${item} is not helping." ${name} buys it. Dust to dust.`,
        (name, item) =>
            `${name} tries to wring liquid out of the ${item} like a sponge. It's not a sponge. They eat it.`,
        (name, item) =>
            `"My kingdom for a sip of water. Instead: ${item}." ${name} takes it. Hydration remains a dream.`,
        (name, item) =>
            `${name} buys the ${item} and chews it slowly hoping saliva will count as drinking. It does not.`,
        (name, item) =>
            `${name} takes the ${item} and holds it accusingly. "Where's your liquid content?" Zero. The answer is zero.`,
        (name, item) =>
            `"I'm so parched I'm considering drinking the machine itself." ${name} settles for the ${item}.`,
        (name, item) =>
            `${name} buys the ${item} and licks the condensation off the glass. Then eats the ${item}. Hydration: 1%.`,
        (name, item) =>
            `${name} takes the ${item} and makes a mental note to never visit a drinkless machine again.`,
        (name, item) =>
            `"A vending machine with no drinks is just a really expensive shelf." ${name} takes the ${item}. Shelf food.`,
        (name, item) =>
            `${name} takes the ${item} and their desert-dry mouth struggles to process it. This is suffering.`,
        (name, item) =>
            `"Liquid. I needed LIQUID." ${name} takes the ${item}. It's a solid. Devastation is also a solid.`,
        (name, item) =>
            `${name} buys the ${item} and stares longingly at the rain outside. Nature has drinks. This machine does not.`,
        (name, item) =>
            `${name} takes the ${item} and considers dissolving it in water. They have no water. That's the whole problem.`,
        (name, item) =>
            `"I bet this ${item} would taste great with a DRINK." ${name} doesn't have a drink. Takes the ${item} dry.`,
        (name, item) =>
            `${name} buys the ${item} and their swallow reflex gets confused. It expected liquid. It got ${item}. Betrayal.`,
        (name, item) =>
            `"Hydration is a human right and this machine is violating it." ${name} takes the ${item} in protest.`,
        (name, item) =>
            `${name} buys the ${item} and immediately starts planning a strongly-worded letter about drink availability.`,
        (name, item) =>
            `${name} takes the ${item}. Somewhere, a glacier melts. The water goes to someone else. Not ${name}.`,
        (name, item) =>
            `"In what universe does a vending machine not have drinks?" This one. ${name} takes the ${item}. This terrible, dry universe.`,
        (name, item) =>
            `${name} takes the ${item} and chews it 100 times to generate maximum saliva. It's not enough. It's never enough.`,
        (name, item) =>
            `${name} buys the ${item} while their lips crack audibly. The sound haunts everyone nearby.`,
        (name, item) =>
            `"This ${item} is the driest thing I've ever eaten and I once ate a sock." ${name} has stories.`,
        (name, item) =>
            `${name} takes the ${item} and files it under 'things that are not drinks' in their brain. Large category.`,
        (name, item) =>
            `${name} buys the ${item} and spends the next 5 minutes imagining it's a smoothie. Imagination has limits.`,
        (name, item) =>
            `"My cells are shriveling." ${name} takes the ${item}. Their cells don't care about ${item}.`,
        (name, item) =>
            `${name} takes the ${item} and licks their own arm for moisture. Then eats the ${item}. Rock bottom.`,
        (name, item) =>
            `${name} buys the ${item} and dramatically mourns the drinks that should've been.`,
        (name, item) =>
            `"A drink-free existence." ${name} takes the ${item}. The ${item} cannot quench. The ${item} can only nourish. Barely.`,
        (name, item) =>
            `${name} takes the ${item}. It's like eating sandpaper in a desert. Metaphorically. And sort of literally.`,
        (name, item) =>
            `${name} buys the ${item} and considers converting it to liquid form. Science is not on their side.`,
        (name, item) =>
            `"Can I at least get some ICE?" ${name} asks the machine. The machine is not a bar. Takes the ${item}.`,
    ],
    fancy: [
        (name, item) =>
            `${name} wanted something fancy. The ${item} is not fancy. ${name} has been humbled.`,
        (name, item) =>
            `"I suppose the ${item} will have to do," ${name} says with the energy of a deflated aristocrat.`,
        (name, item) =>
            `${name} takes the ${item} like a king forced to eat peasant food.`,
        (name, item) =>
            `This ${item} is beneath ${name}. They buy it anyway. These are dark times.`,
        (name, item) =>
            `${name} holds the ${item} with two fingers like it might be contagious. Buys it. Barely.`,
        (name, item) =>
            `"My standards have hit rock bottom," ${name} announces, taking the ${item}. The machine doesn't judge.`,
        (name, item) =>
            `${name} buys the ${item} and immediately writes a memoir about the experience. Chapter 1: Disappointment.`,
        (name, item) =>
            `"I've eaten at Michelin-star restaurants. This ${item} has zero stars." ${name} buys it. Slumming.`,
        (name, item) =>
            `${name} takes the ${item} and pretends they're doing it ironically. They are not. They're hungry.`,
        (name, item) =>
            `"My palate deserves better but my stomach doesn't care." ${name} takes the ${item}.`,
        (name, item) =>
            `${name} buys the ${item} and mentally downgrades their self-image. From champagne to... ${item}.`,
        (name, item) =>
            `${name} takes the ${item} with the air of someone who usually has people buy snacks FOR them.`,
        (name, item) =>
            `"If my sommelier could see me now." ${name} takes the ${item}. The sommelier would weep.`,
        (name, item) =>
            `${name} takes the ${item} and wraps it in a monogrammed handkerchief. Doesn't help the taste.`,
        (name, item) =>
            `"I'll eat this ${item} but I won't enjoy it." ${name} enjoys it a little. They'll never admit it.`,
        (name, item) =>
            `${name} buys the ${item} and immediately creates a mental folder labeled 'Regrettable Purchases.'`,
        (name, item) =>
            `${name} takes the ${item} like a noble accepting exile. With grace. And internal screaming.`,
        (name, item) =>
            `"Where's the truffle? The gold leaf? The... anything?" ${name} takes the ${item}. It has none of those things.`,
        (name, item) =>
            `${name} holds the ${item} at arm's length. Inspects it. "Pedestrian." Buys it. Hunger has no class.`,
        (name, item) =>
            `${name} buys the ${item} and rates it: presentation 1/10, desperation 10/10.`,
        (name, item) =>
            `"I once had wagyu beef and now I'm eating ${item} from a machine." ${name} processes this. Poorly.`,
        (name, item) =>
            `${name} takes the ${item} and decides to tell no one. This moment dies here.`,
        (name, item) =>
            `"The indignity." ${name} buys the ${item}. Their butler would be appalled. They don't have a butler. But still.`,
        (name, item) =>
            `${name} buys the ${item} and eats it in a corner so nobody sees. Premium people don't eat basic ${item}. Usually.`,
        (name, item) =>
            `"This ${item} is what happens when you forget your platinum card." ${name} takes it. Rock bottom.`,
        (name, item) =>
            `${name} takes the ${item}. It's not organic, fair-trade, or artisanal. It's just... ${item}. The horror.`,
        (name, _item) =>
            `"I didn't go to culinary school to eat THIS." ${name} didn't go to culinary school at all. But the point stands.`,
        (name, item) =>
            `${name} buys the ${item} and winces like they just stubbed their toe on mediocrity.`,
        (name, item) =>
            `"My ancestors didn't cross oceans for me to eat ${item} from a vending machine." ${name} takes it anyway.`,
        (name, item) =>
            `${name} takes the ${item} and makes a face reserved for people who find a hair in their soup.`,
        (name, item) =>
            `"This ${item} wouldn't survive one round on MasterChef." ${name} buys it. Neither would they, honestly.`,
        (name, item) =>
            `${name} buys the ${item} with the energy of someone who just downgraded from first class to cargo.`,
        (name, item) =>
            `${name} takes the ${item} and immediately questions every life decision that led to this moment.`,
        (name, item) =>
            `"I deserve artisanal. I'm getting ${item}." ${name} takes it. The gap between want and reality is an ${item}.`,
        (name, item) =>
            `${name} buys the ${item} and mentally fires their personal shopper. (They don't have one.)`,
        (name, item) =>
            `"At least nobody I know is watching." ${name} takes the ${item}. Someone they know IS watching.`,
        (name, item) =>
            `${name} takes the ${item} and writes a scathing review in their head. 'Adequate. But only just.'`,
        (name, item) =>
            `"This ${item} is the snack equivalent of a participation trophy." ${name} buys it. They're participating.`,
        (name, item) =>
            `${name} buys the ${item} and holds it with a napkin. Direct contact with commoner food is... a lot.`,
        (name, item) =>
            `${name} takes the ${item}. Pretends it's from a fancy deli. The illusion lasts until the first bite.`,
        (name, item) =>
            `"The things I do when I'm desperate." ${name} takes the ${item}. The ${item} didn't ask for this either.`,
    ],
    cheap: [
        (name, item) =>
            `The ${item} is more than ${name} wanted to spend. They buy it anyway and wince.`,
        (name, item) =>
            `${name} stares at the price of the ${item}. Ouch. But hunger wins.`,
        (name, item) =>
            `"This is highway robbery," ${name} says, buying the ${item}.`,
        (name, item) =>
            `${name} takes the ${item}. Their wallet weeps quietly.`,
        (name, item) =>
            `${name} calculates the cost-per-bite of the ${item}. It's not great. They buy it anyway because math can't fill a stomach.`,
        (name, item) =>
            `"I'll eat ramen for a week to pay for this ${item}," ${name} mutters. Worth it? Debatable.`,
        (name, item) =>
            `${name} makes a blood oath with their bank account and takes the ${item}. The account objects.`,
        (name, item) =>
            `"This ${item} costs more than my last meal." ${name} buys it. Their last meal was free samples.`,
        (name, item) =>
            `${name} does the math. Twice. Three times. Still expensive. Buys the ${item} anyway. Math is a suggestion.`,
        (_name, item) =>
            `"I could make this ${item} at home for a fraction of the—" No they couldn't. They buy it.`,
        (name, item) =>
            `${name} considers busking to afford the ${item}. They can't play any instruments. Buys it on credit (honor system).`,
        (name, item) =>
            `${name} takes the ${item}. Their bank app sends a concerned push notification.`,
        (name, item) =>
            `"This is economic violence," ${name} says, handing over their coins for the ${item}.`,
        (name, item) =>
            `${name} buys the ${item} and starts mentally rationing their other meals this week.`,
        (name, item) =>
            `"My budget didn't account for ${item}. My budget didn't account for ANYTHING." ${name} buys it.`,
        (name, item) =>
            `${name} takes the ${item} and immediately regrets every coffee they've ever bought. That's where the money went.`,
        (name, item) =>
            `"I'm spending my retirement on this ${item}." ${name} exaggerates. But only slightly.`,
        (name, item) =>
            `${name} buys the ${item} and whispers "I'm sorry" to their savings account. It was already empty.`,
        (name, item) =>
            `${name} takes the ${item} and starts calculating how many hours of work it represents. The answer hurts.`,
        (name, item) =>
            `"This ${item} is priced like it was imported from space." ${name} buys it. It was not imported from space.`,
        (name, item) =>
            `${name} buys the ${item} and adds 'financial ruin' to their afternoon plans.`,
        (name, item) =>
            `${name} takes the ${item}. Their wallet makes a noise like a dying animal. Symbolic.`,
        (name, item) =>
            `"I'll just not eat tomorrow." ${name} buys the ${item}. They'll eat tomorrow. But FRUGALLY.`,
        (name, item) =>
            `${name} pays for the ${item} in the smallest coins possible. Takes 45 seconds. Worth it (to them).`,
        (name, item) =>
            `"Who priced this ${item}? A VILLAIN?" ${name} buys it anyway. The villain wins.`,
        (name, item) =>
            `${name} takes the ${item} and immediately starts clipping imaginary coupons. Coping mechanism.`,
        (name, item) =>
            `${name} buys the ${item} and creates a spreadsheet in their head. Column A: Regret. Column B: Also Regret.`,
        (name, item) =>
            `"Inflation hits different when it's ${item}." ${name} buys it. Everything is expensive. Forever.`,
        (name, item) =>
            `${name} takes the ${item} and swears off vending machines until the economy recovers. (It won't.)`,
        (name, item) =>
            `${name} buys the ${item}. Somewhere, their financial advisor screams into a pillow.`,
        (name, item) =>
            `"I could've saved this money but I chose ${item}." ${name} has no regrets. Some regrets. Many regrets.`,
        (name, item) =>
            `${name} takes the ${item} and eats it very slowly to maximize the cost-per-minute value.`,
        (name, item) =>
            `"The price of this ${item} should be illegal." ${name} buys it anyway. Crime pays. Snacks don't.`,
        (name, item) =>
            `${name} buys the ${item} and starts a fundraiser in their head. Goal: more snack money.`,
        (name, item) =>
            `${name} takes the ${item}. Each bite is precisely portioned for maximum financial efficiency.`,
        (name, item) =>
            `"I'm making an investment in ${item}." ${name} buys it. Returns: questionable.`,
        (name, item) =>
            `${name} buys the ${item} and saves the receipt like a war medal. They fought the price. The price won.`,
        (name, item) =>
            `${name} takes the ${item} and mentally reorganizes their budget around it. Rent goes down. ${item} goes up.`,
        (name, item) =>
            `"Worth it. Probably. Maybe. Hopefully." ${name} takes the ${item} with financial uncertainty.`,
        (name, item) =>
            `${name} buys the ${item} like it's the last purchase they'll ever make. With their balance, it might be.`,
        (name, item) =>
            `"That's a lot of coins for one ${item}." ${name} counts them out one by one. Each one hurts.`,
    ],
};

// ── Skip reactions (mood-specific + generic fallbacks) ───

const SKIP_GENERIC: SkipReaction[] = [
    (name) => `${name} stares at the machine... and walks away.`,
    (name) => `${name} checks their wallet, sighs, and leaves.`,
    (name) => `${name} presses a few buttons, gets confused, and bails.`,
    (name) => `"Nothing good," ${name} mumbles, wandering off.`,
    (name) => `${name} takes a photo of the machine and leaves. Weird.`,
    (name) => `${name} shakes the machine gently. Nothing happens. They leave.`,
    (name) =>
        `${name} reads every label twice. Leaves without buying. Classic.`,
    (name) =>
        `${name} puts their hand on the glass like a sad movie scene. Then leaves.`,
    (name) =>
        `${name} stands in front of the machine for 45 seconds, then just... walks away.`,
    (name) =>
        `${name} pretends to get a phone call and uses it as an excuse to leave. Nobody called.`,
    (name) =>
        `${name} makes direct eye contact with the machine, shakes their head slowly, and leaves.`,
    (name) =>
        `${name} tries every button. Nothing appeals. They leave with the energy of a deflated balloon.`,
    (name) => `${name} opens their wallet, a moth flies out. They leave.`,
    (name) =>
        `${name} presses their forehead against the glass. Sighs. Walks away. Art.`,
    (name) =>
        `"I'll come back later," ${name} lies, knowing they won't. They leave.`,
    (name) =>
        `${name} stares at the machine like it personally wronged them. Leaves without a word.`,
    (name) =>
        `${name} pats the machine sadly. "Maybe next time, friend." Walks away.`,
    (name) =>
        `${name} writes 'NEEDS IMPROVEMENT' on a napkin and sticks it to the machine. Leaves.`,
    (name) =>
        `${name} does a full lap around the machine. Finds no new options. Leaves.`,
    (name) => `"Absolutely not." ${name} turns 180 degrees and walks away.`,
    (name) =>
        `${name} looks at the machine. The machine looks back. Neither blinks. ${name} leaves.`,
    (name) =>
        `${name} pulls out a magnifying glass, inspects every item, and leaves without buying. Thorough.`,
    (name) =>
        `${name} talks to the machine for 30 seconds. Gets no response. Leaves offended.`,
    (name) =>
        `${name} takes a running start toward the machine. Changes their mind mid-stride. Leaves.`,
    (name) =>
        `${name} circles the machine three times like a confused roomba. Leaves.`,
    (name) =>
        `${name} starts to press a button, pulls their hand back, looks around, and leaves.`,
    (name) =>
        `"Nah." ${name} delivers the shortest rejection in vending machine history and leaves.`,
    (name) =>
        `${name} waves goodbye to the machine. The machine does not wave back. ${name} leaves, slightly hurt.`,
    (name) =>
        `${name} writes a mental one-star review. "Would not recommend." Walks away.`,
    (name) =>
        `${name} takes a deep breath, makes eye contact with the machine, and leaves. A story in three acts.`,
    (name) =>
        `${name} starts counting items on their fingers. Runs out of fingers. Runs out of interest. Leaves.`,
    (name) =>
        `${name} puts their hand on the glass and traces the shape of a snack they wish existed. Walks away.`,
    (name) =>
        `${name} squints at the machine like it's a modern art installation they don't understand. Leaves.`,
    (name) =>
        `${name} approaches, hesitates, approaches again, hesitates again. Leaves. The hokey pokey of indecision.`,
    (name) =>
        `${name} cracks their knuckles, stares down the machine, and then... leaves. Anti-climactic.`,
    (name) =>
        `"I expected more," ${name} says quietly. The machine expected nothing and is still disappointed. ${name} leaves.`,
    (name) =>
        `${name} checks every row. Twice. Nothing sparks joy. They Marie Kondo themselves out the door.`,
    (name) =>
        `${name} tries to start a conversation with the machine. It's one-sided. They leave.`,
    (name) =>
        `${name} walks up. Walks away. Walks back. Walks away again. It's a dance. Nobody's impressed.`,
    (name) =>
        `${name} taps the glass like they're checking if the snacks are real. They are. They still leave.`,
    (name) =>
        `${name} takes a selfie with the machine and leaves. Content created. Snack not acquired.`,
    (name) =>
        `${name} puts their coins in. Takes them out. Puts them in. Takes them out. Leaves with their coins.`,
    (name) =>
        `"I've made a mistake coming here," ${name} says to nobody. Walks away.`,
    (name) =>
        `${name} looks at the selection and their face goes through all five stages of grief in 4 seconds. Leaves.`,
    (name) =>
        `${name} holds up a hand to the machine. "Talk to the hand." Walks away. The machine has no mouth anyway.`,
    (name) =>
        `${name} walks up with purpose. Loses that purpose immediately. Walks away purposelessly.`,
    (name) =>
        `${name} tries to peer behind the machine for hidden snacks. There are no hidden snacks. There is dust. They leave.`,
    (name) =>
        `${name} gives the machine one last look. The look says everything. They leave.`,
    (name) =>
        `${name} starts to reach for a button, gets distracted by their phone, and wanders off mid-transaction.`,
    (name) =>
        `${name} presses their face flat against the glass. Sees nothing they want up close. Leaves with a nose smudge.`,
    (name) =>
        `${name} makes a pro-con list on their arm with a pen. Cons win. Leaves.`,
    (name) =>
        `${name} does a taste test with their eyes. All items fail. Vision-based QA complete. Leaves.`,
    (name) =>
        `${name} consults their horoscope before deciding. Gemini says no. Leaves.`,
    (name) =>
        `${name} looks at the machine like it's a puzzle they can't solve. Leaves unsolved.`,
    (name) =>
        `${name} mouths "why" at the selection and drifts away like a disappointed ghost.`,
    (name) =>
        `${name} stands motionless for a full minute. Processing. Processing complete. Result: leave.`,
    (name) =>
        `${name} starts a slow clap at the machine's selection. It's sarcastic. They leave.`,
    (name) =>
        `${name} crosses their arms, shakes their head, and walks away. Silent but devastating.`,
    (name) =>
        `${name} raises one eyebrow at the machine's offerings. The eyebrow says it all. They leave.`,
    (name) =>
        `${name} sits on the floor in front of the machine for a moment. Gets up. Leaves. Growth.`,
    (name) =>
        `${name} gives the machine a polite nod. "Not today." Walks away with dignity intact.`,
    (name) =>
        `${name} pretends to tie their shoe to avoid making a decision. Shoe's already tied. Leaves.`,
    (name) =>
        `${name} looks at every item, memorizes none, and leaves with the focus of a goldfish.`,
    (name) =>
        `${name} whispers "you've changed" to the machine and walks away. They've never been here before.`,
    (name) =>
        `${name} sighs the longest sigh in recorded history. Walks away. The sigh continues from a distance.`,
    (name) =>
        `${name} opens their mouth to order, says nothing, closes their mouth, and leaves. Almost.`,
    (name) =>
        `${name} speed-reads every label, calculates nothing, and leaves at the same speed.`,
    (name) =>
        `${name} does that thing where you pretend you got a text and have to leave immediately. Classic.`,
    (name) =>
        `${name} stares through the machine like it's transparent. Sees nothing of interest. Leaves.`,
    (name) =>
        `${name} takes exactly two steps toward the machine and then two steps back. Net movement: zero. Leaves.`,
    (name) =>
        `${name} asks the machine "is this all you've got?" in a tone that suggests they already know the answer. Leaves.`,
    (name) =>
        `${name} looks at the machine the way you look at a menu at a restaurant you can't afford. Leaves.`,
    (name) =>
        `${name} tries to swipe right on the machine. This is not how vending machines work. They leave confused.`,
    (name) =>
        `${name} holds a moment of silence for the snacks they'll never have. Leaves respectfully.`,
    (name) =>
        `${name} does a 360, accidentally faces the machine again, and then actually leaves.`,
    (name) =>
        `${name} leaves a sticky note that says 'do better' on the machine. Walks away.`,
    (name) =>
        `${name} narrates their departure in their own head. "And so they left, hungry but free."`,
    (name) =>
        `${name} looks at the machine with the betrayal of someone who just found out there's no Santa.`,
    (name) =>
        `${name} shrugs so hard their shoulders touch their ears. Leaves.`,
    (name) =>
        `"I refuse." ${name} turns on their heel with military precision and leaves.`,
    (name) =>
        `${name} slowly backs away from the machine, maintaining eye contact the entire time. Leaves.`,
    (name) =>
        `${name} reaches into their pocket, pulls out lint, and leaves. The lint stays.`,
    (name) =>
        `${name} gives the machine a rating with their fingers. Three out of ten. Generous. Leaves.`,
    (name) =>
        `${name} makes a mental pros and cons list. Pros: 0. Cons: several. Leaves.`,
    (name) =>
        `${name} looks at each item and says "no" individually. "No. No. No. Nope. No." Leaves.`,
    (name) =>
        `${name} exhales so dramatically that the labels on the machine flutter. Walks away.`,
    (name) => `${name} bows to the machine sarcastically and exits stage left.`,
    (name) =>
        `${name} looks at the time, looks at the machine, decides time is more valuable. Leaves.`,
    (name) =>
        `${name} fist-bumps the machine goodbye. It's cold and metal. Leaves.`,
    (name) =>
        `${name} mouths "I'm sorry" to the machine and walks away. What are they sorry for? Nobody knows.`,
    (name) =>
        `${name} does a small dance of frustration. The machine watches, unmoved. ${name} leaves.`,
    (name) =>
        `${name} pulls out reading glasses, reads every price, puts the glasses away, and leaves. Informed rejection.`,
    (name) =>
        `${name} starts making a decision, visibly changes their mind, and leaves at speed.`,
    (name) =>
        `${name} blows the machine a kiss and walks away. Confusing energy. But they're gone.`,
    (name) =>
        `${name} holds up a single finger as if to say 'one moment' and then just... never comes back.`,
    (name) =>
        `${name} rests their hand on the machine like it's a gravestone. "You could've been so much more." Leaves.`,
    (name) =>
        `${name} takes three deep breaths, says "no," and walks away. Mindful rejection.`,
    (name) =>
        `${name} kicks a pebble on the way out. Classic disappointed walk-away.`,
    (name) =>
        `${name} gives the machine a long, silent stare. The stare says 'I expected more from you.' Walks away.`,
    (name) =>
        `${name} leaves so quietly it's unclear if they were ever here. Ghost customer.`,
    (name) =>
        `${name} adjusts their glasses, squints at the selection, and leaves with academic disappointment.`,
    (name) =>
        `${name} does a cost-benefit analysis in real time. The benefit loses. They leave.`,
    (name) =>
        `${name} mutters "not today, Satan" at the machine and leaves. The machine is not Satan. Probably.`,
    (name) => `${name} taps the glass rhythmically. Gets no answer. Leaves.`,
    (name) =>
        `${name} was going to buy something. Then they looked closer. Then they left.`,
    (name) =>
        `${name} points at each item and says 'next' like a dating show. Nobody gets a rose. They leave.`,
    (name) =>
        `${name} sniffs the air around the machine. Inconclusive. Leaves.`,
    (name) =>
        `${name} says "I'll think about it" and never thinks about it again. Gone.`,
];

const SKIP_BY_MOOD: Record<string, SkipReaction[]> = {
    sweet: [
        (name) =>
            `${name} scans every row for candy. Nothing. A single tear rolls down their cheek.`,
        (name) =>
            `"NO CANDY?!" ${name} kicks the machine (lightly) and storms off.`,
        (name) =>
            `${name} wanted something sweet so badly they considered licking the glass. They don't. They leave.`,
        (name) =>
            `${name}'s sugar craving goes unsatisfied. Somewhere, a dentist smiles.`,
        (name) =>
            `${name} presses every button hoping candy will appear by sheer willpower. It doesn't. They leave devastated.`,
        (name) =>
            `"You call this a vending machine?! Where's the CANDY?!" ${name} shouts at the ceiling and leaves.`,
        (name) =>
            `${name} draws a sad face on the glass where candy should be. Leaves. The face remains.`,
        (name) =>
            `${name} checks behind every item hoping candy is hiding. It's not hiding. It's not here. They leave.`,
        (name) =>
            `"This machine is a SUGAR-FREE ZONE?!" ${name} looks personally attacked. Leaves.`,
        (name) =>
            `${name} opens every flap hoping candy will fall out. Nothing falls. Hope falls. They leave.`,
        (name) =>
            `${name} writes 'CANDY' on the glass with their finger. It doesn't summon candy. They leave.`,
        (name) =>
            `${name}'s sweet tooth files a missing persons report. Leaves to file it officially.`,
        (name) =>
            `${name} starts breathing heavily. No candy. This is a code red. They evacuate.`,
        (name) =>
            `"I have a MEDICAL CONDITION that requires SUGAR." ${name} doesn't. But they leave like they do.`,
        (name) =>
            `${name} dramatically places their hand on the glass. "Where... where is the candy..." Walks away.`,
        (name) =>
            `${name} searches the machine like a detective at a crime scene. Evidence of candy: zero. Leaves.`,
        (name) =>
            `${name} tries to manifest candy through sheer willpower. Fails. Leaves, willpower depleted.`,
        (name) =>
            `"My blood sugar called. It wants answers." ${name} gets none. Leaves to find them elsewhere.`,
        (name) =>
            `${name} peers into the machine like it might have a secret candy compartment. It does not. Leaves.`,
        (name) =>
            `${name} shakes the machine hoping candy is stuck somewhere inside. It's not stuck. It's absent. They leave.`,
        (name) =>
            `${name} pulls out a candy wrapper from their pocket. Sniffs it. Cries a little. Leaves.`,
        (name) =>
            `"Sugarless. Joyless. Pointless." ${name} delivers a three-word review and leaves.`,
        (name) =>
            `${name} asks a stranger if they've seen any candy around here. The stranger hasn't. Both leave.`,
        (name) =>
            `${name} makes the machine promise to stock candy next time. The machine promises nothing. ${name} leaves.`,
        (name) =>
            `"My dentist would be thrilled. I am not." ${name} leaves, teeth intact, heart broken.`,
        (name) =>
            `${name} starts a countdown: "5... 4... candy appearing... 3... still no candy... 2..." Gives up. Leaves.`,
        (name) =>
            `${name} punches 'C-A-N-D-Y' on the keypad. Nothing. That's not how buttons work. They leave.`,
        (name) =>
            `${name} holds up a photo of candy and shows it to the machine. "Have you seen this snack?" Leaves without answers.`,
        (name) =>
            `"This is a candy DESERT." ${name} means dessert. Or desert. Both work. They leave.`,
        (name) =>
            `${name} looks at the candyless machine. Looks at their life. Finds parallels. Leaves.`,
        (name) =>
            `${name} interrogates the machine about its candy policy. The machine remains silent. Lawyer'd. ${name} leaves.`,
        (name) =>
            `${name} brings out a bag labeled 'EMERGENCY CANDY' from their pocket. It's empty. The emergency is NOW. They leave.`,
        (name) =>
            `"I smell candy," ${name} lies. There is no candy smell. There is no candy. They leave.`,
        (name) =>
            `${name} tries to order candy in three different languages. The machine speaks zero languages. Leaves.`,
        (name) =>
            `${name} asks the machine to check in the back. There is no 'back.' Just wall. They leave.`,
        (name) =>
            `${name} creates an imaginary candy in their mind. Eats it mentally. Still hungry physically. Leaves.`,
        (name) =>
            `${name} leaves a note: 'Dear machine, please stock candy. Love, ${name}.' Walks away.`,
        (name) =>
            `"When I was young, machines had CANDY." ${name} is 23. They leave like they're 80.`,
        (name) =>
            `${name} does a candyless lap of honor around the machine. The honor is questionable. Leaves.`,
        (name) =>
            `${name} considers eating a nearby houseplant instead. Decides against it. Leaves with integrity intact.`,
        (name) =>
            `${name} calls a friend to complain about the candy situation. Gets voicemail. Leaves alone.`,
        (name) =>
            `"Somewhere, a candy factory is working overtime. Not here." ${name} leaves to find it.`,
        (name) =>
            `${name} performs a small candy-summoning ritual. It doesn't work. They leave, spiritually defeated.`,
        (name) =>
            `${name} presses every button in order. S-U-G-A-R. Nothing happens. Because that's not how this works. Leaves.`,
        (name) =>
            `${name} stares at the gum section. "Gum is NOT candy." They're right. They leave.`,
        (name) =>
            `${name} hugs the machine goodbye. It's cold. Like a world without candy. They leave.`,
        (name) =>
            `${name} vows to return when candy exists. Sets a reminder on their phone. Leaves.`,
        (name) =>
            `"The candy drought continues." ${name} has been tracking this. Day 1. Feels like day 1000. Leaves.`,
        (name) =>
            `${name} makes peace with the candylessness. (They don't.) Leaves. (Angrily.)`,
    ],
    salty: [
        (name) =>
            `${name} wanted chips. The machine has no chips. ${name} stares into the void and leaves.`,
        (name) =>
            `Not a single crunchy, salty thing in sight. ${name} whispers "why" and walks away.`,
        (name) =>
            `${name} needed salt. The machine needed to do better. Both are disappointed.`,
        (name) =>
            `${name} presses their ear against the machine hoping to hear the crunch of chips. Silence. They leave broken.`,
        (name) =>
            `"A machine with NO CHIPS is just a fancy shelf," ${name} declares. Walks away.`,
        (name) =>
            `${name} licks the glass where chips should be. Regrets it. Leaves with a salty tongue and a broken heart.`,
        (name) =>
            `${name} checks the chip row three times. Empty. All three times. Confirmation: devastating.`,
        (name) =>
            `"A crunchless existence!" ${name} shouts. Several people turn. ${name} leaves. The people are confused.`,
        (name) =>
            `${name} puts their ear to the machine listening for the crunch of chips. Silence. Deafening silence.`,
        (name) =>
            `${name} tries to crunch the air itself. It doesn't crunch. Nothing crunches. They leave.`,
        (name) =>
            `"My jaw was SO READY," ${name} says, clenching and unclenching it. Leaves with an idle jaw.`,
        (name) =>
            `${name} pulls out a salt packet from their pocket. Has nothing to put it on. Leaves with pocket salt.`,
        (name) =>
            `${name} scans every row for anything remotely crunchy. "Soft. Soft. Soft. SOFT." Leaves.`,
        (name) =>
            `${name} shakes the machine to hear if chips are hiding. No rattle. No crunch. No chips. They leave.`,
        (name) =>
            `"This machine is a monument to the absence of chips." ${name} delivers this verdict and leaves.`,
        (name) =>
            `${name} asks a stranger if they have any chips. They don't. ${name} leaves, having now annoyed two entities.`,
        (name) =>
            `${name} picks up a rock outside. "At least THIS crunches." Doesn't eat it. Leaves. Smart choice.`,
        (name) =>
            `${name} closes their eyes and imagines chips so vividly they can almost hear the crunch. Almost. Leaves.`,
        (name) =>
            `"My sodium levels are in free fall!" ${name} announces. Nobody checks. Leaves.`,
        (name) =>
            `${name} files a mental lawsuit against the machine for emotional crunch damages. Leaves to consult a lawyer.`,
        (name) =>
            `${name} writes 'CHIPS PLZ' on the glass in the universal language of desperation. Leaves.`,
        (name) =>
            `${name} creates a petition: 'Stock Chips or I'll Be Sad.' Gets zero signatures. Leaves. Sad.`,
        (name) =>
            `${name} tries to will chips into existence through intense staring. Chips remain nonexistent. Leaves.`,
        (name) =>
            `"No chips. No crunch. No reason to live." ${name} is being dramatic. They're fine. They leave.`,
        (name) =>
            `${name} gives the machine's chip row a moment of silence. Then a moment of walking away.`,
        (name) =>
            `${name} calls a chip hotline. It's not real. Nobody answers. They leave.`,
        (name) =>
            `${name} opens their mouth to make a crunching noise. It's not the same. Nothing is the same. Leaves.`,
        (name) =>
            `"The audacity of a chipless machine." ${name} writes this down for their memoir. Leaves.`,
        (name) =>
            `${name} crunches a napkin in frustration. Wrong crunch. Wrong texture. Leaves.`,
        (name) =>
            `${name} asks the machine directly: "Where are your chips?" The machine doesn't answer. ${name} leaves. Fair.`,
        (name) =>
            `${name} pantomimes eating chips. Air chips. Imaginary crunch. It's heartbreaking. They leave.`,
        (name) =>
            `"You've lost a customer today," ${name} says to the machine. The machine had no idea it had one. ${name} leaves.`,
        (name) =>
            `${name} searches 'nearest chips' on their phone. 0.3 miles. They leave in that direction.`,
        (name) =>
            `${name} dramatically slides down the glass of the machine. Gets up. Leaves with glass smudge dignity.`,
        (name) =>
            `${name} checks their horoscope. It says 'no chips today.' For once, the stars are right. Leaves.`,
        (name) =>
            `${name} brings out an empty chip bag from their pocket. Sniffs it. Memories. Sweet, salty memories. Leaves.`,
        (name) =>
            `"If I can't have chips, NOBODY gets snacks." ${name} considers unplugging the machine. Doesn't. Leaves.`,
        (name) =>
            `${name} makes the universal crunch gesture (opening and closing hand). Leaves crunching nothing.`,
    ],
    energy: [
        (name) =>
            `${name} needs caffeine so badly their hands are shaking. No energy drinks. They leave, barely conscious.`,
        (name) =>
            `"No energy drinks?!" ${name} looks like they might actually cry. They leave to find coffee instead.`,
        (name) =>
            `${name} falls asleep standing up for a second. Wakes up. No energy drinks. Leaves.`,
        (name) =>
            `Without caffeine, ${name} has lost the will to operate a vending machine. They wander off.`,
        (name) =>
            `${name}'s soul leaves their body. No energy drinks. Their ghost walks away.`,
        (name) =>
            `${name} tries to absorb energy from the fluorescent lights. It doesn't work. They leave.`,
        (name) =>
            `"I'm going to die here," ${name} whispers. They don't. But they leave like they might.`,
        (name) =>
            `${name} collapses against the machine. No energy drinks. No energy. They slide away. Literally.`,
        (name) =>
            `${name} yawns so wide a small bird could fly in. No energy drinks. The bird doesn't. ${name} leaves.`,
        (name) =>
            `"Caffeine emergency. CAFFEINE EMERGENCY." ${name} declares a state of emergency. Leaves to find a solution.`,
        (name) =>
            `${name} tries to nap against the machine for a second. Wakes up. Still no energy drinks. Leaves.`,
        (name) =>
            `${name}'s eyelids weigh 400 pounds. No energy drinks to fight gravity. They leave, one blink at a time.`,
        (name) =>
            `"I can't even be angry. I'm too tired to be angry." ${name} doesn't have the energy to leave. But does.`,
        (name) =>
            `${name} types 'where caffeine' into their phone. Too tired to finish the search. Leaves.`,
        (name) =>
            `${name} holds their eyes open with their fingers. Scans for energy drinks. None. Releases fingers. Leaves.`,
        (name) =>
            `${name} calculates their remaining consciousness: approximately 12 minutes. No energy drinks. Leaves urgently.`,
        (name) =>
            `"My brain is shutting down and this machine is NOT helping." ${name} leaves while they still can.`,
        (name) =>
            `${name} tries to jumpstart themselves by slapping their own face. Doesn't work. Needs caffeine. Leaves.`,
        (name) =>
            `${name} looks at the machine. The machine blurs. Everything blurs. ${name} blinks slowly. Leaves slowly.`,
        (name) =>
            `"I can feel my consciousness leaving," ${name} says. It left. They leave too.`,
        (name) =>
            `${name} asks the machine if it has a USB port so they can charge themselves. It doesn't. They leave.`,
        (name) =>
            `${name} considers photosynthesis as an alternative energy source. The sun isn't out. They leave.`,
        (name) =>
            `"I am going to simply lay down," ${name} announces. Doesn't. Leaves upright. Barely.`,
        (name) =>
            `${name} yawns mid-step and trips. No energy drinks to save them. Leaves on the ground. Then gets up. Then leaves.`,
        (name) =>
            `${name}'s fitbit shows a resting heart rate of 'asleep.' They're standing up. No energy drinks. Leaves.`,
        (name) =>
            `"My cells are requesting caffeine." ${name}'s cells are denied. ${name} leaves. The cells go with them.`,
        (name) =>
            `${name} blinks once and three seconds pass. Blinks again and they're outside. Did they leave? They left.`,
        (name) =>
            `${name} has the energy level of a phone at 2%. No energy drinks to charge up. Powers down. Leaves.`,
        (name) =>
            `"If I close my eyes I'll sleep for a week." ${name} keeps eyes open. Barely. No energy drinks. Leaves.`,
        (name) =>
            `${name} tries to absorb energy from other customers' purchases. It's not how nutrition works. Leaves.`,
        (name) =>
            `${name} does jumping jacks to stay awake. Does one. Gets tired. No energy drinks. Leaves.`,
        (name) =>
            `"My brain has entered power save mode." ${name} leaves at 50% processing speed.`,
        (name) =>
            `${name} looks for a plug to charge themselves. Humans don't charge that way. No energy drinks either. Leaves.`,
        (name) =>
            `${name} considers asking someone to carry them to a coffee shop. Decides against it. Leaves under own dwindling power.`,
        (name) =>
            `${name} whispers 'caffeine' one last time. The machine cannot help. ${name} shuffles away.`,
        (name) =>
            `${name} stares at the machine so long they might be sleeping standing up. They are. They wake up and leave.`,
        (name) =>
            `"No energy drinks? In THIS economy? In THIS body?" ${name} can't even gesture properly. Leaves.`,
        (name) =>
            `${name}'s spirit leaves their body to go find caffeine. Their body follows shortly after. Both leave.`,
        (name) =>
            `${name} opens their mouth to complain. A yawn comes out instead. They leave, mouth still open.`,
    ],
    drink: [
        (name) =>
            `${name} wanted a drink. The machine offers no beverages. ${name} has never been more betrayed.`,
        (name) =>
            `"A vending machine with nothing to drink?!" ${name} gestures wildly and leaves.`,
        (name) =>
            `${name} licks their dry lips. No drinks. This machine is a monument to suffering.`,
        (name) =>
            `${name} holds their empty water bottle up to the machine accusingly. No drinks. The machine is guilty.`,
        (name) =>
            `"I'm going to DEHYDRATE," ${name} announces dramatically. They leave to find a water fountain.`,
        (name) =>
            `${name} opens and closes the machine flap repeatedly, hoping a drink will materialize. Magic isn't real. They leave.`,
        (name) =>
            `"My mouth is a DESERT," ${name} announces. ${name} is not wrong. Leaves to find an oasis.`,
        (name) =>
            `${name} licks the glass hoping for condensation. There is none. Only glass. And shame. Leaves.`,
        (name) =>
            `${name} shakes their empty water bottle at the machine accusingly. "YOU did this." Leaves.`,
        (name) =>
            `${name} checks behind the machine for a hidden tap. Finds a power cord. Drinks nothing. Leaves.`,
        (name) =>
            `"Not a single drop of liquid in this entire machine." ${name} has audited every row. Accurate. Devastating. Leaves.`,
        (name) =>
            `${name} makes a tiny raindance in front of the machine. It does not rain. Or vend drinks. Leaves.`,
        (name) =>
            `${name} presses buttons hoping for a secret drink menu. There is no secret drink menu. Leaves.`,
        (name) =>
            `${name} holds their tongue out hoping for moisture from the air. The air is dry. They leave, tongue out.`,
        (name) =>
            `"I'm going to shrivel up like a raisin," ${name} croaks. They're getting dramatic. Leaves.`,
        (name) =>
            `${name} brings out a cup and holds it under the machine flap. Nothing comes out. Leaves with an empty cup.`,
        (name) =>
            `${name} asks the machine for water. In English. In Spanish. In gestures. The machine responds in none.`,
        (name) =>
            `"You can't sell SOLID FOOD without DRINKS!" ${name} makes a valid point. The machine ignores it. ${name} leaves.`,
        (name) =>
            `${name} considers licking the glass a second time. Self-respect barely wins. They leave.`,
        (name) =>
            `${name} starts hyperventilating about the lack of drinks. Then realizes breathing is free. Calms down. Still leaves.`,
        (name) =>
            `"My throat is filing a grievance." ${name}'s throat and ${name} leave together. Dry.`,
        (name) =>
            `${name} tries to extract liquid from the air with cupped hands. Collects nothing. Science is cruel. Leaves.`,
        (name) =>
            `${name} makes the universal 'drinking' gesture at the machine. Tilting an imaginary cup. Nothing happens. Leaves.`,
        (name) =>
            `"Even the SAHARA has the occasional oasis. This machine has NOTHING." ${name} leaves, parched and theatrical.`,
        (name) =>
            `${name} checks the weather app hoping for rain. Clear skies. No drinks inside or outside. Leaves.`,
        (name) =>
            `${name} holds their hand under the vending flap like it's a water fountain. It is not. Leaves.`,
        (name) =>
            `${name} writes 'H2O PLEASE' on a napkin and tapes it to the machine. Leaves. The napkin stays.`,
        (name) =>
            `"Every cell in my body is begging for liquid." ${name}'s cells leave. ${name} follows.`,
        (name) =>
            `${name} considers eating an ice cube from their pocket. They don't have ice in their pocket. Why would they. Leaves.`,
        (name) =>
            `${name} opens their mouth to complain but it's too dry to speak. Leaves silently.`,
        (name) =>
            `${name} presses the drink button 47 times. There is no drink button. They pressed random buttons. Leaves.`,
        (name) =>
            `"I've been hydrating for 30 years and THIS is where the streak ends?" ${name} refuses. Leaves.`,
        (name) =>
            `${name} cups their hands under the AC vent hoping for condensation. Gets a cold hand. Leaves.`,
        (name) =>
            `${name} starts singing about rain. It doesn't summon rain. Or drinks. Leaves, mid-verse.`,
        (name) =>
            `${name} has never been this thirsty. "My tongue is a sandpaper factory." Leaves to find water.`,
        (name) =>
            `${name} checks the fire extinguisher. Considers it. Decides against it. Leaves. Smart choice.`,
        (name) =>
            `${name} whimpers at the drinkless selection. The whimper echoes. Nobody brings drinks. Leaves.`,
        (name) =>
            `"A drink-free vending machine should be illegal," ${name} declares. Files a mental complaint. Leaves.`,
    ],
    fancy: [
        (name) =>
            `${name} wanted something fancy. This machine is basically a trash can. They leave in disgust.`,
        (name) =>
            `"Nothing here is worth my time," ${name} declares to nobody. They leave.`,
        (name) =>
            `${name} looks at the selection like a food critic at a gas station. Walks away.`,
        (name) =>
            `${name} adjusts their cufflinks and scoffs at the selection. "Beneath me." They glide away.`,
        (name) =>
            `"I wouldn't feed this to my ENEMIES," ${name} announces. Their enemies aren't here. They leave.`,
        (name) =>
            `${name} pulls out a tiny magnifying glass to inspect the selection. Finds it lacking. Leaves with a disappointed sigh.`,
        (name) =>
            `"This is what passes for 'selection' these days?" ${name} is aghast. Leaves aghastly.`,
        (name) =>
            `${name} scoffs so hard they pull a muscle. Walks away, massaging their jaw.`,
        (name) =>
            `"I've seen better options in a HOSPITAL cafeteria." ${name} has strong hospital cafeteria opinions. Leaves.`,
        (name) =>
            `${name} checks if the machine has a VIP section. It does not. Leaves.`,
        (name) =>
            `${name} takes out a silk handkerchief and dabs their brow. "The horror." Glides away.`,
        (name) =>
            `"My palate is OFFENDED," ${name} announces. Their palate leaves with them.`,
        (name) =>
            `${name} holds up a monocle. Inspects each item. "Dreck. Utter dreck." Leaves.`,
        (name) =>
            `${name} calls their personal chef to complain. The chef doesn't answer. Leaves.`,
        (name) =>
            `"Not a single organic, artisanal, or ethically-sourced item." ${name} is devastated. Leaves.`,
        (name) =>
            `${name} rates the machine: ambiance 2/10, selection 1/10, would not recommend. Leaves.`,
        (name) =>
            `"In Paris, even VENDING MACHINES have standards." ${name} has never been to Paris. Leaves.`,
        (name) =>
            `${name} sniffs the air near the machine. "I can smell the mediocrity." Leaves with their nose in the air.`,
        (name) =>
            `${name} takes out a business card and slides it into the machine's coin slot. "Call me when you upgrade." Leaves.`,
        (name) =>
            `"I'd sooner eat my own cufflinks." ${name} considers this. Doesn't. Leaves.`,
        (name) =>
            `${name} looks at the selection the way a cat looks at an empty food bowl. With contempt. Walks away.`,
        (name) =>
            `${name} gasps at the selection like someone just showed them a spider. Leaves at spider-fleeing speed.`,
        (name) =>
            `"My therapist said to lower my expectations. Not THIS low." ${name} leaves to call their therapist.`,
        (name) =>
            `${name} checks for a Michelin rating on the machine. None. Shocked. Leaves.`,
        (name) =>
            `${name} tries to find the machine on Yelp. Zero reviews. Zero stars. Leaves to write the first.`,
        (name) =>
            `"This machine belongs in a MUSEUM. A museum of BAD SNACKS." ${name} leaves with museum energy.`,
        (name) =>
            `${name} adjusts their ascot and walks away. Yes, they're wearing an ascot. No, it doesn't help.`,
        (name) =>
            `"I've eaten at gas stations with more panache." ${name} has a ranking system for gas stations. Leaves.`,
        (name) =>
            `${name} takes a photo of the selection to show friends 'what NOT to buy.' Leaves.`,
        (name) =>
            `"Where's the gold leaf? The truffle? The... anything?" ${name} finds nothing premium. Leaves premium-ly.`,
        (name) =>
            `${name} asks if there's a premium membership for better snacks. There isn't. They leave, membership-less.`,
        (name) =>
            `${name} checks the expiration dates with a jeweler's loupe. "Pedestrian." Leaves.`,
        (name) =>
            `"My butler would be appalled." ${name} doesn't have a butler. The point stands. They leave.`,
        (name) =>
            `${name} picks up their phone. "Darling, you won't BELIEVE what they're selling here." Leaves while talking.`,
        (name) =>
            `${name} looks at the machine like it's a crime against culinary arts. Leaves. Case closed.`,
        (name) =>
            `"I'd rather fast than settle for THIS." ${name} fasts. Leaves. (They'll eat in 20 minutes.)`,
        (name) =>
            `${name} sighs so refinedly it could be bottled and sold as perfume. Leaves elegantly.`,
        (name) =>
            `${name} considers writing a strongly-worded letter. In calligraphy. On parchment. Leaves to find a quill.`,
    ],
    cheap: [
        (name) =>
            `Everything's too expensive for ${name}. They do the math three times. Still too much. Gone.`,
        (name) => `${name} counts their coins. Counts again. Nope. Walks away.`,
        (name) =>
            `"In THIS economy?!" ${name} gestures at the prices and leaves.`,
        (name) =>
            `${name} writes a strongly worded Yelp review in their head and leaves.`,
        (name) =>
            `${name} turns out their pockets. Lint. A button. No snack money. They shuffle away.`,
        (name) =>
            `"I remember when things cost REASONABLE amounts," ${name} says to the machine. The machine does not remember.`,
        (name) =>
            `${name} calculates the price in hours of labor. The math hurts. They leave.`,
        (name) =>
            `${name} tries to barter with the machine. Offers a paperclip. The machine declines. ${name} leaves.`,
        (name) =>
            `${name} counts the same three coins over and over. The answer stays 'not enough.' Leaves.`,
        (name) =>
            `"I have SOME money. Just not THAT much money." ${name} leaves with their some-money intact.`,
        (name) =>
            `${name} checks under the machine for dropped coins. Finds a dust bunny. Leaves with the dust bunny.`,
        (name) =>
            `${name} converts the prices to hourly wages. Realizes they can't afford to breathe near this machine. Leaves.`,
        (name) =>
            `"I remember when these cost a NICKEL," ${name} says. They're 22. Leaves.`,
        (name) =>
            `${name} looks at the prices and laughs nervously. Then stops laughing. Then leaves.`,
        (name) =>
            `${name} asks if the machine accepts IOUs. It does not. Leaves owing nothing.`,
        (name) =>
            `"My budget says no. My stomach says yes. My budget wins." ${name} leaves. Budget intact. Stomach angry.`,
        (name) =>
            `${name} pulls out a coupon for a different store. Tries it anyway. Doesn't work. Leaves.`,
        (name) =>
            `${name} offers to trade labor for snacks. "I'll clean the machine?" Nobody hears. They leave.`,
        (name) =>
            `${name} counts coins in slow motion. Each coin reveals the same truth: not enough. Leaves in slow motion.`,
        (name) =>
            `"These prices are a HUMAN RIGHTS VIOLATION," ${name} declares. They leave to contact the UN.`,
        (name) =>
            `${name} considers selling their phone to afford a snack. Decides that's too much. Leaves with their phone.`,
        (name) =>
            `${name} Googles 'free snacks near me.' Gets ads. Leaves, privacy invaded AND hungry.`,
        (name) =>
            `${name} opens their wallet so wide it echoes. Empty. The echo is devastating. Leaves.`,
        (name) =>
            `"I could BUILD a snack for less than these prices." ${name} can't build a snack. Leaves to try.`,
        (name) =>
            `${name} tries to split a purchase with a stranger. The stranger declines. Both leave. Separately.`,
        (name) =>
            `${name} considers starting a crowdfunding campaign for one snack. The overhead alone... leaves.`,
        (name) =>
            `"My bank account just sent me a sympathy card." ${name} leaves to read it.`,
        (name) =>
            `${name} stares at the cheapest item. Still too expensive. A new low. Leaves.`,
        (name) =>
            `${name} offers the machine a firm handshake. "How about a discount?" No deal. Leaves.`,
        (name) =>
            `${name} whispers the prices to a friend on the phone. The friend gasps. ${name} leaves, validated.`,
        (name) =>
            `"I'll wait for the sale." There is no sale. There is no waiting. ${name} leaves.`,
        (name) =>
            `${name} does a full financial review on the sidewalk. Result: cannot afford. Leaves, reviewed.`,
        (name) =>
            `${name} looks up 'vending machine loyalty programs.' None exist. Leaves without loyalty or snacks.`,
        (name) =>
            `"I am exactly one coin short and that coin will haunt me forever." ${name} leaves. Haunted.`,
        (name) =>
            `${name} tries to negotiate a group discount. They're the only one here. No discount. Leaves.`,
        (name) =>
            `${name} checks every pocket. Finds: lint, a receipt from 2019, and disappointment. Leaves.`,
        (name) =>
            `"Inflation! INFLATION!" ${name} shakes their fist at the sky. The sky is not responsible. Leaves.`,
        (name) =>
            `${name} briefly considers a career change to 'person who can afford vending machines.' Leaves to update resume.`,
        (name) =>
            `${name} pulls out a piggy bank. Shakes it. Not enough. Puts it back. Leaves with the piggy.`,
        (name) =>
            `${name} looks at the prices and ages visibly. Leaves older and poorer.`,
    ],
};

const MOOD_LINES: Record<string, string[]> = {
    cheap: [
        "is hunting for a bargain.",
        "is counting every penny.",
        "refuses to pay full price for anything.",
        "has a budget and they're sticking to it.",
        "is squinting at prices like a hawk.",
        "brought exact change and not a cent more.",
        "has coupons for a different store but is trying anyway.",
        "is doing mental math so hard you can hear it.",
        "is comparing prices to the cost of breathing.",
        "brought a calculator. A physical calculator.",
        "is sweating at these prices.",
        "is already calculating the cost per bite.",
        "looks like they've memorized the price of everything.",
        "just whispered 'that's too much' at a wall.",
        "is aggressively comparison shopping. Against nothing.",
        "is holding their coins so tight they might fuse.",
        "checks prices with the intensity of a stock trader.",
        "has the energy of someone using every loyalty card they own.",
        "brought their own bag to avoid the bag fee. There is no bag fee.",
        "is muttering about the price of lettuce, which is unrelated.",
        "just did a cost-benefit analysis on the walk over here.",
        "has a spreadsheet open on their phone. It's about snack prices.",
        "is visibly doing math with their fingers.",
        "brought leftover coins from three different countries.",
        "is checking the couch cushions of their mind for spare change.",
        "has already calculated how much they'd save by not buying anything.",
        "looks like they'd haggle with a parking meter.",
        "is counting coins one by one and whispering each amount.",
        "keeps looking at the prices and wincing.",
        "has the facial expression of someone reading their credit card statement.",
        "is converting prices to hours of labor.",
        "just told a stranger these prices are 'criminal.'",
        "appears to be having a financial crisis in front of a vending machine.",
        "is comparing these prices to what their parents paid in 1985.",
        "wants a deal. THE deal. The deal that doesn't exist.",
        "has the spending anxiety of a college student with $3.47 in their account.",
        "is looking at the prices like they're written in a foreign currency.",
        "keeps patting their pockets like the money will multiply.",
        "just said 'I could make this at home' about a vending machine snack.",
        "has the vibe of someone who reuses paper towels.",
        "is calculating tip. For a machine. Zero. The answer is zero.",
        "is staring at prices the way most people stare at bills.",
        "looks like they're about to ask for a manager. About vending machine prices.",
        "counts their change with the precision of a jeweler.",
        "is giving off 'early bird special' energy at 2pm.",
        "just audibly gasped at a price. It was $1.50.",
        "is looking for a price match guarantee. On a vending machine.",
        "shakes their piggy bank. Empty. They brought a piggy bank.",
        "has the budgeting instincts of a survivalist.",
        "just turned their pockets inside out. Found: hope (none).",
        "is whispering 'inflation' like a curse word.",
        "is consulting a financial advisor. The advisor is their phone calculator.",
        "has the spending energy of someone who clips coupons recreationally.",
        "is holding exact change and refuses to break a bill.",
        "just said 'back in my day' about something that costs $2.",
        "is doing long division in their head. Visibly.",
    ],
    sweet: [
        "has a serious sweet tooth today.",
        "is craving something sugary.",
        "would commit crimes for candy right now.",
        "is vibrating at a frequency only sugar can fix.",
        "has the wild eyes of someone in dessert withdrawal.",
        "just came from the dentist and is about to undo all that work.",
        "is whispering 'sugar sugar sugar' under their breath.",
        "has a candy bar-shaped hole in their heart.",
        "is on a sugar quest. The quest is urgent.",
        "just licked their lips thinking about sweets.",
        "has sugar cravings that could be classified as a natural disaster.",
        "looks like they haven't had dessert in years.",
        "is eyeing the candy like a lion eyes a gazelle.",
        "smells like they just came from a bakery. Or wish they did.",
        "has the pupils of someone who just saw a candy store.",
        "is practically salivating. At a machine.",
        "just whispered 'chocolate' like a prayer.",
        "has been thinking about candy since they woke up. They woke up 4 minutes ago.",
        "is bouncing on their toes. Sugar anticipation or sugar withdrawal. Either way.",
        "keeps opening and closing their mouth. Pre-chewing. For candy.",
        "has the wild look of someone who skipped dessert last night.",
        "is clutching their coins like they're about to buy their freedom. In sugar.",
        "just said 'I need it' to nobody. About candy. Probably.",
        "has the energy of a kid in a candy store. This is not a candy store. They don't care.",
        "is doing the sugar shuffle. Feet can't stay still. Need sugar.",
        "is sniffing the air for traces of sweetness.",
        "has the thousand-yard stare of someone in sugar debt.",
        "is checking every slot for hidden candy.",
        "is radiating sweet-tooth energy so hard it's warming the room.",
        "just made a noise that can only be described as 'candy sonar.'",
        "is vibrating. Literally vibrating. Sugar withdrawal is real.",
        "has been circling the candy section like a shark.",
        "is already unwrapping imaginary candy in their hands.",
        "just asked a stranger 'do you have candy' before approaching the machine.",
        "appears to be in a sugar trance. Their eyes are glazed. (Like a donut.)",
        "is making grabby hands at the candy row.",
        "looks like they'd trade a kidney for a lollipop.",
        "has the determination of someone who will NOT leave without something sweet.",
        "is doing taste-memory exercises. Remembering the last candy they had. Beautiful times.",
        "smells like desperation and a faint memory of caramel.",
        "is reading every label looking for the word 'sugar.'",
        "just closed their eyes and whispered 'take me to candyland.'",
        "has the sugar radar of a hummingbird.",
        "is staring at the machine with heart eyes. For the candy.",
        "looks like they'd fight someone for the last candy bar.",
        "is mentally writing a love letter to whichever candy they find first.",
        "has a sweet tooth so powerful it has its own gravitational field.",
        "is tapping the glass over the candy section rhythmically. Summoning.",
        "just asked the machine 'where do you keep the good stuff?' They mean candy.",
        "has the focused intensity of someone on a sugar-seeking missile trajectory.",
        "is checking the expiration dates. Not for safety. To find the freshest candy.",
        "appears to have entered a sugar-craving fugue state.",
        "has the urgency of someone whose blood sugar is sending them morse code.",
        "is making involuntary 'mmm' sounds at the candy section.",
        "looks like they'd befriend anyone who offered them candy. Stranger danger: ignored.",
        "is scanning for sweets with the efficiency of a barcode reader.",
    ],
    salty: [
        "wants something crunchy and salty.",
        "is in the mood for chips. Specifically.",
        "hasn't had enough sodium today apparently.",
        "is craving crunch so hard their jaw is already moving.",
        "keeps making crunching noises with their mouth. Preemptive.",
        "looks like they'd season the air if they could.",
        "is air-crunching. Their jaw is warming up.",
        "just asked 'got anything salty?' to the machine. It didn't answer.",
        "has the posture of someone who NEEDS crunch in their life.",
        "is sniffing for salt the way a truffle pig sniffs for truffles.",
        "is already making chip-bag-opening motions with their hands.",
        "smells like they just left a pretzel factory.",
        "is making intense eye contact with the chip row.",
        "looks like they'd eat salt straight from the shaker.",
        "has the crunch cravings of someone who's been eating soft food for a week.",
        "is staring at the salty snacks like they're the answer to life.",
        "just crunched a piece of ice from their drink. But they want MORE crunch.",
        "is checking for chips with the dedication of a detective.",
        "has the sodium-seeking instincts of a deer at a salt lick.",
        "keeps touching their jaw. It's ready. It was born ready. For crunch.",
        "is the kind of person who eats the whole bag. Of anything salty.",
        "just said 'I need something I can really BITE INTO.'",
        "has the energy of someone who rates snacks by decibel level.",
        "is pre-salting their fingers in anticipation.",
        "looks like they'd add salt to salt.",
        "is moving their mouth like they're already eating chips. Phantom crunch.",
        "has the focused stare of a crunch connoisseur.",
        "smells like ocean air. Or maybe just really wants salt.",
        "keeps clacking their teeth together. Testing crunch readiness.",
        "is giving off 'I didn't come here for soft food' energy.",
        "has the wild eyes of a crunch addict between fixes.",
        "just grabbed a packet of salt from their pocket. Just in case.",
        "is reading labels looking for the word 'crunchy.'",
        "keeps saying 'cronch' under their breath. It's not a word. They don't care.",
        "has the jaw strength of someone who eats pretzels recreationally.",
        "is staring at the chip aisle with romantic longing.",
        "has a crunch rating system and they're about to use it.",
        "looks like they'd fight for the last chip in a bag.",
        "is making the 'gimme' hands at the salty section.",
        "just described their ideal snack as 'aggressively crunchy.'",
        "has the intensity of someone whose last chip was hours ago.",
        "is tapping the glass near the chips impatiently.",
        "has the energy of someone who finishes the chips before the movie starts.",
        "keeps licking their lips in anticipation of salt.",
        "just asked 'what's the crunchiest thing you have?' to a machine.",
        "is checking the crunch factor by gently squeezing bags through the glass.",
        "has crunch radar. It's pinging. Somewhere in this machine. Crunch.",
        "looks like they'd add chips to other chips for extra crunch.",
    ],
    energy: [
        "needs caffeine. Desperately.",
        "is running on 3 hours of sleep.",
        "looks like they could use a pick-me-up.",
        "is propping their eyelids open with their fingers.",
        "hasn't blinked in four minutes.",
        "is swaying gently. Not from music. From exhaustion.",
        "appears to be sleepwalking. Into a vending machine.",
        "keeps yawning mid-sentence. Mid-thought. Mid-everything.",
        "has dark circles that could be classified as eye shadow.",
        "is using the machine as a leaning post. They might fall.",
        "looks like they could use a nap. Or five.",
        "has the posture of someone being held upright by sheer willpower.",
        "just yawned so wide their jaw cracked.",
        "is blinking in slow motion. Each blink lasts longer.",
        "has the thousand-yard stare of someone on their third shift.",
        "keeps almost dropping their wallet. From tiredness.",
        "is nodding off between breaths.",
        "has the energy of a phone at 1%.",
        "looks like they've been awake since the Stone Age.",
        "is swaying like a palm tree in a hurricane. The hurricane is exhaustion.",
        "just asked what year it is. They're that tired.",
        "has coffee stains from three different cups on their shirt.",
        "is trying to read labels but their eyes won't focus.",
        "keeps putting their face against the cold glass to stay awake.",
        "has the reaction time of a sleepy sloth.",
        "is holding their eyelids open with one hand and coins with the other.",
        "just mistook the machine for a bed. Leaned on it. Almost fell.",
        "has the under-eye bags of someone who hasn't slept since Tuesday.",
        "is muttering 'caffeine' like a zombie moaning for brains.",
        "has bags under their bags under their bags.",
        "just tried to scan their employee badge on the vending machine. Wrong machine.",
        "is running on pure spite and zero sleep.",
        "looks like gravity is their mortal enemy today.",
        "keeps almost walking into the machine. Depth perception: offline.",
        "is so tired their shadow is yawning.",
        "has the exhaustion aura of someone who said 'one more episode' 6 hours ago.",
        "is using a textbook as a pillow against the machine.",
        "has entered the phase of tiredness where everything is funny. And then not.",
        "keeps checking their pulse to make sure they're still alive.",
        "is the human equivalent of a 'battery low' notification.",
        "has the coordination of someone who hasn't slept in 36 hours.",
        "is drooling slightly. Not at the snacks. Just... unconsciously.",
        "has transcended regular tired and entered 'caffeination or death' territory.",
        "is staring at the machine without blinking. They forgot how.",
        "looks like they'd fall asleep standing up if the machine was softer.",
        "has the desperation of someone whose alarm goes off in 3 hours.",
        "is typing 'caffeine near me' into the machine like it's a phone.",
        "has the half-lidded stare of someone losing a battle with consciousness.",
        "just whispered 'I can't go on' to the machine. The machine agrees.",
    ],
    drink: [
        "is really thirsty.",
        "just wants a cold drink.",
        "is eyeing the beverages.",
        "is so dehydrated they're making crackling sounds when they move.",
        "keeps licking their lips. It's alarming.",
        "brought an empty cup. Optimistic.",
        "is eyeing the cold drinks section like a mirage.",
        "keeps touching their throat. It's dry. So dry.",
        "just made a 'drinking' motion with an empty hand.",
        "has the desperation of someone lost in a desert.",
        "is so thirsty their voice crackles when they speak.",
        "brought a straw. Optimistic AND prepared.",
        "is pressing their face against the glass near the drinks.",
        "looks like they ran here specifically for a beverage.",
        "has dry lips that could be classified as a geological formation.",
        "is making 'glug glug' sounds with their mouth. Prematurely.",
        "has the urgency of someone who just ate something extremely spicy.",
        "keeps checking the drink section every 3 seconds. It hasn't changed.",
        "is so parched they're looking at the fire sprinkler hopefully.",
        "just coughed dust. Possibly metaphorical. Possibly not.",
        "is holding their empty water bottle upside down. Nothing comes out. Tragic.",
        "has the 'I just ran 5 miles' energy but they clearly didn't run anywhere.",
        "keeps asking other customers if they're using that drink.",
        "is side-eyeing the drink section with the intensity of a cat watching a bird.",
        "looks like they'd drink anything liquid. Anything.",
        "has the dehydrated shuffle of someone who forgot to drink water all day.",
        "just described their thirst as 'biblical.'",
        "is holding their mouth open near the machine vent. Looking for moisture.",
        "has the haunted look of someone who's been thirsty for hours.",
        "is staring at the beverages like they're behind museum glass.",
        "keeps licking their dry lips. The sound is unsettling.",
        "brought their own ice. No liquid though. That's the problem.",
        "has the energy of someone stranded at sea. But in a building.",
        "is checking the machine's plumbing. It doesn't have plumbing.",
        "just whispered 'water' and looked at the sky. The ceiling, actually.",
        "is doing the tongue-stuck-to-the-roof-of-the-mouth thing.",
        "keeps making swallowing motions but there's nothing to swallow.",
        "has been thinking about beverages since sunrise.",
        "is holding a cup, a mug, and a thermos. All empty. Optimistic x3.",
        "is so thirsty they started panting. Like a dog. No judgment.",
        "has the focused thirst of someone who can hear a faucet three rooms away.",
        "looks like they'd hug a glass of water if given the opportunity.",
        "is checking behind other products for hidden drinks.",
        "just tried to order a drink by name. From a machine. With buttons.",
        "has the dry-mouth energy of someone who presented to 200 people today.",
        "is sweating out more liquid than they're taking in. Net negative hydration.",
        "keeps pointing at drinks and mouthing 'please.'",
        "has the frantic energy of someone who knows dehydration exists.",
    ],
    fancy: [
        "has expensive taste.",
        "only wants the fancy stuff.",
        "looks like they tip well.",
        "arrived in a car that costs more than this building.",
        "is wearing a watch that costs more than the entire machine.",
        "has the energy of someone who sends food back at restaurants.",
        "only eats things with the word 'artisanal' on them.",
        "is wearing clothes that cost more than everything in this machine.",
        "looks like they just stepped out of a luxury magazine.",
        "scoffs at the regular items like they're beneath consideration.",
        "has the energy of someone who vacations in places with 'villa' in the name.",
        "just adjusted their cufflinks. At a vending machine.",
        "arrived wearing sunglasses indoors. Luxury move.",
        "is reading labels like a wine sommelier reads cork dates.",
        "has the posture of someone who's never carried their own groceries.",
        "keeps asking if there's a 'premium tier.'",
        "looks like they'd rate a gas station bathroom on ambiance.",
        "has the air of someone who tips in large bills.",
        "just called a regular snack 'quaint.' Quaint.",
        "is wearing more jewelry than the machine costs.",
        "has the 'I only eat organic' energy.",
        "smells like expensive cologne and high standards.",
        "is checking for provenance. On a bag of chips.",
        "has the scrutinizing gaze of a food critic on assignment.",
        "just asked if the snacks are locally sourced.",
        "looks like they've never seen a vending machine before. Possibly true.",
        "has the judgment aura of someone who reviews restaurants professionally.",
        "keeps wiping the buttons with a handkerchief before pressing them.",
        "is wearing a scarf that costs more than your rent.",
        "has the energy of someone who sends wine back at tastings.",
        "just photographed the machine. For their 'design fails' blog.",
        "looks like they'd tip the machine if it had a jar.",
        "has the eyebrow raise of someone unimpressed by everything.",
        "is reading nutritional info like it's a Michelin guide.",
        "smells like money and disappointment.",
        "has the taste buds of a sommelier and the surroundings of a bus station.",
        "is checking if any snack is gluten-free, organic, AND fair-trade.",
        "just muttered 'where's the charcuterie' under their breath.",
        "has the spending power of someone who calls ATMs 'cash machines.'",
        "is evaluating the machine's aesthetic. It's failing.",
        "looks like they were promised a gourmet experience and got... this.",
        "has the quiet disdain of someone eating at a 3-star when they expected 5.",
        "keeps mentioning their 'usual spot.' The usual spot is not a vending machine.",
        "is dressed for a gala. They're at a vending machine. Life is complicated.",
        "has the selective purchasing habits of someone who only buys things featured in magazines.",
        "just called a bag of chips 'rustic.' It's not rustic. It's cheap.",
        "is comparing everything to something they had in Tokyo once.",
        "has the refined disappointment of a sommelier at a juice bar.",
        "keeps asking if there's a tasting menu. There is not.",
    ],
    none: [
        "doesn't seem too picky.",
        "is just browsing.",
        "will probably buy whatever catches their eye.",
        "is vibing. No agenda.",
        "is here for the experience, not the snacks.",
        "is just killing time, honestly.",
        "wandered in by accident and is going with it.",
        "is the kind of person who orders 'whatever you recommend.'",
        "has no preferences and no regrets.",
        "looks open-minded about snacks.",
        "has the relaxed energy of someone with no snack agenda.",
        "is staring at the machine with mild curiosity.",
        "seems like they'd be happy with anything. Or nothing.",
        "has the vibe of someone who eats whatever's closest.",
        "is browsing like it's a museum. Of snacks.",
        "doesn't appear to want anything specific. Refreshing.",
        "is approaching the machine with zero expectations.",
        "has the calm of someone who doesn't care what they eat.",
        "looks like they're here to see what happens.",
        "is treating this like a social experiment.",
        "has the energy of someone who says 'surprise me' at restaurants.",
        "appears to be on a snack walkabout. Going where the craving takes them.",
        "is window shopping. At a vending machine. With real money.",
        "doesn't seem to have a strong opinion about anything. Including snacks.",
        "has the neutral expression of someone picking socks.",
        "is here. That's about all that can be said about their snack intentions.",
        "is letting the universe guide their snack choice.",
        "appears to be choosing by vibes alone.",
        "is looking at everything equally. Democracy of snacking.",
        "has the 'whatever happens, happens' attitude.",
        "is approaching this decision with remarkable indifference.",
        "has the shopping strategy of 'close eyes, point, buy.'",
        "seems genuinely surprised a vending machine is here.",
        "is standing in front of the machine like they just discovered it exists.",
        "has the commitment level of someone scrolling with no goal.",
        "is browsing like they have all day. They might.",
        "appears to be making a decision through osmosis.",
        "has the relaxed demeanor of someone with no stake in the outcome.",
        "is here because the machine is here. That's the whole story.",
        "looks like they'd eat a napkin if it was presented nicely enough.",
        "has the snack-choosing style of 'eenie meenie miney mo.'",
        "is giving every item equal consideration. Radically fair.",
        "is just existing near the machine. Purposelessly.",
        "has the browsing energy of someone in an airport with a 6-hour layover.",
        "appears to be meditating in front of the machine.",
        "is here for the ambiance. Vending machine ambiance.",
        "has no plan. No scheme. No agenda. Just snack proximity.",
        "is the snack equivalent of 'I'll have what they're having.'",
        "looks like they wandered in from a parallel universe where snack preferences don't exist.",
    ],
};

/**
 * Mood-to-tag mapping. A mood "matches" an item if the item has
 * any of the listed tags. "cheap" matches items priced ≤ 3,
 * "none" matches everything.
 */
export const MOOD_TAG_MAP: Record<string, string[]> = {
    sweet: ["sweet", "candy"],
    salty: ["salty"],
    energy: ["energy"],
    drink: ["drink"],
    fancy: [], // handled by quality check
    cheap: [], // handled by price check
    none: [], // matches everything
};

export const doesItemMatchMood = (
    item: SnackItemInstance,
    mood: string,
): boolean => {
    if (mood === "none") return true;
    if (mood === "cheap") return item.price <= 3;
    const tags = MOOD_TAG_MAP[mood] ?? [];
    return item.tags.some((t) => tags.includes(t));
};

// ── Helpers ──────────────────────────────────────────────

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min: number, max: number) =>
    min + Math.floor(Math.random() * (max - min + 1));

// ── Anger / kick logic ──────────────────────────────────

/**
 * Compute how angry a customer is based on price markups across ALL
 * stocked items visible to them.
 *
 * Each item contributes max(0, price - baseCost - 2) anger.
 *
 * Price-dial adjustments layer on top:
 *  - Overpriced items (adj > 0) compound: more overpriced items = disproportionately more anger.
 *  - Underpriced items (adj < 0) soothe: each underpriced item reduces anger, and
 *    multiple underpriced items provide extra cumulative soothing.
 *
 * If the machine has ≤1 item remaining, anger is dampened by 85%.
 */
export const computeAngerScore = (
    slots: MachineSlot[],
    claimed: Set<number>,
): number => {
    let anger = 0;
    let stockedCount = 0;
    let overpricedCount = 0;
    let underpricedCount = 0;
    let soothingAmount = 0;

    for (let i = 0; i < slots.length; i++) {
        const item = slots[i].item;
        if (!item || claimed.has(i)) continue;
        stockedCount++;

        // Base markup anger
        anger += Math.max(0, item.price - item.cost - 2);

        // Track price-dial offset from default
        const adj = priceAdjustment(item);
        if (adj > 0) {
            overpricedCount++;
        } else if (adj < 0) {
            underpricedCount++;
            soothingAmount += Math.abs(adj);
        }
    }

    // Compounding: multiple overpriced items escalate anger
    if (overpricedCount > 1) {
        anger *= 1 + (overpricedCount - 1) * 0.25;
    }

    // Soothing: underpriced items reduce anger
    anger -= soothingAmount * 0.5;
    if (underpricedCount > 1) {
        anger -= underpricedCount * 0.3;
    }

    // Dampen if nearly empty
    if (stockedCount <= 1) anger *= 0.15;
    return Math.max(0, anger);
};

/** Convert anger score to a 0–0.60 kick probability. */
export const kickChance = (anger: number): number =>
    Math.min(0.6, anger * 0.04);

/**
 * Damage per kick: scales with anger but never one-shots the machine.
 * Base 3–8, plus anger bonus capped so total never exceeds 25.
 */
export const rollKickDamage = (anger: number): number => {
    const base = randInt(3, 8);
    const angerBonus = Math.min(17, Math.floor(anger * 0.5));
    return Math.min(25, base + angerBonus);
};

// ── Price cap logic ──────────────────────────────────────

/** Base markup tolerance for normal customers. */
const NORMAL_MARKUP_BASE = 3;
/** Whales tolerate much higher markups. */
const WHALE_MARKUP_BASE = 8;
/** Chance a customer is a whale (high spender). */
const WHALE_CHANCE = 0.1;

/** Per-customer random spread on markup tolerance (+/- this amount). */
const MARKUP_SPREAD = 2;

/**
 * Max price a customer will pay for this item.
 * Each customer gets a unique tolerance based on mood, whale status, and randomness.
 * Round increases base tolerance slightly (customers expect pricier items later).
 */
export const maxPriceForCustomer = (
    item: SnackItemInstance,
    isWhale: boolean,
    round: number = 1,
): number => {
    const def = getItemDef(item.defId);
    const base = def?.basePrice ?? item.cost + 2;
    const markupBase = isWhale ? WHALE_MARKUP_BASE : NORMAL_MARKUP_BASE;
    // Random spread: each customer is slightly more or less tolerant
    const spread =
        Math.floor(Math.random() * (MARKUP_SPREAD * 2 + 1)) - MARKUP_SPREAD;
    // Round scaling: +1 tolerance per 3 rounds
    const roundBonus = Math.floor(round / 3);
    return base + markupBase + spread + roundBonus;
};

// ── Kick narration pools ─────────────────────────────────

type KickReaction = (name: string, damage: number) => string;

const KICK_REACTIONS: KickReaction[] = [
    (name, dmg) => `${name} kicks the machine. HARD. (-${dmg} HP)`,
    (name, dmg) => `${name} gives the machine a solid whack. (-${dmg} HP)`,
    (name, dmg) =>
        `Frustrated, ${name} shoulder-checks the machine. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} shakes the machine violently. Something rattles. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} slams their fist on the glass. It cracks a little. (-${dmg} HP)`,
    (name, dmg) =>
        `"THESE PRICES?!" ${name} drop-kicks the machine. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} rocks the machine back and forth. Coins jingle inside. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} headbutts the machine. They hurt themselves too. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} full-body checks the machine. It groans ominously. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} punches the coin return. The machine trembles. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} pulls out a trout and slaps the machine with it. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} bites the machine. Like, actually bites it. (-${dmg} HP)`,
    (name, dmg) => `${name} suplexes the machine. HOW?! (-${dmg} HP)`,
    (name, dmg) =>
        `${name} picks up a traffic cone and bonks the machine. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} removes a shoe and starts whacking the glass. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} does a flying elbow drop onto the machine. Wrestling is real to them. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} licks their hand and slaps the machine. Disrespectful AND unhygienic. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} throws a nearby potted plant at the machine. The plant did nothing wrong. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} attempts a spinning heel kick. Somehow lands it. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} summons the ancient fury of their ancestors and body-slams the machine. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} uses the machine as a punching bag. It's surprisingly therapeutic. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} stares at the prices, vibrates with rage, and karate chops the machine. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} throws their wallet at the machine in protest. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} picks the machine up slightly and lets it drop. Terrifying strength. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} gnaws on the power cord like an angry beaver. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} hip-checks the machine with the force of a small car. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} challenges the machine to a duel. The machine loses. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} unscrews a panel and flicks it. That's targeted vandalism. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} swan-dives into the machine. They meant to do that. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} hits the machine with a soggy baguette they had this whole time. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} throws a brick at the machine. Where did the brick come from? Nobody knows. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} unleashes a flurry of punches. The machine takes each one. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} unsheathes a foam sword and goes medieval on the machine. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} hurls a pineapple at the machine. Nature's grenade. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} runs at the machine and delivers a WWE-worthy clothesline. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} pulls out a rubber chicken and beats the machine with it. Unconventional. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} throws their backpack at the machine. Books inside. Heavy books. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} picks up a folding chair and goes full wrestling match. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} headbutts the coin slot specifically. Precision rage. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} slaps the machine with a flip-flop. The flip-flop of fury. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} does a barrel roll into the machine. Video game logic. Real damage. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} pulls a baseball bat from NOWHERE and takes a swing. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} throws a bowling ball at the machine. Strike. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} grabs a nearby mop and jousts the machine. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} slaps the machine with both hands simultaneously. Stereo slap. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} kicks the machine while doing a backflip. Showmanship. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} body-slams the machine from the top rope. There is no top rope. They improvised. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} throws a bag of oranges at the machine. No bruises. Just dents. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} rams the machine with a shopping cart at full speed. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} elbows the glass and instantly regrets it. Still did damage though. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} digs their keys into the machine's paint. Emotional AND physical damage. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} throws hot coffee at the machine. The coffee was for them. But rage. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} runs headfirst into the machine like a battering ram. Medieval tactics. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} pulls out a whip. AN ACTUAL WHIP. Cracks it on the machine. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} grabs the machine's plug and threatens to pull it. Then kicks it instead. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} does a spinning backfist into the machine. Martial arts aren't just for movies. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} hits the machine with a pool noodle. It shouldn't hurt but it does. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} throws a cactus at the machine. Spiky and painful. For the cactus and the machine. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} uses a fire extinguisher as a battering ram. Not its intended purpose. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} spinkicks the coin return. Coins fly. Chaos reigns. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} throws a typewriter at the machine. Where did they GET that? (-${dmg} HP)`,
    (name, dmg) =>
        `${name} launches a shoe like a missile. Direct hit. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} power-slams their fist on the glass. The glass protests. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} wraps their scarf around the machine and tries to strangle it. It's a machine. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} throws a snowglobe at the machine. It's July. Where was the snowglobe? (-${dmg} HP)`,
    (name, dmg) =>
        `${name} uses a telescope as a battering ram. Science, repurposed. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} tackles the machine like a linebacker. Flag on the play. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} hurls a dictionary at the machine. The irony is not lost. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} hits the machine with a tennis racket. Game, set, damage. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} stomps on the machine's base. The base did nothing. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} throws a bike helmet at the machine. Safety equipment, weaponized. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} rams the machine with their hip repeatedly. It's personal. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} drop-kicks the glass panel. The glass holds. Barely. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} throws their lunch at the machine. PB&J, wasted in rage. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} uses a laptop bag as a flail. The laptop inside screams. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} hits the machine with a frozen water bottle. Ice + rage = damage. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} swings their belt at the machine. Dad mode: activated. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} throws a calculator at the machine. The math checks out: damage. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} bonks the machine with a thermos. Clang. Satisfying. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} punches the button panel so hard a button pops off. Overkill. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} hits the machine with a rolled-up newspaper. Old school. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} throws a stapler at the machine. Office supplies: weaponized. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} grabs a trash can and swings it at the machine. Oscar the Grouch style. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} pulls out a frying pan. Bonk. The sound echoes. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} hits the machine with an umbrella. Mary Poppins would NOT approve. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} throws a volleyball at the machine. SPIKE! (-${dmg} HP)`,
    (name, dmg) =>
        `${name} uses a skateboard as a weapon. Tony Hawk's Pro Vandalism. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} throws a bag of frozen peas at the machine. Ironically, that's how you treat the bruise. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} whips the machine with a jump rope. Fitness AND violence. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} throws a globe at the machine. The world literally hits it. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} slams a textbook against the glass. Knowledge IS power. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} runs at the machine doing karate noises. The noises are more intimidating than the kick. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} throws an avocado at the machine. Millennial warfare. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} uses a yoga mat as a battering ram. Namast-ay away from the machine. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} hits the machine with a broom. Sweeping victory for rage. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} throws their keys at the machine. Every key hits. Maximum key damage. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} smashes a watermelon on the machine. Gallagher-style vandalism. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} dropkicks the machine while screaming. The scream adds +2 emotional damage. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} hits the machine with a frozen burrito. Surprisingly solid. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} throws a boot at the machine. The boot bounces back. ${name} doesn't care. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} uses a stale baguette as a club. Hard as a baseball bat by now. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} slaps the machine with a wet towel. The snap echoes. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} throws a can of beans at the machine. Beans: the projectile you didn't expect. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} roundhouse kicks the machine. Chuck Norris nods somewhere. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} hits the machine with a pillow. It's surprisingly effective when filled with rage. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} throws a clock at the machine. Time flies. Literally. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} uses a rubber duck as a projectile. Quack. Impact. Damage. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} flicks the machine's glass with their finger. Really hard. REALLY hard. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} throws a hardcover novel at the machine. The plot thickens. And dents. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} swings a gym bag full of protein shakes at the machine. GAINS. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} throws a snow cone at the machine. Ice damage. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} punches the machine so hard the numbers on the display flicker. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} grabs a nearby "WET FLOOR" sign and uses it as a weapon. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} throws a frisbee at the machine. Perfect form. Perfect damage. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} uses a plunger on the glass. Suction AND impact. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} hits the machine with a handful of gravel. Death by a thousand tiny rocks. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} throws a jar of pickles at the machine. Brine everywhere. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} does a people's elbow from the top of a nearby bench. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} headbutts the glass so hard the lights flicker. Commitment. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} throws a harmonica at the machine. Musical and violent. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} hits the machine with a bag of ice. Cool crime. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} throws a waffle iron at the machine. Brunch warfare. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} slams a phone book on the machine. Nobody uses phone books anymore. Except as weapons. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} throws a jar of mayo at the machine. The jar survives. The machine less so. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} hits the machine with a cane. They don't need a cane. They brought it for THIS. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} throws a pumpkin at the machine. Seasonal damage. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} uses a garden hose as a whip. MacGyver would be proud. Concerned, but proud. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} throws a snow boot at the machine. Out of season. Still effective. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} full-send punches the glass. Their hand hurts. The machine hurts more. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} throws a trombone at the machine. Brass damage. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} hits the machine with a tube of wrapping paper. Holiday havoc. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} drives a shopping cart into the machine at ramming speed. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} throws a coconut at the machine. Tropical warfare. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} swings a bag of loose change at the machine. Ironic. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} throws a fish at the machine. Not a trout this time. A whole salmon. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} kicks the machine with steel-toed boots. Prepared rage. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} hurls a loaf of sourdough at the machine. Artisanal weaponry. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} throws a lamp at the machine. Enlightening AND damaging. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} does a flying kick and connects with the button panel. Buttons scatter. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} slams a briefcase on the machine. Business violence. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} throws a cheese wheel at the machine. Gouda grief. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} uses a selfie stick as a sword. Modern combat. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} throws their entire purse at the machine. Everything inside rattles on impact. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} punches the machine and accidentally triggers a hidden alarm. Still does damage. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} hits the machine with a bag of flour. Poof. Cloud. Damage. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} throws a basketball at the machine. Three points. None for the machine. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} uses a rolling pin on the machine. Baking + violence. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} throws a candle at the machine. The flame is out. The rage is not. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} slaps the machine with a wet fish. Again. This is becoming a theme. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} throws a toaster at the machine. Kitchen appliance PvP. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} hits the machine with a paddle. They don't have a canoe. Just the paddle. And fury. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} throws a book of stamps at the machine. First class damage. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} grabs the machine and physically tries to tip it over. Gets it 3 degrees. Gives up. Still hurt it. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} throws a garden gnome at the machine. The gnome's smile never wavers. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} hits the machine with a foam finger. #1 in rage. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} charges the machine screaming an ancient war cry. The war cry is 'AAARGH.' (-${dmg} HP)`,
    (name, dmg) =>
        `${name} throws a bag of marbles at the machine. Chaos on impact. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} uses an extension cord as a lasso and yanks the machine. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} throws a rubber ball at the machine. It bounces back. They throw it again. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} punches every button simultaneously. Fist of a thousand selections. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} does a power slide into the machine. Knees first. Painful for everyone. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} throws a jar of honey at the machine. Sticky situation. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} hits the machine with a kazoo. The damage is mostly psychological. Mostly. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} launches a lunch tray at the machine like a discus. Cafeteria Olympics. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} throws a bag of popcorn at the machine. Kernels everywhere. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} uses a corkscrew motion to drill their fist into the glass. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} throws a block of ice at the machine. Cold fury. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} slaps the machine with a piece of salami. Deli rage. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} throws a paper airplane at the machine. The aerodynamics are perfect. The damage is real. Somehow. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} hits the machine with a giant stuffed bear. The bear didn't sign up for this. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} throws a rock at the machine. Classic. Effective. Primal. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} uses a trophy as a hammer. First place in destruction. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} throws a shoe so hard it leaves a dent in the shape of a sole. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} hits the machine with a French horn. The note it makes is in the key of violence. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} does a dragon kick. They've been watching too much anime. But it works. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} throws a snow globe at the machine. It's a wonderful life. For the snow globe. Not the machine. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} pulls out a rubber mallet. "I've been waiting for this moment." (-${dmg} HP)`,
    (name, dmg) =>
        `${name} throws a bag of apples at the machine. An apple a day keeps the machine working. Not today. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} uses a parking meter as a lance and charges. Medieval parking violations. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} throws a computer mouse at the machine. Right-click: damage. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} does an uppercut to the machine's display. Shoryuken! (-${dmg} HP)`,
    (name, dmg) =>
        `${name} throws a bagel at the machine. Everything bagel. Including pain. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} uses a vacuum cleaner as a jousting pole. Creative AND angry. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} throws a pair of scissors at the machine. Ran with them too. Double offense. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} slams the machine with a Stop sign they stole from the corner. Ironic. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} throws a box of crayons at the machine. 64 colors of damage. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} does a combo: kick, punch, headbutt. Three-hit combo! (-${dmg} HP)`,
    (name, dmg) =>
        `${name} throws a loofah at the machine. Exfoliation meets destruction. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} hits the machine with a banana peel. Slippery slope to violence. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} grinds their skateboard on the machine's edge. Sick grind. Sick damage. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} throws a compass at the machine. It points to damage. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} tackles the machine mid-cartwheel. Gymnastics of fury. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} hits the machine with a bamboo pole. Kung fu master of vending machine destruction. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} throws a roll of duct tape at the machine. Can't fix THIS with duct tape. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} kicks the machine while wearing crocs. The crocs absorb nothing. Full damage. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} throws a blender at the machine. Will it blend? Will the machine survive? No. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} pulls out two bananas and dual-wields them against the machine. Potassium fury. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} launches a cat toy at the machine. The cat isn't here. The rage is. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} belly-flops onto the machine. Full commitment. Full damage. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} yeets a sandal at the machine with ancestral precision. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} smashes the machine with a glow stick. Rave damage. (-${dmg} HP)`,
    (name, dmg) =>
        `${name} winds up for three full seconds before punching the machine. Worth the wait. (-${dmg} HP)`,
];

// ── "Too expensive" skip reactions ───────────────────────

const TOO_EXPENSIVE_REACTIONS: SkipReaction[] = [
    (name) => `${name} looks at the prices and laughs. Not in a good way.`,
    (name) =>
        `${name} checks every item. Too expensive. ALL of them. ${name} leaves in disbelief.`,
    (name) =>
        `"Is this a joke?" ${name} gestures at the prices and walks away.`,
    (name) =>
        `${name} does a double take at the prices. Then a triple take. Then leaves.`,
    (name) =>
        `${name} pulls out their wallet, looks at the prices, puts it back. Nope.`,
    (name) =>
        `"I could buy a HOUSE for these prices," ${name} mutters. (They could not.)`,
    (name) =>
        `${name} photographs the prices to show their friends how absurd this is.`,
    (name) =>
        `${name} stares at the price tags like they're written in hieroglyphics.`,
    (name) =>
        `"Highway robbery!" ${name} announces to no one in particular, and leaves.`,
    (name) =>
        `${name} considers taking out a mortgage for a snack. Decides against it.`,
    (name) =>
        `${name} calls their financial advisor. The advisor also can't afford these prices.`,
    (name) =>
        `"Are these prices in YEN?!" ${name} squints. They are not. ${name} leaves.`,
    (name) =>
        `${name} tries to haggle with the machine. The machine is firm. ${name} leaves defeated.`,
    (name) =>
        `${name} checks if there's a decimal point they're missing. There isn't. They leave.`,
    (name) =>
        `"My RENT is cheaper than this," ${name} says. (It's not, but the point stands.)`,
    (name) =>
        `${name} looks at the prices, looks at the sky, looks back at the prices. Leaves.`,
    (name) =>
        `${name} starts a petition on the spot. Gets zero signatures. Leaves.`,
    (name) =>
        `"I've been robbed before and it was cheaper," ${name} says. They leave.`,
    (name) =>
        `${name} puts on reading glasses to make sure they're reading the prices right. They are. ${name} takes off glasses. Leaves.`,
    (name) =>
        `${name} briefly considers a life of crime to afford these prices. Decides against it. Leaves.`,
    (name) =>
        `"You're charging WHAT for a snack?!" ${name} does a full 360 of disbelief and leaves.`,
    (name) =>
        `${name} shows the prices to a stranger. The stranger also can't believe it. Both leave.`,
    (name) =>
        `"I'd need a LOAN for these prices," ${name} says. They're not entirely wrong. Leaves.`,
    (name) =>
        `${name} checks if there's a student discount. There isn't. Leaves to go back to school.`,
    (name) =>
        `${name} opens their wallet and a tiny violin plays. They can't afford the snack OR the violin.`,
    (name) => `"In what UNIVERSE—" ${name} starts, then stops, then leaves.`,
    (name) =>
        `${name} does mental math. The math says 'absolutely not.' Leaves.`,
    (name) =>
        `${name} checks the back of the machine for a 'just kidding' sign. There is none. Leaves.`,
    (name) =>
        `"These prices are an ATTACK on my wellbeing," ${name} announces. Leaves, wellbeing attacked.`,
    (name) =>
        `${name} converts the price to their hourly wage. One snack = not worth it. Leaves.`,
    (name) =>
        `${name} starts laughing. Then crying. Then leaves. Emotional rollercoaster.`,
    (name) =>
        `"I've seen diamonds cheaper than this," ${name} exaggerates. They haven't. But they're mad.`,
    (name) =>
        `${name} tries to pay with good vibes. The machine requires actual currency. Leaves.`,
    (name) =>
        `"My grandchildren won't be able to afford these prices." ${name} doesn't have grandchildren. The point stands.`,
    (name) =>
        `${name} faints at the prices. Wakes up. Still can't afford them. Leaves.`,
    (name) => `${name} writes a one-star review on an imaginary app. Leaves.`,
    (name) =>
        `"I could fly to another COUNTRY for these prices," ${name} says. They can't. But they leave.`,
    (name) =>
        `${name} holds up their coins next to the price. The gap is... wide. Very wide. Leaves.`,
    (name) =>
        `${name} asks the machine if it accepts tears. It does not. Leaves in tears.`,
    (name) =>
        `"My therapist can't afford these prices," ${name} says. Their therapist isn't here. ${name} leaves.`,
    (name) =>
        `${name} tries to pay with a button and a lint ball. The machine declines. Leaves.`,
    (name) =>
        `${name} looks at the prices like they're an optical illusion. Squints. Tilts head. Nope. Real. Leaves.`,
    (name) =>
        `"I JUST got paid and I STILL can't afford this," ${name} says. Leaves to find a cheaper machine.`,
    (name) =>
        `${name} asks if there's a payment plan. 12 easy installments of 'no.' Leaves.`,
    (name) =>
        `${name} stares at the prices so long they grow roots. Then uproots themselves. Leaves.`,
    (name) =>
        `"Do you accept organs?" ${name} asks the machine. The machine is not that kind of machine. Leaves.`,
    (name) =>
        `${name} considers selling their watch to afford a snack. The watch is worth less. Leaves with the watch.`,
    (name) =>
        `${name} calls their bank. The bank puts them on hold. They leave, still on hold.`,
    (name) =>
        `"These prices should come with a warning label," ${name} says. Leaves, warned.`,
    (name) =>
        `${name} checks the currency. It's not Monopoly money. It's real. The prices are real. The pain is real. Leaves.`,
    (name) =>
        `${name} looks for a 'half off' sticker. There is no sticker. There is no mercy. Leaves.`,
    (name) =>
        `"My SOUL is cheaper than this snack," ${name} says. Their soul has more utility. Leaves.`,
    (name) =>
        `${name} asks if the machine takes cryptocurrency. It takes coins. Normal coins. Not enough of ${name}'s. Leaves.`,
    (name) =>
        `${name} tries to combine their money with their dignity to afford a snack. Neither is enough alone. Leaves.`,
    (name) =>
        `"I'll eat when I'm rich," ${name} decides. May be a long wait. Leaves.`,
    (name) =>
        `${name} looks at the prices and their fight-or-flight kicks in. They choose flight. Leaves at speed.`,
    (name) =>
        `${name} puts a coin in. Takes it out. Puts it in. Takes it out. Leaves with the coin. Couldn't commit.`,
    (name) =>
        `"I remember when you could buy a HOUSE for this much." ${name} has never bought a house. Leaves.`,
    (name) =>
        `${name} asks if there's a return policy. ON PRICES. That's not how this works. Leaves.`,
    (name) =>
        `${name} checks behind the price labels for the REAL prices. These ARE the real prices. Leaves shocked.`,
    (name) =>
        `"I'm going to tell EVERYONE about these prices." ${name} tells zero people. Leaves.`,
    (name) =>
        `${name} tries to use a gift card. For a different store. For a store that no longer exists. Leaves.`,
    (name) =>
        `${name} squints at the prices through cupped hands like binoculars. Still too expensive from any distance. Leaves.`,
    (name) =>
        `"I've paid less for a MEAL," ${name} says. They eat cheap meals. But the point stands. Leaves.`,
    (name) =>
        `${name} asks if there's an employee discount. They don't work here. Leaves, unemployed by this machine.`,
    (name) =>
        `${name} holds their money up to the light. It's all real. There just isn't enough. Leaves.`,
    (name) =>
        `"The AUDACITY of these prices," ${name} gasps. The audacity remains. ${name} does not. Leaves.`,
    (name) =>
        `${name} asks the machine to reconsider its life choices. The machine is unmoved. ${name} leaves, moved.`,
    (name) =>
        `${name} looks at the prices, clutches their chest, and leaves. Dramatic? Yes. Wrong? No.`,
    (name) =>
        `"These prices just ruined my whole week," ${name} says. It's Monday. Leaves for the remaining 6 days.`,
    (name) =>
        `${name} contacts the Better Business Bureau on the spot. Gets an automated menu. Hangs up. Leaves.`,
    (name) =>
        `${name} converts the prices to various currencies. Too expensive in ALL of them. Impressive. Leaves.`,
    (name) =>
        `"I've been to airport vending machines and THIS is worse," ${name} says. The highest insult. Leaves.`,
    (name) =>
        `${name} asks the machine for a scholarship. The machine doesn't offer scholarships. Leaves unscholarshipped.`,
    (name) =>
        `${name} shows the price to their phone camera. "Evidence," they mutter. Leaves with their evidence.`,
    (name) =>
        `"My insurance should cover this level of financial trauma," ${name} says. It won't. Leaves.`,
    (name) =>
        `${name} stands motionless for 15 seconds processing the prices. Blue screen of financial death. Reboots. Leaves.`,
    (name) =>
        `"I'll just photosynthesize instead," ${name} says, standing in sunlight. Humans can't do that. Leaves hungry.`,
    (name) =>
        `${name} calls their ex to complain about the prices. Gets blocked. Leaves, blocked and hungry.`,
    (name) =>
        `${name} writes 'TOO EXPENSIVE' on the glass with their breath and finger. Fades quickly. Like their hope. Leaves.`,
    (name) =>
        `"Even the SNACKS look embarrassed by these prices," ${name} observes. They do not. Leaves.`,
    (name) =>
        `${name} does the math, then does the math again with a discount they invented. Still can't afford it. Leaves.`,
    (name) =>
        `${name} holds a small candlelight vigil for their wallet. Right there. In front of the machine. Then leaves.`,
    (name) =>
        `"These prices violate the Geneva Convention," ${name} claims. They don't. But ${name} feels violated. Leaves.`,
    (name) =>
        `${name} checks if the prices are per item or per machine. Per item. Devastating. Leaves.`,
    (name) =>
        `"I'll come back when I win the lottery," ${name} says. They don't play the lottery. Leaves.`,
    (name) =>
        `${name} tries to pay with a coupon they printed from 2019. Expired. Like their hope. Leaves.`,
    (name) =>
        `${name} asks the machine if it's having a sale soon. It is not. It never is. Leaves.`,
    (name) =>
        `"I've seen cheaper prices at the END OF THE WORLD," ${name} says. They haven't seen the end of the world. Leaves.`,
    (name) =>
        `${name} Googles 'is this vending machine a scam.' Inconclusive results. Leaves.`,
    (name) =>
        `${name} dramatically empties their pockets. Coins scatter. Not enough. Scoops them up. Leaves.`,
    (name) =>
        `"My BLOOD TYPE is cheaper than these snacks," ${name} claims. Blood is actually expensive. But they leave.`,
    (name) =>
        `${name} photographs each price individually for a 'price shaming' social media post. Leaves to post.`,
    (name) =>
        `${name} checks if the machine accepts barter. It does not. They had a pretty nice rock, too. Leaves.`,
    (name) =>
        `"These prices would make a billionaire flinch," ${name} says. They would not. But ${name} is flinching plenty. Leaves.`,
    (name) =>
        `${name} looks at the prices and immediately calls their therapist. It goes to voicemail. Leaves.`,
    (name) =>
        `"I'd rather eat my pride than pay THESE prices." ${name} can't eat pride. Leaves with intact pride and empty stomach.`,
    (name) =>
        `${name} writes a haiku about the prices: 'Too much for a snack / my wallet cries bitter tears / leaving hungry now.' Leaves.`,
    (name) =>
        `${name} asks if there's a smaller, cheaper machine nearby. There is not. Leaves to invent one.`,
    (name) =>
        `${name} tries to use charm to lower the prices. The machine is immune to charm. Leaves, charmless.`,
    (name) =>
        `"I could FLY somewhere cheaper," ${name} says. Gate's that way. Leaves toward it.`,
    (name) =>
        `${name} looks at the prices, looks at their shoes, and decides shoes are a better investment. Leaves, well-shod.`,
    (name) =>
        `${name} checks the prices in Morse code. Still too expensive. Even encoded. Leaves.`,
];

export type ServeEvent = {
    customerName: string;
    descriptor: string;
    mood: string;
    bought: SnackItemInstance | null;
    /** Which slot the bought item came from (for deferred visual removal). */
    slotIndex?: number;
    /** Whether this customer kicked the machine. */
    kicked: boolean;
    /** HP damage dealt (0 if no kick). */
    damage: number;
    /** Whether an item matching this customer's mood was available. */
    moodMatchAvailable: boolean;
    /** Whether skipped because everything was too expensive. */
    priceRejected: boolean;
    /** Whether the bought item was the featured item. */
    featuredBuy: boolean;
    /** Price drama: "close-call" if price was within 1¢ of their max, "bargain" if well under. */
    priceDrama?: "close-call" | "bargain";
};

/**
 * Simulate customers for the serve phase and produce events.
 * Does NOT mutate slots — sold slot indices are recorded in events
 * so the caller can remove items visually as narration plays.
 */

/**
 * Preview-only: returns just the mood string for each upcoming customer.
 * Used to show the customer queue during prep phase.
 */
export const previewCustomerMoods = (
    customerCount: number,
    roundEvent?: RoundEventDef | null,
): string[] => {
    const moodKeys = Object.keys(MOOD_LINES);
    const moodPool = [...moodKeys];
    if (roundEvent?.boostedMood && moodKeys.includes(roundEvent.boostedMood)) {
        for (let j = 0; j < 4; j++) moodPool.push(roundEvent.boostedMood);
    }
    return Array.from({ length: customerCount }, () => pick(moodPool));
};

export type SimulationResult = {
    events: ServeEvent[];
    /** Index in events where machine first went empty (null if never). */
    machineEmptyAtEvent: number | null;
    /** How many customers remain unserved after the empty point. */
    remainingCustomers: number;
};

export const simulateCustomers = (
    slots: MachineSlot[],
    customerCount: number,
    roundEvent?: RoundEventDef | null,
    round: number = 1,
): SimulationResult => {
    const events: ServeEvent[] = [];
    let machineEmptyAtEvent: number | null = null;
    // Track which slots are "claimed" so two customers don't buy the same item
    const claimed = new Set<number>();

    // Build mood pool — if event boosts a mood, add extra copies
    const moodKeys = Object.keys(MOOD_LINES);
    const moodPool = [...moodKeys];
    if (roundEvent?.boostedMood && moodKeys.includes(roundEvent.boostedMood)) {
        // Add 4 extra copies of the boosted mood for heavier weighting
        for (let j = 0; j < 4; j++) moodPool.push(roundEvent.boostedMood);
    }

    // Difficulty scaling: anger and sell chance shift with round
    const angerMult = (roundEvent?.angerMult ?? 1) * (1 + (round - 1) * 0.06);
    const baseSellChance = Math.max(0.35, 0.65 - (round - 1) * 0.015);

    for (let i = 0; i < customerCount; i++) {
        const name = pick(FIRST_NAMES);
        const descriptor = pick(DESCRIPTORS);
        const isWhale = Math.random() < WHALE_CHANCE;

        const availableIndices = slots
            .map((s, idx) => ({ s, idx }))
            .filter(({ s, idx }) => s.unlocked && s.item && !claimed.has(idx))
            .map(({ idx }) => idx);

        if (availableIndices.length === 0) {
            // Machine is empty — record the break point for mid-round restock
            if (machineEmptyAtEvent === null) {
                machineEmptyAtEvent = events.length;
                // Don't generate skip events for remaining customers —
                // they'll be served after restock (or skipped if no restock)
                break;
            }
            events.push({
                customerName: name,
                descriptor,
                mood: "none",
                bought: null,
                kicked: false,
                damage: 0,
                moodMatchAvailable: false,
                priceRejected: false,
                featuredBuy: false,
            });
            continue;
        }

        // Filter by price cap — customer ignores items they can't afford
        const affordableIndices = availableIndices.filter((idx) => {
            const item = slots[idx].item!;
            return item.price <= maxPriceForCustomer(item, isWhale, round);
        });

        const moodKey = pick(moodPool);
        const priceRejected = affordableIndices.length === 0;

        // Check if any affordable item matches this customer's mood
        const moodMatchAvailable = affordableIndices.some((idx) =>
            doesItemMatchMood(slots[idx].item!, moodKey),
        );

        // Compute anger from visible price markups, modified by event
        const anger = computeAngerScore(slots, claimed) * angerMult;

        // Event-based damage reduction
        const damageReduce = roundEvent?.damageReduction ?? 0;

        const kChance = kickChance(anger);
        const kicked = Math.random() < kChance;
        const rawDamage = kicked ? rollKickDamage(anger) : 0;
        const damage = Math.max(1, rawDamage - damageReduce);

        // Price-rejected customers never buy
        if (priceRejected) {
            events.push({
                customerName: name,
                descriptor,
                mood: moodKey,
                bought: null,
                kicked,
                damage,
                moodMatchAvailable: false,
                priceRejected: true,
                featuredBuy: false,
            });
            continue;
        }

        // Featured item gets priority: if affordable, 80% chance customer picks it
        const featuredIdx = affordableIndices.find(
            (idx) => slots[idx].featured,
        );
        const FEATURED_SELL_BOOST = 0.15;

        const effectiveSellChance = Math.min(
            0.95,
            (baseSellChance + (featuredIdx != null ? FEATURED_SELL_BOOST : 0)) *
                (roundEvent?.sellChanceMult ?? 1),
        );

        if (Math.random() < effectiveSellChance) {
            // Prefer featured item (80% chance if available),
            // then prefer mood-matching items (75% chance when available),
            // otherwise fall back to random affordable pick.
            const moodMatchIndices = affordableIndices.filter((idx) =>
                doesItemMatchMood(slots[idx].item!, moodKey),
            );
            const useFeatured = featuredIdx != null && Math.random() < 0.8;
            const useMoodMatch =
                !useFeatured &&
                moodMatchIndices.length > 0 &&
                Math.random() < 0.75;
            const slotIdx = useFeatured
                ? featuredIdx
                : useMoodMatch
                  ? pick(moodMatchIndices)
                  : pick(affordableIndices);
            const item = slots[slotIdx].item!;
            const isFeatured = slots[slotIdx].featured;

            // Apply event price multiplier
            const finalPrice = Math.round(
                item.price * (roundEvent?.priceMult ?? 1),
            );

            const soldItem = { ...item, price: finalPrice };

            // Determine price drama
            const customerMax = maxPriceForCustomer(item, isWhale, round);
            const priceGap = customerMax - finalPrice;
            const priceDrama: "close-call" | "bargain" | undefined =
                priceGap <= 1
                    ? "close-call"
                    : priceGap >= 4
                      ? "bargain"
                      : undefined;

            claimed.add(slotIdx);

            events.push({
                customerName: name,
                descriptor,
                mood: moodKey,
                bought: soldItem,
                slotIndex: slotIdx,
                kicked,
                damage,
                moodMatchAvailable,
                priceRejected: false,
                featuredBuy: isFeatured,
                priceDrama,
            });
        } else {
            events.push({
                customerName: name,
                descriptor,
                mood: moodKey,
                bought: null,
                kicked,
                damage,
                moodMatchAvailable,
                priceRejected: false,
                featuredBuy: false,
            });
        }
    }

    const remainingCustomers =
        machineEmptyAtEvent !== null ? customerCount - machineEmptyAtEvent : 0;

    return { events, machineEmptyAtEvent, remainingCustomers };
};

// ── Single-customer simulation (for lazy / incremental mode) ──

export type SingleCustomerResult = {
    event: ServeEvent;
    /** True if this customer bought something. */
    sold: boolean;
    /** True if the machine is now empty after this customer. */
    machineEmpty: boolean;
};

/**
 * Build round-scoped parameters for simulateOneCustomer.
 * Call once per round, then pass the result to each customer call.
 */
export type RoundSimContext = {
    moodPool: string[];
    angerMult: number;
    baseSellChance: number;
    roundEvent: RoundEventDef | null;
    round: number;
};

export const createRoundSimContext = (
    roundEvent: RoundEventDef | null,
    round: number,
): RoundSimContext => {
    const moodKeys = Object.keys(MOOD_LINES);
    const moodPool = [...moodKeys];
    if (roundEvent?.boostedMood && moodKeys.includes(roundEvent.boostedMood)) {
        for (let j = 0; j < 4; j++) moodPool.push(roundEvent.boostedMood);
    }
    const angerMult = (roundEvent?.angerMult ?? 1) * (1 + (round - 1) * 0.06);
    const baseSellChance = Math.max(0.35, 0.65 - (round - 1) * 0.015);
    return { moodPool, angerMult, baseSellChance, roundEvent, round };
};

/**
 * Simulate a single customer against the given slots.
 * `soldSlots` tracks indices already sold this round (simulates claimed set).
 * Does NOT mutate slots — caller is responsible for removing sold items.
 */
export const simulateOneCustomer = (
    slots: MachineSlot[],
    soldSlots: Set<number>,
    ctx: RoundSimContext,
): SingleCustomerResult => {
    const name = pick(FIRST_NAMES);
    const descriptor = pick(DESCRIPTORS);
    const isWhale = Math.random() < WHALE_CHANCE;

    const availableIndices = slots
        .map((s, idx) => ({ s, idx }))
        .filter(({ s, idx }) => s.unlocked && s.item && !soldSlots.has(idx))
        .map(({ idx }) => idx);

    if (availableIndices.length === 0) {
        return {
            event: {
                customerName: name,
                descriptor,
                mood: "none",
                bought: null,
                kicked: false,
                damage: 0,
                moodMatchAvailable: false,
                priceRejected: false,
                featuredBuy: false,
            },
            sold: false,
            machineEmpty: true,
        };
    }

    const affordableIndices = availableIndices.filter((idx) => {
        const item = slots[idx].item!;
        return item.price <= maxPriceForCustomer(item, isWhale, ctx.round);
    });

    const moodKey = pick(ctx.moodPool);
    const priceRejected = affordableIndices.length === 0;
    const moodMatchAvailable = affordableIndices.some((idx) =>
        doesItemMatchMood(slots[idx].item!, moodKey),
    );
    const anger = computeAngerScore(slots, soldSlots) * ctx.angerMult;
    const damageReduce = ctx.roundEvent?.damageReduction ?? 0;
    const kChance = kickChance(anger);
    const kicked = Math.random() < kChance;
    const rawDamage = kicked ? rollKickDamage(anger) : 0;
    const damage = Math.max(1, rawDamage - damageReduce);

    if (priceRejected) {
        return {
            event: {
                customerName: name,
                descriptor,
                mood: moodKey,
                bought: null,
                kicked,
                damage,
                moodMatchAvailable: false,
                priceRejected: true,
                featuredBuy: false,
            },
            sold: false,
            machineEmpty: false,
        };
    }

    const featuredIdx = affordableIndices.find((idx) => slots[idx].featured);
    const FEATURED_SELL_BOOST = 0.15;
    const effectiveSellChance = Math.min(
        0.95,
        (ctx.baseSellChance + (featuredIdx != null ? FEATURED_SELL_BOOST : 0)) *
            (ctx.roundEvent?.sellChanceMult ?? 1),
    );

    if (Math.random() < effectiveSellChance) {
        const moodMatchIndices = affordableIndices.filter((idx) =>
            doesItemMatchMood(slots[idx].item!, moodKey),
        );
        const useFeatured = featuredIdx != null && Math.random() < 0.8;
        const useMoodMatch =
            !useFeatured && moodMatchIndices.length > 0 && Math.random() < 0.75;
        const slotIdx = useFeatured
            ? featuredIdx
            : useMoodMatch
              ? pick(moodMatchIndices)
              : pick(affordableIndices);
        const item = slots[slotIdx].item!;
        const isFeatured = slots[slotIdx].featured;
        const finalPrice = Math.round(
            item.price * (ctx.roundEvent?.priceMult ?? 1),
        );
        const soldItem = { ...item, price: finalPrice };
        const customerMax = maxPriceForCustomer(item, isWhale, ctx.round);
        const priceGap = customerMax - finalPrice;
        const priceDrama: "close-call" | "bargain" | undefined =
            priceGap <= 1
                ? "close-call"
                : priceGap >= 4
                  ? "bargain"
                  : undefined;

        soldSlots.add(slotIdx);

        // Check if machine is now empty after this sale
        const remainingItems = slots.filter(
            (s, idx) => s.unlocked && s.item && !soldSlots.has(idx),
        ).length;

        return {
            event: {
                customerName: name,
                descriptor,
                mood: moodKey,
                bought: soldItem,
                slotIndex: slotIdx,
                kicked,
                damage,
                moodMatchAvailable,
                priceRejected: false,
                featuredBuy: isFeatured,
                priceDrama,
            },
            sold: true,
            machineEmpty: remainingItems === 0,
        };
    }

    return {
        event: {
            customerName: name,
            descriptor,
            mood: moodKey,
            bought: null,
            kicked,
            damage,
            moodMatchAvailable,
            priceRejected: false,
            featuredBuy: false,
        },
        sold: false,
        machineEmpty: false,
    };
};

/**
 * A deferred slot removal: when the typewriter reaches lineIndex,
 * clear the item in the given slot.
 */
export type SlotRemoval = { lineIndex: number; slotIndex: number };
export type HpDamage = { lineIndex: number; damage: number };
export type CoinGain = {
    lineIndex: number;
    amount: number;
    slotIndex?: number;
};
/** Phoenix effect: restock the item (without its effect) after it's removed. */
export type SlotRestock = {
    lineIndex: number;
    slotIndex: number;
    item: SnackItemInstance;
};

export type NarrationResult = {
    lines: TypewriterLine[];
    removals: SlotRemoval[];
    hpDamages: HpDamage[];
    coinGains: CoinGain[];
    restocks: SlotRestock[];
};

// ── Price drama narration pools ──────────────────────────

type PriceDramaLine = (name: string, price: number) => string;

const CLOSE_CALL_LINES: PriceDramaLine[] = [
    (name, price) =>
        `${name} hesitates... stares at the ${price}¢ price tag... and BUYS IT!`,
    (name, _price) =>
        `${name} winces at the price but reaches for their wallet anyway.`,
    (name, price) =>
        `"${price}¢?!" ${name} mutters, but they're already paying.`,
    (name, _price) =>
        `${name} counts their change carefully... just barely enough!`,
    (name, _price) =>
        `A bead of sweat rolls down ${name}'s face. They tap their card.`,
    (name, price) =>
        `${name} almost walks away... but the ${price}¢ is juuuust within budget.`,
];

const BARGAIN_LINES: PriceDramaLine[] = [
    (name, _price) => `${name} grins — what a steal!`,
    (name, _price) => `"That's IT?" ${name} can't believe the price.`,
    (name, _price) => `${name} practically lunges for the deal.`,
    (name, price) => `${name} thinks ${price}¢ is a straight-up bargain.`,
    (name, _price) =>
        `${name} buys without hesitation — they'd have paid double.`,
];

/**
 * Convert serve events into typewriter lines for narration,
 * plus a list of deferred slot removals keyed by line index.
 */
export const eventsToNarration = (events: ServeEvent[]): NarrationResult => {
    const lines: TypewriterLine[] = [];
    const removals: SlotRemoval[] = [];
    const hpDamages: HpDamage[] = [];
    const coinGains: CoinGain[] = [];
    const restocks: SlotRestock[] = [];

    for (const evt of events) {
        // Arrival
        lines.push({
            text: `${evt.customerName} approaches — ${evt.descriptor}.`,
            charDelay: 25,
            lingerMs: 600,
            className: "vm-narration__arrival",
        });

        // Mood
        const moodPool = MOOD_LINES[evt.mood] ?? MOOD_LINES.none;
        lines.push({
            text: `${evt.customerName} ${pick(moodPool)}`,
            charDelay: 25,
            lingerMs: 500,
            className: "vm-narration__mood",
        });

        // Outcome
        if (evt.bought) {
            const matched = doesItemMatchMood(evt.bought, evt.mood);
            const moodPool2 = matched
                ? (MATCH_BY_MOOD[evt.mood] ?? MATCH_GENERIC)
                : (SETTLE_BY_MOOD[evt.mood] ?? SETTLE_GENERIC);
            const reaction = pick(moodPool2)(evt.customerName, evt.bought.name);
            // Record removal to fire when this buy line appears
            if (evt.slotIndex != null) {
                removals.push({
                    lineIndex: lines.length,
                    slotIndex: evt.slotIndex,
                });
            }
            lines.push({
                text: reaction,
                charDelay: 20,
                lingerMs: 700,
                className: matched
                    ? "vm-narration__buy"
                    : "vm-narration__settle",
            });
            coinGains.push({
                lineIndex: lines.length,
                amount: evt.bought.price,
                slotIndex: evt.slotIndex,
            });
            lines.push({
                text: `+${evt.bought.price}¢`,
                charDelay: 40,
                lingerMs: 400,
                className: "vm-narration__profit",
            });
            if (evt.featuredBuy) {
                lines.push({
                    text: `* Featured item sold! Customers love the spotlight.`,
                    charDelay: 18,
                    lingerMs: 500,
                    className: "vm-narration__featured",
                });
            }
            // Price drama narration
            if (evt.priceDrama === "close-call") {
                const dramaLine = pick(CLOSE_CALL_LINES)(
                    evt.customerName,
                    evt.bought.price,
                );
                lines.push({
                    text: dramaLine,
                    charDelay: 18,
                    lingerMs: 500,
                    className: "vm-narration__price-drama",
                });
            } else if (evt.priceDrama === "bargain") {
                const bargainLine = pick(BARGAIN_LINES)(
                    evt.customerName,
                    evt.bought.price,
                );
                lines.push({
                    text: bargainLine,
                    charDelay: 18,
                    lingerMs: 400,
                    className: "vm-narration__price-bargain",
                });
            }
        } else if (evt.priceRejected) {
            // Customer saw items but everything was too expensive
            const reaction = pick(TOO_EXPENSIVE_REACTIONS)(evt.customerName);
            lines.push({
                text: reaction,
                charDelay: 22,
                lingerMs: 700,
                className: "vm-narration__skip",
            });
        } else {
            // Only use mood-specific skip text when no matching items exist;
            // otherwise the customer would wrongly complain about missing items.
            const moodSkipPool = SKIP_BY_MOOD[evt.mood];
            const useMoodSkip =
                !evt.moodMatchAvailable &&
                moodSkipPool &&
                moodSkipPool.length > 0 &&
                evt.mood !== "none";
            const reaction = useMoodSkip
                ? pick(moodSkipPool)(evt.customerName)
                : pick(SKIP_GENERIC)(evt.customerName);
            lines.push({
                text: reaction,
                charDelay: 25,
                lingerMs: 700,
                className: "vm-narration__skip",
            });
        }

        // Kick (can happen after buy OR skip)
        if (evt.kicked) {
            hpDamages.push({ lineIndex: lines.length, damage: evt.damage });
            lines.push({
                text: pick(KICK_REACTIONS)(evt.customerName, evt.damage),
                charDelay: 18,
                lingerMs: 800,
                className: "vm-narration__kick",
            });
        }

        // Separator
        lines.push({ text: "", charDelay: 0, lingerMs: 300 });
    }

    return { lines, removals, hpDamages, coinGains, restocks };
};
