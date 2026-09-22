/**
 * The long sunrise — page script, v5 (clarity pass).
 * Single source of copy for /sunrise. Derived from docs/cinematic-vision-brief.html (v3).
 * Every figure here traces to the brief's §06 verified data inventory — do not
 * add numbers that aren't in the brief without re-verification.
 *
 * v5 rewrite rule: anyone can read it once and get the point. Short sentences.
 * No clever punchlines, no analyst slang, no AI-sounding turns of phrase.
 * Figures locked. Layout, film cels, charts, and act order unchanged.
 *
 * Anchoring rule (KM): humanity/global scale is the protagonist; the "hearth"
 * is one human-scale vignette per act, each on a different continent;
 * Southeast Asia appears only as recurring "closer to home" insets.
 */

export interface BigNumberItem {
  value: string
  label: string
  sub?: string
  tone?: 'gold' | 'brand' | 'paper'
}

export interface ActMeta {
  numeral: string
  title: string
  era: string
  hearth: string
}

/** A loop-video establishing shot. Renders only once the asset exists. */
export interface FilmCelMeta {
  /** Basename under /public/sunrise/ — e.g. 'fire' → fire.mp4 (+ fire.jpg poster). */
  asset: string
  caption: string
}

export const PAGE_META = {
  title: 'The long sunrise. Half a million years of energy, and the century that changes it',
  description:
    'From the first fire to cheap solar, home batteries, and the work still ahead. A clear, data-backed story of how humans get power. Every number sourced. Every prediction dated.',
}

// ── Act I ────────────────────────────────────────────────────────────
export const ACT_1: ActMeta = {
  numeral: 'I',
  title: 'Fire, half a million years of tending',
  era: '500,000 BCE to 1900 · K about 0.4',
  hearth: 'a fire pit, anywhere on Earth',
}
export const ACT_1_CEL: FilmCelMeta = {
  asset: 'fire',
  caption: 'a fire, anywhere on Earth · half a million years, one scene',
}
export const ACT_1_COPY = {
  open: 'It begins with a fire that dies if no one feeds it. For half a million years, that was all the power we had.',
  body: [
    'A human body uses about a hundred watts, roughly a bright light bulb. That was our limit: our own muscles, then animals, then wind and falling water. For hundreds of generations, that limit barely changed.',
    'How much energy you had decided how long you lived, what you could build, and whether you had light at night. Light was expensive.',
  ],
  numbers: [
    { value: '~100 W', label: 'power used by one human body', sub: 'about a bright light bulb', tone: 'gold' },
    { value: '~58 hours', label: 'of work to buy one hour of reading light', sub: 'at an early fire (Nordhaus)', tone: 'paper' },
    { value: '~350,000×', label: 'more light from one hour of work today', sub: 'than in ancient Babylon', tone: 'brand' },
  ] satisfies BigNumberItem[],
  sea: 'In Jakarta or Manila, grandparents still remember when light cost real money. An hour of light once took days of wages. Now it is so cheap it barely shows on the bill.',
  ember: 'Fire needed tending. That was the deal for half a million years.',
}

