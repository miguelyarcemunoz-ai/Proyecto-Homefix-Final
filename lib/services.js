export const services = {
  Carpinteria: {
    slug: 'carpinteria', title: 'Carpintería', eyebrow: 'Madera · Diseño · Precisión',
    description: 'Muebles a medida, puertas, closets y restauraciones realizadas por profesionales.',
    image: '/img/carpinteria.jpg',
    bullets: ['Fabricación de muebles a medida','Reparación de puertas y ventanas de madera','Instalación de closets y estanterías','Restauración de muebles antiguos','Armado e instalación de pisos en madera']
  },
  Plomeria: {
    slug: 'plomeria', title: 'Plomería', eyebrow: 'Agua · Mantenimiento · Respuesta rápida',
    description: 'Soluciones para fugas, instalaciones hidráulicas, desagües y mantenimiento.',
    image: '/img/plomeria.jpg',
    bullets: ['Reparación de fugas y tuberías','Instalación de sanitarios y grifería','Destaponamiento de desagües','Revisión de sistemas de agua caliente','Mantenimiento preventivo de redes hidráulicas']
  },
  Electrodomesticos: {
    slug: 'electrodomesticos', title: 'Electrodomésticos', eyebrow: 'Diagnóstico · Reparación · Confianza',
    description: 'Técnicos para neveras, lavadoras, hornos, microondas y más.',
    image: '/img/electrodomesticos.jpg',
    bullets: ['Reparación de lavadoras y secadoras','Reparación de neveras y congeladores','Mantenimiento de estufas y hornos','Reparación de microondas y licuadoras','Diagnóstico general de electrodomésticos']
  }
};
export function serviceBySlug(slug) { return Object.values(services).find(s => s.slug === slug); }
export function dbServiceFromSlug(slug) { const s = serviceBySlug(slug); return s ? Object.keys(services).find(k => services[k].slug === slug) : null; }
