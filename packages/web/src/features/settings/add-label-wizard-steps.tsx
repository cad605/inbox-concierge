import { m } from "$paraglide/messages.js";
import { Input, Stack, Textarea } from "@chakra-ui/react";
import type { ComponentType, ReactNode, RefObject } from "react";

import {
  type ExampleSelection,
  isAddLabelNameValid,
} from "#features/settings/add-label-dialog-schema.ts";
import {
  AddLabelExamplesFields,
  type AddLabelExampleThreadRow,
} from "#features/settings/add-label-examples-fields.tsx";

/** Minimal field API used by step 0; matches `useAppForm` + `InputField` composition. */
export type AddLabelWizardTextField = {
  readonly InputField: ComponentType<{
    readonly label: ReactNode;
    readonly optionalText?: string;
    readonly children?: ReactNode;
  }>;
  readonly handleBlur: () => void;
  readonly handleChange: (value: string) => void;
  readonly state: { readonly value: string };
};

/** Minimal `useAppForm` subset for the add-label wizard. */
export type AddLabelWizardFormLike = {
  readonly AppField: ComponentType<{
    readonly name: "name" | "prompt";
    readonly children: (field: AddLabelWizardTextField) => ReactNode;
  }>;
};

export type AddLabelStepValidationCtx = {
  readonly name: string;
};

export type AddLabelWizardRenderContext = {
  readonly form: AddLabelWizardFormLike;
  readonly nameInputRef: RefObject<HTMLInputElement | null>;
  readonly exampleByThreadId: Readonly<Record<string, ExampleSelection>>;
  readonly threads: ReadonlyArray<AddLabelExampleThreadRow>;
  readonly threadsLoading: boolean;
  /** When false, examples list is not mounted (inactive step panels are `hidden` and break virtualization). */
  readonly examplesStepActive: boolean;
  readonly setThreadChecked: (
    thread: Pick<AddLabelExampleThreadRow, "id" | "lastMessageId">,
    checked: boolean,
  ) => void;
};

export type AddLabelWizardStep = {
  readonly title: ReactNode;
  readonly description: ReactNode;
  readonly validate: (ctx: AddLabelStepValidationCtx) => boolean;
  readonly render: () => ReactNode;
};

export function buildAddLabelWizardSteps(
  ctx: AddLabelWizardRenderContext,
): ReadonlyArray<AddLabelWizardStep> {
  const {
    form,
    nameInputRef,
    exampleByThreadId,
    threads,
    threadsLoading,
    examplesStepActive,
    setThreadChecked,
  } = ctx;

  return [
    {
      title: m.settings_auto_labels_wizard_step_details(),
      description: m.settings_auto_labels_wizard_step_details_list_description(),
      validate: ({ name }) => isAddLabelNameValid(name),
      render: () => (
        <Stack gap={4}>
          <form.AppField name="name">
            {(field) => (
              <field.InputField label={m.settings_auto_labels_name_label()}>
                <Input
                  ref={nameInputRef}
                  onBlur={field.handleBlur}
                  onChange={(e) => {
                    field.handleChange(e.target.value);
                  }}
                  value={field.state.value}
                />
              </field.InputField>
            )}
          </form.AppField>
          <form.AppField name="prompt">
            {(field) => (
              <field.InputField label={m.settings_auto_labels_prompt_label()} optionalText="">
                <Textarea
                  autoresize
                  maxH="40"
                  onBlur={field.handleBlur}
                  onChange={(e) => {
                    field.handleChange(e.target.value);
                  }}
                  rows={4}
                  value={field.state.value}
                />
              </field.InputField>
            )}
          </form.AppField>
        </Stack>
      ),
    },
    {
      title: m.settings_auto_labels_examples_title(),
      description: m.settings_auto_labels_wizard_step_examples_list_description(),
      validate: () => true,
      render: () =>
        examplesStepActive ? (
          <AddLabelExamplesFields
            exampleByThreadId={exampleByThreadId}
            setThreadChecked={setThreadChecked}
            threads={threads}
            threadsLoading={threadsLoading}
          />
        ) : null,
    },
  ];
}
