/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Card, Player, Property, PropertyGroup } from '../types';
import { CHANCE_CARDS, COMMUNITY_CARDS } from './cards';

/**
 * Pure helpers. All functions here take the relevant state in, return new state or values out,
 * and do not touch React or React state. This keeps Fork B (online multiplayer) easy: every
 * mutation can be replicated by re-running these on synced state.
 */

/** All property ids belonging to a color group. */
export function propertiesInGroup(properties: Property[], group: PropertyGroup): Property[] {
  return properties.filter((p) => p.group === group);
}

/** True iff `playerId` owns every property in `property.group`. */
export function ownsMonopoly(properties: Property[], property: Property, playerId: number): boolean {
  const group = propertiesInGroup(properties, property.group);
  return group.length > 0 && group.every((p) => p.owner === playerId);
}

/** Count of railroads / utilities owned by playerId. */
export function countOwned(properties: Property[], group: PropertyGroup, playerId: number): number {
  return properties.filter((p) => p.group === group && p.owner === playerId).length;
}

/**
 * Calculate rent owed when a player lands on a property.
 * Mortgaged properties charge no rent.
 *
 * - Color groups: rent[level], with base rent doubled if owner has a full monopoly
 *   and no houses are built.
 * - Railroads: rent[count-1] of railroads owned by the same player.
 * - Utilities: 4x dice total if 1 owned, 10x if both.
 */
export function calculateRent(
  property: Property,
  properties: Property[],
  diceTotal: number,
): number {
  if (property.owner === null || property.mortgaged) return 0;

  if (property.group === 'RAILROAD') {
    const count = countOwned(properties, 'RAILROAD', property.owner);
    return property.rent[count - 1] ?? 0;
  }

  if (property.group === 'UTILITY') {
    const count = countOwned(properties, 'UTILITY', property.owner);
    const multiplier = count >= 2 ? 10 : 4;
    return diceTotal * multiplier;
  }

  // Color property
  const base = property.rent[property.level] ?? 0;
  if (property.level === 0 && ownsMonopoly(properties, property, property.owner)) {
    return base * 2;
  }
  return base;
}

/**
 * Apply a move from `fromPos` to `toPos` (board indices 0..39).
 * Returns whether GO was passed (forward wrap).
 */
export function didPassGo(fromPos: number, toPos: number): boolean {
  return toPos < fromPos;
}

/** Roll two six-sided dice. */
export function rollDice(): [number, number] {
  return [Math.ceil(Math.random() * 6), Math.ceil(Math.random() * 6)];
}

/** Fisher-Yates shuffle (returns a new array). */
export function shuffleDeck<T>(cards: T[]): T[] {
  const next = [...cards];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

/** Freshly shuffled copies of both decks, for game start / reshuffle. */
export function freshDecks(): { CHANCE: Card[]; COMMUNITY: Card[] } {
  return { CHANCE: shuffleDeck(CHANCE_CARDS), COMMUNITY: shuffleDeck(COMMUNITY_CARDS) };
}

/**
 * Draw the top card of a deck without replacement.
 * Get-Out-Of-Jail cards leave the deck (held by the player) until used;
 * every other card goes to the bottom. An exhausted deck reshuffles.
 */
export function drawFromDeck(deck: Card[], type: 'CHANCE' | 'COMMUNITY'): { card: Card; deck: Card[] } {
  const source = deck.length > 0 ? deck : shuffleDeck(type === 'CHANCE' ? CHANCE_CARDS : COMMUNITY_CARDS);
  const [card, ...rest] = source;
  return { card, deck: card.getOutOfJail ? rest : [...rest, card] };
}

/**
 * Pre-compute the net asset value of a player (cash + property prices + half-value mortgageables).
 * Useful for end-of-game scoring or richer bankruptcy mechanics.
 */
export function playerNetWorth(player: Player, properties: Property[]): number {
  const propertyValue = properties
    .filter((p) => p.owner === player.id)
    .reduce((sum, p) => {
      if (p.mortgaged) return sum + p.price / 2;
      const houseValue = p.upgradeCost * p.level;
      return sum + p.price + houseValue;
    }, 0);
  return player.money + propertyValue;
}

/**
 * Even-building rule: a house can be added to `property` only if it has the lowest
 * level in its color group (after the new house, levels still differ by at most 1).
 * Also requires: full monopoly, no mortgaged props in group, not at hotel cap.
 */
export function canBuildHouse(properties: Property[], property: Property, ownerCash: number): boolean {
  if (property.group === 'RAILROAD' || property.group === 'UTILITY') return false;
  if (property.mortgaged || property.level >= 5) return false;
  const owner = property.owner;
  if (owner === null) return false;
  if (!ownsMonopoly(properties, property, owner)) return false;
  const group = propertiesInGroup(properties, property.group);
  if (group.some((p) => p.mortgaged)) return false;
  const minLevel = Math.min(...group.map((p) => p.level));
  if (property.level !== minLevel) return false;
  if (ownerCash < property.upgradeCost) return false;
  return true;
}

/**
 * Even-selling rule: mirror of canBuildHouse. Houses sell back for half their build cost.
 */
export function canSellHouse(properties: Property[], property: Property): boolean {
  if (property.group === 'RAILROAD' || property.group === 'UTILITY') return false;
  if (property.level <= 0) return false;
  const group = propertiesInGroup(properties, property.group);
  const maxLevel = Math.max(...group.map((p) => p.level));
  return property.level === maxLevel;
}

/** Half the house cost is refunded when selling a house (standard Monopoly). */
export function sellHousePrice(property: Property): number {
  return Math.floor(property.upgradeCost / 2);
}

/**
 * A property can be mortgaged only if no houses exist anywhere in its color group.
 * Mortgage value is half the purchase price (rounded down).
 */
export function canMortgage(properties: Property[], property: Property): boolean {
  if (property.mortgaged) return false;
  if (property.group !== 'RAILROAD' && property.group !== 'UTILITY') {
    const group = propertiesInGroup(properties, property.group);
    if (group.some((p) => p.level > 0)) return false;
  }
  return true;
}

export function mortgageValue(property: Property): number {
  return Math.floor(property.price / 2);
}

/** Unmortgage cost is mortgage value + 10% interest. */
export function unmortgageCost(property: Property): number {
  return Math.ceil(mortgageValue(property) * 1.1);
}

/**
 * Pretty label for a property group.
 */
export const GROUP_LABELS: Record<PropertyGroup, string> = {
  PURPLE: 'Purple',
  LIGHT_BLUE: 'Light Blue',
  PINK: 'Pink',
  ORANGE: 'Orange',
  RED: 'Red',
  YELLOW: 'Yellow',
  GREEN: 'Green',
  DARK_BLUE: 'Dark Blue',
  RAILROAD: 'Railroad',
  UTILITY: 'Utility',
};
