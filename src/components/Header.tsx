import { useState } from "react";
import { ExternalLink, Plus, ChevronDown, LogOut, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected, metaMask } from "wagmi/connectors";
import { HeaderProps } from "@/lib/types";

export default function Header({
  onCreateBounty,
  onViewBounties,
  onViewMyBounties,
}: HeaderProps) {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  // Format the address to display
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Handle wallet connection
  const handleConnect = () => {
    connect({ connector: metaMask() });
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <div
              className="text-2xl font-bold text-indigo-600 cursor-pointer flex items-center"
              onClick={onViewBounties}
            >
              ZuitzBounty
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {isConnected && (
              <Button
                variant="ghost"
                onClick={onViewMyBounties}
                className="flex items-center"
              >
                <List className="mr-2 h-4 w-4" />
                My Bounties
              </Button>
            )}

            <Button onClick={onCreateBounty} className="flex items-center">
              <Plus className="mr-2 h-4 w-4" />
              Create Bounty
            </Button>

            {isConnected && address ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center">
                    <span className="bg-indigo-100 size-6 rounded-full flex items-center justify-center mr-2 text-xs font-medium text-indigo-800">
                      {address.slice(2, 4)}
                    </span>
                    {formatAddress(address)}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => disconnect()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Disconnect
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="outline"
                className="flex items-center"
                onClick={handleConnect}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Connect Wallet
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
