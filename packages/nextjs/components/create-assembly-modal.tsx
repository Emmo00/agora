"use client";

import type React from "react";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useScaffoldWriteContract } from "@/hooks/scaffold-eth";
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
import { uploadToIPFS, uploadImageToIPFS } from "@/utils/ipfs";
import { notification } from "@/utils/scaffold-eth";

interface CreateAssemblyModalProps {
  onClose?: () => void;
  isOpen?: boolean;
}

export default function CreateAssemblyModal({ onClose, isOpen: isOpenProp }: CreateAssemblyModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(isOpenProp || false);

  useEffect(() => {
    if (isOpenProp !== undefined) {
      setIsOpen(isOpenProp);
    }
  }, [isOpenProp]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Write contract hook
  const { writeContractAsync: createAssembly, isMining: isCreating } = useScaffoldWriteContract({
    contractName: "AgoraFactory",
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      // 1. Upload image if provided
      let imageURI = "";
      if (imageFile) {
        const uploadImageToast = notification.loading("Uploading image...");
        imageURI = await uploadImageToIPFS(imageFile);
        notification.remove(uploadImageToast.toString());
        notification.success("Image uploaded successfully");
      }

      // 2. Create metadata object
      const metadata = {
        name,
        description,
        image: imageURI,
        created: new Date().toISOString(),
      };

      // 3. Upload metadata to IPFS
      const uploadMetadataToast = notification.loading("Uploading metadata...");
      const metadataURI = await uploadToIPFS(metadata);
      notification.remove(uploadMetadataToast.toString());
      notification.success("Metadata uploaded successfully");

      setIsUploading(false);

      // 4. Call createAssembly with proper args
      const createAssemblyToast = notification.loading("Creating assembly...");
      await createAssembly(
        {
          functionName: "createAssembly",
          args: [metadataURI],
        },
        {
          onBlockConfirmation: async (txnReceipt) => {
            notification.remove(createAssemblyToast.toString());

            // Parse AssemblyCreated event to get the assembly address
            // Event signature: AssemblyCreated(address indexed assembly, address indexed creator, string metadataURI, uint256 assemblyIndex)
            const assemblyCreatedEventTopic = "0xc64d9fe893a0f0c4bdfe0e26c5f80c21dd20e8bd29ab8e5ce01cba961fd7bfe8"; // AssemblyCreated event signature

            const assemblyCreatedLog = txnReceipt.logs.find(log => {
              try {
                return log.topics[0] === assemblyCreatedEventTopic;
              } catch {
                return false;
              }
            });

            if (assemblyCreatedLog && assemblyCreatedLog.topics[1]) {
              // Extract assembly address from the first indexed parameter
              const assemblyAddress = `0x${assemblyCreatedLog.topics[1].slice(-40)}`;

              notification.success("Assembly created successfully! 🎉");

              // Close modal and reset form
              setIsOpen(false);
              onClose?.();

              // Reset form
              setName("");
              setDescription("");
              setImageFile(null);
              setImagePreview("");

              // Navigate to the new assembly page
              router.push(`/assembly/${assemblyAddress}`);
            } else {
              notification.success("Assembly created successfully! 🎉");

              // Close modal and reset form
              setIsOpen(false);
              onClose?.();

              // Reset form
              setName("");
              setDescription("");
              setImageFile(null);
              setImagePreview("");

              // Fallback: just refresh the page
              router.refresh();
            }
          },
        }
      );
    } catch (error) {
      console.error("Error creating assembly:", error);
      setIsUploading(false);

      const errorMessage = error instanceof Error ? error.message : "Failed to create assembly";
      notification.error(`Error: ${errorMessage}`);
    }
  };

  const nameLength = name.length;
  const descriptionLength = description.length;
  const isValid = name.length > 0 && name.length <= 50 && description.length > 0 && description.length <= 500;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {/* <Button className="font-mono font-semibold">CREATE ASSEMBLY</Button> */}
      </DialogTrigger>
      <DialogContent className="max-w-2xl border border-border bg-background max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-mono text-xl">CREATE ASSEMBLY</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Deploy a new onchain community with governance capabilities
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pr-4">
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
              required
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
              required
            />
            <p className="text-xs text-muted-foreground font-mono">
              {descriptionLength}/500 characters {descriptionLength < 1 && "Required"}
            </p>
          </div>

          {/* Image Upload */}
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
              <p className="text-xs text-muted-foreground font-mono mt-2">Recommended: 500x500px or larger</p>
            </div>
          </div>

          {/* Preview */}
          {(name || imagePreview) && (
            <div className="border border-border p-4 bg-muted/30">
              <p className="text-xs text-muted-foreground font-mono mb-3">PREVIEW</p>
              <div className="border border-border p-3 bg-background">
                {imagePreview && (
                  <Image
                    src={imagePreview}
                    alt="preview"
                    width={500}
                    height={128}
                    className="w-full h-32 object-cover mb-3 border border-border"
                  />
                )}
                <h4 className="font-mono font-semibold mb-1">{name || "Assembly Name"}</h4>
                <p className="text-sm text-muted-foreground font-mono">{description || "Description will appear here"}</p>
              </div>
            </div>
          )}


          {/* Actions */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1 font-mono bg-transparent"
              onClick={() => setIsOpen(false)}
              disabled={isUploading || isCreating}
            >
              CANCEL
            </Button>
            <Button
              type="submit"
              className="flex-1 font-mono"
              disabled={!isValid || isUploading || isCreating}
            >
              {isUploading ? "UPLOADING..." : isCreating ? "CREATING..." : "CREATE ASSEMBLY"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
