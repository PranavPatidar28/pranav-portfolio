/* ============================================================
   FLUID — simulation core (framework-agnostic)
   Ported & trimmed from Pavel Dobryakov's WebGL-Fluid-Simulation (MIT).
   https://github.com/PavelDoGreat/WebGL-Fluid-Simulation

   Trimmed to the fields the mask-reveal needs: velocity, pressure,
   curl/divergence, and a single scalar "density" field used as an
   alpha mask by the bespoke display shader. No coloured dye, bloom,
   or sunrays. Exposes a small imperative handle (splat / resize /
   destroy) the React wrapper drives.
   ============================================================ */

import {
  baseVertex,
  clearShader,
  splatShader,
  advectionShader,
  divergenceShader,
  curlShader,
  vorticityShader,
  pressureShader,
  gradientSubtractShader,
  displayShader,
} from "./shaders";

export type FluidConfig = {
  simResolution: number;
  dyeResolution: number;
  densityDissipation: number;
  velocityDissipation: number;
  pressure: number;
  pressureIterations: number;
  curl: number;
  splatRadius: number;
  splatForce: number;
  /** resting stage colour shown in the contain-fit letterbox margins, 0..1 rgb */
  base: [number, number, number];
  /** smoothstep window mapping density -> reveal mask */
  edgeLow: number;
  edgeHigh: number;
  /** horizontal offset of the portrait on wide aspects (0 = centered, + = right) */
  offsetX: number;
  /** magnify the portrait around a face-biased anchor (1 = contain-fit, >1 fills) */
  zoom: number;
  /** black & white portrait, always shown as the base layer */
  bwUrl?: string;
  /** colour portrait, revealed on top where the fluid passes */
  colorUrl?: string;
  /** background image (cover-fit), revealed by the fluid behind the portrait */
  bgUrl?: string;
  /** background opacity floor at rest (0 = hidden until the fluid passes) */
  bgRest: number;
  /** inject gentle orbital splats while idle so the fluid keeps swirling */
  idleSplats?: boolean;
};

// Defaults mirror the values FluidCanvas actually passes in production, so a
// bare createFluidSimulation(canvas) call (e.g. in isolation/testing) produces
// the same look the app ships.
export const DEFAULT_CONFIG: FluidConfig = {
  simResolution: 128,
  dyeResolution: 512,
  densityDissipation: 1.2,
  velocityDissipation: 0.4,
  pressure: 0.8,
  pressureIterations: 20,
  curl: 25,
  splatRadius: 0.28,
  splatForce: 6500,
  base: [0.984, 0.984, 0.984], // #fbfbfb
  edgeLow: 0.0,
  edgeHigh: 0.12,
  offsetX: 0,
  zoom: 1.35,
  bgRest: 0.12,
  idleSplats: true,
};

export type FluidHandle = {
  /** add a splat at normalized coords (0..1, origin bottom-left) */
  splat: (x: number, y: number, dx: number, dy: number) => void;
  resize: () => void;
  setPaused: (paused: boolean) => void;
  /** set the parallax target from a normalized cursor pos (0..1, y-down) */
  setParallaxTarget: (nx: number, ny: number) => void;
  destroy: () => void;
};

type GL = WebGL2RenderingContext | WebGLRenderingContext;

type FBO = {
  texture: WebGLTexture;
  fbo: WebGLFramebuffer;
  width: number;
  height: number;
  texelSizeX: number;
  texelSizeY: number;
  attach: (id: number) => number;
};

type DoubleFBO = {
  width: number;
  height: number;
  texelSizeX: number;
  texelSizeY: number;
  read: FBO;
  write: FBO;
  swap: () => void;
};

type ExtFormats = {
  internalFormat: number;
  format: number;
  texType: number;
  supportLinearFiltering: boolean;
};

/**
 * Boot a fluid sim onto the given canvas. Returns null if WebGL is
 * unavailable. The caller owns the rAF loop trigger via the returned
 * handle's lifecycle (the loop runs internally until destroy()).
 */
