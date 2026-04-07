import { type RefObject, useEffect } from "react";

type UseScrollRootLoadMoreOptions = {
  readonly scrollRef: RefObject<HTMLElement | null>;
  readonly sentinelRef: RefObject<HTMLElement | null>;
  readonly hasNextPage: boolean;
  readonly isFetchingNextPage: boolean;
  readonly fetchNextPage: () => void;
  /** Bumps when loaded row count changes so we re-check after a page append (IO often misses “still intersecting”). */
  readonly loadedCount: number;
};

/**
 * Infinite scroll for a scrollable root: load more when the sentinel is visible or when content
 * doesn’t fill the viewport (both require chaining after fetch — IntersectionObserver alone
 * does not re-fire if intersection state unchanged).
 */
export function useScrollRootLoadMore({
  scrollRef,
  sentinelRef,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  loadedCount,
}: UseScrollRootLoadMoreOptions): void {
  useEffect(() => {
    const root = scrollRef.current;
    if (root === null) {
      return;
    }

    const tryLoadMore = () => {
      if (!hasNextPage || isFetchingNextPage) {
        return;
      }

      const rootHeight = root.clientHeight;
      if (rootHeight <= 0) {
        return;
      }

      if (root.scrollHeight <= rootHeight + 1) {
        fetchNextPage();
        return;
      }

      const sentinel = sentinelRef.current;
      if (sentinel === null) {
        return;
      }

      const sr = sentinel.getBoundingClientRect();
      const rr = root.getBoundingClientRect();
      const intersects =
        sr.top < rr.bottom && sr.bottom > rr.top && sr.left < rr.right && sr.right > rr.left;

      if (intersects) {
        fetchNextPage();
      }
    };

    root.addEventListener("scroll", tryLoadMore, { passive: true });
    const resizeRoot = new ResizeObserver(() => {
      tryLoadMore();
    });
    resizeRoot.observe(root);

    queueMicrotask(tryLoadMore);

    return () => {
      root.removeEventListener("scroll", tryLoadMore);
      resizeRoot.disconnect();
    };
  }, [scrollRef, sentinelRef, hasNextPage, isFetchingNextPage, fetchNextPage, loadedCount]);
}
