import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Item } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatItemName(item: Partial<Item>) {
  let name = item.genericName;
  if (item.brandName) {
    name += ` (${item.brandName})`;
  }
  if (item.strengthValue) {
    name += ` ${item.strengthValue}${item.strengthUnit}`;
  }
  if (item.concentrationValue) {
    name += ` ${item.concentrationValue}${item.concentrationUnit}`;
  }
  if (item.formulation && !['Medical Supply', 'Consumable'].includes(item.formulation)) {
      name += ` ${item.formulation}`;
  }
  if (item.packageSizeValue) {
    name += ` (${item.packageSizeValue}${item.packageSizeUnit})`;
  }
  return name;
}
