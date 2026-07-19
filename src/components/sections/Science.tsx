const EVIDENCE = [
  {
    habit: 'Exercise',
    claim:
      'Adults meeting physical-activity guidelines (150–300 minutes of moderate exercise a week) had 19–25% lower all-cause mortality over 30 years of follow-up in a cohort of more than 116,000 people.',
    source: 'Lee et al., Circulation, 2022',
  },
  {
    habit: 'Habits, together',
    claim:
      'Across the Nurses’ Health Study and the Health Professionals Follow-up Study, five low-risk lifestyle factors were associated with roughly 12–14 additional years of life expectancy at age 50.',
    source: 'Li et al., Circulation, 2018',
  },
  {
    habit: 'Meditation',
    claim:
      'Mindfulness meditation programs showed moderate evidence of improving anxiety, depression, and pain across 47 randomized trials with 3,515 participants.',
    source: 'Goyal et al., JAMA Internal Medicine, 2014',
  },
  {
    habit: 'Gratitude',
    claim:
      'Among 49,275 older adults, those in the highest third of gratitude scores had 9% lower all-cause mortality over four years of follow-up.',
    source: 'Chen et al., JAMA Psychiatry, 2024',
  },
  {
    habit: 'Fasting',
    claim:
      'Time-restricted eating has improved weight and blood pressure in some randomized trials, but findings are mixed and long-term outcomes are unproven. We treat it as the most experimental of the five.',
    source: 'e.g. Wilkinson et al., Cell Metabolism, 2020',
  },
];

/**
 * The one place on the site where the "do better than 4,000 weeks" case is
 * made — argued from published research, never asserted as a promise.
 */
export default function Science() {
  return (
    <section id="science" className="scroll-mt-24 border-t border-white/5 py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6 md:px-10">
        <h2 className="font-serif text-4xl tracking-tight text-white md:text-5xl">
          The science
        </h2>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/70">
          Four thousand weeks is an average, not a ceiling. 5k Weeks is named
          for a bet: that the habits you keep, week after week, can bend that
          number — and make the weeks themselves better. That’s an argument,
          not a promise. Here is the evidence behind it.
        </p>
        <ul className="mt-12 grid list-none gap-x-10 gap-y-10 p-0 md:grid-cols-2">
          {EVIDENCE.map((e) => (
            <li key={e.habit} className="border-l border-warm/30 pl-5">
              <h3 className="font-serif text-xl text-warmhot">{e.habit}</h3>
              <p className="mt-2 text-base leading-relaxed text-white/60">{e.claim}</p>
              <p className="mt-2 text-sm italic text-white/40">{e.source}</p>
            </li>
          ))}
        </ul>
        <p className="mt-12 max-w-2xl text-sm leading-relaxed text-white/40">
          None of this is a prescription, and none of it is guaranteed —
          associations aren’t destiny, and 5k Weeks is not medical advice. But
          the direction of the evidence is consistent: attention to a few
          basics, repeated weekly, is the closest thing there is to doing
          better than 4,000 weeks.
        </p>
      </div>
    </section>
  );
}
