/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PropertyGroup =
  | 'PURPLE'
  | 'DARK_BLUE'
  | 'GREEN'
  | 'RED'
  | 'ORANGE'
  | 'PINK'
  | 'YELLOW'
  | 'LIGHT_BLUE'
  | 'RAILROAD'
  | 'UTILITY';

export interface Property {
  id: number;
  name: string;
  price: number;
  /**
   * Rent ladder.
   * - Color properties: [base, 1 house, 2 houses, 3 houses, 4 houses, hotel].
   *   Base rent is doubled at runtime if the owner has the full color set with no houses.
   * - Railroads: [1 owned, 2 owned, 3 owned, 4 owned, 0, 0].
   * - Utilities: unused — rent is computed from dice total at runtime.
   */
  rent: number[];
  /** Cost per house/hotel upgrade. Standard Monopoly: scales by color group. */
  upgradeCost: number;
  group: PropertyGroup;
  owner: number | null;
  /** 0 = no houses, 1-4 = houses, 5 = hotel. */
  level: number;
  mortgaged: boolean;
  image?: string;
  description?: string;
}

export interface Tile {
  id: number;
  type:
    | 'PROPERTY'
    | 'CHANCE'
    | 'COMMUNITY'
    | 'TAX'
    | 'GO'
    | 'JAIL'
    | 'FREE_PARKING'
    | 'GO_TO_JAIL';
  name: string;
  propertyId?: number;
  /** Flat tax amount when type === 'TAX'. */
  taxAmount?: number;
}

export interface Player {
  id: number;
  name: string;
  token: string;
  money: number;
  position: number;
  inJail: boolean;
  jailTurns: number;
  getOutOfJailCards: number;
  bankrupt: boolean;
  color: string;
}

export interface Card {
  id: string;
  text: string;
  /** Positive = collect, negative = pay. */
  amount?: number;
  /** If set, move the player to this tile id. Pass-GO applies if moving forward. */
  moveId?: number;
  /** If true, send the player directly to jail (no pass-GO). */
  goToJail?: boolean;
  /** If true, grant a Get-Out-Of-Jail-Free card to the player. */
  getOutOfJail?: boolean;
  /** If set, every other (non-bankrupt) player pays this amount to the drawer. */
  collectFromEach?: number;
  /** If set, the drawer pays this amount to every other (non-bankrupt) player. */
  payEach?: number;
}

export interface Token {
  name: string;
  description: string;
}

/**
 * Turn-flow phase machine. Replaces the setTimeout-driven flow in the original App.tsx
 * so we don't read stale closure state inside async handlers.
 */
export type GamePhase =
  | 'idle' // waiting for the current player to roll (or make a jail decision)
  | 'rolling' // dice animating
  | 'moving' // post-roll movement (brief pause for legibility)
  | 'landed' // resolving tile effect
  | 'buying' // buy/pass modal open
  | 'cardDraw' // showing card reveal
  | 'debt' // player owes more than they have; liquidate or declare bankruptcy
  | 'turnEnd' // turn complete; tap to pass control
  | 'gameOver';

/** One payment obligation inside a debt. creditorId null = the bank. */
export interface DebtEntry {
  creditorId: number | null;
  amount: number;
}

/**
 * Outstanding debt for the current player. Payment happens all-at-once when the
 * debtor's cash covers the total; otherwise they liquidate via the Property
 * Manager or declare bankruptcy. `postMoveSteps` is set when the debt interrupted
 * a pending move (forced jail bail) that should resume after payment.
 */
export interface Debt {
  debtorId: number;
  entries: DebtEntry[];
  reason: string;
  postMoveSteps?: number;
}
