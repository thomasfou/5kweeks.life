import Hero from './components/Hero';
import Nav from './components/Nav';
import Download from './components/sections/Download';
import FiveHabits from './components/sections/FiveHabits';
import HowItWorks from './components/sections/HowItWorks';
import Science from './components/sections/Science';

export default function App() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <HowItWorks />
        <FiveHabits />
        <Science />
        <Download />
      </main>
    </>
  );
}
