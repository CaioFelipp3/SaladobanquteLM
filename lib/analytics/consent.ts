"use client";

import { useSyncExternalStore } from "react";

/**
 * Escolha do visitante sobre os cookies de análise (Google Analytics).
 *
 * Fica no localStorage do próprio navegador, com a data da decisão: depois de
 * 12 meses a escolha expira e o banner aparece de novo. Guardar a escolha é
 * estritamente necessário (sem isso o banner voltaria a cada página), por isso
 * não depende de consentimento.
 *
 * Se o localStorage não estiver disponível (alguns modos privados), a escolha
 * vale só enquanto a aba estiver aberta (`memoryConsent`).
 */
export type ConsentStatus = "granted" | "denied";

const STORAGE_KEY = "cookie-consent";
const CHANGE_EVENT = "cookie-consent-change";
const OPEN_EVENT = "cookie-consent-open";
const MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;

let memoryConsent: ConsentStatus | null = null;

export function readConsent(): ConsentStatus | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    // Ler funciona mas gravar falhou (cota cheia, armazenamento bloqueado):
    // sem este fallback, o banner voltava a cada página mesmo após a escolha.
    if (!raw) return memoryConsent;
    const { status, date } = JSON.parse(raw) as { status?: unknown; date?: unknown };
    const isValid =
      (status === "granted" || status === "denied") &&
      typeof date === "number" &&
      Date.now() - date < MAX_AGE_MS;
    return isValid ? status : null;
  } catch {
    return memoryConsent;
  }
}

export function saveConsent(status: ConsentStatus) {
  memoryConsent = status;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ status, date: Date.now() }));
  } catch {
    // Sem localStorage: fica só a escolha em memória.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  // "storage" sincroniza a escolha feita em outra aba do mesmo site.
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/**
 * Estado atual do consentimento. "pending" no servidor e na hidratação: as
 * páginas são geradas no build (SSG), sem acesso ao navegador do visitante;
 * o valor real é lido logo depois, no cliente.
 */
export function useConsent(): ConsentStatus | "unset" | "pending" {
  return useSyncExternalStore(
    subscribe,
    () => readConsent() ?? "unset",
    () => "pending",
  );
}

/** Reabre o banner (link "Preferências de cookies" do rodapé). */
export function openConsentBanner() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

export function onConsentBannerOpen(handler: () => void) {
  window.addEventListener(OPEN_EVENT, handler);
  return () => window.removeEventListener(OPEN_EVENT, handler);
}
