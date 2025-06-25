"use client";

export default function Home() {
  return (
    <div className="flex flex-col items-center pt-4 px-2 w-full relative">
      <h1 className="text-4xl font-bold mb-4 text-center">Welcome to StreamlineCorp</h1>
      <p className="text-lg text-zinc-600 dark:text-zinc-300 max-w-xl text-center">
        StreamlineCorp helps you manage your business operations efficiently and effortlessly. Get started by signing up or logging in to your dashboard.
      </p>
      <img
        src="/group-of-cute-kitty-cat-family-greeting-cartoon.png"
        alt="A group of cute kitty cats"
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-28 h-auto object-contain z-20 pointer-events-none select-none"
        style={{ maxWidth: '100vw' }}
      />
    </div>
  );
}
