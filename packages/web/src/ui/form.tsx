import { Button, type ButtonProps, Field } from "@chakra-ui/react";
import { createFormHook, useStore } from "@tanstack/react-form";
import React, { type PropsWithChildren } from "react";

import { fieldContext, formContext, useFieldContext, useFormContext } from "#ui/form-provider.tsx";

export interface InputFieldProps extends Omit<Field.RootProps, "label"> {
  label?: React.ReactNode;
  helperText?: React.ReactNode;
  errorText?: React.ReactNode;
  optionalText?: React.ReactNode;
}

export const InputField = React.forwardRef<HTMLDivElement, InputFieldProps>(
  function InputField(props, ref) {
    const { label, children, helperText, errorText, optionalText, ...rest } = props;

    const field = useFieldContext<string>();

    const errors = useStore(field.store, (state) => state.meta.errors);

    const resolvedErrorText =
      errorText ??
      (errors && errors.length > 0
        ? errors
            .map((e) =>
              typeof e === "string"
                ? e
                : e != null && typeof e === "object" && "message" in e
                  ? String((e as { readonly message: unknown }).message)
                  : String(e),
            )
            .join(", ")
        : undefined);

    const invalid = Boolean(errors && errors.length > 0);

    return (
      <Field.Root invalid={invalid} ref={ref} {...rest}>
        {label && (
          <Field.Label>
            {label}
            <Field.RequiredIndicator fallback={optionalText} />
          </Field.Label>
        )}
        {children}
        {helperText && <Field.HelperText>{helperText}</Field.HelperText>}
        {resolvedErrorText != null && resolvedErrorText !== "" && (
          <Field.ErrorText>{resolvedErrorText}</Field.ErrorText>
        )}
      </Field.Root>
    );
  },
);

function SubmitButton({ children, ...props }: PropsWithChildren<ButtonProps>) {
  const form = useFormContext();

  return (
    <form.Subscribe selector={(state) => state}>
      {({ isSubmitting }) => (
        <Button disabled={isSubmitting} loading={isSubmitting} type="submit" {...props}>
          {children}
        </Button>
      )}
    </form.Subscribe>
  );
}

export const { useAppForm, withForm } = createFormHook({
  fieldComponents: {
    InputField,
  },
  fieldContext,
  formComponents: {
    SubmitButton,
  },
  formContext,
});
