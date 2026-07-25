/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Card } from '../types';

/**
 * Chance deck. ATL-flavored. Movement cards reference board-tile indices
 * (see BOARD_TILES in ./data.ts).
 */
export const CHANCE_CARDS: Card[] = [
  { id: 'c1', text: 'Take a shot! Pay $50 for emotional damage.', amount: -50 },
  { id: 'c2', text: 'Breakthrough on TikTok. Collect $150.', amount: 150 },
  { id: 'c3', text: 'Lick went wrong. Lose $200.', amount: -200 },
  { id: 'c4', text: 'Zone 6 appreciation. Advance to Zone 6.', moveId: 37 },
  { id: 'c5', text: 'Fresh Air Forces. Pay $90.', amount: -90 },
  { id: 'c6', text: 'Studio session paid off. Advance to GO.', moveId: 0 },
  { id: 'c7', text: 'You got pulled over on Bankhead. Go directly to jail.', goToJail: true },
  { id: 'c8', text: 'Get out of jail free — keep this card.', getOutOfJail: true },
  { id: 'c9', text: 'Hit the trap. Advance to Five Points.', moveId: 5 },
  { id: 'c10', text: 'Late for your flight. Advance to the Airport.', moveId: 15 },
  { id: 'c11', text: 'Lemon pepper wet special. Collect $75.', amount: 75 },
  { id: 'c12', text: 'Rim repair on the Box Chevy. Pay $100.', amount: -100 },
  { id: 'c13', text: 'Won the Magic City rookie of the year. Every player tips you $50.', collectFromEach: 50 },
  { id: 'c14', text: 'Buying the bar — round on you. Pay every player $25.', payEach: 25 },
  { id: 'c15', text: 'Settled a beef on Instagram Live. Collect $100.', amount: 100 },
  { id: 'c16', text: 'Speeding ticket on the Connector. Pay $75.', amount: -75 },
];

/**
 * Community Chest deck. Less hype, more streets-life paperwork.
 */
export const COMMUNITY_CARDS: Card[] = [
  { id: 'b1', text: 'Traded food stamps. Collect $100.', amount: 100 },
  { id: 'b2', text: 'Tax refund came through. Collect $200.', amount: 200 },
  { id: 'b3', text: 'Baby mama drama. Pay $150.', amount: -150 },
  { id: 'b4', text: "Uncle's scratch-off won. Collect $250.", amount: 250 },
  { id: 'b5', text: 'Doctor visit for the cousin. Pay $50.', amount: -50 },
  { id: 'b6', text: 'Birthday money from grandma. Collect $20.', amount: 20 },
  { id: 'b7', text: 'You inherit the auntie house. Collect $100.', amount: 100 },
  { id: 'b8', text: 'Cashapp glitch in your favor. Collect $45.', amount: 45 },
  { id: 'b9', text: 'Cookout potluck — everyone chips in. Collect $10 from each player.', collectFromEach: 10 },
  { id: 'b10', text: 'Cracked your phone. Pay $50.', amount: -50 },
  { id: 'b11', text: 'Hospital bill from the parking lot fight. Pay $100.', amount: -100 },
  { id: 'b12', text: 'Won the Edgewood block party raffle. Collect $100.', amount: 100 },
  { id: 'b13', text: 'Late fees on the impound. Pay $40.', amount: -40 },
  { id: 'b14', text: 'Advance to GO. Collect $200.', moveId: 0 },
  { id: 'b15', text: 'Get out of jail free — keep this card.', getOutOfJail: true },
  { id: 'b16', text: 'Caught with no license. Go to jail.', goToJail: true },
];
