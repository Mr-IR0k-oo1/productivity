import { redirect } from "next/navigation";

type SearchParamValue = string | string[] | undefined;

type AuthRedirectPageProps = {
  searchParams?: Promise<{
    tab?: SearchParamValue;
    error?: SearchParamValue;
    notice?: SearchParamValue;
  }>;
};

function readFirst(value: SearchParamValue) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return typeof value === "string" ? value : null;
}

export default async function AuthRedirectPage({ searchParams }: AuthRedirectPageProps) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const tab = readFirst(resolvedParams?.tab);
  const error = readFirst(resolvedParams?.error);
  const notice = readFirst(resolvedParams?.notice);

  const target = tab === "register" && !error && !notice ? "/register" : "/login";
  const nextParams = new URLSearchParams();

  if (error) {
    nextParams.set("error", error);
  }

  if (notice) {
    nextParams.set("notice", notice);
  }

  redirect(nextParams.size > 0 ? `${target}?${nextParams.toString()}` : target);
}