// ── Act II ───────────────────────────────────────────────────────────
export const ACT_2: ActMeta = {
  numeral: 'II',
  title: 'Combustion. Coal, oil, and gas',
  era: '1700 to 2010 · K 0.4 to 0.72',
  hearth: 'the mill towns. Manchester 1850, Pittsburgh 1920, Shenzhen 1995',
}
export const ACT_2_CEL: FilmCelMeta = {
  asset: 'combustion',
  caption: 'the mill town. The same scene on three continents, across three centuries',
}
export const ACT_2_COPY = {
  open: 'Then we learned to burn old sunlight.',
  body: [
    'Coal, oil, and gas are sunlight that fell on plants long before people existed, buried underground, then burned a million times faster than it formed. In about two hundred years, energy use per person rose roughly ten times. The small fire became a furnace. The same picture appeared on three continents: smoke over the roofs, and under the smoke, people living better than anyone before them.',
    'The cost showed up in the air. Carbon dioxide is now 432 parts per million, and still rising. Even so, rich countries began to need less energy per person. In the United States the peak was 1979; use has fallen 15–20% since, while the economy doubled. What people wanted was never the fuel itself. It was cold food, a bright page, a heavy load moved. Getting more life from less fuel is progress too.',
  ],
  numbers: [
    { value: '~10×', label: 'more energy per person, in two centuries', tone: 'gold' },
    { value: '432 ppm', label: 'carbon dioxide in the air today', sub: 'still rising', tone: 'paper' },
    { value: '1979', label: 'US energy use per person peaked', sub: 'the economy has doubled since', tone: 'brand' },
  ] satisfies BigNumberItem[],
  sea: 'Southeast Asia is still on this climb. Coal makes 47% of its electricity, up from 37% in 2015. Here, this chapter is not the past. It is happening now.',
  servants:
    'Your body still uses about a hundred watts. Now add the power plants, cars, heaters, factories, and grids that work for the average person. All together, it is as if about 25 people were laboring full-time, day and night, just for you.',
}

// ── Interlude ────────────────────────────────────────────────────────
export const INTERLUDE: ActMeta = {
  numeral: '',
  title: 'The False Dawn',
  era: '1954 to 2021 · the doubt beat',
  hearth: 'three broken promises, then one close to home',
}
export const INTERLUDE_CEL: FilmCelMeta = {
  asset: 'false-dawn',
  caption: 'Vietnam, 2020 · a solar boom that stopped overnight',
}
export const INTERLUDE_COPY = {
  open: '"Too cheap to meter," they said of nuclear power in 1954.',
  body: [
    'It did not work out that way. The more nuclear plants the world built, the more each one cost, about three times higher as more were built (Grubler, 2010). The cost of sending a kilogram into space stayed flat for forty years. Concorde was sold as the future of flight. It ended in a museum.',
    'A closer case: Vietnam in 2020. In one year the country added about 9 GW of rooftop solar, among the fastest build-outs anywhere. Then the payment that rewarded solar power ended. The boom stopped almost overnight. Panels sat underused. Installers lost their work.',
    'Hold onto this when the next chapters feel certain. Fast growth is not a guarantee. Things we stamp out in factories, again and again, tend to get cheaper. Huge one-of-a-kind projects, built on site under thick rules, often do not. Nothing later in this story happens by itself.',
  ],
  curvesNote: 'Sources in the story above. Grubler 2010 on nuclear costs; launch prices flat from 1970 to 2010; solar and battery learning rates as labeled.',
}

