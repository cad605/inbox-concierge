import { useLiveRef } from "@chakra-ui/react";
import {
  measureElement as defaultMeasureElement,
  useVirtualizer,
  type VirtualItem,
  type Virtualizer,
} from "@tanstack/react-virtual";
import type { ComponentProps } from "react";
import { useCallback, useEffect, useRef } from "react";

export type ListboxVisibleRange = {
  readonly startIndex: number;
  readonly endIndex: number;
};

export type ScrollToIndexDetails = {
  index: number;
  getElement?: () => HTMLElement | null;
  immediate?: boolean;
};

type UseListboxVirtualizerOptions = {
  readonly count: number;
  readonly estimateSize?: (index: number) => number;
  readonly overscan?: number;
  /** Fired when the virtualizer’s visible index range changes (scroll, resize, count). */
  readonly onRangeChange?: (range: ListboxVisibleRange) => void;
};

/**
 * Chakra listbox + TanStack Virtual pattern (see chakra-ui listbox-virtualized example):
 * scroll root ref, viewport height, absolutely positioned rows, scrollToIndexFn with useLiveRef.
 */
export function useListboxVirtualizer({
  count,
  estimateSize = () => 88,
  overscan = 8,
  onRangeChange,
}: UseListboxVirtualizerOptions) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onRangeChangeRef = useRef(onRangeChange);
  onRangeChangeRef.current = onRangeChange;

  const handleVirtualizerChange = useCallback((instance: Virtualizer<HTMLDivElement, Element>) => {
    const cb = onRangeChangeRef.current;
    if (cb === undefined) {
      return;
    }
    const range = instance.range;
    if (range === null) {
      return;
    }
    cb({ startIndex: range.startIndex, endIndex: range.endIndex });
  }, []);

  const virtualizer = useVirtualizer({
    count,
    estimateSize,
    getScrollElement: () => scrollRef.current,
    measureElement: defaultMeasureElement,
    overscan,
    onChange: handleVirtualizerChange,
  });

  const virtualizerRef = useLiveRef(virtualizer);

  const clearScrollTimeout = () => {
    if (scrollTimeoutRef.current !== null) {
      clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = null;
    }
  };

  const scrollToIndexFn = (details: ScrollToIndexDetails) => {
    clearScrollTimeout();

    const scrollToIndex = () => {
      const instance = virtualizerRef.current;
      const virtualItems = instance.getVirtualItems();
      const virtualItem = virtualItems.find((item) => item.index === details.index);

      if (virtualItem !== undefined) {
        const element = details.getElement?.();
        element?.scrollIntoView({ block: "nearest" });
        clearScrollTimeout();
        return;
      }

      instance.scrollToIndex(details.index);

      if (details.immediate !== true) {
        scrollTimeoutRef.current = setTimeout(scrollToIndex, 16);
      }
    };

    scrollToIndex();
  };

  useEffect(() => clearScrollTimeout, []);

  const totalSize = virtualizer.getTotalSize();
  const virtualItems = virtualizer.getVirtualItems();

  return {
    scrollRef,
    scrollToIndexFn,
    totalSize,
    virtualItems,
    virtualizer,
    getViewportProps(props: ComponentProps<"div"> = {}): ComponentProps<"div"> {
      return {
        ...props,
        style: {
          ...props.style,
          height: `${totalSize}px`,
          width: "100%",
          position: "relative",
        },
      };
    },
    getItemProps(
      props: ComponentProps<"div"> & { virtualItem: VirtualItem; ariaSetSize: number },
    ): ComponentProps<"div"> {
      const { virtualItem, ariaSetSize, ...rest } = props;
      return {
        ...rest,
        "aria-posinset": virtualItem.index + 1,
        "aria-setsize": ariaSetSize,
        style: {
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          ...rest.style,
          height: `${virtualItem.size}px`,
          transform: `translateY(${virtualItem.start}px)`,
        },
      };
    },
  };
}

export type ListboxVirtualizer = ReturnType<typeof useListboxVirtualizer>;

export type { VirtualItem };
