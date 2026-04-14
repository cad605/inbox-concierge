import { m } from "$paraglide/messages.js";
import { Button, CloseButton, Dialog, HStack, Stack, Steps } from "@chakra-ui/react";
import { useStore } from "@tanstack/react-form";
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";

import { useSettings } from "#features/settings/context.tsx";
import type { AddLabelExampleThreadRow } from "#features/settings/ui/add-label-examples-fields.tsx";
import {
  buildAddLabelWizardSteps,
  type AddLabelWizardStep,
} from "#features/settings/ui/add-label-wizard-steps.tsx";
import {
  addLabelFormStandardSchema,
  MAX_LABEL_EXAMPLES_PER_LABEL,
  type ExampleSelection,
} from "#lib/add-label-dialog-schema.ts";
import { useAppForm } from "#ui/form.tsx";
import { toaster } from "#ui/toaster.tsx";

export type AddLabelDialogLoadedProps = {
  readonly onRequestClose: () => void;
  readonly nameInputRef: RefObject<HTMLInputElement | null>;
};

export function AddLabelDialogLoaded(props: AddLabelDialogLoadedProps) {
  const { createSettingsLabel, useSettingsThreadsForLabelWizard } = useSettings();
  const { onRequestClose, nameInputRef } = props;
  const [step, setStep] = useState(0);
  const [exampleByThreadId, setExampleByThreadId] = useState<Record<string, ExampleSelection>>({});
  const stepRef = useRef(step);
  stepRef.current = step;
  const addLabelWizardStepsRef = useRef<ReadonlyArray<AddLabelWizardStep>>([]);

  const { data: threads } = useSettingsThreadsForLabelWizard();

  useEffect(() => {
    const ids = new Set(threads.map((t) => t.id));
    setExampleByThreadId((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const id of Object.keys(next)) {
        if (!ids.has(id)) {
          delete next[id];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [threads]);

  const setThreadChecked = useCallback(
    (thread: Pick<AddLabelExampleThreadRow, "id" | "lastMessageId">, checked: boolean) => {
      const messageId = thread.lastMessageId;
      if (messageId === undefined || messageId === null || messageId.length === 0) {
        return;
      }
      setExampleByThreadId((prev) => {
        if (!checked) {
          const next = { ...prev };
          delete next[thread.id];
          return next;
        }
        if (
          prev[thread.id] === undefined &&
          Object.keys(prev).length >= MAX_LABEL_EXAMPLES_PER_LABEL
        ) {
          return prev;
        }
        return {
          ...prev,
          [thread.id]: { messageId },
        };
      });
    },
    [],
  );

  const form = useAppForm({
    defaultValues: {
      name: "",
      prompt: "",
    },
    validators: {
      onChange: addLabelFormStandardSchema,
    },
    onSubmit: async ({ value }) => {
      const steps = addLabelWizardStepsRef.current;
      if (stepRef.current === 0) {
        if (!steps[0]?.validate({ name: value.name })) {
          toaster.create({ title: m.settings_auto_labels_wizard_step_invalid(), type: "error" });
          return;
        }
        setStep(1);
        return;
      }

      const examples = Object.values(exampleByThreadId).map((ex) => ex.messageId);

      const promptTrimmed = value.prompt.trim();
      const result = await createSettingsLabel({
        name: value.name.trim(),
        prompt: promptTrimmed.length > 0 ? promptTrimmed : null,
        examples: examples.length > 0 ? examples : undefined,
      });

      if (!result.ok) {
        toaster.create({ title: result.message, type: "error" });
        return;
      }

      onRequestClose();
      form.reset();
      setStep(0);
      setExampleByThreadId({});
    },
  });

  const nameValue = useStore(form.store, (s) => s.values.name);

  const wizardSteps = useMemo(
    () =>
      buildAddLabelWizardSteps({
        form,
        nameInputRef,
        exampleByThreadId,
        threads,
        examplesStepActive: step === 1,
        setThreadChecked,
      }),
    [exampleByThreadId, form, nameInputRef, setThreadChecked, step, threads],
  );

  addLabelWizardStepsRef.current = wizardSteps;

  return (
    <>
      <Steps.Root
        count={wizardSteps.length}
        isStepValid={(index) => wizardSteps[index]?.validate({ name: nameValue }) ?? true}
        linear
        onStepChange={(details) => {
          setStep(details.step);
        }}
        onStepInvalid={() => {
          toaster.create({
            title: m.settings_auto_labels_wizard_step_invalid(),
            type: "error",
          });
        }}
        step={step}
      >
        <Dialog.Header>
          <Stack gap={3}>
            <Dialog.Title>{m.settings_auto_labels_dialog_title()}</Dialog.Title>
            <Steps.List gap={2}>
              {wizardSteps.map((wizardStep, index) => (
                <Steps.Item index={index} key={index}>
                  <Steps.Trigger>
                    <Steps.Indicator />
                    <Stack gap={0} align="flex-start">
                      <Steps.Title>{wizardStep.title}</Steps.Title>
                      <Steps.Description>{wizardStep.description}</Steps.Description>
                    </Stack>
                  </Steps.Trigger>
                  <Steps.Separator />
                </Steps.Item>
              ))}
            </Steps.List>
          </Stack>
        </Dialog.Header>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <Dialog.Body>
            {wizardSteps.map((wizardStep, index) => (
              <Steps.Content index={index} key={index}>
                {wizardStep.render()}
              </Steps.Content>
            ))}
          </Dialog.Body>
          <Dialog.Footer>
            <HStack flexWrap="wrap" gap={2} justify="flex-end" width="full">
              <Dialog.ActionTrigger asChild>
                <Button type="button" variant="outline">
                  {m.settings_auto_labels_dialog_cancel()}
                </Button>
              </Dialog.ActionTrigger>
              {step === 1 ? (
                <Steps.PrevTrigger asChild>
                  <Button type="button" variant="outline">
                    {m.settings_auto_labels_wizard_back()}
                  </Button>
                </Steps.PrevTrigger>
              ) : null}
              <form.AppForm>
                <form.Subscribe
                  selector={(state) => [state.canSubmit, state.isSubmitting] as const}
                >
                  {([canSubmit, isSubmitting]) =>
                    step === 0 ? (
                      <Steps.NextTrigger asChild>
                        <Button type="button">{m.settings_auto_labels_wizard_next()}</Button>
                      </Steps.NextTrigger>
                    ) : (
                      <Button
                        disabled={!canSubmit}
                        loading={isSubmitting}
                        onClick={() => {
                          form.handleSubmit();
                        }}
                        type="button"
                      >
                        {isSubmitting
                          ? m.settings_auto_labels_wizard_creating()
                          : m.settings_auto_labels_dialog_create()}
                      </Button>
                    )
                  }
                </form.Subscribe>
              </form.AppForm>
            </HStack>
          </Dialog.Footer>
        </form>
      </Steps.Root>
      <Dialog.CloseTrigger asChild>
        <CloseButton size="sm" />
      </Dialog.CloseTrigger>
    </>
  );
}
