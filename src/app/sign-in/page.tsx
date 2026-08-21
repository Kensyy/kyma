"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { WaveMark } from "@/components/wave-mark";

const signInSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

type SignInValues = z.infer<typeof signInSchema>;

export default function SignInPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
  });

  async function onSubmit(values: SignInValues) {
    setIsSubmitting(true);
    const { error } = await signIn.email({
      email: values.email,
      password: values.password,
    });
    setIsSubmitting(false);

    if (error) {
      toast.error(error.message ?? "Could not sign in with those credentials.");
      return;
    }

    // "/" (not "/dashboard" directly) so the root route's role check can
    // send an End User to their ticket list instead.
    router.push("/");
    router.refresh();
  }

  // One click, no credentials to type or read from a README — the whole
  // point (Section 10) is that a recruiter lands here and can be inside the
  // app immediately. Every mutation this account attempts is rejected
  // server-side by requireWriteSession(), so nothing it does touches the
  // shared seed data other visitors see.
  async function handleDemo() {
    setIsDemoLoading(true);
    const { error } = await signIn.email({
      email: "demo@kyma.local",
      password: "kyma-demo-password",
    });
    setIsDemoLoading(false);

    if (error) {
      toast.error("Could not start the demo. Please try again.");
      return;
    }

    // "/" (not "/dashboard" directly) so the root route's role check can
    // send an End User to their ticket list instead.
    router.push("/");
    router.refresh();
  }

  return (
    <div className="bg-background flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center gap-3 text-center">
          <div className="flex items-center gap-2">
            <WaveMark className="text-primary" />
            <span className="font-heading text-lg font-bold tracking-tight">
              Kyma
            </span>
          </div>
          <div>
            <CardTitle className="text-xl">Sign in</CardTitle>
            <CardDescription>Internal IT operations platform</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={isDemoLoading}
              onClick={handleDemo}
            >
              {isDemoLoading ? "Loading demo…" : "View live demo"}
            </Button>
            <p className="text-muted-foreground text-center text-xs">
              No signup — one click into a read-only Admin view.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-border h-px flex-1" />
            <span className="text-muted-foreground text-xs">or sign in</span>
            <div className="bg-border h-px flex-1" />
          </div>

          <form
            className="flex flex-col gap-4"
            onSubmit={handleSubmit(onSubmit)}
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-destructive text-sm">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-destructive text-sm">
                  {errors.password.message}
                </p>
              )}
            </div>
            <Button type="submit" disabled={isSubmitting} className="mt-2">
              {isSubmitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
