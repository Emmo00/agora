"use client";

import { useState } from "react";
import Image from "next/image";
import { useWriteContract, useChainId } from "wagmi";
import { uploadToIPFS, uploadImageToIPFS } from "@/utils/ipfs";
import { notification } from "@/utils/scaffold-eth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import deployedContracts from "@/contracts/deployedContracts";

interface CreatePassportTypeModalProps {
  assemblyAddress: `0x${string}`;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreatePassportTypeModal({
  assemblyAddress,
  isOpen,
  onClose,
  onSuccess,
}: CreatePassportTypeModalProps) {
  const chainId = useChainId();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image: null as File | null,
    isOpen: true,
    allowlist: [""] as string[],
  });

  const [imagePreview, setImagePreview] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Get Assembly ABI from deployed contracts
  const assemblyABI =
    (deployedContracts as any)[chainId]?.Assembly?.abi || [];

  // Contract write hooks - using direct wagmi hook with specific assembly address
  const { writeContractAsync: createPassportType, isPending: isCreatingPassport } = useWriteContract();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, image: file });
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const addAllowlistAddress = () => {
    if (formData.allowlist.length < 50) {
      setFormData({
        ...formData,
        allowlist: [...formData.allowlist, ""],
      });
    }
  };

  const removeAllowlistAddress = (index: number) => {
    setFormData({
      ...formData,
      allowlist: formData.allowlist.filter((_, i) => i !== index),
    });
  };

  const updateAllowlistAddress = (index: number, value: string) => {
    const newAllowlist = [...formData.allowlist];
    newAllowlist[index] = value;
    setFormData({ ...formData, allowlist: newAllowlist });
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n").filter((line) => line.trim());

      // Skip header if present
      const addresses = lines
        .slice(lines[0].toLowerCase().includes("address") ? 1 : 0)
        .map((line) => line.trim())
        .filter((addr) => addr.startsWith("0x"));

      setFormData({
        ...formData,
        allowlist: addresses,
      });
    };
    reader.readAsText(file);
  };

  const validateAddresses = (addresses: string[]): string[] => {
    return addresses.filter((addr) => addr.match(/^0x[a-fA-F0-9]{40}$/));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValid) {
      notification.error("Please fill in all required fields correctly");
      return;
    }

    setIsUploading(true);

    try {
      // 1. Upload image if provided
      let imageURI = "";
      if (formData.image) {
        const uploadImageToastId = notification.loading("Uploading image...");
        imageURI = await uploadImageToIPFS(formData.image);
        notification.remove(uploadImageToastId);
      }

      // 2. Create metadata object
      const metadata = {
        name: formData.name,
        description: formData.description,
        image: imageURI,
        attributes: [
          { trait_type: "Type", value: formData.name },
          { trait_type: "Minting", value: formData.isOpen ? "Open" : "Allowlist" },
        ],
      };

      // 3. Upload metadata to IPFS
      const uploadMetadataToastId = notification.loading("Uploading metadata...");
      const metadataURI = await uploadToIPFS(metadata);
      notification.remove(uploadMetadataToastId);

      setIsUploading(false);

      // 4. Create passport type on the specific assembly instance
      const createPassportToastId = notification.loading("Creating passport type...");

      try {
        await createPassportType({
          address: assemblyAddress,
          abi: assemblyABI,
          functionName: "createPassportType",
          args: [formData.name, metadataURI, formData.isOpen],
        });

        notification.remove(createPassportToastId);
        notification.success("Passport type created successfully! 🎫");

        // Close modal and reset form
        onClose();
        setFormData({
          name: "",
          description: "",
          image: null,
          isOpen: true,
          allowlist: [""],
        });
        setImagePreview("");

        // Trigger refresh
        onSuccess?.();
      } catch (contractError) {
        notification.remove(createPassportToastId);
        throw contractError;
      }
    } catch (error) {
      console.error("Error creating passport type:", error);
      setIsUploading(false);

      const errorMessage = error instanceof Error ? error.message : "Failed to create passport type";
      notification.error(`Error: ${errorMessage}`);
    }
  }

  const validAllowlistAddresses = formData.allowlist.filter((addr) => addr.match(/^0x[a-fA-F0-9]{40}$/));
  const isValid =
    formData.name.trim().length > 0 &&
    formData.name.length <= 30 &&
    (!formData.isOpen ? validAllowlistAddresses.length > 0 : true);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl border border-border bg-background max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-mono text-xl">CREATE PASSPORT TYPE</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Create a new role or membership type for your assembly
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pr-4">
          {/* Passport Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="font-mono text-sm">
              PASSPORT NAME *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Member, Contributor, Core Team"
              className="font-mono"
              maxLength={30}
              required
            />
            <p className="text-xs text-muted-foreground font-mono">{formData.name.length}/30 characters</p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="font-mono text-sm">
              DESCRIPTION
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of this role"
              className="font-mono min-h-20"
              maxLength={200}
              rows={3}
            />
            <p className="text-xs text-muted-foreground font-mono">
              {formData.description.length}/200 characters
            </p>
          </div>

          {/* Image */}
          <div className="space-y-2">
            <Label htmlFor="image" className="font-mono text-sm">
              IMAGE
            </Label>
            <div className="border border-border rounded p-3 bg-muted/30">
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground font-mono mt-2">Recommended: 500x500px</p>
            </div>
            {imagePreview && (
              <Image src={imagePreview} alt="preview" width={500} height={128} className="w-full h-32 object-cover border border-border" />
            )}
          </div>

          {/* Minting Mode */}
          <div className="space-y-3">
            <Label className="font-mono text-sm">MINTING MODE *</Label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  checked={formData.isOpen}
                  onChange={() => setFormData({ ...formData, isOpen: true, allowlist: [""] })}
                  className="w-4 h-4"
                />
                <span className="font-mono text-sm">Open - Anyone can mint</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  checked={!formData.isOpen}
                  onChange={() => setFormData({ ...formData, isOpen: false })}
                  className="w-4 h-4"
                />
                <span className="font-mono text-sm">Allowlist - Only approved addresses</span>
              </label>
            </div>
          </div>

          {/* Allowlist */}
          {!formData.isOpen && (
            <div className="space-y-3 border border-border p-4 bg-muted/30 rounded">
              <Label className="font-mono text-sm">INITIAL ALLOWLIST</Label>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {formData.allowlist.map((address, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={address}
                      onChange={(e) => updateAllowlistAddress(index, e.target.value)}
                      placeholder="0x..."
                      className="font-mono text-xs flex-1"
                      pattern="^0x[a-fA-F0-9]{40}$"
                    />
                    {formData.allowlist.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        className="font-mono text-xs bg-transparent px-3"
                        onClick={() => removeAllowlistAddress(index)}
                      >
                        ✕
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {formData.allowlist.length < 50 && (
                <Button
                  type="button"
                  variant="outline"
                  className="font-mono text-xs w-full bg-transparent"
                  onClick={addAllowlistAddress}
                >
                  + ADD ADDRESS
                </Button>
              )}

              <div className="border-t border-border pt-3 mt-3">
                <Label htmlFor="csv" className="font-mono text-xs text-muted-foreground mb-2 block">
                  Or upload CSV
                </Label>
                <Input
                  id="csv"
                  type="file"
                  accept=".csv"
                  onChange={handleCSVUpload}
                  className="font-mono text-xs"
                />
              </div>

              <p className="text-xs text-muted-foreground font-mono">
                {validAllowlistAddresses.length} valid addresses
              </p>
            </div>
          )}

          {/* Preview */}
          <div className="border border-border p-4 bg-muted/30">
            <p className="text-xs text-muted-foreground font-mono mb-3">PREVIEW</p>
            <div className="border border-border p-3 bg-background">
              {imagePreview && (
                <Image
                  src={imagePreview}
                  alt="preview"
                  width={500}
                  height={96}
                  className="w-full h-24 object-cover mb-3 border border-border"
                />
              )}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🎫</span>
                <p className="font-mono font-bold">{formData.name || "Passport Name"}</p>
              </div>
              <p className="text-xs text-muted-foreground font-mono">
                {formData.isOpen ? "Open minting" : "Allowlist only"}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1 font-mono bg-transparent"
              onClick={onClose}
              disabled={isUploading || isCreatingPassport}
            >
              CANCEL
            </Button>
            <Button
              type="submit"
              className="flex-1 font-mono"
              disabled={!isValid || isUploading || isCreatingPassport}
            >
              {isUploading
                ? "UPLOADING..."
                : isCreatingPassport
                  ? "CREATING..."
                  : "CREATE PASSPORT TYPE"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
