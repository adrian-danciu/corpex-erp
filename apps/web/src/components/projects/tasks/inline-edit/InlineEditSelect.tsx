import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Option {
  value: string;
  label: string;
}

interface Props {
  value: string;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  onSave: (next: string) => Promise<void> | void;
}

export function InlineEditSelect({
  value,
  options,
  placeholder,
  disabled,
  onSave,
}: Props) {
  return (
    <Select
      value={value}
      onValueChange={(next) => {
        if (next === value) return;
        void onSave(next);
      }}
      disabled={disabled}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
