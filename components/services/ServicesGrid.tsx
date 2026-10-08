"use client";

import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import ServiceCard from "@/components/services/ServiceCard";
import ServiceContactDialog from "@/components/services/ServiceContactDialog";
import { services, type ServiceId } from "@/lib/data/services";

// Client Component: guarda qual serviço foi clicado e abre um único popup
// compartilhado por todos os cards (em vez de 9 <dialog> na página).
export default function ServicesGrid() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState<ServiceId | null>(null);

  function openContact(id: ServiceId) {
    // flushSync: o conteúdo do serviço precisa estar no DOM antes do
    // showModal(), que é quando o navegador escolhe onde pôr o foco.
    flushSync(() => setSelected(id));
    dialogRef.current?.showModal();
  }

  return (
    <>
      <div className="mt-8 grid grid-cols-2 gap-3.5 xs:grid-cols-[repeat(auto-fit,minmax(220px,1fr))] xs:gap-5">
        {services.map((service, index) => (
          <ServiceCard
            key={service.id}
            id={service.id}
            icon={service.icon}
            index={index}
            onContact={() => openContact(service.id)}
          />
        ))}
      </div>
      <ServiceContactDialog ref={dialogRef} serviceId={selected} />
    </>
  );
}
