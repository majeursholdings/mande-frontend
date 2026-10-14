import { Layers, Paintbrush, Ruler, type LucideIcon } from "lucide-react";

/** What makers do on the machines at the MANDE factory in Lagos. Shown on the homepage and the Services page. */
export const FACTORY_WORK: { icon: LucideIcon; title: string; description: string }[] = [
    { icon: Ruler, title: "Cut and shape", description: "Panels and parts cut with precision, ready to join." },
    { icon: Layers, title: "Join and assemble", description: "Space and equipment for pieces bigger than most workshops can take." },
    { icon: Paintbrush, title: "Sand and finish", description: "An even, showroom-standard finish on every surface." },
];
