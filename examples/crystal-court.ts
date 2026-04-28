/**
 * The Crystal Court
 *
 * A fantasy mystery set in the enchanted castle of Aethermere.
 * The Court Enchantress is found dead in her sanctum, her life-force
 * drained by forbidden siphoning magic. Five suspects, each with
 * secrets woven in starlight and shadow.
 */
import type { Mystery } from "../types/mystery";

const mystery: Mystery = {
  id: "crystal-court-001",
  title: "The Crystal Court",
  author: "manual",
  createdAt: 1745700000,
  difficulty: 3,
  description:
    "The Court Enchantress lies dead in her sealed sanctum, her life-force drained by forbidden magic. The wards were never breached — the killer walked through them. Five souls had the means, and every one of them had reason to want her silenced.",
  genre: "fantasy",
  setting: {
    name: "The Crystal Court of Aethermere",
    era: "A timeless realm of high magic and courtly intrigue",
    atmosphere:
      "Crystalline spires catch the light of three moons. Enchanted tapestries whisper the histories of dead kings. The air hums with residual magic — and tonight, something darker.",
  },
  crimeDescription:
    "Lady Seraphine Duskmantle, Court Enchantress of Aethermere, was found dead in her sealed sanctum at the stroke of the midnight bell. Her body bore no wounds, but her skin had turned to pale alabaster and her eyes were empty — the unmistakable signs of life-force siphoning, a magic forbidden for three centuries. The sanctum's wards were intact; only those keyed to the ward-stones could enter. The last spell she cast still hung in the air: a half-finished prophecy, its words dissolving like smoke.",

  characters: [
    {
      id: "herald-aldric",
      name: "Herald Aldric",
      description:
        "Tall and gaunt, with silver hair swept back from a high forehead. Wears the deep blue tabard of the Court Herald, embroidered with the three-moon sigil. His voice carries the weight of a thousand proclamations.",
      personality:
        "Formal, meticulous, deeply knowledgeable about court protocol and history. Treats every conversation as an official record. Quietly compassionate beneath the ceremony.",
      speechPattern:
        "Measured and precise, with archaic flourishes. Announces facts as if reading from a scroll. Occasionally drops into warmer, more personal tones when moved.",
      role: "narrator",
      interests: [
        "court protocol and ceremony",
        "the history of Aethermere",
        "the political dynamics between noble houses",
        "the ward-stone system and who holds access",
      ],
      dismissiveOf: [
        "idle gossip without substance",
        "speculation unsupported by evidence",
      ],
      motive:
        "None. Aldric served Seraphine faithfully and considered her the last true guardian of the old ways.",
      alibi: {
        claimed:
          "I was in the Herald's Gallery preparing the morning proclamations, as I do every evening.",
        truth:
          "He was indeed in the Herald's Gallery all evening, as multiple servants can confirm.",
        gaps: [],
      },
      meansAccess: false,
      opportunityWindow: "None — he was in the Herald's Gallery all evening.",
      whatTheySaw: [
        "Lord Caelum and Lady Seraphine arguing in the corridor outside the sanctum around the ninth bell",
        "Miravel the alchemist carrying an unusual crystalline apparatus toward the east wing after the tenth bell",
      ],
      whatTheyKnow: [
        "The ward-stones to Seraphine's sanctum are keyed to five people: Seraphine herself, Lord Caelum, Miravel, Thessaly, and Captain Voss",
        "Seraphine had been working on a prophecy that she said would 'reshape the succession'",
        "The Court has been in turmoil since the King fell ill — the succession is contested between Lord Caelum and his cousin Lady Ashara",
        "Life-force siphoning was banned after the Hollowing War three centuries ago — the texts describing it were supposedly destroyed",
      ],
      whatTheySuspect:
        "He will not speculate without evidence, but he notes that the succession prophecy gave several people reason to silence Seraphine before she could speak it.",
      secret: {
        description:
          "He has served the court for over two hundred years, sustained by a minor enchantment Seraphine maintained. With her death, he will age and die within months.",
        reason:
          "Revealing his enchantment would undermine his credibility as an impartial herald and raise questions about his loyalty to Seraphine specifically.",
        revealTrigger:
          "Asking directly about his age or why he seems so personally affected by Seraphine's death.",
      },
      relationships: {
        caelum:
          "Respects his station but finds his ambition troubling. A lord should serve the realm, not the other way around.",
        miravel:
          "Admires her brilliance but distrusts her obsession with forbidden knowledge. She pushes boundaries that exist for good reason.",
        thessaly:
          "Fond of the young seer. Sees in her the same gift Seraphine had at that age. Worries she is being used.",
        voss: "Trusts her completely. Captain Voss is the most honorable person in this castle.",
        rowan:
          "Pities the servant. Loyal to a fault, and loyalty in this court is a dangerous quality.",
      },
      isGuilty: false,
    },
    {
      id: "caelum",
      name: "Lord Caelum Ashvane",
      description:
        "Broad-shouldered, mid-forties, with a close-trimmed beard going silver at the edges. Wears a circlet of woven gold — the mark of the Heir Presumptive. His eyes are the pale blue of winter sky, and they miss nothing.",
      personality:
        "Commanding, politically shrewd, impatient with indirectness. Capable of genuine warmth but rarely shows it. Treats every interaction as a negotiation.",
      speechPattern:
        "Direct, clipped sentences. Uses 'we' when speaking of the realm. Drops into cold formality when cornered.",
      role: "suspect",
      interests: [
        "the succession and the future of Aethermere",
        "military strategy and the defense of the realm",
        "the King's illness and possible cures",
      ],
      dismissiveOf: [
        "magical theory and arcane minutiae",
        "servant gossip and petty court drama",
      ],
      motive:
        "Seraphine's unfinished prophecy was rumored to name his cousin Lady Ashara as the rightful heir, which would destroy his claim to the throne.",
      alibi: {
        claimed:
          "I retired to my chambers after the ninth bell. My valet can confirm I did not leave until the alarm was raised.",
        truth:
          "He left his chambers briefly around the tenth bell to meet with Captain Voss in the armory to discuss border defenses. He returned by the eleventh bell.",
        gaps: ["Tenth bell to eleventh bell — in the armory, not his chambers"],
      },
      meansAccess: true,
      opportunityWindow:
        "He holds a ward-stone to the sanctum — granted by the King years ago. He was unaccounted for between the tenth and eleventh bells.",
      whatTheySaw: [
        "Seraphine was agitated during their argument — she said something about 'the stars not lying' and 'a truth that would outlive them both'",
        "A faint violet glow from the direction of the east wing around the eleventh bell, visible from the armory window",
      ],
      whatTheyKnow: [
        "The prophecy, if completed, would have been binding — court law requires the monarch to honor a Court Enchantress's succession prophecy",
        "Miravel had been requesting access to the restricted archives for months, and Seraphine kept refusing",
        "Captain Voss and Seraphine had a private relationship that went beyond professional duty",
      ],
      whatTheySuspect:
        "He suspects Miravel. She had the knowledge, the obsession, and the motive — Seraphine was blocking her research. He will say this readily to deflect from himself.",
      secret: {
        description:
          "He already knows the prophecy's content — he bribed Thessaly to read the preliminary star-charts. The prophecy names neither him nor Ashara. It names a third claimant: the King's illegitimate child.",
        reason:
          "If this becomes known, it proves he had the strongest motive of anyone to silence Seraphine. It also reveals the existence of a rival claimant he has been trying to suppress.",
        revealTrigger:
          "Confronting him with evidence that he knew the prophecy's content before Seraphine's death, or pressing Thessaly about who she shared the star-charts with.",
      },
      relationships: {
        miravel:
          "Useful but dangerous. Her brilliance serves the court, but her ambition serves only herself.",
        thessaly:
          "A tool. Her gift is valuable, and he has cultivated her loyalty carefully. He does not think of her as a person.",
        voss: "Respects her as a soldier. Distrusts her closeness to Seraphine. A captain should serve the crown, not the enchantress.",
        rowan:
          "Invisible. Servants are furniture. He would not recognize Rowan in a crowd.",
      },
      isGuilty: false,
    },
    {
      id: "miravel",
      name: "Miravel Thornwick",
      description:
        "Slight, late thirties, with ink-stained fingers and eyes that seem to look through things rather than at them. Her robes are practical rather than ornamental — pockets bulging with vials and instruments. A burn scar traces her left forearm from wrist to elbow.",
      personality:
        "Brilliant, obsessive, socially awkward. Speaks in rapid bursts when excited about her work. Becomes evasive and defensive when questioned about ethics.",
      speechPattern:
        "Technical vocabulary peppered with alchemical metaphors. Speaks quickly, often correcting herself mid-sentence. Goes quiet and precise when lying.",
      role: "suspect",
      interests: [
        "alchemical transmutation and the boundaries of magical law",
        "the properties of crystalline resonance",
        "the theoretical foundations of life-force magic",
        "rare reagents and their applications",
      ],
      dismissiveOf: [
        "court politics and the succession",
        "superstition masquerading as tradition",
      ],
      motive:
        "Seraphine had blocked Miravel's access to the restricted archives, where texts on life-force transmutation were kept. Miravel believed these texts held the key to her life's work: the Philosopher's Crucible, a device that could transmute base matter into living crystal.",
      alibi: {
        claimed:
          "I was in my laboratory all evening, working on a crystalline resonance experiment. The experiment requires constant monitoring — I could not have left.",
        truth:
          "She left her laboratory around the tenth bell, carrying a crystalline siphoning apparatus she had secretly constructed. She entered Seraphine's sanctum using her ward-stone, performed the siphoning ritual, and returned to her laboratory before the eleventh bell.",
        gaps: [
          "Tenth bell to just before the eleventh bell — absent from her laboratory",
        ],
      },
      meansAccess: true,
      opportunityWindow:
        "She holds a ward-stone as Court Alchemist. She had the knowledge to perform the siphoning ritual and had secretly built the apparatus to do it.",
      whatTheySaw: [
        "Seraphine's sanctum glowing with an unusual amber light when Miravel passed by earlier in the evening — around the eighth bell, before the murder",
        "Rowan lingering near the sanctum door around the ninth bell, looking nervous",
      ],
      whatTheyKnow: [
        "The siphoning ritual requires a crystalline focus — without one, the life-force dissipates uselessly",
        "Seraphine had recently discovered something in the restricted archives that frightened her — she mentioned 'a pattern in the old texts' to Miravel",
        "The ward-stones leave a magical signature when used — anyone who checks the stones will know who entered the sanctum",
      ],
      whatTheySuspect:
        "She will deflect toward Lord Caelum — he had the political motive and the ward-stone access. She will emphasize the prophecy angle.",
      secret: {
        description:
          "She murdered Seraphine. She constructed a crystalline siphoning apparatus in secret, entered the sanctum during the second set of bells, and drained Seraphine's life-force to power the Philosopher's Crucible.",
        reason:
          "She is the killer. She will do anything to avoid being caught, including destroying evidence and misdirecting the investigation.",
        revealTrigger:
          "Accumulation of evidence: the crystalline apparatus, the ward-stone signature, the restricted archive texts she obtained illegally, and the residue in her laboratory.",
      },
      relationships: {
        caelum:
          "Useful patron. He funds her research without understanding it. She tolerates his condescension because she needs his influence.",
        thessaly:
          "Envies her natural gift. Miravel had to study for decades what Thessaly does instinctively. Respects her talent, resents the ease of it.",
        voss: "Indifferent. The captain is a blunt instrument — useful for keeping order, irrelevant to real work.",
        rowan:
          "Barely notices the servant. Rowan brings her meals and cleans her laboratory. That is the extent of their interaction.",
      },
      isGuilty: true,
    },
    {
      id: "thessaly",
      name: "Thessaly Brightwater",
      description:
        "Young, early twenties, with wide dark eyes that seem perpetually startled. Her hair is a tangle of auburn curls threaded with small crystal beads that chime softly when she moves. She carries herself like someone who expects to be overlooked.",
      personality:
        "Nervous, perceptive, genuinely kind. Her gift of foresight makes her anxious — she sees too much and understands too little. Brave when it matters, though she doesn't believe it of herself.",
      speechPattern:
        "Halting, with sudden bursts of clarity when a vision surfaces. Uses sensory language — colors, textures, temperatures — to describe what she perceives. Apologizes frequently.",
      role: "suspect",
      interests: [
        "the nature of prophecy and whether the future can be changed",
        "the stars and celestial patterns",
        "Seraphine's teachings and magical theory",
      ],
      dismissiveOf: [
        "political maneuvering and power games",
        "violence and military matters",
      ],
      motive:
        "Seraphine had been pushing Thessaly to develop her gift faster, using increasingly intense training methods. Thessaly feared Seraphine was using her as a tool rather than teaching her as a student.",
      alibi: {
        claimed:
          "I was in the observatory reading the stars. The alignment tonight was significant — I was recording it for Lady Seraphine's prophecy work.",
        truth:
          "She was in the observatory until the tenth bell, then went to the sanctum corridor to deliver her star-charts to Seraphine. She found the door sealed and left the charts outside. She returned to the observatory and fell asleep.",
        gaps: [
          "Brief period around the tenth bell — went to the sanctum corridor and back",
        ],
      },
      meansAccess: true,
      opportunityWindow:
        "She holds a ward-stone as Seraphine's apprentice. She was near the sanctum around the tenth bell.",
      whatTheySaw: [
        "A figure in dark robes moving through the east wing corridor toward the sanctum around the tenth bell — she couldn't see the face but the figure was carrying something that glowed faintly violet",
        "The stars showed an omen of betrayal earlier that evening — 'the Serpent constellation crossing the Crown'",
      ],
      whatTheyKnow: [
        "Seraphine's prophecy was nearly complete — she needed only one more celestial alignment to finish it",
        "Lord Caelum bribed her to share the preliminary star-charts, and she did, though she regrets it deeply",
        "Miravel had been asking Thessaly strange questions about life-force theory — 'hypothetically, how much energy does a human soul contain?'",
      ],
      whatTheySuspect:
        "She is terrified it was Miravel but cannot bring herself to accuse directly. She will describe the robed figure and the violet glow, hoping the investigator draws the conclusion.",
      secret: {
        description:
          "She sold the preliminary star-charts to Lord Caelum for fifty gold crowns. The charts revealed the prophecy's likely conclusion — a third claimant to the throne.",
        reason:
          "She needed the money to send to her family in the outer provinces, who are starving after the harvest failed. But selling prophecy materials is treason under court law.",
        revealTrigger:
          "Confronting her with evidence that Caelum knew the prophecy's content, or pressing her about her family's financial situation.",
      },
      relationships: {
        caelum:
          "Afraid of him. He is powerful and he owns her secret. She does what he asks because she has no choice.",
        miravel:
          "Unsettled by her. Miravel's questions about life-force made Thessaly's skin crawl, but she couldn't articulate why until now.",
        voss: "Trusts her. Captain Voss is kind in a gruff way — she checks on Thessaly and makes sure she eats.",
        rowan:
          "Friends. Rowan is the only person in the castle who treats Thessaly like a normal person, not a magical instrument.",
      },
      isGuilty: false,
    },
    {
      id: "voss",
      name: "Captain Elara Voss",
      description:
        "Athletic, late thirties, with close-cropped dark hair and a scar bisecting her left eyebrow. Wears the silver-and-black uniform of the Castle Guard with military precision. Her hands are calloused from sword work, and she stands like someone always ready to move.",
      personality:
        "Disciplined, loyal, direct to the point of bluntness. Hides deep emotion behind professional composure. Fiercely protective of those she considers under her charge.",
      speechPattern:
        "Short, declarative sentences. Military vocabulary. Pauses before answering personal questions, as if checking whether the information is classified.",
      role: "suspect",
      interests: [
        "castle security and the ward-stone system",
        "the safety of the court's inhabitants",
        "tactical assessment of threats",
      ],
      dismissiveOf: [
        "magical theory beyond practical application",
        "noble posturing and ceremonial nonsense",
      ],
      motive:
        "Seraphine had recently discovered that Voss had been secretly passing intelligence about the court's defenses to the border provinces — not treason, but an unauthorized communication channel with provincial militia commanders who Voss believed were being neglected by the crown.",
      alibi: {
        claimed:
          "I was on my evening patrol. The castle guard can confirm my rounds — I check every post personally.",
        truth:
          "She completed her patrol early and spent the tenth to eleventh bells in the armory with Lord Caelum, discussing border defense strategy. She did not go near the sanctum.",
        gaps: [
          "Tenth to eleventh bell — in the armory with Lord Caelum, not on patrol",
        ],
      },
      meansAccess: true,
      opportunityWindow:
        "She holds a ward-stone as Captain of the Guard. She was unaccounted for during the critical window, though she was with Caelum.",
      whatTheySaw: [
        "Miravel leaving her laboratory around the tenth bell, carrying a crystalline apparatus wrapped in cloth — unusual, as Miravel rarely leaves her lab at night",
        "The sanctum's ward-glow flickered around the tenth bell — she noticed it from the corridor during her patrol, before she went to the armory",
      ],
      whatTheyKnow: [
        "The ward-stones log every entry — the castle's master ward-stone in the gatehouse records which stones were used and when",
        "Seraphine had confronted her about the provincial communications two days ago and threatened to report her to Lord Caelum",
        "Seraphine and Voss had been lovers for three years, which ended badly a month ago when Seraphine chose duty over the relationship",
      ],
      whatTheySuspect:
        "She suspects Miravel. She saw Miravel with the apparatus and knows Miravel had the knowledge. But she is reluctant to accuse without proof — she is a soldier, not a gossip.",
      secret: {
        description:
          "She and Seraphine were lovers for three years. Seraphine ended it a month ago, saying her duty to the prophecy had to come first. Voss is devastated but hiding it behind professionalism.",
        reason:
          "Revealing the relationship makes her the prime suspect — a scorned lover with ward-stone access. It also exposes a vulnerability she cannot afford as Captain of the Guard.",
        revealTrigger:
          "Confronting her with evidence of the relationship (a letter, Seraphine's personal effects) or pressing on why she seems more affected than a professional relationship would warrant.",
      },
      relationships: {
        caelum:
          "Respects his authority, questions his judgment. He is too focused on the throne and not enough on the realm's actual threats.",
        miravel:
          "Distrusts her. Miravel's obsession with forbidden knowledge is a security risk. Voss has said so in official reports.",
        thessaly:
          "Protective. The girl is too young and too gifted for this court. Voss makes sure she is not exploited — or tries to.",
        rowan:
          "Appreciates the servant's quiet competence. Rowan sees everything and says nothing, which Voss respects.",
      },
      isGuilty: false,
    },
    {
      id: "rowan",
      name: "Rowan Ashfield",
      description:
        "Slight, early thirties, with mousy brown hair and the kind of face that slides out of memory the moment you look away. Wears the grey livery of the castle servants. Moves silently — a lifetime habit of not being noticed.",
      personality:
        "Observant, cautious, quietly resentful of the nobility. Loyal to individuals rather than institutions. Has a dry, dark humor that surfaces when comfortable.",
      speechPattern:
        "Deferential and brief with nobles. More natural and sardonic with equals. Chooses words carefully — says less than they know.",
      role: "suspect",
      interests: [
        "the hidden workings of the castle — passages, schedules, habits",
        "the welfare of the other servants",
        "the small kindnesses and cruelties of the nobility",
      ],
      dismissiveOf: [
        "grand magical theory and arcane posturing",
        "the succession debate — 'one noble is much like another to those who serve'",
      ],
      motive:
        "Seraphine had discovered that Rowan was stealing small enchanted objects from the castle and selling them in the outer provinces to support the servants' families. She threatened to have Rowan dismissed — or worse.",
      alibi: {
        claimed:
          "I was in the servants' quarters all evening, mending uniforms. The other servants can vouch for me.",
        truth:
          "Rowan left the servants' quarters around the ninth bell to deliver a tray to Seraphine's sanctum — a nightly routine. Seraphine was alive and working. Rowan returned to the servants' quarters by the tenth bell and did not leave again.",
        gaps: [
          "Ninth bell to tenth bell — delivering a tray to the sanctum, then returning",
        ],
      },
      meansAccess: false,
      opportunityWindow:
        "Rowan does not hold a ward-stone. The sanctum door was opened by Seraphine from inside when Rowan delivered the tray. Rowan could not have re-entered after leaving.",
      whatTheySaw: [
        "Seraphine was alive and working at the ninth bell — she was surrounded by floating star-charts and seemed excited about something",
        "Miravel's laboratory door was open when Rowan passed it around the tenth bell, and the laboratory was empty — unusual, as Miravel claimed to be there all evening",
        "A faint smell of burnt crystal in the east wing corridor near the sanctum, noticed when Rowan passed through around the tenth bell on the way back to the servants' quarters",
      ],
      whatTheyKnow: [
        "The servants' passage runs behind the east wing — you can hear what happens in the corridor, though you cannot see it",
        "Seraphine kept a personal journal in a hidden compartment in her desk — Rowan discovered it while cleaning",
        "Miravel has been receiving secret deliveries of rare crystalline reagents for weeks — Rowan helped carry them",
      ],
      whatTheySuspect:
        "Rowan suspects Miravel. The empty laboratory, the strange deliveries, the burnt crystal smell — it all points to the alchemist. But Rowan is a servant, and accusing a noble is dangerous.",
      secret: {
        description:
          "Rowan has been stealing small enchanted objects — warming stones, light-crystals, minor healing charms — and selling them to merchants who distribute them to the outer provinces where people are suffering.",
        reason:
          "The theft is a hanging offense. Seraphine's threat to expose Rowan was terrifying, but Rowan would rather hang than watch the servants' families freeze.",
        revealTrigger:
          "Confronting Rowan with evidence of the thefts, or asking about why Seraphine threatened them.",
      },
      relationships: {
        caelum:
          "Invisible to him, which suits Rowan fine. The less nobles notice you, the safer you are.",
        miravel:
          "Wary. Miravel treats servants like furniture, but Rowan has seen what's in those deliveries. Knowledge is its own kind of power.",
        thessaly:
          "Genuine friendship. Thessaly is the only noble who sees servants as people. Rowan would protect her.",
        voss: "Respects the captain. Voss is hard but fair — the only authority figure in the castle who treats servants with basic dignity.",
      },
      isGuilty: false,
    },
  ],

  locations: [
    {
      id: "sanctum",
      name: "The Enchantress's Sanctum",
      description:
        "A circular chamber at the top of the east tower, its walls lined with shelves of crystalline instruments and leather-bound grimoires. The ceiling is open to the sky through an enchanted dome that shows the stars even by day. Seraphine's body has been removed, but the room still hums with residual magic. Her desk dominates the center — a massive slab of moonstone, its surface etched with constellations. The air tastes of ozone and something sweeter, like burnt honey.",
      examinables: [
        {
          id: "ex-moonstone-desk",
          name: "the moonstone desk",
          surfaceDetail:
            "Etched with constellations that still faintly glow. Papers and star-charts are scattered across its surface.",
          onExamine:
            "The desk's surface is covered in Seraphine's meticulous star-charts — the prophecy work. Most are preliminary calculations, but one chart is circled in red ink with the notation: 'The third line. Not Caelum. Not Ashara. The hidden branch.' Whatever the prophecy revealed, it was neither candidate the court expected.",
          clueId: null,
          prerequisite: null,
        },
        {
          id: "ex-desk-compartment",
          name: "the hidden compartment in the desk",
          surfaceDetail:
            "A seam in the moonstone, barely visible, along the desk's left edge.",
          onExamine:
            "The compartment slides open with a touch — Seraphine's personal ward keyed it to respond to anyone investigating her death, a final precaution. Inside: a leather journal. The last entry, dated today, reads: 'M. asked again about the restricted texts. I refused again. She looked at me the way a wolf looks at a locked larder. I have moved the siphoning codex to the vault. If something happens to me, check M.'s laboratory for crystalline resonance apparatus — she has been building something.'",
          clueId: "clue-journal",
          prerequisite: "ex-moonstone-desk",
        },
        {
          id: "ex-residual-magic",
          name: "the residual magic in the air",
          surfaceDetail:
            "The air shimmers faintly, like heat haze. There is a sweet, burnt smell — not unpleasant, but wrong for this room.",
          onExamine:
            "The residual magic has two distinct signatures. The first is Seraphine's own — warm, golden, the signature of her prophecy work. The second is alien: cold, violet, with a crystalline resonance that makes your teeth ache. This is the siphoning magic. It leaves a distinctive trace — like a fingerprint in the aether. Any competent mage could match this signature to the caster's personal resonance.",
          clueId: "clue-magical-signature",
          prerequisite: null,
        },
        {
          id: "ex-ward-stone-panel",
          name: "the ward-stone panel by the door",
          surfaceDetail:
            "A crystalline panel set into the wall beside the sanctum door. It pulses with a slow, steady light.",
          onExamine:
            "The ward-stone panel records every entry. Tonight's log shows three entries: Seraphine at the seventh bell (normal — she began her evening work), Rowan at the ninth bell (the tray delivery — Seraphine opened from inside), and a third entry at the tenth bell. The third entry's ward-stone signature is partially obscured — someone used a masking enchantment — but the crystalline resonance pattern is unmistakable to anyone who has handled alchemical instruments.",
          clueId: "clue-ward-log",
          prerequisite: null,
        },
      ],
      charactersPresent: [],
    },
    {
      id: "laboratory",
      name: "The Alchemist's Laboratory",
      description:
        "A cluttered, sprawling workspace in the east wing, directly below the sanctum. Workbenches overflow with bubbling apparatus, crystalline arrays, and stacks of research notes. The walls are scorched in places from failed experiments. A large furnace dominates one corner, its coals still glowing. The air is thick with chemical fumes and the sharp tang of reagents.",
      examinables: [
        {
          id: "ex-workbench",
          name: "the main workbench",
          surfaceDetail:
            "Cluttered with vials, crystalline fragments, and pages of calculations. A cleared space in the center suggests something was recently removed.",
          onExamine:
            "The cleared space on the workbench is roughly the size and shape of a large crystalline apparatus — perhaps eighteen inches across. Scorch marks around the cleared area suggest whatever sat here generated significant heat. The surrounding notes are calculations about 'resonance transfer efficiency' and 'life-force to crystalline energy conversion ratios.' This is theoretical work on siphoning magic, barely disguised as academic research.",
          clueId: null,
          prerequisite: null,
        },
        {
          id: "ex-furnace",
          name: "the furnace",
          surfaceDetail:
            "A large alchemical furnace, its coals still hot. The door is slightly ajar.",
          onExamine:
            "The furnace is still warm. Inside, among the coals, you find the melted remains of a crystalline apparatus — someone tried to destroy it. But crystal doesn't melt cleanly; fragments remain, and they still hum with residual energy. The fragments have the same cold, violet resonance as the siphoning magic in the sanctum. This is the murder weapon, half-destroyed.",
          clueId: "clue-apparatus-fragments",
          prerequisite: null,
        },
        {
          id: "ex-furnace-ash",
          name: "the ash beneath the furnace grate",
          surfaceDetail:
            "Fine grey ash has accumulated beneath the grate. Something papery was burned recently.",
          onExamine:
            "Sifting through the ash, you find partially burned pages — research notes. Most are illegible, but one fragment survives: '...the codex describes the siphoning circle as requiring a living focus. The subject must be conscious for the transfer to complete. Seraphine's own wards will contain the energy — elegant, using the victim's protections against them...' This is a plan. Premeditated, detailed, and written in Miravel's distinctive cramped hand.",
          clueId: "clue-burned-notes",
          prerequisite: "ex-furnace",
        },
        {
          id: "ex-reagent-shelf",
          name: "the reagent shelf",
          surfaceDetail:
            "Rows of labeled jars and vials. Some are common alchemical supplies; others are marked with warning sigils.",
          onExamine:
            "Most reagents are standard alchemical supplies. But one section is conspicuously empty — the labels read 'Void Crystal Dust,' 'Essence of Nightshade,' and 'Condensed Starlight.' These are the three components required for a siphoning focus, according to the restricted texts. The jars are clean — recently emptied, not long-depleted.",
          clueId: null,
          prerequisite: null,
        },
      ],
      charactersPresent: ["miravel"],
    },
    {
      id: "observatory",
      name: "The Observatory",
      description:
        "A domed chamber at the top of the west tower, opposite the sanctum. The ceiling is a masterwork of enchanted glass that magnifies the stars a hundredfold. Brass instruments — astrolabes, orreries, celestial compasses — crowd every surface. Star-charts paper the walls, pinned with silver tacks. The room smells of ink and candle wax. A narrow cot in the corner suggests someone sleeps here more often than in proper quarters.",
      examinables: [
        {
          id: "ex-star-charts",
          name: "the star-charts on the walls",
          surfaceDetail:
            "Dozens of charts showing celestial alignments, annotated in two different hands — one precise and elegant, the other hasty and uncertain.",
          onExamine:
            "The elegant hand is Seraphine's; the uncertain one is Thessaly's. The most recent charts show tonight's alignment — the Serpent constellation crossing the Crown, which Thessaly noted as 'an omen of betrayal from within.' One chart has been torn down, leaving only its corner pinned to the wall. Someone removed a chart they didn't want seen.",
          clueId: null,
          prerequisite: null,
        },
        {
          id: "ex-torn-chart-corner",
          name: "the torn corner of the missing chart",
          surfaceDetail:
            "A small triangle of parchment still pinned to the wall. The edge is ragged — torn in haste.",
          onExamine:
            "The corner fragment shows part of a notation in Thessaly's hand: '...copy for Lord C. — 50gc...' This is a record of the transaction. Thessaly sold a copy of the preliminary prophecy charts to Lord Caelum for fifty gold crowns. The chart was torn down to hide the evidence.",
          clueId: "clue-chart-sale",
          prerequisite: "ex-star-charts",
        },
        {
          id: "ex-orrery",
          name: "the grand orrery",
          surfaceDetail:
            "A magnificent mechanical model of the celestial spheres, its crystal planets orbiting a golden sun. It hums softly.",
          onExamine:
            "The orrery is set to tonight's alignment. The Serpent constellation — represented by a chain of dark crystals — is indeed crossing the Crown. In Aethermere's astrological tradition, this alignment occurs once every forty-seven years and signifies 'a hidden truth revealed through sacrifice.' Seraphine chose tonight specifically to complete the prophecy because of this alignment.",
          clueId: null,
          prerequisite: null,
        },
        {
          id: "ex-thessalys-cot",
          name: "the cot in the corner",
          surfaceDetail:
            "A narrow cot with rumpled blankets. A small chest sits beside it.",
          onExamine:
            "The chest contains Thessaly's personal belongings: a few changes of clothes, a bundle of letters from her family in the outer provinces (describing hardship and hunger), and a small pouch containing twelve gold crowns — the remainder of the fifty she received from Lord Caelum, after sending most of it home.",
          clueId: null,
          prerequisite: null,
        },
      ],
      charactersPresent: ["thessaly"],
    },
    {
      id: "great-hall",
      name: "The Great Hall",
      description:
        "A vast chamber of polished stone and enchanted tapestries that ripple with scenes from Aethermere's history. The three-moon sigil blazes in stained glass above the throne dais. Long tables line the hall, still set from the evening meal. Candles float near the vaulted ceiling, casting warm light that makes the shadows dance. The herald's podium stands near the entrance, and the castle guard's post flanks the main doors.",
      examinables: [
        {
          id: "ex-tapestries",
          name: "the enchanted tapestries",
          surfaceDetail:
            "The tapestries show scenes from Aethermere's history. They shift and move, replaying key moments in an endless loop.",
          onExamine:
            "Most tapestries show ancient history — coronations, battles, treaties. But one tapestry near the east corridor entrance has been behaving strangely tonight. Instead of its usual scene (the founding of the Crystal Court), it keeps replaying a recent moment: a figure in dark robes walking through the east corridor carrying something that glows violet. The tapestries are enchanted to record significant events — this one captured the killer's passage.",
          clueId: null,
          prerequisite: null,
        },
        {
          id: "ex-tapestry-detail",
          name: "the figure in the tapestry",
          surfaceDetail:
            "The replaying scene shows a robed figure, but the face is hidden by a deep hood.",
          onExamine:
            "Watching the tapestry loop several times, you notice details: the figure's left sleeve rides up as they shift the glowing object, revealing a distinctive burn scar from wrist to elbow. The scar matches Miravel Thornwick's — the result of a laboratory accident she has never bothered to conceal. The tapestry has captured the killer walking to the sanctum with the siphoning apparatus.",
          clueId: "clue-tapestry-witness",
          prerequisite: "ex-tapestries",
        },
        {
          id: "ex-guard-post",
          name: "the guard post by the main doors",
          surfaceDetail:
            "A small desk with a duty roster and a logbook. The guard on duty is elsewhere — called away by the alarm.",
          onExamine:
            "The duty logbook records comings and goings through the main hall. Tonight's entries show Lord Caelum passing through toward the armory at the tenth bell, and Captain Voss following shortly after. Both returned around the eleventh bell. No entry for Miravel — but the east wing has its own corridor, accessible without passing through the great hall.",
          clueId: null,
          prerequisite: null,
        },
        {
          id: "ex-heralds-podium",
          name: "the herald's podium",
          surfaceDetail:
            "A carved wooden podium with the three-moon sigil. Scrolls and proclamations are neatly organized on its shelf.",
          onExamine:
            "Among the proclamations is a draft of tomorrow's morning announcement — Herald Aldric was preparing it when the alarm sounded. It includes a note in Aldric's hand: 'Lady Seraphine requested a formal audience for tomorrow at the noon bell. Purpose: to deliver a completed prophecy regarding the succession. Attendance mandatory for all ward-stone holders.' She was going to announce the prophecy publicly. Someone made sure she never got the chance.",
          clueId: null,
          prerequisite: null,
        },
      ],
      charactersPresent: ["herald-aldric", "caelum", "voss", "rowan"],
    },
  ],

  timeline: [
    {
      time: "Seventh bell (7:00 PM)",
      what: "Seraphine enters her sanctum and begins the evening's prophecy work. The celestial alignment is approaching.",
      who: [],
      where: "sanctum",
      witnessedBy: [],
      significance:
        "Seraphine begins her final session. The sanctum wards are activated.",
    },
    {
      time: "Eighth bell (8:00 PM)",
      what: "Miravel passes the sanctum and notices an unusual amber glow — Seraphine's prophecy magic at full power.",
      who: ["miravel"],
      where: "sanctum",
      witnessedBy: ["miravel"],
      significance:
        "Establishes Miravel's awareness of Seraphine's location and activity.",
    },
    {
      time: "Ninth bell (9:00 PM)",
      what: "Lord Caelum and Seraphine argue in the corridor outside the sanctum. Seraphine says the prophecy will 'reshape the succession.' Caelum is agitated.",
      who: ["caelum"],
      where: "sanctum",
      witnessedBy: ["herald-aldric"],
      significance:
        "Establishes Caelum's motive — the prophecy threatens his claim. But this is before the murder.",
    },
    {
      time: "Ninth bell, later",
      what: "Rowan delivers Seraphine's nightly tray to the sanctum. Seraphine opens the door from inside, accepts the tray, and Rowan leaves. Seraphine is alive and excited about her work.",
      who: ["rowan"],
      where: "sanctum",
      witnessedBy: ["rowan"],
      significance:
        "Last confirmed sighting of Seraphine alive. Rowan sees her working and in good spirits.",
    },
    {
      time: "Tenth bell (10:00 PM)",
      what: "Miravel leaves her laboratory carrying the crystalline siphoning apparatus wrapped in cloth. She enters the sanctum using her ward-stone and performs the siphoning ritual on Seraphine.",
      who: ["miravel"],
      where: "sanctum",
      witnessedBy: [],
      significance:
        "THE MURDER. Miravel drains Seraphine's life-force using the forbidden apparatus. No direct witnesses, but the ward-stone logs the entry and the tapestry captures her passage.",
    },
    {
      time: "Tenth bell, shortly after",
      what: "Thessaly leaves the observatory to deliver star-charts to the sanctum. She sees a robed figure with a violet-glowing object in the east corridor. She finds the sanctum door sealed and leaves the charts outside.",
      who: ["thessaly"],
      where: "sanctum",
      witnessedBy: [],
      significance:
        "Thessaly is a near-witness. She sees the killer but cannot identify them in the dark corridor.",
    },
    {
      time: "Tenth to eleventh bell",
      what: "Lord Caelum and Captain Voss meet in the armory to discuss border defenses. Both are away from their claimed locations but can alibi each other.",
      who: ["caelum", "voss"],
      where: "great-hall",
      witnessedBy: ["caelum", "voss"],
      significance:
        "Caelum and Voss alibi each other for the critical window, though both lied about their whereabouts initially.",
    },
    {
      time: "Midnight bell",
      what: "The castle's midnight ward-check reveals the sanctum's life-ward has failed — meaning no living person is inside. Guards investigate and find Seraphine dead.",
      who: [],
      where: "sanctum",
      witnessedBy: [],
      significance:
        "Discovery of the body. The alarm is raised and the investigation begins.",
    },
  ],

  clues: [
    {
      id: "clue-journal",
      description:
        "Seraphine's personal journal, found in a hidden desk compartment. The last entry names 'M.' as a threat and describes a crystalline resonance apparatus being built in secret.",
      type: "documentary",
      foundAt: "sanctum",
      foundVia: "ex-desk-compartment",
      eliminates: [],
      implicates: ["miravel"],
      proves:
        "Seraphine knew Miravel was building something dangerous and feared for her safety. She specifically named Miravel as a threat.",
      chainPosition: 1,
    },
    {
      id: "clue-magical-signature",
      description:
        "The siphoning magic left a cold, violet, crystalline resonance signature in the sanctum — a magical fingerprint that can be matched to the caster.",
      type: "forensic",
      foundAt: "sanctum",
      foundVia: "ex-residual-magic",
      eliminates: ["caelum", "thessaly", "rowan"],
      implicates: ["miravel"],
      proves:
        "The siphoning was performed by someone with a crystalline magical resonance — consistent with an alchemist, not a seer, soldier, or noble.",
      chainPosition: 2,
    },
    {
      id: "clue-ward-log",
      description:
        "The sanctum's ward-stone panel shows a third entry at the tenth bell, partially masked but with an unmistakable alchemical crystalline resonance pattern.",
      type: "forensic",
      foundAt: "sanctum",
      foundVia: "ex-ward-stone-panel",
      eliminates: ["rowan"],
      implicates: ["miravel"],
      proves:
        "Someone with an alchemist's resonance pattern entered the sanctum at the tenth bell — the time of the murder. The masking attempt shows premeditation.",
      chainPosition: 3,
    },
    {
      id: "clue-apparatus-fragments",
      description:
        "Melted fragments of a crystalline apparatus found in Miravel's furnace, still humming with the same violet siphoning resonance found in the sanctum.",
      type: "physical",
      foundAt: "laboratory",
      foundVia: "ex-furnace",
      eliminates: [],
      implicates: ["miravel"],
      proves:
        "The murder weapon was built in and partially destroyed in Miravel's laboratory. The resonance match is conclusive.",
      chainPosition: 4,
    },
    {
      id: "clue-burned-notes",
      description:
        "Partially burned research notes in Miravel's furnace describing the siphoning ritual in detail, including how to use the victim's own wards against them. Written in Miravel's hand.",
      type: "documentary",
      foundAt: "laboratory",
      foundVia: "ex-furnace-ash",
      eliminates: ["caelum", "voss", "thessaly", "rowan"],
      implicates: ["miravel"],
      proves:
        "Miravel planned the murder in detail, studying the forbidden siphoning ritual and specifically designing the attack to exploit Seraphine's own protections.",
      chainPosition: 5,
    },
    {
      id: "clue-chart-sale",
      description:
        "A torn chart corner in the observatory with Thessaly's notation recording the sale of prophecy charts to 'Lord C.' for fifty gold crowns.",
      type: "documentary",
      foundAt: "observatory",
      foundVia: "ex-torn-chart-corner",
      eliminates: [],
      implicates: ["caelum"],
      proves:
        "Lord Caelum knew the prophecy's content before Seraphine's death — he bribed Thessaly for the information. This gives him foreknowledge but also reveals a third claimant he wanted suppressed.",
      chainPosition: null,
    },
    {
      id: "clue-tapestry-witness",
      description:
        "An enchanted tapestry in the great hall captured the killer's passage: a robed figure carrying a violet-glowing object, with a distinctive burn scar visible on the left forearm — matching Miravel's laboratory scar.",
      type: "physical",
      foundAt: "great-hall",
      foundVia: "ex-tapestry-detail",
      eliminates: ["caelum", "voss", "thessaly", "rowan"],
      implicates: ["miravel"],
      proves:
        "The enchanted tapestry recorded Miravel walking to the sanctum with the siphoning apparatus. The burn scar is a positive identification.",
      chainPosition: null,
    },
  ],

  contradictions: [
    {
      id: "contradiction-miravel-alibi",
      characterA: "miravel",
      claimA:
        "I was in my laboratory all evening. The experiment requires constant monitoring — I could not have left.",
      characterB: "rowan",
      claimB:
        "I passed Miravel's laboratory around the tenth bell on my way back from the sanctum. The door was open and the laboratory was empty.",
      truth:
        "Miravel left her laboratory at the tenth bell to commit the murder. Rowan's observation directly contradicts Miravel's alibi.",
      resolvedByClue: "clue-ward-log",
      significance:
        "Proves Miravel lied about her whereabouts during the critical window. Combined with the ward-stone log, it places her at the sanctum.",
    },
    {
      id: "contradiction-caelum-location",
      characterA: "caelum",
      claimA:
        "I retired to my chambers after the ninth bell. My valet can confirm I did not leave.",
      characterB: "voss",
      claimB:
        "Lord Caelum was with me in the armory from the tenth bell to the eleventh, discussing border defenses.",
      truth:
        "Caelum lied about being in his chambers to avoid revealing his secret meeting with Voss. They were together in the armory — which actually alibis them both for the murder window.",
      resolvedByClue: "clue-chart-sale",
      significance:
        "Caelum's lie is about concealing his knowledge of the prophecy and his meeting with Voss, not about the murder. Once exposed, he and Voss actually clear each other.",
    },
    {
      id: "contradiction-thessaly-break",
      characterA: "thessaly",
      claimA:
        "I was in the observatory all evening reading the stars. I did not leave.",
      characterB: "thessaly",
      claimB:
        "She describes seeing a robed figure in the east corridor near the sanctum — which she could only have seen if she left the observatory.",
      truth:
        "Thessaly left the observatory around the tenth bell to deliver star-charts to Seraphine. She saw the killer in the corridor but is afraid to admit she was there because it places her near the crime scene.",
      resolvedByClue: "clue-journal",
      significance:
        "Thessaly is lying to protect herself from suspicion, not to hide guilt. Her testimony about the robed figure is crucial — she is a near-witness to the murder.",
    },
  ],

  redHerrings: [
    {
      description:
        "Lord Caelum had the strongest political motive — the prophecy threatened his claim to the throne. He holds a ward-stone, he argued with Seraphine hours before her death, and he lied about his whereabouts during the critical window.",
      innocentExplanation:
        "Caelum was in the armory with Captain Voss during the murder. His lie was about concealing his knowledge of the prophecy (obtained by bribing Thessaly) and his secret meeting with Voss, not about committing murder. He wanted to suppress the prophecy politically, not violently.",
    },
    {
      description:
        "Captain Voss had ward-stone access, a personal relationship with Seraphine that ended badly, and Seraphine had recently threatened to expose Voss's unauthorized communications with the border provinces. A scorned lover with means and motive.",
      innocentExplanation:
        "Voss was with Caelum in the armory during the murder window. Her grief is genuine — she still loved Seraphine despite the breakup. Her evasiveness is about protecting the secret of their relationship and her unauthorized provincial communications, not about murder.",
    },
  ],

  solution: {
    truth:
      "Miravel Thornwick, the Court Alchemist, murdered Lady Seraphine Duskmantle by draining her life-force using a forbidden crystalline siphoning apparatus. Miravel had been obsessed with completing the Philosopher's Crucible — a device to transmute base matter into living crystal — but the process required an enormous amount of life-force energy. When Seraphine repeatedly refused Miravel access to the restricted archives containing siphoning texts, Miravel obtained the knowledge through other means and secretly constructed the apparatus in her laboratory. At the tenth bell, while the castle's attention was elsewhere, Miravel entered the sanctum using her ward-stone, performed the siphoning ritual on Seraphine, and returned to her laboratory. She attempted to destroy the apparatus in her furnace and burned her research notes, but fragments of both survived. The enchanted tapestry in the great hall captured her passage, and the ward-stone log recorded her entry. Seraphine herself had suspected Miravel and left a warning in her personal journal.",
    moments: [
      {
        id: "moment-evening-begins",
        time: "Seventh bell",
        isKnown: true,
        knownDescription:
          "Lady Seraphine enters her sanctum to begin the evening's prophecy work. The celestial alignment she has been waiting for is approaching.",
        truth: {
          location: "sanctum",
          people: [],
          description:
            "Seraphine begins her final session of prophecy work, activating the sanctum wards.",
        },
        supportingClues: [],
        weight: 0,
      },
      {
        id: "moment-argument",
        time: "Ninth bell",
        isKnown: true,
        knownDescription:
          "Lord Caelum and Seraphine argue in the corridor outside the sanctum. She tells him the prophecy will 'reshape the succession.' He is visibly agitated.",
        truth: {
          location: "sanctum",
          people: ["caelum"],
          description:
            "Caelum confronts Seraphine about the prophecy. He already knows its content from Thessaly's charts but wants to pressure Seraphine into suppressing it.",
        },
        supportingClues: ["clue-chart-sale"],
        weight: 0,
      },
      {
        id: "moment-last-seen",
        time: "Ninth bell, later",
        isKnown: true,
        knownDescription:
          "Rowan delivers Seraphine's nightly tray. Seraphine is alive, working, and excited about the approaching alignment.",
        truth: {
          location: "sanctum",
          people: ["rowan"],
          description:
            "The last confirmed sighting of Seraphine alive. She opens the sanctum door from inside to accept the tray.",
        },
        supportingClues: [],
        weight: 0,
      },
      {
        id: "moment-preparation",
        time: "Tenth bell",
        isKnown: false,
        prompt:
          "What was happening in the castle as the tenth bell struck?",
        truth: {
          location: "laboratory",
          people: ["miravel", "caelum", "voss", "thessaly"],
          description:
            "Miravel wraps her crystalline siphoning apparatus in cloth and leaves her laboratory. Lord Caelum goes to the armory to meet Captain Voss. Thessaly prepares to leave the observatory to deliver star-charts to Seraphine.",
        },
        supportingClues: ["clue-apparatus-fragments"],
        weight: 0.15,
      },
      {
        id: "moment-murder",
        time: "Tenth bell, minutes later",
        isKnown: false,
        prompt: "What happened in the sanctum?",
        truth: {
          location: "sanctum",
          people: ["miravel"],
          description:
            "Miravel enters the sanctum using her ward-stone, applying a masking enchantment to partially obscure the entry log. She activates the siphoning apparatus, which uses Seraphine's own wards to contain the energy transfer. Seraphine's life-force is drained completely. Miravel takes the captured energy and leaves.",
        },
        supportingClues: [
          "clue-journal",
          "clue-magical-signature",
          "clue-ward-log",
          "clue-burned-notes",
        ],
        weight: 0.35,
      },
      {
        id: "moment-near-witness",
        time: "Tenth bell, shortly after",
        isKnown: false,
        prompt:
          "Who else was in the east wing, and what did they see?",
        truth: {
          location: "sanctum",
          people: ["thessaly"],
          description:
            "Thessaly arrives at the sanctum corridor to deliver her star-charts. She sees a robed figure carrying a violet-glowing object moving away through the corridor — Miravel returning to her laboratory. Thessaly finds the sanctum door sealed and leaves the charts outside, not realizing Seraphine is already dead.",
        },
        supportingClues: ["clue-tapestry-witness"],
        weight: 0.2,
      },
      {
        id: "moment-destruction",
        time: "Eleventh bell",
        isKnown: false,
        prompt:
          "What did the killer do after returning to safety?",
        truth: {
          location: "laboratory",
          people: ["miravel"],
          description:
            "Miravel returns to her laboratory and immediately begins destroying evidence. She feeds the siphoning apparatus into the furnace and burns her research notes. But crystal doesn't melt cleanly, and the furnace isn't hot enough to destroy everything. Fragments and partially burned pages survive.",
        },
        supportingClues: [
          "clue-apparatus-fragments",
          "clue-burned-notes",
        ],
        weight: 0.15,
      },
      {
        id: "moment-discovery",
        time: "Midnight bell",
        isKnown: true,
        knownDescription:
          "The castle's midnight ward-check reveals the sanctum's life-ward has failed. Guards investigate and find Seraphine dead — her skin turned to pale alabaster, her eyes empty.",
        truth: {
          location: "sanctum",
          people: [],
          description:
            "The automated ward-check detects no living presence in the sanctum. Guards break the seal and discover Seraphine's body.",
        },
        supportingClues: [],
        weight: 0,
      },
    ],
    evidenceChain: [
      {
        order: 1,
        clueId: "clue-journal",
        whatItProves:
          "Seraphine suspected Miravel and left a written warning naming her as a threat who was building a crystalline apparatus.",
      },
      {
        order: 2,
        clueId: "clue-magical-signature",
        whatItProves:
          "The siphoning magic has a crystalline alchemical resonance — matching Miravel's magical signature, not any other suspect's.",
      },
      {
        order: 3,
        clueId: "clue-ward-log",
        whatItProves:
          "The ward-stone log places someone with an alchemical resonance in the sanctum at the time of the murder, despite a masking attempt.",
      },
      {
        order: 4,
        clueId: "clue-apparatus-fragments",
        whatItProves:
          "The murder weapon was found partially destroyed in Miravel's own furnace, with matching siphoning resonance.",
      },
      {
        order: 5,
        clueId: "clue-burned-notes",
        whatItProves:
          "Miravel's own handwritten notes describe the siphoning ritual in detail, proving premeditation and specific knowledge of how to exploit Seraphine's wards.",
      },
    ],
  },
};

export default mystery;
