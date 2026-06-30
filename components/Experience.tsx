"use client";

import { useState, useEffect, lazy, Suspense } from "react";
import { MotionConfig } from "motion/react";
import { ScrollProvider } from "@/lib/scroll-context";
import { TunerProvider } from "@/lib/tuner-context";
import { useDeviceCapability } from "@/lib/use-device-capability";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import BootSequence from "@/components/fx/BootSequence";
import FallbackStage from "@/components/fx/FallbackStage";
import CRTFrame from "@/components/fx/CRTFrame";
import CustomCursor from "@/components/fx/CustomCursor";
import ChannelGlitch from "@/components/fx/ChannelGlitch";
import Hero from "@/components/sections/Hero";
import Work from "@/components/sections/Work";
import About from "@/components/sections/About";
import Skills from "@/components/sections/Skills";
import Contact from "@/components/sections/Contact";

// Only load the WebGL fluid bundle when we've decided to use it.
const FluidCanvas = lazy(() => import("@/components/fx/FluidCanvas"));

export default function Experience() {
  const cap = useDeviceCapability();
  const [sceneReady, setSceneReady] = useState(false);

  // Gate the boot sequence on fluid-canvas readiness, with a timeout ceiling
  // so a stalled GL init never traps the visitor. No fluid → clear at once.
  useEffect(() => {
    if (!cap.ready) return;
    if (!cap.use3D) {
      setSceneReady(true);
      return;
    }
    const ceiling = setTimeout(() => setSceneReady(true), 4000);
    return () => clearTimeout(ceiling);
  }, [cap.ready, cap.use3D]);

  return (
    <MotionConfig reducedMotion="user">
      <ScrollProvider enabled={cap.ready}>
        <BootSequence active={!sceneReady} />

        {/* Skip link — first focusable element for keyboard users */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only left-4 top-4 z-[110] rounded-full bg-ink px-4 py-2 text-sm text-bg-raised"
        >
          Skip to content
        </a>

        {/* Backdrop layer — fixed full-viewport fluid over a static fallback.
            The fallback always renders behind; when the fluid sim is active it
            paints over it opaquely, and if the sim fails to init (e.g. a driver
            shader-compile error) the fallback shows through instead of a blank
            stage. Reduced-motion / weak-GPU paths skip the fluid entirely. */}
        <FallbackStage />
        {cap.ready && cap.use3D && (
          <Suspense fallback={null}>
            <FluidCanvas
              tier={cap.tier}
              bwUrl="/portrait-bw.webp"
              colorUrl="/portrait-color.webp"
              bgUrl="/bg-hero.webp"
              onReady={() => setSceneReady(true)}
            />
          </Suspense>
        )}

        {/* Tuner-driven nav: the rail (Nav) and the hero "NOW TUNED" readout
            share one channel state. Wrapping Nav + main + the glitch overlay
            (not the sections, which stay JSX children of <main>) keeps hover
            re-renders off the section bodies. */}
        <TunerProvider>
          <Nav />

          {/* Content layer — sits above the fixed 3D backdrop */}
          <main id="main" tabIndex={-1} className="relative z-10 outline-none">
            <Hero />
            {/* Opaque reading surface so text stays crisp over the live 3D
                (an opaque panel avoids re-blurring the animating canvas every
                frame). A gradient ramp fades it in so there's no hard seam. */}
            <div className="relative">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-px h-32 -translate-y-full bg-gradient-to-b from-transparent to-bg"
              />
              <div className="bg-bg">
                <Work />
                <About />
                <Skills />
                <Contact />
              </div>
            </div>
          </main>

          {/* Channel-change glitch burst — pointer-transparent, fires on tune */}
          <ChannelGlitch />
        </TunerProvider>

        <Footer />

        {/* Decorative overlays — pointer-transparent, sit above all content.
            CRT chrome (z-55) under the custom cursor (z-90), both under the
            loader (z-100). Each self-gates on touch / reduced-motion. */}
        <CRTFrame />
        <CustomCursor />
      </ScrollProvider>
    </MotionConfig>
  );
}
