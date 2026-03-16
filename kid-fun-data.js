// Kid Fun Data — Jokes and Mad Libs for ages 4-7
// This file is reference content for Codex to embed in index.html during Phase 3b.
// Do NOT load this as a separate script — copy the arrays into the Phase 3b IIFE.

// ============================================================
// JOKES — 100 kid-appropriate jokes (setup + punchline)
// ============================================================

var KID_JOKES = [
  // Animals
  { setup: "Why did the teddy bear say no to dessert?", punchline: "Because she was already stuffed!" },
  { setup: "What do you call a sleeping dinosaur?", punchline: "A dino-snore!" },
  { setup: "What do you call a fish without eyes?", punchline: "A fsh!" },
  { setup: "Why do cows wear bells?", punchline: "Because their horns don't work!" },
  { setup: "What do you call a bear with no teeth?", punchline: "A gummy bear!" },
  { setup: "What do you call an alligator in a vest?", punchline: "An investi-gator!" },
  { setup: "Why don't elephants use computers?", punchline: "Because they're afraid of the mouse!" },
  { setup: "What do cats eat for breakfast?", punchline: "Mice Krispies!" },
  { setup: "What do you call a dog that does magic?", punchline: "A Labra-cadabra-dor!" },
  { setup: "Why do ducks have feathers?", punchline: "To cover their butt quacks!" },
  { setup: "What do you call a lazy kangaroo?", punchline: "A pouch potato!" },
  { setup: "Why did the spider go to the computer?", punchline: "To check his web-site!" },
  { setup: "What animal is always at a baseball game?", punchline: "A bat!" },
  { setup: "What do you call a pig that does karate?", punchline: "A pork chop!" },
  { setup: "Why do fish live in salt water?", punchline: "Because pepper makes them sneeze!" },
  { setup: "What do you call a snake wearing a hard hat?", punchline: "A boa constructor!" },
  { setup: "What do frogs do with paper?", punchline: "Rip-it! Rip-it!" },
  { setup: "What is a cat's favorite color?", punchline: "Purr-ple!" },
  { setup: "Why are cats good at video games?", punchline: "Because they have nine lives!" },
  { setup: "What do you call a cow with no legs?", punchline: "Ground beef!" },

  // Food
  { setup: "Why did the banana go to the doctor?", punchline: "Because it wasn't peeling well!" },
  { setup: "What did the baby corn say to the mama corn?", punchline: "Where's pop corn?" },
  { setup: "Why did the cookie go to the hospital?", punchline: "Because it felt crummy!" },
  { setup: "What do you call a fake noodle?", punchline: "An impasta!" },
  { setup: "What did the lettuce say to the celery?", punchline: "Quit stalking me!" },
  { setup: "Why did the tomato turn red?", punchline: "Because it saw the salad dressing!" },
  { setup: "What does a lemon say when it answers the phone?", punchline: "Yellow!" },
  { setup: "What do you call cheese that isn't yours?", punchline: "Nacho cheese!" },
  { setup: "Why did the egg hide?", punchline: "Because it was a little chicken!" },
  { setup: "What kind of key opens a banana?", punchline: "A mon-key!" },

  // School & everyday
  { setup: "Why did the kid bring a ladder to school?", punchline: "Because she wanted to go to high school!" },
  { setup: "What did the paper say to the pencil?", punchline: "Write on!" },
  { setup: "Why did the math book look so sad?", punchline: "Because it had too many problems!" },
  { setup: "What did one wall say to the other?", punchline: "I'll meet you at the corner!" },
  { setup: "Why is six afraid of seven?", punchline: "Because seven eight nine!" },
  { setup: "What has hands but can't clap?", punchline: "A clock!" },
  { setup: "What has ears but cannot hear?", punchline: "A cornfield!" },
  { setup: "Why can't you give Elsa a balloon?", punchline: "Because she'll let it go!" },
  { setup: "What did the stamp say to the envelope?", punchline: "Stick with me and we'll go places!" },
  { setup: "Why did the picture go to jail?", punchline: "Because it was framed!" },

  // Knock-knock style
  { setup: "Knock knock! Who's there? Boo.", punchline: "Boo who? Don't cry, it's just a joke!" },
  { setup: "Knock knock! Who's there? Lettuce.", punchline: "Lettuce who? Lettuce in, it's cold out here!" },
  { setup: "Knock knock! Who's there? Cow says.", punchline: "Cow says who? No silly, cow says MOOO!" },
  { setup: "Knock knock! Who's there? Interrupting cow.", punchline: "Interrupting cow wh— MOOO!" },
  { setup: "Knock knock! Who's there? Banana. Banana who? Knock knock! Who's there? Orange.", punchline: "Orange who? Orange you glad I didn't say banana?" },
  { setup: "Knock knock! Who's there? Tank.", punchline: "Tank who? You're welcome!" },
  { setup: "Knock knock! Who's there? Atch.", punchline: "Atch who? Bless you!" },
  { setup: "Knock knock! Who's there? Wooden shoe.", punchline: "Wooden shoe who? Wooden shoe like to hear another joke?" },
  { setup: "Knock knock! Who's there? Ice cream.", punchline: "Ice cream who? Ice cream every time I see a spider!" },
  { setup: "Knock knock! Who's there? Nobel.", punchline: "Nobel who? Nobel, that's why I knocked!" },

  // Space & nature
  { setup: "How does the moon cut his hair?", punchline: "Eclipse it!" },
  { setup: "Why did the sun go to school?", punchline: "To get a little brighter!" },
  { setup: "What kind of tree fits in your hand?", punchline: "A palm tree!" },
  { setup: "What falls in winter but never gets hurt?", punchline: "Snow!" },
  { setup: "What did the ocean say to the beach?", punchline: "Nothing, it just waved!" },
  { setup: "Why do mushrooms get invited to all the parties?", punchline: "Because they're such fungi!" },
  { setup: "What did the flower say to the bike?", punchline: "Petal!" },
  { setup: "What kind of water can't freeze?", punchline: "Hot water!" },
  { setup: "Why is grass so dangerous?", punchline: "Because it's full of blades!" },
  { setup: "What did one volcano say to the other?", punchline: "I lava you!" },

  // Silly
  { setup: "What do you call a boomerang that doesn't come back?", punchline: "A stick!" },
  { setup: "What did one toilet say to the other?", punchline: "You look a bit flushed!" },
  { setup: "Why did the kid cross the playground?", punchline: "To get to the other slide!" },
  { setup: "What do you call a funny mountain?", punchline: "Hill-arious!" },
  { setup: "What do you call a train that sneezes?", punchline: "Achoo-choo train!" },
  { setup: "What do you call a dinosaur that crashes their car?", punchline: "Tyrannosaurus Wrecks!" },
  { setup: "Why can't your nose be 12 inches long?", punchline: "Because then it would be a foot!" },
  { setup: "What did the left eye say to the right eye?", punchline: "Between you and me, something smells!" },
  { setup: "How do you make a tissue dance?", punchline: "Put a little boogie in it!" },
  { setup: "What do you call a ghost's true love?", punchline: "A ghoul-friend!" },

  // More animals
  { setup: "What do you get when you cross a vampire and a snowman?", punchline: "Frostbite!" },
  { setup: "Why do bees have sticky hair?", punchline: "Because they use honeycombs!" },
  { setup: "What do you call a fly without wings?", punchline: "A walk!" },
  { setup: "What do you give a sick bird?", punchline: "Tweetment!" },
  { setup: "Why did the turtle cross the road?", punchline: "To get to the shell station!" },
  { setup: "What do you call two birds in love?", punchline: "Tweethearts!" },
  { setup: "What do you call a monkey at the North Pole?", punchline: "Lost!" },
  { setup: "Why are frogs so happy?", punchline: "They eat whatever bugs them!" },
  { setup: "What sound do porcupines make when they kiss?", punchline: "Ouch!" },
  { setup: "What do you call a rabbit with fleas?", punchline: "Bugs Bunny!" },

  // More silly
  { setup: "What has four wheels and flies?", punchline: "A garbage truck!" },
  { setup: "What gets wetter the more it dries?", punchline: "A towel!" },
  { setup: "What invention lets you look right through a wall?", punchline: "A window!" },
  { setup: "Why did the golfer bring two pairs of pants?", punchline: "In case he got a hole in one!" },
  { setup: "What do you call a sleeping bull?", punchline: "A bulldozer!" },
  { setup: "Why did the scarecrow win an award?", punchline: "Because he was outstanding in his field!" },
  { setup: "What room can nobody enter?", punchline: "A mushroom!" },
  { setup: "What can you catch but not throw?", punchline: "A cold!" },
  { setup: "Why did the bicycle fall over?", punchline: "Because it was two-tired!" },
  { setup: "What did the big flower say to the little flower?", punchline: "Hey there, bud!" },

  // Bonus round
  { setup: "What do dentists call their x-rays?", punchline: "Tooth pics!" },
  { setup: "Why couldn't the pony sing?", punchline: "Because she was a little horse!" },
  { setup: "What do you call a dog on the beach in summer?", punchline: "A hot dog!" },
  { setup: "What did the dalmatian say after lunch?", punchline: "That hit the spot!" },
  { setup: "Why do birds fly south in winter?", punchline: "Because it's too far to walk!" },
  { setup: "What time do ducks wake up?", punchline: "At the quack of dawn!" },
  { setup: "What did one hat say to the other?", punchline: "Stay here, I'm going on ahead!" },
  { setup: "What do elves learn in school?", punchline: "The elf-abet!" },
  { setup: "Why was the broom late?", punchline: "It over-swept!" },
  { setup: "What did the zero say to the eight?", punchline: "Nice belt!" },

  // === 150 MORE JOKES (total: 250) ===

  // Animals round 2
  { setup: "What do you call a cold dog?", punchline: "A chili dog!" },
  { setup: "Why do seagulls fly over the sea?", punchline: "Because if they flew over the bay, they'd be bagels!" },
  { setup: "What do you call a dinosaur that never gives up?", punchline: "A try-try-try-ceratops!" },
  { setup: "What do you call a cow in an earthquake?", punchline: "A milkshake!" },
  { setup: "What do you call a pony with a sore throat?", punchline: "A little hoarse!" },
  { setup: "Why are teddy bears never hungry?", punchline: "Because they're always stuffed!" },
  { setup: "What do you call a snake that's 3 feet long?", punchline: "A yard snake!" },
  { setup: "What do you call a dinosaur with a big vocabulary?", punchline: "A thesaurus!" },
  { setup: "What did the duck say when it bought lipstick?", punchline: "Put it on my bill!" },
  { setup: "What do you call a fish that needs help with its singing?", punchline: "Autotuna!" },
  { setup: "Why do hummingbirds hum?", punchline: "Because they forgot the words!" },
  { setup: "What is a shark's favorite sandwich?", punchline: "Peanut butter and jellyfish!" },
  { setup: "What do you call a sleeping T-Rex?", punchline: "A dino-snore!" },
  { setup: "Why did the cat sit on the computer?", punchline: "To keep an eye on the mouse!" },
  { setup: "What do you call a chicken staring at lettuce?", punchline: "Chicken sees a salad!" },
  { setup: "Why do pandas like old movies?", punchline: "Because they're in black and white!" },
  { setup: "What do you call a gorilla with bananas in its ears?", punchline: "Anything you want — it can't hear you!" },
  { setup: "What do you get if you cross a cat with a dark horse?", punchline: "Kitty Perry!" },
  { setup: "How do you make an octopus laugh?", punchline: "With ten-tickles!" },
  { setup: "What did the horse say when it fell down?", punchline: "Help! I've fallen and I can't giddyup!" },

  // Food round 2
  { setup: "What do you call a sad strawberry?", punchline: "A blueberry!" },
  { setup: "Why did the grape stop in the middle of the road?", punchline: "Because it ran out of juice!" },
  { setup: "What's a pirate's favorite letter?", punchline: "You'd think it's R, but it's really the C!" },
  { setup: "What did the plate say to the other plate?", punchline: "Dinner's on me!" },
  { setup: "What did the cupcake say to the frosting?", punchline: "I'd be muffin without you!" },
  { setup: "What do you call a sleeping pizza?", punchline: "A piZZZZa!" },
  { setup: "What vegetable is the coolest?", punchline: "A rad-ish!" },
  { setup: "What is a computer's favorite snack?", punchline: "Microchips!" },
  { setup: "Why did the orange lose the race?", punchline: "It ran out of juice!" },
  { setup: "What did the mayo say when someone opened the fridge?", punchline: "Close the door, I'm dressing!" },

  // School round 2
  { setup: "Why did the music teacher need a ladder?", punchline: "To reach the high notes!" },
  { setup: "What did the calculator say to the math student?", punchline: "You can count on me!" },
  { setup: "Why did the student eat his homework?", punchline: "Because the teacher said it was a piece of cake!" },
  { setup: "What do you do with a blue crayon?", punchline: "Try to cheer it up!" },
  { setup: "What's a teacher's favorite nation?", punchline: "Expla-nation!" },
  { setup: "Why did the nose not want to go to school?", punchline: "It was tired of being picked on!" },
  { setup: "What flies around school at night?", punchline: "The alpha-BAT!" },
  { setup: "What do librarians take with them when they go fishing?", punchline: "Bookworms!" },
  { setup: "What's the king of all school supplies?", punchline: "The ruler!" },
  { setup: "Why was the geometry book so adorable?", punchline: "Because it had acute angles!" },

  // Silly round 2
  { setup: "What do you call a shoe made of a banana?", punchline: "A slipper!" },
  { setup: "What goes up but never comes down?", punchline: "Your age!" },
  { setup: "What has a bottom at the top?", punchline: "Your legs!" },
  { setup: "Why do bananas have to wear sunscreen?", punchline: "Because they peel!" },
  { setup: "Why was the belt arrested?", punchline: "For holding up pants!" },
  { setup: "What did the blanket say to the bed?", punchline: "Don't worry, I've got you covered!" },
  { setup: "Why can't a leopard play hide and seek?", punchline: "Because it's always spotted!" },
  { setup: "What do clouds wear under their clothes?", punchline: "Thunderwear!" },
  { setup: "What did the traffic light say to the car?", punchline: "Don't look! I'm about to change!" },
  { setup: "What side of a turkey has the most feathers?", punchline: "The outside!" },
  { setup: "Where do pencils go on vacation?", punchline: "Pencil-vania!" },
  { setup: "Why did the teddy bear skip dessert?", punchline: "She was already stuffed!" },
  { setup: "What did one ear say to the other?", punchline: "Between us, something smells!" },
  { setup: "What do you call a train that eats toffee?", punchline: "A chew-chew train!" },
  { setup: "What building in your town has the most stories?", punchline: "The library!" },

  // Knock-knock round 2
  { setup: "Knock knock! Who's there? Canoe.", punchline: "Canoe who? Canoe help me with my homework?" },
  { setup: "Knock knock! Who's there? Olive.", punchline: "Olive who? Olive you and I don't care who knows!" },
  { setup: "Knock knock! Who's there? Harry.", punchline: "Harry who? Harry up and open the door!" },
  { setup: "Knock knock! Who's there? Beets.", punchline: "Beets who? Beets me, I forgot the joke!" },
  { setup: "Knock knock! Who's there? Donut.", punchline: "Donut who? Donut ask, it's a secret!" },
  { setup: "Knock knock! Who's there? Spell.", punchline: "Spell who? W-H-O!" },
  { setup: "Knock knock! Who's there? Butter.", punchline: "Butter who? Butter let me in or I'll huff and puff!" },
  { setup: "Knock knock! Who's there? Ketchup.", punchline: "Ketchup who? Ketchup with me and I'll tell you!" },
  { setup: "Knock knock! Who's there? Dishes.", punchline: "Dishes who? Dishes the police, open up!" },
  { setup: "Knock knock! Who's there? Needle.", punchline: "Needle who? Needle little help opening this door!" },
  { setup: "Knock knock! Who's there? Owls.", punchline: "Owls who? That's right, owls hoo!" },
  { setup: "Knock knock! Who's there? Snow.", punchline: "Snow who? Snow use, I forgot my key again!" },
  { setup: "Knock knock! Who's there? Annie.", punchline: "Annie who? Annie body home?" },
  { setup: "Knock knock! Who's there? Cows go.", punchline: "Cows go who? No silly, cows go MOO!" },
  { setup: "Knock knock! Who's there? Justin.", punchline: "Justin who? Justin time for dinner!" },

  // Nature & space round 2
  { setup: "What did one tornado say to the other?", punchline: "Let's twist again!" },
  { setup: "How do trees get on the internet?", punchline: "They log in!" },
  { setup: "What do you call a snowman in the summer?", punchline: "A puddle!" },
  { setup: "What's the ocean's favorite lullaby?", punchline: "Roe, roe, roe your boat!" },
  { setup: "Why did the leaf go to the doctor?", punchline: "It was feeling green!" },
  { setup: "What did the little corn say to the big corn?", punchline: "Where's popcorn?" },
  { setup: "What did the ground say to the earthquake?", punchline: "You crack me up!" },
  { setup: "How does a scientist freshen their breath?", punchline: "With experi-mints!" },
  { setup: "Why is the ocean so friendly?", punchline: "It waves!" },
  { setup: "What do planets like to read?", punchline: "Comet books!" },
  { setup: "Where does a snowman keep its money?", punchline: "In a snow bank!" },
  { setup: "What's the wind's favorite chat-up line?", punchline: "I'm a big fan of yours!" },
  { setup: "Why did the star get a time-out?", punchline: "Because it was being too twinkly at bedtime!" },
  { setup: "What season is it when you bounce on a trampoline?", punchline: "Spring!" },
  { setup: "What do clouds do when they get rich?", punchline: "They make it rain!" },

  // More animals
  { setup: "What do you call a dinosaur that loves to sleep?", punchline: "A stega-snore-us!" },
  { setup: "What do you call a fly with no wings?", punchline: "A walk!" },
  { setup: "Why do giraffes have such long necks?", punchline: "Because their feet smell!" },
  { setup: "What's a cat's favorite dessert?", punchline: "Mice cream!" },
  { setup: "What did the mama buffalo say when her boy left for school?", punchline: "Bison!" },
  { setup: "Why don't crabs ever share?", punchline: "Because they're shellfish!" },
  { setup: "What do you get when you cross a centipede with a parrot?", punchline: "A walkie-talkie!" },
  { setup: "What's a frog's favorite game?", punchline: "Leapfrog!" },
  { setup: "What do ducks watch on TV?", punchline: "Duckumentaries!" },
  { setup: "What animal can you always find at a baseball game?", punchline: "A bat!" },
  { setup: "Why did the chicken join a band?", punchline: "Because it had the drumsticks!" },
  { setup: "What do you call a fish that practices medicine?", punchline: "A sturgeon!" },
  { setup: "What did the snail say when it was riding on the turtle's back?", punchline: "Wheee!" },
  { setup: "Why are fish so smart?", punchline: "Because they live in schools!" },
  { setup: "What do you call a cow that eats your grass?", punchline: "A lawn moo-er!" },

  // Body & silly round 3
  { setup: "What has a head and a tail but no body?", punchline: "A coin!" },
  { setup: "What has teeth but can't bite?", punchline: "A comb!" },
  { setup: "Why did the man run around his bed?", punchline: "To catch up on his sleep!" },
  { setup: "What has one head, one foot, and four legs?", punchline: "A bed!" },
  { setup: "What can you hear but not touch or see?", punchline: "Your voice!" },
  { setup: "What has lots of eyes but can't see?", punchline: "A potato!" },
  { setup: "Where do you find a dog with no legs?", punchline: "Right where you left him!" },
  { setup: "What did the right eye say to the left eye?", punchline: "Between us, something smells!" },
  { setup: "Why did the boy throw his clock out the window?", punchline: "Because he wanted to see time fly!" },
  { setup: "What do you call a person with no body and no nose?", punchline: "Nobody knows!" },

  // More food
  { setup: "What's a ghost's favorite fruit?", punchline: "A BOO-berry!" },
  { setup: "Why don't eggs tell jokes?", punchline: "They'd crack each other up!" },
  { setup: "What do you call two bananas?", punchline: "A pair of slippers!" },
  { setup: "What's brown and sticky?", punchline: "A stick!" },
  { setup: "Why did the melon jump into the lake?", punchline: "Because it wanted to be a watermelon!" },
  { setup: "What do you call a peanut in a spacesuit?", punchline: "An astro-nut!" },
  { setup: "What did the hot dog say when it won the race?", punchline: "I'm the wiener!" },
  { setup: "What do you call a grumpy cow?", punchline: "Moody!" },
  { setup: "What's a vampire's favorite fruit?", punchline: "A neck-tarine!" },
  { setup: "What do you call a fake spaghetti?", punchline: "An im-pasta!" },

  // More silly
  { setup: "What kind of button won't unbutton?", punchline: "A belly button!" },
  { setup: "What do you call a fairy who hasn't taken a bath?", punchline: "Stinkerbell!" },
  { setup: "Why don't skeletons fight each other?", punchline: "They don't have the guts!" },
  { setup: "What is a robot's favorite snack?", punchline: "Computer chips!" },
  { setup: "What do you call a magic dog?", punchline: "A Labra-cadabra-dor!" },
  { setup: "What goes tick-tock, woof-woof?", punchline: "A watchdog!" },
  { setup: "What did the snowman say to the other snowman?", punchline: "Do you smell carrots?" },
  { setup: "How do you throw a space party?", punchline: "You planet!" },
  { setup: "What do you call a duck that gets good grades?", punchline: "A wise quacker!" },
  { setup: "Where do baby cats learn to swim?", punchline: "The kitty pool!" },
  { setup: "What do you call a dinosaur ghost?", punchline: "A scare-odactyl!" },
  { setup: "What do witches put on their bagels?", punchline: "Scream cheese!" },
  { setup: "What's a balloon's least favorite kind of music?", punchline: "Pop!" },
  { setup: "Why did the banana go to the hospital?", punchline: "He was peeling really bad!" },
  { setup: "What do you give a sick lemon?", punchline: "Lemon-aid!" }
];


