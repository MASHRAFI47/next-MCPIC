import dynamic from "next/dynamic";
import Banner from "@/components/HomePage/Banner";
import Marquee from "@/components/HomePage/Marquee";
import WhoWeAre from "@/components/HomePage/WhoWeAre";
import RecentEvents from "@/components/HomePage/RecentEvents";

const Achievements = dynamic(() => import("@/components/HomePage/Achievements"), {
  ssr: false,
});

export default function HomePage() {
  return (
    <>
      <Banner />
      <Marquee />
      <WhoWeAre />
      <RecentEvents />
      <Achievements />
    </>
  );
}
