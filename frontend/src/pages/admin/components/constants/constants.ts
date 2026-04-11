// ── Admin Nav Constants ──────────────────────────────────────────────────────

// ── Nav Button Type ───────────────────────────────────────────────────────────
interface NavButton {
   id: number;
   name: string;
   href: string;
}

// ── Nav Buttons ──────────────────────────────────────────────────────────────
export const navButtons: NavButton[] = [
   { id: 1, name: "productos", href: "productos" },
   { id: 2, name: "categorias", href: "#categories" },
   { id: 3, name: "pedidos", href: "#pedidos" },
   { id: 4, name: "usuarios", href: "#usuarios" },
   { id: 5, name: "contactos", href: "#contactos" },
   { id: 6, name: "ajustes", href: "ajustes" },
];
