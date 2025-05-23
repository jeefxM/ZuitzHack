import { http, createConfig, injected } from "wagmi";
import { base, baseSepolia, mainnet, sepolia } from "wagmi/chains";
import { metaMask, safe } from "wagmi/connectors";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";

export const config = createConfig(
  getDefaultConfig({
    // Your dApps chains
    chains: [baseSepolia, base],
    transports: {
      // Fixed: Use baseSepolia.id instead of mainnet.id for the sepolia transport
      [baseSepolia.id]: http(
        "https://base-sepolia.g.alchemy.com/v2/nATQQEB6XDgDWR5d5FsGKVXq6yxLmyJq"
      ),
      [base.id]: http(
        "https://base-mainnet.g.alchemy.com/v2/-Ni_mubLyV7sEw_-C0t2JLrbmanltv0f"
      ),
    },

    // Required API Keys
    walletConnectProjectId: "2ce7c15f2fc5e22427253f95cbc4d293",

    // Required App Info
    appName: "ZuBounty",

    // Optional App Info
    appDescription: "Bounties for Zuitzers",
    appUrl: "https://family.co", // your app's url
    appIcon: "https://family.co/logo.png", // your app's icon, no bigger than 1024x1024px (max. 1MB)
  })
);
