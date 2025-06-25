"use client";

import { useSession } from "@/lib/auth-client";

export default function Home() {
  const { data: session, isPending, error } = useSession();

  return (
    <div className="flex flex-col items-center p-8 mt-8">
      <h1 className="text-2xl font-bold mb-4">Session Debug</h1>
      <div className="bg-zinc-100 dark:bg-zinc-800 rounded p-4 w-full max-w-xl">
        <pre className="text-xs overflow-x-auto">
          {isPending
            ? "Loading..."
            : error
            ? `Error: ${error.message}`
            : JSON.stringify(session, null, 2)}
        </pre>
      </div>
    </div>
  );
}