export function createFluidSimulation(
  canvas: HTMLCanvasElement,
  userConfig: Partial<FluidConfig> = {}
): FluidHandle | null {
  const config: FluidConfig = { ...DEFAULT_CONFIG, ...userConfig };

  const { gl, ext } = getContext(canvas);
  if (!gl) return null;

  // ---- program plumbing -------------------------------------------------
  const quad = createQuad(gl);

  function compile(type: number, source: string, label = "shader"): WebGLShader | null {
    const shader = gl!.createShader(type);
    if (!shader) return null;
    gl!.shaderSource(shader, source);
    gl!.compileShader(shader);
    if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) {
      const log = gl!.getShaderInfoLog(shader);
      console.warn(`[fluid] ${label} failed to compile:`, log || "(no info log)");
      // dump numbered source so the failure is diagnosable from the console
      console.warn(
        source
          .split("\n")
          .map((l, i) => `${String(i + 1).padStart(3, " ")} | ${l}`)
          .join("\n")
      );
      gl!.deleteShader(shader);
      return null;
    }
    return shader;
  }

  const vert = compile(gl.VERTEX_SHADER, baseVertex, "base vertex");
  if (!vert) return null;

  const programs: WebGLProgram[] = [];
  function program(fragSource: string, label = "fragment"): {
    program: WebGLProgram;
    uniforms: Record<string, WebGLUniformLocation | null>;
  } | null {
    const frag = compile(gl!.FRAGMENT_SHADER, fragSource, label);
    if (!frag) return null;
    const prog = gl!.createProgram();
    if (!prog) return null;
    gl!.attachShader(prog, vert!);
    gl!.attachShader(prog, frag);
    gl!.linkProgram(prog);
    if (!gl!.getProgramParameter(prog, gl!.LINK_STATUS)) {
      console.warn(`[fluid] ${label} program link failed:`, gl!.getProgramInfoLog(prog));
      return null;
    }
    gl!.deleteShader(frag);
    // collect uniforms
    const uniforms: Record<string, WebGLUniformLocation | null> = {};
    const count = gl!.getProgramParameter(prog, gl!.ACTIVE_UNIFORMS) as number;
    for (let i = 0; i < count; i++) {
      const info = gl!.getActiveUniform(prog, i);
      if (info) uniforms[info.name] = gl!.getUniformLocation(prog, info.name);
    }
    programs.push(prog);
    return { program: prog, uniforms };
  }

  const splatProg = program(splatShader, "splat");
  const advectionProg = program(
    ext.supportLinearFiltering ? advectionShader : "#define MANUAL_FILTERING\n" + advectionShader,
    "advection"
  );
  const divergenceProg = program(divergenceShader, "divergence");
  const curlProg = program(curlShader, "curl");
  const vorticityProg = program(vorticityShader, "vorticity");
  const pressureProg = program(pressureShader, "pressure");
  const gradientProg = program(gradientSubtractShader, "gradientSubtract");
  const clearProg = program(clearShader, "clear");
  const displayProg = program(displayShader, "display");

  if (
    !splatProg || !advectionProg || !divergenceProg || !curlProg ||
    !vorticityProg || !pressureProg || !gradientProg || !clearProg || !displayProg
  ) {
    return null;
  }

  // ---- framebuffers -----------------------------------------------------
  let velocity: DoubleFBO;
  let density: DoubleFBO;
  let divergence: FBO;
  let curl: FBO;
  let pressure: DoubleFBO;

  function createFBO(w: number, h: number, fmt: ExtFormats, param: number): FBO {
    const g = gl!;
    g.activeTexture(g.TEXTURE0);
    const texture = g.createTexture()!;
    g.bindTexture(g.TEXTURE_2D, texture);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, param);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, param);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE);
    g.texImage2D(g.TEXTURE_2D, 0, fmt.internalFormat, w, h, 0, fmt.format, fmt.texType, null);

    const fbo = g.createFramebuffer()!;
    g.bindFramebuffer(g.FRAMEBUFFER, fbo);
    g.framebufferTexture2D(g.FRAMEBUFFER, g.COLOR_ATTACHMENT0, g.TEXTURE_2D, texture, 0);
    g.viewport(0, 0, w, h);
    g.clear(g.COLOR_BUFFER_BIT);

    const texelSizeX = 1.0 / w;
    const texelSizeY = 1.0 / h;
    return {
      texture, fbo, width: w, height: h, texelSizeX, texelSizeY,
      attach(id: number) {
        g.activeTexture(g.TEXTURE0 + id);
        g.bindTexture(g.TEXTURE_2D, texture);
        return id;
      },
    };
  }

  function createDoubleFBO(w: number, h: number, fmt: ExtFormats, param: number): DoubleFBO {
    let fbo1 = createFBO(w, h, fmt, param);
    let fbo2 = createFBO(w, h, fmt, param);
    return {
      width: w, height: h, texelSizeX: 1 / w, texelSizeY: 1 / h,
      get read() { return fbo1; },
      set read(v) { fbo1 = v; },
      get write() { return fbo2; },
      set write(v) { fbo2 = v; },
      swap() { const t = fbo1; fbo1 = fbo2; fbo2 = t; },
    };
  }

  const rgba = ext.formatRGBA;
  const rg = ext.formatRG;
  const r = ext.formatR;
  const filtering = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;

  function initFramebuffers() {
    const simRes = getResolution(config.simResolution);
    const dyeRes = getResolution(config.dyeResolution);

    velocity = createDoubleFBO(simRes.width, simRes.height, rg, filtering);
    density = createDoubleFBO(dyeRes.width, dyeRes.height, rgba, filtering);
    divergence = createFBO(simRes.width, simRes.height, r, gl!.NEAREST);
    curl = createFBO(simRes.width, simRes.height, r, gl!.NEAREST);
    pressure = createDoubleFBO(simRes.width, simRes.height, r, gl!.NEAREST);
  }

  initFramebuffers();

  // ---- portrait textures (B&W base + colour reveal) + background --------
  let bwTex: WebGLTexture | null = null;
  let colorTex: WebGLTexture | null = null;
  let bgTex: WebGLTexture | null = null;
  let imageAspect = 1;
  let bgAspect = 1;
  const imageEls: HTMLImageElement[] = [];

  function loadTexture(url: string, onLoaded: (tex: WebGLTexture, aspect: number) => void) {
    const img = new Image();
    imageEls.push(img);
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const g = gl!;
      const tex = g.createTexture();
      if (!tex) return;
      g.bindTexture(g.TEXTURE_2D, tex);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.LINEAR);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.LINEAR);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE);
      // DOM images are top-down but GL texture origin is bottom-left; flip Y.
      g.pixelStorei(g.UNPACK_FLIP_Y_WEBGL, true);
      g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, g.RGBA, g.UNSIGNED_BYTE, img);
      g.pixelStorei(g.UNPACK_FLIP_Y_WEBGL, false);
      onLoaded(tex, img.width / img.height);
    };
    img.onerror = () => {
      // Load failed (404 / network / CORS): leave the texture null. render()
      // guards on both textures being present and simply doesn't paint, so the
      // white FallbackStage behind the canvas shows through cleanly.
      console.warn(`[fluid] failed to load portrait: ${url}`);
    };
    img.src = url;
  }

  if (config.bwUrl) {
    loadTexture(config.bwUrl, (tex, aspect) => {
      bwTex = tex;
      imageAspect = aspect; // both portraits share dimensions
    });
  }
  if (config.colorUrl) {
    loadTexture(config.colorUrl, (tex) => {
      colorTex = tex;
    });
  }
  if (config.bgUrl) {
    loadTexture(config.bgUrl, (tex, aspect) => {
      bgTex = tex;
      bgAspect = aspect; // background has its own dimensions (cover-fit)
    });
  }

  // ---- render plumbing ---------------------------------------------------
  function blit(target: FBO | null) {
    const g = gl!;
    if (target == null) {
      g.viewport(0, 0, g.drawingBufferWidth, g.drawingBufferHeight);
      g.bindFramebuffer(g.FRAMEBUFFER, null);
    } else {
      g.viewport(0, 0, target.width, target.height);
      g.bindFramebuffer(g.FRAMEBUFFER, target.fbo);
    }
    g.bindBuffer(g.ARRAY_BUFFER, quad.buffer);
    g.vertexAttribPointer(0, 2, g.FLOAT, false, 0, 0);
    g.enableVertexAttribArray(0);
    g.drawElements(g.TRIANGLES, 6, g.UNSIGNED_SHORT, 0);
  }

  function runProgram(p: WebGLProgram) {
    gl!.useProgram(p);
  }

  // ---- splat queue -------------------------------------------------------
  type Splat = { x: number; y: number; dx: number; dy: number };
  const splatQueue: Splat[] = [];

  function applySplat(s: Splat) {
    const g = gl!;
    // velocity splat
    runProgram(splatProg!.program);
    g.uniform1i(splatProg!.uniforms.uTarget, velocity.read.attach(0));
    g.uniform1f(splatProg!.uniforms.aspectRatio, canvas.width / canvas.height);
    g.uniform2f(splatProg!.uniforms.point, s.x, s.y);
    g.uniform3f(splatProg!.uniforms.color, s.dx, s.dy, 0);
    g.uniform1f(splatProg!.uniforms.radius, correctRadius(config.splatRadius / 100));
    blit(velocity.write);
    velocity.swap();

    // density splat — push the scalar field (stored in rgb equally)
    g.uniform1i(splatProg!.uniforms.uTarget, density.read.attach(0));
    g.uniform3f(splatProg!.uniforms.color, 0.3, 0.3, 0.3);
    blit(density.write);
    density.swap();
  }

  function correctRadius(radius: number) {
    // Floor the dimensions at 1 so an unsized/zero-height canvas can't divide
    // by zero and feed NaN into the splat radius.
    const width = canvas.width || 1;
    const height = canvas.height || 1;
    const aspect = width / height;
    return aspect > 1 ? radius * aspect : radius;
  }

  // ---- step --------------------------------------------------------------
  let lastTime = performance.now();
  let paused = false;

  function step(dt: number) {
    const g = gl!;
    g.disable(g.BLEND);

    // curl
    runProgram(curlProg!.program);
    g.uniform2f(curlProg!.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    g.uniform1i(curlProg!.uniforms.uVelocity, velocity.read.attach(0));
    blit(curl);

    // vorticity
    runProgram(vorticityProg!.program);
    g.uniform2f(vorticityProg!.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    g.uniform1i(vorticityProg!.uniforms.uVelocity, velocity.read.attach(0));
    g.uniform1i(vorticityProg!.uniforms.uCurl, curl.attach(1));
    g.uniform1f(vorticityProg!.uniforms.curl, config.curl);
    g.uniform1f(vorticityProg!.uniforms.dt, dt);
    blit(velocity.write);
    velocity.swap();

    // divergence
    runProgram(divergenceProg!.program);
    g.uniform2f(divergenceProg!.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    g.uniform1i(divergenceProg!.uniforms.uVelocity, velocity.read.attach(0));
    blit(divergence);

    // clear pressure
    runProgram(clearProg!.program);
    g.uniform1i(clearProg!.uniforms.uTexture, pressure.read.attach(0));
    g.uniform1f(clearProg!.uniforms.value, config.pressure);
    blit(pressure.write);
    pressure.swap();

    // pressure solve
    runProgram(pressureProg!.program);
    g.uniform2f(pressureProg!.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    g.uniform1i(pressureProg!.uniforms.uDivergence, divergence.attach(0));
    for (let i = 0; i < config.pressureIterations; i++) {
      g.uniform1i(pressureProg!.uniforms.uPressure, pressure.read.attach(1));
      blit(pressure.write);
      pressure.swap();
    }

    // gradient subtract
    runProgram(gradientProg!.program);
    g.uniform2f(gradientProg!.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    g.uniform1i(gradientProg!.uniforms.uPressure, pressure.read.attach(0));
    g.uniform1i(gradientProg!.uniforms.uVelocity, velocity.read.attach(1));
    blit(velocity.write);
    velocity.swap();

    // advect velocity
    runProgram(advectionProg!.program);
    g.uniform2f(advectionProg!.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    if (!ext.supportLinearFiltering) {
      g.uniform2f(advectionProg!.uniforms.dyeTexelSize, velocity.texelSizeX, velocity.texelSizeY);
    }
    g.uniform1i(advectionProg!.uniforms.uVelocity, velocity.read.attach(0));
    g.uniform1i(advectionProg!.uniforms.uSource, velocity.read.attach(0));
    g.uniform1f(advectionProg!.uniforms.dt, dt);
    g.uniform1f(advectionProg!.uniforms.dissipation, config.velocityDissipation);
    blit(velocity.write);
    velocity.swap();

    // advect density
    if (!ext.supportLinearFiltering) {
      g.uniform2f(advectionProg!.uniforms.dyeTexelSize, density.texelSizeX, density.texelSizeY);
    }
    g.uniform1i(advectionProg!.uniforms.uVelocity, velocity.read.attach(0));
    g.uniform1i(advectionProg!.uniforms.uSource, density.read.attach(1));
    g.uniform1f(advectionProg!.uniforms.dissipation, config.densityDissipation);
    blit(density.write);
    density.swap();
  }

  function render() {
    const g = gl!;
    // Skip the display paint until both portraits are uploaded. Sampling an
    // unbound texture unit returns black, which would flash a black rectangle
    // over the stage; by not painting, the canvas stays transparent and the
    // white FallbackStage behind it shows through seamlessly. Also avoids
    // wasted GPU work while images load (or forever, if a load fails).
    if (!bwTex || !colorTex) return;
    runProgram(displayProg!.program);
    g.uniform1i(displayProg!.uniforms.uDensity, density.read.attach(0));
    // bind B&W (unit 1) and colour (unit 2) portraits
    g.activeTexture(g.TEXTURE1);
    g.bindTexture(g.TEXTURE_2D, bwTex);
    g.uniform1i(displayProg!.uniforms.uBwImage, 1);
    g.activeTexture(g.TEXTURE2);
    g.bindTexture(g.TEXTURE_2D, colorTex);
    g.uniform1i(displayProg!.uniforms.uColorImage, 2);
    // background on unit 3; when absent, bind bwTex as a harmless stand-in (it's
    // guaranteed non-null here by the guard above) so the unit is never
    // incomplete. uHasBg=0 zeroes its contribution → flat uBase, today's look.
    g.activeTexture(g.TEXTURE3);
    g.bindTexture(g.TEXTURE_2D, bgTex || bwTex);
    g.uniform1i(displayProg!.uniforms.uBgImage, 3);
    g.uniform1f(displayProg!.uniforms.uHasBg, bgTex ? 1 : 0);
    g.uniform1f(displayProg!.uniforms.uBgAspect, bgAspect);
    g.uniform1f(displayProg!.uniforms.uBgRest, config.bgRest);
    g.uniform3f(displayProg!.uniforms.uBase, ...config.base);
    g.uniform1f(displayProg!.uniforms.uEdgeLow, config.edgeLow);
    g.uniform1f(displayProg!.uniforms.uEdgeHigh, config.edgeHigh);
    g.uniform1f(displayProg!.uniforms.uCanvasAspect, canvas.width / canvas.height);
    g.uniform1f(displayProg!.uniforms.uImageAspect, imageAspect);
    g.uniform1f(displayProg!.uniforms.uOffsetX, config.offsetX);
    g.uniform1f(displayProg!.uniforms.uParallaxX, parallaxX);
    g.uniform1f(displayProg!.uniforms.uParallaxY, parallaxY);
    g.uniform1f(displayProg!.uniforms.uZoom, config.zoom);
    blit(null);
  }

  // ---- main loop ---------------------------------------------------------
  let rafId = 0;
  let destroyed = false;
  // idle orbital streamers: injected from inside the loop (not a separate
  // setInterval) so they honour the pause — otherwise a hidden tab queues a
  // burst of splats that all drain at once on resume.
  let idleT = 0;
  let lastIdle = 0;
  const IDLE_MS = 1000 / 26;

  // Parallax drift: the portrait eases toward a target derived from the cursor.
  // Target is set externally (setParallaxTarget); the loop lerps toward it so
  // motion is smooth, not jumpy. Magnitude is tiny (image-uv space) for a
  // subtle depth shift, not a big slide.
  let parallaxX = 0;
  let parallaxY = 0;
  let parallaxTargetX = 0;
  let parallaxTargetY = 0;
  const PARALLAX_EASE = 0.06;

  function frame() {
    if (destroyed) return;
    const now = performance.now();
    let dt = (now - lastTime) / 1000;
    dt = Math.min(dt, 0.016666);
    lastTime = now;

    if (!paused) {
      // generate an idle streamer splat on its own cadence
      if (config.idleSplats && now - lastIdle >= IDLE_MS) {
        lastIdle = now;
        idleT += 0.06;
        const cx = 0.5 + Math.cos(idleT * 0.7) * 0.18;
        const cy = 0.5 + Math.sin(idleT * 1.1) * 0.14;
        const dx = Math.cos(idleT * 1.7) * 0.0016;
        const dy = Math.sin(idleT * 1.3) * 0.0016;
        splatQueue.push({ x: cx, y: cy, dx: dx * config.splatForce, dy: dy * config.splatForce });
      }
      // drain queued splats then step + render
      while (splatQueue.length) applySplat(splatQueue.shift()!);
      // ease parallax toward its cursor-driven target
      parallaxX += (parallaxTargetX - parallaxX) * PARALLAX_EASE;
      parallaxY += (parallaxTargetY - parallaxY) * PARALLAX_EASE;
      step(dt);
      render();
    }
    rafId = requestAnimationFrame(frame);
  }
  rafId = requestAnimationFrame(frame);

  // ---- public handle -----------------------------------------------------
  function splat(x: number, y: number, dx: number, dy: number) {
    splatQueue.push({ x, y, dx: dx * config.splatForce, dy: dy * config.splatForce });
  }

  function resize() {
    if (resizeCanvasToDisplay(canvas)) {
      initFramebuffers();
    }
  }

  function setPaused(p: boolean) {
    if (p === paused) return;
    paused = p;
    if (p) {
      // Fully stop the rAF loop while hidden — flagging alone kept the event
      // loop hot (a frame callback firing every tick just to no-op).
      cancelAnimationFrame(rafId);
    } else {
      lastTime = performance.now();
      rafId = requestAnimationFrame(frame);
    }
  }

  function destroy() {
    destroyed = true;
    cancelAnimationFrame(rafId);
    const g = gl!;
    // delete all GL resources
    programs.forEach((p) => g.deleteProgram(p));
    if (vert) g.deleteShader(vert);
    const fbos = [velocity?.read, velocity?.write, density?.read, density?.write,
      divergence, curl, pressure?.read, pressure?.write];
    fbos.forEach((f) => {
      if (!f) return;
      g.deleteTexture(f.texture);
      g.deleteFramebuffer(f.fbo);
    });
    if (bwTex) g.deleteTexture(bwTex);
    if (colorTex) g.deleteTexture(colorTex);
    if (bgTex) g.deleteTexture(bgTex);
    imageEls.forEach((el) => { el.onload = null; el.onerror = null; });
    g.deleteBuffer(quad.buffer);
    g.deleteBuffer(quad.indexBuffer);
    // NOTE: deliberately NOT calling WEBGL_lose_context.loseContext() here.
    // A canvas only ever returns ONE context object per type, so under React
    // StrictMode (dev double-mount) the second mount's getContext() hands back
    // this same context — if we'd lost it, every shader compile on the remount
    // fails silently (COMPILE_STATUS false, empty info log). Deleting the GL
    // resources above is sufficient; the browser reclaims the context when the
    // canvas element is garbage-collected.
  }

  // size the drawing buffer to start
  resizeCanvasToDisplay(canvas);

  // Set the parallax target from a normalized cursor position (0..1, y-down
  // like the DOM). The portrait drifts to the OPPOSITE side of the cursor
  // (cursor right → portrait eases left), the classic counter-parallax that
  // reads as depth. Mapped to a small image-uv offset; the loop eases toward it.
  function setParallaxTarget(nx: number, ny: number) {
    const MAG = 0.04;
    // Shader samples iuv = vUv − (… + parallax), so a texture feature lands at
    // screenX = T·scale + parallax → POSITIVE parallax moves the image RIGHT.
    // To move AWAY from the cursor: cursor-right (nx>0.5) → image left →
    // negative X. Likewise positive parallaxY moves the image UP (vUv.y is
    // bottom-up), so cursor-low (ny>0.5) → image up → positive Y.
    parallaxTargetX = -(nx - 0.5) * MAG;
    parallaxTargetY = (ny - 0.5) * MAG;
  }

  return { splat, resize, setPaused, setParallaxTarget, destroy };
}

/* ---- helpers ------------------------------------------------------------ */

function createQuad(gl: GL) {
  const buffer = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
  const indexBuffer = gl.createBuffer()!;
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
  return { buffer, indexBuffer };
}

function getContext(canvas: HTMLCanvasElement): {
  gl: GL | null;
  isWebGL2: boolean;
  ext: {
    formatRGBA: ExtFormats;
    formatRG: ExtFormats;
    formatR: ExtFormats;
    supportLinearFiltering: boolean;
  };
} {
  const params: WebGLContextAttributes = {
    alpha: true,
    depth: false,
    stencil: false,
    antialias: false,
    preserveDrawingBuffer: false,
  };

  let gl: GL | null = canvas.getContext("webgl2", params) as WebGL2RenderingContext | null;
  const isWebGL2 = !!gl;
  if (!gl) {
    gl = (canvas.getContext("webgl", params) ||
      canvas.getContext("experimental-webgl", params)) as WebGLRenderingContext | null;
  }
  if (!gl) {
    return { gl: null, isWebGL2: false, ext: null as never };
  }

  let halfFloat: number;
  let supportLinearFiltering: boolean;
  if (isWebGL2) {
    const g2 = gl as WebGL2RenderingContext;
    g2.getExtension("EXT_color_buffer_float");
    supportLinearFiltering = !!g2.getExtension("OES_texture_float_linear");
    halfFloat = g2.HALF_FLOAT;
  } else {
    const hf = gl.getExtension("OES_texture_half_float");
    supportLinearFiltering = !!gl.getExtension("OES_texture_half_float_linear");
    halfFloat = hf ? hf.HALF_FLOAT_OES : gl.UNSIGNED_BYTE;
  }

  const formatRGBA = getSupportedFormat(gl, isWebGL2, halfFloat, "RGBA");
  const formatRG = getSupportedFormat(gl, isWebGL2, halfFloat, "RG");
  const formatR = getSupportedFormat(gl, isWebGL2, halfFloat, "R");

  return {
    gl,
    isWebGL2,
    ext: { formatRGBA, formatRG, formatR, supportLinearFiltering },
  };
}

function getSupportedFormat(
  gl: GL,
  isWebGL2: boolean,
  texType: number,
  channels: "RGBA" | "RG" | "R"
): ExtFormats {
  if (isWebGL2) {
    const g2 = gl as WebGL2RenderingContext;
    const map = {
      RGBA: { internalFormat: g2.RGBA16F, format: g2.RGBA },
      RG: { internalFormat: g2.RG16F, format: g2.RG },
      R: { internalFormat: g2.R16F, format: g2.RED },
    } as const;
    const f = map[channels];
    return {
      internalFormat: f.internalFormat,
      format: f.format,
      texType,
      supportLinearFiltering: true,
    };
  }
  // WebGL1: only RGBA is broadly usable
  return {
    internalFormat: gl.RGBA,
    format: gl.RGBA,
    texType,
    supportLinearFiltering: true,
  };
}

function getResolution(resolution: number): { width: number; height: number } {
  // square-ish; the sim runs in its own space and is sampled by uv
  return { width: resolution, height: resolution };
}

function resizeCanvasToDisplay(canvas: HTMLCanvasElement): boolean {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.floor(canvas.clientWidth * dpr);
  const height = Math.floor(canvas.clientHeight * dpr);
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width || 1;
    canvas.height = height || 1;
    return true;
  }
  return false;
}
