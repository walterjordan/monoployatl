/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// --- Types ---

export type PropertyGroup = 'PURPLE' | 'DARK_BLUE' | 'GREEN' | 'RED' | 'ORANGE' | 'PINK' | 'YELLOW' | 'LIGHT_BLUE' | 'LIGHT_GREEN' | 'WHITE' | 'RAILROAD' | 'UTILITY' | 'SPECIAL';

export interface Property {
  id: number;
  name: string;
  price: number;
  rent: number[]; // Base, 1, 2, 3, 4, 5 (Hotel/Lotto)
  group: PropertyGroup;
  owner: number | null; // Player Index
  level: number; // 0 = Base, 1-5 = Upgrades
  image?: string;
  description?: string;
}

export interface Tile {
  id: number;
  type: 'PROPERTY' | 'CHANCE' | 'COMMUNITY' | 'TAX' | 'GO' | 'JAIL' | 'FREE_PARKING' | 'GO_TO_JAIL';
  name: string;
  propertyId?: number;
}

export interface Player {
  id: number;
  name: string;
  token: string; // This is the name of the token (e.g. "Box Chevy")
  money: number;
  position: number;
  inJail: boolean;
  jailTurns: number;
  color: string;
}

export interface Card {
  text: string;
  amount?: number;
  moveId?: number;
}

export interface Token {
  name: string;
  description: string;
}

// --- Game Data ---

