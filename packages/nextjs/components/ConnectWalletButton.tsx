"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Button } from "@/components/ui/button";

/**
 * Simple standalone connect wallet button
 * Can be used in places where you need just the connect button without the full header
 */
export const ConnectWalletButton = () => {
  return (
    <ConnectButton.Custom>
      {({ openConnectModal, mounted }) => {
        return (
          <Button 
            onClick={openConnectModal}
            disabled={!mounted}
            className="font-mono"
          >
            CONNECT WALLET
          </Button>
        );
      }}
    </ConnectButton.Custom>
  );
};
