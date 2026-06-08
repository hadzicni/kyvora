import { backendApiUnavailableResponse } from "../_lib/backend";

export {
  apiBaseUrl,
  backendFetch,
  createBackendResponse,
} from "../_lib/backend";

export function agentApiUnavailableResponse() {
  return backendApiUnavailableResponse(
    "Unable to connect to the agent management API."
  );
}
