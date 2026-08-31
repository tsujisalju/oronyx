import { EnokiClient } from "@mysten/enoki";

export const enokiClient = new EnokiClient({
  apiKey: process.env.NEXT_PUBLIC_ENOKI_API_KEY!,
});
