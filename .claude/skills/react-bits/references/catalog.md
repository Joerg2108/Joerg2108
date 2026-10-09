# React Bits component catalog

Generated from `public/llms.txt` and the `src/ts-tailwind` sources of DavidHDev/react-bits, commit `b2098591ad5b3489eff65ca9e5b9f9bdf2de29c3`.

- **CLI name**: use in `@react-bits/<CLI name>-<TS|JS>-<TW|CSS>`.
- **Deps**: npm packages the component imports (besides react). The CLI installs them.
- **Required props**: non-optional fields of `<Name>Props` in the TS source. Empty = every prop has a default. Not every component names its props interface `<Name>Props`; read the source when in doubt.
- **Docs**: live demo, props table and code on reactbits.dev.

## Text Animations (33)

| CLI name | What it does | Deps | Required props |
|---|---|---|---|
| [`ASCIIText`](https://reactbits.dev/text-animations/ascii-text) | Renders text with an animated ASCII background for a retro feel. | three | - |
| [`BlurText`](https://reactbits.dev/text-animations/blur-text) | Text starts blurred then crisply resolves for a soft-focus reveal effect. | motion | - |
| [`CircularText`](https://reactbits.dev/text-animations/circular-text) | Layouts characters around a circle with optional rotation animation. | motion | text |
| [`CountUp`](https://reactbits.dev/text-animations/count-up) | Animated number counter supporting formatting and decimals. | motion | to |
| [`CurvedLoop`](https://reactbits.dev/text-animations/curved-loop) | Flowing looping text path along a customizable curve with drag interaction. | - | - |
| [`DecryptedText`](https://reactbits.dev/text-animations/decrypted-text) | Hacker-style decryption cycling random glyphs until resolving to real text. | motion | text |
| [`DepthText`](https://reactbits.dev/text-animations/depth-text) | Layered extruded type with parallax that shifts against the pointer. | - | - |
| [`EchoText`](https://reactbits.dev/text-animations/echo-text) | Ghosted copies trail behind the text and settle into a single word. | - | - |
| [`FallingText`](https://reactbits.dev/text-animations/falling-text) | Characters fall with gravity + bounce creating a playful entrance. | matter-js | - |
| [`FoldText`](https://reactbits.dev/text-animations/fold-text) | Lines unfold into place like creased paper opening flat. | gsap | - |
| [`FuzzyText`](https://reactbits.dev/text-animations/fuzzy-text) | Vibrating fuzzy text with controllable hover intensity. | - | children |
| [`GlitchText`](https://reactbits.dev/text-animations/glitch-text) | RGB split and distortion glitch effect with jitter effects. | - | children |
| [`GradientText`](https://reactbits.dev/text-animations/gradient-text) | Animated gradient sweep across live text with speed and color control. | - | - |
| [`MaskedHeading`](https://reactbits.dev/text-animations/masked-heading) | A large headline with a drifting colour mesh or image showing through the glyphs, revealed word by word. | gsap | - |
| [`ParticleText`](https://reactbits.dev/text-animations/particle-text) | Text assembles from drifting particles that scatter and reform on demand. | - | - |
| [`RotatingText`](https://reactbits.dev/text-animations/rotating-text) | Cycles through multiple phrases with 3D rotate / flip transitions. | motion | texts |
| [`ScrambledText`](https://reactbits.dev/text-animations/scrambled-text) | Detects cursor position and applies a distortion effect to text. | gsap | children |
| [`ScrollFloat`](https://reactbits.dev/text-animations/scroll-float) | Text gently floats / parallax shifts on scroll. | gsap | children |
| [`ScrollReveal`](https://reactbits.dev/text-animations/scroll-reveal) | Text gently unblurs and reveals on scroll. | gsap | children |
| [`ScrollVelocity`](https://reactbits.dev/text-animations/scroll-velocity) | Text marquee animatio - speed and distortion scale with user's scroll velocity. | motion | texts |
| [`ShinyText`](https://reactbits.dev/text-animations/shiny-text) | Metallic sheen sweeps across text producing a reflective highlight. | - | - |
| [`Shuffle`](https://reactbits.dev/text-animations/shuffle) | Animated text reveal where characters shuffle before settling. | @gsap/react, gsap | text |
| [`SplitFlapText`](https://reactbits.dev/text-animations/split-flap-text) | Mechanical split-flap departure board that clacks through to each new phrase. | - | - |
| [`SplitText`](https://reactbits.dev/text-animations/split-text) | Splits text into characters / words for staggered entrance animation. | @gsap/react, gsap | text |
| [`StrokeText`](https://reactbits.dev/text-animations/stroke-text) | Outlined letterforms draw themselves on, then flood with fill. | gsap | - |
| [`TechText`](https://reactbits.dev/text-animations/tech-text) | A wordmark whose letters turn into dashed vector paths under the cursor. Grab any letter to drag it off the baseline and it springs back home. | - | - |
| [`TextCursor`](https://reactbits.dev/text-animations/text-cursor) | Make any text element follow your cursor, leaving a trail of copies behind it. | motion | text |
| [`TextLoop`](https://reactbits.dev/text-animations/text-loop) | A seamless text marquee that flows along curved SVG paths. | gsap | - |
| [`TextPressure`](https://reactbits.dev/text-animations/text-pressure) | Characters scale / warp interactively based on pointer pressure zone. | - | - |
| [`TextType`](https://reactbits.dev/text-animations/text-type) | Typewriter effect with blinking cursor and adjustable typing cadence. | gsap | text |
| [`TrueFocus`](https://reactbits.dev/text-animations/true-focus) | Applies dynamic blur / clarity based over a series of words in order. | motion | - |
| [`VariableProximity`](https://reactbits.dev/text-animations/variable-proximity) | Letter styling changes continuously with pointer distance mapping. | motion | label, fromFontVariationSettings, toFontVariationSettings, containerRef |
| [`WarpText`](https://reactbits.dev/text-animations/warp-text) | WebGL warp that bends and refracts the text around the pointer. | ogl | - |

## Animations (41)

| CLI name | What it does | Deps | Required props |
|---|---|---|---|
| [`AnimatedContent`](https://reactbits.dev/animations/animated-content) | Wrapper that animates any children on scroll or mount with configurable direction, distance, duration, easing and disappear options. | gsap | children |
| [`Antigravity`](https://reactbits.dev/animations/antigravity) | 3D antigravity particle field that repels from the cursor with smooth motion. | @react-three/fiber, three | - |
| [`BlobCursor`](https://reactbits.dev/animations/blob-cursor) | Organic blob cursor that smoothly follows the pointer with inertia and elastic morphing. | three | - |
| [`ClickSpark`](https://reactbits.dev/animations/click-spark) | Creates particle spark bursts at click position. | - | - |
| [`Crosshair`](https://reactbits.dev/animations/crosshair) | Custom crosshair cursor with tracking, and link hover effects. | gsap | - |
| [`CrystalizedBall`](https://reactbits.dev/animations/crystalized-ball) | A glass ball held together by a crackling electric rim, with a bowl of glowing dust inside that swirls in the cursor wake, shakes on click and lights up on mount, all from one color. | ogl | - |
| [`Cubes`](https://reactbits.dev/animations/cubes) | 3D rotating cube cluster. Supports auto-rotation or hover interaction. | gsap | - |
| [`CursorGrid`](https://reactbits.dev/animations/cursor-grid) | Canvas grid whose cells light up around the cursor with configurable radius, falloff and click pulses. | - | - |
| [`DitherVeil`](https://reactbits.dev/animations/dither-veil) | A photo printed as a 1-bit dither that the cursor burns through to full colour, leaving a trail that knits back cell by cell. | ogl | - |
| [`ElasticMesh`](https://reactbits.dev/animations/elastic-mesh) | Spring-mesh surface that stretches under the pointer and settles back with damped physics. | ogl | - |
| [`ElectricBorder`](https://reactbits.dev/animations/electric-border) | Jittery electric energy border with animated arcs, glow and adjustable intensity. | - | - |
| [`ElectricLogo`](https://reactbits.dev/animations/electric-logo) | Turns any SVG or PNG into a living lightning outline, with flowing strands, arcs that leap off the edges and a charge that follows the cursor. | ogl | - |
| [`FadeContent`](https://reactbits.dev/animations/fade-content) | Simple directional fade / slide entrance / exit wrapper with threshold-based activation. | gsap | children |
| [`GhostCursor`](https://reactbits.dev/animations/ghost-cursor) | Semi-transparent ghost cursor that smoothly follows the real cursor with a trailing effect. | three | - |
| [`GlareHover`](https://reactbits.dev/animations/glare-hover) | Adds a realistic moving glare highlight on hover over any element. | - | - |
| [`GlowCursor`](https://reactbits.dev/animations/glow-cursor) | Shader-powered light trail that smoothly follows the pointer with customizable glow, color, taper and pulse. | ogl | - |
| [`GradualBlur`](https://reactbits.dev/animations/gradual-blur) | Progressively un-blurs content based on scroll or trigger creating a cinematic reveal. | - | - |
| [`HalftoneReveal`](https://reactbits.dev/animations/halftone-reveal) | Print-style halftone dot matrix that resolves into sharp content around the cursor. | ogl | - |
| [`ImageTrail`](https://reactbits.dev/animations/image-trail) | Cursor-based image trail with several built-in variants. | gsap | - |
| [`LaserFlow`](https://reactbits.dev/animations/laser-flow) | Dynamic laser light that flows onto a surface, customizable effect. | three | - |
| [`LogoLoop`](https://reactbits.dev/animations/logo-loop) | Continuously looping marquee of brand or tech logos with seamless repeat and hover pause. | - | logos |
| [`MagicRings`](https://reactbits.dev/animations/magic-rings) | Interactive magic rings effect with customizable parameters. | three | - |
| [`Magnet`](https://reactbits.dev/animations/magnet) | Elements magnetically ease toward the cursor then settle back with spring physics. | - | children |
| [`MagnetLines`](https://reactbits.dev/animations/magnet-lines) | Animated field lines bend toward the cursor. | - | - |
| [`MetaBalls`](https://reactbits.dev/animations/meta-balls) | Liquid metaball blobs that merge and separate with smooth implicit surface animation. | ogl | - |
| [`MetallicPaint`](https://reactbits.dev/animations/metallic-paint) | Liquid metallic paint shader which can be applied to SVG elements. | - | imageSrc |
| [`Noise`](https://reactbits.dev/animations/noise) | Animated film grain / noise overlay adding subtle texture and motion. | - | - |
| [`OrbitImages`](https://reactbits.dev/animations/orbit-images) | SVG Path customizable orbiting images effect. | motion | - |
| [`PixelSwap`](https://reactbits.dev/animations/pixel-swap) | Pixel fragments assemble into a full cover, swap arbitrary content, then dissolve away with reversible colors and triggers. | - | firstContent, secondContent |
| [`PixelTrail`](https://reactbits.dev/animations/pixel-trail) | Pixelated cursor trail emitting fading squares with retro digital feel. | @react-three/drei, @react-three/fiber, three | - |
| [`PixelTransition`](https://reactbits.dev/animations/pixel-transition) | Pixel dissolve transition for content reveal on hover. | gsap | firstContent, secondContent |
| [`Ribbons`](https://reactbits.dev/animations/ribbons) | Flowing responsive ribbons/cursor trail driven by physics and pointer motion. | ogl | - |
| [`RippleDistortion`](https://reactbits.dev/animations/ripple-distortion) | Pointer-driven water displacement that warps content and leaves a decaying wake. | ogl | - |
| [`ScrollExpand`](https://reactbits.dev/animations/scroll-expand) | A rounded media frame that grows to full bleed as it scrolls through the viewport. | - | - |
| [`ShapeBlur`](https://reactbits.dev/animations/shape-blur) | Morphing blurred geometric shape. The effect occurs on hover. | three | - |
| [`SplashCursor`](https://reactbits.dev/animations/splash-cursor) | Liquid splash burst at cursor with curling ripples and waves. | - | - |
| [`StarBorder`](https://reactbits.dev/animations/star-border) | Animated star / sparkle border orbiting content with twinkle pulses. | - | - |
| [`StickerPeel`](https://reactbits.dev/animations/sticker-peel) | Sticker corner lift + peel interaction using 3D transform and shadow depth. | gsap | imageSrc |
| [`Strands`](https://reactbits.dev/animations/strands) | Glowing ribbon-like strands that ripple and weave across a transparent canvas. | ogl | - |
| [`SwarmCursor`](https://reactbits.dev/animations/swarm-cursor) | Flocking particle swarm that chases the pointer, jostles for space and drifts apart at rest. | ogl | - |
| [`TargetCursor`](https://reactbits.dev/animations/target-cursor) | A cursor follow animation with 4 corners that lock onto targets. | gsap | - |

## Components (47)

| CLI name | What it does | Deps | Required props |
|---|---|---|---|
| [`AccordionGallery`](https://reactbits.dev/components/accordion-gallery) | Panels expand on hover or focus, revealing parallax imagery and captions. | gsap | - |
| [`AnimatedList`](https://reactbits.dev/components/animated-list) | List items enter with staggered motion variants for polished reveals. | motion | - |
| [`BorderGlow`](https://reactbits.dev/components/border-glow) | Glowing mesh-gradient border that follows cursor direction and intensifies near edges. | - | - |
| [`BounceCards`](https://reactbits.dev/components/bounce-cards) | Cards bounce that bounce in on mount. | gsap | - |
| [`BubbleMenu`](https://reactbits.dev/components/bubble-menu) | Floating circular expanding menu with staggered item reveal. | gsap | logo |
| [`CardNav`](https://reactbits.dev/components/card-nav) | Expandable navigation bar with card panels revealing nested links. | gsap, react-icons | logo, items |
| [`CardSwap`](https://reactbits.dev/components/card-swap) | Cards animate position swapping with smooth layout transitions. | gsap | children |
| [`Carousel`](https://reactbits.dev/components/carousel) | Responsive carousel with touch gestures, looping and transitions. | motion, react-icons | - |
| [`ChromaGrid`](https://reactbits.dev/components/chroma-grid) | A responsive grid of grayscale tiles. Hovering the grid reaveals their colors. | gsap | - |
| [`CircularCarousel`](https://reactbits.dev/components/circular-carousel) | A 3D ring of images with four layouts, bendable cards, depth fade, momentum drag, snapping and click to focus. | - | - |
| [`CircularGallery`](https://reactbits.dev/components/circular-gallery) | Circular orbit gallery rotating images. | ogl | - |
| [`Counter`](https://reactbits.dev/components/counter) | Flexible animated counter supporting increments + easing. | motion | value |
| [`CurvedInput`](https://reactbits.dev/components/curved-input) | Arc-bent input bar with text, caret and submit button all following the curve. | - | - |
| [`DecayCard`](https://reactbits.dev/components/decay-card) | Hover parallax effect that disintegrates the content of a card. | gsap | - |
| [`DepthCarousel`](https://reactbits.dev/components/depth-carousel) | Cards recede into depth on a 3D rail, with drag, keyboard and auto-advance. | gsap | - |
| [`Dock`](https://reactbits.dev/components/dock) | macOS style magnifying dock with proximity scaling of icons. | - | - |
| [`DomeGallery`](https://reactbits.dev/components/dome-gallery) | Immersive 3D dome gallery projecting images on a hemispheric surface. | @use-gesture/react | - |
| [`DriftWall`](https://reactbits.dev/components/drift-wall) | An endless perspective wall of tiles drifting past, lifting on hover. | - | - |
| [`ElasticSlider`](https://reactbits.dev/components/elastic-slider) | Slider handle stretches elastically then snaps with spring physics. | motion | - |
| [`FlexCarousel`](https://reactbits.dev/components/flex-carousel) | An infinite image row that flows through invisible liquid glass at its edges, with four bend presets, five entrances, a speed squeeze and click to focus. | ogl | - |
| [`FlowingMenu`](https://reactbits.dev/components/flowing-menu) | Liquid flowing active indicator glides between menu items. | gsap | - |
| [`FluidGlass`](https://reactbits.dev/components/fluid-glass) | Glassmorphism container with animated liquid distortion refraction. | @react-three/drei, @react-three/fiber, maath, three | - |
| [`FlyingPosters`](https://reactbits.dev/components/flying-posters) | 3D posters rotate on scroll infinitely. | ogl | - |
| [`Folder`](https://reactbits.dev/components/folder) | Interactive folder opens to reveal nested content smooth motion. | - | - |
| [`GlassIcons`](https://reactbits.dev/components/glass-icons) | Icon set styled with frosted glass blur. | - | items |
| [`GlassSurface`](https://reactbits.dev/components/glass-surface) | Advanced Apple-style glass surface with real-time distortion + lighting. | - | - |
| [`GooeyNav`](https://reactbits.dev/components/gooey-nav) | Navigation indicator morphs with gooey blob transitions between items. | - | items |
| [`InfiniteMenu`](https://reactbits.dev/components/infinite-menu) | Horizontally looping menu effect that scrolls endlessly with seamless wrap. | gl-matrix | - |
| [`InfiniteSpiral`](https://reactbits.dev/components/infinite-spiral) | An endlessly looping 3D helix of images with customizable motion, depth, spacing and interaction. | - | - |
| [`Lanyard`](https://reactbits.dev/components/lanyard) | Swinging 3D lanyard / badge card with realistic inertial motion. | three | - |
| [`LineSidebar`](https://reactbits.dev/components/line-sidebar) | Static list navigation with a cursor-proximity effect that shifts and highlights nearby items. | - | - |
| [`MagicBento`](https://reactbits.dev/components/magic-bento) | Interactive bento grid tiles expand + animate with various options. | gsap | - |
| [`Masonry`](https://reactbits.dev/components/masonry) | Responsive masonry layout with animated reflow + gaps optimization. | gsap | items |
| [`ModelViewer`](https://reactbits.dev/components/model-viewer) | Three.js model viewer with orbit controls and lighting presets. | @react-three/drei, @react-three/fiber, three | - |
| [`MorphSlider`](https://reactbits.dev/components/morph-slider) | WebGL slider that melts between images with a displacement transition. | gsap, ogl | - |
| [`OptionWheel`](https://reactbits.dev/components/option-wheel) | Curved option picker that spins via scroll, drag, or arrow keys, fading and tilting items away from the selection. | - | - |
| [`PillNav`](https://reactbits.dev/components/pill-nav) | Minimal pill nav with sliding active highlight + smooth easing. | gsap, react-router-dom | logo, items |
| [`PixelCard`](https://reactbits.dev/components/pixel-card) | Card content revealed through pixel expansion transition. | - | children |
| [`ProfileCard`](https://reactbits.dev/components/profile-card) | Animated profile card glare with 3D hover effect. | - | - |
| [`ReflectiveCard`](https://reactbits.dev/components/reflective-card) | Card with dynamic webcam reflection and glare effects that respond to cursor movement. | lucide-react | - |
| [`ScrollStack`](https://reactbits.dev/components/scroll-stack) | Overlapping card stack reveals on scroll with depth layering. | lenis | children |
| [`SpecularButton`](https://reactbits.dev/components/specular-button) | Glass button with a shader-driven specular rim light that sweeps around the edge and follows the cursor. | ogl | - |
| [`SpotlightCard`](https://reactbits.dev/components/spotlight-card) | Dynamic spotlight follows cursor casting gradient illumination. | - | - |
| [`Stack`](https://reactbits.dev/components/stack) | Layered stack with swipe animations, autoplay and smooth transitions. | motion | - |
| [`StaggeredMenu`](https://reactbits.dev/components/staggered-menu) | Menu with staggered item animations and smooth transitions on open/close. | gsap | isFixed |
| [`Stepper`](https://reactbits.dev/components/stepper) | Animated multi-step progress indicator with active state transitions. | motion | children |
| [`TiltedCard`](https://reactbits.dev/components/tilted-card) | 3D perspective tilt card reacting to pointer. | motion | imageSrc |

## Micro (34)

| CLI name | What it does | Deps | Required props |
|---|---|---|---|
| [`BellToggle`](https://reactbits.dev/micro/bell-toggle) | Pill toggle that answers a press at three tempos: the bell rings on damped keyframes, the label blur-crossfades, and the pill unfurls to the longer label through a clip-path on a critically damped spring. The pressed state is the receipt. | @hugeicons/core-free-icons, @hugeicons/react, motion | - |
| [`BranchedMenu`](https://reactbits.dev/micro/branched-menu) | Collapsible menu whose sections unfold into a trunk with a curved branch to each child, and an accent line that travels down the trunk and around the curve to whatever you pick, while a marker glides to the open section. | @hugeicons/core-free-icons, @hugeicons/react | - |
| [`CallChip`](https://reactbits.dev/micro/call-chip) | Inline tool-call chip whose fill wipes across while a live ms counter ticks, completing with a green wash on success or stopping short and shaking red with a retry glyph on error. | @hugeicons/core-free-icons, @hugeicons/react | - |
| [`CodeSlots`](https://reactbits.dev/micro/code-slots) | One-time-code input where a hidden overlay input owns focus, paste and SMS autofill while each slot lands its digit on one spring: the fill swells from the centre, the digit rises and the caret glides; a wrong code drains the slots in a cascade, a right one merges them into a single accent wash. | @hugeicons/core-free-icons, @hugeicons/react, motion | - |
| [`CometDial`](https://reactbits.dev/micro/comet-dial) | Tick-ring dial you flick by angle: the reading launches on a spring and a velocity-driven comet streaks behind the lit head, trailing the direction of travel and vanishing at rest. | motion | - |
| [`DodgeField`](https://reactbits.dev/micro/dodge-field) | Wrapper that makes any child flee the pointer inside a bounded field, dodges once per approach, then relents after a few tries and glides home. | motion | - |
| [`FlipCard`](https://reactbits.dev/micro/flip-card) | Two-faced card that flips in 3D on a click, a drag or a flick, settling on a spring that carries your release velocity, with an optional cursor tilt, a sheen that follows the pointer and a shadow that narrows as it turns edge on. | motion | - |
| [`FolderFloat`](https://reactbits.dev/micro/folder-float) | Folder that opens on hover or press: the flap tilts toward you, a paper edge rises, and its notes spring out from behind the flap into a floating cloud to pick from, then sink back when the folder closes. | matter-js | - |
| [`FuseButton`](https://reactbits.dev/micro/fuse-button) | Action button whose done state carries its own undo on a burning fuse: press, the label crossfades to Undo, a hairline burns for the undo window, and Undo or Escape runs it back. | @hugeicons/core-free-icons, @hugeicons/react | - |
| [`GlideSelect`](https://reactbits.dev/micro/glide-select) | Select chip whose menu pops out of its own corner and whose single hover highlight glides between rows, remembering where you left it so re-entry slides from there instead of blinking in. | @hugeicons/core-free-icons, @hugeicons/react | - |
| [`HoldButton`](https://reactbits.dev/micro/hold-button) | Hold-to-confirm button whose liquid fill rises while pressed, snaps back on an early release and swaps its label through a blur when the hold completes. | - | - |
| [`JellyRadio`](https://reactbits.dev/micro/jelly-radio) | Radio group of labelled chips where the chosen one swells wide-then-tall on two springs and barges its neighbours outward with a travelling stagger, so a selection reads as a force moving through the row. | motion | - |
| [`LatticeLoader`](https://reactbits.dev/micro/lattice-loader) | Inline agent-status row: a 3x3 or 4x4 lattice whose cells brighten in a phase-offset wave beside a verb and a live stopwatch, resolving into a check or a cross when the task ends. | - | - |
| [`PaperCrumple`](https://reactbits.dev/micro/paper-crumple) | An image that crumples into a textured 3D sheet while held and follows the grabbed point as you drag. Release it as a crumpled ball, unfold it flat, or leave the paper creased, with customizable folds, paper grain, lighting and shadows. | three | src |
| [`PeekRating`](https://reactbits.dev/micro/peek-rating) | Star rating you can try before you commit: sweeping the row lifts a trailing wave of stars up to the pointer while a tip hops along with the label; a click commits with a pop. | @hugeicons/core-free-icons, @hugeicons/react | - |
| [`PromptBar`](https://reactbits.dev/micro/prompt-bar) | Chat composer with an @ sources menu, a / commands menu, a model picker, dictation and attachments, whose send tile charges to ink the moment there is something to send and morphs its arrow into a stop square while busy. | @hugeicons/core-free-icons, @hugeicons/react, motion | - |
| [`PulseHeart`](https://reactbits.dev/micro/pulse-heart) | Like button that contracts to a dot, flips colour at its smallest frame and pulses back while the count swaps one glyph. | @hugeicons/core-free-icons | - |
| [`RefineFrame`](https://reactbits.dev/micro/refine-frame) | Reserved-aspect frame that walks any media through queued, generating, refining and complete without layout shift: each stage is one blur, saturate, scale and opacity tween, a soft band sweeps while it works, a chip reports the stage, and an error dims the picture behind a retry pill. | @hugeicons/core-free-icons, @hugeicons/react | - |
| [`RubberSegment`](https://reactbits.dev/micro/rubber-segment) | Segmented control with a rubber thumb: taps stretch it across the gap and squash it onto the target, and you can grab, drag and flick it between slots. | motion | items |
| [`ScrubField`](https://reactbits.dev/micro/scrub-field) | Number chip you drag to scrub: the value follows the hand, pushes past the range on a rubber band, and a click without moving opens it for typing. | motion | - |
| [`Shredder`](https://reactbits.dev/micro/shredder) | A list with a paper shredder at the bottom. Drag a row into the slit and the rollers tug it in, pull it through and cut it into strips that curl out underneath, tumble away and fade out. The rest of the list settles down on a spring and the shredded item is handed to you to delete. | - | renderItem |
| [`SlideCommit`](https://reactbits.dev/micro/slide-commit) | Slide-to-confirm handle that plants with a spinner while your action runs, unfurls into a done pill on success and springs home with a squash and shake on failure. | @hugeicons/core-free-icons, @hugeicons/react, motion | - |
| [`SlingButton`](https://reactbits.dev/micro/sling-button) | Send button you pull back like a slingshot: the band stretches, a power arc arms it, and releasing fires the action with the flick's velocity. | @hugeicons/core-free-icons, @hugeicons/react, motion | - |
| [`SloshGauge`](https://reactbits.dev/micro/slosh-gauge) | Tank gauge whose liquid chases the value with mass, tilts with its own speed and splashes against the top when it slams full; optionally a vertical slider. | - | - |
| [`SpringCheck`](https://reactbits.dev/micro/spring-check) | Checkbox row where a single spring fills the box, draws the tick, strikes the label and dims the words in one press. | @hugeicons/core-free-icons, motion | - |
| [`SquishSwitch`](https://reactbits.dev/micro/squish-switch) | Drag-scrubbable switch whose thumb stretches by how fast it moves, flips at the midpoint and squashes against the track end on a flick. | motion | - |
| [`StatusMark`](https://reactbits.dev/micro/status-mark) | A 20px status glyph for agent task lists that morphs in place from a dashed idle ring to a spinning or real-progress arc, then draws a check or a cross, with an optional label strike. | motion | - |
| [`SwipeRow`](https://reactbits.dev/micro/swipe-row) | List row that swipes open to reveal actions, snaps by flick velocity, and deletes on a full swipe that stretches the action colour across the row. | @hugeicons/core-free-icons, @hugeicons/react, motion | - |
| [`SwipeToast`](https://reactbits.dev/micro/swipe-toast) | Single toast that rises through its bottom edge, swipes down to dismiss on a flick or a distance, and burns a thin fuse for exactly its remaining time; hover pauses it and an inline mode keeps it inside any container. | @hugeicons/core-free-icons, @hugeicons/react, motion | - |
| [`TearTicket`](https://reactbits.dev/micro/tear-ticket) | Ticket whose perforated stub tears off by hand: paper bridges stretch into fibres and snap one by one from the far end, the torn edges are jagged and fit each other, the freed stub dangles and drops, and the body is stamped as used. The artwork tilts in 3D with parallax on hover. | motion | - |
| [`ThoughtLine`](https://reactbits.dev/micro/thought-line) | Reasoning-trace header: a glyph and a label breathe beside a live clock while steps appear beneath, then the line settles on one beat into "Thought for 4.2s" through a blur crossfade and the trace folds into it. | @hugeicons/core-free-icons, @hugeicons/react, motion | - |
| [`VoicePill`](https://reactbits.dev/micro/voice-pill) | Mic button that swells into a tinted capsule of level-driven equalizer bars and an elapsed clock while held or toggled, then relaxes back into the mic on release; simulated voice by default, real microphone as an opt-in. | @hugeicons/core-free-icons, @hugeicons/react | - |
| [`WakeSlider`](https://reactbits.dev/micro/wake-slider) | Range slider drawn as thin bars with no thumb: drag speed raises a wake that trails behind the handle and flattens again at rest. | motion | - |
| [`WarmTooltip`](https://reactbits.dev/micro/warm-tooltip) | Tooltip group with one shared delay: the first label waits and pops from its trigger, then siblings open instantly while the group is warm, with an optional velocity lean. | motion | content, children |

## Backgrounds (59)

| CLI name | What it does | Deps | Required props |
|---|---|---|---|
| [`AcidSquares`](https://reactbits.dev/backgrounds/acid-squares) | A crystalline corridor of stacked squares receding into depth. | ogl | - |
| [`AeroShards`](https://reactbits.dev/backgrounds/aero-shards) | A GPU-driven wind sculpture of folded foil shards with crisp detail, content-safe placements, and responsive pointer interactions. | vgpu | - |
| [`Aurora`](https://reactbits.dev/backgrounds/aurora) | Flowing aurora gradient background. | ogl | - |
| [`Balatro`](https://reactbits.dev/backgrounds/balatro) | The balatro shader, fully customizalbe and interactive. | ogl | - |
| [`Ballpit`](https://reactbits.dev/backgrounds/ballpit) | Physics ball pit simulation with bouncing colorful spheres. | gsap, three | - |
| [`Beams`](https://reactbits.dev/backgrounds/beams) | Crossing animated ribbons with customizable properties. | @react-three/drei, @react-three/fiber, three | - |
| [`ColorBends`](https://reactbits.dev/backgrounds/color-bends) | Vibrant color bends with smooth flowing animation. | three | - |
| [`CRTWarp`](https://reactbits.dev/backgrounds/crt-warp) | Full-canvas CRT plasma with curved distortion, scanlines, bloom and pointer interaction. | three | - |
| [`DarkVeil`](https://reactbits.dev/backgrounds/dark-veil) | Subtle dark background with a smooth animation and postprocessing. | ogl | - |
| [`Dither`](https://reactbits.dev/backgrounds/dither) | Retro dithered noise shader background. | @react-three/fiber, @react-three/postprocessing, postprocessing, three | - |
| [`DotField`](https://reactbits.dev/backgrounds/dot-field) | Interactive dot grid with cursor bulge, glow, sparkle, and wave effects. | - | - |
| [`DotGrid`](https://reactbits.dev/backgrounds/dot-grid) | Animated dot grid with cursor interactions. | gsap | - |
| [`EvilEye`](https://reactbits.dev/backgrounds/evil-eye) | Procedural evil eye shader with animated iris, slit pupil, and fiery outer glow. | ogl | - |
| [`FaultyTerminal`](https://reactbits.dev/backgrounds/faulty-terminal) | Terminal CRT scanline squares effect with flicker + noise. | ogl | - |
| [`Ferrofluid`](https://reactbits.dev/backgrounds/ferrofluid) | A churning magnetic fluid traced by glowing contour lines, with a cursor magnet. | ogl | - |
| [`FloatingLines`](https://reactbits.dev/backgrounds/floating-lines) | 3D floating lines that react to cursor movement. | three | - |
| [`Galaxy`](https://reactbits.dev/backgrounds/galaxy) | Parallax realistic starfield with pointer interactions. | ogl | - |
| [`GhostFibers`](https://reactbits.dev/backgrounds/ghost-fibers) | A deep-blue recursive fiber field with luminous bands, radial twisting and soft atmospheric glow. | ogl | - |
| [`GradientBlinds`](https://reactbits.dev/backgrounds/gradient-blinds) | Layered gradient blinds with spotlight and noise distortion. | ogl | - |
| [`GradientWaves`](https://reactbits.dev/backgrounds/gradient-waves) | Raymarched sine waves rolling toward a soft, hazy horizon. | ogl | - |
| [`Grainient`](https://reactbits.dev/backgrounds/grainient) | Grainy gradient swirls with soft wave distortion. | ogl | - |
| [`GridDistortion`](https://reactbits.dev/backgrounds/grid-distortion) | Warped grid mesh distorts smoothly reacting to cursor. | three | imageSrc |
| [`GridMotion`](https://reactbits.dev/backgrounds/grid-motion) | Perspective moving grid lines based on cusror position. | gsap | - |
| [`GridScan`](https://reactbits.dev/backgrounds/grid-scan) (named export) | Animated grid room 3D scan effect and cool interactions. | face-api.js, postprocessing, three | - |
| [`Hyperspeed`](https://reactbits.dev/backgrounds/hyperspeed) | Animated lines continuously moving to simulate hyperspace travel on click hold. | postprocessing, three | - |
| [`Iridescence`](https://reactbits.dev/backgrounds/iridescence) | Slick iridescent shader with shifting waves. | ogl | - |
| [`LetterGlitch`](https://reactbits.dev/backgrounds/letter-glitch) | Matrix style letter animation. | - | - |
| [`Lightfall`](https://reactbits.dev/backgrounds/lightfall) | Colorful light streaks raining down a glowing tunnel with a cursor light. | ogl | - |
| [`Lightning`](https://reactbits.dev/backgrounds/lightning) | Procedural lightning bolts with branching and glow flicker. | - | - |
| [`LightPillar`](https://reactbits.dev/backgrounds/light-pillar) | Vertical pillar of light with glow effects. | three | - |
| [`LightRays`](https://reactbits.dev/backgrounds/light-rays) | Volumetric light rays/beams with customizable direction. | ogl | - |
| [`LightTunnel`](https://reactbits.dev/backgrounds/light-tunnel) | A radial fibre-optic tunnel with light pulses racing into depth. | ogl | - |
| [`LineWaves`](https://reactbits.dev/backgrounds/line-waves) | Animated line wave pattern with colorful warped distortion. | ogl | - |
| [`LiquidChrome`](https://reactbits.dev/backgrounds/liquid-chrome) | Liquid metallic chrome shader with flowing reflective surface. | ogl | - |
| [`LiquidEther`](https://reactbits.dev/backgrounds/liquid-ether) | Interactive liquid shader with flowing distortion and customizable colors. | three | - |
| [`MicroSlats`](https://reactbits.dev/backgrounds/micro-slats) | A wall of tiny slats that becomes a rolling sea in perspective, with glinting crests, four presets, a real fluid the cursor stirs and an intro that rolls in from the horizon. | ogl | - |
| [`MoltenMetal`](https://reactbits.dev/backgrounds/molten-metal) | Swirling caustic plasma filaments with molten, white-hot cores. | ogl | - |
| [`Orb`](https://reactbits.dev/backgrounds/orb) | Floating energy orb with customizable hover effect. | ogl | - |
| [`Particles`](https://reactbits.dev/backgrounds/particles) | Configurable particle system. | ogl | - |
| [`PatternWaves`](https://reactbits.dev/backgrounds/pattern-waves) | A lit halftone surface of dots, lines, crosses or glyphs that moves like draped silk, rolling swells or ripples, with six presets, one-color theming and a cursor that sends ripples through it. | ogl | - |
| [`PixelBlast`](https://reactbits.dev/backgrounds/pixel-blast) | Exploding pixel particle bursts with optional liquid postprocessing. | postprocessing, three | - |
| [`PixelSnow`](https://reactbits.dev/backgrounds/pixel-snow) | Falling pixelated snow effect with customizable density and speed. | three | - |
| [`Plasma`](https://reactbits.dev/backgrounds/plasma) | Organic plasma gradients swirl + morph with smooth turbulence. | ogl | - |
| [`PlasmaWave`](https://reactbits.dev/backgrounds/plasma-wave) | Raymarched plasma waves with dual-wave interference and OGL. | ogl | - |
| [`Prism`](https://reactbits.dev/backgrounds/prism) | Rotating prism with configurable intensity, size, and colors. | ogl | - |
| [`PrismaticBurst`](https://reactbits.dev/backgrounds/prismatic-burst) | Burst of light rays with controllable color, distortion, amount. | ogl | - |
| [`Radar`](https://reactbits.dev/backgrounds/radar) | Radar sweep effect with concentric rings, radial spokes, and a rotating beam. | ogl | - |
| [`RippleGrid`](https://reactbits.dev/backgrounds/ripple-grid) | A grid that continuously animates with a ripple effect. | ogl | - |
| [`Scanner`](https://reactbits.dev/backgrounds/scanner) | Calm interference bands sweeping across the screen like an oscilloscope. | ogl | - |
| [`ShapeGrid`](https://reactbits.dev/backgrounds/shape-grid) | Animated grid with shape variants (square, hexagon, circle, triangle) + direction customization. | - | - |
| [`ShapeWaves`](https://reactbits.dev/backgrounds/shape-waves) | A WebGPU field of triangles, circles and squares that brighten and grow along rolling waves, with an optional text cutout the waves flow around. | vgpu | - |
| [`SideRays`](https://reactbits.dev/backgrounds/side-rays) | Animated light rays emanating from the side with customizable colors and speed. | ogl | - |
| [`Silk`](https://reactbits.dev/backgrounds/silk) | Smooth waves background with soft lighting. | @react-three/fiber, three | - |
| [`SlicedWaves`](https://reactbits.dev/backgrounds/sliced-waves) | A grid of soft glowing bars rippling like a slatted equalizer. | ogl | - |
| [`SoftAurora`](https://reactbits.dev/backgrounds/soft-aurora) | Soft aurora borealis shader with 3D Perlin noise and cosine gradient palettes. | ogl | - |
| [`Threads`](https://reactbits.dev/backgrounds/threads) | Animated pattern of lines forming a fabric-like motion. | ogl | - |
| [`Topography`](https://reactbits.dev/backgrounds/topography) | A living contour map with glowing, elevation-tinted lines. | ogl | - |
| [`Waves`](https://reactbits.dev/backgrounds/waves) | Layered lines that form smooth wave patterns with animation. | - | - |
| [`WebThreads`](https://reactbits.dev/backgrounds/web-threads) | Glowing sine threads woven through a luminous convergence point. | ogl | - |

