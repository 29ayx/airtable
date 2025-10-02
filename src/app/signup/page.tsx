"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const router = useRouter();

  // Email validation regex
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValidEmail(email)) {
      router.push('/dashboard');
    }
  };

  // Handle Google login
  const handleGoogleLogin = () => {
    signIn('google', { callbackUrl: '/dashboard' });
  };
  return (
    <main
      className="flex min-h-screen items-center justify-center bg-white p-4"
      role="main"
    >
      <section className="w-full max-w-md bg-white" aria-labelledby="title">
        {/* Airtable Logo */}
        <div className="mb-8 flex items-center">
          <Image
            src="/airtable_logo.svg"
            alt="Airtable Logo"
            width={40}
            height={34}
          />
        </div>

        <h1
          id="title"
          className="mt-12 mb-12 text-start text-2xl font-medium text-gray-900"
        >
          Welcome to Airtable
        </h1>

        <form className="space-y-4" aria-label="Create your account" noValidate onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="work-email"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Work email
            </label>
            <input
              type="email"
              id="work-email"
              name="work-email"
              className="w-full rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="name@company.com"
              autoComplete="email"
              required
              aria-required="true"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={!isValidEmail(email)}
            className={`mt-2 w-full rounded-md px-4 py-[10.5px] text-sm font-medium ${
              isValidEmail(email)
                ? "cursor-pointer bg-[#166ee1] text-white hover:bg-[#1456c7]"
                : "bg-[#95baf0] text-white"
            }`}
          >
            Continue with email
          </button>

          <div className="relative my-4 text-center">
            <span className="font-regular bg-white px-2 text-xs text-gray-600">
              or
            </span>
          </div>

          <div className="space-y-4">
            <button
              type="button"
              className="flex w-full items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-normal text-black shadow-sm hover:shadow-md transition-shadow"
              aria-label="Continue with Single Sign On"
            >
              Continue with&nbsp;<b className="my-0.5">Single Sign On</b>
            </button>

             <button
               type="button"
               className="flex w-full items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-normal text-black shadow-sm hover:shadow-md transition-shadow"
               aria-label="Continue with Google"
               onClick={handleGoogleLogin}
             >
              <div className="my-0.5 mr-2 flex h-5 w-5 items-center justify-center bg-white">
                <Image
                  src="/assets/google-logo.svg"
                  alt="Google Logo"
                  width={20}
                  height={20}
                />
              </div>
              Continue with&nbsp;<b>Google</b>
            </button>

             <button
               type="button"
               className="flex w-full items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-normal text-black shadow-sm hover:shadow-md transition-shadow"
               aria-label="Continue with Apple"
             >
              <div className="my-0.5 mr-2 flex h-5 w-5 items-center justify-center">
                <Image
                  src="/assets/apple-logo.svg"
                  alt="Apple Logo"
                  width={15}
                  height={15}
                />
              </div>
              Continue with&nbsp;<b>Apple</b>
            </button>
          </div>

          <p className="pt-4 text-center text-xs leading-relaxed text-gray-500">
            By creating an account, you agree to the{" "}
            <a
              href="url://1"
              className="text-blue-600 underline hover:text-blue-800"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="url://2"
              className="text-blue-600 underline hover:text-blue-800"
            >
              Privacy Policy
            </a>
            .
          </p>

          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="marketing-consent"
              name="marketing-consent"
              className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label
              htmlFor="marketing-consent"
              className="text-xs leading-relaxed text-gray-500"
            >
              By checking this box, you agree to receive marketing and sales
              communications about Airtable products, services, and events. You
              understand that you can manage your preferences at any time by
              following the instructions in the communications received.
            </label>
          </div>

          <p className="text-left text-sm text-gray-500">
            Already have an account?{" "}
            <a
              href="url://3"
              className="text-blue-600 underline hover:text-blue-800"
            >
              Sign in
            </a>
          </p>
        </form>
      </section>
    </main>
  );
}
