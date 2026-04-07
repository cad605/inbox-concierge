import { CloseButton, Icon, Input, InputGroup, type InputProps } from "@chakra-ui/react";
import { useEffect, useRef } from "react";
import { LuSearch } from "react-icons/lu";

type Props = Omit<InputProps, "onChange"> & {
  onChange: (value: string | undefined) => void;
};

export function SearchInput({ onChange, defaultValue, ...props }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.value = (defaultValue as string) ?? "";
    }
  }, [defaultValue]);

  const endElement = inputRef.current?.value ? (
    <CloseButton
      colorPalette="gray"
      me="-2"
      onClick={() => {
        if (inputRef.current) {
          inputRef.current.value = "";
          inputRef.current.focus();
        }
        onChange(undefined);
      }}
      size="2xs"
      variant="plain"
    />
  ) : undefined;

  return (
    <InputGroup endElement={endElement} startElement={<Icon as={LuSearch} />}>
      <Input
        {...props}
        defaultValue={defaultValue}
        onChange={({ currentTarget: { value } }) => {
          onChange(value);
        }}
        ref={inputRef}
      />
    </InputGroup>
  );
}
