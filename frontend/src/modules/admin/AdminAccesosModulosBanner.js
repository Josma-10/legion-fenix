import React from 'react';
import Link from 'next/link';
import { Layers, HeartPulse, ClipboardList, Users, ArrowRight, Globe } from 'lucide-react';

const MODULE_LINKS = [
  {
    href: '/categorias',
    title: 'Categorías y Disciplinas',
    desc: 'Campo, F7 y Sala (Bebés a Libre)',
    icon: Layers,
    roles: ['ADMINISTRADOR', 'ANALISTA_ADMIN'],
  },
  {
    href: '/portal-fisio',
    title: 'Módulo Fisioterapia',
    desc: 'Lesiones SVG, podología y ejercicios 2D',
    icon: HeartPulse,
    roles: ['ADMINISTRADOR'],
  },
  {
    href: '/portal-coach',
    title: 'Módulo Entrenadores',
    desc: 'Microciclos, tabla 2D y evaluación',
    icon: ClipboardList,
    roles: ['ADMINISTRADOR'],
  },
  {
    href: '/portal-padres',
    title: 'Módulo Representantes',
    desc: 'Fichas, inscripciones y semáforo',
    icon: Users,
    roles: ['ADMINISTRADOR'],
  },
  {
    href: '/',
    title: 'Portal Hinchada y Tienda',
    desc: 'Fixture oficial y pedidos de tienda',
    icon: Globe,
    roles: ['ANALISTA_ADMIN'],
  },
];

export default function AdminAccesosModulosBanner({ userRole = 'ADMINISTRADOR' }) {
  const visibleLinks = MODULE_LINKS.filter((item) => item.roles.includes(userRole));

  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 ${
        visibleLinks.length >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-2'
      } gap-3`}
    >
      {visibleLinks.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="card-fenix p-3.5 hover:border-rojo-fuego transition flex items-center justify-between gap-3 group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-lg bg-vinotinto/40 border border-vinotinto text-rojo-fuego shrink-0">
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-white truncate group-hover:text-rojo-fuego transition">
                  {item.title}
                </p>
                <p className="text-[11px] text-texto-secundario truncate">{item.desc}</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-texto-secundario group-hover:text-rojo-fuego shrink-0 transition" />
          </Link>
        );
      })}
    </div>
  );
}
