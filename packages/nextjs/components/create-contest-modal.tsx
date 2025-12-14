"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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

const PRESET_DURATIONS = [
  { label: "1d", value: 24 },
  { label: "3d", value: 72 },
  { label: "7d", value: 168 },
  { label: "30d", value: 720 },
];

const MOCK_PASSPORTS = ["Member", "Contributor", "Core Team"];

interface CreateContestModalProps {
  onClose?: () => void;
  isAdmin?: boolean;
}

export default function CreateContestModal({ onClose, isAdmin = false }: CreateContestModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [durationHours, setDurationHours] = useState(24);
  const [durationDays, setDurationDays] = useState(1);
  const [votingMode, setVotingMode] = useState<"open" | "gated">("open");
  const [selectedPassports, setSelectedPassports] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddOption = () => {
    if (options.length < 10) {
      setOptions([...options, ""]);
    }
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleUpdateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleTogglePassport = (passport: string) => {
    setSelectedPassports(prev => (prev.includes(passport) ? prev.filter(p => p !== passport) : [...prev, passport]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate contract interaction
    await new Promise(resolve => setTimeout(resolve, 2000));

    setIsLoading(false);
    setIsOpen(false);
    onClose?.();
  };

  const validOptions = options.filter(o => o.trim().length > 0);
  const isValid =
    prompt.length >= 10 &&
    prompt.length <= 200 &&
    validOptions.length >= 2 &&
    validOptions.length <= 10 &&
    (votingMode === "open" || selectedPassports.length > 0);

  const totalHours = durationDays * 24 + durationHours;
  const endDate = new Date(Date.now() + totalHours * 60 * 60 * 1000);

  if (!isAdmin) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="font-mono font-semibold">+ CREATE CONTEST</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl border border-border bg-background max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-mono text-xl">CREATE CONTEST</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Create a new voting contest for your assembly
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Prompt */}
          <div className="space-y-2">
            <Label htmlFor="prompt" className="font-mono text-sm">
              PROMPT *
            </Label>
            <Input
              id="prompt"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="What question are you asking?"
              className="font-mono"
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground font-mono">{prompt.length}/200 characters</p>
          </div>

          {/* Options */}
          <div className="space-y-2">
            <Label className="font-mono text-sm">OPTIONS * (2-10)</Label>
            <div className="space-y-2">
              {options.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={option}
                    onChange={e => handleUpdateOption(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="font-mono text-sm"
                  />
                  {options.length > 2 && (
                    <Button
                      type="button"
                      variant="outline"
                      className="px-2 bg-transparent"
                      onClick={() => handleRemoveOption(index)}
                    >
                      ×
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              className="font-mono text-xs w-full bg-transparent"
              onClick={handleAddOption}
              disabled={options.length >= 10}
            >
              + ADD OPTION
            </Button>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label className="font-mono text-sm">VOTING DURATION *</Label>
            <div className="flex gap-2 mb-3">
              <div className="flex-1">
                <Input
                  type="number"
                  min="0"
                  max="365"
                  value={durationDays}
                  onChange={e => setDurationDays(Math.max(0, Number.parseInt(e.target.value) || 0))}
                  placeholder="Days"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground font-mono mt-1">Days</p>
              </div>
              <div className="flex-1">
                <Input
                  type="number"
                  min="0"
                  max="23"
                  value={durationHours}
                  onChange={e => setDurationHours(Math.min(23, Math.max(0, Number.parseInt(e.target.value) || 0)))}
                  placeholder="Hours"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground font-mono mt-1">Hours</p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap mb-3">
              {PRESET_DURATIONS.map(preset => (
                <Button
                  key={preset.value}
                  type="button"
                  variant="outline"
                  className="font-mono text-xs bg-transparent"
                  onClick={() => {
                    setDurationDays(Math.floor(preset.value / 24));
                    setDurationHours(preset.value % 24);
                  }}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground font-mono">Ends: {endDate.toLocaleString()}</p>
          </div>

          {/* Voting Mode */}
          <div className="space-y-3">
            <Label className="font-mono text-sm">WHO CAN VOTE?</Label>
            <div className="space-y-2">
              <div className="flex items-center gap-2 cursor-pointer p-2 border border-border rounded">
                <input
                  type="radio"
                  id="open"
                  name="voting-mode"
                  value="open"
                  checked={votingMode === "open"}
                  onChange={e => setVotingMode(e.target.value as "open" | "gated")}
                  className="cursor-pointer"
                />
                <Label htmlFor="open" className="cursor-pointer flex-1 font-mono text-sm mb-0">
                  Anyone (open voting)
                </Label>
              </div>
              <div className="flex items-center gap-2 cursor-pointer p-2 border border-border rounded">
                <input
                  type="radio"
                  id="gated"
                  name="voting-mode"
                  value="gated"
                  checked={votingMode === "gated"}
                  onChange={e => setVotingMode(e.target.value as "open" | "gated")}
                  className="cursor-pointer"
                />
                <Label htmlFor="gated" className="cursor-pointer flex-1 font-mono text-sm mb-0">
                  Passport holders only
                </Label>
              </div>
            </div>
          </div>

          {/* Passport Selection */}
          {votingMode === "gated" && (
            <div className="space-y-2">
              <Label className="font-mono text-sm">REQUIRED PASSPORTS</Label>
              <p className="text-xs text-muted-foreground font-mono mb-3">Voters need ANY of the selected passports</p>
              <div className="space-y-2">
                {MOCK_PASSPORTS.map(passport => (
                  <div key={passport} className="flex items-center gap-2 p-2 border border-border rounded">
                    <Checkbox
                      id={passport}
                      checked={selectedPassports.includes(passport)}
                      onCheckedChange={() => handleTogglePassport(passport)}
                    />
                    <Label htmlFor={passport} className="cursor-pointer flex-1 font-mono text-sm mb-0">
                      {passport}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview */}
          {prompt && (
            <div className="border border-border p-4 bg-muted/30">
              <p className="text-xs text-muted-foreground font-mono mb-3">PREVIEW</p>
              <div className="border border-border p-3 bg-background">
                <h4 className="font-mono font-semibold mb-2">{prompt}</h4>
                <div className="mb-3 space-y-1">
                  {validOptions.map((option, i) => (
                    <p key={i} className="text-sm font-mono">
                      • {option}
                    </p>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground font-mono">
                  Ends in {totalHours} hours{votingMode === "gated" && " · Passport required"}
                </p>
              </div>
            </div>
          )}

          {/* Gas Estimate */}
          <div className="border-t border-border pt-4">
            <p className="text-xs text-muted-foreground font-mono">GAS ESTIMATE: ~0.0015 ETH</p>
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
              {isLoading ? "CREATING..." : "CREATE CONTEST"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
