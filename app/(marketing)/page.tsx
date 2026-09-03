import { EpilogueTracker } from "@/components/EpilogueTracker";
import { Journey } from "@/components/sections/Journey";
import { Gallery } from "@/components/sections/Gallery";
import { Craft } from "@/components/sections/Craft";
import { Suites } from "@/components/sections/Suites";
import { Voices } from "@/components/sections/Voices";
import { Invitation } from "@/components/sections/Invitation";

export default function Home() {
  return (
    <main id="top">
      <Journey />
      <EpilogueTracker />

      <div className="content">
        <Gallery />
        <Craft />
        <Suites />
        <Voices />
        <Invitation />
      </div>
    </main>
  );
}
