import { EgressInfo } from "livekit-server-sdk";
import type { Bindings } from "../../lib/common/types";
import {
  isCompleteEgress,
  isFailedEgress,
} from "./egress-finalization.service";
import { getRoomEgressInfo } from "./livekit-egress.service";

const POLL_ATTEMPTS = 8;
const POLL_DELAY_MS = 1500;

const wait = async (delayMs: number) => {
  await new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });
};

export const pollEgressUntilFinal = async ({
  env,
  egressId,
  initialEgress,
}: {
  env: Bindings;
  egressId: string;
  initialEgress: EgressInfo;
}) => {
  if (isCompleteEgress(initialEgress) || isFailedEgress(initialEgress)) {
    return initialEgress;
  }

  for (let attempt = 1; attempt <= POLL_ATTEMPTS; attempt += 1) {
    await wait(POLL_DELAY_MS);

    const egress = await getRoomEgressInfo({ env, egressId });

    if (!egress) {
      continue;
    }

    if (isCompleteEgress(egress) || isFailedEgress(egress)) {
      return egress;
    }
  }

  return null;
};
