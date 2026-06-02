"use client";

import { useQuery } from "@tanstack/react-query";
import { getPublicMainPageConfig } from "@/lib/admin";

export default function AboutPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["mainPageConfig"],
    queryFn: getPublicMainPageConfig,
  });

  const imageUrl = data?.data?.aboutImageUrl ?? null;

  return (
    <section className="-mt-16 w-full h-screen relative bg-black">
      {isLoading ? null : imageUrl ? (
        <img
          src={imageUrl}
          alt="About PanTrKa"
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : null}
    </section>
  );
}
