import { http, createConfig, injected } from "wagmi";
import { base, mainnet, sepolia } from "wagmi/chains";
import { metaMask, safe } from "wagmi/connectors";

export const config = createConfig({
  chains: [mainnet, base],
  connectors: [
    injected(),
    // wallet({ projectId }),
    metaMask(),
    safe(),
  ],
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
  },
});
