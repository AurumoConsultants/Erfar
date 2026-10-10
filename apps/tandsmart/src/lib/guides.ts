// Patient-facing price guides. Prices are never written here — each guide
// lists åtgärdskoder and the page renders TLV's current referenspris for
// them from the database, so the guides stay correct when prices change.

export interface Guide {
  slug: string
  title: string
  description: string // meta description, ~150 chars
  intro: string
  codes: string[]
  sections: { heading: string; paragraphs: string[] }[]
  questions: string[]
}

export const GUIDES: Guide[] = [
  {
    slug: 'krona',
    title: 'Vad kostar en krona hos tandläkaren?',
    description: 'Referenspriser för tandstödda kronor och pelare, vad som påverkar priset och vilka frågor du bör ställa innan du säger ja.',
    intro: 'En krona är en "hätta" som täcker en tand som är för skadad för att lagas med en fyllning. Det är en av de vanligaste stora posterna i ett kostnadsförslag.',
    codes: ['800', '801', '802', '803', '807', '809', '707', '921', '922'],
    sections: [
      {
        heading: 'Vad påverkar priset?',
        paragraphs: [
          'Åtgärd 800 gäller när du får en krona i en käke, 801 när du får flera kronor i samma käke — då är referenspriset per krona lägre. Behövs en pelare för att förankra kronan tillkommer 802 eller 803.',
          'Kliniken sätter sitt eget pris. Tar den mer än referenspriset betalar du hela skillnaden själv — tandvårdsstödet räknas bara på referenspriset.',
        ],
      },
      {
        heading: 'Krona i stället för fyllning',
        paragraphs: [
          'Om tanden hade kunnat lagas med en fyllning men du eller tandläkaren väljer krona räknas det som en utbytesåtgärd (921 eller 922). Ersättningen beräknas då på fyllningens referenspris, inte kronans.',
        ],
      },
    ],
    questions: [
      'Varför räcker inte en fyllning för den här tanden?',
      'Vilket material blir kronan, och varför just det?',
      'Är det åtgärd 800 eller 801 — och hur många kronor gäller det?',
      'Hur länge är garantin på kronan?',
    ],
  },
  {
    slug: 'implantat',
    title: 'Vad kostar ett implantat?',
    description: 'Referenspriser för implantat, operation, implantatkronor och benuppbyggnad — och vad som gör att totalpriset ofta blir högre än väntat.',
    intro: 'Ett implantat är en skruv i käkbenet som ersätter en tandrot, och som sedan får en krona. Totalpriset består av flera åtgärder, och det är därför lätt att missa vad som ingår.',
    codes: ['420', '421', '423', '425', '850', '852', '853', '427', '428', '432', '433', '926'],
    sections: [
      {
        heading: 'Flera delar i samma behandling',
        paragraphs: [
          'En implantatbehandling består normalt av själva implantatet (420), operationen (421, 423 eller 425 beroende på antal) och kronan på implantatet (850 eller 852). Behöver käkbenet byggas upp tillkommer benaugmentation (427–433).',
          'Be om ett kostnadsförslag där varje del står med åtgärdskod, så att du kan se exakt vad som ingår.',
        ],
      },
      {
        heading: 'Implantat i stället för bro',
        paragraphs: [
          'Ersätter implantatet en enda saknad tand där en tandstödd bro hade gett ersättning, kan det räknas som en utbytesåtgärd (926). Stödet beräknas då på broalternativet.',
        ],
      },
    ],
    questions: [
      'Vilka åtgärdskoder ingår i totalpriset — operation, implantat, distans och krona?',
      'Behövs benuppbyggnad, och ingår den i priset?',
      'Vilket implantatsystem används, och hur länge gäller garantin?',
      'Finns det alternativ, till exempel bro eller avtagbar protes, och vad kostar de?',
    ],
  },
  {
    slug: 'rotfyllning',
    title: 'Vad kostar en rotfyllning?',
    description: 'Referenspriser för rotbehandling med en till fyra rotkanaler, akut behandling och tilläggsåtgärder.',
    intro: 'Vid en rotbehandling rensas och fylls tandens rotkanaler när nerven är inflammerad eller död. Priset styrs främst av hur många rotkanaler tanden har.',
    codes: ['501', '502', '503', '504', '520', '521', '522', '523', '541'],
    sections: [
      {
        heading: 'Antalet rotkanaler avgör',
        paragraphs: [
          'Framtänder har ofta en rotkanal (501), medan kindtänder kan ha tre eller fler (503, 504). Akut behandling när det gör ont (521) är en egen åtgärd som ofta görs före själva rotfyllningen.',
          'En rotfylld kindtand behöver ibland en krona efteråt för att inte spricka — fråga om det ingår i planen och vad det kostar.',
        ],
      },
    ],
    questions: [
      'Hur många rotkanaler har tanden, och vilken åtgärdskod blir det?',
      'Hur bedömer du chansen att rotfyllningen lyckas?',
      'Behövs en krona efteråt?',
      'Vad är alternativet om tanden inte går att rädda?',
    ],
  },
  {
    slug: 'fyllning',
    title: 'Vad kostar en fyllning?',
    description: 'Referenspriser för fyllningar på fram- och kindtänder med en, två eller tre ytor, och alternativ till traditionell fyllning.',
    intro: 'En fyllning lagar ett hål i tanden. Priset beror på hur många av tandens ytor som lagas och om det är en framtand eller en kindtand.',
    codes: ['701', '702', '703', '704', '705', '706', '708', '321', '322'],
    sections: [
      {
        heading: 'Antal ytor och typ av tand',
        paragraphs: [
          'Åtgärd 701–703 gäller framtänder och hörntänder, 704–706 kindtänder (molarer och premolarer). Ju fler ytor som lagas, desto högre referenspris.',
          'Tidiga kariesangrepp kan ibland behandlas utan att borra (321), och djupa angrepp kan behandlas stegvis (322).',
        ],
      },
    ],
    questions: [
      'Hur många ytor gäller det, och vilken åtgärdskod blir det?',
      'Går angreppet att stoppa utan fyllning?',
      'Vilket fyllningsmaterial används?',
    ],
  },
  {
    slug: 'bro-och-protes',
    title: 'Vad kostar en bro eller protes?',
    description: 'Referenspriser för broar, partiella och hela proteser samt lagning — så jämför du alternativen när tänder saknas.',
    intro: 'När en eller flera tänder saknas finns flera sätt att ersätta dem: tandstödd bro, avtagbar protes eller implantat. Priserna skiljer sig mycket åt.',
    codes: ['800', '801', '804', '805', '822', '823', '824', '827', '828', '829', '832', '835'],
    sections: [
      {
        heading: 'Bro',
        paragraphs: [
          'En tandstödd bro består av kronor på granntänderna (800 eller 801) och en hängande led där tanden saknas (804). Granntänderna slipas ned, så det är ett beslut som är svårt att ångra.',
        ],
      },
      {
        heading: 'Protes',
        paragraphs: [
          'En avtagbar protes kan vara tillfällig (822, 823), partiell med metallskelett (824) eller hel (827, 828). Lagning och justering har egna åtgärdskoder.',
        ],
      },
    ],
    questions: [
      'Vilka alternativ finns för att ersätta tanden, och vad kostar de?',
      'Behöver friska tänder slipas ned?',
      'Hur länge brukar lösningen hålla, och vad kostar underhållet?',
    ],
  },
  {
    slug: 'tandreglering',
    title: 'Vad kostar tandreglering för vuxna?',
    description: 'Referenspriser för tandreglering i en eller två käkar beroende på behandlingstid.',
    intro: 'Tandreglering för vuxna betalas oftast själv, men ger ersättning från tandvårdsstödet när den är ersättningsberättigande. Priset styrs av antal käkar och hur lång den aktiva behandlingen är.',
    codes: ['900', '901', '902', '903', '904', '905', '906', '907', '908', '940'],
    sections: [
      {
        heading: 'En eller två käkar, kort eller lång behandling',
        paragraphs: [
          'Åtgärd 900–904 gäller en käke, 905–908 två käkar, och koden väljs efter hur lång den aktiva behandlingen beräknas bli.',
        ],
      },
    ],
    questions: [
      'Hur lång blir den aktiva behandlingen, och vilken åtgärdskod blir det?',
      'Ingår retention (att tänderna hålls på plats efteråt)?',
      'Är behandlingen ersättningsberättigande?',
    ],
  },
  {
    slug: 'undersokning',
    title: 'Vad kostar en undersökning hos tandläkaren?',
    description: 'Referenspriser för basundersökning, akut undersökning, röntgen och utredning hos tandläkare och tandhygienist.',
    intro: 'En undersökning är oftast början på allt — det är där vårdplanen och kostnadsförslaget tas fram.',
    codes: ['101', '103', '107', '108', '111', '113', '121', '123', '124'],
    sections: [
      {
        heading: 'Olika typer av undersökning',
        paragraphs: [
          'Basundersökning (101 hos tandläkare, 111 hos tandhygienist) är den vanliga återkommande kontrollen. Akut eller kompletterande undersökning (103) och omfattande undersökning (107) är egna åtgärder. Röntgen debiteras separat.',
        ],
      },
    ],
    questions: [
      'Vad ingår i undersökningen, och tillkommer röntgen?',
      'Hur ofta behöver jag komma på undersökning?',
    ],
  },
  {
    slug: 'hogkostnadsskydd',
    title: 'Så fungerar högkostnadsskyddet i tandvården',
    description: 'Hur det statliga högkostnadsskyddet räknas: 50 % mellan 3 000 och 15 000 kr, 85 % över 15 000 kr — räknat på referenspriset.',
    intro: 'Det statliga tandvårdsstödet består av allmänt tandvårdsbidrag (ATB) och ett högkostnadsskydd. Högkostnadsskyddet gör stora behandlingar billigare — men bara upp till referenspriset.',
    codes: [],
    sections: [
      {
        heading: 'Så räknas ersättningen',
        paragraphs: [
          'Under en ersättningsperiod på 12 månader läggs kostnaden för dina behandlingar ihop, räknat på referenspris. Upp till 3 000 kr betalar du själv. Mellan 3 000 och 15 000 kr får du 50 % i ersättning, och över 15 000 kr får du 85 %.',
          'Perioden startar vid den första behandlingen som räknas in. Planera därför stora behandlingar så att de hamnar inom samma period om det går.',
        ],
      },
      {
        heading: 'Referenspriset är taket',
        paragraphs: [
          'Tar kliniken mer än referenspriset för en åtgärd räknas ersättningen ändå bara på referenspriset. Skillnaden betalar du själv, och den räknas inte in i högkostnadsskyddet.',
          'Det allmänna tandvårdsbidraget (ATB) kan du använda till att betala vilken tandvård som helst hos en klinik som är ansluten till tandvårdsstödet.',
        ],
      },
    ],
    questions: [
      'När startade min ersättningsperiod, och hur mycket har redan räknats in?',
      'Kan behandlingen planeras så att den ryms inom samma period?',
      'Ligger klinikens priser över referenspris — och hur mycket betalar jag i så fall själv?',
    ],
  },
  {
    slug: 'tiotandvarden',
    title: 'Tiotandvården: så fungerar tandvårdsstödet från 67 år',
    description: 'Från 2026 betalar du som fyller 67 eller är äldre 10 % av referenspriset för tandvård. Så räknas det — och därför spelar klinikens pris stor roll.',
    intro: 'Sedan 1 januari 2026 får den som fyller 67 år eller är äldre särskild tandvårdsersättning: du betalar 10 % av referenspriset och staten resten.',
    codes: [],
    sections: [
      {
        heading: 'Därför spelar klinikens pris stor roll',
        paragraphs: [
          'Ersättningen räknas på referenspriset. Om kliniken tar mer än referenspriset betalar du hela skillnaden själv — utöver dina 10 %.',
          'Exempel: är referenspriset 6 825 kr betalar du ungefär 683 kr. Tar kliniken 9 000 kr betalar du i stället ungefär 683 + 2 175 = 2 858 kr. Skillnaden mellan kliniker blir alltså mycket större för dig än tidigare.',
        ],
      },
    ],
    questions: [
      'Följer kliniken referenspriserna, eller tar den mer?',
      'Hur mycket betalar jag själv för varje åtgärd i kostnadsförslaget?',
    ],
  },
]

export function getGuide(slug: string) {
  return GUIDES.find(g => g.slug === slug) ?? null
}
