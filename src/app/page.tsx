import PublicShell from "@/components/PublicShell";
import Banner from "@/components/HomePage/Banner";
import Marquee from "@/components/HomePage/Marquee";
import WhoWeAre from "@/components/HomePage/WhoWeAre";
import RecentEvents from "@/components/HomePage/RecentEvents";
import Achievements from "@/components/HomePage/Achievements";

export default function HomePage() {
  return (
    <PublicShell>
      <Banner />
      <Marquee />
      <WhoWeAre />
      <RecentEvents />
      <Achievements />
    </PublicShell>
  );
}
