"use client";

import { useEffect, useState } from "react";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { HeroSlider } from "@/components/ui/HeroSlider";

interface Product {
  _id: string;
  name: string;
  pricing: {
    regularPrice: number;
    salePrice: number | null;
    discount: number;
  };
  images: {
    main: string;
    gallery: string[];
  };
  features: string[];
}

interface ApiResponse {
  success: boolean;
  data: Product[];
  message?: string;
}

export function HeroSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch("/api/products/featured", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch featured products");
        }

        const data: ApiResponse = await response.json();

        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setProducts(data.data);
        } else {
          setError(data.message || "No featured products available");
        }
      } catch (err) {
        console.error("Error fetching featured products:", err);
        setError("Failed to load featured products. Please refresh the page.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  // Loading State
  if (isLoading) {
    return <LoadingSkeleton variant="hero" />;
  }

  // Error State
  if (error || !products || products.length === 0) {
    return (
      <ErrorState
        message={error || "Failed to load featured products"}
        onRetry={() => window.location.reload()}
      />
    );
  }

  // Render slider with multiple featured products
  return <HeroSlider products={products} />;
}