export const PROPERTIES: Property[] = [
  // PURPLE
  { id: 0, name: "Ben Hill", price: 60, rent: [2, 10, 30, 90, 160, 250], group: 'PURPLE', owner: null, level: 0, description: "It's a start. Every empire starts somewhere. Usually here. Own both Purples for a 'Run the Block' bonus." },
  { id: 1, name: "Adamsville", price: 60, rent: [4, 20, 60, 180, 320, 450], group: 'PURPLE', owner: null, level: 0, image: "/adamsville.png", description: "The hustle continues. A solid investment, just don't ask what's sold out back." },
  // LIGHT BLUE
  { id: 2, name: "Campton Road", price: 100, rent: [6, 30, 90, 270, 400, 550], group: 'LIGHT_BLUE', owner: null, level: 0, image: "/campton_road.png", description: "Watch out for that pothole. Close enough to get where you're going, far enough to mind your business." },
  { id: 3, name: "Camp Creek", price: 100, rent: [6, 30, 90, 270, 400, 550], group: 'LIGHT_BLUE', owner: null, level: 0, image: "/camp_creek.png", description: "Every store you could ever want. Traffic is crazy, but at least you can get some new Js and a Cinnabon in the same trip." },
  { id: 4, name: "SWATS", price: 120, rent: [8, 40, 100, 300, 450, 600], group: 'LIGHT_BLUE', owner: null, level: 0, image: "/swats.png", description: "Southwest Atlanta, Too Strong. Home of legends. Respect is earned, not given." },
  // PINK
  { id: 5, name: "Edgewood", price: 140, rent: [10, 50, 150, 450, 625, 750], group: 'PINK', owner: null, level: 0, image: "/edgewood.png", description: "Bar hopping central. Good vibes, good music, and someone's always getting into a fight." },
  { id: 6, name: "Cabbagetown", price: 140, rent: [10, 50, 150, 450, 625, 750], group: 'PINK', owner: null, level: 0, image: "/cabbagetown.png", description: "Where the murals are brighter than your future. Used to be mills, now it's all art and expensive coffee." },
  { id: 7, name: "Old 4th Ward", price: 160, rent: [12, 60, 180, 500, 700, 900], group: 'PINK', owner: null, level: 0, image: "/old_4th_ward.png", description: "History on every corner. From MLK to the BeltLine, this place has seen it all." },
  // ORANGE
  { id: 8, name: "Mechanicsville", price: 180, rent: [14, 70, 200, 550, 750, 950], group: 'ORANGE', owner: null, level: 0, image: "/mechanicsville.png", description: "The OG suburbs. Rich history, even richer characters. You'll see a little bit of everything here." },
  { id: 9, name: "Pittsburgh", price: 180, rent: [14, 70, 200, 550, 750, 950], group: 'ORANGE', owner: null, level: 0, image: "/pittsburgh.png", description: "Not the one in Pennsylvania. Gritty, resilient, and on the come up. Don't sleep on Pittsburgh." },
  { id: 10, name: "Peoplestown", price: 200, rent: [16, 80, 220, 600, 800, 1000], group: 'ORANGE', owner: null, level: 0, image: "/peoplestown.png", description: "It's for the people. Home to the greats and not-so-greats. A true Atlanta mix." },
  // RED
  { id: 11, name: "Bankhead", price: 220, rent: [18, 90, 250, 700, 875, 1050], group: 'RED', owner: null, level: 0, image: "/bankhead.png", description: "You can get anything you want. From the flea market to the club, Bankhead's got it all. Just watch your back." },
  { id: 12, name: "Bowen Homes", price: 220, rent: [18, 90, 250, 700, 875, 1050], group: 'RED', owner: null, level: 0, image: "/bowen_homes.png", description: "Gone but not forgotten. A legendary name that still rings out. A tribute to the real ones." },
  { id: 13, name: "Simpson Road", price: 240, rent: [20, 100, 300, 750, 925, 1100], group: 'RED', owner: null, level: 0, image: "/simpson_road.png", description: "If you know, you know. This street has stories. Most of 'em you don't wanna hear." },
  // YELLOW
  { id: 14, name: "College Park", price: 260, rent: [22, 110, 330, 800, 975, 1150], group: 'YELLOW', owner: null, level: 0, image: "/college_park.png", description: "Home of the fly. If you're not from here, you probably flew over it. More than just an airport." },
  { id: 15, name: "Riverdale", price: 260, rent: [22, 110, 330, 800, 975, 1150], group: 'YELLOW', owner: null, level: 0, image: "/riverdale.png", description: "Southside's finest. Good food, better stories. A whole vibe." },
  { 
    id: 16, 
    name: "Forest Park", 
    price: 280, 
    rent: [24, 120, 360, 850, 1025, 1200], 
    group: 'YELLOW', 
    owner: null, 
    level: 0,
    // TIP: To use your own image, convert it to Base64 (data:image/jpeg;base64,...) and paste it here
    image: "/forest_park.png", 
    description: "Known for the State Farmers Market and its rich railroad history. A hidden gem with easy access to everything south of the perimeter."
  },
  // GREEN
  { id: 17, name: "EAV", price: 300, rent: [26, 130, 390, 900, 1100, 1275], group: 'GREEN', owner: null, level: 0, image: "/eav.png", description: "East Atlanta Village, stay weird. Tattoos, street art, and dive bars. What more do you need?" },
  { id: 18, name: "Gresham Road", price: 300, rent: [26, 130, 390, 900, 1100, 1275], group: 'GREEN', owner: null, level: 0, image: "/gresham_road.png", description: "Connects everything, belongs to nothing. You've driven down it a thousand times, but have you ever stopped?" },
  { id: 19, name: "Glenwood", price: 320, rent: [28, 150, 450, 1000, 1200, 1400], group: 'GREEN', owner: null, level: 0, image: "/glenwood.png", description: "The gateway to the east. From cookouts to car shows, there's always something happening on Glenwood." },
  // DARK BLUE
  { id: 20, name: "Zone 6", price: 350, rent: [35, 175, 500, 1100, 1300, 1500], group: 'DARK_BLUE', owner: null, level: 0, image: "/zone_6.png", description: "Rep your zone. It's not just a place, it's a mindset. Welcome to the eastside." },
  { id: 21, name: "Kirkwood", price: 400, rent: [50, 200, 600, 1400, 1700, 2000], group: 'DARK_BLUE', owner: null, level: 0, image: "/kirkwood.png", description: "The new hotness. From quiet streets to packed restaurants, Kirkwood is booming. Get in while you can." },
  // STATIONS
  { id: 22, name: "Five Points", price: 200, rent: [30, 75, 150, 250, 0, 0], group: 'RAILROAD', owner: null, level: 0, image: "/five_points.png", description: "The heart of the system. Everyone passes through here, whether they want to or not." },
  { id: 23, name: "Airport", price: 200, rent: [30, 75, 150, 250, 0, 0], group: 'RAILROAD', owner: null, level: 0, image: "/airport.png", description: "World's Busiest. You're either leaving or you're coming home. Either way, you're waiting in line." },
  { id: 24, name: "West End", price: 200, rent: [25, 50, 100, 200, 0, 0], group: 'RAILROAD', owner: null, level: 0, image: "/west_end.png", description: "Rich in culture, rich in soul. Historic and vibrant, the West End is the past and future of Atlanta." },
  { id: 25, name: "Lenox Station", price: 200, rent: [25, 50, 100, 200, 0, 0], group: 'RAILROAD', owner: null, level: 0, image: "/lenox_station.png", description: "High fashion, higher traffic. Where all the rappers and ballers come to shop. Don't forget where you parked." },
  // UTILITIES
  { id: 26, name: "GA Power", price: 150, rent: [0, 0, 0, 0, 0, 0], group: 'UTILITY', owner: null, level: 0, image: "/georgia_power.png", description: "Lights on... for now. If you roll doubles to land here, pay double rent (Surge Pricing). Pray you don't land here in July." },
  { id: 27, name: "Clayton Water", price: 150, rent: [0, 0, 0, 0, 0, 0], group: 'UTILITY', owner: null, level: 0, image: "/clayton_water.png", description: "It's wet. You need it, you pay for it. Simple as that." },
];

