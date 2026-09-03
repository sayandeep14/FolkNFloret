import { SmoothScroll } from "@/components/SmoothScroll";
import { Cursor } from "@/components/Cursor";
import { SceneMount } from "@/components/canvas/SceneMount";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { EpilogueTracker } from "@/components/EpilogueTracker";
import { Journey } from "@/components/sections/Journey";
import { Gallery } from "@/components/sections/Gallery";
import { Craft } from "@/components/sections/Craft";
import { Suites } from "@/components/sections/Suites";
import { Voices } from "@/components/sections/Voices";
import { Invitation } from "@/components/sections/Invitation";

export default function Home() {
  return (
    <SmoothScroll>
      {/* Code-split and client-only: the type should paint before the WebGL. */}
      <SceneMount />
      <div className="grain" aria-hidden="true" />
      <Cursor />

      <SiteHeader />

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

      <SiteFooter />
    </SmoothScroll>
  );
}
