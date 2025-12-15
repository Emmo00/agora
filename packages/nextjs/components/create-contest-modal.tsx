"use client";

import { useState, useMemo } from "react";
import { useWriteContract, useReadContract } from "wagmi";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import deployedContracts from "@/contracts/deployedContracts";
import { notification } from "@/utils/scaffold-eth";

interface CreateContestModalProps {
  assemblyAddress: `0x${string}`;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateContestModal({
  assemblyAddress,
  isOpen,
  onClose,
  onSuccess,
}: CreateContestModalProps) {
  const [formData, setFormData] = useState({
    prompt: "",
    options: ["", ""],
    durationDays: 7,
    durationHours: 0,
    votingMode: "open" as "open" | "gated",
    requiredPassports: [] as number[],
  });

  const [isCreating, setIsCreating] = useState(false);

  // Get assembly's passports contract
  const { data: assemblyInfo } = useReadContract({
    address: assemblyAddress,
    abi: deployedContracts[31337]?.Assembly?.abi || [],
    functionName: "getInfo",
  });

  const passportsAddress = (assemblyInfo?.[0] as `0x${string}`) || null;

  // Get available passport types
  const { data: nextTokenId } = useReadContract({
    address: passportsAddress,
    abi: deployedContracts[31337]?.AssemblyPassports?.abi || [],
    functionName: "nextTokenId",
    query: { enabled: !!passportsAddress },
  });

  const passportTypeIds = useMemo(() => {
    if (!nextTokenId) return [];
    return Array.from({ length: Number(nextTokenId) - 1 }, (_, i) => i + 1);
  }, [nextTokenId]);

  // Calculate duration in seconds
  const durationInSeconds = useMemo(() => {
    return formData.durationDays * 24 * 60 * 60 + formData.durationHours * 60 * 60;
  }, [formData.durationDays, formData.durationHours]);

  // Validation
  const isValid = useMemo(() => {
    const promptValid = formData.prompt.length >= 10 && formData.prompt.length <= 200;
    const optionsValid = formData.options.length >= 2 && formData.options.every((opt) => opt.trim().length > 0);
    const durationValid = durationInSeconds >= 3600;
    const votingModeValid = formData.votingMode === "open" || formData.requiredPassports.length > 0;
    
    return promptValid && optionsValid && durationValid && votingModeValid;
  }, [formData, durationInSeconds]);

  // Create contest contract interaction
  const { writeContractAsync: createContest } = useWriteContract();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValid) {
      notification.error("Please fill in all required fields correctly");
      return;
    }

    setIsCreating(true);