// Board Layout Indices (0-39)
export const BOARD_TILES: Tile[] = [
  { id: 0, type: 'GO', name: "GO" },
  { id: 1, type: 'PROPERTY', name: "Ben Hill", propertyId: 0 },
  { id: 2, type: 'COMMUNITY', name: "Community Chest" },
  { id: 3, type: 'PROPERTY', name: "Adamsville", propertyId: 1 },
  { id: 4, type: 'TAX', name: "Income Tax" },
  { id: 5, type: 'PROPERTY', name: "Five Points", propertyId: 22 },
  { id: 6, type: 'PROPERTY', name: "Campton Rd", propertyId: 2 },
  { id: 7, type: 'CHANCE', name: "Chance" },
  { id: 8, type: 'PROPERTY', name: "Camp Creek", propertyId: 3 },
  { id: 9, type: 'PROPERTY', name: "SWATS", propertyId: 4 },
  { id: 10, type: 'JAIL', name: "Fulton County Jail" },
  { id: 11, type: 'PROPERTY', name: "Edgewood", propertyId: 5 },
  { id: 12, type: 'PROPERTY', name: "Clayton Water", propertyId: 27 },
  { id: 13, type: 'PROPERTY', name: "Cabbagetown", propertyId: 6 },
  { id: 14, type: 'PROPERTY', name: "Old 4th Ward", propertyId: 7 },
  { id: 15, type: 'PROPERTY', name: "Airport", propertyId: 23 },
  { id: 16, type: 'PROPERTY', name: "Mechanicsville", propertyId: 8 },
  { id: 17, type: 'COMMUNITY', name: "Community Chest" },
  { id: 18, type: 'PROPERTY', name: "Pittsburgh", propertyId: 9 },
  { id: 19, type: 'PROPERTY', name: "Peoplestown", propertyId: 10 },
  { id: 20, type: 'FREE_PARKING', name: "Magic City Parking" },
  { id: 21, type: 'PROPERTY', name: "Bankhead", propertyId: 11 },
  { id: 22, type: 'CHANCE', name: "Chance" },
  { id: 23, type: 'PROPERTY', name: "Bowen Homes", propertyId: 12 },
  { id: 24, type: 'PROPERTY', name: "Simpson Rd", propertyId: 13 },
  { id: 25, type: 'PROPERTY', name: "West End", propertyId: 24 },
  { id: 26, type: 'PROPERTY', name: "College Park", propertyId: 14 },
  { id: 27, type: 'PROPERTY', name: "Riverdale", propertyId: 15 },
  { id: 28, type: 'PROPERTY', name: "GA Power", propertyId: 26 },
  { id: 29, type: 'PROPERTY', name: "Forest Park", propertyId: 16 },
  { id: 30, type: 'GO_TO_JAIL', name: "Go To Jail" },
  { id: 31, type: 'PROPERTY', name: "EAV", propertyId: 17 },
  { id: 32, type: 'PROPERTY', name: "Gresham Rd", propertyId: 18 },
  { id: 33, type: 'COMMUNITY', name: "Community Chest" },
  { id: 34, type: 'PROPERTY', name: "Glenwood", propertyId: 19 },
  { id: 35, type: 'PROPERTY', name: "Lenox Station", propertyId: 25 },
  { id: 36, type: 'CHANCE', name: "Chance" },
  { id: 37, type: 'PROPERTY', name: "Zone 6", propertyId: 20 },
  { id: 38, type: 'TAX', name: "Luxury Tax" },
  { id: 39, type: 'PROPERTY', name: "Kirkwood", propertyId: 21 },
];

export const TOKENS: Token[] = [
  { name: "Box Chevy", description: "Heavy metal. Slow but respectful." },
  { name: "Hashbrowns", description: "Scattered, smothered, covered." },
  { name: "Trap Phone", description: "Screen cracked. Money stacked." },
  { name: "Double Cup", description: "Lean with it. Rock with it." },
  { name: "Wing Basket", description: "10 piece lemon pepper wet." },
  { name: "Shopping Bag", description: "Lenox Mall parking lot warrior." },
  { name: "EBT Card", description: "Accepted everywhere... mostly." },
];

export const PLAYER_COLORS = [
    "bg-blue-500", "bg-red-500", "bg-green-500", "bg-yellow-500", "bg-purple-500", "bg-pink-500"
];

export const CHANCE_CARDS: Card[] = [
  { text: "Take a shot! Pay $50 for emotional damage.", amount: -50 },
  { text: "Breakthrough on TikTok! Collect $150.", amount: 150 },
  { text: "Lick went wrong. Lose $200.", amount: -200 },
  { text: "Zone 6 Appreciation. Move to Zone 6.", moveId: 37 },
  { text: "New Air Forces. Pay $90.", amount: -90 },
];

export const COMMUNITY_CARDS: Card[] = [
  { text: "Traded food stamps. Collect $100.", amount: 100 },
  { text: "Child Support Refund. Collect $200.", amount: 200 },
  { text: "Baby Mama Drama. Pay $150.", amount: -150 },
  { text: "Uncle's scratch-off won. Collect $250.", amount: 250 },
];
