/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  createdAt: string;
}

export interface Sticker {
  id: string; // generated as ownerId + "_" + code
  ownerId: string;
  ownerName: string;
  code: string; // e.g. "ARG-10"
  playerName: string;
  country: string;
  type: 'repetida' | 'faltante'; // repetida = duplicate to offer, faltante = wanted
  isShiny: boolean;
  quantity: number;
  updatedAt: string;
}

export interface FriendRequest {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

export interface TradeProposal {
  id: string;
  proposerId: string;
  proposerName: string;
  receiverId: string;
  receiverName: string;
  offeredStickers: string[]; // Codes e.g. ["ARG-10"]
  requestedStickers: string[]; // Codes e.g. ["BRA-09"]
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface TradeMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string;
}

export const COUNTRIES = [
  "Argelia",
  "Argentina",
  "Australia",
  "Austria",
  "Bélgica",
  "Bosnia y Herzegovina",
  "Brasil",
  "Canadá",
  "Cabo Verde",
  "Colombia",
  "República Democrática del Congo",
  "Croacia",
  "Curazao",
  "República Checa",
  "Ecuador",
  "Egipto",
  "Inglaterra",
  "Francia",
  "Alemania",
  "Ghana",
  "Haití",
  "Irán",
  "Irak",
  "Costa de Marfil",
  "Japón",
  "Jordania",
  "México",
  "Marruecos",
  "Países Bajos",
  "Nueva Zelanda",
  "Noruega",
  "Panamá",
  "Paraguay",
  "Portugal",
  "Catar",
  "Arabia Saudita",
  "Escocia",
  "Senegal",
  "Sudáfrica",
  "Corea del Sur",
  "España",
  "Suecia",
  "Suiza",
  "Túnez",
  "Turquía",
  "Estados Unidos",
  "Uruguay",
  "Uzbekistán"
];

// Map of country name to flag code (FlagCDN compatible)
export const COUNTRY_FLAG_MAP: Record<string, string> = {
  "Argelia": "dz",
  "Argentina": "ar",
  "Australia": "au",
  "Austria": "at",
  "Bélgica": "be",
  "Bosnia y Herzegovina": "ba",
  "Brasil": "br",
  "Canadá": "ca",
  "Cabo Verde": "cv",
  "Colombia": "co",
  "República Democrática del Congo": "cd",
  "Croacia": "hr",
  "Curazao": "cw",
  "República Checa": "cz",
  "Ecuador": "ec",
  "Egipto": "eg",
  "Inglaterra": "gb",
  "Francia": "fr",
  "Alemania": "de",
  "Ghana": "gh",
  "Haití": "ht",
  "Irán": "ir",
  "Irak": "iq",
  "Costa de Marfil": "ci",
  "Japón": "jp",
  "Jordania": "jo",
  "México": "mx",
  "Marruecos": "ma",
  "Países Bajos": "nl",
  "Nueva Zelanda": "nz",
  "Noruega": "no",
  "Panamá": "pa",
  "Paraguay": "py",
  "Portugal": "pt",
  "Catar": "qa",
  "Arabia Saudita": "sa",
  "Escocia": "gb",
  "Senegal": "sn",
  "Sudáfrica": "za",
  "Corea del Sur": "kr",
  "España": "es",
  "Suecia": "se",
  "Suiza": "ch",
  "Túnez": "tn",
  "Turquía": "tr",
  "Estados Unidos": "us",
  "Uruguay": "uy",
  "Uzbekistán": "uz"
};

// Map of country name to official 3-letter code
export const COUNTRY_CODE_MAP: Record<string, string> = {
  "Argelia": "ALG",
  "Argentina": "ARG",
  "Australia": "AUS",
  "Austria": "AUT",
  "Bélgica": "BEL",
  "Bosnia y Herzegovina": "BIH",
  "Brasil": "BRA",
  "Canadá": "CAN",
  "Cabo Verde": "CPV",
  "Colombia": "COL",
  "República Democrática del Congo": "COD",
  "Croacia": "CRO",
  "Curazao": "CUW",
  "República Checa": "CZE",
  "Ecuador": "ECU",
  "Egipto": "EGY",
  "Inglaterra": "ENG",
  "Francia": "FRA",
  "Alemania": "GER",
  "Ghana": "GHA",
  "Haití": "HAI",
  "Irán": "IRN",
  "Irak": "IRQ",
  "Costa de Marfil": "CIV",
  "Japón": "JPN",
  "Jordania": "JOR",
  "México": "MEX",
  "Marruecos": "MAR",
  "Países Bajos": "NED",
  "Nueva Zelanda": "NZL",
  "Noruega": "NOR",
  "Panamá": "PAN",
  "Paraguay": "PAR",
  "Portugal": "POR",
  "Catar": "QAT",
  "Arabia Saudita": "SAU",
  "Escocia": "SCO",
  "Senegal": "SEN",
  "Sudáfrica": "RSA",
  "Corea del Sur": "KOR",
  "España": "ESP",
  "Suecia": "SWE",
  "Suiza": "SUI",
  "Túnez": "TUN",
  "Turquía": "TUR",
  "Estados Unidos": "USA",
  "Uruguay": "URU",
  "Uzbekistán": "UZB"
};

export interface TeamChecklistConfig {
  name: string;
  code: string;
  flagCode: string;
  startNum: number;
  endNum: number;
  specificNumbers?: number[];
}

export const TEAMS_CONFIG: TeamChecklistConfig[] = COUNTRIES.map(country => ({
  name: country,
  code: COUNTRY_CODE_MAP[country] || country.substring(0, 3).toUpperCase(),
  flagCode: COUNTRY_FLAG_MAP[country] || "un",
  startNum: 1,
  endNum: 20
}));

export function isDefaultShiny(code: string): boolean {
  return false;
}