// ── Act III ──────────────────────────────────────────────────────────
export const ACT_3: ActMeta = {
  numeral: 'III',
  title: 'The sun, direct. What we can measure',
  era: '2010 to 2035 · K 0.72 to 0.75',
  hearth: 'rooftops, everywhere at once',
}
export const ACT_3_CEL: FilmCelMeta = {
  asset: 'first-light',
  caption: 'morning light on a solar field · change you can measure',
}
/** Mid-act, at the storage beat — grid-scale packs restoring the noon watt. */
export const ACT_3_STORAGE_CEL: FilmCelMeta = {
  asset: 'megablock',
  caption: 'grid batteries at sunset · storing cheap noon for the evening',
}
export const ACT_3_COPY = {
  open: 'First light. From here, we stop guessing. We measure.',
  body: [
    'A solar panel cost $76 per watt in 1977. In 2025 it costs about nine cents. A battery pack cost $7,500 per kilowatt-hour in 1991. By late 2025 the pack price was $108 (BNEF), and the cheapest packs were near $50. At those prices a roof can make electricity.',
    'In 2025 the world added 647 GW of solar. The new electricity that came with it was the largest one-year jump from any power source in history. For the first time, wind and solar together made more of the world\'s electricity than coal.',
    'This is why batteries matter. When midday solar is very cheap and very common, the grid can have more power than it needs at noon. Prices fall. Sometimes power is almost worthless for an hour. Batteries solve that. They store the cheap midday power and use it after dark. That is why large grid batteries added about 300 GWh in 2025, up 51% in one year, from home wall units to huge battery farms on every continent.',
    'China installed 93 GW of solar in a single month of 2025, about a hundred panels every second. In Pakistan, families and shops imported more than 27 GW of panels on their own, about half the country\'s peak demand, with no national plan. When power costs nine cents a watt, people do not wait for permission.',
  ],
  /** Pulled out of the body as the act's giant-type moment. */
  pull: 'The first terawatt of solar took about 68 years. The third took about 1.3 years.',
  numbers: [
    { value: '$76 to $0.09', label: 'price per watt of solar panel, 1977 to 2025', tone: 'gold' },
    { value: '647 GW', label: 'solar added worldwide in 2025', sub: 'largest yearly jump in power ever recorded', tone: 'gold' },
    { value: '$108/kWh', label: 'battery pack price, Dec 2025', sub: 'down from $7,500 in 1991 (BNEF)', tone: 'brand' },
    { value: '+300 GWh', label: 'grid batteries added in 2025', sub: '+51% from the year before', tone: 'brand' },
  ] satisfies BigNumberItem[],
  sea: 'Southeast Asia\'s electricity use grows about 7% a year. Solar and wind still supply only about 4.5% of it. That share is growing about 35% a year. Jakarta\'s sun stays strong all year; Hamburg loses most of it in winter. About four billion people live under strong sun. They will need more power first. That is why battery.mom starts here.',
}

// ── Act IV ───────────────────────────────────────────────────────────
export const ACT_4: ActMeta = {
  numeral: 'IV',
  title: 'The compounding century. Energy, intelligence, orbit',
  era: '2025 to 2050 · K 0.75 to 0.85',
  hearth: 'a gigafactory floor, then a satellite bus',
}
/** Leads the act — the hearth is "a gigafactory floor, then a satellite bus". */
export const ACT_4_CEL: FilmCelMeta = {
  asset: 'gigafactory',
  caption: 'inside a battery factory · where cheaper power is made',
}
/** Mid-act, where the copy leaves the ground. */
export const ACT_4_ORBIT_CEL: FilmCelMeta = {
  asset: 'orbit',
  caption: 'the story leaves Earth · real hardware, not a movie still',
}
export const ACT_4_COPY = {
  open: 'Cheap energy runs more computers. More computers train smarter software. Smarter software helps design better machines, including machines that make energy cheaper. That loop is real. What follows marks fact and hope clearly.',
  body: [
    'What we can measure: data centers used about 485 TWh of electricity in 2025, and may reach about 950 TWh by 2030. Big technology companies spent more than $400 billion in 2025, more than the world spent finding and drilling oil and gas. Building computers and AI now outspends the hunt for new fossil fuel. Power and chips pull each other: chips need power; power investment follows the chips.',
    'What is still hard: clever software is not the same as clever hands. Battery and car factory lines are highly automated. Most building sites still run on people with tools. Machines learned to write and calculate before they learned to work well in dust, rain, and half-finished rooms.',
    'The loop has already left the ground. In orbit, a solar panel can collect five to eight times more energy than a typical panel on Earth. Collect it there. Do not send it home. A satellite can only get rid of heat by radiating it into space, which is slow. NASA\'s 2024 study found that beaming space solar down to Earth would cost 12 to 80 times more than making power on the ground. So the near-term idea is simple: use that power in space.',
    'We will use far more energy than we do today. That is not an accident. That is the goal. When energy is abundant, it stops being the hard limit on what we can attempt. It does not mean energy is free.',
  ],
  numbers: [
    { value: '485 to ~950 TWh', label: 'electricity used by data centers, 2025 to 2030', tone: 'brand' },
    { value: '>$400B', label: 'Big Tech spending, 2025', sub: 'more than global oil & gas drilling', tone: 'paper' },
    { value: '$55,000 to $100–200', label: 'cost to launch 1 kg, Shuttle to the Starship goal', sub: 'Falcon 9 today: about $2,700', tone: 'gold' },
  ] satisfies BigNumberItem[],
  receipts: [
    { date: 'Nov 2025', event: 'Starcloud-1 flies the first NVIDIA H100 computer chip to orbit.' },
    { date: 'Dec 2025', event: 'The first language model is trained in space.' },
    { date: 'Filed', event: 'SpaceX asks permission for a network of data-center satellites.' },
    { date: 'Early 2027', event: 'Google\'s Project Suncatcher plans to launch test AI chips with Planet.' },
  ],
  receiptsNote: 'The future often starts as a short list of things that already happened.',
}

