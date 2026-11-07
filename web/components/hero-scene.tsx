"use client"

// Immersive 3D hero: "Chroma Core".
// A glass knot (physical transmission + iridescence) floats inside two brushed-gold rings,
// surrounded by drifting glass shards and a field of pigment particles.
// Two coloured lights orbit like stage lights (ember + iris), the camera follows the
// pointer with inertia and dollies back as the visitor scrolls out of the hero.
//
// Performance: three.js is loaded only on the client after first paint; DPR capped;
// fewer particles and no transmission pass on small screens; rendering stops when the
// canvas leaves the viewport or the tab is hidden. Reduced motion renders one still frame.
import { useEffect, useRef, useState } from "react"
import { prefersReducedMotion } from "@/components/motion"

export function HeroScene({ className = "" }: { className?: string }) {
  const host = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const el = host.current
    if (!el) return
    let disposed = false
    let cleanup = () => {}

    const start = async () => {
      const THREE = await import("three")
      const { RoomEnvironment } = await import("three/examples/jsm/environments/RoomEnvironment.js")
      if (disposed) return

      const small = window.innerWidth < 768
      const still = prefersReducedMotion()
      let renderer: InstanceType<typeof THREE.WebGLRenderer>
      try {
        renderer = new THREE.WebGLRenderer({ antialias: !small, alpha: true, powerPreference: "high-performance" })
      } catch {
        return // no WebGL: the CSS fallback behind the canvas stays visible
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, small ? 1.5 : 1.75))
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 0.82
      renderer.outputColorSpace = THREE.SRGBColorSpace
      el.appendChild(renderer.domElement)
      renderer.domElement.setAttribute("aria-hidden", "true")

      const scene = new THREE.Scene()
      const pmrem = new THREE.PMREMGenerator(renderer)
      scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture

      const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100)
      camera.position.set(0, 0, small ? 11 : 9)

      const root = new THREE.Group()
      scene.add(root)

      // Glass knot
      const knotMat = new THREE.MeshPhysicalMaterial({
        color: small ? 0xf1e8ff : 0xffffff,
        metalness: small ? 0.15 : 0,
        roughness: small ? 0.12 : 0.03,
        transmission: small ? 0 : 1,
        thickness: 0.7,
        ior: 1.5,
        attenuationColor: new THREE.Color("#ffd2c4"),
        attenuationDistance: 2.4,
        iridescence: 1,
        iridescenceIOR: 1.35,
        clearcoat: 1,
        clearcoatRoughness: 0.04,
        transparent: small,
        opacity: small ? 0.7 : 1,
        envMapIntensity: 0.9,
      })
      const knot = new THREE.Mesh(new THREE.TorusKnotGeometry(0.95, 0.27, small ? 160 : 260, small ? 24 : 40, 2, 3), knotMat)
      root.add(knot)

      // Brushed-gold rings
      const gold = new THREE.MeshStandardMaterial({ color: 0xd9a95a, metalness: 1, roughness: 0.25, envMapIntensity: 1.1 })
      const ringA = new THREE.Mesh(new THREE.TorusGeometry(2.05, 0.012, 16, 220), gold)
      const ringB = new THREE.Mesh(new THREE.TorusGeometry(2.45, 0.007, 16, 260), gold)
      ringA.rotation.set(1.2, 0.3, 0)
      ringB.rotation.set(0.4, -0.9, 0.2)
      root.add(ringA, ringB)

      // Floating glass shards
      const shardMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.1, metalness: 0.2, transmission: small ? 0 : 0.9, thickness: 0.5, iridescence: 0.8, transparent: true, opacity: 0.75, envMapIntensity: 0.8 })
      const shards: { mesh: InstanceType<typeof THREE.Mesh>; speed: number; phase: number; radius: number; y: number }[] = []
      const shardGeo = new THREE.IcosahedronGeometry(0.075, 0)
      for (let i = 0; i < (small ? 6 : 11); i++) {
        const m = new THREE.Mesh(shardGeo, shardMat)
        const s = 0.6 + Math.random() * 1.4
        m.scale.setScalar(s)
        root.add(m)
        shards.push({ mesh: m, speed: 0.05 + Math.random() * 0.12, phase: Math.random() * Math.PI * 2, radius: 2.6 + Math.random() * 1.6, y: (Math.random() - 0.5) * 3.2 })
      }

      // Pigment particles
      const count = small ? 500 : 1600
      const pos = new Float32Array(count * 3)
      const col = new Float32Array(count * 3)
      const palette = [new THREE.Color("#ff5b3a"), new THREE.Color("#ff3f8e"), new THREE.Color("#8b7bff"), new THREE.Color("#3ee6c8"), new THREE.Color("#f2c66d")]
      for (let i = 0; i < count; i++) {
        const r = 4 + Math.random() * 9
        const th = Math.random() * Math.PI * 2
        const ph = Math.acos(2 * Math.random() - 1)
        pos.set([r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph) * 0.6, r * Math.sin(ph) * Math.sin(th) - 2], i * 3)
        const c = palette[i % palette.length]
        col.set([c.r, c.g, c.b], i * 3)
      }
      const pGeo = new THREE.BufferGeometry()
      pGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3))
      pGeo.setAttribute("color", new THREE.BufferAttribute(col, 3))
      const dot = document.createElement("canvas")
      dot.width = dot.height = 64
      const g = dot.getContext("2d")!
      const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32)
      grd.addColorStop(0, "rgba(255,255,255,1)")
      grd.addColorStop(0.35, "rgba(255,255,255,.35)")
      grd.addColorStop(1, "rgba(255,255,255,0)")
      g.fillStyle = grd
      g.fillRect(0, 0, 64, 64)
      const particles = new THREE.Points(
        pGeo,
        new THREE.PointsMaterial({ size: small ? 0.07 : 0.055, map: new THREE.CanvasTexture(dot), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.85 }),
      )
      scene.add(particles)

      // Stage lights
      const ember = new THREE.PointLight(0xff5b3a, 45, 20, 1.6)
      const iris = new THREE.PointLight(0x8b7bff, 40, 20, 1.6)
      const rim = new THREE.DirectionalLight(0xffffff, 0.9)
      rim.position.set(-4, 5, 3)
      scene.add(ember, iris, rim, new THREE.AmbientLight(0xffffff, 0.15))

      const resize = () => {
        const w = el.clientWidth
        const h = el.clientHeight
        renderer.setSize(w, h, false)
        camera.aspect = w / Math.max(1, h)
        camera.position.z = (w < 768 ? 11 : 9) * (camera.aspect < 1 ? 1.25 : 1)
        camera.updateProjectionMatrix()
        root.position.x = w >= 1024 ? 3.7 : 0
        root.position.y = w >= 1024 ? 0.35 : 1.9
      }
      resize()
      const ro = new ResizeObserver(resize)
      ro.observe(el)

      // Interaction state
      const pointer = { x: 0, y: 0, tx: 0, ty: 0 }
      const onPointer = (e: PointerEvent) => {
        pointer.tx = (e.clientX / window.innerWidth) * 2 - 1
        pointer.ty = (e.clientY / window.innerHeight) * 2 - 1
      }
      window.addEventListener("pointermove", onPointer, { passive: true })
      let scrollP = 0
      const onScroll = () => {
        scrollP = Math.min(1, window.scrollY / Math.max(1, el.clientHeight))
      }
      window.addEventListener("scroll", onScroll, { passive: true })

      let visible = true
      const io = new IntersectionObserver(([e]) => {
        visible = e.isIntersecting
        if (visible) loop()
      })
      io.observe(el)
      const onVis = () => !document.hidden && loop()
      document.addEventListener("visibilitychange", onVis)

      const t0 = performance.now()
      let raf = 0
      const frame = () => {
        const t = (performance.now() - t0) / 1000
        pointer.x += (pointer.tx - pointer.x) * 0.045
        pointer.y += (pointer.ty - pointer.y) * 0.045

        knot.rotation.x = t * 0.12 + pointer.y * 0.35 + scrollP * 1.2
        knot.rotation.y = t * 0.18 + pointer.x * 0.5
        knot.position.y = Math.sin(t * 0.8) * 0.12
        const s = 1 - scrollP * 0.25
        knot.scale.setScalar(s)
        ringA.rotation.z = t * 0.08
        ringB.rotation.z = -t * 0.05
        ringB.rotation.x = 0.4 + Math.sin(t * 0.3) * 0.1
        for (const sh of shards) {
          const a = sh.phase + t * sh.speed
          sh.mesh.position.set(Math.cos(a) * sh.radius, sh.y + Math.sin(t * 0.6 + sh.phase) * 0.25, Math.sin(a) * sh.radius * 0.6)
          sh.mesh.rotation.x += 0.004
          sh.mesh.rotation.y += 0.006
        }
        particles.rotation.y = t * 0.015 + pointer.x * 0.06
        particles.rotation.x = pointer.y * 0.04
        ember.position.set(root.position.x + Math.cos(t * 0.5) * 3, Math.sin(t * 0.7) * 2, 3)
        iris.position.set(root.position.x + Math.cos(t * 0.5 + Math.PI) * 3, Math.cos(t * 0.6) * 2, 2.5)

        camera.position.x = pointer.x * 0.6
        camera.position.y = -pointer.y * 0.4 - scrollP * 0.8
        camera.lookAt(root.position.x * 0.42, root.position.y * 0.35, 0)
        renderer.render(scene, camera)
      }
      const loop = () => {
        cancelAnimationFrame(raf)
        if (still || !visible || document.hidden || disposed) return
        const step = () => {
          if (!visible || document.hidden || disposed) return
          frame()
          raf = requestAnimationFrame(step)
        }
        raf = requestAnimationFrame(step)
      }
      frame()
      setReady(true)
      loop()

      cleanup = () => {
        cancelAnimationFrame(raf)
        ro.disconnect()
        io.disconnect()
        window.removeEventListener("pointermove", onPointer)
        window.removeEventListener("scroll", onScroll)
        document.removeEventListener("visibilitychange", onVis)
        scene.traverse((o) => {
          const m = o as unknown as { geometry?: { dispose(): void }; material?: { dispose(): void } }
          m.geometry?.dispose()
          m.material?.dispose()
        })
        pmrem.dispose()
        renderer.dispose()
        renderer.domElement.remove()
      }
    }

    // wait for the browser to be idle so the 3D never delays the first paint (LCP)
    // on phones / weak devices the 3D only loads after the first interaction (saves ~600 KB JS + GPU time)
    const w = window as unknown as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }
    const nav = navigator as Navigator & { connection?: { saveData?: boolean } }
    if (nav.connection?.saveData) return
    const lazy = window.innerWidth < 768 || (navigator.hardwareConcurrency ?? 8) <= 4
    let id = 0
    const evts = ["pointerdown", "touchstart", "scroll", "keydown"] as const
    const kick = () => {
      evts.forEach((e) => window.removeEventListener(e, kick))
      id = w.requestIdleCallback ? w.requestIdleCallback(() => void start(), { timeout: 1200 }) : window.setTimeout(() => void start(), 300)
    }
    if (lazy) evts.forEach((e) => window.addEventListener(e, kick, { once: true, passive: true }))
    else kick()
    return () => {
      disposed = true
      evts.forEach((e) => window.removeEventListener(e, kick))
      if (!w.requestIdleCallback) window.clearTimeout(id)
      cleanup()
    }
  }, [])

  return (
    <div ref={host} className={`pointer-events-none absolute inset-0 transition-opacity duration-[1600ms] ${ready ? "opacity-100" : "opacity-0"} ${className} [&>canvas]:h-full [&>canvas]:w-full`} />
  )
}
