import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <h1 className="text-2xl font-semibold">Not found</h1>
      <p className="mt-2 text-sm text-slate-500">That instrument, article or note doesn&apos;t exist. Instruments must be in the tracked universe — see Markets.</p>
      <Link href="/markets" className="mt-4 inline-block text-sm underline">Go to Markets →</Link>
    </div>
  );
}
