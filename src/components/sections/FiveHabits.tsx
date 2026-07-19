const HABITS = [
  ['Goals', 'A handful of weekly intentions, set on Monday, reviewed on Friday.'],
  ['Meditation', 'A few quiet minutes to notice the week you’re actually in.'],
  ['Gratitude', 'Three lines that make an ordinary week worth keeping.'],
  ['Exercise', 'Move most days — the habit with the strongest evidence behind it.'],
  ['Fasting', 'Give your body a rest between meals, most weeks.'],
] as const;

export default function FiveHabits() {
  return (
    <section id="habits" className="scroll-mt-24 border-t border-white/5 py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6 md:px-10">
        <h2 className="font-serif text-4xl tracking-tight text-white md:text-5xl">
          The five habits
        </h2>
        <p className="mt-4 max-w-xl text-base text-white/60">
          Not everything that can be tracked. Just the five that compound.
        </p>
        <dl className="mt-12 divide-y divide-white/5 border-y border-white/5">
          {HABITS.map(([name, line]) => (
            <div
              key={name}
              className="flex flex-col gap-1 py-5 sm:flex-row sm:items-baseline sm:gap-8"
            >
              <dt className="w-36 flex-none font-serif text-2xl text-warmhot">{name}</dt>
              <dd className="m-0 text-base leading-relaxed text-white/60">{line}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
