import { SmoothScroll } from "@/components/SmoothScroll";
import { SceneMount } from "@/components/canvas/SceneMount";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { EpilogueTracker } from "@/components/EpilogueTracker";
import { Journey } from "@/components/sections/Journey";
import { Collections } from "@/components/sections/Collections";
import { Craft } from "@/components/sections/Craft";
import { Voices } from "@/components/sections/Voices";
import { Invitation } from "@/components/sections/Invitation";

export default function Home() {
  return (
    <SmoothScroll>
      {/* Code-split and client-only: the type should paint before the WebGL. */}
      <SceneMount />
      <div className="grain" aria-hidden="true" />

      <SiteHeader />

      <main id="top">
        <Journey />
        <EpilogueTracker />

        <div className="content">
          <Collections />
          <Craft />
          <Voices />
          <Invitation />
        </div>
      </main>

      <SiteFooter />
    </SmoothScroll>
  );
}
