"use client"

import WildHuntFooter from "@/components/ui/wild-hunt-footer"

// Demo with the component's default painting and cut-out (loaded from cdn.21st.dev).
// The original demo inlines both images as ~180 KB of base64 data URIs so it makes
// no network requests. For production, put both files in /public and pass
// e.g. image={{ src: "/footer/painting.webp", cutout: "/footer/riders.webp" }}.
export default function WildHuntFooterDemo() {
  return (
    <div className="w-full">
      <WildHuntFooter
        image={{
          src: "https://cdn.21st.dev/assets/mirror/67/671b69b8614847816a300a1d11ee5704a7b2f5c51b8b50d45f17dfc49af09b68.jpg",
          alt: "The Wild Hunt of Odin by Peter Nicolai Arbo, 1872",
          position: "50% 26%",
          cutout: "https://cdn.21st.dev/assets/mirror/69/692fb74acc74e0097901ca85075b1efbfdeebcb4d5edfe99874e9ec7e4847e0a.webp",
        }}
      />
    </div>
  )
}
