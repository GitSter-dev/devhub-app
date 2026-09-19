import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";

import { TextField } from "./text-field";

type FormTextFieldProps<T extends FieldValues> = Omit<
  React.ComponentProps<typeof TextField>,
  "value" | "onChangeText" | "onBlur" | "error" | "ref"
> & {
  control: Control<T>;
  name: Path<T>;
};

export function FormTextField<T extends FieldValues>({ control, name, ...field }: FormTextFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { ref, value, onChange, onBlur }, fieldState }) => (
        <TextField
          {...field}
          ref={ref}
          value={(value as string | undefined) ?? ""}
          onChangeText={onChange}
          onBlur={onBlur}
          error={fieldState.error?.message}
        />
      )}
    />
  );
}