    try {
      notification.loading("Creating contest...");

      const args = [
        formData.prompt,
        formData.options,
        BigInt(durationInSeconds),
        formData.votingMode === "gated"
          ? formData.requiredPassports.map((id) => BigInt(id))
          : [],
      ];

      await createContest({
        address: assemblyAddress,
        abi: deployedContracts[31337]?.Assembly?.abi || [],
        functionName: "createContest",
        args: args as any,
      });

      notification.success("Contest created successfully! 🎉");

      // Reset form
      setFormData({
        prompt: "",
        options: ["", ""],
        durationDays: 7,
        durationHours: 0,
        votingMode: "open",
        requiredPassports: [],
      });

      onClose();
      onSuccess?.();
    } catch (error) {
      console.error("Error creating contest:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create contest";
      notification.error(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const handleAddOption = () => {
    if (formData.options.length < 10) {
      setFormData({
        ...formData,
        options: [...formData.options, ""],
      });
    }
  };

  const handleRemoveOption = (index: number) => {
    if (formData.options.length > 2) {
      setFormData({
        ...formData,
        options: formData.options.filter((_, i) => i !== index),
      });
    }
  };

  const handleUpdateOption = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  const handleTogglePassport = (tokenId: number) => {
    setFormData({
      ...formData,
      requiredPassports: formData.requiredPassports.includes(tokenId)
        ? formData.requiredPassports.filter((id) => id !== tokenId)
        : [...formData.requiredPassports, tokenId],
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-mono">CREATE CONTEST</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Prompt */}
          <div>
            <Label htmlFor="prompt" className="font-mono text-sm">
              PROMPT * {formData.prompt.length < 10 && formData.prompt.length > 0 && <span className="text-red-500">(need {10 - formData.prompt.length} more chars)</span>}
            </Label>
            <input
              id="prompt"
              type="text"
              value={formData.prompt}
              onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
              placeholder="What question are you asking?"
              className={`w-full px-3 py-2 border rounded font-mono text-sm ${
                formData.prompt && formData.prompt.length < 10 
                  ? "border-red-500 bg-red-50 dark:bg-red-950"
                  : "border-border bg-background text-foreground"
              }`}
              minLength={10}
              maxLength={200}
              required
            />
            <p className="text-xs text-muted-foreground font-mono mt-2">
              {formData.prompt.length}/200 {formData.prompt.length >= 10 ? "✓" : ""}
            </p>
          </div>

          {/* Options */}
          <div>
            <Label className="font-mono text-sm mb-3 block">
              OPTIONS * {formData.options.filter(o => !o.trim()).length > 0 && <span className="text-red-500">({formData.options.filter(o => !o.trim()).length} empty)</span>}
            </Label>
            <div className="space-y-2">
              {formData.options.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleUpdateOption(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className={`flex-1 px-3 py-2 border rounded font-mono text-sm ${
                      option === "" 
                        ? "border-red-500 bg-red-50 dark:bg-red-950"
                        : "border-border bg-background text-foreground"
                    }`}
                    required
                  />
                  {formData.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(index)}
                      className="px-3 py-2 border border-border rounded hover:bg-muted"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
            {formData.options.length < 10 && (
              <button
                type="button"
                onClick={handleAddOption}
                className="mt-2 text-sm font-mono text-muted-foreground hover:text-foreground"
              >
                + ADD OPTION
              </button>
            )}
            <p className="text-xs text-muted-foreground font-mono mt-2">
              {formData.options.filter((o) => o).length}/{formData.options.length} options filled {formData.options.every(o => o.trim()) ? "✓" : ""}
            </p>
          </div>

          {/* Duration */}
          <div>
            <Label className="font-mono text-sm mb-3 block">VOTING DURATION *</Label>
            <div className="flex gap-2 mb-3">
              <div className="flex-1">
                <input
                  type="number"
                  value={formData.durationDays}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      durationDays: parseInt(e.target.value) || 0,
                    })
                  }
                  min={0}
                  className="w-full px-3 py-2 border border-border bg-background text-foreground font-mono text-sm rounded"
                />
                <p className="text-xs text-muted-foreground font-mono mt-1">Days</p>
              </div>
              <div className="flex-1">
                <input
                  type="number"
                  value={formData.durationHours}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      durationHours: parseInt(e.target.value) || 0,
                    })
                  }
                  min={0}
                  max={23}
                  className="w-full px-3 py-2 border border-border bg-background text-foreground font-mono text-sm rounded"
                />
                <p className="text-xs text-muted-foreground font-mono mt-1">Hours</p>
              </div>
            </div>

            {/* Duration presets */}
            <div className="flex gap-2 flex-wrap">
              {[
                { days: 1, hours: 0, label: "1d" },
                { days: 3, hours: 0, label: "3d" },
                { days: 7, hours: 0, label: "7d" },
                { days: 30, hours: 0, label: "30d" },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      durationDays: preset.days,
                      durationHours: preset.hours,
                    })
                  }
                  className="px-3 py-1 border border-border rounded text-sm font-mono hover:bg-muted"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <p className="text-xs text-muted-foreground font-mono mt-2">
              Ends: {new Date(Date.now() + durationInSeconds * 1000).toLocaleString()}
            </p>
          </div>

          {/* Voting Mode */}
          <div>
            <Label className="font-mono text-sm mb-3 block">WHO CAN VOTE?</Label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  value="open"
                  checked={formData.votingMode === "open"}
                  onChange={() =>
                    setFormData({
                      ...formData,
                      votingMode: "open",
                      requiredPassports: [],
                    })
                  }
                  className="w-4 h-4"
                />
                <span className="font-mono text-sm">Anyone (open voting)</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  value="gated"
                  checked={formData.votingMode === "gated"}
                  onChange={() => setFormData({ ...formData, votingMode: "gated" })}
                  className="w-4 h-4"
                />
                <span className="font-mono text-sm">Passport holders only</span>
              </label>
            </div>
          </div>

          {/* Passport Selection */}
          {formData.votingMode === "gated" && passportTypeIds.length > 0 && (
            <div>
              <Label className="font-mono text-sm mb-3 block">REQUIRED PASSPORTS</Label>
              <p className="text-xs text-muted-foreground font-mono mb-3">
                Voters need ANY of the selected passports
              </p>
              <div className="space-y-2">
                {passportTypeIds.map((id) => (
                  <label key={id} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.requiredPassports.includes(id)}
                      onChange={() => handleTogglePassport(id)}
                      className="w-4 h-4"
                    />
                    <span className="font-mono text-sm">Passport {id}</span>
                  </label>
                ))}
              </div>
              {formData.requiredPassports.length === 0 && (
                <p className="text-xs text-red-500 font-mono mt-2">
                  Select at least one passport
                </p>
              )}
            </div>
          )}

          {/* Preview */}
          <div className="border border-border rounded p-4 bg-muted/30">
            <h3 className="font-mono text-sm font-bold mb-3">PREVIEW</h3>
            <div className="space-y-2">
              <p className="font-mono text-sm">{formData.prompt || "Prompt text"}</p>
              <ul className="space-y-1">
                {formData.options
                  .filter((o) => o)
                  .map((opt, i) => (
                    <li key={i} className="font-mono text-sm text-muted-foreground">
                      • {opt}
                    </li>
                  ))}
              </ul>
              <p className="font-mono text-xs text-muted-foreground">
                Ends in {formData.durationDays}d {formData.durationHours}h
              </p>
              {formData.votingMode === "gated" && (
                <p className="font-mono text-xs text-muted-foreground">🔒 Passport required</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-border rounded font-mono text-sm hover:bg-muted"
            >
              CANCEL
            </button>
            <Button
              type="submit"
              disabled={!isValid || isCreating}
              className="font-mono text-sm"
            >
              {isCreating ? "CREATING..." : "CREATE CONTEST"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
