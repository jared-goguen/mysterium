/**
 * Death at the Blue Parrot
 *
 * A noir mystery set in a 1947 Los Angeles jazz club.
 * The club owner is found dead. Five suspects, each hiding something.
 * The truth hides behind contradictions, perfume, and a movie stub.
 */
import type { Mystery } from "../types/mystery";

const mystery: Mystery = {
  id: "blue-parrot-001",
  title: "Death at the Blue Parrot",
  author: "manual",
  createdAt: 1745600000,
  difficulty: 3,
  description:
    "A jazz club owner is found dead in his office, cyanide in his whiskey. Five suspects, each with something to hide. The truth lingers in the air — if you know what to look for.",
  genre: "noir",
  setting: {
    name: "The Blue Parrot",
    era: "1947, Los Angeles",
    atmosphere:
      "Smoke curls through blue spotlight beams. The last notes of a saxophone fade into silence. Upstairs, a glass of whiskey sits half-empty on a dead man's desk.",
  },
  crimeDescription:
    "Victor Morel, owner of the Blue Parrot jazz club, was found dead in his upstairs office at closing time by his bartender Tommy Greco. The cause: cyanide poisoning, delivered through his nightly whiskey. The glass sits half-empty on his desk, a thin foam at the rim. The back door was unlocked. Everyone has a reason to want Victor gone.",

  characters: [
    {
      id: "marlene",
      name: "Marlene Voss",
      description:
        "Tall, striking, mid-thirties. Red lipstick, black sequined dress. Moves like she owns every room she enters — because she usually does.",
      personality:
        "Sharp-tongued, glamorous, guarded. Alternates between icy composure and flashes of genuine vulnerability.",
      speechPattern:
        "Clipped, precise, occasionally cutting. Drops into weary honesty when her guard slips.",
      motive:
        "Victor had been blackmailing her with photographs of her and a married senator. She wanted those photos destroyed.",
      alibi: {
        claimed: "I was on stage for both sets, then in the dressing room. Ask anyone.",
        truth: "She was on stage for both sets, but during the break she was in the dressing room counting money she'd skimmed from the tip jar.",
        gaps: ["15-minute break between sets around 10:45 PM"],
      },
      meansAccess: false,
      opportunityWindow:
        "The break between sets — but she was seen in the dressing room by a stagehand.",
      whatTheySaw: [
        "A woman's silhouette on the back stairs during her second set — glimpsed from the stage wings",
        "Victor arguing with Frank Palazzo earlier in the evening around 9 PM",
      ],
      whatTheyKnow: [
        "Victor kept a safe in his office with 'insurance' — dirt on everyone",
        "Dolores and Victor's marriage was a war zone",
        "Eddie Sato seemed nervous all evening",
      ],
      whatTheySuspect:
        "Frank Palazzo. Victor owed the mob money and Frank was here to collect. When Victor couldn't pay, Frank made an example of him.",
      secret: {
        description:
          "She's been skimming money from the club's tip jar — about $200 a week — to send to her sick mother in Detroit.",
        reason:
          "Victor paid her well but controlled every dollar. The tips were her only way to help her mother without Victor knowing and using it against her.",
        revealTrigger:
          "Confronting her with evidence of the missing tip money, or pressing hard on what she was doing during the break between sets.",
      },
      relationships: {
        tommy: "Fond of him. He's honest, which is rare here. She trusts him more than anyone at the club.",
        dolores: "Pities her. Knows what it's like to be under Victor's thumb.",
        eddie: "Professionally respectful. Good piano player. Keeps to himself, which she appreciates.",
        frank: "Fears him. Knows what he represents. Avoids eye contact.",
      },
      isGuilty: false,
    },
    {
      id: "tommy",
      name: "Tommy Greco",
      description:
        "Stocky, late forties, weathered face. Calloused hands from years behind the bar. Quiet eyes that notice everything.",
      personality:
        "Loyal, stoic, observant. Speaks carefully — every word considered. Gets flustered when pressed about his past.",
      speechPattern:
        "Short sentences. Working-class diction. Pauses before answering, like he's checking the words for traps.",
      motive:
        "Victor owed him $5,000 in back wages and laughed when Tommy asked for it. That's a year's rent.",
      alibi: {
        claimed: "I was behind the bar all night until closing. Then I went up to lock Victor's office and found him.",
        truth: "He was behind the bar most of the night, but stepped into the stockroom for about 20 minutes around 10:30 PM to inventory a delivery.",
        gaps: ["10:30–10:50 PM in the stockroom"],
      },
      meansAccess: true,
      opportunityWindow:
        "He handles all the drinks — could have poisoned the whiskey at any point. But he didn't go upstairs until closing.",
      whatTheySaw: [
        "Frank Palazzo going upstairs around 11:30 PM and coming back down 10 minutes later looking pale",
        "A delivery truck in the back alley around 10 PM — unusual for that hour",
        "Victor drinking from the bottle in his office around 9:30 PM when Tommy brought up a fresh bottle of rye",
      ],
      whatTheyKnow: [
        "Victor's whiskey routine — always the same glass, same bottle, poured himself",
        "The back door was unlocked all evening — Victor insisted, said he liked the air",
        "Dolores hadn't been to the club in weeks — or so he thought",
      ],
      whatTheySuspect:
        "He doesn't want to say, but he thinks it might be Marlene. She had the most reason to hate Victor, and she's smart enough to pull it off.",
      secret: {
        description:
          "He served five years for aggravated assault in his twenties. Beat a man half to death in a bar fight.",
        reason:
          "If the police look into his background, he becomes the prime suspect. An ex-con who found the body and was owed money? He'd never see daylight again.",
        revealTrigger:
          "Direct confrontation about his criminal record, or pressing on why he's so nervous around the police.",
      },
      relationships: {
        marlene: "Protective of her. She's the only one here who treats him like a person.",
        dolores: "Barely knows her. She rarely came to the club. Seemed sad the few times he saw her.",
        eddie: "Likes the kid. Quiet, hardworking. Reminds Tommy of himself at that age.",
        frank: "Despises him but hides it. Men like Frank are why men like Tommy end up in prison.",
      },
      isGuilty: false,
    },
    {
      id: "dolores",
      name: "Dolores Morel",
      description:
        "Elegant, early forties. Dark hair pinned up, pearl earrings. Composed in a way that costs visible effort. Smells faintly of Shalimar perfume.",
      personality:
        "Measured, dignified, brittle. Maintains perfect composure until cornered, then flashes of cold steel show through.",
      speechPattern:
        "Formal, deliberate. Never uses two words where one will do. Voice drops to near-whisper when lying.",
      motive:
        "A $50,000 life insurance policy, freedom from a controlling and unfaithful husband, and a new life with Eddie Sato.",
      alibi: {
        claimed: "I was home all evening. Went to the pictures at the Orpheum, came home, went to bed. I heard about Victor from the police.",
        truth: "She drove to the club during the second set, entered through the back alley, went up the back stairs to Victor's office, swapped his whiskey glass, and left the same way.",
        gaps: ["10:00 PM–11:15 PM entirely unaccounted for"],
      },
      meansAccess: true,
      opportunityWindow:
        "The entire second set — roughly 10:30 to 11:30 PM — when all eyes were on the stage and the back entrance was unwatched.",
      whatTheySaw: [
        "Victor alive in his office when she arrived — he was surprised to see her",
        "The back alley was empty except for puddles and a stray cat",
      ],
      whatTheyKnow: [
        "Victor's whiskey routine — he always poured from the same bottle",
        "The life insurance policy pays double for unnatural death",
        "Victor kept blackmail material on half the people in this club",
      ],
      whatTheySuspect:
        "She'll deflect toward Frank Palazzo — 'Everyone knows Victor owed those people money. They don't send flowers when you can't pay.'",
      secret: {
        description:
          "She murdered Victor. She purchased rat poison three days ago and prepared a flask of poisoned whiskey.",
        reason: "She's the killer. She will do anything to avoid being caught.",
        revealTrigger:
          "Accumulation of evidence: the fake alibi, the perfume, the poison receipt, and Eddie's testimony about the insurance questions.",
      },
      relationships: {
        marlene: "Quiet jealousy. Marlene had the affair with Victor that Dolores pretended not to know about.",
        tommy: "Indifferent. The hired help. Useful because he's unobservant — or so she thought.",
        eddie: "Loves him. He's her way out. But she went further than he ever would have.",
        frank: "Useful scapegoat. His presence at the club tonight is convenient for redirecting suspicion.",
      },
      isGuilty: true,
    },
    {
      id: "eddie",
      name: "Eddie Sato",
      description:
        "Lean, late twenties, Japanese-American. Ink-stained fingers from writing music. Quiet intensity behind wire-rimmed glasses.",
      personality:
        "Reserved, artistic, quietly principled. Becomes visibly uncomfortable when forced to lie. Fidgets with his glasses when nervous.",
      speechPattern:
        "Thoughtful, slightly formal. Musical vocabulary creeps in — talks about 'dissonance' and 'resolution' even outside music.",
      motive:
        "Victor publicly humiliated him last week — called his music 'Oriental noise' in front of the whole club and threatened to fire him.",
      alibi: {
        claimed: "I was at the piano all evening. Both sets, no breaks. You can ask anyone who was watching.",
        truth: "He played both sets but took a 15-minute break between them. During the break, he was outside on the phone with Dolores, who told him she was coming to the club.",
        gaps: ["15-minute break between sets, approximately 10:30–10:45 PM"],
      },
      meansAccess: false,
      opportunityWindow:
        "The break between sets — but he was outside on the phone, not upstairs.",
      whatTheySaw: [
        "Dolores's car parked a block from the club around 10:15 PM — he noticed it during his phone call",
        "Frank Palazzo having an intense whispered conversation with Victor around 9:15 PM",
      ],
      whatTheyKnow: [
        "Dolores had been asking him about Victor's life insurance policy in recent weeks",
        "Dolores told him she was 'going to fix everything' — he assumed she meant divorce",
        "Victor kept cyanide-based rat poison in the club's basement for the rat problem",
      ],
      whatTheySuspect:
        "He's terrified it was Dolores but can't bring himself to say it directly. He'll hint at it obliquely if pressed.",
      secret: {
        description:
          "He's been having a secret affair with Dolores Morel for three months. They've been planning for her to leave Victor.",
        reason:
          "Revealing the affair makes Dolores the prime suspect and himself an accomplice. He loves her and wants to protect her — even if he's starting to suspect the truth.",
        revealTrigger:
          "Confronting him with evidence of the affair (Dolores's car near the club, or pressing on the phone call during the break). He'll crack if you can show him Dolores lied about being home.",
      },
      relationships: {
        marlene: "Admires her talent. They have an unspoken mutual respect between performers.",
        tommy: "Trusts him. Tommy gave him a chance when Victor wanted to fire him.",
        dolores: "Loves her desperately. Increasingly afraid of what she may have done.",
        frank: "Avoids him. Frank makes Eddie's skin crawl.",
      },
      isGuilty: false,
    },
    {
      id: "frank",
      name: "Frank Palazzo",
      description:
        "Heavyset, fifties, expensive suit that strains at the shoulders. Gold pinky ring. Face like a clenched fist that occasionally remembers to smile.",
      personality:
        "Intimidating, transactional, surprisingly shrewd. Uses silence as a weapon. Capable of sudden charm when it serves him.",
      speechPattern:
        "Blunt, working-class Italian inflections. Speaks in implications rather than statements. 'It would be unfortunate if...' rather than direct threats.",
      motive:
        "Victor owed the Palazzo family $15,000 in gambling debts. Frank was sent to collect — or send a message.",
      alibi: {
        claimed: "I was at my table all night. Had three whiskey sours. Ask the waitress. I left at midnight, before any of this business.",
        truth: "He was at his table most of the night but went upstairs to Victor's office around 11:30 PM to make one final threat. Found Victor already dead. Panicked, wiped down everything he'd touched, and went back downstairs.",
        gaps: ["11:20–11:40 PM — went upstairs, found the body, cleaned up"],
      },
      meansAccess: true,
      opportunityWindow:
        "He went upstairs to the office — but Victor was already dead when he arrived.",
      whatTheySaw: [
        "Victor was already dead when Frank entered the office — slumped over the desk, foam on his lips",
        "The whiskey glass was half-empty and smelled wrong — bitter, like almonds",
        "A woman's scarf on the back stairs — cream-colored silk",
      ],
      whatTheyKnow: [
        "Victor's gambling debts were serious — the family was losing patience",
        "Someone else was in that office before Frank — he could smell perfume",
        "The back door was unlocked and the back stairs had wet footprints — someone came in from the rain",
      ],
      whatTheySuspect:
        "He doesn't care who did it — but the perfume in the office means it was a woman. He'll say this if it helps deflect from himself.",
      secret: {
        description:
          "He contaminated the crime scene. He wiped down the desk, the door handle, the safe — destroying evidence to protect himself from being placed in the office.",
        reason:
          "If the police find his prints in a dead man's office, and the dead man owed his family money, Frank goes down for murder. The family won't protect him from that.",
        revealTrigger:
          "Confronting him with Tommy's testimony that Frank went upstairs. Or pressing on why his fingerprints aren't in an office he supposedly never visited.",
      },
      relationships: {
        marlene: "Appreciates her. Good singer. Doesn't mix business with the entertainment.",
        tommy: "Sees him as furniture. The bartender. Invisible.",
        dolores: "Doesn't know her well. Victor's wife. Knows she exists, doesn't care.",
        eddie: "Barely registers him. The piano kid. Irrelevant.",
      },
      isGuilty: false,
    },
  ],
  locations: [
    {
      id: "main-floor",
      name: "The Main Floor",
      description:
        "Round tables crowd the floor like conspirators, each lit by a guttering candle. The bar runs along the left wall — mahogany, scarred, polished to a dull glow. The stage occupies the far end, microphone still warm. A haze of cigarette smoke hangs at shoulder height. Victor's reserved table sits empty near the stage, a half-finished drink still sweating on the coaster.",
      examinables: [
        {
          id: "ex-bar-surface",
          name: "the bar surface",
          surfaceDetail: "Rings from a hundred glasses. Tommy keeps it clean but it tells its own stories.",
          onExamine: "A well-worn bar. Bottles lined up like soldiers behind it. Tommy's rag sits folded neatly by the register. Nothing out of the ordinary — Tommy runs a tight ship.",
          clueId: null,
        },
        {
          id: "ex-victors-table",
          name: "Victor's reserved table",
          surfaceDetail: "A brass 'RESERVED' placard. The candle has burned to a stub. A glass with melted ice.",
          onExamine: "The table Victor sat at before heading upstairs. A rocks glass with diluted whiskey — this was his first drink of the evening, not the poisoned one. A folded napkin with a phone number scrawled on it: Marlene's dressing room extension.",
          clueId: null,
        },
        {
          id: "ex-stage-area",
          name: "the stage",
          surfaceDetail: "A microphone on a chrome stand. A piano, lid open. Sheet music scattered on the bench.",
          onExamine: "The stage is small — intimate. From the wings on the right side, you can see the back hallway that leads to the stairs. Anyone standing here during a performance could have seen someone heading upstairs. The sheet music is Eddie's — handwritten, meticulous.",
          clueId: null,
        },
        {
          id: "ex-cigarette-tray",
          name: "the ashtray on Victor's table",
          surfaceDetail: "Overflowing with cigarette butts. Victor was a chain smoker.",
          onExamine: "Mostly Chesterfields — Victor's brand. But one butt has a lipstick mark. Dark red. The same shade Marlene wears. She must have sat here at some point tonight.",
          clueId: null,
        },
      ],
      charactersPresent: ["tommy", "frank"],
    },
    {
      id: "victors-office",
      name: "Victor's Office",
      description:
        "A cramped room above the club, reached by a narrow staircase from the back hallway. Desk dominates the space — oak, heaped with papers and racing forms. A leather chair, pushed back as if its occupant stood suddenly. The whiskey glass sits on the desk, amber liquid catching the lamplight. A thin foam coats the rim. The air is close, warm, and carries a scent that doesn't belong — something floral beneath the stale smoke.",
      examinables: [
        {
          id: "ex-whiskey-glass",
          name: "the whiskey glass",
          surfaceDetail: "Half-empty. A thin foam at the rim that shouldn't be there.",
          onExamine: "The glass is Victor's usual — heavy crystal, monogrammed 'VM'. The whiskey has an unusual foam and, if you lean close, a faint bitter-almond smell beneath the peat. Classic cyanide signature. This was poured from the bottle on the desk, but something was added to it.",
          clueId: null,
        },
        {
          id: "ex-desk-papers",
          name: "the papers on the desk",
          surfaceDetail: "Racing forms, receipts, a ledger book. The chaos of a man who lived by his own rules.",
          onExamine: "Mostly financial records for the club. But tucked under the ledger: a life insurance document. Victor Morel, $50,000 policy, sole beneficiary: Dolores Morel. A handwritten note in the margin reads 'policy review requested — D.M.' The date is two weeks ago.",
          clueId: null,
        },
        {
          id: "ex-trash-bin",
          name: "the waste bin",
          surfaceDetail: "A wire basket by the desk. Crumpled papers, an empty cigarette pack.",
          onExamine: "You sift through the trash. Cigarette pack, balled-up racing forms, a coffee-stained napkin — and a movie ticket stub. The Orpheum Theater, tonight's date, 8:00 PM showing. The Orpheum has been closed for renovation since last Monday. Someone wanted this stub to be found, or forgot to dispose of it properly.",
          clueId: "clue-movie-stub",
        },
        {
          id: "ex-office-air",
          name: "the air in the room",
          surfaceDetail: "Stale smoke and something else — floral, out of place in this room.",
          onExamine: "Beneath the cigarette smoke and the bitter-almond edge of cyanide, there's a distinct perfume. Shalimar — warm, powdery, unmistakable. This isn't Marlene's scent (she wears Chanel No. 5). It's not a scent any man in this club would wear. Someone female was in this room recently, and she wore Shalimar.",
          clueId: "clue-perfume",
        },
        {
          id: "ex-filing-cabinet",
          name: "the filing cabinet",
          surfaceDetail: "Dented metal, three drawers. The top drawer is slightly ajar.",
          onExamine: "The top drawer contains personnel files for the club staff. The middle drawer has financial records going back years. The bottom drawer is locked — and scratched around the keyhole, as if someone tried to force it recently. Tommy mentions Victor kept 'personal insurance' in there — blackmail material.",
          clueId: null,
        },
      ],
      charactersPresent: [],
    },
    {
      id: "back-alley",
      name: "The Back Alley",
      description:
        "Narrow, wet, stinking of garbage and rain. A single bulb above the back door throws harsh shadows. The fire escape zigzags up to a window near Victor's office. A dumpster hunches against the opposite wall. Puddles reflect the light in oily rainbows. The back door stands open — Victor liked it that way.",
      examinables: [
        {
          id: "ex-dumpster",
          name: "the dumpster",
          surfaceDetail: "Overflowing. The lid won't close. Smells exactly like you'd expect.",
          onExamine: "You hold your breath and dig through the top layer. Kitchen waste, broken bottles, soggy cardboard — and a crumpled receipt from Henderson's Hardware on 4th Street, dated three days ago. One item: 'Warfarin Plus Rat Control, industrial grade.' Paid cash. The receipt has a partial thumbprint in what looks like grease. Warfarin Plus contains cyanide compounds.",
          clueId: "clue-rat-poison",
        },
        {
          id: "ex-fire-escape",
          name: "the fire escape",
          surfaceDetail: "Rust-orange iron ladder zigzagging up the brick wall. The bottom rung is six feet off the ground.",
          onExamine: "The fire escape connects to a window near Victor's office, but the window is painted shut from the inside. No one came in this way. However, the back stairs — an interior staircase accessible from the alley door — lead directly up to the office. The alley door has no lock.",
          clueId: null,
        },
        {
          id: "ex-puddles",
          name: "the puddles near the back door",
          surfaceDetail: "Rainwater pooling on cracked concrete. Footprints trail through them.",
          onExamine: "Multiple sets of footprints in the wet grime. Most are large — men's shoes. But one set is smaller, narrower — a woman's heel. The prints lead from the alley to the back door and back again. They're partially washed out by rain but distinct enough to see the pattern: someone in heels came and went tonight.",
          clueId: null,
        },
        {
          id: "ex-back-stairs",
          name: "the back stairs",
          surfaceDetail: "A narrow wooden staircase just inside the back door, leading up to the office hallway.",
          onExamine: "The stairs creak badly. Anyone going up would be heard — unless the music was loud enough to cover it. During a set, the bass and drums would drown out everything. On the third step, caught on a nail: a single thread of cream-colored silk.",
          clueId: null,
        },
      ],
      charactersPresent: [],
    },
    {
      id: "dressing-room",
      name: "The Dressing Room",
      description:
        "Backstage, through a door marked 'PRIVATE.' A vanity mirror ringed with bare bulbs, half of them burned out. Costumes hang on a rolling rack. The air smells of greasepaint, hairspray, and jasmine. A tip jar sits on the counter — the musicians' collective take from the evening.",
      examinables: [
        {
          id: "ex-vanity-mirror",
          name: "the vanity mirror and counter",
          surfaceDetail: "Cluttered with makeup, bobby pins, a half-empty coffee cup. A photo of a woman tucked into the mirror frame.",
          onExamine: "Marlene's station. The photo is of an older woman — her mother, based on the resemblance. Among the makeup: Chanel No. 5 perfume (not Shalimar). A telegram from Detroit: 'Treatment working. Send more when you can. Love, Mother.' Whatever Marlene is hiding, she has someone depending on her.",
          clueId: null,
        },
        {
          id: "ex-tip-jar",
          name: "the tip jar",
          surfaceDetail: "A large glass jar, half-full of bills and coins. A piece of tape reads 'TIPS — SPLIT FRIDAY.'",
          onExamine: "The jar seems light for a busy Saturday night. A quick count suggests about $40 — but the club was packed. Tommy mentioned the tips have been short lately. Someone's been skimming. A small notebook tucked behind the jar has careful tallies in Marlene's handwriting — she's been tracking exactly how much she takes.",
          clueId: null,
        },
        {
          id: "ex-costume-rack",
          name: "the costume rack",
          surfaceDetail: "Sequined dresses, a feather boa, a man's spare shirt. The usual backstage clutter.",
          onExamine: "Marlene's stage costumes. A spare dress for Eddie — he keeps a clean shirt here for performances. Nothing remarkable, except: on the floor beneath the rack, a crumpled playbill from the Orpheum Theater. An old one, from last month. Someone was thinking about the Orpheum recently.",
          clueId: null,
        },
        {
          id: "ex-marlenes-purse",
          name: "Marlene's purse",
          surfaceDetail: "A beaded clutch, left open on the counter.",
          onExamine: "Lipstick (dark red — matches the cigarette butt downstairs), compact mirror, a small roll of cash ($87 in mixed bills — a lot for a singer to carry), and a folded letter. The letter is from Victor: 'Remember our arrangement. The photos stay safe as long as you do.' Dated last month. Blackmail.",
          clueId: null,
        },
      ],
      charactersPresent: ["marlene", "eddie"],
    },
  ],
  timeline: [
    {
      time: "8:00 PM",
      what: "The Blue Parrot opens for the evening. Tommy behind the bar, Eddie at the piano for warm-up.",
      who: ["tommy", "eddie"],
      where: "main-floor",
      witnessedBy: ["tommy", "eddie"],
      significance: "Establishes who was present from the start.",
    },
    {
      time: "8:30 PM",
      what: "Victor arrives and heads to his reserved table. Orders his usual — rye whiskey, neat.",
      who: ["tommy"],
      where: "main-floor",
      witnessedBy: ["tommy", "eddie"],
      significance: "Victor drinks from a clean glass. The poison hasn't been introduced yet.",
    },
    {
      time: "9:00 PM",
      what: "Frank Palazzo arrives and takes his usual table. Sends a drink to Victor — a peace offering before business.",
      who: ["frank"],
      where: "main-floor",
      witnessedBy: ["tommy", "marlene"],
      significance: "Frank's presence is established early. He has public motive.",
    },
    {
      time: "9:15 PM",
      what: "Frank and Victor have an intense, whispered conversation at Victor's table. Victor looks agitated.",
      who: ["frank"],
      where: "main-floor",
      witnessedBy: ["eddie", "marlene"],
      significance: "Establishes Frank's motive. But this is before the murder — Victor is still alive and well.",
    },
    {
      time: "9:30 PM",
      what: "Victor goes upstairs to his office. Tommy brings up a fresh bottle of rye. Victor pours himself a drink from it.",
      who: ["tommy"],
      where: "victors-office",
      witnessedBy: ["tommy"],
      significance: "The bottle is clean at this point. Tommy sees Victor alive and drinking safely.",
    },
    {
      time: "9:45 PM",
      what: "Marlene's first set begins. The club is packed. All eyes on the stage.",
      who: ["marlene", "eddie"],
      where: "main-floor",
      witnessedBy: ["tommy", "frank"],
      significance: "Marlene and Eddie are accounted for during the first set.",
    },
    {
      time: "10:15 PM",
      what: "Dolores parks her car a block from the club. Eddie, stepping outside for air, notices the car but doesn't think much of it.",
      who: ["dolores"],
      where: "back-alley",
      witnessedBy: ["eddie"],
      significance: "Places Dolores near the club. Eddie is a reluctant witness.",
    },
    {
      time: "10:30 PM",
      what: "First set ends. Tommy goes to the stockroom. Eddie steps outside to make a phone call — Dolores calls to say she's coming in.",
      who: ["tommy", "eddie"],
      where: "main-floor",
      witnessedBy: [],
      significance: "The gap. Tommy is in the stockroom, Eddie is on the phone. Neither can account for each other.",
    },
    {
      time: "10:40 PM",
      what: "Dolores enters through the back alley. Goes up the back stairs to Victor's office. Swaps his whiskey glass with her prepared flask.",
      who: ["dolores"],
      where: "victors-office",
      witnessedBy: [],
      significance: "THE MURDER. No direct witnesses. The music is between sets but the club chatter provides cover.",
    },
    {
      time: "10:45 PM",
      what: "Dolores leaves back down the stairs and out the alley door. Second set begins shortly after.",
      who: ["dolores"],
      where: "back-alley",
      witnessedBy: [],
      significance: "Dolores exits. Marlene glimpses a silhouette on the back stairs from the wings but can't identify who.",
    },
    {
      time: "10:50 PM",
      what: "Victor drinks from the poisoned glass. Cyanide takes effect within minutes.",
      who: [],
      where: "victors-office",
      witnessedBy: [],
      significance: "Time of death. Victor is alone. The poison was already in the glass waiting for him.",
    },
    {
      time: "11:30 PM",
      what: "Frank goes upstairs to make a final appeal to Victor about the debt. Finds him dead. Panics, wipes down surfaces, comes back down.",
      who: ["frank"],
      where: "victors-office",
      witnessedBy: ["tommy"],
      significance: "Frank contaminates the crime scene. Tommy sees him come downstairs looking pale.",
    },
    {
      time: "12:30 AM",
      what: "Club closes. Tommy goes upstairs to lock up and finds Victor dead at his desk.",
      who: ["tommy"],
      where: "victors-office",
      witnessedBy: [],
      significance: "Official discovery of the body. Tommy calls the police.",
    },
  ],
  clues: [
    {
      id: "clue-movie-stub",
      description:
        "A movie ticket stub from the Orpheum Theater, tonight's date, 8:00 PM showing. But the Orpheum has been closed for renovation since last Monday.",
      type: "documentary",
      foundAt: "victors-office",
      foundVia: "ex-trash-bin",
      eliminates: [],
      implicates: ["dolores"],
      proves:
        "Dolores's alibi is fabricated. She wasn't at the movies — the theater was closed.",
      chainPosition: 1,
    },
    {
      id: "clue-perfume",
      description:
        "The unmistakable scent of Shalimar perfume in Victor's office. Marlene wears Chanel No. 5. No other woman was supposedly in the club tonight. Only Dolores wears Shalimar.",
      type: "forensic",
      foundAt: "victors-office",
      foundVia: "ex-office-air",
      eliminates: ["marlene"],
      implicates: ["dolores"],
      proves:
        "A woman wearing Shalimar was in Victor's office tonight. Dolores is the only suspect who wears it.",
      chainPosition: 2,
    },
    {
      id: "clue-rat-poison",
      description:
        "A receipt from Henderson's Hardware for industrial-grade rat poison containing cyanide compounds. Purchased three days ago with cash. Partial thumbprint in grease.",
      type: "physical",
      foundAt: "back-alley",
      foundVia: "ex-dumpster",
      eliminates: [],
      implicates: ["dolores"],
      proves:
        "The murder was premeditated. Someone purchased the poison days in advance and disposed of the receipt near the club's back entrance.",
      chainPosition: 3,
    },
    {
      id: "clue-insurance",
      description:
        "Eddie reveals, under pressure, that Dolores had been asking him detailed questions about Victor's life insurance policy — how much it paid, whether it covered unnatural death, how quickly it would pay out.",
      type: "testimonial",
      foundAt: "eddie",
      foundVia: "conversation about Dolores's recent behavior",
      eliminates: ["eddie", "tommy", "frank", "marlene"],
      implicates: ["dolores"],
      proves:
        "Dolores had a specific financial motive and was researching the payout before Victor's death.",
      chainPosition: 4,
    },
    {
      id: "clue-heel-prints",
      description:
        "A set of women's heel prints in the wet grime of the back alley, leading to and from the back door.",
      type: "physical",
      foundAt: "back-alley",
      foundVia: "ex-puddles",
      eliminates: ["tommy", "frank", "eddie"],
      implicates: ["marlene", "dolores"],
      proves:
        "A woman entered and exited through the back alley tonight.",
      chainPosition: null,
    },
    {
      id: "clue-silk-thread",
      description:
        "A single thread of cream-colored silk caught on a nail on the third step of the back stairs.",
      type: "physical",
      foundAt: "back-alley",
      foundVia: "ex-back-stairs",
      eliminates: [],
      implicates: ["dolores"],
      proves:
        "Someone wearing cream silk used the back stairs. Frank saw a cream scarf on the back stairs — Dolores owns a cream silk scarf.",
      chainPosition: null,
    },
  ],
  contradictions: [
    {
      id: "contradiction-stairs",
      characterA: "tommy",
      claimA: "Nobody went upstairs after I brought Victor his bottle at 9:30. I would have seen them from the bar.",
      characterB: "eddie",
      claimB: "I saw someone on the back stairs around 10:45 — just a shape, moving quick. Could have been anyone.",
      truth:
        "Tommy was in the stockroom from 10:30–10:50 and couldn't see the back hallway. Dolores used the back stairs during that window.",
      resolvedByClue: "clue-perfume",
      significance:
        "Proves someone went upstairs during Tommy's gap. Combined with the perfume, it points to Dolores.",
    },
    {
      id: "contradiction-dolores-presence",
      characterA: "marlene",
      claimA: "I thought I saw Dolores in the audience during my first set, near the back. But it was dark and I was performing.",
      characterB: "frank",
      claimB: "Dolores wasn't here tonight. I know every face in this room. I would have noticed Victor's wife.",
      truth:
        "Dolores wasn't there during the first set. Marlene may have seen someone who looked similar. Dolores arrived during the second set and never entered the main floor — she used the back entrance only.",
      resolvedByClue: "clue-movie-stub",
      significance:
        "Establishes that Dolores's claimed alibi (home/movies) is the lie, not Marlene's uncertain sighting. Frank is correct that Dolores wasn't on the main floor.",
    },
    {
      id: "contradiction-eddie-break",
      characterA: "eddie",
      claimA: "I played both sets straight through. No breaks.",
      characterB: "eddie",
      claimB: "The club schedule posted backstage shows a 15-minute break between sets at 10:30 PM.",
      truth:
        "Eddie took the break. He was outside on the phone with Dolores, who told him she was coming to the club. He lied because admitting the call reveals his relationship with Dolores.",
      resolvedByClue: "clue-insurance",
      significance:
        "Eddie is lying to protect Dolores. Once his affair is exposed, his testimony about the insurance questions becomes available.",
    },
  ],
  redHerrings: [
    {
      description:
        "Frank Palazzo went upstairs to Victor's office and was seen by Tommy coming back down looking shaken. He has obvious mob connections and Victor owed his family money.",
      innocentExplanation:
        "Frank went upstairs to threaten Victor about the debt, but found him already dead. He wiped down the surfaces to remove his own fingerprints and left. His evasiveness is about contaminating the crime scene, not committing the murder.",
    },
    {
      description:
        "Tommy Greco, the bartender, handles all the drinks at the club, had a financial dispute with Victor over $5,000 in unpaid wages, and was the one who 'discovered' the body.",
      innocentExplanation:
        "Tommy's timeline clears him — he brought a clean bottle to Victor at 9:30 PM and didn't go upstairs again until closing. The poison was introduced later, in Victor's glass, not in the bottle. Tommy's nervousness is about his criminal record, not the murder.",
    },
  ],
  solution: {
    truth:
      "Dolores Morel murdered her husband Victor by poisoning his whiskey with cyanide. She purchased rat poison three days before, prepared a flask of laced whiskey, and drove to the club during Marlene's second set. While Tommy was in the stockroom and all eyes were on the stage, she entered through the unlocked back door, climbed the back stairs to Victor's office, and swapped his glass. She left the way she came. Victor drank the poisoned whiskey and was dead within minutes. Later that evening, Frank Palazzo went up to Victor's office to threaten him about gambling debts, found him already dead, and wiped down every surface he'd touched — contaminating the crime scene. Tommy discovered the body at closing time. Dolores's alibi — that she was at the Orpheum Theater — was fabricated; the theater had been closed for renovation all week.",
    moments: [
      {
        id: "moment-opening",
        time: "8:30 PM",
        isKnown: true,
        knownDescription: "Victor Morel arrives at the Blue Parrot. Takes his reserved table, orders his usual rye whiskey.",
        truth: { location: "main-floor", people: ["tommy"], description: "Victor arrives and settles in. Tommy serves him." },
        supportingClues: [],
        weight: 0,
      },
      {
        id: "moment-frank-argument",
        time: "9:15 PM",
        isKnown: true,
        knownDescription: "Frank Palazzo and Victor have an intense, whispered conversation at Victor's table. Victor looks agitated.",
        truth: { location: "main-floor", people: ["frank"], description: "Frank pressures Victor about the $15,000 gambling debt." },
        supportingClues: [],
        weight: 0,
      },
      {
        id: "moment-victor-office",
        time: "9:30 PM",
        isKnown: true,
        knownDescription: "Victor goes upstairs to his office. Tommy brings a fresh bottle of rye.",
        truth: { location: "victors-office", people: ["tommy"], description: "Victor retreats to his office. Tommy delivers a clean bottle — the poison hasn't been introduced yet." },
        supportingClues: [],
        weight: 0,
      },
      {
        id: "moment-break",
        time: "10:30 PM",
        isKnown: false,
        prompt: "What happened during the break between sets?",
        truth: {
          location: "back-alley",
          people: ["eddie", "dolores", "tommy"],
          description: "First set ends. Tommy goes to the stockroom to inventory a delivery. Eddie steps outside and calls Dolores on the phone — she tells him she's coming to the club. Dolores parks her car a block away.",
        },
        supportingClues: ["clue-insurance"],
        weight: 0.2,
      },
      {
        id: "moment-murder",
        time: "10:40 PM",
        isKnown: false,
        prompt: "What happened in Victor's office?",
        truth: {
          location: "victors-office",
          people: ["dolores"],
          description: "Dolores enters through the back alley door and climbs the back stairs while the second set covers the noise. She enters Victor's office and swaps his whiskey glass with her prepared flask of cyanide-laced whiskey. She leaves the same way she came.",
        },
        supportingClues: ["clue-movie-stub", "clue-perfume", "clue-rat-poison"],
        weight: 0.35,
      },
      {
        id: "moment-death",
        time: "10:50 PM",
        isKnown: false,
        prompt: "What happened to Victor?",
        truth: {
          location: "victors-office",
          people: [],
          description: "Victor drinks from the poisoned glass. Cyanide takes effect within minutes. He dies alone at his desk.",
        },
        supportingClues: [],
        weight: 0.15,
      },
      {
        id: "moment-frank-visit",
        time: "11:30 PM",
        isKnown: false,
        prompt: "Who went upstairs later that night, and what did they find?",
        truth: {
          location: "victors-office",
          people: ["frank"],
          description: "Frank goes upstairs to make one final threat about the debt. He finds Victor dead — slumped over the desk, foam on his lips. Frank panics, wipes down everything he touched to remove his fingerprints, and goes back downstairs looking pale.",
        },
        supportingClues: ["clue-silk-thread"],
        weight: 0.15,
      },
      {
        id: "moment-discovery",
        time: "12:30 AM",
        isKnown: true,
        knownDescription: "Club closes. Tommy goes upstairs to lock Victor's office and finds him dead at his desk. He calls the police.",
        truth: { location: "victors-office", people: ["tommy"], description: "Tommy discovers the body at closing time." },
        supportingClues: [],
        weight: 0,
      },
    ],
    evidenceChain: [
      {
        order: 1,
        clueId: "clue-movie-stub",
        whatItProves: "Dolores's alibi is fabricated — the theater was closed for renovation.",
      },
      {
        order: 2,
        clueId: "clue-perfume",
        whatItProves: "Places Dolores at the crime scene — only she wears Shalimar.",
      },
      {
        order: 3,
        clueId: "clue-rat-poison",
        whatItProves: "Proves the method and premeditation — cyanide-based poison purchased days before.",
      },
      {
        order: 4,
        clueId: "clue-insurance",
        whatItProves: "Proves motive and premeditation — Dolores had been asking about Victor's life insurance.",
      },
    ],
  },
};

export default mystery;
