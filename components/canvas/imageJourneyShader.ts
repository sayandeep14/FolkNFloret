export const vertexShader = /* glsl */ `
  uniform float uVelocity;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vec3 p = position;

    // Fast scrolling bows the plane toward the viewer along the centre line,
    // so the image feels like a physical sheet being dragged past.
    float bow = sin(uv.y * 3.14159) * uVelocity * 0.06;
    p.z += bow;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

export const fragmentShader = /* glsl */ `
  precision highp float;

  uniform sampler2D uTexA;
  uniform sampler2D uTexB;
  uniform vec2 uSizeA;
  uniform vec2 uSizeB;
  uniform vec2 uPlane;
  uniform float uProgress;
  uniform float uTime;
  uniform float uVelocity;
  uniform vec2 uPointer;
  uniform float uPointerSpeed;
  uniform float uZoomA;
  uniform float uZoomB;
  uniform vec2 uPanA;
  uniform vec2 uPanB;
  uniform float uFade;

  varying vec2 vUv;

  // -- 2D simplex noise ------------------------------------------------------
  vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                            + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy),
                            dot(x12.zw, x12.zw)), 0.0);
    m = m * m; m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  /** Fit an image over the plane without distorting it — CSS object-fit: cover. */
  vec2 coverUv(vec2 uv, vec2 imageSize, float zoom, vec2 pan) {
    vec2 ratio = uPlane / imageSize;
    float scale = max(ratio.x, ratio.y);
    vec2 covered = imageSize * scale;
    vec2 offset = (uPlane - covered) * 0.5;
    vec2 result = (uv * uPlane - offset) / covered;
    // Ken Burns happens after the fit so it never breaks the aspect.
    return (result - 0.5) / zoom + 0.5 + pan;
  }

  void main() {
    vec2 uv = vUv;
    float aspect = uPlane.x / uPlane.y;

    // -- Cursor ripple: a soft radial push around the pointer ---------------
    vec2 toPointer = (uv - uPointer) * vec2(aspect, 1.0);
    float pointerDist = length(toPointer);
    float ripple = exp(-pointerDist * 5.5) * uPointerSpeed;
    // A travelling wave inside the falloff makes it read as liquid, not a bulge.
    ripple *= sin(pointerDist * 22.0 - uTime * 3.4) * 0.5 + 0.5;
    uv += normalize(toPointer + 1e-6) * ripple * 0.035;

    // -- Scroll velocity: shear the frame against the direction of travel ---
    uv.y += uVelocity * 0.035 * sin(uv.x * 3.14159);

    // -- Displacement dissolve between the two chapter images ---------------
    float n = snoise(uv * 3.6 + uTime * 0.02) * 0.5 + 0.5;
    const float EDGE = 0.30;
    float m = smoothstep(n * EDGE, n * EDGE + (1.0 - EDGE), uProgress);

    // Both frames slide slightly in opposite directions through the wipe, and
    // the push peaks mid-transition so the ends stay perfectly still.
    float push = m * (1.0 - m);
    vec2 uvA = coverUv(uv + vec2(0.0, -push * 0.07), uSizeA, uZoomA, uPanA);
    vec2 uvB = coverUv(uv + vec2(0.0, push * 0.07), uSizeB, uZoomB, uPanB);

    // -- Chromatic aberration, scaled by how hard the page is moving --------
    float ca = abs(uVelocity) * 0.0028 + push * 0.002;
    vec2 caDir = vec2(ca, 0.0);

    vec3 a;
    a.r = texture2D(uTexA, uvA + caDir).r;
    a.g = texture2D(uTexA, uvA).g;
    a.b = texture2D(uTexA, uvA - caDir).b;

    vec3 b;
    b.r = texture2D(uTexB, uvB + caDir).r;
    b.g = texture2D(uTexB, uvB).g;
    b.b = texture2D(uTexB, uvB - caDir).b;

    vec3 color = mix(a, b, m);

    // A thin bright seam along the dissolve front, like light through a gap.
    color += vec3(1.0, 0.86, 0.68) * push * 0.32;

    // Vignette, and the fade to ink as the journey hands off to the content.
    float vig = smoothstep(1.25, 0.25, length((uv - 0.5) * vec2(aspect, 1.0)));
    color *= mix(0.55, 1.0, vig);
    color = mix(color, vec3(0.051, 0.075, 0.086), uFade);

    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`;