// ── Coda ─────────────────────────────────────────────────────────────
export const CODA: ActMeta = {
  numeral: '',
  title: 'The swarm, a labeled dream',
  era: 'undated, by design',
  hearth: 'a dream, clearly labeled as one',
}
export const CODA_CEL: FilmCelMeta = {
  asset: 'swarm',
  caption: 'collectors gathering around a star · a dream, labeled as one',
}
export const CODA_COPY = {
  open: 'Before morning, one last look up. What follows is a dream, and it is labeled as one.',
  body: [
    'If machines ever build more machines in space, and none of that exists yet, solar collectors could slowly gather around the sun over centuries. Daylight becomes something people build. A full ring of collectors around the star. About twenty trillion times the power we use today.',
    'We put no year on this. It depends on ideas we have not proven. Physics still draws a ceiling, and it is worth seeing once:',
  ],
  line: 'One hour of sunlight on Earth is about one year of civilization\'s energy use.',
}

// ── Act V ────────────────────────────────────────────────────────────
export const ACT_5: ActMeta = {
  numeral: 'V',
  title: 'The Work',
  era: '2026 to 2040',
  hearth: 'your roof',
}
export const ACT_5_CEL: FilmCelMeta = {
  asset: 'morning',
  caption: 'morning',
}

export interface WorkItem {
  title: string
  stat: string
  body: string
}

export const ACT_5_COPY = {
  morning:
    'Cheap solar and batteries are real. Getting them onto a roof, into a car, or onto a grid still takes permits, installers, money, and time. None of that is automatic.',
  work: [
    {
      title: 'Building cells is not the bottleneck',
      stat: '1.59 TWh produced · factory capacity above 4 TWh',
      body: 'Factories already make more batteries than the market absorbs. The lag is use. Cars, homes, and storage projects have to buy and install them.',
    },
    {
      title: 'Grids and permits lag',
      stat: '~2.3 TW waiting to connect · median wait over 4 years',
      body: 'Many projects sit finished or ready while wires and paperwork catch up. That delay now blocks more progress than panel prices do.',
    },
    {
      title: 'Installed cost varies wildly for the same hardware',
      stat: '~$2.8/W in the US · ~$1/W in Australia',
      body: 'Same panels. Different labor, financing, and rules. That gap is where households and local policy decide the pace.',
    },
  ] satisfies WorkItem[],
  cards: [
    { href: '/calculators', title: 'Solar & storage planner', sub: 'Estimate size and payback for a bill.' },
    { href: '/ev', title: 'Electric vehicles', sub: 'Compare models sold in Southeast Asia.' },
    { href: '/bess', title: 'Home batteries', sub: 'Specs and prices.' },
  ],
  trustIntro: 'Nine dated predictions. Two of them bet against ideas we like. Wrong answers stay listed.',
  closing: 'It still ends with a fire someone tends. On a good day, that fire is a rooftop.',
}
