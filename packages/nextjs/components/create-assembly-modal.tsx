"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface CreateAssemblyModalProps {
  onClose?: () => void;
  isOpen?: boolean;
}

export default function CreateAssemblyModal({ onClose, isOpen: isOpenProp }: CreateAssemblyModalProps) {
  const [isOpen, setIsOpen] = useState(isOpenProp || false);

  useEffect(() => {
    if (isOpenProp !== undefined) {
      setIsOpen(isOpenProp);
    }
  }, [isOpenProp]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUri, setImageUri] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate contract interaction
    await new Promise(resolve => setTimeout(resolve, 2000));

    setIsLoading(false);
    setIsOpen(false);
    onClose?.();
  };

  const nameLength = name.length;
  const descriptionLength = description.length;
  const isValid = name.length >= 1 && name.length <= 50 && description.length >= 1 && description.length <= 500;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="font-mono font-semibold">CREATE ASSEMBLY</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl border border-border bg-background">
        <DialogHeader>
          <DialogTitle className="font-mono text-xl">CREATE ASSEMBLY</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Deploy a new onchain community with governance capabilities
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Assembly Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="font-mono text-sm">
              ASSEMBLY NAME *
            </Label>
            <Input
              id="name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., Protocol Governance"
              className="font-mono"
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground font-mono">
              {nameLength}/50 characters {nameLength < 1 && "Required"}
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="font-mono text-sm">
              DESCRIPTION *
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe what this assembly is for..."
              className="font-mono min-h-24"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground font-mono">
              {descriptionLength}/500 characters {descriptionLength < 1 && "Required"}
            </p>
          </div>

          {/* Metadata */}
          <div className="space-y-2">
            <Label className="font-mono text-sm">METADATA</Label>
            <div className="border border-border rounded p-3 bg-muted/30">
              <p className="text-xs text-muted-foreground font-mono mb-3">Upload to IPFS or enter URI</p>
              <div className="flex gap-2">
                <Button variant="outline" className="font-mono text-xs flex-1 bg-transparent">
                  UPLOAD IMAGE
                </Button>
                <Input
                  value={imageUri}
                  onChange={e => setImageUri(e.target.value)}
                  placeholder="ipfs://... or https://..."
                  className="font-mono text-xs"
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          {name && (
            <div className="border border-border p-4 bg-muted/30">
              <p className="text-xs text-muted-foreground font-mono mb-3">PREVIEW</p>
              <div className="border border-border p-3 bg-background">
                {imageUri && (
                  <img src={imageUri || "/placeholder.svg"} alt="preview" className="w-full h-32 object-cover mb-3" />
                )}
                <h4 className="font-mono font-semibold mb-1">{name}</h4>
                <p className="text-sm text-muted-foreground font-mono">{description}</p>
              </div>
            </div>
          )}

          {/* Gas Estimate */}
          <div className="border-t border-border pt-4">
            <p className="text-xs text-muted-foreground font-mono">ESTIMATED GAS: ~0.002 ETH</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1 font-mono bg-transparent"
              onClick={() => setIsOpen(false)}
            >
              CANCEL
            </Button>
            <Button type="submit" className="flex-1 font-mono" disabled={!isValid || isLoading}>
              {isLoading ? "CREATING..." : "CREATE ASSEMBLY"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
