import { type NextRequest } from "next/server";

import { proxyUserAction } from "../_lib";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return proxyUserAction(request, context, "enable");
}
