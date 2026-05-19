import { delay } from './serviceUtils';

export type UserRole = 'player' | 'admin';

export interface User {
  id: string;
  email: string;
  verified: boolean;
  role: UserRole;
  totalGems: number;
}

export interface UserDetails {
  id: string;
  characterName: string;
  bio: string;
  ownedSprites: number;
  wearingSprites: number;
  totalGems: number;
}

export interface UserFilter {
  query: string;
  verified: 'all' | 'verified' | 'unverified';
}

let users: User[] = [
  { id: 'u-101', email: 'emberlight@realm.io', verified: true, role: 'admin', totalGems: 4200 },
  { id: 'u-102', email: 'wyvern@realm.io', verified: true, role: 'player', totalGems: 980 },
  { id: 'u-103', email: 'stoneforge@realm.io', verified: false, role: 'player', totalGems: 120 },
  { id: 'u-104', email: 'aurora@realm.io', verified: true, role: 'player', totalGems: 1520 },
  { id: 'u-105', email: 'raven@realm.io', verified: true, role: 'player', totalGems: 3120 },
  { id: 'u-106', email: 'thorn@realm.io', verified: false, role: 'player', totalGems: 60 },
  { id: 'u-107', email: 'sable@realm.io', verified: true, role: 'player', totalGems: 740 },
  { id: 'u-108', email: 'crystal@realm.io', verified: true, role: 'player', totalGems: 2110 },
];

let userDetails: UserDetails[] = [
  {
    id: 'u-101',
    characterName: 'Aris the Emberborn',
    bio: 'Overseer of the capital market, guardian of the vaults.',
    ownedSprites: 64,
    wearingSprites: 5,
    totalGems: 4200,
  },
  {
    id: 'u-102',
    characterName: 'Wyvern Scout',
    bio: 'Swift traveler patrolling the northern rifts.',
    ownedSprites: 22,
    wearingSprites: 3,
    totalGems: 980,
  },
  {
    id: 'u-103',
    characterName: 'Stoneforge',
    bio: 'Craftsman forging relics in the deep caverns.',
    ownedSprites: 10,
    wearingSprites: 1,
    totalGems: 120,
  },
  {
    id: 'u-104',
    characterName: 'Aurora Acolyte',
    bio: 'Follower of the light realms with rare seasonal loot.',
    ownedSprites: 41,
    wearingSprites: 4,
    totalGems: 1520,
  },
  {
    id: 'u-105',
    characterName: 'Ravenblade',
    bio: 'Silent hunter of corrupted zones.',
    ownedSprites: 56,
    wearingSprites: 6,
    totalGems: 3120,
  },
  {
    id: 'u-106',
    characterName: 'Thorn Warden',
    bio: 'Protects the grove entrances.',
    ownedSprites: 7,
    wearingSprites: 1,
    totalGems: 60,
  },
  {
    id: 'u-107',
    characterName: 'Sable Oracle',
    bio: 'Diviner watching player economy trends.',
    ownedSprites: 18,
    wearingSprites: 2,
    totalGems: 740,
  },
  {
    id: 'u-108',
    characterName: 'Crystal Dawn',
    bio: 'World event captain and loot curator.',
    ownedSprites: 33,
    wearingSprites: 4,
    totalGems: 2110,
  },
];

export const getUsers = async (filter: UserFilter): Promise<User[]> => {
  await delay(300);
  const query = filter.query.trim().toLowerCase();

  return users.filter((user) => {
    const matchesQuery = query ? user.email.toLowerCase().includes(query) : true;
    const matchesVerified =
      filter.verified === 'all'
        ? true
        : filter.verified === 'verified'
        ? user.verified
        : !user.verified;
    return matchesQuery && matchesVerified;
  });
};

export const getUserDetails = async (userId: string): Promise<UserDetails> => {
  await delay(200);
  const detail = userDetails.find((entry) => entry.id === userId);
  if (!detail) {
    throw new Error('User not found');
  }
  return detail;
};

export const grantAdmin = async (userId: string): Promise<User> => {
  await delay(300);
  users = users.map((user) =>
    user.id === userId
      ? {
          ...user,
          role: 'admin',
        }
      : user,
  );
  const updated = users.find((user) => user.id === userId);
  if (!updated) {
    throw new Error('User not found');
  }
  return updated;
};

export const updateUserGems = async (userId: string, totalGems: number): Promise<User> => {
  await delay(300);
  users = users.map((user) =>
    user.id === userId
      ? {
          ...user,
          totalGems,
        }
      : user,
  );
  userDetails = userDetails.map((detail) =>
    detail.id === userId
      ? {
          ...detail,
          totalGems,
        }
      : detail,
  );
  const updated = users.find((user) => user.id === userId);
  if (!updated) {
    throw new Error('User not found');
  }
  return updated;
};
