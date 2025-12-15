/**
 * Event parsing and signature utilities for Agora contracts
 */

import { keccak256, toHex } from "viem";

export const EVENT_SIGNATURES = {
  AssemblyCreated: "AssemblyCreated(address,address,string,uint256)",
  ContestCreated: "ContestCreated(address,string,uint256)",
  PassportTypeCreated: "PassportTypeCreated(uint256,string,bool)",
  VoteCast: "VoteCast(address,uint256)",
} as const;

/**
 * Get event signature hash for a specific event
 */
export function getEventSignature(eventName: keyof typeof EVENT_SIGNATURES): `0x${string}` {
  const signature = EVENT_SIGNATURES[eventName];
  return keccak256(toHex(signature));
}

/**
 * Extract assembly address from AssemblyCreated event log
 * The assembly address is in the first indexed topic (topics[1])
 */
export function parseAssemblyCreatedEvent(log: any): string {
  if (!log.topics[1]) {
    throw new Error("Invalid AssemblyCreated event log");
  }
  // Remove the '0x' prefix and pad to 42 characters (0x + 40 hex chars)
  return `0x${log.topics[1].slice(26)}`;
}

/**
 * Extract contest address from ContestCreated event log
 */
export function parseContestCreatedEvent(log: any): string {
  if (!log.topics[1]) {
    throw new Error("Invalid ContestCreated event log");
  }
  return `0x${log.topics[1].slice(26)}`;
}

/**
 * Helper to decode event from transaction receipt
 */
export function findEventInReceipt(
  receipt: any,
  eventSignature: `0x${string}`
): any | null {
  return receipt.logs.find((log: any) => log.topics[0] === eventSignature) || null;
}
