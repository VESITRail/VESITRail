"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ComboboxOption {
  value: string;
  label: string;
  searchTerms?: string;
  data?: unknown;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  disabled?: boolean;
  renderOption?: (option: ComboboxOption) => React.ReactNode;
  showFullOptionInTrigger?: boolean;
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  emptyText = "No option found.",
  className,
  disabled = false,
  renderOption,
  showFullOptionInTrigger = true,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [triggerWidth, setTriggerWidth] = React.useState<number | undefined>(
    undefined
  );
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    const updateWidth = () => {
      if (triggerRef.current) {
        setTriggerWidth(triggerRef.current.offsetWidth);
      }
    };

    updateWidth();

    if (open) {
      updateWidth();
    }

    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, [open]);

  const selectedOption = options.find((option) => option.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between h-auto min-h-[2.5rem] px-3 py-2",
            className
          )}
          disabled={disabled}
        >
          <div className="flex-1 text-left">
            {selectedOption ? (
              showFullOptionInTrigger && renderOption ? (
                renderOption(selectedOption)
              ) : (
                selectedOption.label
              )
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="max-h-[300px] p-0 w-auto"
        align="start"
        side="bottom"
        style={{
          width: triggerWidth ? `${triggerWidth}px` : "100%",
          minWidth: triggerWidth ? `${triggerWidth}px` : "100%",
        }}
      >
        <Command className="w-full">
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup className="w-full">
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.searchTerms || option.label}
                  onSelect={() => {
                    onValueChange?.(option.value);
                    setOpen(false);
                  }}
                  className="w-full px-2 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 flex-shrink-0",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex-1 min-w-0 w-full">
                    {renderOption ? renderOption(option) : option.label}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
