import { getPayload } from "payload";
import config from "@payload-config";

let cached: ReturnType<typeof getPayload> | null = null;

export function payload() {
  if (!cached) cached = getPayload({ config });
  return cached;
}
