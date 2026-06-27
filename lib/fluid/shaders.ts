/* ============================================================
   FLUID — GLSL shaders
   Ported from Pavel Dobryakov's WebGL-Fluid-Simulation (MIT).
   https://github.com/PavelDoGreat/WebGL-Fluid-Simulation

   The Stam-style GPU solver shaders are faithful to the original.
   The DISPLAY shader is bespoke: instead of rendering coloured dye,
   it uses the fluid density as an alpha MASK (smoothstep edges) to
   reveal a background image / tint over the resting stage colour —
   the "wipe a window onto the background" effect.
   ============================================================ */

export const baseVertex = /* glsl */ `
  precision highp float;
  attribute vec2 aPosition;
  varying highp vec2 vUv;
  varying highp vec2 vL;
  varying highp vec2 vR;
  varying highp vec2 vT;
  varying highp vec2 vB;
  uniform vec2 texelSize;
  void main () {
    vUv = aPosition * 0.5 + 0.5;
    vL = vUv - vec2(texelSize.x, 0.0);
    vR = vUv + vec2(texelSize.x, 0.0);
    vT = vUv + vec2(0.0, texelSize.y);
    vB = vUv - vec2(0.0, texelSize.y);
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`;

export const clearShader = /* glsl */ `
  precision mediump float;
  precision mediump sampler2D;
  varying highp vec2 vUv;
  uniform sampler2D uTexture;
  uniform float value;
  void main () {
    gl_FragColor = value * texture2D(uTexture, vUv);
  }
`;

export const splatShader = /* glsl */ `
  precision highp float;
  precision highp sampler2D;
  varying vec2 vUv;
  uniform sampler2D uTarget;
  uniform float aspectRatio;
  uniform vec3 color;
  uniform vec2 point;
  uniform float radius;
  void main () {
    vec2 p = vUv - point.xy;
    p.x *= aspectRatio;
    vec3 splat = exp(-dot(p, p) / radius) * color;
    vec3 base = texture2D(uTarget, vUv).xyz;
    gl_FragColor = vec4(base + splat, 1.0);
  }
`;

export const advectionShader = /* glsl */ `
  precision highp float;
  precision highp sampler2D;
  varying vec2 vUv;
  uniform sampler2D uVelocity;
  uniform sampler2D uSource;
  uniform vec2 texelSize;
  uniform vec2 dyeTexelSize;
  uniform float dt;
  uniform float dissipation;

  vec4 bilerp (sampler2D sam, vec2 uv, vec2 tsize) {
    vec2 st = uv / tsize - 0.5;
    vec2 iuv = floor(st);
    vec2 fuv = fract(st);
    vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);
    vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);
    vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);
    vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);
    return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
  }

  void main () {
    #ifdef MANUAL_FILTERING
      vec2 coord = vUv - dt * bilerp(uVelocity, vUv, texelSize).xy * texelSize;
      vec4 result = bilerp(uSource, coord, dyeTexelSize);
    #else
      vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
      vec4 result = texture2D(uSource, coord);
    #endif
    float decay = 1.0 + dissipation * dt;
    gl_FragColor = result / decay;
  }
`;

export const divergenceShader = /* glsl */ `
  precision mediump float;
  precision mediump sampler2D;
  varying highp vec2 vUv;
  varying highp vec2 vL;
  varying highp vec2 vR;
  varying highp vec2 vT;
  varying highp vec2 vB;
  uniform sampler2D uVelocity;
  void main () {
    float L = texture2D(uVelocity, vL).x;
    float R = texture2D(uVelocity, vR).x;
    float T = texture2D(uVelocity, vT).y;
    float B = texture2D(uVelocity, vB).y;
    vec2 C = texture2D(uVelocity, vUv).xy;
    if (vL.x < 0.0) { L = -C.x; }
    if (vR.x > 1.0) { R = -C.x; }
    if (vT.y > 1.0) { T = -C.y; }
    if (vB.y < 0.0) { B = -C.y; }
    float div = 0.5 * (R - L + T - B);
    gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
  }
`;

