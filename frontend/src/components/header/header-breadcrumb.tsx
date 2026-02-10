"use client";

// import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { NAV_ROUTE_LABELS } from "@/lib/nav-config";

function formatSegmentLabel(segment: string) {
  return decodeURIComponent(segment).replace(/-/g, " ");
}

function getHeaderTitle(pathname: string) {
  if (!pathname) return "";
  if (pathname === "/") return "Tableau de Bord";

  const segments = pathname.split("/").filter(Boolean);
  const cumulativePaths = segments.map((_, index) =>
    segments.slice(0, index + 1).join("/")
  );

  const deepestMappedLabel = cumulativePaths.reduce<string>(
    (currentLabel, path) => NAV_ROUTE_LABELS[path] ?? currentLabel,
    ""
  );

  if (deepestMappedLabel) return deepestMappedLabel;

  const lastSegment = segments[segments.length - 1] ?? "";
  return NAV_ROUTE_LABELS[lastSegment] ?? formatSegmentLabel(lastSegment);
}

export function HeaderBreadcrumb({ pathname }: { pathname: string }) {
  const title = getHeaderTitle(pathname);

  if (pathname === "/") {
    return <h1 className="text-base font-medium">{title}</h1>;
  }

  return (
    <div className="flex flex-col gap-0.5">
      {/* <BreadcrumbNav pathname={pathname} /> */}
      <h1 className="text-base font-medium">{title}</h1>
    </div>
  );
}
