import { useState } from "react";
import {
  ExternalLink,
  Plus,
  ChevronDown,
  LogOut,
  List,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected, metaMask } from "wagmi/connectors";
import { HeaderProps } from "@/lib/types";
import { ConnectKitButton } from "connectkit";

export default function Header({
  onCreateBounty,
  onViewBounties,
  onViewMyBounties,
}: HeaderProps) {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Format the address to display
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Handle wallet connection
  const handleConnect = () => {
    connect({ connector: metaMask() });
  };

  // Close mobile menu when an action is taken
  const handleMobileAction = (action: () => void) => {
    action();
    setMobileMenuOpen(false);
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <div
              className="text-xl sm:text-2xl font-bold text-indigo-600 cursor-pointer flex items-center"
              onClick={onViewBounties}
            >
              <span className="hidden xs:inline">ZuBounty</span>
              <span className="xs:hidden">ZuitzBounty</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
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

            <ConnectKitButton />
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden flex items-center space-x-2">
            {/* Create Bounty Button - Always visible on mobile */}
            <Button
              onClick={onCreateBounty}
              size="sm"
              className="flex items-center px-3"
            >
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Create</span>
            </Button>

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="p-2">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 p-2">
                <SheetHeader>
                  <SheetTitle className="text-left">Menu</SheetTitle>
                </SheetHeader>

                <div className="flex flex-col space-y-4 mt-6">
                  {/* Wallet Connection */}
                  <div className="pb-4 border-b">
                    <ConnectKitButton />
                  </div>

                  {/* Navigation Items */}
                  <Button
                    variant="ghost"
                    onClick={() => handleMobileAction(onViewBounties)}
                    className="justify-start h-12"
                  >
                    <List className="mr-3 h-5 w-5" />
                    All Bounties
                  </Button>

                  {isConnected && (
                    <Button
                      variant="ghost"
                      onClick={() => handleMobileAction(onViewMyBounties)}
                      className="justify-start h-12"
                    >
                      <List className="mr-3 h-5 w-5" />
                      My Bounties
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    onClick={() => handleMobileAction(onCreateBounty)}
                    className="justify-start h-12"
                  >
                    <Plus className="mr-3 h-5 w-5" />
                    Create Bounty
                  </Button>

                  {/* Additional Info */}
                  {isConnected && address && (
                    <div className="pt-4 border-t">
                      <div className="text-sm text-gray-600">
                        <p className="mb-1">Connected as:</p>
                        <p className="font-mono text-xs bg-gray-100 p-2 rounded">
                          {formatAddress(address)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Tablet Navigation (between mobile and desktop) */}
          <div className="hidden sm:flex md:hidden items-center space-x-2">
            {isConnected && (
              <Button
                variant="ghost"
                onClick={onViewMyBounties}
                size="sm"
                className="flex items-center"
              >
                <List className="mr-1 h-4 w-4" />
                <span className="hidden lg:inline">My Bounties</span>
                <span className="lg:hidden">My</span>
              </Button>
            )}

            <Button
              onClick={onCreateBounty}
              size="sm"
              className="flex items-center"
            >
              <Plus className="mr-1 h-4 w-4" />
              Create
            </Button>

            <div className="scale-90">
              <ConnectKitButton />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Bar Alternative (optional - uncomment if you prefer bottom navigation) */}
      {/* 
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
        <div className="grid grid-cols-3 gap-1 p-2">
          <Button
            variant="ghost"
            onClick={onViewBounties}
            className="flex flex-col items-center py-3 text-xs"
          >
            <List className="h-5 w-5 mb-1" />
            All
          </Button>
          
          {isConnected && (
            <Button
              variant="ghost"
              onClick={onViewMyBounties}
              className="flex flex-col items-center py-3 text-xs"
            >
              <List className="h-5 w-5 mb-1" />
              Mine
            </Button>
          )}
          
          <Button
            onClick={onCreateBounty}
            className="flex flex-col items-center py-3 text-xs"
          >
            <Plus className="h-5 w-5 mb-1" />
            Create
          </Button>
        </div>
      </div>
      */}
    </header>
  );
}