export const curlShader = /* glsl */ `
  precision mediump float;
  precision mediump sampler2D;
  varying highp vec2 vUv;
  varying highp vec2 vL;
  varying highp vec2 vR;
  varying highp vec2 vT;
  varying highp vec2 vB;
  uniform sampler2D uVelocity;
  void main () {
    float L = texture2D(uVelocity, vL).y;
    float R = texture2D(uVelocity, vR).y;
    float T = texture2D(uVelocity, vT).x;
    float B = texture2D(uVelocity, vB).x;
    float vorticity = R - L - T + B;
    gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
  }
`;

export const vorticityShader = /* glsl */ `
  precision highp float;
  precision highp sampler2D;
  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;
  uniform sampler2D uVelocity;
  uniform sampler2D uCurl;
  uniform float curl;
  uniform float dt;
  void main () {
    float L = texture2D(uCurl, vL).x;
    float R = texture2D(uCurl, vR).x;
    float T = texture2D(uCurl, vT).x;
    float B = texture2D(uCurl, vB).x;
    float C = texture2D(uCurl, vUv).x;
    vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
    force /= length(force) + 0.0001;
    force *= curl * C;
    force.y *= -1.0;
    vec2 velocity = texture2D(uVelocity, vUv).xy;
    velocity += force * dt;
    velocity = min(max(velocity, -1000.0), 1000.0);
    gl_FragColor = vec4(velocity, 0.0, 1.0);
  }
`;

export const pressureShader = /* glsl */ `
  precision mediump float;
  precision mediump sampler2D;
  varying highp vec2 vUv;
  varying highp vec2 vL;
  varying highp vec2 vR;
  varying highp vec2 vT;
  varying highp vec2 vB;
  uniform sampler2D uPressure;
  uniform sampler2D uDivergence;
  void main () {
    float L = texture2D(uPressure, vL).x;
    float R = texture2D(uPressure, vR).x;
    float T = texture2D(uPressure, vT).x;
    float B = texture2D(uPressure, vB).x;
    float divergence = texture2D(uDivergence, vUv).x;
    float pressure = (L + R + B + T - divergence) * 0.25;
    gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
  }
`;

export const gradientSubtractShader = /* glsl */ `
  precision mediump float;
  precision mediump sampler2D;
  varying highp vec2 vUv;
  varying highp vec2 vL;
  varying highp vec2 vR;
  varying highp vec2 vT;
  varying highp vec2 vB;
  uniform sampler2D uPressure;
  uniform sampler2D uVelocity;
  void main () {
    float L = texture2D(uPressure, vL).x;
    float R = texture2D(uPressure, vR).x;
    float T = texture2D(uPressure, vT).x;
    float B = texture2D(uPressure, vB).x;
    vec2 velocity = texture2D(uVelocity, vUv).xy;
    velocity.xy -= vec2(R - L, T - B);
    gl_FragColor = vec4(velocity, 0.0, 1.0);
  }
`;

/* Bespoke display: layered fluid reveal.
   Background (uBgImage): cover-fit to fill the whole frame, dim at rest, fully
   revealed where the fluid passes — fills what used to be flat letterbox.
   Portrait: uBwImage (black & white) contain-fit on top, always shown; where
   the fluid density mask is high, uColorImage (colour portrait) reveals over it.
   The portrait stays an opaque centerpiece; the background lives behind it.
     uDensity  — fluid scalar field (mask source, shared by bg + portrait)
     uBgImage  — background image, cover-fit, revealed by the fluid
     uBwImage  — base portrait, always shown (contain-fit, on top of bg)
     uColorImage — reveal portrait, shown through the fluid
     uBase     — stage colour; shown when no bg is present (uHasBg=0)
     uBgAspect / uImageAspect / uCanvasAspect — for cover/contain fit
     uBgRest   — background opacity floor at rest (0 = hidden until fluid hits)
     uHasBg    — 1 when a bg texture is loaded, 0 to collapse to flat uBase
     edgeLow/edgeHigh — smoothstep window mapping density -> reveal mask */
