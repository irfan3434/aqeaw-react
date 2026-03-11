import NewsTicker from '../components/NewsTicker/NewsTicker'
import HeroBanner from '../components/HeroBanner/HeroBanner'
import Winners from '../components/Winners/Winners'
import AwardSchedule from '../components/AwardSchedule/AwardSchedule'
import SpotlightShowcase from '../components/SpotlightShowcase/SpotlightShowcase'
import QuoteSection from '../components/QuoteSection/QuoteSection'
import NewsEvents from '../components/NewsEvents/NewsEvents'




export default function Home() {
  return (
    <div>
      <NewsTicker />
      <HeroBanner />
      <Winners />
      <AwardSchedule />
      <SpotlightShowcase />
      <NewsEvents />
      <QuoteSection />   
      
    </div>
  )
}


