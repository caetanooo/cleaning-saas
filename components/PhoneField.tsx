"use client";

import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import type { E164Number } from "libphonenumber-js";

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  id?: string;
}

export default function PhoneField({ value, onChange, placeholder, required, id }: Props) {
  return (
    <PhoneInput
      id={id}
      international
      defaultCountry="US"
      countries={["US", "BR"]}
      value={value as E164Number}
      onChange={(v) => onChange(v ?? "")}
      placeholder={placeholder}
      required={required}
      className="phone-field"
    />
  );
}
