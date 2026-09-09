import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchClient } from "@/components/search/search-client";
import { SkeletonCards, Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Encontrar empresas" };

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6" aria-hidden>
          <Skeleton className="h-10 w-full max-w-xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <SkeletonCards count={6} />
        </div>
      }
    >
      <SearchClient />
    </Suspense>
  );
}