export const displayShader = /* glsl */ `
  precision highp float;
  precision highp sampler2D;
  varying vec2 vUv;
  uniform sampler2D uDensity;
  uniform sampler2D uBgImage;
  uniform sampler2D uBwImage;
  uniform sampler2D uColorImage;
  uniform vec3 uBase;
  uniform float uEdgeLow;
  uniform float uEdgeHigh;
  uniform float uCanvasAspect;
  uniform float uImageAspect;
  uniform float uBgAspect;
  uniform float uBgRest;
  uniform float uHasBg;
  uniform float uOffsetX;
  uniform float uParallaxX;
  uniform float uParallaxY;
  uniform float uZoom;

  void main () {
    // fluid reveal mask — shared by the background and the portrait colour pass
    float d = texture2D(uDensity, vUv).r;
    float mask = smoothstep(uEdgeLow, uEdgeHigh, d);

    // ---- background layer (cover-fit, fills the frame) -------------------
    // Cover-fit with a touch of "over-cover" headroom: BG_ZOOM (<1) scales the
    // image slightly larger than exact cover, leaving slack on every edge so
    // the parallax drift below never exposes a border (CLAMP_TO_EDGE smears).
    const float BG_ZOOM = 0.94;
    vec2 bgScale = vec2(BG_ZOOM);
    if (uCanvasAspect > uBgAspect) bgScale.y *= uBgAspect / uCanvasAspect;
    else                           bgScale.x *= uCanvasAspect / uBgAspect;
    // Subtle parallax: the background eases with the cursor in the SAME
    // direction as the portrait but by a fraction of the distance, so it reads
    // as sitting farther back (nearer things parallax more). Sign is negated
    // because buv maps inversely to screen vs the portrait's iuv. The drift
    // (max ~0.009) stays well inside the ~0.03 slack from BG_ZOOM.
    const float BG_PARALLAX = 0.45;
    vec2 bgShift = -vec2(uParallaxX, uParallaxY) * BG_PARALLAX;
    vec2 buv = (vUv - 0.5) * bgScale + 0.5 + bgShift;
    vec3 bg = texture2D(uBgImage, buv).rgb;
    // Dim at rest (uBgRest), full where the fluid passes. uHasBg=0 collapses
    // this to flat uBase, so a missing/failed bg image looks exactly like before.
    float bgAmt = mix(uBgRest, 1.0, mask) * uHasBg;
    vec3 base = mix(uBase, bg, bgAmt);

    // ---- portrait layer (contain-fit, opaque, on top) --------------------
    // contain-fit: the portrait occupies a centered sub-rect of the canvas.
    float scaleX = min(uImageAspect / uCanvasAspect, 1.0);
    float scaleY = min(uCanvasAspect / uImageAspect, 1.0);
    // Shift the portrait toward the right edge ONLY on wide (desktop) aspects,
    // leaving the left clear for the hero name. On narrow/mobile aspects the
    // offset fades to 0 so the portrait stays centered and never cramps.
    float offsetX = uOffsetX * smoothstep(1.0, 1.6, uCanvasAspect);
    // Parallax drift: the whole portrait eases toward the cursor for depth.
    vec2 iuv = vec2(
      (vUv.x - ((1.0 - scaleX) * 0.5 + offsetX + uParallaxX)) / scaleX,
      (vUv.y - ((1.0 - scaleY) * 0.5 + uParallaxY)) / scaleY
    );
    // Zoom in around an anchor biased toward the face (upper-middle, since the
    // flipped cutout has white padding above the head). uZoom>1 magnifies and
    // crops that padding so the portrait fills the frame like the reference.
    vec2 zoomAnchor = vec2(0.5, 0.62);
    iuv = (iuv - zoomAnchor) / uZoom + zoomAnchor;
    bool inside = iuv.x >= 0.0 && iuv.x <= 1.0 && iuv.y >= 0.0 && iuv.y <= 1.0;

    // Portrait composites OVER the background through its own alpha — the
    // images are transparent cutouts, so the background (and fluid reveal)
    // shows through around the silhouette. Inside the silhouette it's the B&W
    // portrait, with the colour version revealed where the fluid mask is high.
    if (inside) {
      vec4 bwSample = texture2D(uBwImage, iuv);
      vec3 colour = texture2D(uColorImage, iuv).rgb;
      vec3 portrait = mix(bwSample.rgb, colour, mask);
      base = mix(base, portrait, bwSample.a);
    }

    gl_FragColor = vec4(base, 1.0);
  }
`;
