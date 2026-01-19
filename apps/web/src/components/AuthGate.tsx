"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

type AuthGateProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
};

export function AuthGate({ children, fallback, redirectTo }: AuthGateProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-6 h-6 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    if (redirectTo) {
      router.push(redirectTo);
      return null;
    }
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}

type AuthButtonProps = {
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
};

export function AuthButton({ onClick, className, children }: AuthButtonProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const handleClick = () => {
    if (isAuthenticated) {
      onClick();
    } else {
      router.push("/auth/signin");
    }
  };

  return (
    <button onClick={handleClick} className={className}>
      {children}
    </button>
  );
}