// ============================================================
// MAD LIBS — 50 kid-friendly templates (ages 4-7)
// ============================================================
//
// Blank types used:
//   noun        — a person, place, or thing (like "dog" or "shoe")
//   adjective   — a describing word (like "silly" or "sparkly")
//   verb        — an action word (like "jump" or "dance")
//   verb_past   — a past-tense action (like "jumped" or "danced")
//   animal      — any animal (like "frog" or "unicorn")
//   color       — a color (like "red" or "purple")
//   number      — a number (like "3" or "100")
//   food        — something you eat (like "pizza" or "bananas")
//   name        — a person's name
//   place       — a place (like "the park" or "school")
//   body_part   — a body part (like "elbow" or "nose")
//   sound       — a sound (like "BOOM" or "squish")
//   clothing    — something you wear (like "hat" or "boots")
//
// For Alex (7): Show the part-of-speech label + explanation
// For Louisa (4): Show just the simple category + example hint

var KID_MADLIBS = [
  {
    title: "The Silly Zoo Trip",
    blanks: [
      { label: "adjective", hint: "silly, sparkly, giant" },
      { label: "animal", hint: "frog, elephant, unicorn" },
      { label: "food", hint: "pizza, bananas, ice cream" },
      { label: "verb_past", hint: "jumped, danced, flew" },
      { label: "color", hint: "red, blue, purple" },
      { label: "number", hint: "3, 100, 7" },
      { label: "sound", hint: "BOOM, squish, ding" },
      { label: "body_part", hint: "elbow, nose, toes" }
    ],
    story: "We went to the {0} zoo and saw a {1} eating {2}. It {3} over the fence and landed in a pool of {4} paint. Then {5} more animals came out and started making {6} sounds with their {7}. Best zoo trip ever!"
  },
  {
    title: "My Pet Dragon",
    blanks: [
      { label: "name", hint: "a funny name" },
      { label: "color", hint: "red, blue, purple" },
      { label: "food", hint: "pizza, bananas, ice cream" },
      { label: "adjective", hint: "tiny, enormous, fuzzy" },
      { label: "verb", hint: "dance, fly, sneeze" },
      { label: "noun", hint: "a thing, like shoe or tree" },
      { label: "sound", hint: "ROAR, whoosh, pop" }
    ],
    story: "I found a baby dragon named {0}. It was {1} with {2}-scented breath. It was really {3} and loved to {4} on top of our {5}. Every time it hiccupped it went {6}!"
  },
  {
    title: "The Magic School Bus Ride",
    blanks: [
      { label: "adjective", hint: "bumpy, magical, stinky" },
      { label: "place", hint: "the moon, a jungle, school" },
      { label: "animal", hint: "monkey, whale, penguin" },
      { label: "food", hint: "tacos, cake, spaghetti" },
      { label: "verb_past", hint: "zoomed, bounced, wiggled" },
      { label: "color", hint: "green, orange, pink" },
      { label: "number", hint: "5, 42, 1000" }
    ],
    story: "Our school bus turned {0} and drove all the way to {1}. We met a talking {2} who gave us {3} for lunch. The bus {4} through a {5} rainbow and we got back to school {6} hours late!"
  },
  {
    title: "Superhero Morning",
    blanks: [
      { label: "adjective", hint: "super, invisible, slimy" },
      { label: "clothing", hint: "cape, boots, hat" },
      { label: "verb", hint: "fly, zoom, cartwheel" },
      { label: "food", hint: "waffles, cookies, cheese" },
      { label: "animal", hint: "cat, dragon, hamster" },
      { label: "noun", hint: "a thing, like toaster or shoe" },
      { label: "sound", hint: "WHOOSH, kaboom, zap" }
    ],
    story: "I woke up feeling {0}! I put on my special {1} and started to {2} around the kitchen. Mom made {3} for breakfast but a {4} stole them off the {5}. I yelled {6} and saved the day!"
  },
  {
    title: "The Underwater Birthday Party",
    blanks: [
      { label: "name", hint: "a friend's name" },
      { label: "number", hint: "5, 7, 100" },
      { label: "animal", hint: "octopus, shark, seahorse" },
      { label: "food", hint: "cake, jello, seaweed" },
      { label: "adjective", hint: "sparkly, squishy, gigantic" },
      { label: "verb_past", hint: "swam, splashed, giggled" },
      { label: "color", hint: "blue, gold, silver" }
    ],
    story: "We threw a birthday party for {0} who was turning {1}. A friendly {2} brought a {3} cake. Everything was {4} and everyone {5} in the {6} water. Best party under the sea!"
  },
  {
    title: "The Dinosaur at the Grocery Store",
    blanks: [
      { label: "adjective", hint: "huge, tiny, grumpy" },
      { label: "food", hint: "broccoli, cookies, pickles" },
      { label: "number", hint: "12, 50, 3" },
      { label: "verb_past", hint: "stomped, ate, knocked over" },
      { label: "noun", hint: "a thing, like cart or shelf" },
      { label: "sound", hint: "CRASH, munch, beep" },
      { label: "body_part", hint: "tail, head, foot" }
    ],
    story: "A {0} dinosaur walked into the grocery store and went straight for the {1}. It grabbed {2} of them and {3} the {4}. Everyone heard a loud {5}! The dinosaur wagged its {6} and walked out."
  },
  {
    title: "The Backwards Day",
    blanks: [
      { label: "clothing", hint: "pajamas, socks, jacket" },
      { label: "food", hint: "pancakes, pizza, soup" },
      { label: "verb_past", hint: "walked, crawled, hopped" },
      { label: "adjective", hint: "backwards, upside-down, inside-out" },
      { label: "animal", hint: "dog, parrot, bunny" },
      { label: "place", hint: "school, the park, bed" }
    ],
    story: "On Backwards Day, I wore my {0} on my head and ate {1} for dinner in the morning. I {2} to school {3}. Even our {4} was confused! The teacher said to go home but we all went to {5} instead."
  },
  {
    title: "The Messy Chef",
    blanks: [
      { label: "food", hint: "chocolate, spaghetti, ketchup" },
      { label: "noun", hint: "a thing, like blender or bathtub" },
      { label: "number", hint: "2, 20, 99" },
      { label: "adjective", hint: "gooey, crunchy, smelly" },
      { label: "body_part", hint: "hair, ears, belly" },
      { label: "verb_past", hint: "exploded, splattered, dripped" },
      { label: "color", hint: "brown, green, yellow" }
    ],
    story: "I tried to cook {0} in the {1}. I added {2} cups of the {3} stuff. It got all over my {4} when it {5}! The whole kitchen turned {6}. Mom was NOT happy."
  },
  {
    title: "The Alien Sleepover",
    blanks: [
      { label: "name", hint: "a silly alien name" },
      { label: "color", hint: "green, purple, silver" },
      { label: "number", hint: "4, 8, 17" },
      { label: "food", hint: "popcorn, bugs, marshmallows" },
      { label: "verb_past", hint: "floated, beeped, danced" },
      { label: "adjective", hint: "glowing, wiggly, tiny" },
      { label: "noun", hint: "a thing, like pillow or lamp" }
    ],
    story: "An alien named {0} came to our sleepover. It was {1} and had {2} eyes. We shared some {3} and it {4} around the room. It had a {5} {6} that it used as a blanket. Best sleepover guest ever!"
  },
  {
    title: "The Talking Dog",
    blanks: [
      { label: "adjective", hint: "fluffy, loud, tiny" },
      { label: "food", hint: "bones, pizza, broccoli" },
      { label: "verb", hint: "sing, read, skateboard" },
      { label: "place", hint: "the park, school, the store" },
      { label: "noun", hint: "a thing, like newspaper or phone" },
      { label: "name", hint: "a dog name" }
    ],
    story: "One day my {0} dog started talking! It asked for {1} and then tried to {2}. It wanted to go to {3} and bring its favorite {4}. I named it {5} and now it never stops chatting."
  },
  {
    title: "The Silly Pirate Ship",
    blanks: [
      { label: "adjective", hint: "rusty, sparkly, bouncy" },
      { label: "animal", hint: "parrot, crab, whale" },
      { label: "food", hint: "cookies, fish sticks, candy" },
      { label: "noun", hint: "a thing, like treasure or sock" },
      { label: "verb_past", hint: "sailed, bounced, tumbled" },
      { label: "color", hint: "black, gold, rainbow" },
      { label: "number", hint: "3, 50, 1000" }
    ],
    story: "Captain me set sail on a {0} pirate ship with a {1} on my shoulder. We had {2} for every meal. We found a chest full of {3} and {4} across the {5} sea. We found {6} gold coins!"
  },
  {
    title: "The Robot Butler",
    blanks: [
      { label: "name", hint: "a robot name" },
      { label: "adjective", hint: "shiny, clumsy, tiny" },
      { label: "food", hint: "pancakes, sandwiches, soup" },
      { label: "verb_past", hint: "beeped, crashed, spun" },
      { label: "noun", hint: "a thing, like plate or chair" },
      { label: "sound", hint: "BEEP, clang, whoosh" }
    ],
    story: "We got a robot butler named {0}. It was very {1} and tried to make {2} for breakfast. It {3} into the {4} and made a loud {5}! We love our robot even though it breaks everything."
  },
  {
    title: "The Enchanted Treehouse",
    blanks: [
      { label: "adjective", hint: "magical, huge, wobbly" },
      { label: "animal", hint: "owl, squirrel, fairy" },
      { label: "color", hint: "golden, silver, rainbow" },
      { label: "food", hint: "berries, honey, chocolate" },
      { label: "noun", hint: "a thing, like ladder or door" },
      { label: "verb_past", hint: "climbed, flew, whispered" }
    ],
    story: "We found a {0} treehouse in the backyard. A {1} lived inside. The walls were {2} and there was {3} everywhere! We opened a secret {4} and {5} all the way to the top. It felt like a dream."
  },
  {
    title: "The Snowman Who Came Alive",
    blanks: [
      { label: "name", hint: "a snowman name" },
      { label: "clothing", hint: "scarf, top hat, mittens" },
      { label: "food", hint: "hot cocoa, carrots, cookies" },
      { label: "verb_past", hint: "danced, slid, melted" },
      { label: "adjective", hint: "freezing, silly, jolly" },
      { label: "place", hint: "the kitchen, the mall, school" }
    ],
    story: "Our snowman {0} came alive! It put on a {1} and asked for {2}. Then it {3} around the yard. It was so {4}! It wanted to go to {5} but we said it would melt. It didn't care!"
  },
  {
    title: "The Monster Under the Bed",
    blanks: [
      { label: "adjective", hint: "fuzzy, friendly, purple" },
      { label: "sound", hint: "snore, giggle, ROAR" },
      { label: "food", hint: "cookies, socks, dust bunnies" },
      { label: "verb", hint: "sleep, play, read" },
      { label: "noun", hint: "a thing, like teddy bear or book" },
      { label: "name", hint: "a monster name" }
    ],
    story: "The monster under my bed is actually really {0}. At night it makes a {1} sound. It eats {2} and likes to {3}. I share my {4} with it. Its name is {5} and we're best friends now."
  },
  {
    title: "The Crazy Hair Day",
    blanks: [
      { label: "color", hint: "pink, green, rainbow" },
      { label: "food", hint: "spaghetti, gummy bears, syrup" },
      { label: "animal", hint: "bird, cat, lizard" },
      { label: "adjective", hint: "spiky, curly, enormous" },
      { label: "number", hint: "3, 10, 50" },
      { label: "verb_past", hint: "laughed, stared, cheered" }
    ],
    story: "For Crazy Hair Day I made my hair {0} and put {1} in it. A {2} tried to nest in it! My hair was so {3} that {4} people could see it from far away. Everyone {5}!"
  },
  {
    title: "The Magic Paintbrush",
    blanks: [
      { label: "color", hint: "gold, rainbow, invisible" },
      { label: "animal", hint: "horse, butterfly, dragon" },
      { label: "food", hint: "cake, ice cream, fruit" },
      { label: "place", hint: "the beach, a castle, space" },
      { label: "adjective", hint: "beautiful, giant, flying" },
      { label: "verb_past", hint: "appeared, sparkled, came alive" }
    ],
    story: "I found a {0} paintbrush. Everything I painted became real! I painted a {1}, then some {2}, then a picture of {3}. It all became {4} and {5}. I was the greatest artist in the world!"
  },
  {
    title: "The Princess and the Frog... Again",
    blanks: [
      { label: "adjective", hint: "grumpy, sparkly, smelly" },
      { label: "animal", hint: "frog, toad, gecko" },
      { label: "verb_past", hint: "kissed, poked, high-fived" },
      { label: "noun", hint: "a thing, like crown or sandwich" },
      { label: "food", hint: "flies, cupcakes, worms" },
      { label: "adjective", hint: "happy, confused, hungry" }
    ],
    story: "Once upon a time a {0} {1} wanted to be a prince. A princess {2} it but it turned into a {3}! So they just ate {4} together and were {5} forever. The end!"
  },
  {
    title: "Grandma's Secret Recipe",
    blanks: [
      { label: "food", hint: "peanut butter, pickles, cheese" },
      { label: "number", hint: "2, 15, 99" },
      { label: "noun", hint: "a thing, like shoe or leaf" },
      { label: "adjective", hint: "bubbly, smelly, rainbow" },
      { label: "verb", hint: "stir, shake, throw" },
      { label: "sound", hint: "POP, sizzle, bang" }
    ],
    story: "Grandma's secret recipe: take {0}, add {1} cups of crushed {2}, mix until {3}, then {4} it three times. It'll go {5}! Grandma says it's delicious. We're not so sure."
  },
  {
    title: "The Day I Shrunk",
    blanks: [
      { label: "adjective", hint: "tiny, microscopic, ant-sized" },
      { label: "noun", hint: "a thing, like crumb or leaf" },
      { label: "animal", hint: "ant, ladybug, spider" },
      { label: "verb_past", hint: "rode, climbed, bounced" },
      { label: "food", hint: "a grape, a breadcrumb, a sprinkle" },
      { label: "body_part", hint: "finger, toe, ear" }
    ],
    story: "I woke up {0}! A {1} was as big as a house. I met a friendly {2} and {3} on its back. Lunch was {4}, which was now the size of my {5}. I hope I grow back tomorrow!"
  },
  {
    title: "The Cloud Factory",
    blanks: [
      { label: "adjective", hint: "fluffy, cotton candy, enormous" },
      { label: "color", hint: "white, pink, blue" },
      { label: "animal", hint: "sheep, bunny, bird" },
      { label: "food", hint: "marshmallows, whipped cream, cotton candy" },
      { label: "verb_past", hint: "floated, bounced, dissolved" },
      { label: "noun", hint: "a thing, like pillow or bubble" }
    ],
    story: "We visited the cloud factory. The clouds were {0} and {1}. A {2} was in charge of making them out of {3}. One cloud {4} away and turned into a giant {5} in the sky!"
  },
  {
    title: "The Invisible Homework",
    blanks: [
      { label: "adjective", hint: "invisible, vanishing, see-through" },
      { label: "noun", hint: "a thing, like pencil or crayon" },
      { label: "verb_past", hint: "disappeared, faded, flew away" },
      { label: "name", hint: "your teacher's name" },
      { label: "food", hint: "something you eat" },
      { label: "adjective", hint: "confused, suspicious, amazed" }
    ],
    story: "I did my homework but it turned {0}! I swear I used a real {1} but the words just {2}! My teacher {3} was very {5}. I said the dog ate it but actually I traded it for {4}."
  },
  {
    title: "The Circus in My Backyard",
    blanks: [
      { label: "number", hint: "3, 10, 25" },
      { label: "animal", hint: "elephant, poodle, monkey" },
      { label: "verb_past", hint: "juggled, flipped, balanced" },
      { label: "food", hint: "popcorn, cotton candy, peanuts" },
      { label: "adjective", hint: "amazing, wobbly, hilarious" },
      { label: "noun", hint: "a thing, like ball or chair" },
      { label: "clothing", hint: "tutu, top hat, clown nose" }
    ],
    story: "I woke up and there were {0} circus tents in my backyard! A {1} {2} while eating {3}. The show was {4}! I balanced a {5} on my head and wore a {6}. Mom said they have to leave by dinner."
  },
  {
    title: "The Opposite Day Pet Store",
    blanks: [
      { label: "animal", hint: "goldfish, hamster, snake" },
      { label: "adjective", hint: "loud, giant, invisible" },
      { label: "verb", hint: "bark, meow, sing" },
      { label: "food", hint: "steak, salad, gummy worms" },
      { label: "noun", hint: "a thing, like leash or cage" },
      { label: "sound", hint: "MOO, tweet, ROAR" }
    ],
    story: "On Opposite Day, the pet store was wild. The {0} was {1} and tried to {2}. It only ate {3} and refused to stay in its {4}. When we left it said {5}. We're keeping it."
  },
  {
    title: "The Pillow Fort Kingdom",
    blanks: [
      { label: "adjective", hint: "mighty, cozy, enormous" },
      { label: "noun", hint: "a thing, like blanket or cushion" },
      { label: "name", hint: "a royal name" },
      { label: "food", hint: "cookies, grapes, goldfish crackers" },
      { label: "animal", hint: "cat, teddy bear, dragon" },
      { label: "verb_past", hint: "defended, guarded, snuggled" }
    ],
    story: "We built the most {0} pillow fort ever. The walls were made of {1}. I was King {2} and we feasted on {3}. A {4} tried to attack but we {5} our kingdom! No grown-ups allowed."
  },
  {
    title: "The Upside-Down House",
    blanks: [
      { label: "verb_past", hint: "walked, floated, slid" },
      { label: "noun", hint: "a thing, like chair or lamp" },
      { label: "food", hint: "cereal, soup, juice" },
      { label: "adjective", hint: "dizzy, confused, giggly" },
      { label: "body_part", hint: "feet, head, hands" },
      { label: "animal", hint: "cat, fish, bird" }
    ],
    story: "Our house flipped upside-down! We {0} on the ceiling. The {1} hung from the floor. I tried to eat {2} but it fell up! Everyone felt {3}. We used our {4} to hang on. Even the {5} was confused."
  },
  {
    title: "The Time Machine Lunchbox",
    blanks: [
      { label: "noun", hint: "a thing, like lunchbox or backpack" },
      { label: "place", hint: "ancient Egypt, the future, dinosaur times" },
      { label: "animal", hint: "T-Rex, woolly mammoth, robot dog" },
      { label: "food", hint: "a sandwich, berries, space food" },
      { label: "verb_past", hint: "zoomed, teleported, stumbled" },
      { label: "adjective", hint: "amazing, scary, weird" }
    ],
    story: "My {0} turned into a time machine! I went to {1} and met a {2}. I shared my {3} with it. Then I {4} back home. The whole trip was {5}. I can't wait to go again tomorrow!"
  },
  {
    title: "The Singing Vegetables",
    blanks: [
      { label: "food", hint: "a vegetable, like carrot or broccoli" },
      { label: "verb_past", hint: "sang, rapped, yodeled" },
      { label: "adjective", hint: "loud, beautiful, terrible" },
      { label: "food", hint: "another vegetable" },
      { label: "noun", hint: "a thing, like microphone or stage" },
      { label: "number", hint: "5, 100, a million" }
    ],
    story: "The {0} in our fridge {1} a song! It was {2}. Then the {3} joined in. They used a {4} made of celery. They had {5} fans. I still didn't want to eat them though."
  },
  {
    title: "The World's Worst Babysitter",
    blanks: [
      { label: "animal", hint: "gorilla, penguin, cat" },
      { label: "verb_past", hint: "ate, threw, juggled" },
      { label: "food", hint: "the crayons, the furniture, pizza" },
      { label: "adjective", hint: "wild, hilarious, messy" },
      { label: "noun", hint: "a thing, like TV remote or plant" },
      { label: "verb", hint: "hide, clean up, cry" }
    ],
    story: "Mom hired a {0} to babysit us. It {1} all the {2}. The house got really {3}. It tried to use the {4} but couldn't figure it out. When Mom came home we had to {5}. She was so surprised!"
  },
  {
    title: "Beach Day Disaster",
    blanks: [
      { label: "adjective", hint: "sunny, windy, freezing" },
      { label: "noun", hint: "a thing, like sandcastle or bucket" },
      { label: "animal", hint: "crab, seagull, jellyfish" },
      { label: "verb_past", hint: "grabbed, stole, sat on" },
      { label: "food", hint: "ice cream, hot dogs, watermelon" },
      { label: "body_part", hint: "foot, nose, belly button" },
      { label: "number", hint: "3, 10, 50" }
    ],
    story: "It was a {0} beach day. I built a huge {1} but a {2} {3} it! Then a wave washed away our {4}. Sand got in my {5}. We went home after {6} minutes. Beach days are hard."
  },
  {
    title: "The New Kid at School Is a...",
    blanks: [
      { label: "animal", hint: "bear, alien, mermaid" },
      { label: "adjective", hint: "friendly, shy, sparkly" },
      { label: "verb_past", hint: "sat, flew, teleported" },
      { label: "food", hint: "something for lunch" },
      { label: "noun", hint: "a school thing, like desk or pencil" },
      { label: "adjective", hint: "cool, weird, awesome" }
    ],
    story: "The new kid at school was actually a {0}! It was really {1} and {2} right next to me. At lunch it ate {3} with a {4}. Everyone thought it was pretty {5}. I hope it comes back tomorrow."
  },
  {
    title: "The Fastest Race Ever",
    blanks: [
      { label: "animal", hint: "turtle, cheetah, snail" },
      { label: "noun", hint: "a vehicle, like scooter or wagon" },
      { label: "verb_past", hint: "zoomed, crawled, bounced" },
      { label: "adjective", hint: "fast, wobbly, backwards" },
      { label: "food", hint: "something for a prize" },
      { label: "number", hint: "1, 10, 100" }
    ],
    story: "I raced a {0} on my {1}. It {2} so {3} that I couldn't keep up! The winner got {4}. I came in {5}th place. Next time I'm bringing rocket boots."
  },
  {
    title: "The Day It Rained...",
    blanks: [
      { label: "food", hint: "gummy bears, meatballs, pickles" },
      { label: "adjective", hint: "sticky, bouncy, delicious" },
      { label: "verb_past", hint: "caught, dodged, ate" },
      { label: "noun", hint: "a thing, like umbrella or bucket" },
      { label: "number", hint: "5, 100, a billion" },
      { label: "animal", hint: "dog, duck, squirrel" }
    ],
    story: "Instead of rain, {0} fell from the sky! They were {1}. Everyone {2} them with a {3}. We collected {4} of them. Even the {5} next door was excited. Best weather day ever!"
  },
  {
    title: "The Haunted Playground",
    blanks: [
      { label: "adjective", hint: "spooky, giggly, friendly" },
      { label: "noun", hint: "a playground thing, like swing or slide" },
      { label: "verb_past", hint: "squeaked, glowed, giggled" },
      { label: "color", hint: "ghostly white, neon green, purple" },
      { label: "sound", hint: "BOO, hehe, whooo" },
      { label: "food", hint: "candy, cookies, gummy worms" }
    ],
    story: "The playground was {0} at night. The {1} {2} all by itself. Everything turned {3}. We heard a voice say {4}! But it was just a friendly ghost who wanted to share {5}. Not scary at all!"
  },
  {
    title: "My Brother/Sister Is Actually a...",
    blanks: [
      { label: "animal", hint: "monkey, alien, robot" },
      { label: "adjective", hint: "sneaky, loud, smelly" },
      { label: "verb", hint: "eat, steal, build" },
      { label: "food", hint: "something you eat" },
      { label: "noun", hint: "a thing, like toy or blanket" },
      { label: "sound", hint: "a sound they make" }
    ],
    story: "I'm pretty sure my sibling is secretly a {0}. They are always {1} and they love to {2} all the {3}. They hoard {4} in their room. And at night they make a weird {5} sound. I have proof!"
  },
  {
    title: "The School Play Goes Wrong",
    blanks: [
      { label: "adjective", hint: "silly, dramatic, fancy" },
      { label: "animal", hint: "a character, like lion or mouse" },
      { label: "clothing", hint: "costume, like crown or cape" },
      { label: "verb_past", hint: "tripped, forgot, sneezed" },
      { label: "noun", hint: "a prop, like sword or flower" },
      { label: "sound", hint: "CRASH, oops, ta-da" },
      { label: "adjective", hint: "hilarious, embarrassing, amazing" }
    ],
    story: "Our school play was supposed to be {0}. I played a {1} wearing a {2}. But I {3} and dropped the {4}. There was a huge {5}! The audience thought it was {6}. Standing ovation!"
  },
  {
    title: "The World's Biggest Sandwich",
    blanks: [
      { label: "food", hint: "peanut butter, pickles, cheese" },
      { label: "food", hint: "another ingredient" },
      { label: "number", hint: "5, 100, 1000" },
      { label: "adjective", hint: "enormous, wobbly, delicious" },
      { label: "noun", hint: "a thing, like ladder or crane" },
      { label: "verb_past", hint: "toppled, exploded, squished" }
    ],
    story: "We made the world's biggest sandwich! It had {0} and {1} and was {2} layers tall. It was so {3} we needed a {4} to reach the top. Then it {5} and everyone got covered. Worth it."
  },
  {
    title: "The Bedtime Escape",
    blanks: [
      { label: "verb_past", hint: "tiptoed, crawled, rolled" },
      { label: "noun", hint: "a thing, like flashlight or teddy bear" },
      { label: "adjective", hint: "dark, quiet, creaky" },
      { label: "food", hint: "a midnight snack" },
      { label: "animal", hint: "cat, owl, hamster" },
      { label: "sound", hint: "CREAK, whisper, thud" }
    ],
    story: "After bedtime, I {0} out of bed with my {1}. The hallway was {2}. I snuck to the kitchen for some {3}. A {4} was already there! We both froze. Then we heard {5} and ran back to bed!"
  },
  {
    title: "The Wish Machine",
    blanks: [
      { label: "noun", hint: "a thing, like button or lever" },
      { label: "adjective", hint: "shiny, magical, sparkly" },
      { label: "food", hint: "your favorite food" },
      { label: "animal", hint: "your dream pet" },
      { label: "place", hint: "your dream place" },
      { label: "number", hint: "3, 10, infinite" }
    ],
    story: "I found a wish machine! You press the {0} and it glows {1}. I wished for unlimited {2}, a pet {3}, and a trip to {4}. But it only grants {5} wishes so I had to choose. Hardest decision ever!"
  },
  {
    title: "The Toy That Came Alive",
    blanks: [
      { label: "noun", hint: "a toy, like teddy bear or action figure" },
      { label: "verb_past", hint: "talked, walked, danced" },
      { label: "food", hint: "something they wanted to eat" },
      { label: "adjective", hint: "bossy, funny, shy" },
      { label: "place", hint: "somewhere they wanted to go" },
      { label: "verb", hint: "play, explore, cause trouble" }
    ],
    story: "My {0} came alive at midnight! It {1} and asked for {2}. It was really {3} and wanted to go to {4}. We stayed up all night trying to {5}. By morning it was a toy again. Or WAS it?"
  },
  {
    title: "The Substitute Teacher",
    blanks: [
      { label: "animal", hint: "bear, parrot, octopus" },
      { label: "adjective", hint: "strict, goofy, confused" },
      { label: "verb_past", hint: "gave, threw, juggled" },
      { label: "food", hint: "something instead of homework" },
      { label: "noun", hint: "a school subject, like math or art" },
      { label: "adjective", hint: "the best, the weirdest, the funniest" }
    ],
    story: "Our substitute teacher was a {0}! It was really {1}. Instead of a test, it {2} us {3}. For {4} class we just played outside. It was {5} school day of the whole year!"
  },
  {
    title: "The Birthday Cake Catastrophe",
    blanks: [
      { label: "number", hint: "an age, like 5 or 7" },
      { label: "food", hint: "a cake flavor" },
      { label: "adjective", hint: "lopsided, exploding, melting" },
      { label: "verb_past", hint: "collapsed, flew, oozed" },
      { label: "color", hint: "a frosting color" },
      { label: "noun", hint: "a thing on top, like candle or toy" },
      { label: "adjective", hint: "delicious, terrible, legendary" }
    ],
    story: "For my {0}th birthday, Mom made a {1} cake. It was a little {2} and it {3} when we tried to cut it. {4} frosting got everywhere. The {5} on top went flying. It was {6} but we ate it anyway!"
  },
  {
    title: "The Secret Clubhouse",
    blanks: [
      { label: "adjective", hint: "secret, magical, invisible" },
      { label: "noun", hint: "where it's hidden, like tree or closet" },
      { label: "food", hint: "club snack" },
      { label: "name", hint: "club name" },
      { label: "noun", hint: "a password thing, like knock or dance" },
      { label: "number", hint: "how many members" }
    ],
    story: "We built a {0} clubhouse inside a {1}. The official snack is {2}. We call ourselves The {3} Club. To get in you need a secret {4}. There are only {5} members. No parents allowed, obviously."
  },
  {
    title: "The Magical Shoes",
    blanks: [
      { label: "color", hint: "gold, rainbow, glowing" },
      { label: "verb", hint: "fly, dance, run super fast" },
      { label: "place", hint: "the moon, a castle, the ocean" },
      { label: "adjective", hint: "amazing, tingly, wobbly" },
      { label: "animal", hint: "an animal you met" },
      { label: "noun", hint: "what you brought back" }
    ],
    story: "I put on the {0} shoes and could suddenly {1}! They took me to {2}. My feet felt {3}. I met a {4} who gave me a magical {5} to take home. I wear those shoes every day now."
  },
  {
    title: "The Family Road Trip",
    blanks: [
      { label: "place", hint: "a silly destination" },
      { label: "food", hint: "a car snack" },
      { label: "number", hint: "how many hours" },
      { label: "verb_past", hint: "sang, argued, napped" },
      { label: "animal", hint: "an animal you saw" },
      { label: "adjective", hint: "boring, hilarious, endless" },
      { label: "noun", hint: "a thing you forgot" }
    ],
    story: "We drove to {0}. We ate {1} the whole time. It took {2} hours and we {3} the entire way. We saw a {4} on the road. The trip was {5}. Dad forgot the {6} and had to go back."
  },
  {
    title: "The Tooth Fairy Mix-Up",
    blanks: [
      { label: "noun", hint: "what the fairy left, like sock or rock" },
      { label: "adjective", hint: "confused, sleepy, sparkly" },
      { label: "food", hint: "what was under the pillow instead" },
      { label: "number", hint: "how much money" },
      { label: "animal", hint: "what you saw flying away" },
      { label: "sound", hint: "a sound in the night" }
    ],
    story: "I put my tooth under my pillow but the tooth fairy left a {0}! She must have been {1}. There was also a {2} there. I was supposed to get {3} dollars! I looked up and saw a {4} flying away going {5}."
  },
  {
    title: "The Camping Trip",
    blanks: [
      { label: "adjective", hint: "dark, spooky, exciting" },
      { label: "animal", hint: "bear, raccoon, owl" },
      { label: "food", hint: "s'mores, hot dogs, trail mix" },
      { label: "verb_past", hint: "howled, rustled, glowed" },
      { label: "noun", hint: "a thing, like tent or sleeping bag" },
      { label: "sound", hint: "HOOT, crack, splash" }
    ],
    story: "We went camping and it was {0}. A {1} came to our campsite looking for {2}. Something {3} in the bushes. We hid in the {4} and heard a loud {5}. We went home early. Nature is intense."
  }
];
