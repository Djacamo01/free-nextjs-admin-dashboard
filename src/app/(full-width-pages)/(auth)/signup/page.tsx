import SignUpForm from "@/components/auth/SignUpForm";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Next.js SignUp Page | TailAdmin - Next.js Dashboard Template",
  description: "This is Next.js SignUp Page TailAdmin Dashboard Template",
  // other metadata
};

export default function SignUp() {
  return (
    <Suspense fallback={null}>
      <SignUpForm />
    </Suspense>
  );
}
