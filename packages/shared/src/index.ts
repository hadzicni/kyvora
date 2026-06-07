import { z } from "zod";

export const serverNameSchema = z.string().min(2).max(120);
export const hostnameSchema = z.string().min(1).max(253);
export const ipAddressSchema = z.ipv4();
