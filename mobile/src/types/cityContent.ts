// Public display fields only. Never render arbitrary API keys or private user data.
export type CityContentItem = {
  id: number;
  title?: string; name?: string | null;
  content?: string; description?: string | null; message?: string;
  imageUrl?: string | null; images?: {id:number;imageUrl:string}[];
  department?: {name:string} | null; category?: {name:string} | null;
  status?: string; type?: string; severity?: string; source?: string;
  address?: string | null; addressText?: string | null; locationName?: string | null;
  latitude?: string | number | null; longitude?: string | number | null;
  openingHours?: string | null; phone?: string | null; email?: string | null;
  website?: string | null; externalUrl?: string | null; sourceUrl?: string | null;
  createdAt?: string; publishedAt?: string | null; expiresAt?: string | null;
  startsAt?: string; endsAt?: string | null; lastSyncedAt?: string | null;
  availableSpaces?: number | null; totalSpaces?: number;
  accessibleSpaces?: number; evChargingSpaces?: number;
  hourlyPrice?: string | number | null; currency?: string | null;
  acceptedTypes?: {wasteType:string}[];
  upvoteCount?: number;
  statusHistory?: {id:number;newStatus:string;note:string|null;createdAt:string}[];
};
