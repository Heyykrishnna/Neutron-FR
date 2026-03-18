"use client";

import { Suspense } from "react";
import {
  CardSkeleton,
  TableSkeleton,
  ListSkeleton,
  FormSkeleton,
} from "./SuspenseBoundary";

/**
 * Wrapper for async data components
 * Automatically throws any errors from the hook, allowing Suspense to catch loading states
 *
 * Usage:
 * <AsyncDataBoundary
 *   data={competitions}
 *   loading={isLoading}
 *   fallback={<CardSkeleton count={3} />}
 * >
 *   <CompetitionList competitions={competitions} />
 * </AsyncDataBoundary>
 */
export function AsyncDataBoundary({
  data,
  loading,
  error,
  fallback = <CardSkeleton />,
  children,
}) {
  if (loading) {
    return fallback;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-900/20 border border-red-500/30 rounded text-red-300">
        <p className="font-semibold">Failed to load data</p>
        <p className="text-sm">{error.message || "Unknown error occurred"}</p>
      </div>
    );
  }

  return children;
}

/**
 * Suspense wrapper for page-level content
 * Shows granular loading UI for different sections instead of full-page loader
 *
 * Usage:
 * <PageSuspense>
 *   <SectionSuspense fallback={<CardSkeleton />}>
 *     <CompetitionSection />
 *   </SectionSuspense>
 *   <SectionSuspense fallback={<TableSkeleton />}>
 *     <RegistrationsSection />
 *   </SectionSuspense>
 * </PageSuspense>
 */
export function PageSuspense({ children }) {
  return <Suspense fallback={<CardSkeleton count={3} />}>{children}</Suspense>;
}

/**
 * Section-level Suspense with custom fallback
 */
export function SectionSuspense({ children, fallback = <CardSkeleton /> }) {
  return <Suspense fallback={fallback}>{children}</Suspense>;
}

/**
 * Prebuilt Suspense wrappers for common patterns
 */

export function TableSuspense({ children }) {
  return <Suspense fallback={<TableSkeleton />}>{children}</Suspense>;
}

export function ListSuspense({ children }) {
  return <Suspense fallback={<ListSkeleton />}>{children}</Suspense>;
}

export function FormSuspense({ children }) {
  return <Suspense fallback={<FormSkeleton />}>{children}</Suspense>;
}

export function CardSuspense({ children, count = 1, height = 120 }) {
  return (
    <Suspense fallback={<CardSkeleton count={count} height={height} />}>
      {children}
    </Suspense>
  );
}
