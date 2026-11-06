import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return { name: "Network Design Studio", short_name: "Network Studio", description: "Minimum spanning tree laboratory for cost-effective network design.", start_url: "/", display: "standalone", background_color: "#0b1526", theme_color: "#0b1526", icons: [{ src: "/network-design-studio-logo.png", sizes: "1536x1024", type: "image/png" }] };
}
