import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return { name: "Network Design Studio", short_name: "Network Studio", description: "Minimum spanning tree laboratory for cost-effective network design.", start_url: "/", display: "standalone", background_color: "#15231f", theme_color: "#15231f" };
}
